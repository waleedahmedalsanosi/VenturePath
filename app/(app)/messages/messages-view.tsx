"use client";

import Link from "next/link";

import { WorkspaceMark } from "@/app/(app)/components/workspace-mark";
import { truncateWords } from "@/lib/text/truncate";
import { useT } from "@/lib/i18n/useT";

export interface InquiryRow {
  id: string;
  status: "sent" | "accepted" | "declined" | "closed";
  message: string | null;
  sentAt: string;
  respondedAt: string | null;
  listingId: string;
  listingType: "exit" | "partnership";
  listingSummary: string;
  direction: "incoming" | "outgoing";
  counterparty: string | null;
}

type Direction = "incoming" | "outgoing" | "all";

const STATUS_TONE: Record<InquiryRow["status"], string> = {
  sent: "text-(--color-on-surface-variant) bg-(--color-surface-container-high)",
  accepted: "text-(--color-success) bg-(--color-success)/15",
  declined: "text-(--color-error) bg-(--color-error)/15",
  closed: "text-(--color-on-surface-variant) bg-(--color-surface-container-low)",
};

export function MessagesView({
  rows,
  direction,
  statusFilter,
  counts,
}: {
  rows: InquiryRow[];
  direction: Direction;
  statusFilter: string | null;
  counts: { all: number; incoming: number; outgoing: number };
}) {
  const t = useT("messages");

  return (
    <main className="mx-auto max-w-5xl px-6 py-10 space-y-8">
      <header>
        <p className="text-label-md uppercase text-(--color-on-surface-variant)">
          {t("eyebrow")}
        </p>
        <h1 className="mt-1 text-display-sm font-semibold tracking-tight">
          {t("title")}
        </h1>
        <p className="mt-2 text-body-md text-(--color-on-surface-variant)">
          {t("subtitle")}
        </p>
      </header>

      <nav className="flex gap-2 flex-wrap" aria-label={t("filter.aria_label")}>
        <FilterChip
          href={hrefFor("all", statusFilter)}
          active={direction === "all"}
          label={t("filter.all")}
          count={counts.all}
        />
        <FilterChip
          href={hrefFor("incoming", statusFilter)}
          active={direction === "incoming"}
          label={t("filter.incoming")}
          count={counts.incoming}
        />
        <FilterChip
          href={hrefFor("outgoing", statusFilter)}
          active={direction === "outgoing"}
          label={t("filter.outgoing")}
          count={counts.outgoing}
        />
      </nav>

      {rows.length === 0 ? (
        <Empty />
      ) : (
        <ul className="space-y-3">
          {rows.map((r) => (
            <li key={r.id}>
              <Link
                href={`/connections/${r.listingId}`}
                className="
                  block rounded-xl ghost-border p-5
                  hover:bg-(--color-surface-container-high) transition-colors
                "
              >
                <div className="flex items-start justify-between gap-4">
                  <WorkspaceMark name={r.counterparty ?? null} />
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`
                          rounded-full px-2 py-0.5 text-label-sm font-medium uppercase tracking-wider
                          ${STATUS_TONE[r.status]}
                        `}
                      >
                        {t(`status.${r.status}`)}
                      </span>
                      <span className="text-label-sm uppercase tracking-wider text-(--color-on-surface-variant)">
                        {r.direction === "outgoing" ? t("direction.outgoing") : t("direction.incoming")}
                      </span>
                      <span className="text-label-sm uppercase tracking-wider text-(--color-on-surface-variant)">
                        · {r.listingType === "exit" ? t("type.exit") : t("type.partnership")}
                      </span>
                    </div>
                    <p className="text-body-md font-medium text-(--color-on-surface) truncate">
                      {r.counterparty ?? t("unknown_counterparty")}
                    </p>
                    <p className="text-body-sm text-(--color-on-surface-variant) line-clamp-2">
                      {truncateWords(r.message ?? r.listingSummary, 160)}
                    </p>
                  </div>
                  <span className="text-body-sm text-(--color-on-surface-variant) tabular-nums whitespace-nowrap">
                    {new Date(r.sentAt).toLocaleDateString()}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

function hrefFor(direction: Direction, status: string | null): string {
  const params = new URLSearchParams();
  if (direction !== "all") params.set("direction", direction);
  if (status) params.set("status", status);
  const q = params.toString();
  return q ? `/messages?${q}` : "/messages";
}

function FilterChip({
  href,
  active,
  label,
  count,
}: {
  href: string;
  active: boolean;
  label: string;
  count: number;
}) {
  return (
    <Link
      href={href}
      className={`
        inline-flex items-center gap-2 rounded-full px-3 py-1 text-label-sm transition-colors
        ${active
          ? "bg-(--color-primary) text-(--color-on-primary)"
          : "ghost-border hover:bg-(--color-surface-container-high)"
        }
      `}
      aria-current={active ? "page" : undefined}
    >
      <span>{label}</span>
      <span className="tabular-nums text-label-sm opacity-70">{count}</span>
    </Link>
  );
}

function Empty() {
  const t = useT("messages");
  return (
    <div className="rounded-xl ghost-border p-10 text-center space-y-3">
      <p className="text-body-lg font-semibold">{t("empty.title")}</p>
      <p className="text-body-sm text-(--color-on-surface-variant) max-w-md mx-auto">
        {t("empty.body")}
      </p>
      <div className="pt-2">
        <Link
          href="/connections"
          className="
            inline-flex rounded-lg bg-(--color-primary) text-(--color-on-primary)
            px-4 py-2 text-label-sm hover:opacity-90
          "
        >
          {t("empty.cta")}
        </Link>
      </div>
    </div>
  );
}
