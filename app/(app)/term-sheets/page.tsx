import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getActiveWorkspace } from "@/lib/workspace/active";

function fmtDate(s: string | null | undefined): string {
  if (!s) return "—";
  return new Date(s).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

const STATUS_META: Record<string, { label: string; bg: string; fg: string }> = {
  draft:     { label: "Draft",     bg: "bg-(--color-surface-bright)", fg: "text-(--color-on-surface-variant)" },
  sent:      { label: "Sent",      bg: "bg-(--color-info)/10",        fg: "text-(--color-info)" },
  signed:    { label: "Signed",    bg: "bg-(--color-success)/15",     fg: "text-(--color-success)" },
  declined:  { label: "Declined",  bg: "bg-(--color-error)/10",       fg: "text-(--color-error)" },
  withdrawn: { label: "Withdrawn", bg: "bg-(--color-surface-bright)", fg: "text-(--color-on-surface-disabled)" },
};

const INSTRUMENT_LABELS: Record<string, string> = {
  isafe: "iSAFE",
  safe: "SAFE",
  convertible_note: "Conv. Note",
  ordinary: "Priced Round",
};

export default async function TermSheetsIndexPage() {
  const workspace = await getActiveWorkspace();
  if (!workspace) redirect("/setup");

  const supabase = await createClient();

  const [{ data: termSheets }, { data: allRounds }] = await Promise.all([
    supabase
      .from("term_sheets")
      .select("id, investor_name, firm, instrument_type, status, version, sent_at, signed_at, created_at, round_id")
      .eq("workspace_id", workspace.id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
    supabase
      .from("financing_rounds")
      .select("id, name, status")
      .eq("workspace_id", workspace.id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
  ]);

  const roundById: Record<string, { id: string; name: string }> = {};
  for (const r of allRounds ?? []) roundById[r.id] = { id: r.id, name: r.name };

  const signed = (termSheets ?? []).filter((t) => t.status === "signed").length;
  const sent = (termSheets ?? []).filter((t) => t.status === "sent").length;

  return (
    <main className="mx-auto max-w-5xl px-6 py-10 space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-label-md uppercase text-(--color-on-surface-variant)">Investment</p>
          <h1 className="mt-1 text-display-sm font-semibold tracking-tight">Term Sheets</h1>
        </div>
        <div className="flex items-center gap-3 mt-2">
          {signed > 0 && (
            <span className="rounded-full bg-(--color-success)/15 px-3 py-1 text-label-sm font-medium text-(--color-success)">
              {signed} signed
            </span>
          )}
          {sent > 0 && (
            <span className="rounded-full bg-(--color-info)/10 px-3 py-1 text-label-sm font-medium text-(--color-info)">
              {sent} out for signature
            </span>
          )}
        </div>
      </div>

      {(termSheets ?? []).length === 0 ? (
        <div className="rounded-xl bg-(--color-surface-container-low) px-6 py-10 space-y-6">
          <div>
            <h2 className="text-title-md font-medium">No term sheets yet</h2>
            <p className="mt-1 text-body-md text-(--color-on-surface-variant)">
              Term sheets attach to a specific round. {(allRounds ?? []).length > 0
                ? "Pick a round below to draft your first one."
                : "Create a round first to get started."}
            </p>
          </div>

          {(allRounds ?? []).length === 0 ? (
            <Link
              href="/rounds/new"
              className="inline-block rounded-lg bg-(--color-primary) px-5 py-2.5 text-label-sm font-medium text-white hover:opacity-90"
            >
              Create a round
            </Link>
          ) : (
            <ul className="divide-y divide-(--color-outline-variant)/15 rounded-lg bg-(--color-surface-container)">
              {(allRounds ?? []).map((r) => (
                <li key={r.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-body-md font-medium">{r.name}</p>
                    <p className="text-label-sm uppercase text-(--color-on-surface-variant)">{r.status}</p>
                  </div>
                  <Link
                    href={`/rounds/${r.id}#term-sheets`}
                    className="rounded-lg bg-(--color-primary) px-4 py-2 text-label-sm font-medium text-white hover:opacity-90"
                  >
                    Draft term sheet
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <div className="rounded-xl bg-(--color-surface-container-low) overflow-hidden">
          <table className="w-full text-body-sm">
            <thead>
              <tr className="text-label-md uppercase text-(--color-on-surface-variant)">
                <th className="px-4 py-3 text-start font-normal">Investor</th>
                <th className="px-4 py-3 text-start font-normal">Round</th>
                <th className="px-4 py-3 text-start font-normal">Instrument</th>
                <th className="px-4 py-3 text-start font-normal">Status</th>
                <th className="px-4 py-3 text-start font-normal">Version</th>
                <th className="px-4 py-3 text-start font-normal">Date</th>
              </tr>
            </thead>
            <tbody>
              {(termSheets ?? []).map((ts) => {
                const m = STATUS_META[ts.status] ?? STATUS_META.draft;
                const round = roundById[ts.round_id] ?? null;
                return (
                  <tr key={ts.id} className="border-t border-(--color-outline-variant)/15 align-middle">
                    <td className="px-4 py-3 font-medium">
                      <Link href={`/term-sheets/${ts.id}`} className="hover:underline">
                        {ts.investor_name}
                      </Link>
                      {ts.firm && (
                        <div className="text-body-sm text-(--color-on-surface-variant)">{ts.firm}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-(--color-on-surface-variant)">
                      {round ? (
                        <Link href={`/rounds/${round.id}`} className="hover:underline">
                          {round.name}
                        </Link>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-3 text-(--color-on-surface-variant)">
                      {INSTRUMENT_LABELS[ts.instrument_type] ?? ts.instrument_type}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-label-sm font-medium uppercase tracking-wider ${m.bg} ${m.fg}`}>
                        {m.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 tabular-nums text-(--color-on-surface-variant)">
                      v{ts.version}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-(--color-on-surface-variant) whitespace-nowrap">
                      {fmtDate(ts.signed_at ?? ts.sent_at ?? ts.created_at)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
