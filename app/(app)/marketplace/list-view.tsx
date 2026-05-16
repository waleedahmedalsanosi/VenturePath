"use client";

import Link from "next/link";

import { formatSar, formatShares, pricePerShare } from "@/lib/marketplace/money";
import { useT } from "@/lib/i18n/useT";

export type ListingRow = {
  id: string;
  shareholder_id: string;
  shares_offered: number | string;
  ask_price_sar: number | string;
  notes: string | null;
  status: "open" | "withdrawn" | "sold_off_platform";
  listed_at: string;
  expires_at: string | null;
  closed_at: string | null;
  shareholders: { name: string } | null;
};

function StatusChip({ status }: { status: ListingRow["status"] }) {
  const t = useT("marketplace");
  const map: Record<ListingRow["status"], { labelKey: string; className: string }> = {
    open: {
      labelKey: "status.open",
      className: "bg-(--color-success-container) text-(--color-on-success-container)",
    },
    withdrawn: {
      labelKey: "status.withdrawn",
      className: "bg-(--color-surface-container-high) text-(--color-on-surface-variant)",
    },
    sold_off_platform: {
      labelKey: "status.sold_off_platform",
      className: "bg-(--color-tertiary-container) text-(--color-on-tertiary-container)",
    },
  };
  const c = map[status];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-label-sm ${c.className}`}
    >
      {t(c.labelKey)}
    </span>
  );
}

export function MarketplaceList({ rows }: { rows: ListingRow[] }) {
  const t = useT("marketplace");
  const openCount = rows.filter((r) => r.status === "open").length;

  return (
    <main className="mx-auto max-w-5xl px-6 py-10 space-y-8">
      <header>
        <p className="text-label-md uppercase text-(--color-on-surface-variant)">
          {t("eyebrow")}
        </p>
        <h1 className="mt-1 text-display-sm font-semibold tracking-tight">{t("title")}</h1>
        <p className="mt-2 text-body-md text-(--color-on-surface-variant)">{t("subtitle")}</p>
      </header>

      <div className="flex items-center justify-between">
        <h2 className="text-label-md uppercase text-(--color-on-surface-variant)">
          {t("count.open_total", { open: openCount, total: rows.length })}
        </h2>
        <Link
          href="/marketplace/new"
          className="rounded-lg ghost-border px-4 py-2 text-label-sm hover:bg-(--color-surface-container-high)"
        >
          {t("new_listing")}
        </Link>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl ghost-border p-10 text-center space-y-3">
          <p className="text-body-lg">{t("empty.title")}</p>
          <p className="text-body-sm text-(--color-on-surface-variant)">{t("empty.body")}</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map((row) => (
            <li key={row.id}>
              <Link
                href={`/marketplace/${row.id}`}
                className="block rounded-xl ghost-border p-5 hover:bg-(--color-surface-container-high) transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-3">
                      <p className="text-body-lg font-semibold truncate">
                        {row.shareholders?.name ?? t("card.unknown_shareholder")}
                      </p>
                      <StatusChip status={row.status} />
                    </div>
                    <p className="mt-1 text-body-sm text-(--color-on-surface-variant)">
                      {t("card.listed_on", { date: new Date(row.listed_at).toLocaleDateString() })}
                      {row.expires_at &&
                        ` · ${t("card.expires_on", { date: new Date(row.expires_at).toLocaleDateString() })}`}
                    </p>
                  </div>
                  <div className="text-end shrink-0">
                    <p className="text-body-lg font-semibold tabular-nums">
                      {formatSar(String(row.ask_price_sar))}
                    </p>
                    <p className="text-body-sm text-(--color-on-surface-variant) tabular-nums">
                      {t("card.shares_at_price", {
                        shares: formatShares(String(row.shares_offered)),
                        price: pricePerShare(String(row.ask_price_sar), String(row.shares_offered)),
                      })}
                    </p>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
