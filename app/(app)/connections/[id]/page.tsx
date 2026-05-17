import { notFound, redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getActiveWorkspace } from "@/lib/workspace/active";

import { ConnectionDetailView, type DetailListing, type ReceivedInquiry } from "./detail-view";
import { type InquiryView } from "./inquiry-cta";

export const dynamic = "force-dynamic";

export default async function ConnectionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const workspace = await getActiveWorkspace();
  if (!workspace) redirect("/setup");

  const supabase = await createClient();

  const { data: listingRow } = await supabase
    .from("connection_listings")
    .select(
      "id, workspace_id, owner_user_id, listing_type, status, public_summary, type_data, notes, listed_at, closed_at, closed_reason, workspaces(name)",
    )
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (!listingRow) notFound();
  const listing = listingRow as unknown as DetailListing;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isOwner = user?.id === listing.owner_user_id;

  let myInquiry: InquiryView | null = null;
  if (!isOwner && user) {
    const { data: inq } = await supabase
      .from("connection_inquiries")
      .select(
        "id, status, sent_at, responded_at, closed_at, data_room_link_id",
      )
      .eq("listing_id", listing.id)
      .eq("inquirer_user_id", user.id)
      .is("deleted_at", null)
      .order("sent_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (inq) {
      let token: string | null = null;
      let ownerEmail: string | null = null;
      if (inq.status === "accepted") {
        const { data: contacts } = await supabase.rpc(
          "get_connection_inquiry_emails",
          { p_inquiry_id: inq.id },
        );
        const contact = Array.isArray(contacts) ? contacts[0] : null;
        ownerEmail = contact?.owner_email ?? null;
        if (inq.data_room_link_id) {
          const { data: link } = await supabase
            .from("data_room_links")
            .select("token")
            .eq("id", inq.data_room_link_id)
            .maybeSingle();
          token = (link as { token?: string } | null)?.token ?? null;
        }
      }
      myInquiry = {
        id: inq.id,
        status: inq.status,
        sent_at: inq.sent_at,
        responded_at: inq.responded_at,
        closed_at: inq.closed_at,
        data_room_token: token,
        owner_email: ownerEmail,
        owner_name: null,
      };
    }
  }

  let receivedInquiries: ReceivedInquiry[] = [];
  if (isOwner) {
    const { data: rows } = await supabase
      .from("connection_inquiries")
      .select(
        "id, status, sent_at, responded_at, message, inquirer_workspace_id, workspaces!connection_inquiries_inquirer_workspace_id_fkey(name)",
      )
      .eq("listing_id", listing.id)
      .is("deleted_at", null)
      .order("sent_at", { ascending: false });
    receivedInquiries = (rows ?? []) as unknown as ReceivedInquiry[];
  }

  // Compute equity visibility:
  // - Owner always sees their own terms.
  // - Non-owner sees terms only when they have an accepted inquiry.
  const canSeeEquityTerms =
    isOwner || (myInquiry !== null && myInquiry.status === "accepted");

  return (
    <ConnectionDetailView
      listing={listing}
      isOwner={isOwner}
      myInquiry={myInquiry}
      receivedInquiries={receivedInquiries}
      canSeeEquityTerms={canSeeEquityTerms}
    />
  );
}
