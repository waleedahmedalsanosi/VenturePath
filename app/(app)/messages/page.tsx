import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { listAccessibleWorkspaces } from "@/lib/workspace/active";

import { MessagesView, type InquiryRow } from "./messages-view";

export const dynamic = "force-dynamic";

type Direction = "incoming" | "outgoing";

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ direction?: string; status?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const workspaces = await listAccessibleWorkspaces();
  if (workspaces.length === 0) redirect("/setup");

  const myWorkspaceIds = workspaces.map((w) => w.id);

  const { direction: dirRaw, status: statusRaw } = await searchParams;
  const direction: Direction | "all" =
    dirRaw === "incoming" || dirRaw === "outgoing" ? dirRaw : "all";
  const statusFilter =
    statusRaw === "sent" || statusRaw === "accepted" || statusRaw === "declined" || statusRaw === "closed"
      ? statusRaw
      : null;

  // RLS allows reading inquiries where the user's workspaces are on either
  // side, so a single query against the table returns the user's full inbox.
  // We then split incoming/outgoing in JS based on workspace IDs.
  let query = supabase
    .from("connection_inquiries")
    .select(
      `
      id,
      status,
      message,
      sent_at,
      responded_at,
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
    .is("deleted_at", null)
    .order("sent_at", { ascending: false })
    .limit(100);

  if (statusFilter) query = query.eq("status", statusFilter);

  const { data } = await query;

  const rows: InquiryRow[] = ((data ?? []) as unknown as Array<{
    id: string;
    status: "sent" | "accepted" | "declined" | "closed";
    message: string | null;
    sent_at: string;
    responded_at: string | null;
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
  }>).map((r) => {
    const isOutgoing = myWorkspaceIds.includes(r.inquirer_workspace_id);
    return {
      id: r.id,
      status: r.status,
      message: r.message,
      sentAt: r.sent_at,
      respondedAt: r.responded_at,
      listingId: r.listing_id,
      listingType: r.listing?.listing_type ?? "partnership",
      listingSummary: r.listing?.public_summary ?? "",
      direction: isOutgoing ? "outgoing" : "incoming",
      // Counterparty name: if we sent it, that's the listing owner; if we
      // received it, that's the inquirer workspace.
      counterparty: isOutgoing
        ? r.listing?.workspaces?.name ?? null
        : r.inquirer_workspace?.name ?? null,
    };
  });

  const filtered =
    direction === "all" ? rows : rows.filter((r) => r.direction === direction);

  return (
    <MessagesView
      rows={filtered}
      direction={direction}
      statusFilter={statusFilter}
      counts={{
        all: rows.length,
        incoming: rows.filter((r) => r.direction === "incoming").length,
        outgoing: rows.filter((r) => r.direction === "outgoing").length,
      }}
    />
  );
}
