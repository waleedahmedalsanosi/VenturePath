"use client";

import Link from "next/link";

import { useT } from "@/lib/i18n/useT";

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-(--color-surface-bright) text-(--color-on-surface-variant)",
  open: "bg-(--color-info)/15 text-(--color-info)",
  closed: "bg-(--color-success)/20 text-(--color-success)",
};

interface Round {
  id: string;
  name: string;
  instrument_type: string;
  pre_money_valuation_sar: number | string | null;
  target_raise_sar: number | string | null;
  close_date: string | null;
  status: "draft" | "open" | "closed";
  is_public: boolean;
  lead_investor: string | null;
}

function fmtSar(n: string | number | null | undefined): string {
  if (n === null || n === undefined || n === "") return "—";
  const num = Number(n);
  if (!isFinite(num)) return "—";
  return `SAR ${num.toLocaleString()}`;
}

function fmtDate(s: string | null | undefined): string {
  if (!s) return "—";
  return new Date(s).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export function RoundsList({ rounds, workspaceName }: { rounds: Round[]; workspaceName: string }) {
  const t = useT("rounds");

  if (rounds.length === 0) {
    return (
      <div className="rounded-xl bg-(--color-surface-container-low) p-12 text-center space-y-3">
        <p className="text-body-lg font-medium">{t("empty.heading")}</p>
        <p className="text-body-md text-(--color-on-surface-variant) max-w-md mx-auto">
          {t("empty.body")}
        </p>
        <Link
          href="/rounds/new"
          className="inline-block mt-4 rounded-lg bg-(--color-primary)/15 px-5 py-2.5 text-label-lg text-(--color-primary) hover:bg-(--color-primary)/25 transition-colors"
        >
          {t("empty.cta")}
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-(--color-surface-container-low) overflow-hidden">
      <table className="w-full text-body-sm">
        <thead>
          <tr className="text-label-md uppercase text-(--color-on-surface-variant)">
            <th className="px-4 py-3 text-start font-normal">{t("col.round")}</th>
            <th className="px-4 py-3 text-start font-normal hidden sm:table-cell">{t("col.instrument")}</th>
            <th className="px-4 py-3 text-start font-normal hidden md:table-cell">{t("col.pre_money")}</th>
            <th className="px-4 py-3 text-start font-normal hidden md:table-cell">{t("col.target")}</th>
            <th className="px-4 py-3 text-start font-normal hidden sm:table-cell">{t("col.close")}</th>
            <th className="px-4 py-3 text-start font-normal">{t("col.status")}</th>
            <th className="px-4 py-3 text-end font-normal" aria-label="Actions" />
          </tr>
        </thead>
        <tbody>
          {rounds.map((r) => (
            <tr key={r.id} className="border-t border-(--color-outline-variant)/15 align-middle">
              <td className="px-4 py-3 font-medium">
                <div className="flex items-center gap-2">
                  <Link href={`/rounds/${r.id}`} className="hover:text-(--color-primary)">
                    {r.name}
                  </Link>
                  {r.is_public && r.status !== "draft" && (
                    <span title="Visible on public profile" className="text-label-sm text-(--color-primary)" aria-label="Public">●</span>
                  )}
                </div>
                {r.lead_investor && (
                  <div className="text-body-sm text-(--color-on-surface-variant) mt-0.5">{r.lead_investor}</div>
                )}
              </td>
              <td className="px-4 py-3 text-(--color-on-surface-variant) hidden sm:table-cell">
                {t(`instrument.${r.instrument_type}`) || r.instrument_type}
              </td>
              <td className="px-4 py-3 tabular-nums text-(--color-on-surface-variant) hidden md:table-cell">
                {fmtSar(r.pre_money_valuation_sar)}
              </td>
              <td className="px-4 py-3 tabular-nums text-(--color-on-surface-variant) hidden md:table-cell">
                {fmtSar(r.target_raise_sar)}
              </td>
              <td className="px-4 py-3 tabular-nums text-(--color-on-surface-variant) hidden sm:table-cell whitespace-nowrap">
                {fmtDate(r.close_date)}
              </td>
              <td className="px-4 py-3">
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-label-sm font-medium uppercase tracking-wider ${STATUS_STYLES[r.status]}`}>
                  {t(`status.${r.status}`)}
                </span>
              </td>
              <td className="px-4 py-3 text-end">
                <Link href={`/rounds/${r.id}`} className="text-body-sm text-(--color-on-surface-variant) hover:text-(--color-on-surface)">
                  View →
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
