"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { getActiveWorkspace } from "@/lib/workspace/active";

export interface ActionResult {
  ok: boolean;
  error?: string;
}

const CATEGORIES = [
  "kyc_aml",
  "subscription_agreement",
  "wire_confirmation",
  "share_certificate",
  "board_approval",
  "other",
] as const;

const STATUSES = ["pending", "in_progress", "complete", "waived"] as const;

const AddSchema = z.object({
  category: z.enum(CATEGORIES),
  title: z.string().trim().min(1).max(300),
  pipeline_contact_id: z.string().uuid().optional().or(z.literal("")).transform((v) => v || null),
  due_date: z.string().optional().transform((v) => v || null),
  notes: z.string().trim().max(1000).optional().transform((v) => v || null),
});

export async function addClosingItem(
  roundId: string,
  formData: FormData,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const workspace = await getActiveWorkspace();
  if (!workspace) return { ok: false, error: "No workspace." };

  const parsed = AddSchema.safeParse({
    category: formData.get("category"),
    title: formData.get("title"),
    pipeline_contact_id: formData.get("pipeline_contact_id"),
    due_date: formData.get("due_date"),
    notes: formData.get("notes"),
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid." };

  const { error } = await supabase.from("closing_items").insert({
    workspace_id: workspace.id,
    round_id: roundId,
    ...parsed.data,
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/rounds/${roundId}`);
  return { ok: true };
}

export async function setClosingItemStatus(
  itemId: string,
  roundId: string,
  status: (typeof STATUSES)[number],
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const workspace = await getActiveWorkspace();
  if (!workspace) return { ok: false, error: "No workspace." };

  if (!STATUSES.includes(status)) return { ok: false, error: "Invalid status." };

  const completedAt = status === "complete" ? new Date().toISOString() : null;

  const { error } = await supabase
    .from("closing_items")
    .update({ status, completed_at: completedAt })
    .eq("id", itemId)
    .eq("workspace_id", workspace.id);
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/rounds/${roundId}`);
  return { ok: true };
}

export async function updateClosingItemNotes(
  itemId: string,
  roundId: string,
  notes: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const workspace = await getActiveWorkspace();
  if (!workspace) return { ok: false, error: "No workspace." };

  const parsed = z.string().trim().max(1000).safeParse(notes);
  if (!parsed.success) return { ok: false, error: "Notes too long (max 1000 chars)." };

  const { error } = await supabase
    .from("closing_items")
    .update({ notes: parsed.data || null })
    .eq("id", itemId)
    .eq("workspace_id", workspace.id);
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/rounds/${roundId}`);
  return { ok: true };
}

export async function deleteClosingItem(
  itemId: string,
  roundId: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const workspace = await getActiveWorkspace();
  if (!workspace) return { ok: false, error: "No workspace." };

  const { error } = await supabase
    .from("closing_items")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", itemId)
    .eq("workspace_id", workspace.id);
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/rounds/${roundId}`);
  return { ok: true };
}
