"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { logAudit } from "@/lib/audit/log";
import { createClient } from "@/lib/supabase/server";
import { getActiveWorkspace } from "@/lib/workspace/active";

export interface ActionResult {
  ok: boolean;
  error?: string;
}

const VALID_TIERS = new Set(["intro", "standard", "diligence"]);

const CreateLinkSchema = z.object({
  label: z.string().min(1).max(100).default("Investor Link"),
  expires_days: z.coerce.number().int().min(0).max(365).default(0),
  access_tier: z.enum(["intro", "standard", "diligence"]).default("intro"),
});

export async function createDataRoomLink(
  roundId: string,
  formData: FormData,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const workspace = await getActiveWorkspace();
  if (!workspace) return { ok: false, error: "No workspace." };

  const rawTier = String(formData.get("access_tier") ?? "intro");
  const parsed = CreateLinkSchema.safeParse({
    label: formData.get("label") ?? "Investor Link",
    expires_days: formData.get("expires_days") ?? "0",
    access_tier: VALID_TIERS.has(rawTier) ? rawTier : "intro",
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.map((i) => i.message).join("; ") };
  }

  const expiresAt = parsed.data.expires_days > 0
    ? new Date(Date.now() + parsed.data.expires_days * 86400 * 1000).toISOString()
    : null;

  const { error } = await supabase.from("data_room_links").insert({
    workspace_id: workspace.id,
    round_id: roundId,
    label: parsed.data.label,
    expires_at: expiresAt,
    access_tier: parsed.data.access_tier,
  });
  if (error) return { ok: false, error: error.message };

  await logAudit({
    workspaceId: workspace.id,
    entityType: "workspace",
    entityId: roundId,
    action: "data_room_link_create",
    description: `Created ${parsed.data.access_tier} data room link "${parsed.data.label}"`,
  });

  revalidatePath(`/rounds/${roundId}`);
  return { ok: true };
}

export async function revokeDataRoomLink(
  linkId: string,
  roundId: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const workspace = await getActiveWorkspace();
  if (!workspace) return { ok: false, error: "No workspace." };

  const { error } = await supabase
    .from("data_room_links")
    .update({ is_active: false })
    .eq("id", linkId)
    .eq("workspace_id", workspace.id);
  if (error) return { ok: false, error: error.message };

  await logAudit({
    workspaceId: workspace.id,
    entityType: "workspace",
    entityId: linkId,
    action: "data_room_link_revoke",
    description: "Revoked data room link",
  });

  revalidatePath(`/rounds/${roundId}`);
  return { ok: true };
}
