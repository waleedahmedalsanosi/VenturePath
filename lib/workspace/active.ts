/**
 * Active workspace resolution for multi-startup users.
 *
 * - A signed-in user can own multiple workspaces and/or be a member of others.
 * - The "active" workspace is chosen via the vp_active_workspace cookie.
 *   If the cookie is missing or points to a workspace the user can't access,
 *   we fall back to their earliest-created accessible workspace.
 * - RLS on workspaces also exposes any row with public_profile_published=true
 *   so /explore works for everyone — so we cannot trust RLS alone for the
 *   switcher / sidebar gating. We filter explicitly by owner OR member here.
 */

import { cookies } from "next/headers";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

export const ACTIVE_WORKSPACE_COOKIE = "vp_active_workspace";

type Workspace = Database["public"]["Tables"]["workspaces"]["Row"];

/**
 * Returns workspace IDs the given user owns or is a member of.
 * Used to scope workspace queries past the public-profile RLS policy.
 */
async function listMemberWorkspaceIds(userId: string): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", userId);
  return (data ?? []).map((r) => r.workspace_id);
}

/**
 * Returns the currently active workspace for the signed-in user, or null
 * if they own/are a member of none. Callers must handle the null case.
 */
export async function getActiveWorkspace(): Promise<Workspace | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const memberIds = await listMemberWorkspaceIds(user.id);
  const ownerFilter = `owner_user_id.eq.${user.id}`;
  const orFilter = memberIds.length
    ? `${ownerFilter},id.in.(${memberIds.join(",")})`
    : ownerFilter;

  const cookieStore = await cookies();
  const cookieId = cookieStore.get(ACTIVE_WORKSPACE_COOKIE)?.value;

  // 1. Cookie-pinned workspace, if owned or a member.
  if (cookieId) {
    const { data: pinned } = await supabase
      .from("workspaces")
      .select("*")
      .eq("id", cookieId)
      .or(orFilter)
      .maybeSingle();
    if (pinned) return pinned;
  }

  // 2. Fall back to earliest workspace the user owns or is a member of.
  const { data: fallback } = await supabase
    .from("workspaces")
    .select("*")
    .or(orFilter)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  return fallback ?? null;
}

/**
 * Returns every workspace the signed-in user owns or is a member of.
 * Excludes public profiles they have no ownership/membership stake in.
 */
export async function listAccessibleWorkspaces() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const memberIds = await listMemberWorkspaceIds(user.id);
  const ownerFilter = `owner_user_id.eq.${user.id}`;
  const orFilter = memberIds.length
    ? `${ownerFilter},id.in.(${memberIds.join(",")})`
    : ownerFilter;

  const { data } = await supabase
    .from("workspaces")
    .select("id, name, slug, owner_user_id")
    .or(orFilter)
    .order("created_at", { ascending: true });
  return data ?? [];
}
