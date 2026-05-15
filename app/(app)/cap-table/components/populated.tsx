import Link from "next/link";

import { Dec } from "@/lib/cap-table/decimal";
import { summarize, withOwnership } from "@/lib/cap-table/ownership";

import type { Database } from "@/lib/supabase/types";

import { OwnershipDonut } from "./donut-chart";
import { InstrumentChip } from "./instrument-chip";

type Workspace = Database["public"]["Tables"]["workspaces"]["Row"];
type Shareholder = Database["public"]["Tables"]["shareholders"]["Row"];

function fmtSAR(d: InstanceType<typeof Dec>): string {
  // Truncate trailing zero decimals; group thousands. Tabular numerals
  // applied at the component level.
  return `SAR ${d.toFixed(2).replace(/\.00$/, "").replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
}

function fmtPct(d: InstanceType<typeof Dec> | null): string {
  if (d === null) return "—";
  return `${d.toFixed(2)}%`;
}

function fmtShares(d: InstanceType<typeof Dec>): string {
  return d
    .toFixed(0)
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export function CapTablePopulated({
  workspace,
  shareholders,
}: {
  workspace: Workspace;
  shareholders: Shareholder[];
}) {
  const summary = summarize(shareholders);
  const rows = withOwnership(shareholders);

  return (
    <section className="space-y-10">
      {/* Hero — total cap table (founder-slice variant deferred until the
          founder-shareholder link exists in V1). */}
      <header className="flex items-start justify-between gap-6 flex-wrap">
        <div>
          <p className="text-label-md uppercase text-(--color-on-surface-variant)">
            Cap table
          </p>
          <h1 className="mt-1 text-display-md font-semibold tracking-tight">
            {workspace.name}
          </h1>
          <p className="mt-1 text-body-md text-(--color-on-surface-variant)">
            {workspace.one_liner}
          </p>
        </div>
        <Link
          href="/cap-table/add"
          className="rounded-lg ghost-border px-5 py-2 text-label-lg hover:bg-(--color-surface-container-high)"
        >
          + Add shareholder
        </Link>
      </header>

      {/* KPI tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiTile
          label="Ordinary shares issued"
          value={fmtShares(summary.total_ordinary_shares)}
        />
        <KpiTile
          label="iSAFEs outstanding"
          value={String(summary.isafe_count)}
        />
        <KpiTile
          label="iSAFE raised"
          value={fmtSAR(summary.total_isafe_investment_sar)}
        />
        <KpiTile
          label="Highest iSAFE cap"
          value={
            summary.highest_isafe_cap_sar.eq(0)
              ? "—"
              : fmtSAR(summary.highest_isafe_cap_sar)
          }
        />
      </div>

      {/* Donut + list */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-2 rounded-xl bg-(--color-surface-container-low) p-6">
          <h2 className="text-label-md uppercase text-(--color-on-surface-variant) mb-4">
            Ownership distribution
          </h2>
          <OwnershipDonut
            data={rows
              .filter((r) => r.ownership_pct !== null)
              .map((r, i) => ({
                name: r.row.name,
                value: Number(r.ownership_pct!.toFixed(4)),
                instrument: r.row.instrument_type,
                colorIndex: i,
              }))}
          />
        </div>

        <div className="lg:col-span-3 rounded-xl bg-(--color-surface-container-low) p-1">
          <table className="w-full text-body-sm">
            <thead>
              <tr className="text-label-md uppercase text-(--color-on-surface-variant)">
                <th className="px-4 py-3 text-start font-normal">Name</th>
                <th className="px-4 py-3 text-start font-normal">Instrument</th>
                <th className="px-4 py-3 text-end font-normal">Shares</th>
                <th className="px-4 py-3 text-end font-normal">Ownership</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ row, ownership_pct }) => {
                const data = row.instrument_data as Record<string, string>;
                const shares =
                  row.instrument_type === "ordinary" ? data.shares : null;
                return (
                  <tr
                    key={row.id}
                    className="border-t border-(--color-outline-variant)/15"
                  >
                    <td className="px-4 py-3 font-medium">{row.name}</td>
                    <td className="px-4 py-3">
                      <InstrumentChip type={row.instrument_type} />
                    </td>
                    <td className="px-4 py-3 text-end tabular-nums">
                      {shares ? fmtShares(new Dec(shares)) : "—"}
                    </td>
                    <td className="px-4 py-3 text-end tabular-nums">
                      {fmtPct(ownership_pct)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function KpiTile({ label, value }: { label: string; value: string }) {
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
