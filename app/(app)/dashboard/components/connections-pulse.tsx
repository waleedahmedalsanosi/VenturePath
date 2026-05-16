import { createClient } from "@/lib/supabase/server";

import { ConnectionsPulseTiles } from "./connections-pulse-client";

export async function ConnectionsPulse({ workspaceId }: { workspaceId: string }) {
  const supabase = await createClient();

  const { data: openListings } = await supabase
    .from("connection_listings")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("status", "open")
    .is("deleted_at", null);
  const openCount = (openListings ?? []).length;
  const listingIds = (openListings ?? []).map((l) => l.id);

  let newInquiries = 0;
  if (listingIds.length > 0) {
    // eslint-disable-next-line react-hooks/purity -- server component, runs once per request
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: inquiries } = await supabase
      .from("connection_inquiries")
      .select("id")
      .in("listing_id", listingIds)
      .gte("sent_at", sevenDaysAgo)
      .is("deleted_at", null);
    newInquiries = (inquiries ?? []).length;
  }

  if (openCount === 0 && newInquiries === 0) {
    return null;
  }

  return <ConnectionsPulseTiles openCount={openCount} newInquiries={newInquiries} />;
}
