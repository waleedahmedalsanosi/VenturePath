"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { logAudit } from "@/lib/audit/log";
import { createClient } from "@/lib/supabase/server";

const InviteSchema = z.object({
  invited_email: z.string().email(),
  role: z.enum(["admin", "viewer"]).default("viewer"),
});

export interface ActionResult {
  ok: boolean;
  error?: string;
}

export interface InviteResult extends ActionResult {
  invitationLink?: string;
}

export async function createInvitation(formData: FormData): Promise<InviteResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("id, name")
    .eq("owner_user_id", user.id)
    .limit(1)
    .maybeSingle();
  if (!workspace) return { ok: false, error: "Only the workspace owner can invite." };

  const parsed = InviteSchema.safeParse({
    invited_email: formData.get("invited_email"),
    role: formData.get("role") ?? "viewer",
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues
        .map((i) => `${i.path.map(String).join(".")}: ${i.message}`)
        .join("; "),
    };
  }

  // 32 random bytes → base64url ≈ 43 chars. Plenty of entropy for a 7-day token.
  const token = randomBytes(32).toString("base64url");

  const { error } = await supabase.from("workspace_invitations").insert({
    workspace_id: workspace.id,
    invited_email: parsed.data.invited_email,
    role: parsed.data.role,
    token,
    invited_by: user.id,
  });
  if (error) return { ok: false, error: error.message };

  await logAudit({
    workspaceId: workspace.id,
    entityType: "workspace",
    entityId: workspace.id,
    action: "invite_create",
    description: `Invited ${parsed.data.invited_email} as ${parsed.data.role}`,
  });

  // No email infra yet — return the share link, owner pastes it to invitee.
  return {
    ok: true,
    invitationLink: `/invite/${token}`,
  };
}

export async function revokeInvitation(invitationId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const { error } = await supabase
    .from("workspace_invitations")
    .delete()
    .eq("id", invitationId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/members");
  return { ok: true };
}

export async function removeMember(
  workspaceId: string,
  userId: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  // Don't allow removing the owner role via this path.
  const { data: target } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .maybeSingle();
  if (!target) return { ok: false, error: "Member not found." };
  if (target.role === "owner") {
    return { ok: false, error: "Cannot remove the workspace owner." };
  }

  const { error } = await supabase
    .from("workspace_members")
    .delete()
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId);
  if (error) return { ok: false, error: error.message };

  await logAudit({
    workspaceId,
    entityType: "workspace",
    entityId: workspaceId,
    action: "member_remove",
    description: `Removed member ${userId}`,
  });

  revalidatePath("/members");
  return { ok: true };
}
