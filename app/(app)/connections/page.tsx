import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getActiveWorkspace, listAccessibleWorkspaces } from "@/lib/workspace/active";

import { ConnectionsBrowse, type Listing } from "./browse";

export const dynamic = "force-dynamic";

type FilterType = "all" | "exit" | "partnership" | "mine";
type SeekingType = "co_founder" | "advisor" | "senior_hire" | "business_partner";

const VALID_SEEKING: SeekingType[] = [
  "co_founder",
  "advisor",
  "senior_hire",
  "business_partner",
];

export default async function ConnectionsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; seeking?: string; role?: string }>;
}) {
  const { filter: filterRaw, seeking: seekingRaw, role: roleRaw } = await searchParams;
  // `role` is an alias the sidebar uses for talents/advisors. Map common
  // aliases to canonical seeking_type values so the same URL works whether
  // it was opened from the sidebar (?role=advisor) or from a filter chip
  // (?seeking=advisor).
  const seekingCandidate = seekingRaw ?? mapRoleToSeeking(roleRaw);
  const seeking: SeekingType | null = VALID_SEEKING.includes(
    seekingCandidate as SeekingType,
  )
    ? (seekingCandidate as SeekingType)
    : null;

  // A seeking filter implies partnership, even if filter wasn't passed.
  const filter: FilterType = seeking
    ? "partnership"
    : ["all", "exit", "partnership", "mine"].includes(filterRaw ?? "")
      ? (filterRaw as FilterType)
      : "all";

  const workspace = await getActiveWorkspace();
  if (!workspace) redirect("/setup");

  const supabase = await createClient();

  // Fetch the user's own workspace IDs to exclude from the cross-workspace discovery feed.
  // "mine" filter shows only own listings, so exclusion only applies to all/exit/partnership.
  const myWorkspaces = await listAccessibleWorkspaces();
  const myWorkspaceIds = myWorkspaces.map((w) => w.id);

  // Main listing query for the selected filter.
  let query = supabase
    .from("connection_listings")
    .select("id, workspace_id, listing_type, status, public_summary, type_data, listed_at, workspaces(name)")
    .eq("status", "open")
    .is("deleted_at", null)
    .order("listed_at", { ascending: false });

  if (filter === "exit") query = query.eq("listing_type", "exit");
  if (filter === "partnership") query = query.eq("listing_type", "partnership");
  if (filter === "mine") {
    query = query.eq("workspace_id", workspace.id);
  } else if (myWorkspaceIds.length > 0) {
    // Exclude own workspaces from cross-workspace discovery.
    query = query.not("workspace_id", "in", `(${myWorkspaceIds.join(",")})`);
  }
  if (seeking) {
    // REQ-PART-01: use the indexed first-class column instead of JSONB path.
    query = query.eq("seeking_type", seeking);
  }

  // Parallel count queries for the 4 filter chip badges.
  // "all", "exit", "partnership" exclude own workspaces; "mine" scopes to own workspace.
  const buildCountQuery = (listingType: "exit" | "partnership" | null, ownOnly: boolean) => {
    let q = supabase
      .from("connection_listings")
      .select("id", { count: "exact", head: true })
      .eq("status", "open")
      .is("deleted_at", null);
    if (listingType) q = q.eq("listing_type", listingType);
    if (ownOnly) {
      q = q.eq("workspace_id", workspace.id);
    } else if (myWorkspaceIds.length > 0) {
      q = q.not("workspace_id", "in", `(${myWorkspaceIds.join(",")})`);
    }
    return q;
  };

  const [
    { data: rows },
    { count: allCount },
    { count: exitCount },
    { count: partnershipCount },
    { count: mineCount },
  ] = await Promise.all([
    query,
    buildCountQuery(null, false),
    buildCountQuery("exit", false),
    buildCountQuery("partnership", false),
    buildCountQuery(null, true),
  ]);

  const listings = (rows ?? []) as unknown as Listing[];
  const chipCounts = {
    all: allCount ?? 0,
    exit: exitCount ?? 0,
    partnership: partnershipCount ?? 0,
    mine: mineCount ?? 0,
  };

  return <ConnectionsBrowse filter={filter} seeking={seeking} listings={listings} chipCounts={chipCounts} />;
}

function mapRoleToSeeking(role: string | undefined): string | undefined {
  if (!role) return undefined;
  if (role === "talent" || role === "talents") return "senior_hire";
  if (role === "advisor" || role === "advisors") return "advisor";
  return role;
}
