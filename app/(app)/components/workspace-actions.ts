"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { ACTIVE_WORKSPACE_COOKIE } from "@/lib/workspace/active";
import { createClient } from "@/lib/supabase/server";

export async function switchWorkspace(workspaceId: string): Promise<void> {
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

  redirect("/");
}
