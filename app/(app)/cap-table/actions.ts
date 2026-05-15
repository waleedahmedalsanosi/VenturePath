"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { logAudit } from "@/lib/audit/log";
import { Dec } from "@/lib/cap-table/decimal";
import { createClient } from "@/lib/supabase/server";
import { getActiveWorkspace } from "@/lib/workspace/active";
import type { Json } from "@/lib/supabase/types";

const INSTRUMENT_LABELS: Record<string, string> = {
  ordinary: "Ordinary Share",
  isafe: "iSAFE",
  safe: "SAFE",
  convertible_note: "Convertible Note",
};

const DecimalString = z
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

const PositiveDecimal = DecimalString.refine((s) => new Dec(s).gt(0), "must be > 0");

const Percentage = DecimalString.refine((s) => {
  const d = new Dec(s);
  return d.gte(0) && d.lte(100);
}, "must be between 0 and 100");

const OrdinaryDataSchema = z.object({
  shares: PositiveDecimal,
  price_per_share_sar: PositiveDecimal,
  // Service-for-Equity flag (PRD US-04-06). When true, `service_note` records
  // what was exchanged (development, advisory, capital-equivalent, etc.).
  service_for_equity: z.coerce.boolean().default(false),
  service_note: z.string().max(200).optional().or(z.literal("")),
});

const ISafeDataSchema = z.object({
  investment_sar: PositiveDecimal,
  valuation_cap_sar: PositiveDecimal,
  profit_share_ratio: Percentage,
  conversion_status: z.enum(["unconverted", "converted"]).default("unconverted"),
});

// PRD US-04-03 SAFE: post-money vs pre-money, val cap, discount rate (0-100),
// conversion status. Interest is NOT a SAFE concept (that's Convertible Note).
const SafeDataSchema = z.object({
  safe_type: z.enum(["post_money", "pre_money"]),
  investment_sar: PositiveDecimal,
  valuation_cap_sar: PositiveDecimal,
  discount_rate: Percentage.optional().or(z.literal("")),
  conversion_status: z.enum(["unconverted", "converted"]).default("unconverted"),
});

// PRD US-04-05 Convertible Note: principal + interest_rate + maturity_date +
// optional conversion discount + optional val cap. Has interest, unlike SAFE.
const ConvertibleNoteDataSchema = z.object({
  principal_sar: PositiveDecimal,
  interest_rate: Percentage,
  maturity_date: z.string().min(1),
  conversion_discount: Percentage.optional().or(z.literal("")),
  valuation_cap_sar: PositiveDecimal.optional().or(z.literal("")),
  conversion_status: z.enum(["unconverted", "converted"]).default("unconverted"),
});

const BaseSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email().optional().or(z.literal("")),
  entity_or_individual: z.enum(["individual", "entity"]),
  entry_date: z.string().min(1),
});

export interface ActionResult {
  ok: boolean;
  error?: string;
}

const SUPPORTED_INSTRUMENTS = new Set([
  "ordinary",
  "isafe",
  "safe",
  "convertible_note",
]);

export async function addShareholder(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const workspace = await getActiveWorkspace();
  if (!workspace) return { ok: false, error: "No workspace found." };

  const instrumentTypeRaw = String(formData.get("instrument_type") ?? "");
  if (!SUPPORTED_INSTRUMENTS.has(instrumentTypeRaw)) {
    return { ok: false, error: `Unsupported instrument_type: ${instrumentTypeRaw}.` };
  }
  const instrumentType = instrumentTypeRaw as
    | "ordinary"
    | "isafe"
    | "safe"
    | "convertible_note";

  const baseParsed = BaseSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email") ?? "",
    entity_or_individual: formData.get("entity_or_individual"),
    entry_date: formData.get("entry_date"),
  });
  if (!baseParsed.success) {
    return {
      ok: false,
      error: baseParsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "),
    };
  }

  const instrumentData = parseInstrumentData(formData, instrumentType);
  if (!("data" in instrumentData)) return instrumentData;

  const { data: inserted, error } = await supabase
    .from("shareholders")
    .insert({
      workspace_id: workspace.id,
      name: baseParsed.data.name,
      email: baseParsed.data.email || null,
      entity_or_individual: baseParsed.data.entity_or_individual,
      entry_date: baseParsed.data.entry_date,
      instrument_type: instrumentType,
      instrument_data: instrumentData.data as Json,
    })
    .select("id")
    .single();

  if (error || !inserted) return { ok: false, error: error?.message ?? "Insert failed." };

  await logAudit({
    workspaceId: workspace.id,
    entityType: "shareholder",
    entityId: inserted.id,
    action: "create",
    description: `Added ${INSTRUMENT_LABELS[instrumentType]} holder "${baseParsed.data.name}"`,
    payload: { instrument_type: instrumentType, instrument_data: instrumentData.data as Json },
  });

  revalidatePath("/cap-table");
  redirect("/cap-table");
}

export async function editShareholder(
  shareholderId: string,
  formData: FormData,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  // Fetch existing row — RLS handles ownership; we also need instrument_type
  // to know which schema to validate against (PRD US-04-08: instrument type
  // is immutable after creation).
  const { data: existing } = await supabase
    .from("shareholders")
    .select("instrument_type, workspace_id")
    .eq("id", shareholderId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!existing) return { ok: false, error: "Shareholder not found." };

  const baseParsed = BaseSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email") ?? "",
    entity_or_individual: formData.get("entity_or_individual"),
    entry_date: formData.get("entry_date"),
  });
  if (!baseParsed.success) {
    return {
      ok: false,
      error: baseParsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "),
    };
  }

  const instrumentData = parseInstrumentData(formData, existing.instrument_type);
  if (!("data" in instrumentData)) return instrumentData;

  const { error } = await supabase
    .from("shareholders")
    .update({
      name: baseParsed.data.name,
      email: baseParsed.data.email || null,
      entity_or_individual: baseParsed.data.entity_or_individual,
      entry_date: baseParsed.data.entry_date,
      instrument_data: instrumentData.data as Json,
    })
    .eq("id", shareholderId);

  if (error) return { ok: false, error: error.message };

  await logAudit({
    workspaceId: existing.workspace_id,
    entityType: "shareholder",
    entityId: shareholderId,
    action: "update",
    description: `Edited ${INSTRUMENT_LABELS[existing.instrument_type]} holder "${baseParsed.data.name}"`,
    payload: { instrument_data: instrumentData.data as Json },
  });

  revalidatePath("/cap-table");
  redirect("/cap-table");
}

export async function deleteShareholder(
  shareholderId: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  // Soft delete to preserve audit trail.
  const { data: existing, error: fetchError } = await supabase
    .from("shareholders")
    .select("workspace_id, name, instrument_type")
    .eq("id", shareholderId)
    .is("deleted_at", null)
    .maybeSingle();
  if (fetchError) return { ok: false, error: fetchError.message };
  if (!existing) return { ok: false, error: "Shareholder not found." };

  const { error } = await supabase
    .from("shareholders")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", shareholderId)
    .is("deleted_at", null);

  if (error) return { ok: false, error: error.message };

  await logAudit({
    workspaceId: existing.workspace_id,
    entityType: "shareholder",
    entityId: shareholderId,
    action: "delete",
    description: `Removed ${INSTRUMENT_LABELS[existing.instrument_type]} holder "${existing.name}"`,
  });

  revalidatePath("/cap-table");
  return { ok: true };
}

// Shared instrument-data parser used by both add and edit.
function parseInstrumentData(
  formData: FormData,
  instrumentType: string,
): { data: Record<string, unknown> } | ActionResult {
  function err(issues: readonly { path: readonly PropertyKey[]; message: string }[]): ActionResult {
    return {
      ok: false,
      error: issues
        .map((i) => `${i.path.map(String).join(".")}: ${i.message}`)
        .join("; "),
    };
  }

  if (instrumentType === "ordinary") {
    const parsed = OrdinaryDataSchema.safeParse({
      shares: formData.get("shares"),
      price_per_share_sar: formData.get("price_per_share_sar"),
      service_for_equity: formData.get("service_for_equity") === "on",
      service_note: formData.get("service_note") ?? "",
    });
    if (!parsed.success) return err(parsed.error.issues);
    return { data: parsed.data };
  }

  if (instrumentType === "isafe") {
    const parsed = ISafeDataSchema.safeParse({
      investment_sar: formData.get("investment_sar"),
      valuation_cap_sar: formData.get("valuation_cap_sar"),
      profit_share_ratio: formData.get("profit_share_ratio"),
      conversion_status: "unconverted",
    });
    if (!parsed.success) return err(parsed.error.issues);
    return { data: parsed.data };
  }

  if (instrumentType === "safe") {
    const parsed = SafeDataSchema.safeParse({
      safe_type: formData.get("safe_type"),
      investment_sar: formData.get("investment_sar"),
      valuation_cap_sar: formData.get("valuation_cap_sar"),
      discount_rate: formData.get("discount_rate") ?? "",
      conversion_status: "unconverted",
    });
    if (!parsed.success) return err(parsed.error.issues);
    return { data: parsed.data };
  }

  if (instrumentType === "convertible_note") {
    const parsed = ConvertibleNoteDataSchema.safeParse({
      principal_sar: formData.get("principal_sar"),
      interest_rate: formData.get("interest_rate"),
      maturity_date: formData.get("maturity_date"),
      conversion_discount: formData.get("conversion_discount") ?? "",
      valuation_cap_sar: formData.get("valuation_cap_sar") ?? "",
      conversion_status: "unconverted",
    });
    if (!parsed.success) return err(parsed.error.issues);
    return { data: parsed.data };
  }

  return { ok: false, error: `Unsupported instrument_type: ${instrumentType}` };
}
