"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { logAudit } from "@/lib/audit/log";
import { Dec } from "@/lib/cap-table/decimal";
import { createClient } from "@/lib/supabase/server";
import { getActiveWorkspace } from "@/lib/workspace/active";
import type { Json } from "@/lib/supabase/types";

export interface ActionResult {
  ok: boolean;
  error?: string;
}

const InstrumentType = z.enum(["isafe", "safe", "convertible_note", "ordinary"]);

const DecimalStr = z
  .string()
  .min(1)
  .refine((s) => {
    try {
      const d = new Dec(s);
      return d.isFinite() && !d.isNaN();
    } catch {
      return false;
    }
  }, "must be a valid number");

const PositiveDecimal = DecimalStr.refine((s) => new Dec(s).gt(0), "must be > 0");
const Percentage = DecimalStr.refine((s) => {
  const d = new Dec(s);
  return d.gte(0) && d.lte(100);
}, "must be between 0 and 100");

const BaseSchema = z.object({
  investor_name: z.string().min(1).max(200),
  investor_email: z.string().email().optional().or(z.literal("")),
  firm: z.string().max(200).optional().or(z.literal("")),
  notes: z.string().max(4000).optional().or(z.literal("")),
});

const TermsSchemas = {
  isafe: z.object({
    investment_sar: PositiveDecimal,
    valuation_cap_sar: PositiveDecimal,
    profit_share_ratio: Percentage,
  }),
  safe: z.object({
    safe_type: z.enum(["post_money", "pre_money"]),
    investment_sar: PositiveDecimal,
    valuation_cap_sar: PositiveDecimal,
    discount_rate: Percentage.optional().or(z.literal("")),
  }),
  convertible_note: z.object({
    principal_sar: PositiveDecimal,
    interest_rate: Percentage,
    maturity_date: z.string().min(1),
    conversion_discount: Percentage.optional().or(z.literal("")),
    valuation_cap_sar: PositiveDecimal.optional().or(z.literal("")),
  }),
  ordinary: z.object({
    shares: PositiveDecimal,
    price_per_share_sar: PositiveDecimal,
  }),
} as const;

function parseTerms(
  formData: FormData,
  instrument: keyof typeof TermsSchemas,
): { data: Record<string, unknown> } | ActionResult {
  const issuesAsError = (issues: readonly { path: readonly PropertyKey[]; message: string }[]): ActionResult => ({
    ok: false,
    error: issues.map((i) => `${i.path.map(String).join(".")}: ${i.message}`).join("; "),
  });

  if (instrument === "isafe") {
    const r = TermsSchemas.isafe.safeParse({
      investment_sar: formData.get("investment_sar"),
      valuation_cap_sar: formData.get("valuation_cap_sar"),
      profit_share_ratio: formData.get("profit_share_ratio"),
    });
    if (!r.success) return issuesAsError(r.error.issues);
    return { data: r.data };
  }
  if (instrument === "safe") {
    const r = TermsSchemas.safe.safeParse({
      safe_type: formData.get("safe_type") ?? "post_money",
      investment_sar: formData.get("investment_sar"),
      valuation_cap_sar: formData.get("valuation_cap_sar"),
      discount_rate: formData.get("discount_rate") ?? "",
    });
    if (!r.success) return issuesAsError(r.error.issues);
    return { data: r.data };
  }
  if (instrument === "convertible_note") {
    const r = TermsSchemas.convertible_note.safeParse({
      principal_sar: formData.get("principal_sar"),
      interest_rate: formData.get("interest_rate"),
      maturity_date: formData.get("maturity_date"),
      conversion_discount: formData.get("conversion_discount") ?? "",
      valuation_cap_sar: formData.get("valuation_cap_sar") ?? "",
    });
    if (!r.success) return issuesAsError(r.error.issues);
    return { data: r.data };
  }
  // ordinary
  const r = TermsSchemas.ordinary.safeParse({
    shares: formData.get("shares"),
    price_per_share_sar: formData.get("price_per_share_sar"),
  });
  if (!r.success) return issuesAsError(r.error.issues);
  return { data: r.data };
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function createTermSheet(
  roundId: string,
  formData: FormData,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const workspace = await getActiveWorkspace();
  if (!workspace) return { ok: false, error: "No workspace." };

  const instrumentParsed = InstrumentType.safeParse(formData.get("instrument_type"));
  if (!instrumentParsed.success) {
    return { ok: false, error: "Invalid instrument type." };
  }
  const instrumentType = instrumentParsed.data;

  const base = BaseSchema.safeParse({
    investor_name: formData.get("investor_name"),
    investor_email: formData.get("investor_email") ?? "",
    firm: formData.get("firm") ?? "",
    notes: formData.get("notes") ?? "",
  });
  if (!base.success) {
    return { ok: false, error: base.error.issues.map((i) => i.message).join("; ") };
  }

  const terms = parseTerms(formData, instrumentType);
  if (!("data" in terms)) return terms;

  // Optional pipeline contact link (verified to belong to this workspace+round).
  const rawContact = String(formData.get("pipeline_contact_id") ?? "").trim();
  let pipelineContactId: string | null = null;
  if (rawContact && UUID_RE.test(rawContact)) {
    const { data: pc } = await supabase
      .from("investor_pipeline")
      .select("id")
      .eq("id", rawContact)
      .eq("round_id", roundId)
      .maybeSingle();
    if (pc) pipelineContactId = pc.id;
  }

  const { data: inserted, error } = await supabase
    .from("term_sheets")
    .insert({
      workspace_id: workspace.id,
      round_id: roundId,
      pipeline_contact_id: pipelineContactId,
      investor_name: base.data.investor_name,
      investor_email: base.data.investor_email || null,
      firm: base.data.firm || null,
      instrument_type: instrumentType,
      terms: terms.data as Json,
      notes: base.data.notes || null,
    })
    .select("id")
    .single();

  if (error || !inserted) return { ok: false, error: error?.message ?? "Insert failed." };

  await logAudit({
    workspaceId: workspace.id,
    entityType: "workspace",
    entityId: inserted.id,
    action: "term_sheet_create",
    description: `Drafted term sheet for "${base.data.investor_name}"`,
  });

  revalidatePath(`/rounds/${roundId}`);
  redirect(`/term-sheets/${inserted.id}`);
}

export async function updateTermSheet(
  termSheetId: string,
  formData: FormData,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const { data: existing } = await supabase
    .from("term_sheets")
    .select("instrument_type, round_id, workspace_id, version")
    .eq("id", termSheetId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!existing) return { ok: false, error: "Term sheet not found." };

  const base = BaseSchema.safeParse({
    investor_name: formData.get("investor_name"),
    investor_email: formData.get("investor_email") ?? "",
    firm: formData.get("firm") ?? "",
    notes: formData.get("notes") ?? "",
  });
  if (!base.success) {
    return { ok: false, error: base.error.issues.map((i) => i.message).join("; ") };
  }

  const terms = parseTerms(formData, existing.instrument_type);
  if (!("data" in terms)) return terms;

  const { error } = await supabase
    .from("term_sheets")
    .update({
      investor_name: base.data.investor_name,
      investor_email: base.data.investor_email || null,
      firm: base.data.firm || null,
      terms: terms.data as Json,
      notes: base.data.notes || null,
      version: existing.version + 1,
    })
    .eq("id", termSheetId);

  if (error) return { ok: false, error: error.message };

  await logAudit({
    workspaceId: existing.workspace_id,
    entityType: "workspace",
    entityId: termSheetId,
    action: "term_sheet_update",
    description: `Revised term sheet for "${base.data.investor_name}" (v${existing.version + 1})`,
  });

  revalidatePath(`/term-sheets/${termSheetId}`);
  revalidatePath(`/rounds/${existing.round_id}`);
  redirect(`/term-sheets/${termSheetId}`);
}

const StatusSchema = z.enum(["draft", "sent", "signed", "declined", "withdrawn"]);

export async function setTermSheetStatus(
  termSheetId: string,
  status: z.infer<typeof StatusSchema>,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const parsed = StatusSchema.safeParse(status);
  if (!parsed.success) return { ok: false, error: "Invalid status." };

  const { data: existing } = await supabase
    .from("term_sheets")
    .select("workspace_id, round_id, investor_name, status, pipeline_contact_id")
    .eq("id", termSheetId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!existing) return { ok: false, error: "Term sheet not found." };

  const now = new Date().toISOString();
  const update: {
    status: typeof parsed.data;
    sent_at?: string | null;
    signed_at?: string | null;
  } = { status: parsed.data };
  if (parsed.data === "sent") update.sent_at = now;
  if (parsed.data === "signed") update.signed_at = now;
  if (parsed.data === "draft" || parsed.data === "withdrawn") {
    update.sent_at = null;
    update.signed_at = null;
  }

  const { error } = await supabase
    .from("term_sheets")
    .update(update)
    .eq("id", termSheetId);
  if (error) return { ok: false, error: error.message };

  // When a term sheet is signed, bump the linked pipeline contact to term_sheet
  // (if it isn't already past that) so the CRM reflects reality.
  if (parsed.data === "signed" && existing.pipeline_contact_id) {
    await supabase
      .from("investor_pipeline")
      .update({ status: "term_sheet" })
      .eq("id", existing.pipeline_contact_id)
      .in("status", ["prospect", "contacted", "in_discussion"]);
  }

  await logAudit({
    workspaceId: existing.workspace_id,
    entityType: "workspace",
    entityId: termSheetId,
    action: "term_sheet_status",
    description: `Term sheet for "${existing.investor_name}": ${existing.status} → ${parsed.data}`,
  });

  revalidatePath(`/term-sheets/${termSheetId}`);
  revalidatePath(`/rounds/${existing.round_id}`);
  return { ok: true };
}

export async function promoteTermSheetToShareholder(
  termSheetId: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const { data: ts } = await supabase
    .from("term_sheets")
    .select("*")
    .eq("id", termSheetId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!ts) return { ok: false, error: "Term sheet not found." };
  if (ts.status !== "signed") return { ok: false, error: "Only signed term sheets can be promoted." };

  const workspace = await getActiveWorkspace();
  if (!workspace || workspace.id !== ts.workspace_id) return { ok: false, error: "Workspace mismatch." };

  const terms = (ts.terms ?? {}) as Record<string, unknown>;

  // Build instrument_data matching the shareholders JSONB shape.
  let instrumentData: Record<string, unknown>;
  if (ts.instrument_type === "isafe") {
    instrumentData = {
      investment_sar: String(terms.investment_sar ?? "0"),
      valuation_cap_sar: String(terms.valuation_cap_sar ?? "0"),
      profit_share_ratio: String(terms.profit_share_ratio ?? "0"),
      conversion_status: "unconverted",
    };
  } else if (ts.instrument_type === "safe") {
    instrumentData = {
      safe_type: terms.safe_type ?? "post_money",
      investment_sar: String(terms.investment_sar ?? "0"),
      valuation_cap_sar: String(terms.valuation_cap_sar ?? "0"),
      ...(terms.discount_rate ? { discount_rate: String(terms.discount_rate) } : {}),
    };
  } else if (ts.instrument_type === "convertible_note") {
    instrumentData = {
      principal_sar: String(terms.principal_sar ?? "0"),
      interest_rate: String(terms.interest_rate ?? "0"),
      maturity_date: String(terms.maturity_date ?? ""),
      ...(terms.conversion_discount ? { conversion_discount: String(terms.conversion_discount) } : {}),
      ...(terms.valuation_cap_sar ? { valuation_cap_sar: String(terms.valuation_cap_sar) } : {}),
    };
  } else {
    instrumentData = {
      shares: String(terms.shares ?? "0"),
      price_per_share_sar: String(terms.price_per_share_sar ?? "0"),
    };
  }

  const { data: inserted, error } = await supabase
    .from("shareholders")
    .insert({
      workspace_id: workspace.id,
      name: ts.firm ? `${ts.investor_name} (${ts.firm})` : ts.investor_name,
      email: ts.investor_email ?? null,
      entity_or_individual: ts.firm ? "entity" : "individual",
      entry_date: new Date().toISOString().slice(0, 10),
      instrument_type: ts.instrument_type as "ordinary" | "isafe" | "safe" | "convertible_note",
      instrument_data: instrumentData as Json,
    })
    .select("id")
    .single();

  if (error || !inserted) return { ok: false, error: error?.message ?? "Insert failed." };

  if (ts.pipeline_contact_id) {
    await supabase
      .from("investor_pipeline")
      .update({ status: "invested" })
      .eq("id", ts.pipeline_contact_id);
  }

  await logAudit({
    workspaceId: workspace.id,
    entityType: "workspace",
    entityId: inserted.id,
    action: "shareholder_create",
    description: `Promoted signed term sheet for "${ts.investor_name}" to cap table`,
  });

  revalidatePath(`/term-sheets/${termSheetId}`);
  revalidatePath("/cap-table");
  revalidatePath(`/rounds/${ts.round_id}`);
  redirect("/cap-table");
}

export async function deleteTermSheet(termSheetId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const { data: existing } = await supabase
    .from("term_sheets")
    .select("workspace_id, round_id, investor_name")
    .eq("id", termSheetId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!existing) return { ok: false, error: "Term sheet not found." };

  const { error } = await supabase
    .from("term_sheets")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", termSheetId);
  if (error) return { ok: false, error: error.message };

  await logAudit({
    workspaceId: existing.workspace_id,
    entityType: "workspace",
    entityId: termSheetId,
    action: "term_sheet_delete",
    description: `Deleted term sheet for "${existing.investor_name}"`,
  });

  revalidatePath(`/rounds/${existing.round_id}`);
  redirect(`/rounds/${existing.round_id}`);
}
