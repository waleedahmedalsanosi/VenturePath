"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { getActiveWorkspace } from "@/lib/workspace/active";

export interface ActionResult {
  ok: boolean;
  error?: string;
}

const PositiveDecimal = z
  .string()
  .trim()
  .transform((v) => (v === "" ? null : parseFloat(v)))
  .refine((v) => v === null || (isFinite(v) && v >= 0));

const UpdateSchema = z.object({
  subject: z.string().trim().min(1).max(300),
  body: z.string().trim().min(1),
  mrr_sar: PositiveDecimal,
  runway_months: PositiveDecimal,
  highlights: z.string().transform((v) =>
    v
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .slice(0, 10),
  ),
});

export async function createInvestorUpdate(
  roundId: string,
  formData: FormData,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const workspace = await getActiveWorkspace();
  if (!workspace) return { ok: false, error: "No workspace." };

  const parsed = UpdateSchema.safeParse({
    subject: formData.get("subject"),
    body: formData.get("body"),
    mrr_sar: formData.get("mrr_sar"),
    runway_months: formData.get("runway_months"),
    highlights: formData.get("highlights") ?? "",
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const { data, error } = await supabase
    .from("investor_updates")
    .insert({
      workspace_id: workspace.id,
      round_id: roundId,
      ...parsed.data,
    })
    .select("id")
    .single();
  if (error || !data) return { ok: false, error: error?.message ?? "Insert failed." };

  redirect(`/investor-updates/${data.id}`);
}

export async function updateInvestorUpdate(
  updateId: string,
  formData: FormData,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const workspace = await getActiveWorkspace();
  if (!workspace) return { ok: false, error: "No workspace." };

  const parsed = UpdateSchema.safeParse({
    subject: formData.get("subject"),
    body: formData.get("body"),
    mrr_sar: formData.get("mrr_sar"),
    runway_months: formData.get("runway_months"),
    highlights: formData.get("highlights") ?? "",
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const { error } = await supabase
    .from("investor_updates")
    .update(parsed.data)
    .eq("id", updateId)
    .eq("workspace_id", workspace.id)
    .eq("status", "draft");
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/investor-updates/${updateId}`);
  return { ok: true };
}

export async function publishInvestorUpdate(updateId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const workspace = await getActiveWorkspace();
  if (!workspace) return { ok: false, error: "No workspace." };

  const { data: update } = await supabase
    .from("investor_updates")
    .select("round_id")
    .eq("id", updateId)
    .eq("workspace_id", workspace.id)
    .maybeSingle();
  if (!update) return { ok: false, error: "Update not found." };

  const { error } = await supabase
    .from("investor_updates")
    .update({ status: "published", sent_at: new Date().toISOString() })
    .eq("id", updateId)
    .eq("workspace_id", workspace.id);
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/investor-updates/${updateId}`);
  revalidatePath(`/rounds/${update.round_id}`);
  return { ok: true };
}

export async function deleteInvestorUpdate(
  updateId: string,
  roundId: string,
): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const workspace = await getActiveWorkspace();
  if (!workspace) return;

  await supabase
    .from("investor_updates")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", updateId)
    .eq("workspace_id", workspace.id);

  redirect(`/rounds/${roundId}`);
}
