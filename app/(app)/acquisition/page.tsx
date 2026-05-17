import { redirect } from "next/navigation";

import { Dec } from "@/lib/cap-table/decimal";
import { vestedFraction } from "@/lib/esop/vesting";
import { createClient } from "@/lib/supabase/server";
import { getActiveWorkspace } from "@/lib/workspace/active";
import type { Database } from "@/lib/supabase/types";

import { AcquisitionModeler, type AcqSeed } from "./modeler";

type AcquisitionModel = Database["public"]["Tables"]["acquisition_models"]["Row"];
type AcquisitionModelResult = Database["public"]["Tables"]["acquisition_model_results"]["Row"];

export interface SavedModel extends AcquisitionModel {
  results: AcquisitionModelResult[];
}

export default async function AcquisitionPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const workspace = await getActiveWorkspace();
  if (!workspace) redirect("/setup");

  const [
    { data: shareholders },
    { data: pool },
    { data: grants },
    { data: savedModels },
    { data: exitListings },
  ] = await Promise.all([
    supabase
      .from("shareholders")
      .select("*")
      .eq("workspace_id", workspace.id)
      .is("deleted_at", null)
      .order("created_at", { ascending: true }),
    supabase
      .from("esop_pools")
      .select("id, total_pool_shares, strike_price_reference_sar")
      .eq("workspace_id", workspace.id)
      .maybeSingle(),
    supabase
      .from("esop_grants")
      .select("*")
      .eq("workspace_id", workspace.id)
      .is("deleted_at", null),
    supabase
      .from("acquisition_models")
      .select("*, acquisition_model_results(*)")
      .eq("workspace_id", workspace.id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
    supabase
      .from("connection_listings")
      .select("id, listing_type, public_summary")
      .eq("workspace_id", workspace.id)
      .eq("listing_type", "exit")
      .eq("status", "open")
      .is("deleted_at", null),
  ]);

  const seed: AcqSeed = (shareholders ?? [])
    .map((row) => {
      const data = row.instrument_data as Record<string, string>;
      if (row.instrument_type === "ordinary") {
        return { id: row.id, name: row.name, kind: "ordinary" as const, shares: data.shares ?? "0" };
      }
      const conversion = data.conversion_status ?? "unconverted";
      if (conversion !== "unconverted") return null;
      const investment = data.investment_sar ?? data.principal_sar ?? "0";
      const cap = data.valuation_cap_sar ?? "0";
      if (Number(cap) === 0) return null;
      return {
        id: row.id,
        name: row.name,
        kind: "convertible" as const,
        investment_sar: investment,
        valuation_cap_sar: cap,
      };
    })
    .filter((r): r is AcqSeed[number] => r !== null);

  // ESOP stats for the modeler.
  let esopAllocated = "0";
  let esopVested = "0";
  if (pool && grants) {
    let allocated = new Dec(0);
    let vested = new Dec(0);
    for (const g of grants) {
      const opts = new Dec(g.options_count);
      allocated = allocated.plus(opts);
      vested = vested.plus(opts.mul(vestedFraction(g)));
    }
    esopAllocated = allocated.toFixed(0);
    esopVested = vested.toFixed(0);
  }

  // Reshape saved models to include results
  const models: SavedModel[] = (savedModels ?? []).map((m) => {
    const { acquisition_model_results: results, ...rest } = m as AcquisitionModel & {
      acquisition_model_results: AcquisitionModelResult[];
    };
    return { ...rest, results: results ?? [] };
  });

  const openExitListings = (exitListings ?? []).map((l) => ({
    id: l.id,
    label: l.public_summary ?? "Exit listing",
  }));

  return (
    <main className="mx-auto max-w-5xl px-6 py-10 space-y-8">
      <header>
        <p className="text-label-md uppercase text-(--color-on-surface-variant)">
          M&amp;A Modeler
        </p>
        <h1 className="mt-1 text-display-sm font-semibold tracking-tight">
          {workspace.name}
        </h1>
        <p className="mt-2 text-body-md text-(--color-on-surface-variant)">
          Model how an acquisition distributes proceeds across shareholders, preference
          stack, and ESOP pool. Choose deal structure, enter earn-out terms, and
          configure management carve-out.
        </p>
      </header>

      <AcquisitionModeler
        seed={seed}
        esopAllocated={esopAllocated}
        esopVested={esopVested}
        esopStrikeRef={pool?.strike_price_reference_sar != null ? String(pool.strike_price_reference_sar) : null}
        savedModels={models}
        openExitListings={openExitListings}
        workspaceId={workspace.id}
      />

      <div className="rounded-md bg-(--color-warning)/10 px-4 py-3 text-body-sm text-(--color-warning)">
        Directional estimate only — not legal or financial advice. Real acquisition
        economics depend on precise preference stack ordering, participating vs
        non-participating terms, ratchets, drag-along clauses, and tax treatment
        this prototype doesn&apos;t model. Consult legal counsel before relying on
        these figures.
      </div>
    </main>
  );
}
