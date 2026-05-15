"use client";

import { useState, useTransition } from "react";

import { createDataRoomLink, revokeDataRoomLink } from "./data-room-actions";

const TIER_META: Record<string, { label: string; bg: string; fg: string; description: string }> = {
  intro:     { label: "Intro",     bg: "bg-(--color-info)/10",    fg: "text-(--color-info)",    description: "Deck, team bio, one-pager" },
  standard:  { label: "Standard",  bg: "bg-(--color-warning)/15", fg: "text-(--color-warning)", description: "Financials, roadmap, product" },
  diligence: { label: "Diligence", bg: "bg-(--color-error)/10",   fg: "text-(--color-error)",   description: "Full legal, contracts, cap table" },
};

interface DataRoomLink {
  id: string;
  label: string;
  token: string;
  is_active: boolean;
  view_count: number;
  expires_at: string | null;
  created_at: string;
  access_tier: "intro" | "standard" | "diligence";
}

interface ViewEvent {
  viewed_at: string;
  user_agent: string | null;
}

interface DataRoomProps {
  roundId: string;
  links: DataRoomLink[];
  viewsByLink: Record<string, ViewEvent[]>;
  appUrl: string;
}

function deviceFromUA(ua: string | null): string {
  if (!ua) return "Unknown";
  if (/iPhone|Android.+Mobile/.test(ua)) return "Mobile";
  if (/iPad|Tablet/.test(ua)) return "Tablet";
  if (/Macintosh|Windows|Linux/.test(ua)) return "Desktop";
  return "Other";
}

function fmtRelativeDate(iso: string): string {
  const date = new Date(iso);
  const now = Date.now();
  const diffMs = now - date.getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function DataRoom({ roundId, links, viewsByLink, appUrl }: DataRoomProps) {
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await createDataRoomLink(roundId, fd);
      if (!result.ok) setError(result.error ?? "Failed.");
      else { setShowForm(false); (e.target as HTMLFormElement).reset(); }
    });
  }

  function handleRevoke(linkId: string) {
    if (!confirm("Revoke this link? Anyone with the link will lose access.")) return;
    startTransition(async () => {
      const result = await revokeDataRoomLink(linkId, roundId);
      if (!result.ok) setError(result.error ?? "Failed.");
    });
  }

  function handleCopy(token: string) {
    const url = `${appUrl}/data-room/${token}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(token);
      setTimeout(() => setCopied(null), 2000);
    });
  }

  const activeLinks = links.filter((l) => l.is_active);
  const revokedLinks = links.filter((l) => !l.is_active);

  // Aggregate engagement summary across all active links.
  const totalViews = activeLinks.reduce((s, l) => s + l.view_count, 0);
  const uniqueViewers = new Set<string>();
  for (const l of activeLinks) {
    for (const v of viewsByLink[l.id] ?? []) {
      if (v.user_agent) uniqueViewers.add(v.user_agent);
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-label-md uppercase text-(--color-on-surface-variant)">
          Data room
        </h2>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="rounded-lg ghost-border px-4 py-2 text-label-sm hover:bg-(--color-surface-container-high)"
        >
          {showForm ? "Cancel" : "+ Create link"}
        </button>
      </div>

      <p className="text-body-sm text-(--color-on-surface-variant)">
        Share a tracked link with investors. Each link shows documents marked
        as <strong>data room</strong> visibility in your Vault. Files can be
        downloaded by authenticated users — the link itself is open-access.
      </p>

      {/* Engagement summary */}
      {activeLinks.length > 0 && totalViews > 0 && (
        <div className="rounded-xl bg-(--color-surface-container-low) px-5 py-4 flex flex-wrap gap-x-8 gap-y-2 text-body-sm">
          <span>
            <span className="text-(--color-on-surface-variant)">Total views </span>
            <span className="font-medium tabular-nums">{totalViews}</span>
          </span>
          <span>
            <span className="text-(--color-on-surface-variant)">Distinct devices </span>
            <span className="font-medium tabular-nums">{uniqueViewers.size}</span>
          </span>
          <span>
            <span className="text-(--color-on-surface-variant)">Active links </span>
            <span className="font-medium tabular-nums">{activeLinks.length}</span>
          </span>
        </div>
      )}

      {/* Create form */}
      {showForm && (
        <form
          onSubmit={handleCreate}
          className="rounded-xl bg-(--color-surface-container-low) p-5 space-y-4"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-label-lg" htmlFor="dr-label">Link label</label>
              <input id="dr-label" name="label" defaultValue="Investor Link"
                className="w-full rounded-lg bg-(--color-surface-container-high) px-3 py-2 text-body-md ghost-border focus:outline-none focus:ring-2 focus:ring-(--color-primary)/40" />
              <p className="text-body-sm text-(--color-on-surface-variant)">Helps you identify which investor received which link.</p>
            </div>
            <div className="space-y-1.5">
              <label className="text-label-lg" htmlFor="dr-expires">Expires after (days)</label>
              <input id="dr-expires" name="expires_days" type="number" min="0" max="365" defaultValue="0"
                className="w-full rounded-lg bg-(--color-surface-container-high) px-3 py-2 text-body-md ghost-border focus:outline-none focus:ring-2 focus:ring-(--color-primary)/40" />
              <p className="text-body-sm text-(--color-on-surface-variant)">0 = no expiry.</p>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-label-lg">Access tier</p>
            <div className="grid grid-cols-3 gap-2">
              {(["intro", "standard", "diligence"] as const).map((t) => {
                const m = TIER_META[t]!;
                return (
                  <label key={t} className="cursor-pointer">
                    <input type="radio" name="access_tier" value={t} defaultChecked={t === "intro"}
                      className="sr-only peer" />
                    <div className={`rounded-lg p-3 ghost-border peer-checked:border-(--color-primary) peer-checked:bg-(--color-primary)/5 hover:bg-(--color-surface-container-high) transition-colors`}>
                      <p className={`text-label-sm font-medium uppercase tracking-wider rounded-full px-2 py-0.5 inline-flex mb-1 ${m.bg} ${m.fg}`}>{m.label}</p>
                      <p className="text-body-sm text-(--color-on-surface-variant)">{m.description}</p>
                    </div>
                  </label>
                );
              })}
            </div>
            <p className="text-body-sm text-(--color-on-surface-variant)">
              Each tier is cumulative — Diligence includes Standard and Intro docs.
            </p>
          </div>
          {error && (
            <p className="rounded-md bg-(--color-error)/10 px-3 py-2 text-body-sm text-(--color-error)">{error}</p>
          )}
          <button type="submit" disabled={isPending}
            className="rounded-lg bg-(--color-primary)/15 px-5 py-2 text-label-lg text-(--color-primary) hover:bg-(--color-primary)/25 transition-colors disabled:opacity-50">
            {isPending ? "Creating…" : "Generate link"}
          </button>
        </form>
      )}

      {/* Active links */}
      {activeLinks.length === 0 && !showForm ? (
        <div className="rounded-xl bg-(--color-surface-container-low) px-6 py-8 text-center">
          <p className="text-body-md text-(--color-on-surface-variant)">
            No data room links yet. Create one to share with investors.
          </p>
        </div>
      ) : activeLinks.length > 0 ? (
        <div className="rounded-xl bg-(--color-surface-container-low) overflow-hidden">
          <table className="w-full text-body-sm">
            <thead>
              <tr className="text-label-md uppercase text-(--color-on-surface-variant)">
                <th className="px-4 py-3 text-start font-normal">Label</th>
                <th className="px-4 py-3 text-start font-normal hidden sm:table-cell">Tier</th>
                <th className="px-4 py-3 text-start font-normal">Views</th>
                <th className="px-4 py-3 text-start font-normal hidden md:table-cell">Last viewed</th>
                <th className="px-4 py-3 text-start font-normal hidden lg:table-cell">Expires</th>
                <th className="px-4 py-3 text-end font-normal" aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {activeLinks.map((l) => {
                const views = viewsByLink[l.id] ?? [];
                const lastView = views[0];
                const isExpanded = expandedId === l.id;
                return (
                  <>
                    <tr key={l.id} className="border-t border-(--color-outline-variant)/15 align-middle group">
                      <td className="px-4 py-3">
                        <div className="font-medium">{l.label}</div>
                        <div className="text-body-sm text-(--color-on-surface-variant) font-mono truncate max-w-[200px]">
                          /data-room/{l.token}
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        {(() => {
                          const m = TIER_META[l.access_tier]!;
                          return (
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-label-sm font-medium uppercase tracking-wider ${m.bg} ${m.fg}`}>
                              {m.label}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="px-4 py-3 tabular-nums">
                        {l.view_count > 0 ? (
                          <button
                            type="button"
                            onClick={() => setExpandedId(isExpanded ? null : l.id)}
                            className="text-display-sm font-semibold hover:text-(--color-primary) transition-colors"
                            title="View activity"
                          >
                            {l.view_count}
                          </button>
                        ) : (
                          <span className="text-display-sm font-semibold text-(--color-on-surface-disabled)">0</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-(--color-on-surface-variant) hidden md:table-cell whitespace-nowrap">
                        {lastView ? fmtRelativeDate(lastView.viewed_at) : "—"}
                      </td>
                      <td className="px-4 py-3 text-(--color-on-surface-variant) hidden lg:table-cell whitespace-nowrap">
                        {l.expires_at
                          ? new Date(l.expires_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
                          : "Never"}
                      </td>
                      <td className="px-4 py-3 text-end">
                        <div className="flex items-center justify-end gap-3">
                          <button
                            type="button"
                            onClick={() => handleCopy(l.token)}
                            className="text-body-sm text-(--color-primary) hover:underline"
                          >
                            {copied === l.token ? "Copied!" : "Copy link"}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRevoke(l.id)}
                            disabled={isPending}
                            className="text-body-sm text-(--color-on-surface-variant) hover:text-(--color-error) opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            Revoke
                          </button>
                        </div>
                      </td>
                    </tr>
                    {isExpanded && views.length > 0 && (
                      <tr key={`${l.id}-activity`} className="border-t border-(--color-outline-variant)/15">
                        <td colSpan={5} className="px-4 py-4 bg-(--color-surface-container-high)/40">
                          <p className="text-label-md uppercase text-(--color-on-surface-variant) mb-2">
                            Recent activity ({views.length}{views.length === 20 ? "+" : ""})
                          </p>
                          <ul className="space-y-1.5">
                            {views.slice(0, 20).map((v, i) => (
                              <li key={i} className="flex items-center justify-between text-body-sm">
                                <span className="text-(--color-on-surface-variant)">
                                  {new Date(v.viewed_at).toLocaleString(undefined, {
                                    month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
                                  })}
                                </span>
                                <span className="text-(--color-on-surface-variant) tabular-nums">
                                  {deviceFromUA(v.user_agent)}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}

      {/* Revoked links (collapsed) */}
      {revokedLinks.length > 0 && (
        <p className="text-body-sm text-(--color-on-surface-variant)">
          {revokedLinks.length} revoked link{revokedLinks.length > 1 ? "s" : ""} not shown.
        </p>
      )}
    </section>
  );
}
