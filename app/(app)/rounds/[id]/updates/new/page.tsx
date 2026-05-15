import Link from "next/link";
import { redirect, notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getActiveWorkspace } from "@/lib/workspace/active";

import { UpdateForm } from "../../../update-form";
import { createInvestorUpdate } from "../../update-actions";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function NewInvestorUpdatePage({ params }: PageProps) {
  const { id: roundId } = await params;

  const workspace = await getActiveWorkspace();
  if (!workspace) redirect("/setup");

  const supabase = await createClient();

  const { data: round } = await supabase
    .from("financing_rounds")
    .select("id, name, status")
    .eq("id", roundId)
    .eq("workspace_id", workspace.id)
    .is("deleted_at", null)
    .maybeSingle();
  if (!round) notFound();

  // Auto-pull most recent traction metrics
  const { data: latestMetrics } = await supabase
    .from("traction_metrics")
    .select("mrr_sar, cash_runway_months, customer_count, month")
    .eq("workspace_id", workspace.id)
    .is("deleted_at", null)
    .order("month", { ascending: false })
    .limit(1)
    .maybeSingle();

  async function action(formData: FormData) {
    "use server";
    return createInvestorUpdate(roundId, formData);
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <Link
        href={`/rounds/${roundId}`}
        className="text-body-sm text-(--color-on-surface-variant) underline"
      >
        ← Back to {round.name}
      </Link>
      <h1 className="mt-4 text-display-sm font-semibold tracking-tight">
        Draft investor update
      </h1>
      <p className="mt-2 text-body-md text-(--color-on-surface-variant)">
        Write a progress update for your investors. MRR and runway have been
        pre-filled from your latest traction metrics — edit as needed before
        publishing.
      </p>

      <div className="mt-10">
        <UpdateForm
          action={action}
          submitLabel="Save draft"
          defaults={{
            mrr_sar: latestMetrics?.mrr_sar != null ? String(latestMetrics.mrr_sar) : "",
            runway_months: latestMetrics?.cash_runway_months != null
              ? String(latestMetrics.cash_runway_months)
              : "",
          }}
        />
      </div>
    </main>
  );
}
