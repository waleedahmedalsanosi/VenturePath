"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { ACTIVE_WORKSPACE_COOKIE } from "@/lib/workspace/active";
import { createClient } from "@/lib/supabase/server";

export async function switchWorkspace(
  workspaceId: string,
  redirectTo?: string,
): Promise<void> {
  // RLS will gate the read; if the user can't access this workspace we
  // refuse to set the cookie.
  const supabase = await createClient();
  const { data: ws } = await supabase
    .from("workspaces")
    .select("id")
    .eq("id", workspaceId)
    .maybeSingle();
  if (!ws) return;

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_WORKSPACE_COOKIE, ws.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });

  // Validate redirectTo is a safe internal path (starts with "/" but not "//").
  const safePath =
    typeof redirectTo === "string" &&
    redirectTo.startsWith("/") &&
    !redirectTo.startsWith("//")
      ? redirectTo
      : "/dashboard";

  redirect(safePath);
}

/**
 * Switch the active workspace and navigate to a specific in-app path. Used by
 * the multi-workspace sidebar so a user can deep-link into a non-active
 * workspace's cap table, vault, etc. in one click instead of switching then
 * navigating manually. The path is validated to be an internal absolute path.
 */
export async function switchWorkspaceAndGo(
  workspaceId: string,
  path: string,
): Promise<void> {
  const supabase = await createClient();
  const { data: ws } = await supabase
    .from("workspaces")
    .select("id")
    .eq("id", workspaceId)
    .maybeSingle();
  if (!ws) return;

  const safePath =
    typeof path === "string" && path.startsWith("/") && !path.startsWith("//")
      ? path
      : "/";

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_WORKSPACE_COOKIE, ws.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });

  redirect(safePath);
}
