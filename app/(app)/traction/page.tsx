import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getActiveWorkspace } from "@/lib/workspace/active";

import { headers } from "next/headers";

import { TractionChart } from "./chart";
import { UpsertForm } from "./upsert-form";
import { VisibilityToggles } from "./visibility-toggles";
import { MetricRow } from "./metric-row";
import { PublishToggle } from "./publish-toggle";

function fmtSAR(v: number | string | null): string {
  if (v === null || v === undefined) return "—";
  const n = typeof v === "string" ? Number(v) : v;
  if (!Number.isFinite(n)) return "—";
  return `SAR ${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

function fmtPct(v: number | string | null): string {
  if (v === null || v === undefined) return "—";
  const n = typeof v === "string" ? Number(v) : v;
  if (!Number.isFinite(n)) return "—";
  return `${n.toFixed(1)}%`;
}

function fmtInt(v: number | null): string {
  if (v === null || v === undefined) return "—";
  return v.toLocaleString();
}

async function buildPublicUrl(slug: string): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "venture-path.vercel.app";
  const proto = h.get("x-forwarded-proto") ?? "https";
  return `${proto}://${host}/explore/${slug}`;
}

function fmtMonth(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

export default async function TractionPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const workspace = await getActiveWorkspace();
  if (!workspace) redirect("/setup");

  const { data: metrics } = await supabase
    .from("traction_metrics")
    .select("*")
    .eq("workspace_id", workspace.id)
    .is("deleted_at", null)
    .order("month", { ascending: true });

  const rows = metrics ?? [];

  return (
    <main className="mx-auto max-w-5xl px-6 py-10 space-y-10">
      <header>
        <p className="text-label-md uppercase text-(--color-on-surface-variant)">
          Traction
        </p>
        <h1 className="mt-1 text-display-sm font-semibold tracking-tight">
          {workspace.name}
        </h1>
        <p className="mt-2 text-body-md text-(--color-on-surface-variant)">
          Monthly MRR, customer count, gross margin, and cash runway. All
          fields optional — partial months are fine. Visibility per metric
          controls what shows on your public profile.
        </p>
      </header>

      {rows.length > 0 && (
        <section className="rounded-xl bg-(--color-surface-container-low) p-6">
          <h2 className="text-label-md uppercase text-(--color-on-surface-variant) mb-4">
            MRR over time
          </h2>
          <TractionChart
            data={rows.map((r) => ({
              month: r.month,
              mrr: r.mrr_sar === null ? null : Number(r.mrr_sar),
            }))}
          />
        </section>
      )}

      <section>
        <h2 className="text-label-md uppercase text-(--color-on-surface-variant) mb-4">
          Add or update a month
        </h2>
        <UpsertForm />
      </section>

      <VisibilityToggles
        initial={{
          show_mrr_publicly: workspace.show_mrr_publicly,
          show_customer_count_publicly: workspace.show_customer_count_publicly,
          show_gross_margin_publicly: workspace.show_gross_margin_publicly,
          show_cash_runway_publicly: workspace.show_cash_runway_publicly,
        }}
      />

      {workspace.slug && (
        <PublishToggle
          initialPublished={workspace.public_profile_published}
          publicUrl={await buildPublicUrl(workspace.slug)}
        />
      )}

      <section>
        <h2 className="text-label-md uppercase text-(--color-on-surface-variant) mb-4">
          {rows.length === 0
            ? "No data yet"
            : `${rows.length} month${rows.length === 1 ? "" : "s"} recorded`}
        </h2>
        {rows.length === 0 ? (
          <div className="rounded-xl bg-(--color-surface-container-low) p-12 text-center">
            <p className="text-body-md text-(--color-on-surface-variant)">
              Add your first month to start tracking traction. Investors care
              about the trend more than any one month.
            </p>
          </div>
        ) : (
          <div className="rounded-xl bg-(--color-surface-container-low) overflow-hidden">
            <table className="w-full text-body-sm">
              <thead>
                <tr className="text-label-md uppercase text-(--color-on-surface-variant)">
                  <th className="px-4 py-3 text-start font-normal">Month</th>
                  <th className="px-4 py-3 text-end font-normal">MRR</th>
                  <th className="px-4 py-3 text-end font-normal">Customers</th>
                  <th className="px-4 py-3 text-end font-normal">Gross margin</th>
                  <th className="px-4 py-3 text-end font-normal">Runway (mo)</th>
                  <th className="px-4 py-3 text-end font-normal" aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {rows
                  .slice()
                  .reverse()
                  .map((row) => (
                    <MetricRow
                      key={row.id}
                      id={row.id}
                      month={fmtMonth(row.month)}
                      mrr={fmtSAR(row.mrr_sar)}
                      customers={fmtInt(row.customer_count)}
                      grossMargin={fmtPct(row.gross_margin_pct)}
                      runway={fmtInt(row.cash_runway_months)}
                    />
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
