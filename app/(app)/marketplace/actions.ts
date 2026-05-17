"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { logAudit } from "@/lib/audit/log";
import { sendListingNotificationEmails } from "@/lib/email/resend";
import { createClient } from "@/lib/supabase/server";
import { getActiveWorkspace } from "@/lib/workspace/active";

import {
  CreateListingSchema,
  MarkSoldSchema,
  RecordRofrSchema,
  WithdrawListingSchema,
} from "./schemas";

export interface ActionResult {
  ok: boolean;
  error?: string;
  listingId?: string;
}

const ROFR_WINDOW_DAYS = 14;

// ── Create listing ───────────────────────────────────────────────────────────

export async function createListing(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const workspace = await getActiveWorkspace();
  if (!workspace) return { ok: false, error: "No workspace found." };

  const parsed = CreateListingSchema.safeParse({
    shareholder_id: formData.get("shareholder_id"),
    shares_offered: formData.get("shares_offered"),
    ask_price_sar: formData.get("ask_price_sar"),
    notes: formData.get("notes") ?? "",
    expires_at: formData.get("expires_at") ?? "",
    is_public: formData.get("is_public") ?? "",
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const input = parsed.data;
  const isPublic = input.is_public === "1" || input.is_public === "on";

  const expiresIso = input.expires_at ? new Date(input.expires_at).toISOString() : null;

  const { data: listingId, error: rpcErr } = await supabase.rpc("create_share_listing", {
    p_workspace_id: workspace.id,
    p_shareholder_id: input.shareholder_id,
    p_shares_offered: input.shares_offered,
    p_ask_price_sar: input.ask_price_sar,
    p_notes: input.notes || null,
    p_expires_at: expiresIso,
    p_rofr_window: `${ROFR_WINDOW_DAYS} days`,
  });
  if (rpcErr || !listingId) {
    return { ok: false, error: rpcErr?.message ?? "Failed to create listing." };
  }

  // Set is_public flag after the RPC insert (the RPC's signature stays
  // stable; the flag is a workspace-owner toggle that doesn't affect the
  // RPC's business logic).
  if (isPublic) {
    await supabase
      .from("share_listings")
      .update({ is_public: true })
      .eq("id", listingId);
  }

  await logAudit({
    workspaceId: workspace.id,
    entityType: "share_listing",
    entityId: listingId,
    action: "share_listing.created",
    description: `Listed ${input.shares_offered} shares at SAR ${input.ask_price_sar}`,
    payload: {
      shareholder_id: input.shareholder_id,
      shares_offered: input.shares_offered,
      ask_price_sar: input.ask_price_sar,
    },
  });

  await notifyRofrShareholders(workspace.id, workspace.name, listingId);

  revalidatePath("/marketplace");
  revalidatePath(`/marketplace/${listingId}`);
  revalidatePath("/cap-table");
  return { ok: true, listingId };
}

// ── Withdraw listing ─────────────────────────────────────────────────────────

export async function withdrawListing(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const workspace = await getActiveWorkspace();
  if (!workspace) return { ok: false, error: "No workspace found." };

  const parsed = WithdrawListingSchema.safeParse({
    listing_id: formData.get("listing_id"),
    reason: formData.get("reason") ?? "",
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const { error } = await supabase.rpc("withdraw_share_listing", {
    p_listing_id: parsed.data.listing_id,
    p_reason: parsed.data.reason || null,
  });
  if (error) return { ok: false, error: error.message };

  await logAudit({
    workspaceId: workspace.id,
    entityType: "share_listing",
    entityId: parsed.data.listing_id,
    action: "share_listing.withdrawn",
    description: parsed.data.reason || "Listing withdrawn by seller",
  });

  revalidatePath("/marketplace");
  revalidatePath(`/marketplace/${parsed.data.listing_id}`);
  return { ok: true };
}

// ── Mark sold off-platform ───────────────────────────────────────────────────

export async function markSoldOffPlatform(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const workspace = await getActiveWorkspace();
  if (!workspace) return { ok: false, error: "No workspace found." };

  const parsed = MarkSoldSchema.safeParse({
    listing_id: formData.get("listing_id"),
    reason: formData.get("reason") ?? "",
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const { error } = await supabase.rpc("mark_share_listing_sold_off_platform", {
    p_listing_id: parsed.data.listing_id,
    p_reason: parsed.data.reason || null,
  });
  if (error) return { ok: false, error: error.message };

  await logAudit({
    workspaceId: workspace.id,
    entityType: "share_listing",
    entityId: parsed.data.listing_id,
    action: "share_listing.sold_off_platform",
    description: parsed.data.reason || "Closed off-platform via lawyer/SPA",
  });

  revalidatePath("/marketplace");
  revalidatePath(`/marketplace/${parsed.data.listing_id}`);
  return { ok: true };
}

// ── ROFR response ────────────────────────────────────────────────────────────

export async function recordRofrResponse(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const workspace = await getActiveWorkspace();
  if (!workspace) return { ok: false, error: "No workspace found." };

  const parsed = RecordRofrSchema.safeParse({
    notification_id: formData.get("notification_id"),
    response: formData.get("response"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const { error } = await supabase.rpc("record_rofr_response", {
    p_notification_id: parsed.data.notification_id,
    p_response: parsed.data.response,
  });
  if (error) return { ok: false, error: error.message };

  // Fetch the listing_id from the notification so we can revalidate the page.
  const { data: notif } = await supabase
    .from("rofr_notifications")
    .select("listing_id")
    .eq("id", parsed.data.notification_id)
    .maybeSingle();

  await logAudit({
    workspaceId: workspace.id,
    entityType: "rofr_notification",
    entityId: parsed.data.notification_id,
    action: `rofr.${parsed.data.response}`,
    description: `ROFR ${parsed.data.response} recorded`,
    payload: { listing_id: notif?.listing_id ?? null },
  });

  if (notif?.listing_id) {
    revalidatePath(`/marketplace/${notif.listing_id}`);
  }
  revalidatePath("/marketplace");
  return { ok: true };
}

// ── Visibility toggle ────────────────────────────────────────────────────────

export async function setListingVisibility(
  listingId: string,
  isPublic: boolean,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const workspace = await getActiveWorkspace();
  if (!workspace) return { ok: false, error: "No workspace found." };

  // Ownership check: listing must belong to the caller's workspace.
  const { data: listing } = await supabase
    .from("share_listings")
    .select("is_public, workspace_id")
    .eq("id", listingId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!listing) return { ok: false, error: "Listing not found." };
  if (listing.workspace_id !== workspace.id)
    return { ok: false, error: "Not your listing." };

  const from: boolean = listing.is_public ?? false;

  // ROFR gate: cannot go public while a ROFR window is still open.
  if (isPublic) {
    const { data: pending } = await supabase
      .from("rofr_notifications")
      .select("window_expires_at")
      .eq("listing_id", listingId)
      .is("response", null)
      .gt("window_expires_at", new Date().toISOString())
      .limit(1)
      .maybeSingle();
    if (pending) {
      return {
        ok: false,
        error: `ROFR window is still open until ${new Date(pending.window_expires_at).toLocaleDateString()}`,
      };
    }
  }

  const { error } = await supabase
    .from("share_listings")
    .update({ is_public: isPublic, updated_at: new Date().toISOString() })
    .eq("id", listingId);
  if (error) return { ok: false, error: error.message };

  await logAudit({
    workspaceId: workspace.id,
    entityType: "share_listing",
    entityId: listingId,
    action: "visibility_changed",
    description: `${isPublic ? "Made discoverable" : "Made private"}: share listing`,
    payload: { from, to: isPublic },
  });

  revalidatePath("/marketplace");
  revalidatePath(`/marketplace/${listingId}`);
  revalidatePath("/explore");
  return { ok: true };
}

// ── Internal: ROFR email fan-out ─────────────────────────────────────────────

async function notifyRofrShareholders(
  workspaceId: string,
  workspaceName: string,
  listingId: string,
): Promise<void> {
  const supabase = await createClient();

  const { data: listing } = await supabase
    .from("share_listings")
    .select("shares_offered, ask_price_sar, shareholder_id")
    .eq("id", listingId)
    .maybeSingle();
  if (!listing) return;

  const { data: seller } = await supabase
    .from("shareholders")
    .select("name")
    .eq("id", listing.shareholder_id)
    .maybeSingle();

  const { data: notifs } = await supabase
    .from("rofr_notifications")
    .select("id, notified_email")
    .eq("listing_id", listingId)
    .is("email_sent_at", null);

  const recipients = (notifs ?? [])
    .map((n) => n.notified_email)
    .filter((e): e is string => Boolean(e));

  if (recipients.length === 0) return;

  const host = (await headers()).get("host") ?? "venturepath.co";
  const proto = host.includes("localhost") ? "http" : "https";
  const listingUrl = `${proto}://${host}/marketplace/${listingId}`;

  const { sent } = await sendListingNotificationEmails({
    to: recipients,
    companyName: workspaceName,
    sellerName: seller?.name ?? "A shareholder",
    sharesOffered: String(listing.shares_offered),
    askPriceSar: String(listing.ask_price_sar),
    rofrWindowDays: ROFR_WINDOW_DAYS,
    listingUrl,
  });

  if (sent > 0) {
    const ids = (notifs ?? []).map((n) => n.id);
    await supabase
      .from("rofr_notifications")
      .update({ email_sent_at: new Date().toISOString() })
      .in("id", ids);
  }
}
