import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { createClient } from "@/lib/supabase/server";
import { TractionChart } from "@/app/(app)/traction/chart";

interface PageProps {
  params: Promise<{ slug: string }>;
}

const SECTOR_LABEL: Record<string, string> = {
  FinTech: "FinTech",
  HealthTech: "HealthTech",
  EdTech: "EdTech",
  PropTech: "PropTech",
  SaaS: "SaaS",
  "E-commerce": "E-commerce",
  "AI/ML": "AI/ML",
  UGC: "UGC",
  Logistics: "Logistics",
  Other: "Other",
};

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

function fmtDate(s: string | null | undefined): string {
  if (!s) return "—";
  return new Date(s).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
  });
}

const ROUND_INSTRUMENT_LABEL: Record<string, string> = {
  isafe: "iSAFE",
  safe: "SAFE",
  convertible_note: "Convertible Note",
  ordinary: "Priced Round",
};

const ROUND_STATUS_STYLES: Record<string, string> = {
  open: "bg-(--color-info)/15 text-(--color-info)",
  closed: "bg-(--color-success)/20 text-(--color-success)",
};

async function fetchProfile(slug: string) {
  const supabase = await createClient();
  const { data: workspace } = await supabase
    .from("workspaces")
    .select("*")
    .eq("slug", slug)
    .eq("public_profile_published", true)
    .maybeSingle();
  if (!workspace) return null;

  const { data: metrics } = await supabase
    .from("traction_metrics")
    .select("*")
    .eq("workspace_id", workspace.id)
    .is("deleted_at", null)
    .order("month", { ascending: true });

  const { data: rounds } = await supabase
    .from("financing_rounds")
    .select("id, name, status, instrument_type, lead_investor, close_date, actual_raise_sar")
    .eq("workspace_id", workspace.id)
    .eq("is_public", true)
    .neq("status", "draft")
    .is("deleted_at", null)
    .order("close_date", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  return { workspace, metrics: metrics ?? [], rounds: rounds ?? [] };
}

export async function generateMetadata(
  { params }: PageProps,
): Promise<Metadata> {
  const { slug } = await params;
  const data = await fetchProfile(slug);
  if (!data) return { title: "Not found — VenturePath" };

  const { workspace } = data;
  return {
    title: `${workspace.name} — VenturePath`,
    description: workspace.one_liner,
    openGraph: {
      title: workspace.name,
      description: workspace.one_liner,
      type: "profile",
    },
    robots: { index: true, follow: true },
  };
}

export default async function PublicProfilePage({ params }: PageProps) {
  const { slug } = await params;
  const data = await fetchProfile(slug);
  if (!data) notFound();

  const { workspace, metrics, rounds } = data;

  // Get the latest non-null value for each metric for the "current" tiles.
  const latest = metrics.length ? metrics[metrics.length - 1]! : null;

  const showMrr = workspace.show_mrr_publicly && latest?.mrr_sar !== null;
  const showCustomers =
    workspace.show_customer_count_publicly && latest?.customer_count !== null;
  const showMargin =
    workspace.show_gross_margin_publicly && latest?.gross_margin_pct !== null;
  const showRunway =
    workspace.show_cash_runway_publicly && latest?.cash_runway_months !== null;
  const anyMetricVisible = showMrr || showCustomers || showMargin || showRunway;

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <p className="text-label-md uppercase text-(--color-on-surface-variant)">
        {SECTOR_LABEL[workspace.sector] ?? workspace.sector} · {workspace.country} · {workspace.funding_stage}
      </p>
      <h1 className="mt-3 text-display-lg font-semibold tracking-tight">
        {workspace.name}
      </h1>
      <p className="mt-4 text-body-lg text-(--color-on-surface-variant)">
        {workspace.one_liner}
      </p>

      {workspace.entity_status === "incorporated" && workspace.legal_entity && (
        <p className="mt-2 text-body-sm text-(--color-on-surface-variant)">
          {workspace.legal_entity}
          {workspace.founded_year ? ` · Founded ${workspace.founded_year}` : ""}
        </p>
      )}

      {workspace.website_url && (
        <p className="mt-2">
          <a
            href={workspace.website_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-body-md text-(--color-primary) underline"
          >
            {workspace.website_url} ↗
          </a>
        </p>
      )}

      {anyMetricVisible && latest && (
        <section className="mt-12">
          <h2 className="text-label-md uppercase text-(--color-on-surface-variant) mb-4">
            Traction
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {showMrr && (
              <Tile label="MRR" value={fmtSAR(latest.mrr_sar)} />
            )}
            {showCustomers && (
              <Tile
                label="Customers"
                value={fmtInt(latest.customer_count)}
              />
            )}
            {showMargin && (
              <Tile
                label="Gross margin"
                value={fmtPct(latest.gross_margin_pct)}
              />
            )}
            {showRunway && (
              <Tile
                label="Runway (months)"
                value={fmtInt(latest.cash_runway_months)}
              />
            )}
          </div>

          {showMrr && metrics.length > 1 && (
            <div className="mt-6 rounded-xl bg-(--color-surface-container-low) p-6">
              <h3 className="text-label-md uppercase text-(--color-on-surface-variant) mb-4">
                MRR over time
              </h3>
              <TractionChart
                data={metrics.map((m) => ({
                  month: m.month,
                  mrr: m.mrr_sar === null ? null : Number(m.mrr_sar),
                }))}
              />
            </div>
          )}
        </section>
      )}

      {rounds.length > 0 && (
        <section className="mt-12">
          <h2 className="text-label-md uppercase text-(--color-on-surface-variant) mb-4">
            Fundraising
          </h2>
          <div className="rounded-xl bg-(--color-surface-container-low) overflow-hidden">
            <table className="w-full text-body-sm">
              <thead>
                <tr className="text-label-md uppercase text-(--color-on-surface-variant)">
                  <th className="px-4 py-3 text-start font-normal">Round</th>
                  <th className="px-4 py-3 text-start font-normal">Instrument</th>
                  <th className="px-4 py-3 text-start font-normal">Raised</th>
                  <th className="px-4 py-3 text-start font-normal">Lead</th>
                  <th className="px-4 py-3 text-start font-normal">Date</th>
                  <th className="px-4 py-3 text-start font-normal">Status</th>
                </tr>
              </thead>
              <tbody>
                {rounds.map((r) => (
                  <tr
                    key={r.id}
                    className="border-t border-(--color-outline-variant)/15 align-middle"
                  >
                    <td className="px-4 py-3 font-medium">{r.name}</td>
                    <td className="px-4 py-3 text-(--color-on-surface-variant)">
                      {ROUND_INSTRUMENT_LABEL[r.instrument_type] ?? r.instrument_type}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-(--color-on-surface-variant)">
                      {r.status === "closed" ? fmtSAR(r.actual_raise_sar) : "—"}
                    </td>
                    <td className="px-4 py-3 text-(--color-on-surface-variant)">
                      {r.lead_investor ?? "—"}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-(--color-on-surface-variant) whitespace-nowrap">
                      {fmtDate(r.close_date)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-label-sm font-medium uppercase tracking-wider ${ROUND_STATUS_STYLES[r.status] ?? ""}`}
                      >
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <footer className="mt-16 pt-8 border-t border-(--color-outline-variant)/20 text-body-sm text-(--color-on-surface-variant)">
        Profile on{" "}
        <a href="/" className="text-(--color-primary) underline">
          VenturePath
        </a>{" "}
        — the Sharia-compliant cap table for KSA founders.
      </footer>
    </main>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-(--color-surface-container-high) p-4">
      <p className="text-label-md uppercase text-(--color-on-surface-variant)">
        {label}
      </p>
      <p className="mt-2 text-display-sm font-semibold tracking-tight tabular-nums">
        {value}
      </p>
    </div>
  );
}
