"use client";

import Link from "next/link";

import { formatSar, formatShares, pricePerShare } from "@/lib/marketplace/money";
import { useT } from "@/lib/i18n/useT";

export type BrowseRow = {
  kind: "secondary" | "exit";
  id: string;
  href: string;
  workspace_name: string | null;
  listed_at: string;
  shares_offered: string | null;
  ask_price_sar: string | null;
  shareholder_name: string | null;
  summary: string | null;
};

export function MarketplaceBrowse({
  secondaries,
  exits,
}: {
  secondaries: BrowseRow[];
  exits: BrowseRow[];
}) {
  const t = useT("marketplace");

  return (
    <main className="mx-auto max-w-5xl px-6 py-10 space-y-10">
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

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-headline-sm font-medium">
            {t("browse.section.secondaries")}
          </h2>
          <span className="text-body-sm text-(--color-on-surface-variant) tabular-nums">
            {secondaries.length}
          </span>
        </div>
        {secondaries.length === 0 ? (
          <Empty body={t("browse.empty.secondaries")} />
        ) : (
          <ul className="space-y-3">
            {secondaries.map((r) => (
              <li key={r.id}>
                <Link
                  href={r.href}
                  className="
                    block rounded-xl ghost-border p-5
                    hover:bg-(--color-surface-container-high) transition-colors
                  "
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-body-lg font-semibold truncate">
                        {r.workspace_name ?? t("browse.unknown_workspace")}
                      </p>
                      <p className="mt-1 text-body-sm text-(--color-on-surface-variant)">
                        {r.shareholder_name
                          ? t("browse.secondary.detail", {
                              shareholder: r.shareholder_name,
                              date: new Date(r.listed_at).toLocaleDateString(),
                            })
                          : t("card.listed_on", {
                              date: new Date(r.listed_at).toLocaleDateString(),
                            })}
                      </p>
                    </div>
                    <div className="text-end shrink-0">
                      {r.ask_price_sar && (
                        <p className="text-body-lg font-semibold tabular-nums">
                          {formatSar(r.ask_price_sar)}
                        </p>
                      )}
                      {r.shares_offered && r.ask_price_sar && (
                        <p className="text-body-sm text-(--color-on-surface-variant) tabular-nums">
                          {t("card.shares_at_price", {
                            shares: formatShares(r.shares_offered),
                            price: pricePerShare(r.ask_price_sar, r.shares_offered),
                          })}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-headline-sm font-medium">{t("browse.section.exits")}</h2>
          <span className="text-body-sm text-(--color-on-surface-variant) tabular-nums">
            {exits.length}
          </span>
        </div>
        {exits.length === 0 ? (
          <Empty body={t("browse.empty.exits")} />
        ) : (
          <ul className="space-y-3">
            {exits.map((r) => (
              <li key={r.id}>
                <Link
                  href={r.href}
                  className="
                    block rounded-xl ghost-border p-5
                    hover:bg-(--color-surface-container-high) transition-colors
                  "
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-body-lg font-semibold truncate">
                        {r.workspace_name ?? t("browse.unknown_workspace")}
                      </p>
                      {r.summary && (
                        <p className="mt-1 text-body-sm text-(--color-on-surface-variant) line-clamp-2">
                          {r.summary}
                        </p>
                      )}
                      <p className="mt-2 text-body-sm text-(--color-on-surface-variant)">
                        {t("card.listed_on", {
                          date: new Date(r.listed_at).toLocaleDateString(),
                        })}
                      </p>
                    </div>
                    {r.ask_price_sar && (
                      <div className="text-end shrink-0">
                        <p className="text-body-lg font-semibold tabular-nums">
                          {formatSar(r.ask_price_sar)}
                        </p>
                      </div>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

function Empty({ body }: { body: string }) {
  return (
    <div className="rounded-xl ghost-border p-8 text-center">
      <p className="text-body-sm text-(--color-on-surface-variant)">{body}</p>
    </div>
  );
}
