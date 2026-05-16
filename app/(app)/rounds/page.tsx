import { redirect } from "next/navigation";
import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import { getActiveWorkspace } from "@/lib/workspace/active";

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

  if (tab === "mine") {
    const { data: rounds } = await supabase
      .from("financing_rounds")
      .select(
        "id, name, instrument_type, pre_money_valuation_sar, target_raise_sar, close_date, status, is_public, lead_investor",
      )
      .eq("workspace_id", workspace.id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    return (
      <main className="mx-auto max-w-5xl px-6 py-10 space-y-8">
        <RoundsTabs active={tab} />
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

  // Open rounds tab: cross-workspace public open rounds.
  const { data: openRows } = await supabase
    .from("financing_rounds")
    .select(
      "id, name, instrument_type, pre_money_valuation_sar, target_raise_sar, close_date, lead_investor, created_at, workspace_id, workspaces(name, slug)",
    )
    .eq("status", "open")
    .eq("is_public", true)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(50);

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
      <RoundsTabs active={tab} />
      <RoundsBrowse rows={open} />
    </main>
  );
}
