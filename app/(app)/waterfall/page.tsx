import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getActiveWorkspace } from "@/lib/workspace/active";

import { WaterfallModeler, type WaterfallSeed } from "./modeler";

export default async function WaterfallPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const workspace = await getActiveWorkspace();
  if (!workspace) redirect("/setup");

  const { data: shareholders } = await supabase
    .from("shareholders")
    .select("*")
    .eq("workspace_id", workspace.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });

  const seed: WaterfallSeed = (shareholders ?? [])
    .map((row) => {
      const data = row.instrument_data as Record<string, string>;
      if (row.instrument_type === "ordinary") {
        return {
          id: row.id,
          name: row.name,
          kind: "ordinary" as const,
          shares: data.shares ?? "0",
        };
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
    .filter((r): r is WaterfallSeed[number] => r !== null);

  return (
    <main className="mx-auto max-w-5xl px-6 py-10 space-y-8">
      <header>
        <p className="text-label-md uppercase text-(--color-on-surface-variant)">
          Waterfall analysis
        </p>
        <h1 className="mt-1 text-display-sm font-semibold tracking-tight">
          {workspace.name}
        </h1>
        <p className="mt-2 text-body-md text-(--color-on-surface-variant)">
          Model how exit proceeds distribute among shareholders. Standard 1×
          non-participating liquidation preference — each convertible holder
          gets whichever is larger: their 1× preference, or their
          as-converted share of the remaining pool.
        </p>
      </header>

      <WaterfallModeler seed={seed} />

      <div className="rounded-md bg-(--color-warning)/10 px-4 py-3 text-body-sm text-(--color-warning)">
        Directional estimate only — not a formal valuation or legal advice.
        Real exit math depends on preference stack details, participating
        vs non-participating terms, vesting, and dozens of clauses this
        prototype doesn&apos;t model.
      </div>
    </main>
  );
}
