import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getActiveWorkspace } from "@/lib/workspace/active";

import { ConnectionsBrowse, type Listing } from "./browse";

export const dynamic = "force-dynamic";

type FilterType = "all" | "exit" | "partnership" | "mine";

export default async function ConnectionsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter: filterRaw } = await searchParams;
  const filter: FilterType = ["all", "exit", "partnership", "mine"].includes(filterRaw ?? "")
    ? (filterRaw as FilterType)
    : "all";

  const workspace = await getActiveWorkspace();
  if (!workspace) redirect("/setup");

  const supabase = await createClient();

  let query = supabase
    .from("connection_listings")
    .select("id, workspace_id, listing_type, status, public_summary, type_data, listed_at, workspaces(name)")
    .eq("status", "open")
    .is("deleted_at", null)
    .order("listed_at", { ascending: false });

  if (filter === "exit") query = query.eq("listing_type", "exit");
  if (filter === "partnership") query = query.eq("listing_type", "partnership");
  if (filter === "mine") query = query.eq("workspace_id", workspace.id);

  const { data: rows } = await query;
  const listings = (rows ?? []) as unknown as Listing[];

  return <ConnectionsBrowse filter={filter} listings={listings} />;
}
