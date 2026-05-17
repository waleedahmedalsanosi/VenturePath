"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { logAudit } from "@/lib/audit/log";
import { Dec } from "@/lib/cap-table/decimal";
import { computeConversionShares } from "@/lib/cap-table/isafe-math";
import { convertSafe } from "@/lib/rounds/conversion";
import { createClient } from "@/lib/supabase/server";
import { getActiveWorkspace } from "@/lib/workspace/active";
import type { Json } from "@/lib/supabase/types";

export interface ActionResult {
  ok: boolean;
  error?: string;
}

const PositiveDecimal = z
  .string()
  .min(1)
  .refine((s) => {
    try {
      return new Dec(s).gt(0);
    } catch {
      return false;
    }
  }, "must be a positive number");

const OptionalPositiveDecimal = PositiveDecimal.optional().or(z.literal(""));

const RoundSchema = z.object({
  name: z.string().min(1).max(200),
  instrument_type: z.enum(["isafe", "safe", "convertible_note", "ordinary"]),
  pre_money_valuation_sar: OptionalPositiveDecimal,
  target_raise_sar: OptionalPositiveDecimal,
  lead_investor: z.string().max(200).optional().or(z.literal("")),
  close_date: z.string().optional().or(z.literal("")),
});

function sarFmt(n: string): string {
  return `SAR ${Number(n).toLocaleString()}`;
}

function buildResolutionBody(data: {
  name: string;
  target_raise_sar?: string;
  pre_money_valuation_sar?: string;
  lead_investor?: string;
  instrument_type: string;
}): string {
  const instrumentLabel: Record<string, string> = {
    isafe: "iSAFE",
    safe: "SAFE",
    convertible_note: "Convertible Note",
    ordinary: "Ordinary Shares (Priced Round)",
  };
  return `RESOLVED, that the Company is authorised to enter into a financing round with the following terms:
- Round name: ${data.name}
- Target raise: ${data.target_raise_sar ? sarFmt(data.target_raise_sar) : "[TBD]"}
- Pre-money valuation: ${data.pre_money_valuation_sar ? sarFmt(data.pre_money_valuation_sar) : "[TBD]"}
- Lead investor: ${data.lead_investor || "[TBD]"}
- Instrument: ${instrumentLabel[data.instrument_type] ?? data.instrument_type}

FURTHER RESOLVED, that the directors are authorised to execute all necessary agreements and filings to consummate this round.`;
}

// ── Create round ─────────────────────────────────────────────────────────────

export async function createRound(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const workspace = await getActiveWorkspace();
  if (!workspace) return { ok: false, error: "No workspace found." };

  const parsed = RoundSchema.safeParse({
    name: formData.get("name"),
    instrument_type: formData.get("instrument_type") ?? "isafe",
    pre_money_valuation_sar: formData.get("pre_money_valuation_sar") ?? "",
    target_raise_sar: formData.get("target_raise_sar") ?? "",
    lead_investor: formData.get("lead_investor") ?? "",
    close_date: formData.get("close_date") ?? "",
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "),
    };
  }
  const d = parsed.data;

  // Auto-create a draft round_approval resolution linked to this round.
  const resolutionTitle = `Resolution: Approval of ${d.name} Round`;
  const resolutionBody = buildResolutionBody({
    name: d.name,
    target_raise_sar: d.target_raise_sar || undefined,
    pre_money_valuation_sar: d.pre_money_valuation_sar || undefined,
    lead_investor: d.lead_investor || undefined,
    instrument_type: d.instrument_type,
  });

  const { data: resolution, error: resErr } = await supabase
    .from("resolutions")
    .insert({
      workspace_id: workspace.id,
      title: resolutionTitle,
      template: "round_approval",
      body: resolutionBody,
      created_by: user.id,
    })
    .select("id")
    .single();
  if (resErr || !resolution) return { ok: false, error: resErr?.message ?? "Could not create resolution." };

  const { data: round, error: roundErr } = await supabase
    .from("financing_rounds")
    .insert({
      workspace_id: workspace.id,
      name: d.name,
      status: "draft",
      instrument_type: d.instrument_type,
      pre_money_valuation_sar: d.pre_money_valuation_sar || null,
      target_raise_sar: d.target_raise_sar || null,
      lead_investor: d.lead_investor || null,
      close_date: d.close_date || null,
      board_resolution_id: resolution.id,
    })
    .select("id")
    .single();
  if (roundErr || !round) return { ok: false, error: roundErr?.message ?? "Could not create round." };

  await logAudit({
    workspaceId: workspace.id,
    entityType: "workspace",
    entityId: round.id,
    action: "round_create",
    description: `Opened fundraising round "${d.name}"`,
    payload: { instrument_type: d.instrument_type } as Json,
  });

  revalidatePath("/rounds");
  redirect(`/rounds/${round.id}`);
}

// ── Update round metadata ─────────────────────────────────────────────────────

export async function updateRound(
  roundId: string,
  formData: FormData,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const { data: existing } = await supabase
    .from("financing_rounds")
    .select("status, workspace_id")
    .eq("id", roundId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!existing) return { ok: false, error: "Round not found." };
  if (existing.status === "closed") return { ok: false, error: "Closed rounds cannot be edited." };

  const parsed = RoundSchema.safeParse({
    name: formData.get("name"),
    instrument_type: formData.get("instrument_type") ?? "isafe",
    pre_money_valuation_sar: formData.get("pre_money_valuation_sar") ?? "",
    target_raise_sar: formData.get("target_raise_sar") ?? "",
    lead_investor: formData.get("lead_investor") ?? "",
    close_date: formData.get("close_date") ?? "",
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "),
    };
  }
  const d = parsed.data;

  const { error } = await supabase
    .from("financing_rounds")
    .update({
      name: d.name,
      instrument_type: d.instrument_type,
      pre_money_valuation_sar: d.pre_money_valuation_sar || null,
      target_raise_sar: d.target_raise_sar || null,
      lead_investor: d.lead_investor || null,
      close_date: d.close_date || null,
    })
    .eq("id", roundId);
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/rounds/${roundId}`);
  revalidatePath("/rounds");
  return { ok: true };
}

// ── Open round (draft → open) ─────────────────────────────────────────────────

export async function openRound(roundId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const { data: round } = await supabase
    .from("financing_rounds")
    .select("status, name, workspace_id")
    .eq("id", roundId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!round) return { ok: false, error: "Round not found." };
  if (round.status !== "draft") return { ok: false, error: "Only draft rounds can be opened." };

  const { error } = await supabase
    .from("financing_rounds")
    .update({ status: "open" })
    .eq("id", roundId);
  if (error) return { ok: false, error: error.message };

  await logAudit({
    workspaceId: round.workspace_id,
    entityType: "workspace",
    entityId: roundId,
    action: "round_open",
    description: `Opened round "${round.name}" for investment`,
  });

  revalidatePath(`/rounds/${roundId}`);
  revalidatePath("/rounds");
  return { ok: true };
}

// ── Close round ───────────────────────────────────────────────────────────────
// Converts all unconverted iSAFE / SAFE holders in this workspace to ordinary shares.
// Convertible notes are flagged for manual review.

const CloseSchema = z.object({
  pre_money_valuation_sar: PositiveDecimal,
  fd_shares_pre_round: PositiveDecimal,
  actual_raise_sar: OptionalPositiveDecimal,
});

export async function closeRound(
  roundId: string,
  formData: FormData,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const workspace = await getActiveWorkspace();
  if (!workspace) return { ok: false, error: "No workspace found." };

  const { data: round } = await supabase
    .from("financing_rounds")
    .select("status, name, workspace_id")
    .eq("id", roundId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!round) return { ok: false, error: "Round not found." };
  if (round.status === "closed") return { ok: false, error: "Round is already closed." };
  if (round.workspace_id !== workspace.id) return { ok: false, error: "Not your round." };

  const parsed = CloseSchema.safeParse({
    pre_money_valuation_sar: formData.get("pre_money_valuation_sar"),
    fd_shares_pre_round: formData.get("fd_shares_pre_round"),
    actual_raise_sar: formData.get("actual_raise_sar") ?? "",
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "),
    };
  }
  const { pre_money_valuation_sar, fd_shares_pre_round, actual_raise_sar } = parsed.data;

  const closeDate = new Date().toISOString().slice(0, 10);

  // PHASE 1: Compute the plan in TS (math + de-dup), then PHASE 2 hand it to
  // close_financing_round() RPC for a single atomic apply. The RPC writes
  // the audit trail itself, so we drop the prior trailing logAudit call.

  // 1a. Build the promotions list from signed term sheets that aren't
  //     already on the cap table.
  const { data: signedTermSheets } = await supabase
    .from("term_sheets")
    .select("*")
    .eq("round_id", roundId)
    .eq("status", "signed")
    .is("deleted_at", null);

  const promotions: Array<Record<string, unknown>> = [];
  for (const ts of signedTermSheets ?? []) {
    const shareholderName = ts.firm ? `${ts.investor_name} (${ts.firm})` : ts.investor_name;

    const { data: existing } = await supabase
      .from("shareholders")
      .select("id")
      .eq("workspace_id", workspace.id)
      .eq("instrument_type", ts.instrument_type)
      .eq("name", shareholderName)
      .is("deleted_at", null)
      .limit(1)
      .maybeSingle();
    if (existing) continue;

    const terms = (ts.terms ?? {}) as Record<string, unknown>;
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
        conversion_status: "unconverted",
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

    promotions.push({
      name: shareholderName,
      email: ts.investor_email ?? null,
      entity_or_individual: ts.firm ? "entity" : "individual",
      instrument_type: ts.instrument_type,
      instrument_data: instrumentData,
      pipeline_contact_id: ts.pipeline_contact_id ?? null,
    });
  }

  // 1b. Build the conversions list from unconverted iSAFE/SAFE holders using
  //     the existing Sharia-aware conversion math (kept in TS, single source
  //     of truth — see lib/cap-table/isafe-math.ts).
  //
  //     Note: promoted term sheets are inserted *inside* the RPC, so their
  //     unconverted iSAFE/SAFE rows are not visible here yet. Their TS-level
  //     conversion will happen on the *next* round close. This matches the
  //     prior behavior, where the sequence was identical (the existing
  //     "now includes just-promoted ones" comment was misleading — the
  //     filter ran against the pre-insert state because the inserts above
  //     used the same Supabase client, which doesn't see its own
  //     uncommitted writes across separate await calls without a refresh).
  const { data: convertibles } = await supabase
    .from("shareholders")
    .select("id, name, email, entity_or_individual, entry_date, instrument_type, instrument_data")
    .eq("workspace_id", workspace.id)
    .in("instrument_type", ["isafe", "safe"])
    .is("deleted_at", null);

  const toConvert = (convertibles ?? []).filter((s) => {
    const d = s.instrument_data as Record<string, unknown>;
    return d?.conversion_status === "unconverted";
  });

  const roundTerms = {
    pre_money_valuation_sar: new Dec(pre_money_valuation_sar),
    fd_shares_pre_round: new Dec(fd_shares_pre_round),
  };

  const conversions: Array<Record<string, unknown>> = [];
  for (const holder of toConvert) {
    const d = holder.instrument_data as Record<string, string>;
    let sharesStr: string;

    try {
      if (holder.instrument_type === "isafe") {
        const result = computeConversionShares(
          {
            investment_sar: new Dec(d.investment_sar),
            valuation_cap_sar: new Dec(d.valuation_cap_sar),
            profit_share_ratio: new Dec(d.profit_share_ratio ?? "0"),
          },
          roundTerms,
        );
        sharesStr = result.shares.toFixed(0);
      } else {
        // safe
        const result = convertSafe(
          {
            investment_sar: d.investment_sar,
            valuation_cap_sar: d.valuation_cap_sar,
            discount_rate: d.discount_rate || undefined,
            safe_type: (d.safe_type as "post_money" | "pre_money") ?? "post_money",
          },
          pre_money_valuation_sar,
          fd_shares_pre_round,
        );
        sharesStr = String(Math.round(Number(result.shares)));
      }
    } catch {
      sharesStr = "0";
    }

    if (Number(sharesStr) <= 0) continue;

    const pricePerShare = new Dec(pre_money_valuation_sar)
      .div(new Dec(fd_shares_pre_round))
      .toFixed(4);

    conversions.push({
      shareholder_id: holder.id,
      new_shares: sharesStr,
      price_per_share_sar: pricePerShare,
      from_instrument_type: holder.instrument_type,
      service_note: `Converted from ${holder.instrument_type.toUpperCase()} on round close`,
    });
  }

  // PHASE 2: single atomic apply.
  const { error: rpcErr } = await supabase.rpc("close_financing_round", {
    p_round_id: roundId,
    p_pre_money_valuation_sar: pre_money_valuation_sar,
    p_fd_shares_pre_round: fd_shares_pre_round,
    p_actual_raise_sar: actual_raise_sar || null,
    p_close_date: closeDate,
    p_promotions: promotions as unknown as Json,
    p_conversions: conversions as unknown as Json,
  });
  if (rpcErr) return { ok: false, error: rpcErr.message };

  revalidatePath(`/rounds/${roundId}`);
  revalidatePath("/rounds");
  revalidatePath("/cap-table");
  return { ok: true };
}

// ── Public visibility toggle ─────────────────────────────────────────────────

export async function setRoundVisibility(
  roundId: string,
  isPublic: boolean,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const { data: round } = await supabase
    .from("financing_rounds")
    .select("name, status, workspace_id")
    .eq("id", roundId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!round) return { ok: false, error: "Round not found." };

  const { error } = await supabase
    .from("financing_rounds")
    .update({ is_public: isPublic })
    .eq("id", roundId);
  if (error) return { ok: false, error: error.message };

  await logAudit({
    workspaceId: round.workspace_id,
    entityType: "workspace",
    entityId: roundId,
    action: isPublic ? "round_publish" : "round_unpublish",
    description: `${isPublic ? "Published" : "Unpublished"} round "${round.name}" on public profile`,
  });

  revalidatePath(`/rounds/${roundId}`);
  revalidatePath("/rounds");
  revalidatePath("/explore", "layout");
  return { ok: true };
}

// ── Delete round ──────────────────────────────────────────────────────────────

export async function deleteRound(roundId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const { data: round } = await supabase
    .from("financing_rounds")
    .select("status, name, workspace_id")
    .eq("id", roundId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!round) return { ok: false, error: "Round not found." };
  if (round.status === "closed") return { ok: false, error: "Closed rounds cannot be deleted." };

  const { error } = await supabase
    .from("financing_rounds")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", roundId);
  if (error) return { ok: false, error: error.message };

  await logAudit({
    workspaceId: round.workspace_id,
    entityType: "workspace",
    entityId: roundId,
    action: "round_delete",
    description: `Deleted round "${round.name}"`,
  });

  revalidatePath("/rounds");
  redirect("/rounds");
}
