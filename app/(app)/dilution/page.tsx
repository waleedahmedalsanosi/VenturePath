import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getActiveWorkspace } from "@/lib/workspace/active";

import { Modeler, type ExistingHolder } from "./modeler";

export default async function DilutionPage() {
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

  const existing: ExistingHolder[] = (shareholders ?? [])
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
      // Treat iSAFE / SAFE / Convertible Note uniformly for dilution math.
      // Unconverted only; converted ones already have ordinary shares (out of
      // scope to surface here).
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
    .filter((r): r is ExistingHolder => r !== null);

  return (
    <main className="mx-auto max-w-5xl px-6 py-10 space-y-8">
      <header>
        <p className="text-label-md uppercase text-(--color-on-surface-variant)">
          Dilution modeler
        </p>
        <h1 className="mt-1 text-display-sm font-semibold tracking-tight">
          {workspace.name}
        </h1>
        <p className="mt-2 text-body-md text-(--color-on-surface-variant)">
          Model what your cap table looks like after a priced round. All
          unconverted convertibles convert simultaneously. You can layer a
          hypothetical new investment on top.
        </p>
      </header>

      <Modeler existing={existing} />

      <div className="rounded-md bg-(--color-warning)/10 px-4 py-3 text-body-sm text-(--color-warning)">
        Directional estimate for planning. Not a formal valuation or legal
        advice. Consult your financial and legal advisors before signing.
      </div>
    </main>
  );
}
