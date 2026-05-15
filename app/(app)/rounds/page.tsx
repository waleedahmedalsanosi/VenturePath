import { redirect } from "next/navigation";
import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import { getActiveWorkspace } from "@/lib/workspace/active";

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-(--color-surface-bright) text-(--color-on-surface-variant)",
  open: "bg-(--color-info)/15 text-(--color-info)",
  closed: "bg-(--color-success)/20 text-(--color-success)",
};

function fmtSar(n: string | number | null | undefined): string {
  if (n === null || n === undefined || n === "") return "—";
  const num = Number(n);
  if (!isFinite(num)) return "—";
  return `SAR ${num.toLocaleString()}`;
}

function fmtDate(s: string | null | undefined): string {
  if (!s) return "—";
  return new Date(s).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const INSTRUMENT_LABELS: Record<string, string> = {
  isafe: "iSAFE",
  safe: "SAFE",
  convertible_note: "Convertible Note",
  ordinary: "Priced Round",
};

export default async function RoundsPage() {
  const workspace = await getActiveWorkspace();
  if (!workspace) redirect("/setup");

  const supabase = await createClient();
  const { data: rounds } = await supabase
    .from("financing_rounds")
    .select("*")
    .eq("workspace_id", workspace.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  const rows = rounds ?? [];

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

      {rows.length === 0 ? (
        <div className="rounded-xl bg-(--color-surface-container-low) p-12 text-center space-y-3">
          <p className="text-body-lg font-medium">No rounds yet.</p>
          <p className="text-body-md text-(--color-on-surface-variant) max-w-md mx-auto">
            Start a round to track investors, instrument terms, and close the
            round so your cap table updates in one step.
          </p>
          <Link
            href="/rounds/new"
            className="inline-block mt-4 rounded-lg bg-(--color-primary)/15 px-5 py-2.5 text-label-lg text-(--color-primary) hover:bg-(--color-primary)/25 transition-colors"
          >
            Start your first round
          </Link>
        </div>
      ) : (
        <div className="rounded-xl bg-(--color-surface-container-low) overflow-hidden">
          <table className="w-full text-body-sm">
            <thead>
              <tr className="text-label-md uppercase text-(--color-on-surface-variant)">
                <th className="px-4 py-3 text-start font-normal">Round</th>
                <th className="px-4 py-3 text-start font-normal">Instrument</th>
                <th className="px-4 py-3 text-start font-normal">Pre-money</th>
                <th className="px-4 py-3 text-start font-normal">Target</th>
                <th className="px-4 py-3 text-start font-normal">Close</th>
                <th className="px-4 py-3 text-start font-normal">Status</th>
                <th className="px-4 py-3 text-end font-normal" aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.id}
                  className="border-t border-(--color-outline-variant)/15 align-middle"
                >
                  <td className="px-4 py-3 font-medium">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/rounds/${r.id}`}
                        className="hover:text-(--color-primary)"
                      >
                        {r.name}
                      </Link>
                      {r.is_public && r.status !== "draft" && (
                        <span
                          title="Visible on public profile"
                          className="text-label-sm text-(--color-primary)"
                          aria-label="Public"
                        >
                          ●
                        </span>
                      )}
                    </div>
                    {r.lead_investor && (
                      <div className="text-body-sm text-(--color-on-surface-variant) mt-0.5">
                        {r.lead_investor}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-(--color-on-surface-variant)">
                    {INSTRUMENT_LABELS[r.instrument_type] ?? r.instrument_type}
                  </td>
                  <td className="px-4 py-3 tabular-nums text-(--color-on-surface-variant)">
                    {fmtSar(r.pre_money_valuation_sar)}
                  </td>
                  <td className="px-4 py-3 tabular-nums text-(--color-on-surface-variant)">
                    {fmtSar(r.target_raise_sar)}
                  </td>
                  <td className="px-4 py-3 tabular-nums text-(--color-on-surface-variant) whitespace-nowrap">
                    {fmtDate(r.close_date)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-label-sm font-medium uppercase tracking-wider ${STATUS_STYLES[r.status]}`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-end">
                    <Link
                      href={`/rounds/${r.id}`}
                      className="text-body-sm text-(--color-on-surface-variant) hover:text-(--color-on-surface)"
                    >
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
