"use client";

import Link from "next/link";
import { useState, useMemo } from "react";

export interface WorkspaceCard {
  id: string;
  slug: string;
  name: string;
  one_liner: string;
  sector: string;
  country: string;
  funding_stage: string;
  city: string | null;
  created_at: string;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

function Chip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        inline-flex items-center rounded-full px-3 py-1 text-label-sm uppercase tracking-wider transition-colors
        ${active
          ? "bg-(--color-primary)/20 text-(--color-primary) font-medium"
          : "bg-(--color-surface-container-high) text-(--color-on-surface-variant) hover:bg-(--color-surface-bright) hover:text-(--color-on-surface)"
        }
      `}
    >
      {label}
    </button>
  );
}

export function ExploreGrid({ workspaces }: { workspaces: WorkspaceCard[] }) {
  const [query, setQuery] = useState("");
  const [sector, setSector] = useState<string | null>(null);
  const [stage, setStage] = useState<string | null>(null);

  const sectors = useMemo(
    () => Array.from(new Set(workspaces.map((w) => w.sector))).sort(),
    [workspaces],
  );
  const stages = useMemo(
    () => Array.from(new Set(workspaces.map((w) => w.funding_stage))).sort(),
    [workspaces],
  );

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return workspaces.filter((w) => {
      if (sector && w.sector !== sector) return false;
      if (stage && w.funding_stage !== stage) return false;
      if (q && !w.name.toLowerCase().includes(q) && !w.one_liner.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [workspaces, query, sector, stage]);

  const hasFilters = query.trim() || sector || stage;

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 text-(--color-on-surface-variant)"
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden
        >
          <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.4" />
          <path d="M10 10l3.5 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
        <input
          type="search"
          placeholder="Search startups…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-lg bg-(--color-surface-container-high) ghost-border pl-9 pr-4 py-2.5 text-body-md placeholder:text-(--color-on-surface-variant) focus:outline-none focus:border-(--color-primary)"
        />
      </div>

      {/* Sector chips */}
      {sectors.length > 1 && (
        <div className="flex flex-wrap gap-2">
          <Chip label="All sectors" active={sector === null} onClick={() => setSector(null)} />
          {sectors.map((s) => (
            <Chip key={s} label={s} active={sector === s} onClick={() => setSector(sector === s ? null : s)} />
          ))}
        </div>
      )}

      {/* Stage chips */}
      {stages.length > 1 && (
        <div className="flex flex-wrap gap-2">
          <Chip label="All stages" active={stage === null} onClick={() => setStage(null)} />
          {stages.map((s) => (
            <Chip key={s} label={s} active={stage === s} onClick={() => setStage(stage === s ? null : s)} />
          ))}
        </div>
      )}

      {/* Count */}
      <p className="text-body-sm text-(--color-on-surface-variant)">
        {filtered.length === workspaces.length
          ? `${workspaces.length} startup${workspaces.length === 1 ? "" : "s"}`
          : `${filtered.length} of ${workspaces.length} startups`}
        {hasFilters && (
          <button
            type="button"
            onClick={() => { setQuery(""); setSector(null); setStage(null); }}
            className="ml-3 underline hover:text-(--color-on-surface) transition-colors"
          >
            Clear filters
          </button>
        )}
      </p>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="rounded-xl bg-(--color-surface-container-low) p-16 text-center">
          <p className="text-headline-sm font-medium">No matches</p>
          <p className="mt-2 text-body-md text-(--color-on-surface-variant)">
            Try a different search or clear the filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((w) => (
            <Link
              key={w.id}
              href={`/explore/${w.slug}`}
              className="group block rounded-xl bg-(--color-surface-container-low) p-6 hover:bg-(--color-surface-container-high) transition-colors"
            >
              <p className="text-label-sm uppercase tracking-wider text-(--color-on-surface-variant)">
                {w.sector} · {w.city ?? w.country}
              </p>
              <h2 className="mt-2 text-headline-sm font-semibold tracking-tight group-hover:text-(--color-primary) transition-colors">
                {w.name}
              </h2>
              <p className="mt-2 text-body-sm text-(--color-on-surface-variant) line-clamp-3">
                {w.one_liner}
              </p>
              <div className="mt-4 flex items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-(--color-surface-bright) px-2.5 py-0.5 text-label-sm uppercase tracking-wider">
                  {w.funding_stage}
                </span>
                <span className="ml-auto text-label-sm text-(--color-on-surface-variant) tabular-nums">
                  {fmtDate(w.created_at)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
