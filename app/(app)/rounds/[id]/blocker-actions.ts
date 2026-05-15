"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { getActiveWorkspace } from "@/lib/workspace/active";

export interface ActionResult {
  ok: boolean;
  error?: string;
}

const TitleSchema = z.string().trim().min(1).max(300);

export async function addBlocker(roundId: string, formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const workspace = await getActiveWorkspace();
  if (!workspace) return { ok: false, error: "No workspace." };

  const parsed = TitleSchema.safeParse(formData.get("title"));
  if (!parsed.success) {
    return { ok: false, error: "Title is required (max 300 chars)." };
  }

  const { error } = await supabase.from("round_blockers").insert({
    workspace_id: workspace.id,
    round_id: roundId,
    title: parsed.data,
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/rounds/${roundId}`);
  return { ok: true };
}

export async function toggleBlocker(
  blockerId: string,
  roundId: string,
  resolved: boolean,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const { error } = await supabase
    .from("round_blockers")
    .update({
      resolved,
      resolved_at: resolved ? new Date().toISOString() : null,
    })
    .eq("id", blockerId);
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/rounds/${roundId}`);
  return { ok: true };
}

export async function deleteBlocker(blockerId: string, roundId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const { error } = await supabase
    .from("round_blockers")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", blockerId);
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/rounds/${roundId}`);
  return { ok: true };
}
