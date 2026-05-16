"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { useT } from "@/lib/i18n/useT";

export interface AuditEvent {
  id: string;
  description: string;
  created_at: string;
  actor_email: string;
}

export interface ActiveRound {
  id: string;
  name: string;
  target_raise_sar: number | string | null;
}

export interface LatestUpdate {
  id: string;
  subject: string;
}

export interface DashboardData {
  workspaceName: string;
  shareholdersCount: number;
  hasPool: boolean;
  poolPct: string;
  mrrSar: number | null;
  latestMetricMonth: string | null;
  complianceDueCount: number;
  pendingResolutionsCount: number;
  totalVestedRounded: string;
  activeRound: ActiveRound | null;
  hotLeads: number;
  pipelineCount: number;
  pipelineCommittedSar: number | null;
  closingItemsCount: number;
  latestUpdate: LatestUpdate | null;
  latestUpdateViews: number;
  recentAudit: AuditEvent[];
  pulseSection: ReactNode;
}

function fmtSAR(n: number | null, sarLabel: string): string {
  if (n === null) return "—";
  return `${sarLabel} ${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function DashboardView(props: DashboardData) {
  const t = useT("dashboard");
  const tCommon = useT();
  const tNav = useT("nav");
  const sarLabel = tCommon("currency.sar_prefix");

  const NAV_KEYS = [
    "company",
    "cap_table",
    "rounds",
    "term_sheets",
    "investor_updates",
    "esop",
    "governance",
    "compliance",
    "vault",
    "traction",
    "dilution",
    "waterfall",
    "acquisition",
    "valuation",
    "members",
    "marketplace",
    "connections",
    "audit",
    "explore",
  ] as const;

  const NAV_HREFS: Record<(typeof NAV_KEYS)[number], string> = {
    company: "/company",
    cap_table: "/cap-table",
    rounds: "/rounds",
    term_sheets: "/term-sheets",
    investor_updates: "/investor-updates",
    esop: "/esop",
    governance: "/governance",
    compliance: "/compliance",
    vault: "/vault",
    traction: "/traction",
    dilution: "/dilution",
    waterfall: "/waterfall",
    acquisition: "/acquisition",
    valuation: "/valuation",
    members: "/members",
    marketplace: "/marketplace",
    connections: "/connections",
    audit: "/audit",
    explore: "/explore",
  };

  return (
    <main className="mx-auto max-w-5xl px-6 py-10 space-y-10">
      <header>
        <p className="text-label-md uppercase text-(--color-on-surface-variant)">
          {tNav("dashboard")}
        </p>
        <h1 className="mt-1 text-display-sm font-semibold tracking-tight">
          {props.workspaceName}
        </h1>
        <p className="mt-2 text-body-md text-(--color-on-surface-variant)">
          {t("snapshot_subtitle")}
        </p>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Tile
          label={t("tile.shareholders")}
          value={String(props.shareholdersCount)}
          href="/cap-table"
        />
        <Tile
          label={t("tile.pool_utilised")}
          value={props.hasPool ? props.poolPct : t("tile.no_pool")}
          href="/esop"
        />
        <Tile
          label={t("tile.latest_mrr")}
          value={fmtSAR(props.mrrSar, sarLabel)}
          href="/traction"
          sub={props.latestMetricMonth ?? undefined}
        />
        <Tile
          label={t("tile.compliance_due")}
          value={String(props.complianceDueCount)}
          href="/compliance"
          sub={t("tile.compliance_due.sub")}
          alert={props.complianceDueCount > 0}
        />
        <Tile
          label={t("tile.pending_resolutions")}
          value={String(props.pendingResolutionsCount)}
          href="/governance"
          alert={props.pendingResolutionsCount > 0}
        />
        <Tile
          label={t("tile.vested_options")}
          value={props.totalVestedRounded}
          href="/esop"
        />
        {props.activeRound ? (
          <Tile
            label={t("tile.active_round")}
            value={props.activeRound.name}
            href={`/rounds/${props.activeRound.id}`}
            sub={
              props.activeRound.target_raise_sar
                ? t("tile.round_target", {
                    amount: fmtSAR(Number(props.activeRound.target_raise_sar), sarLabel),
                  })
                : t("tile.round_open")
            }
          />
        ) : (
          <Tile
            label={t("tile.fundraising")}
            value={t("tile.no_open_round")}
            href="/rounds"
          />
        )}
      </section>

      {props.activeRound && (
        <section>
          <h2 className="text-label-md uppercase text-(--color-on-surface-variant) mb-3">
            {t("investment_hub.heading", { round: props.activeRound.name })}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Tile
              label={t("investment_hub.pipeline")}
              value={String(props.pipelineCount)}
              href={`/rounds/${props.activeRound.id}`}
              sub={
                props.hotLeads > 0
                  ? t(props.hotLeads === 1 ? "investment_hub.pipeline.hot" : "investment_hub.pipeline.hot_plural", { count: props.hotLeads })
                  : t("investment_hub.pipeline.tracked", { count: props.pipelineCount })
              }
              alert={props.hotLeads > 0}
            />
            <Tile
              label={t("investment_hub.committed")}
              value={props.pipelineCommittedSar ? fmtSAR(props.pipelineCommittedSar, sarLabel) : "—"}
              href={`/rounds/${props.activeRound.id}`}
              sub={
                props.activeRound.target_raise_sar
                  ? t("investment_hub.committed.of_target", {
                      target: fmtSAR(Number(props.activeRound.target_raise_sar), sarLabel),
                    })
                  : t("investment_hub.committed.total")
              }
            />
            <Tile
              label={t("investment_hub.closing_items")}
              value={String(props.closingItemsCount)}
              href={`/rounds/${props.activeRound.id}`}
              sub={t("investment_hub.closing_items.sub")}
              alert={props.closingItemsCount > 0}
            />
            <Tile
              label={t("investment_hub.last_update")}
              value={props.latestUpdate ? String(props.latestUpdateViews) : "—"}
              href={props.latestUpdate ? `/investor-updates/${props.latestUpdate.id}` : "/investor-updates"}
              sub={props.latestUpdate ? props.latestUpdate.subject : t("investment_hub.last_update.none")}
            />
          </div>
        </section>
      )}

      {props.pulseSection}

      <section>
        <h2 className="text-label-md uppercase text-(--color-on-surface-variant) mb-4">
          {t("navigate.heading")}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
          {NAV_KEYS.map((key) => (
            <Link
              key={key}
              href={NAV_HREFS[key]}
              className="rounded-md bg-(--color-surface-container-low) px-4 py-3 hover:bg-(--color-surface-container-high) transition-colors"
            >
              <p className="text-label-lg font-medium">{t(`nav.${key}.label`)}</p>
              <p className="text-body-sm text-(--color-on-surface-variant)">
                {t(`nav.${key}.desc`)}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {props.recentAudit.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-label-md uppercase text-(--color-on-surface-variant)">
              {t("recent_activity.heading")}
            </h2>
            <Link
              href="/audit"
              className="text-body-sm text-(--color-on-surface-variant) underline"
            >
              {t("recent_activity.view_all")}
            </Link>
          </div>
          <div className="rounded-xl bg-(--color-surface-container-low) overflow-hidden">
            <table className="w-full text-body-sm">
              <tbody>
                {props.recentAudit.map((evt) => (
                  <tr
                    key={evt.id}
                    className="border-t first:border-t-0 border-(--color-outline-variant)/15"
                  >
                    <td className="px-4 py-3 text-(--color-on-surface-variant) font-mono text-label-sm whitespace-nowrap">
                      {fmtDate(evt.created_at)}
                    </td>
                    <td className="px-4 py-3">{evt.description}</td>
                    <td className="px-4 py-3 text-end text-(--color-on-surface-variant)">
                      {evt.actor_email}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </main>
  );
}

function Tile({
  label,
  value,
  href,
  sub,
  alert,
}: {
  label: string;
  value: string;
  href: string;
  sub?: string;
  alert?: boolean;
}) {
  return (
    <Link
      href={href}
      className="rounded-md bg-(--color-surface-container-high) p-4 hover:bg-(--color-surface-bright) transition-colors block"
    >
      <p className="text-label-md uppercase text-(--color-on-surface-variant)">{label}</p>
      <p
        className={`mt-2 text-display-sm font-semibold tracking-tight tabular-nums ${
          alert ? "text-(--color-warning)" : ""
        }`}
      >
        {value}
      </p>
      {sub && (
        <p className="mt-1 text-body-sm text-(--color-on-surface-variant)">{sub}</p>
      )}
    </Link>
  );
}
