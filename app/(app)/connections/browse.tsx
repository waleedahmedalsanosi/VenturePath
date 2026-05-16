"use client";

import Link from "next/link";

import { useT } from "@/lib/i18n/useT";

export type Listing = {
  id: string;
  workspace_id: string;
  listing_type: "exit" | "partnership";
  status: "open" | "withdrawn";
  public_summary: string;
  type_data: {
    ask_type?: string;
    ask_amount_sar?: string;
    sector?: string;
    stage?: string;
    seeking_type?: string;
    commitment_type?: string;
  } | null;
  listed_at: string;
  workspaces: { name: string } | null;
};

type FilterType = "all" | "exit" | "partnership" | "mine";

function TypeChip({ type, label }: { type: "exit" | "partnership"; label: string }) {
  const isExit = type === "exit";
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-label-sm font-medium uppercase tracking-[0.05em]"
      style={{
        backgroundColor: isExit ? "rgba(199, 62, 157, 0.15)" : "rgba(138, 111, 232, 0.15)",
        color: isExit ? "#C73E9D" : "#8A6FE8",
      }}
      aria-label={label}
    >
      {label}
    </span>
  );
}

export function ConnectionsBrowse({
  filter,
  seeking,
  listings,
}: {
  filter: FilterType;
  seeking?: string | null;
  listings: Listing[];
}) {
  const t = useT("connections");

  function summarizeTypeData(l: Listing): string {
    if (l.listing_type === "exit") {
      const ask = l.type_data?.ask_type
        ? t(`type_data.ask_type_map.${l.type_data.ask_type}`)
        : t("status.open", { ns: "common" }) as unknown as string;
      const amt = l.type_data?.ask_amount_sar;
      return amt ? t("type_data.summary.ask_with_amount", { ask, amount: amt }) : ask;
    }
    const seek = l.type_data?.seeking_type
      ? t(`type_data.seeking_map.${l.type_data.seeking_type}`)
      : t("type_data.label.seeking");
    const commit = l.type_data?.commitment_type
      ? t(`type_data.commitment_map.${l.type_data.commitment_type}`)
      : null;
    return commit ? t("type_data.summary.partnership_with_commitment", { seek, commit }) : seek;
  }

  const seekingLabel = seeking
    ? (t(`type_data.seeking_map.${seeking}`) as unknown as string)
    : null;

  return (
    <main className="mx-auto max-w-5xl px-6 py-10 space-y-8">
      <header>
        <p className="text-label-md uppercase text-(--color-on-surface-variant)">
          {t("eyebrow")}
        </p>
        <h1 className="mt-1 text-display-sm font-semibold tracking-tight">
          {seekingLabel ?? t("title")}
        </h1>
        <p className="mt-2 text-body-md text-(--color-on-surface-variant)">
          {t("subtitle")}
        </p>
        {seeking && (
          <div className="mt-3">
            <Link
              href="/connections"
              className="inline-flex items-center gap-1 text-body-sm text-(--color-primary) hover:underline"
            >
              ← {t("filter.clear", { defaultValue: "Clear filter" }) as unknown as string}
            </Link>
          </div>
        )}
      </header>

      <FilterChips active={filter} />

      <div className="flex items-center justify-between">
        <h2 className="text-label-md uppercase text-(--color-on-surface-variant)">
          {t("count.open_other", { count: listings.length })}
        </h2>
        <Link
          href="/connections/new"
          className="rounded-lg ghost-border px-4 py-2 text-label-sm hover:bg-(--color-surface-container-high)"
        >
          {t("new_listing")}
        </Link>
      </div>

      {listings.length === 0 ? (
        filter === "mine" ? (
          <EmptyMine />
        ) : filter !== "all" ? (
          <EmptyFiltered />
        ) : (
          <EmptyColdStart />
        )
      ) : (
        <ul className="space-y-3">
          {listings.map((l) => (
            <li key={l.id}>
              <Link
                href={`/connections/${l.id}`}
                className="block rounded-xl ghost-border p-5 hover:bg-(--color-surface-container-high) transition-colors"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-3 flex-wrap">
                    <p className="text-body-lg font-semibold truncate">
                      {l.workspaces?.name ?? t("card.unknown_company")}
                    </p>
                    <TypeChip
                      type={l.listing_type}
                      label={l.listing_type === "exit" ? t("type.exit") : t("type.partnership")}
                    />
                  </div>
                  <p className="text-body-md text-(--color-on-surface-variant) line-clamp-2">
                    {l.public_summary}
                  </p>
                  <div className="flex items-center gap-3 text-body-sm text-(--color-on-surface-variant)">
                    <span className="tabular-nums">{summarizeTypeData(l)}</span>
                    <span>·</span>
                    <span className="tabular-nums">
                      {t("detail.listed_on", { date: new Date(l.listed_at).toLocaleDateString() })}
                    </span>
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

function FilterChips({ active }: { active: FilterType }) {
  const t = useT("connections");
  const filters: { value: FilterType; labelKey: string }[] = [
    { value: "all", labelKey: "filter.all" },
    { value: "exit", labelKey: "filter.exit" },
    { value: "partnership", labelKey: "filter.partnership" },
    { value: "mine", labelKey: "filter.mine" },
  ];
  return (
    <nav className="flex gap-2 flex-wrap" aria-label={t("filter.aria_label")}>
      {filters.map((f) => {
        const isActive = active === f.value;
        return (
          <Link
            key={f.value}
            href={f.value === "all" ? "/connections" : `/connections?filter=${f.value}`}
            className={`rounded-full px-3 py-1 text-label-sm transition-colors ${
              isActive
                ? "bg-(--color-primary) text-(--color-on-primary)"
                : "ghost-border hover:bg-(--color-surface-container-high)"
            }`}
            aria-current={isActive ? "page" : undefined}
          >
            {t(f.labelKey)}
          </Link>
        );
      })}
    </nav>
  );
}

function EmptyColdStart() {
  const t = useT("connections");
  return (
    <div className="rounded-xl ghost-border p-10 text-center space-y-4">
      <p className="text-body-lg font-semibold">{t("empty.cold_start.title")}</p>
      <p className="text-body-sm text-(--color-on-surface-variant) max-w-md mx-auto">
        {t("empty.cold_start.body")}
      </p>
      <div className="flex gap-3 justify-center pt-2">
        <Link
          href="/connections/new?type=exit"
          className="rounded-lg ghost-border px-4 py-2 text-label-sm hover:bg-(--color-surface-container-high)"
        >
          {t("empty.cold_start.list_exit")}
        </Link>
        <Link
          href="/connections/new?type=partnership"
          className="rounded-lg bg-(--color-primary) text-(--color-on-primary) px-4 py-2 text-label-sm hover:opacity-90"
        >
          {t("empty.cold_start.find_partner")}
        </Link>
      </div>
    </div>
  );
}

function EmptyFiltered() {
  const t = useT("connections");
  const tCommon = useT();
  return (
    <div className="rounded-xl ghost-border p-10 text-center space-y-3">
      <p className="text-body-lg">{t("empty.filtered.title")}</p>
      <Link href="/connections" className="text-body-sm underline">
        {tCommon("actions.clear_filters")}
      </Link>
    </div>
  );
}

function EmptyMine() {
  const t = useT("connections");
  return (
    <div className="rounded-xl ghost-border p-10 text-center space-y-3">
      <p className="text-body-lg">{t("empty.mine.title")}</p>
      <Link
        href="/connections/new"
        className="inline-block rounded-lg bg-(--color-primary) text-(--color-on-primary) px-4 py-2 text-label-sm hover:opacity-90"
      >
        {t("empty.mine.cta")}
      </Link>
    </div>
  );
}
