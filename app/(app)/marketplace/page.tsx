import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getActiveWorkspace } from "@/lib/workspace/active";

import { MarketplaceList, type ListingRow } from "./list-view";

export const dynamic = "force-dynamic";

export default async function MarketplacePage() {
  const workspace = await getActiveWorkspace();
  if (!workspace) redirect("/setup");

  const supabase = await createClient();
  const { data: listings } = await supabase
    .from("share_listings")
    .select(
      "id, shareholder_id, shares_offered, ask_price_sar, notes, status, listed_at, expires_at, closed_at, shareholders(name)",
    )
    .eq("workspace_id", workspace.id)
    .is("deleted_at", null)
    .order("listed_at", { ascending: false });

  const rows = (listings ?? []) as unknown as ListingRow[];

  return <MarketplaceList rows={rows} />;
}
