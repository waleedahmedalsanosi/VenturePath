"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export interface ActionResult {
  ok: boolean;
  error?: string;
  flag?: string;
}

// ── Password change ───────────────────────────────────────────────────────────
// Note: Supabase updateUser({ password }) does not re-verify the current
// password server-side; the currentPassword field is shown in the UI purely
// for friction / UX confirmation. Enforce min-length here.
export async function updatePassword(
  _currentPassword: string,
  newPassword: string,
): Promise<ActionResult> {
  if (newPassword.length < 8) {
    return { ok: false, error: "Password must be at least 8 characters." };
  }
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

// ── Email change ──────────────────────────────────────────────────────────────
// Supabase sends a verify-new-email flow automatically.
export async function updateEmail(newEmail: string): Promise<ActionResult> {
  if (!newEmail || !newEmail.includes("@")) {
    return { ok: false, error: "Enter a valid email address." };
  }
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ email: newEmail });
  if (error) return { ok: false, error: error.message };
  return { ok: true, flag: "verify-email-sent" };
}

// ── Preferences ───────────────────────────────────────────────────────────────
export async function updateUserPreferences(prefs: {
  date_format: "iso" | "us" | "eu";
  timezone: string;
}): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  if (!["iso", "us", "eu"].includes(prefs.date_format)) {
    return { ok: false, error: "Invalid date format." };
  }
  if (!prefs.timezone || prefs.timezone.trim() === "") {
    return { ok: false, error: "Timezone is required." };
  }

  const { error } = await supabase.from("user_profiles").upsert(
    {
      user_id: user.id,
      date_format: prefs.date_format,
      timezone: prefs.timezone.trim(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
  if (error) return { ok: false, error: error.message };

  revalidatePath("/settings");
  return { ok: true };
}

// ── Notification preference ───────────────────────────────────────────────────
// NOTE: Existing notification triggers do NOT yet check this table.
// Honoring preferences at send-time is a v2 item. This action persists the
// user's intent; enforcement ships later.
type NotificationType =
  | "inquiry_received"
  | "inquiry_accepted"
  | "inquiry_declined"
  | "rofr_notified"
  | "investor_update_opened"
  | "compliance_overdue"
  | "round_visibility_changed";

export async function updateNotificationPreference(
  type: NotificationType,
  channel: "email" | "inapp",
  enabled: boolean,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const patch =
    channel === "email"
      ? { email_enabled: enabled }
      : { inapp_enabled: enabled };

  const { error } = await supabase
    .from("user_notification_preferences")
    .upsert(
      {
        user_id: user.id,
        notification_type: type,
        ...patch,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,notification_type" },
    );
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

// ── Data export ───────────────────────────────────────────────────────────────
// Gathers all user data into a JSON blob and returns it.
// The client triggers a file download from the returned JSON string.
export async function requestDataExport(): Promise<
  ActionResult & { json?: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const uid = user.id;

  // 1. Auth identity
  const identity = {
    id: user.id,
    email: user.email,
    created_at: user.created_at,
  };

  // 2. User profile
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("user_id", uid)
    .maybeSingle();

  // 3. Owned workspaces
  const { data: ownedWorkspaces } = await supabase
    .from("workspaces")
    .select("*")
    .eq("owner_user_id", uid);

  const ownedIds = (ownedWorkspaces ?? []).map((w) => w.id);

  // 4. Joined workspaces (member but not owner)
  const { data: memberships } = await supabase
    .from("workspace_members")
    .select("*, workspaces(*)")
    .eq("user_id", uid);

  // 5. Shareholders in owned workspaces
  const { data: shareholders } =
    ownedIds.length > 0
      ? await supabase
          .from("shareholders")
          .select("*")
          .in("workspace_id", ownedIds)
      : { data: [] };

  // 6. Financing rounds in owned workspaces
  const { data: financingRounds } =
    ownedIds.length > 0
      ? await supabase
          .from("financing_rounds")
          .select("*")
          .in("workspace_id", ownedIds)
      : { data: [] };

  // 7. Share listings in owned workspaces
  const { data: shareListings } =
    ownedIds.length > 0
      ? await supabase
          .from("share_listings")
          .select("*")
          .in("workspace_id", ownedIds)
      : { data: [] };

  // 8. Connection listings in owned workspaces
  const { data: connectionListings } =
    ownedIds.length > 0
      ? await supabase
          .from("connection_listings")
          .select("*")
          .in("workspace_id", ownedIds)
      : { data: [] };

  // 9. Account notifications for this user
  const { data: notifications } = await supabase
    .from("account_notifications")
    .select("*")
    .eq("user_id", uid);

  // 10. Audit events where this user was the actor
  const { data: auditEvents } = await supabase
    .from("audit_events")
    .select("*")
    .eq("actor_user_id", uid);

  const exportPayload = {
    exported_at: new Date().toISOString(),
    identity,
    profile: profile ?? null,
    owned_workspaces: ownedWorkspaces ?? [],
    workspace_memberships: memberships ?? [],
    shareholders: shareholders ?? [],
    financing_rounds: financingRounds ?? [],
    share_listings: shareListings ?? [],
    connection_listings: connectionListings ?? [],
    account_notifications: notifications ?? [],
    audit_events: auditEvents ?? [],
  };

  return { ok: true, json: JSON.stringify(exportPayload, null, 2) };
}

// ── Account deletion request ──────────────────────────────────────────────────
// Inserts a request row; actual deletion is performed by admin review within 30 days.
// The user cannot update or delete this row (INSERT-only RLS).
export async function requestAccountDeletion(
  reason: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const { error } = await supabase.from("account_deletion_requests").insert({
    user_id: user.id,
    reason: reason.trim() || null,
    status: "pending",
  });

  if (error) {
    // Duplicate key = request already exists
    if (error.code === "23505") {
      return {
        ok: true,
        flag: "already-requested",
      };
    }
    return { ok: false, error: error.message };
  }

  return { ok: true };
}
