/**
 * Active workspace resolution for multi-startup users.
 *
 * - A signed-in user can own multiple workspaces and/or be a member of others.
 * - The "active" workspace is chosen via the vp_active_workspace cookie.
 *   If the cookie is missing or points to a workspace the user can't access,
 *   we fall back to their earliest-created accessible workspace.
 * - RLS handles access enforcement — this helper just picks ONE workspace
 *   per request without leaking access to others.
 */

import { cookies } from "next/headers";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

export const ACTIVE_WORKSPACE_COOKIE = "vp_active_workspace";

type Workspace = Database["public"]["Tables"]["workspaces"]["Row"];

/**
 * Returns the currently active workspace for the signed-in user, or null
 * if they have none. Callers must handle the null case (typically by
 * redirecting to /setup).
 */
export async function getActiveWorkspace(): Promise<Workspace | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const cookieStore = await cookies();
  const cookieId = cookieStore.get(ACTIVE_WORKSPACE_COOKIE)?.value;

  // 1. Cookie-pinned workspace, if accessible.
  if (cookieId) {
    const { data: pinned } = await supabase
      .from("workspaces")
      .select("*")
      .eq("id", cookieId)
      .maybeSingle();
    if (pinned) return pinned;
  }

  // 2. Fall back to earliest workspace the user has access to.
  const { data: fallback } = await supabase
    .from("workspaces")
    .select("*")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  return fallback ?? null;
}

/**
 * Returns every workspace the signed-in user can access (owner OR member).
 * RLS does the filtering for us — we just query the table.
 */
export async function listAccessibleWorkspaces() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("workspaces")
    .select("id, name, slug, owner_user_id")
    .order("created_at", { ascending: true });
  return data ?? [];
}
