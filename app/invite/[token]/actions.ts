"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export interface AcceptResult {
  ok: boolean;
  error?: string;
}

export async function acceptInvitation(token: string): Promise<AcceptResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  // Use the SECURITY DEFINER RPC defined in migration 20260515120001.
  // It does atomic check + insert + mark-accepted.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.rpc as any)("accept_invitation", {
    invite_token: token,
  });

  if (error) {
    // Postgres exceptions surface here. Map common ones.
    const msg = error.message.toLowerCase();
    if (msg.includes("not signed in")) return { ok: false, error: "Not signed in." };
    if (msg.includes("not found"))
      return { ok: false, error: "Invitation not found or already used." };
    if (msg.includes("already accepted"))
      return { ok: false, error: "This invitation was already accepted." };
    if (msg.includes("expired"))
      return { ok: false, error: "This invitation has expired." };
    return { ok: false, error: error.message };
  }

  // data is the workspace_id (returned from the RPC).
  if (!data) {
    return { ok: false, error: "Acceptance failed silently." };
  }

  redirect("/");
}
