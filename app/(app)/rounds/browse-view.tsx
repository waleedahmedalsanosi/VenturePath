"use client";

import Link from "next/link";

import { useT } from "@/lib/i18n/useT";

export interface BrowseRoundRow {
  id: string;
  name: string;
  instrument_type: string;
  pre_money_valuation_sar: string | null;
  target_raise_sar: string | null;
  close_date: string | null;
  lead_investor: string | null;
  listed_at: string;
  workspace_name: string | null;
  workspace_slug: string | null;
}

function fmtSar(n: string | null): string {
  if (!n) return "—";
  const num = Number(n);
  if (!isFinite(num)) return "—";
  return `SAR ${num.toLocaleString()}`;
}

function fmtDate(s: string | null): string {
  if (!s) return "—";
  return new Date(s).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const INSTRUMENT_TONE: Record<string, string> = {
  isafe: "bg-(--color-success)/15 text-(--color-success)",
  safe: "bg-(--color-primary-container)/40 text-(--color-primary)",
  convertible_note: "bg-(--color-warning)/15 text-(--color-warning)",
  ordinary: "bg-(--color-surface-container-high) text-(--color-on-surface)",
};

export function RoundsBrowse({ rows }: { rows: BrowseRoundRow[] }) {
  const t = useT("rounds");
  return (
    <>
      <header>
        <p className="text-label-md uppercase text-(--color-on-surface-variant)">
          {t("browse.eyebrow")}
        </p>
        <h1 className="mt-1 text-display-sm font-semibold tracking-tight">
          {t("browse.title")}
        </h1>
        <p className="mt-2 text-body-md text-(--color-on-surface-variant) max-w-2xl">
          {t("browse.subtitle")}
        </p>
      </header>

      <div className="flex items-center justify-between">
        <h2 className="text-label-md uppercase text-(--color-on-surface-variant)">
          {t("browse.count", { count: rows.length })}
        </h2>
        <Link
          href="/rounds?tab=mine"
          className="rounded-lg ghost-border px-4 py-2 text-label-sm hover:bg-(--color-surface-container-high)"
        >
          {t("browse.open_own")}
        </Link>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl ghost-border p-10 text-center space-y-2">
          <p className="text-body-lg font-semibold">{t("browse.empty.title")}</p>
          <p className="text-body-sm text-(--color-on-surface-variant) max-w-md mx-auto">
            {t("browse.empty.body")}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map((r) => {
            const tone =
              INSTRUMENT_TONE[r.instrument_type] ??
              "bg-(--color-surface-container-high) text-(--color-on-surface)";
            const companyHref = r.workspace_slug
              ? `/explore/${r.workspace_slug}`
              : "/explore";
            return (
              <li key={r.id}>
                <Link
                  href={companyHref}
                  className="
                    block rounded-xl ghost-border p-5
                    hover:bg-(--color-surface-container-high) transition-colors
                  "
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-body-lg font-semibold truncate">
                          {r.workspace_name ?? t("browse.unknown_workspace")}
                        </p>
                        <span
                          className={`
                            inline-flex items-center rounded-full px-2 py-0.5
                            text-label-sm uppercase tracking-wider ${tone}
                          `}
                        >
                          {r.instrument_type.replace("_", " ")}
                        </span>
                      </div>
                      <p className="mt-1 text-body-md text-(--color-on-surface-variant)">
                        {r.name}
                      </p>
                      <p className="mt-2 text-body-sm text-(--color-on-surface-variant)">
                        {r.lead_investor
                          ? t("browse.row.lead", { investor: r.lead_investor })
                          : t("browse.row.no_lead")}
                      </p>
                    </div>
                    <div className="text-end shrink-0">
                      <p className="text-body-lg font-semibold tabular-nums">
                        {fmtSar(r.target_raise_sar)}
                      </p>
                      <p className="text-body-sm text-(--color-on-surface-variant) tabular-nums">
                        {t("browse.row.pre_money", {
                          amount: fmtSar(r.pre_money_valuation_sar),
                        })}
                      </p>
                      <p className="text-body-sm text-(--color-on-surface-variant) tabular-nums">
                        {t("browse.row.close_by", { date: fmtDate(r.close_date) })}
                      </p>
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
