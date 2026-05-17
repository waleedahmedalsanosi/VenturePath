import { redirect } from "next/navigation";
import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import { getActiveWorkspace, listAccessibleWorkspaces } from "@/lib/workspace/active";

import { RoundsList } from "./rounds-list";
import { RoundsBrowse, type BrowseRoundRow } from "./browse-view";
import { RoundsTabs } from "./tabs";

export const dynamic = "force-dynamic";

type Tab = "open" | "mine";

export default async function RoundsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab: tabRaw } = await searchParams;
  const tab: Tab = tabRaw === "mine" ? "mine" : "open";

  const workspace = await getActiveWorkspace();
  if (!workspace) redirect("/setup");

  const supabase = await createClient();

  // Fetch the user's own workspace IDs to exclude from the discovery feed.
  const myWorkspaces = await listAccessibleWorkspaces();
  const myWorkspaceIds = myWorkspaces.map((w) => w.id);

  if (tab === "mine") {
    const [{ data: rounds }, { count: openCount }] = await Promise.all([
      supabase
        .from("financing_rounds")
        .select(
          "id, name, instrument_type, pre_money_valuation_sar, target_raise_sar, close_date, status, is_public, lead_investor",
        )
        .eq("workspace_id", workspace.id)
        .is("deleted_at", null)
        .order("created_at", { ascending: false }),
      // Count cross-workspace public open rounds (excluding own) for the "Open rounds" tab badge.
      (() => {
        let q = supabase
          .from("financing_rounds")
          .select("id", { count: "exact", head: true })
          .eq("status", "open")
          .eq("is_public", true)
          .is("deleted_at", null);
        if (myWorkspaceIds.length > 0)
          q = q.not("workspace_id", "in", `(${myWorkspaceIds.join(",")})`);
        return q;
      })(),
    ]);

    return (
      <main className="mx-auto max-w-5xl px-6 py-10 space-y-8">
        <RoundsTabs active={tab} mineCount={rounds?.length ?? 0} openCount={openCount ?? 0} />
        <header>
          <p className="text-label-md uppercase text-(--color-on-surface-variant)">
            Fundraising
          </p>
          <h1 className="mt-1 text-display-sm font-semibold tracking-tight">
            {workspace.name}
          </h1>
          <p className="mt-2 text-body-md text-(--color-on-surface-variant)">
            Manage your fundraising rounds end-to-end. Open a round, add
            investors, and close — your cap table updates automatically when you
            close.
          </p>
        </header>

        <div className="flex items-center justify-between">
          <h2 className="text-label-md uppercase text-(--color-on-surface-variant)">
            Rounds
          </h2>
          <Link
            href="/rounds/new"
            className="rounded-lg ghost-border px-4 py-2 text-label-sm hover:bg-(--color-surface-container-high)"
          >
            + New round
          </Link>
        </div>

        <RoundsList rounds={rounds ?? []} workspaceName={workspace.name} />
      </main>
    );
  }

  // Open rounds tab: cross-workspace public open rounds, excluding own workspaces.
  let openQuery = supabase
    .from("financing_rounds")
    .select(
      "id, name, instrument_type, pre_money_valuation_sar, target_raise_sar, close_date, lead_investor, created_at, workspace_id, workspaces(name, slug)",
    )
    .eq("status", "open")
    .eq("is_public", true)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(50);
  if (myWorkspaceIds.length > 0)
    openQuery = openQuery.not("workspace_id", "in", `(${myWorkspaceIds.join(",")})`);

  // Mine count: workspace's own rounds (any status, not deleted).
  const [{ data: openRows }, { count: mineCount }, { data: privateRoundRow }] = await Promise.all([
    openQuery,
    supabase
      .from("financing_rounds")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspace.id)
      .is("deleted_at", null),
    // Contextual CTA: check if the current user has an open private round in their workspace.
    supabase
      .from("financing_rounds")
      .select("id")
      .eq("workspace_id", workspace.id)
      .eq("status", "open")
      .eq("is_public", false)
      .is("deleted_at", null)
      .limit(1)
      .maybeSingle(),
  ]);
  const privateRoundId = privateRoundRow?.id ?? null;

  const open: BrowseRoundRow[] = ((openRows ?? []) as unknown as Array<{
    id: string;
    name: string;
    instrument_type: string;
    pre_money_valuation_sar: number | string | null;
    target_raise_sar: number | string | null;
    close_date: string | null;
    lead_investor: string | null;
    created_at: string;
    workspace_id: string;
    workspaces: { name: string; slug: string | null } | null;
  }>).map((r) => ({
    id: r.id,
    name: r.name,
    instrument_type: r.instrument_type,
    pre_money_valuation_sar: r.pre_money_valuation_sar
      ? String(r.pre_money_valuation_sar)
      : null,
    target_raise_sar: r.target_raise_sar ? String(r.target_raise_sar) : null,
    close_date: r.close_date,
    lead_investor: r.lead_investor,
    listed_at: r.created_at,
    workspace_name: r.workspaces?.name ?? null,
    workspace_slug: r.workspaces?.slug ?? null,
  }));

  return (
    <main className="mx-auto max-w-5xl px-6 py-10 space-y-8">
      <RoundsTabs active={tab} openCount={open.length} mineCount={mineCount ?? 0} />
      <RoundsBrowse rows={open} privateRoundId={privateRoundId} />
    </main>
  );
}
