"use client";

import Link from "next/link";

import { useT } from "@/lib/i18n/useT";

import { ExploreGrid } from "./explore-grid";

export type ExitCard = {
  id: string;
  summary: string;
  ask_type: string | null;
  ask_amount_sar: string | null;
  listed_at: string;
  company_name: string | null;
  company_slug: string | null;
};

export type PartnershipCard = {
  id: string;
  summary: string;
  seeking_type: string | null;
  commitment_type: string | null;
  listed_at: string;
  company_name: string | null;
  company_slug: string | null;
};

export type SecondaryCard = {
  id: string;
  shares_offered: string;
  ask_price_sar: string;
  listed_at: string;
  company_name: string | null;
  company_slug: string | null;
  shareholder_name: string | null;
};

export type CompanyCard = {
  id: string;
  slug: string;
  name: string;
  one_liner: string;
  sector: string;
  country: string;
  city: string | null;
  funding_stage: string;
  created_at: string;
  is_raising: boolean;
};

function TypeChip({ type, label }: { type: "exit" | "partnership"; label: string }) {
  const isExit = type === "exit";
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-label-sm font-medium uppercase tracking-[0.05em]"
      style={{
        backgroundColor: isExit ? "rgba(199, 62, 157, 0.15)" : "rgba(138, 111, 232, 0.15)",
        color: isExit ? "#C73E9D" : "#8A6FE8",
      }}
    >
      {label}
    </span>
  );
}

function formatSar(value: string | null): string {
  if (!value) return "";
  const num = Number(value);
  if (!isFinite(num)) return "";
  return num.toLocaleString();
}

export function ExploreView({
  isSignedIn,
  exits,
  partnerships,
  secondaries,
  companies,
}: {
  isSignedIn: boolean;
  exits: ExitCard[];
  partnerships: PartnershipCard[];
  secondaries: SecondaryCard[];
  companies: CompanyCard[];
}) {
  const t = useT("explore");
  const tConn = useT("connections");
  const tCommon = useT();

  return (
    <main className="mx-auto max-w-6xl px-6 py-12 space-y-16">
      <header>
        <p className="text-label-md uppercase text-(--color-on-surface-variant)">
          {t("eyebrow")}
        </p>
        <h1 className="mt-2 text-display-md font-semibold tracking-tight">{t("title")}</h1>
        <p className="mt-3 text-body-md text-(--color-on-surface-variant) max-w-2xl">
          {t("subtitle")}
        </p>
        {!isSignedIn && (
          <div className="mt-6 rounded-xl bg-(--color-surface-container-low) p-5 flex items-center justify-between flex-wrap gap-3">
            <p className="text-body-md text-(--color-on-surface-variant)">
              {t("guest_cta")}
            </p>
            <Link
              href="/sign-in?returnTo=/explore"
              className="rounded-lg bg-(--color-primary) text-(--color-on-primary) px-4 py-2 text-label-sm hover:opacity-90"
            >
              {tCommon("actions.sign_in")}
            </Link>
          </div>
        )}
      </header>

      {isSignedIn && (
        <>
          {/* Exits */}
          <section className="space-y-6">
            <div className="flex items-end justify-between flex-wrap gap-3">
              <div>
                <h2 className="text-headline-lg font-semibold tracking-tight">
                  {t("section.exits.title")}
                </h2>
                <p className="mt-2 text-body-md text-(--color-on-surface-variant) max-w-2xl">
                  {t("section.exits.subtitle")}
                </p>
              </div>
              <Link
                href="/connections?filter=exit"
                className="text-body-sm text-(--color-primary) hover:underline"
              >
                {t("section.exits.see_all")}
              </Link>
            </div>
            {exits.length === 0 ? (
              <p className="rounded-xl bg-(--color-surface-container-low) p-6 text-body-md text-(--color-on-surface-variant)">
                {t("section.exits.empty")}
              </p>
            ) : (
              <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {exits.map((e) => (
                  <li key={e.id}>
                    <Link
                      href={`/connections/${e.id}`}
                      className="block rounded-xl ghost-border p-5 hover:bg-(--color-surface-container-high) transition-colors h-full"
                    >
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <p className="text-body-md font-semibold truncate">
                          {e.company_name ?? t("card.unknown_company")}
                        </p>
                        <TypeChip type="exit" label={t("type_chip.exit")} />
                      </div>
                      <p className="text-body-sm text-(--color-on-surface-variant) line-clamp-3">
                        {e.summary}
                      </p>
                      <p className="mt-3 text-body-sm text-(--color-on-surface-variant) tabular-nums">
                        {e.ask_amount_sar
                          ? t("card.ask_label", {
                              amount: `${tCommon("currency.sar_prefix")} ${formatSar(e.ask_amount_sar)}`,
                            })
                          : t("card.open_to_offers")}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Partnerships */}
          <section className="space-y-6">
            <div className="flex items-end justify-between flex-wrap gap-3">
              <div>
                <h2 className="text-headline-lg font-semibold tracking-tight">
                  {t("section.partnerships.title")}
                </h2>
                <p className="mt-2 text-body-md text-(--color-on-surface-variant) max-w-2xl">
                  {t("section.partnerships.subtitle")}
                </p>
              </div>
              <Link
                href="/connections?filter=partnership"
                className="text-body-sm text-(--color-primary) hover:underline"
              >
                {t("section.partnerships.see_all")}
              </Link>
            </div>
            {partnerships.length === 0 ? (
              <p className="rounded-xl bg-(--color-surface-container-low) p-6 text-body-md text-(--color-on-surface-variant)">
                {t("section.partnerships.empty")}
              </p>
            ) : (
              <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {partnerships.map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/connections/${p.id}`}
                      className="block rounded-xl ghost-border p-5 hover:bg-(--color-surface-container-high) transition-colors h-full"
                    >
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <p className="text-body-md font-semibold truncate">
                          {p.company_name ?? t("card.unknown_company")}
                        </p>
                        <TypeChip type="partnership" label={t("type_chip.partnership")} />
                      </div>
                      <p className="text-body-sm text-(--color-on-surface-variant) line-clamp-3">
                        {p.summary}
                      </p>
                      <p className="mt-3 text-body-sm text-(--color-on-surface-variant)">
                        {[
                          p.seeking_type ? tConn(`type_data.seeking_map.${p.seeking_type}`) : null,
                          p.commitment_type ? tConn(`type_data.commitment_map.${p.commitment_type}`) : null,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Secondary share listings */}
          <section className="space-y-6">
            <div className="flex items-end justify-between flex-wrap gap-3">
              <div>
                <h2 className="text-headline-lg font-semibold tracking-tight">
                  {t("section.secondary.title")}
                </h2>
                <p className="mt-2 text-body-md text-(--color-on-surface-variant) max-w-2xl">
                  {t("section.secondary.subtitle")}
                </p>
              </div>
              <Link
                href="/marketplace"
                className="text-body-sm text-(--color-primary) hover:underline"
              >
                {t("section.secondary.see_all")}
              </Link>
            </div>
            {secondaries.length === 0 ? (
              <p className="rounded-xl bg-(--color-surface-container-low) p-6 text-body-md text-(--color-on-surface-variant)">
                {t("section.secondary.empty")}
              </p>
            ) : (
              <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {secondaries.map((s) => (
                  <li key={s.id}>
                    <Link
                      href={`/marketplace/${s.id}`}
                      className="block rounded-xl ghost-border p-5 hover:bg-(--color-surface-container-high) transition-colors h-full"
                    >
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <p className="text-body-md font-semibold truncate">
                          {s.company_name ?? t("card.unknown_company")}
                        </p>
                      </div>
                      <p className="text-body-sm text-(--color-on-surface-variant)">
                        {s.shareholder_name ?? t("card.unknown_shareholder")}
                      </p>
                      <p className="mt-3 text-body-lg font-semibold tabular-nums">
                        {`${tCommon("currency.sar_prefix")} ${formatSar(s.ask_price_sar)}`}
                      </p>
                      <p className="text-body-sm text-(--color-on-surface-variant) tabular-nums">
                        {t("card.shares_label", { shares: formatSar(s.shares_offered) })}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}

      {/* Companies (always visible, including for guests) */}
      <section className="space-y-6">
        <div className="flex items-end justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-headline-lg font-semibold tracking-tight">
              {t("section.companies.title")}
            </h2>
            <p className="mt-2 text-body-md text-(--color-on-surface-variant) max-w-2xl">
              {t("section.companies.subtitle")}
            </p>
          </div>
        </div>
        {companies.length === 0 ? (
          <p className="rounded-xl bg-(--color-surface-container-low) p-6 text-body-md text-(--color-on-surface-variant)">
            {t("section.companies.empty")}
          </p>
        ) : (
          <ExploreGrid workspaces={companies} />
        )}
      </section>
    </main>
  );
}
