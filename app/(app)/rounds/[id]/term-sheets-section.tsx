"use client";

import Link from "next/link";
import { useTransition } from "react";

import { setTermSheetStatus } from "./term-sheet-actions";

type TermSheetStatus = "draft" | "sent" | "signed" | "declined" | "withdrawn";

const STATUS_META: Record<TermSheetStatus, { label: string; bg: string; fg: string }> = {
  draft:     { label: "Draft",     bg: "bg-(--color-surface-bright)", fg: "text-(--color-on-surface-variant)" },
  sent:      { label: "Sent",      bg: "bg-(--color-info)/10",        fg: "text-(--color-info)" },
  signed:    { label: "Signed",    bg: "bg-(--color-success)/15",     fg: "text-(--color-success)" },
  declined:  { label: "Declined",  bg: "bg-(--color-error)/10",       fg: "text-(--color-error)" },
  withdrawn: { label: "Withdrawn", bg: "bg-(--color-surface-bright)", fg: "text-(--color-on-surface-disabled)" },
};

const INSTRUMENT_LABELS: Record<string, string> = {
  isafe: "iSAFE",
  safe: "SAFE",
  convertible_note: "Convertible Note",
  ordinary: "Priced",
};

interface TermSheet {
  id: string;
  investor_name: string;
  firm: string | null;
  instrument_type: string;
  status: TermSheetStatus;
  version: number;
  sent_at: string | null;
  signed_at: string | null;
  created_at: string;
  terms: Record<string, unknown>;
}

interface Props {
  roundId: string;
  termSheets: TermSheet[];
  canEdit: boolean;
}

function fmtSarShort(n: unknown): string {
  if (n == null || n === "") return "—";
  const num = Number(n);
  if (!isFinite(num)) return "—";
  if (num >= 1_000_000) return `SAR ${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `SAR ${(num / 1_000).toFixed(0)}K`;
  return `SAR ${num.toLocaleString()}`;
}

function headlineFor(ts: TermSheet): string {
  const t = ts.terms ?? {};
  if (ts.instrument_type === "isafe") {
    return `${fmtSarShort(t.investment_sar)} @ ${fmtSarShort(t.valuation_cap_sar)} cap, ${t.profit_share_ratio ?? "—"}% profit share`;
  }
  if (ts.instrument_type === "safe") {
    return `${fmtSarShort(t.investment_sar)} @ ${fmtSarShort(t.valuation_cap_sar)} cap${t.discount_rate ? `, ${t.discount_rate}% discount` : ""}`;
  }
  if (ts.instrument_type === "convertible_note") {
    return `${fmtSarShort(t.principal_sar)} principal, ${t.interest_rate ?? "—"}% interest`;
  }
  if (ts.instrument_type === "ordinary") {
    return `${Number(t.shares ?? 0).toLocaleString()} shares @ ${fmtSarShort(t.price_per_share_sar)}`;
  }
  return "";
}

export function TermSheetsSection({ roundId, termSheets, canEdit }: Props) {
  const [isPending, startTransition] = useTransition();

  function handleStatusChange(id: string, status: TermSheetStatus) {
    startTransition(async () => {
      await setTermSheetStatus(id, status);
    });
  }

  const sentCount = termSheets.filter((t) => t.status === "sent").length;
  const signedCount = termSheets.filter((t) => t.status === "signed").length;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-label-md uppercase text-(--color-on-surface-variant)">
          Term sheets
          {signedCount > 0 && (
            <span className="ms-2 inline-flex items-center rounded-full bg-(--color-success)/15 text-(--color-success) px-2 py-0.5 text-label-sm font-medium">
              {signedCount} signed
            </span>
          )}
          {sentCount > 0 && (
            <span className="ms-2 inline-flex items-center rounded-full bg-(--color-info)/10 text-(--color-info) px-2 py-0.5 text-label-sm font-medium">
              {sentCount} sent
            </span>
          )}
        </h2>
        {canEdit && (
          <Link
            href={`/rounds/${roundId}/term-sheets/new`}
            className="rounded-lg ghost-border px-4 py-2 text-label-sm hover:bg-(--color-surface-container-high)"
          >
            + Draft term sheet
          </Link>
        )}
      </div>

      {termSheets.length === 0 ? (
        <div className="rounded-xl bg-(--color-surface-container-low) px-6 py-8 text-center">
          <p className="text-body-md text-(--color-on-surface-variant)">
            No term sheets yet.
            {canEdit && " Draft one to formalize agreed terms with an investor."}
          </p>
        </div>
      ) : (
        <div className="rounded-xl bg-(--color-surface-container-low) overflow-hidden">
          <table className="w-full text-body-sm">
            <thead>
              <tr className="text-label-md uppercase text-(--color-on-surface-variant)">
                <th className="px-4 py-3 text-start font-normal">Investor</th>
                <th className="px-4 py-3 text-start font-normal hidden sm:table-cell">Instrument</th>
                <th className="px-4 py-3 text-start font-normal hidden md:table-cell">Headline terms</th>
                <th className="px-4 py-3 text-start font-normal">Status</th>
                <th className="px-4 py-3 text-end font-normal" aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {termSheets.map((ts) => (
                <tr key={ts.id} className="border-t border-(--color-outline-variant)/15 align-middle">
                  <td className="px-4 py-3">
                    <div className="font-medium">{ts.investor_name}</div>
                    {ts.firm && <div className="text-body-sm text-(--color-on-surface-variant)">{ts.firm}</div>}
                    {ts.version > 1 && (
                      <div className="text-body-sm text-(--color-on-surface-variant) mt-0.5">v{ts.version}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell text-(--color-on-surface-variant)">
                    {INSTRUMENT_LABELS[ts.instrument_type] ?? ts.instrument_type}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell tabular-nums text-(--color-on-surface-variant)">
                    {headlineFor(ts)}
                  </td>
                  <td className="px-4 py-3">
                    {canEdit ? (
                      <select
                        value={ts.status}
                        onChange={(e) => handleStatusChange(ts.id, e.target.value as TermSheetStatus)}
                        disabled={isPending}
                        className={`rounded-full px-2.5 py-0.5 text-label-sm font-medium uppercase tracking-wider cursor-pointer appearance-none ${STATUS_META[ts.status].bg} ${STATUS_META[ts.status].fg}`}
                      >
                        {(Object.keys(STATUS_META) as TermSheetStatus[]).map((s) => (
                          <option key={s} value={s}>
                            {STATUS_META[s].label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-label-sm font-medium uppercase tracking-wider ${STATUS_META[ts.status].bg} ${STATUS_META[ts.status].fg}`}
                      >
                        {STATUS_META[ts.status].label}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-end">
                    <Link
                      href={`/term-sheets/${ts.id}`}
                      className="text-body-sm text-(--color-primary) hover:underline whitespace-nowrap"
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
    </section>
  );
}
