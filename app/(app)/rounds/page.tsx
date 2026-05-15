import { redirect } from "next/navigation";
import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import { getActiveWorkspace } from "@/lib/workspace/active";

import { RoundsList } from "./rounds-list";

export default async function RoundsPage() {
  const workspace = await getActiveWorkspace();
  if (!workspace) redirect("/setup");

  const supabase = await createClient();
  const { data: rounds } = await supabase
    .from("financing_rounds")
    .select("id, name, instrument_type, pre_money_valuation_sar, target_raise_sar, close_date, status, is_public, lead_investor")
    .eq("workspace_id", workspace.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  return (
    <main className="mx-auto max-w-5xl px-6 py-10 space-y-8">
      <header>
        <p className="text-label-md uppercase text-(--color-on-surface-variant)">
          Fundraising
        </p>
        <h1 className="mt-1 text-display-sm font-semibold tracking-tight">
          {workspace.name}
        </h1>
        <p className="mt-2 text-body-md text-(--color-on-surface-variant)">
          Manage your fundraising rounds end-to-end. Open a round, add investors,
          and close — your cap table updates automatically when you close.
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
