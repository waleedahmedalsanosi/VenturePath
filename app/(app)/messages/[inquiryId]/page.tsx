import { notFound, redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { listAccessibleWorkspaces } from "@/lib/workspace/active";

import { ThreadView, type ThreadInquiry, type ThreadMessage } from "./thread-view";

export const dynamic = "force-dynamic";

export default async function ThreadPage({
  params,
}: {
  params: Promise<{ inquiryId: string }>;
}) {
  const { inquiryId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const workspaces = await listAccessibleWorkspaces();
  if (workspaces.length === 0) redirect("/setup");

  const myWorkspaceIds = workspaces.map((w) => w.id);

  // Fetch inquiry with listing + workspace info. RLS gates to parties only.
  const { data: inquiryRow } = await supabase
    .from("connection_inquiries")
    .select(
      `
      id,
      status,
      message,
      sent_at,
      inquirer_user_id,
      inquirer_workspace_id,
      listing_id,
      listing:connection_listings (
        id,
        listing_type,
        public_summary,
        workspace_id,
        workspaces ( name )
      ),
      inquirer_workspace:workspaces!connection_inquiries_inquirer_workspace_id_fkey ( name )
      `,
    )
    .eq("id", inquiryId)
    .is("deleted_at", null)
    .maybeSingle();

  if (!inquiryRow) notFound();

  const row = inquiryRow as unknown as {
    id: string;
    status: "sent" | "accepted" | "declined" | "closed";
    message: string | null;
    sent_at: string;
    inquirer_user_id: string;
    inquirer_workspace_id: string;
    listing_id: string;
    listing: {
      id: string;
      listing_type: "exit" | "partnership";
      public_summary: string;
      workspace_id: string;
      workspaces: { name: string } | null;
    } | null;
    inquirer_workspace: { name: string } | null;
  };

  const isOutgoing = myWorkspaceIds.includes(row.inquirer_workspace_id);
  const counterparty = isOutgoing
    ? row.listing?.workspaces?.name ?? null
    : row.inquirer_workspace?.name ?? null;

  const inquiry: ThreadInquiry = {
    id: row.id,
    status: row.status,
    listingId: row.listing_id,
    listingType: row.listing?.listing_type ?? "partnership",
    listingSummary: row.listing?.public_summary ?? "",
    counterparty,
    sentAt: row.sent_at,
  };

  // Fetch messages — RLS ensures only parties can read.
  const { data: msgRows } = await supabase
    .from("connection_inquiry_messages")
    .select("id, body, sender_user_id, created_at")
    .eq("inquiry_id", inquiryId)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });

  const messages: ThreadMessage[] = ((msgRows ?? []) as Array<{
    id: string;
    body: string;
    sender_user_id: string;
    created_at: string;
  }>).map((m) => ({
    id: m.id,
    body: m.body,
    senderUserId: m.sender_user_id,
    createdAt: m.created_at,
  }));

  return (
    <ThreadView
      inquiry={inquiry}
      messages={messages}
      currentUserId={user.id}
    />
  );
}
