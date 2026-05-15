import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getActiveWorkspace } from "@/lib/workspace/active";

import { ValuationTool, type SeedTraction } from "./tool";
import { SessionsList } from "./sessions-list";

export default async function ValuationPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const workspace = await getActiveWorkspace();
  if (!workspace) redirect("/setup");

  // Auto-pull latest traction metric for ARR / margin defaults.
  const { data: latestMetric } = await supabase
    .from("traction_metrics")
    .select("mrr_sar, gross_margin_pct, customer_count")
    .eq("workspace_id", workspace.id)
    .is("deleted_at", null)
    .order("month", { ascending: false })
    .limit(1)
    .maybeSingle();

  const seedTraction: SeedTraction = {
    latest_mrr_sar:
      latestMetric?.mrr_sar !== null && latestMetric?.mrr_sar !== undefined
        ? String(latestMetric.mrr_sar)
        : null,
    latest_gross_margin_pct:
      latestMetric?.gross_margin_pct !== null &&
      latestMetric?.gross_margin_pct !== undefined
        ? String(latestMetric.gross_margin_pct)
        : null,
    sector: workspace.sector,
    funding_stage: workspace.funding_stage,
  };

  const { data: sessions } = await supabase
    .from("valuation_sessions")
    .select("*")
    .eq("workspace_id", workspace.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  return (
    <main className="mx-auto max-w-5xl px-6 py-10 space-y-10">
      <header>
        <p className="text-label-md uppercase text-(--color-on-surface-variant)">
          Valuation tool
        </p>
        <h1 className="mt-1 text-display-sm font-semibold tracking-tight">
          {workspace.name}
        </h1>
        <p className="mt-2 text-body-md text-(--color-on-surface-variant)">
          Pick a methodology, enter inputs, get a Low / Mid / High range.
          ARR and gross margin auto-pull from your latest traction month.
        </p>
      </header>

      <ValuationTool seedTraction={seedTraction} />

      <SessionsList sessions={sessions ?? []} />

      <div className="rounded-md bg-(--color-warning)/10 px-4 py-3 text-body-sm text-(--color-warning)">
        Directional estimates only — not a formal valuation or legal advice.
        Consult financial and legal advisors before signing any agreement.
      </div>
    </main>
  );
}
