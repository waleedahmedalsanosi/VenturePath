import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getActiveWorkspace } from "@/lib/workspace/active";

import { MarketplaceList, type ListingRow } from "./list-view";
import { MarketplaceBrowse, type BrowseRow } from "./browse-view";
import { MarketplaceTabs } from "./tabs";

export const dynamic = "force-dynamic";

type Tab = "browse" | "mine";

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab: tabRaw } = await searchParams;
  const tab: Tab = tabRaw === "mine" ? "mine" : "browse";

  const workspace = await getActiveWorkspace();
  if (!workspace) redirect("/setup");

  const supabase = await createClient();

  if (tab === "mine") {
    const { data: listings } = await supabase
      .from("share_listings")
      .select(
        "id, shareholder_id, shares_offered, ask_price_sar, notes, status, listed_at, expires_at, closed_at, shareholders(name)",
      )
      .eq("workspace_id", workspace.id)
      .is("deleted_at", null)
      .order("listed_at", { ascending: false });

    const rows = (listings ?? []) as unknown as ListingRow[];
    return (
      <>
        <MarketplaceTabs active={tab} />
        <MarketplaceList rows={rows} />
      </>
    );
  }

  // Browse tab: cross-workspace public secondary listings + exit listings.
  const [{ data: secondaryRows }, { data: exitRows }, { data: privateListingRow }] = await Promise.all([
    supabase
      .from("share_listings")
      .select(
        "id, shares_offered, ask_price_sar, listed_at, workspace_id, workspaces(name, slug), shareholders(name)",
      )
      .eq("status", "open")
      .eq("is_public", true)
      .is("deleted_at", null)
      .order("listed_at", { ascending: false })
      .limit(50),
    supabase
      .from("connection_listings")
      .select("id, public_summary, type_data, listed_at, workspace_id, workspaces(name, slug)")
      .eq("status", "open")
      .eq("listing_type", "exit")
      .is("deleted_at", null)
      .order("listed_at", { ascending: false })
      .limit(50),
    // Contextual CTA: check if the current user has an open private listing in their workspace.
    supabase
      .from("share_listings")
      .select("id")
      .eq("workspace_id", workspace.id)
      .eq("status", "open")
      .eq("is_public", false)
      .is("deleted_at", null)
      .limit(1)
      .maybeSingle(),
  ]);
  const privateListingId = privateListingRow?.id ?? null;

  const secondaries: BrowseRow[] = ((secondaryRows ?? []) as unknown as Array<{
    id: string;
    shares_offered: number | string;
    ask_price_sar: number | string;
    listed_at: string;
    workspace_id: string;
    workspaces: { name: string; slug: string | null } | null;
    shareholders: { name: string } | null;
  }>).map((r) => ({
    kind: "secondary",
    id: r.id,
    href: r.workspaces?.slug ? `/explore/${r.workspaces.slug}` : "/explore",
    workspace_name: r.workspaces?.name ?? null,
    listed_at: r.listed_at,
    shares_offered: String(r.shares_offered),
    ask_price_sar: String(r.ask_price_sar),
    shareholder_name: r.shareholders?.name ?? null,
    summary: null,
  }));

  const exits: BrowseRow[] = ((exitRows ?? []) as unknown as Array<{
    id: string;
    public_summary: string;
    type_data: Record<string, unknown> | null;
    listed_at: string;
    workspace_id: string;
    workspaces: { name: string; slug: string | null } | null;
  }>).map((r) => ({
    kind: "exit",
    id: r.id,
    href: `/connections/${r.id}`,
    workspace_name: r.workspaces?.name ?? null,
    listed_at: r.listed_at,
    shares_offered: null,
    ask_price_sar: (r.type_data?.ask_amount_sar as string | undefined) ?? null,
    shareholder_name: null,
    summary: r.public_summary,
  }));

  return (
    <>
      <MarketplaceTabs active={tab} />
      <MarketplaceBrowse secondaries={secondaries} exits={exits} privateListingId={privateListingId} />
    </>
  );
}
