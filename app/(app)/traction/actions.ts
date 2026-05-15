"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

const Schema = z.object({
  month: z.string().min(1),  // YYYY-MM-DD, must be first of month (validated below)
  mrr_sar: z.string().optional().or(z.literal("")),
  customer_count: z.string().optional().or(z.literal("")),
  gross_margin_pct: z.string().optional().or(z.literal("")),
  cash_runway_months: z.string().optional().or(z.literal("")),
});

function toNumberOrNull(s: string | undefined): number | null {
  if (s === undefined || s === "") return null;
  const n = Number(s);
  if (!Number.isFinite(n)) return null;
  return n;
}

export interface ActionResult {
  ok: boolean;
  error?: string;
}

export async function upsertMetric(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("id")
    .eq("owner_user_id", user.id)
    .limit(1)
    .maybeSingle();
  if (!workspace) return { ok: false, error: "No workspace found." };

  const parsed = Schema.safeParse({
    month: formData.get("month"),
    mrr_sar: formData.get("mrr_sar"),
    customer_count: formData.get("customer_count"),
    gross_margin_pct: formData.get("gross_margin_pct"),
    cash_runway_months: formData.get("cash_runway_months"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues
        .map((i) => `${i.path.map(String).join(".")}: ${i.message}`)
        .join("; "),
    };
  }

  // Force the day to 01 so we always store first-of-month.
  const monthFirst = `${parsed.data.month.slice(0, 7)}-01`;

  const grossMargin = toNumberOrNull(parsed.data.gross_margin_pct as string);
  if (grossMargin !== null && (grossMargin < 0 || grossMargin > 100)) {
    return { ok: false, error: "Gross margin must be between 0 and 100." };
  }

  const { error } = await supabase
    .from("traction_metrics")
    .upsert(
      {
        workspace_id: workspace.id,
        month: monthFirst,
        mrr_sar: toNumberOrNull(parsed.data.mrr_sar as string),
        customer_count: toNumberOrNull(parsed.data.customer_count as string),
        gross_margin_pct: grossMargin,
        cash_runway_months: toNumberOrNull(parsed.data.cash_runway_months as string),
        deleted_at: null,
      },
      { onConflict: "workspace_id,month" },
    );

  if (error) return { ok: false, error: error.message };

  revalidatePath("/traction");
  return { ok: true };
}

export async function deleteMetric(metricId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const { error } = await supabase
    .from("traction_metrics")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", metricId)
    .is("deleted_at", null);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/traction");
  return { ok: true };
}

export async function setPublished(published: boolean): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const { error } = await supabase
    .from("workspaces")
    .update({ public_profile_published: published })
    .eq("owner_user_id", user.id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/traction");
  return { ok: true };
}

export async function updateVisibility(
  flags: {
    show_mrr_publicly: boolean;
    show_customer_count_publicly: boolean;
    show_gross_margin_publicly: boolean;
    show_cash_runway_publicly: boolean;
  },
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const { error } = await supabase
    .from("workspaces")
    .update(flags)
    .eq("owner_user_id", user.id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/traction");
  return { ok: true };
}
