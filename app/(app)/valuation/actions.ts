"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { logAudit } from "@/lib/audit/log";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/types";

const SaveSchema = z.object({
  label: z.string().min(1).max(120),
  methodology: z.enum(["revenue_multiple", "scorecard", "berkus", "dcf"]),
  inputs: z.record(z.string(), z.unknown()),
  low: z.string(),
  mid: z.string(),
  high: z.string(),
});

export interface ActionResult {
  ok: boolean;
  error?: string;
}

export async function saveSession(input: {
  label: string;
  methodology: "revenue_multiple" | "scorecard" | "berkus" | "dcf";
  inputs: Record<string, unknown>;
  low: string;
  mid: string;
  high: string;
}): Promise<ActionResult> {
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

  const parsed = SaveSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Invalid input." };
  }

  const { error } = await supabase.from("valuation_sessions").insert({
    workspace_id: workspace.id,
    label: parsed.data.label,
    methodology: parsed.data.methodology,
    inputs: parsed.data.inputs as Json,
    result_low_sar: parsed.data.low,
    result_mid_sar: parsed.data.mid,
    result_high_sar: parsed.data.high,
  });
  if (error) return { ok: false, error: error.message };

  await logAudit({
    workspaceId: workspace.id,
    entityType: "workspace",
    entityId: workspace.id,
    action: "valuation_save",
    description: `Saved valuation "${parsed.data.label}" (${parsed.data.methodology})`,
  });

  revalidatePath("/valuation");
  return { ok: true };
}

export async function deleteSession(sessionId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const { error } = await supabase
    .from("valuation_sessions")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", sessionId)
    .is("deleted_at", null);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/valuation");
  return { ok: true };
}
