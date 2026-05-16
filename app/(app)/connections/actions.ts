"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { logAudit } from "@/lib/audit/log";
import {
  sendInquiryAcceptedToInquirerEmail,
  sendInquiryAcceptedToOwnerEmail,
  sendInquiryDeclinedEmail,
  sendInquirySentEmail,
  sendListingPublishedEmail,
} from "@/lib/email/connections";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/types";
import { getActiveWorkspace } from "@/lib/workspace/active";

import {
  AcceptInquirySchema,
  CloseInquirySchema,
  CreateConnectionListingSchema,
  DeclineInquirySchema,
  ExitTypeDataSchema,
  PartnershipTypeDataSchema,
  SendInquirySchema,
  WithdrawConnectionListingSchema,
} from "./schemas";

export interface ActionResult {
  ok: boolean;
  error?: string;
  listingId?: string;
  inquiryId?: string;
  emailWarning?: string; // T11: surfaces send failures separately from action success
}

async function getOriginUrl(): Promise<string> {
  const host = (await headers()).get("host") ?? "venturepath.co";
  const proto = host.includes("localhost") ? "http" : "https";
  return `${proto}://${host}`;
}

// ── Create connection listing ───────────────────────────────────────────────

export async function createConnectionListing(
  formData: FormData,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const workspace = await getActiveWorkspace();
  if (!workspace) return { ok: false, error: "No workspace found." };

  const parsed = CreateConnectionListingSchema.safeParse({
    listing_type: formData.get("listing_type"),
    public_summary: formData.get("public_summary") ?? "",
    notes: formData.get("notes") ?? "",
    type_data_json: formData.get("type_data_json") ?? "{}",
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const input = parsed.data;

  let typeData: Json;
  try {
    typeData = JSON.parse(input.type_data_json) as Json;
  } catch {
    return { ok: false, error: "Invalid type-specific data." };
  }

  // Validate type-specific data against its schema.
  if (input.listing_type === "exit") {
    const r = ExitTypeDataSchema.safeParse(typeData);
    if (!r.success) {
      return { ok: false, error: r.error.issues[0]?.message ?? "Invalid exit details." };
    }
    typeData = r.data as Json;
  } else {
    const r = PartnershipTypeDataSchema.safeParse(typeData);
    if (!r.success) {
      return { ok: false, error: r.error.issues[0]?.message ?? "Invalid partnership details." };
    }
    typeData = r.data as Json;
  }

  const { data: listingId, error: rpcErr } = await supabase.rpc(
    "create_connection_listing",
    {
      p_workspace_id: workspace.id,
      p_listing_type: input.listing_type,
      p_public_summary: input.public_summary,
      p_type_data: typeData,
      p_notes: input.notes || null,
    },
  );
  if (rpcErr || !listingId) {
    return { ok: false, error: rpcErr?.message ?? "Failed to create listing." };
  }

  await logAudit({
    workspaceId: workspace.id,
    entityType: "connection_listing",
    entityId: listingId,
    action: `connection_listing.created.${input.listing_type}`,
    description: input.public_summary.slice(0, 200),
    payload: { listing_type: input.listing_type, type_data: typeData },
  });

  // Confirmation email to the owner (best-effort).
  if (user.email) {
    const origin = await getOriginUrl();
    const { error: emailErr } = await sendListingPublishedEmail({
      to: user.email,
      ownerCompanyName: workspace.name,
      listingType: input.listing_type,
      listingUrl: `${origin}/connections/${listingId}`,
    });
    if (emailErr) {
      console.warn("[connections] listing-published email failed:", emailErr);
    }
  }

  revalidatePath("/connections");
  revalidatePath(`/connections/${listingId}`);
  revalidatePath("/dashboard");
  return { ok: true, listingId };
}

// ── Withdraw listing ────────────────────────────────────────────────────────

export async function withdrawConnectionListing(
  formData: FormData,
): Promise<ActionResult> {
  const supabase = await createClient();
  const workspace = await getActiveWorkspace();
  if (!workspace) return { ok: false, error: "No workspace found." };

  const parsed = WithdrawConnectionListingSchema.safeParse({
    listing_id: formData.get("listing_id"),
    reason: formData.get("reason") ?? "",
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const { error } = await supabase.rpc("withdraw_connection_listing", {
    p_listing_id: parsed.data.listing_id,
    p_reason: parsed.data.reason || null,
  });
  if (error) return { ok: false, error: error.message };

  await logAudit({
    workspaceId: workspace.id,
    entityType: "connection_listing",
    entityId: parsed.data.listing_id,
    action: "connection_listing.withdrawn",
    description: parsed.data.reason || "Listing withdrawn by owner",
  });

  revalidatePath("/connections");
  revalidatePath(`/connections/${parsed.data.listing_id}`);
  revalidatePath("/dashboard");
  return { ok: true };
}

// ── Send inquiry (non-owner action) ─────────────────────────────────────────

export async function sendConnectionInquiry(
  formData: FormData,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const workspace = await getActiveWorkspace();
  if (!workspace) return { ok: false, error: "No workspace found." };

  const parsed = SendInquirySchema.safeParse({
    listing_id: formData.get("listing_id"),
    message: formData.get("message") ?? "",
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const { data: inquiryId, error: rpcErr } = await supabase.rpc(
    "send_connection_inquiry",
    {
      p_listing_id: parsed.data.listing_id,
      p_inquirer_workspace_id: workspace.id,
      p_message: parsed.data.message || null,
    },
  );
  if (rpcErr || !inquiryId) {
    return { ok: false, error: rpcErr?.message ?? "Failed to send inquiry." };
  }

  await logAudit({
    workspaceId: workspace.id,
    entityType: "connection_inquiry",
    entityId: inquiryId,
    action: "connection_inquiry.sent",
    description: `Inquiry sent to listing ${parsed.data.listing_id}`,
  });

  // Email the listing owner. Best-effort; failure is logged but does not block.
  let emailWarning: string | undefined;
  try {
    const { data: ownerInfo } = await supabase.rpc(
      "get_connection_listing_owner_contact",
      { p_listing_id: parsed.data.listing_id },
    );
    const owner = Array.isArray(ownerInfo) ? ownerInfo[0] : null;
    if (owner?.owner_email) {
      const origin = await getOriginUrl();
      const { error } = await sendInquirySentEmail({
        to: owner.owner_email,
        ownerCompanyName: owner.owner_workspace_name ?? "Your company",
        listingType: owner.listing_type as "exit" | "partnership",
        inquirerCompanyName: workspace.name,
        inquirerMessage: parsed.data.message || null,
        listingUrl: `${origin}/connections/${parsed.data.listing_id}`,
      });
      if (error) emailWarning = `Owner notification email failed: ${error}`;
    } else {
      emailWarning = "Owner has no email on file; they may not see this inquiry.";
    }
  } catch (err) {
    console.warn("[connections] inquiry-sent email failed:", err);
    emailWarning = "Owner notification email failed to send.";
  }

  revalidatePath("/connections");
  revalidatePath(`/connections/${parsed.data.listing_id}`);
  return { ok: true, inquiryId, emailWarning };
}

// ── Accept inquiry (owner action) ───────────────────────────────────────────

export async function acceptConnectionInquiry(
  formData: FormData,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const workspace = await getActiveWorkspace();
  if (!workspace) return { ok: false, error: "No workspace found." };

  const parsed = AcceptInquirySchema.safeParse({
    inquiry_id: formData.get("inquiry_id"),
    access_tier: formData.get("access_tier") ?? "standard",
    token_ttl_days: formData.get("token_ttl_days") ?? 14,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  // T12 guard: only include a data room link if the owner workspace has at
  // least one published data room tier. Otherwise, accept without a link —
  // the inquirer still gets contact info, just no diligence access.
  const { count: publishedDocsCount } = await supabase
    .from("documents")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", workspace.id)
    .eq("visibility", "data_room")
    .is("deleted_at", null);
  const hasPublishedRoom = (publishedDocsCount ?? 0) > 0;

  const { data: rpcRows, error: rpcErr } = await supabase.rpc(
    "accept_connection_inquiry",
    {
      p_inquiry_id: parsed.data.inquiry_id,
      p_data_room_round_id: null,
      p_access_tier: parsed.data.access_tier,
      p_token_ttl_days: parsed.data.token_ttl_days,
    },
  );
  if (rpcErr || !rpcRows || rpcRows.length === 0) {
    return { ok: false, error: rpcErr?.message ?? "Failed to accept inquiry." };
  }
  const { data_room_token: token } = rpcRows[0];

  await logAudit({
    workspaceId: workspace.id,
    entityType: "connection_inquiry",
    entityId: parsed.data.inquiry_id,
    action: "connection_inquiry.accepted",
    description: `Accepted with ${parsed.data.access_tier} tier, ${parsed.data.token_ttl_days}d TTL`,
  });

  // Email fan-out: both parties.
  let emailWarning: string | undefined;
  try {
    const { data: contacts } = await supabase.rpc(
      "get_connection_inquiry_emails",
      { p_inquiry_id: parsed.data.inquiry_id },
    );
    const contact = Array.isArray(contacts) ? contacts[0] : null;

    if (contact) {
      const origin = await getOriginUrl();
      const dataRoomUrl = hasPublishedRoom ? `${origin}/data-room/${token}` : null;
      const ownerName =
        (user.user_metadata?.full_name as string | undefined) ?? user.email ?? "Owner";

      if (contact.inquirer_email) {
        const { error } = await sendInquiryAcceptedToInquirerEmail({
          to: contact.inquirer_email,
          inquirerCompanyName: contact.inquirer_workspace_name ?? "Your company",
          ownerCompanyName: contact.owner_workspace_name ?? workspace.name,
          ownerName,
          ownerEmail: user.email ?? "",
          listingType: contact.listing_type as "exit" | "partnership",
          dataRoomUrl,
        });
        if (error) emailWarning = `Inquirer notification email failed: ${error}`;
      }
      if (user.email && contact.inquirer_email) {
        await sendInquiryAcceptedToOwnerEmail({
          to: user.email,
          ownerCompanyName: workspace.name,
          inquirerCompanyName: contact.inquirer_workspace_name ?? "Their company",
          inquirerName: contact.inquirer_email.split("@")[0] ?? "Inquirer",
          inquirerEmail: contact.inquirer_email,
          listingType: contact.listing_type as "exit" | "partnership",
          listingUrl: `${origin}/connections/${rpcRows[0].inquiry_id}`,
        });
      }
    }
  } catch (err) {
    console.warn("[connections] accept email fan-out failed:", err);
    emailWarning = "Acceptance emails failed to send. Contact the inquirer directly.";
  }

  revalidatePath("/connections");
  revalidatePath("/dashboard");
  return { ok: true, inquiryId: parsed.data.inquiry_id, emailWarning };
}

// ── Decline inquiry (owner action) ──────────────────────────────────────────

export async function declineConnectionInquiry(
  formData: FormData,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const workspace = await getActiveWorkspace();
  if (!workspace) return { ok: false, error: "No workspace found." };

  const parsed = DeclineInquirySchema.safeParse({
    inquiry_id: formData.get("inquiry_id"),
    reason: formData.get("reason") ?? "",
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const { error: rpcErr } = await supabase.rpc("decline_connection_inquiry", {
    p_inquiry_id: parsed.data.inquiry_id,
    p_reason: parsed.data.reason || null,
  });
  if (rpcErr) return { ok: false, error: rpcErr.message };

  await logAudit({
    workspaceId: workspace.id,
    entityType: "connection_inquiry",
    entityId: parsed.data.inquiry_id,
    action: "connection_inquiry.declined",
    description: parsed.data.reason || "Declined without reason",
  });

  // Email the inquirer.
  let emailWarning: string | undefined;
  try {
    const { data: contacts } = await supabase.rpc(
      "get_connection_inquiry_emails",
      { p_inquiry_id: parsed.data.inquiry_id },
    );
    const contact = Array.isArray(contacts) ? contacts[0] : null;
    if (contact?.inquirer_email) {
      const origin = await getOriginUrl();
      const { error } = await sendInquiryDeclinedEmail({
        to: contact.inquirer_email,
        inquirerCompanyName: contact.inquirer_workspace_name ?? "Your company",
        ownerCompanyName: contact.owner_workspace_name ?? workspace.name,
        listingType: contact.listing_type as "exit" | "partnership",
        declineReason: parsed.data.reason || null,
        browseUrl: `${origin}/connections`,
      });
      if (error) emailWarning = `Decline notification email failed: ${error}`;
    }
  } catch (err) {
    console.warn("[connections] decline email failed:", err);
    emailWarning = "Decline email failed to send.";
  }

  revalidatePath("/connections");
  if (formData.get("listing_id")) {
    revalidatePath(`/connections/${formData.get("listing_id")}`);
  }
  return { ok: true, emailWarning };
}

// ── Close inquiry (either party, post-accept) ───────────────────────────────

export async function closeConnectionInquiry(
  formData: FormData,
): Promise<ActionResult> {
  const supabase = await createClient();
  const workspace = await getActiveWorkspace();
  if (!workspace) return { ok: false, error: "No workspace found." };

  const parsed = CloseInquirySchema.safeParse({
    inquiry_id: formData.get("inquiry_id"),
    reason: formData.get("reason") ?? "",
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const { error } = await supabase.rpc("close_connection_inquiry", {
    p_inquiry_id: parsed.data.inquiry_id,
    p_reason: parsed.data.reason || null,
  });
  if (error) return { ok: false, error: error.message };

  await logAudit({
    workspaceId: workspace.id,
    entityType: "connection_inquiry",
    entityId: parsed.data.inquiry_id,
    action: "connection_inquiry.closed",
    description: parsed.data.reason || "Closed by participant",
  });

  revalidatePath("/connections");
  return { ok: true };
}
