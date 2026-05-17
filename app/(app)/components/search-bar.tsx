"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { useT } from "@/lib/i18n/useT";
import type { SearchResult } from "@/lib/supabase/types";

// ── Group icons (inline SVG, Tabler-style stroke) ────────────────────────────

function IconBuilding() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect x="2" y="4" width="12" height="10" rx="1" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M2 7h12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M6 14V10h4v4" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M5 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function IconList() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M6 4h7M6 8h7M6 12h7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="3" cy="4" r="1" fill="currentColor" />
      <circle cx="3" cy="8" r="1" fill="currentColor" />
      <circle cx="3" cy="12" r="1" fill="currentColor" />
    </svg>
  );
}

function IconCoins() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="6" cy="9" r="4" stroke="currentColor" strokeWidth="1.4" />
      <path d="M10 7a4 4 0 0 1 0 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M12 5a4 4 0 0 1 0 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
      className="animate-spin"
    >
      <circle
        cx="8"
        cy="8"
        r="6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeOpacity="0.25"
      />
      <path
        d="M8 2a6 6 0 0 1 6 6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ── Grouping helpers ─────────────────────────────────────────────────────────

type GroupKey = "workspace" | "connection_listing" | "financing_round";

const GROUP_ORDER: GroupKey[] = ["workspace", "connection_listing", "financing_round"];

function groupResults(results: SearchResult[]) {
  const map = new Map<GroupKey, SearchResult[]>();
  for (const r of results) {
    const key = r.entity_type as GroupKey;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(r);
  }
  return GROUP_ORDER.filter((k) => map.has(k)).map((k) => ({
    key: k,
    items: map.get(k)!,
  }));
}

// ── Debounce hook ────────────────────────────────────────────────────────────

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => {
      setDebounced(value);
    }, delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

// ── SearchBar ────────────────────────────────────────────────────────────────

export function SearchBar() {
  const t = useT("nav");
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [activeIdx, setActiveIdx] = useState(-1);

  const debouncedQuery = useDebounce(query, 300);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxId = "search-listbox";

  // ── Fetch on debounced query change ────────────────────────────────────────
  useEffect(() => {
    const trimmed = debouncedQuery.trim();
    if (trimmed.length < 2) {
      // Use a timeout-based update to avoid calling setState synchronously
      const id = setTimeout(() => {
        setResults([]);
        setLoading(false);
      }, 0);
      return () => clearTimeout(id);
    }
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    fetch(`/api/search?q=${encodeURIComponent(trimmed)}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data: SearchResult[]) => {
        if (!cancelled) {
          setResults(Array.isArray(data) ? data : []);
          setActiveIdx(-1);
        }
      })
      .catch(() => {
        if (!cancelled) setResults([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  // ── Close on outside click ──────────────────────────────────────────────────
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) {
        setFocused(false);
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  // ── Close on Escape ──────────────────────────────────────────────────────────
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setFocused(false);
        inputRef.current?.blur();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // ── ⌘K global shortcut ─────────────────────────────────────────────────────
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setFocused(true);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // ── Derived values ──────────────────────────────────────────────────────────
  const trimmed = query.trim();
  const showDropdown =
    focused && trimmed.length >= 2 && (loading || results.length > 0);
  const showEmpty =
    focused && !loading && trimmed.length >= 2 && results.length === 0;
  const groups = useMemo(() => groupResults(results), [results]);

  // Flat list for keyboard nav — computed as a derived value (no ref)
  const flatResults = useMemo(() => results, [results]);

  // Per-group start offset in the flat list
  const groupOffsets = useMemo(() => {
    const offsets: Partial<Record<GroupKey, number>> = {};
    let off = 0;
    for (const g of groups) {
      offsets[g.key] = off;
      off += g.items.length;
    }
    return offsets as Record<GroupKey, number>;
  }, [groups]);

  // Active descendant id derived purely from state
  const activeDescendantId =
    activeIdx >= 0 && flatResults[activeIdx]
      ? `search-opt-${flatResults[activeIdx].entity_id}`
      : undefined;

  // ── Keyboard nav ────────────────────────────────────────────────────────────
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!showDropdown && !showEmpty) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIdx((i) => Math.min(i + 1, flatResults.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIdx((i) => Math.max(i - 1, -1));
      } else if (e.key === "Enter") {
        if (activeIdx >= 0 && flatResults[activeIdx]) {
          e.preventDefault();
          router.push(flatResults[activeIdx].url);
          setFocused(false);
          setQuery("");
        }
      }
    },
    [activeIdx, flatResults, router, showDropdown, showEmpty],
  );

  const handleSelect = useCallback(
    (url: string) => {
      router.push(url);
      setFocused(false);
      setQuery("");
    },
    [router],
  );

  function groupLabel(key: GroupKey): string {
    if (key === "workspace") return t("search.group.companies");
    if (key === "connection_listing") return t("search.group.listings");
    return t("search.group.rounds");
  }

  function groupIcon(key: GroupKey) {
    if (key === "workspace") return <IconBuilding />;
    if (key === "connection_listing") return <IconList />;
    return <IconCoins />;
  }

  return (
    <div ref={containerRef} className="relative block flex-1 max-w-xl">
      <label className="relative block">
        <span className="sr-only">{t("search.aria_label")}</span>

        {/* Search icon / spinner */}
        <span
          className="
            pointer-events-none absolute top-1/2 -translate-y-1/2
            start-3 text-(--color-on-surface-variant)
          "
        >
          {loading ? (
            <SpinnerIcon />
          ) : (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
              <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
              <path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          )}
        </span>

        <input
          ref={inputRef}
          type="search"
          role="combobox"
          aria-expanded={showDropdown || showEmpty}
          aria-autocomplete="list"
          aria-controls={listboxId}
          aria-activedescendant={activeDescendantId}
          placeholder={t("search.placeholder")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onKeyDown={handleKeyDown}
          className="
            block w-full rounded-lg bg-(--color-surface-container-low) ghost-border
            ps-9 pe-10 py-2 text-body-sm
            text-(--color-on-surface) placeholder:text-(--color-on-surface-variant)/70
            focus:outline-none focus:border-(--color-primary)
          "
        />

        <kbd
          className="
            hidden md:inline-flex absolute top-1/2 -translate-y-1/2 end-2.5
            items-center rounded-md px-1.5 py-0.5
            bg-(--color-surface-container-high) ghost-border
            text-label-sm text-(--color-on-surface-variant) tabular-nums
          "
          aria-hidden
        >
          ⌘K
        </kbd>
      </label>

      {/* Dropdown */}
      {(showDropdown || showEmpty) && (
        <div
          id={listboxId}
          role="listbox"
          aria-label={t("search.aria_label")}
          className="
            absolute top-full mt-2 start-0 end-0 z-50
            rounded-xl bg-(--color-surface-container-high) ghost-border
            shadow-[0_20px_60px_-30px_rgba(13,19,34,0.5)]
            max-h-[400px] overflow-y-auto
          "
        >
          {loading && (
            <div className="flex items-center gap-2 px-4 py-3 text-body-sm text-(--color-on-surface-variant)">
              <SpinnerIcon />
              <span>{t("search.searching")}</span>
            </div>
          )}

          {showEmpty && (
            <div className="px-4 py-3 text-body-sm text-(--color-on-surface-variant)">
              {t("search.empty.no_results", { query: trimmed })}
            </div>
          )}

          {!loading &&
            groups.map((group) => (
              <div key={group.key}>
                {/* Group header */}
                <div
                  className="
                    flex items-center gap-2 px-4 pt-3 pb-1
                    text-label-sm text-(--color-on-surface-variant)
                  "
                >
                  <span className="text-(--color-on-surface-disabled)">
                    {groupIcon(group.key)}
                  </span>
                  <span className="uppercase tracking-wide text-[10px] font-semibold">
                    {groupLabel(group.key)}
                  </span>
                </div>

                {/* Items */}
                {group.items.map((item, itemIdx) => {
                  const flatI = groupOffsets[group.key] + itemIdx;
                  const isActive = flatI === activeIdx;
                  return (
                    <div
                      key={item.entity_id}
                      id={`search-opt-${item.entity_id}`}
                      role="option"
                      aria-selected={isActive}
                      onMouseEnter={() => setActiveIdx(flatI)}
                      onMouseLeave={() => setActiveIdx(-1)}
                      onClick={() => handleSelect(item.url)}
                      className={`
                        flex flex-col px-4 py-2 cursor-pointer transition-colors
                        ${isActive
                          ? "bg-(--color-surface-container-low)"
                          : "hover:bg-(--color-surface-container-low)"
                        }
                      `}
                    >
                      <span className="text-body-md font-medium text-(--color-on-surface) truncate">
                        {item.title}
                      </span>
                      {item.subtitle && (
                        <span className="text-body-sm text-(--color-on-surface-variant) truncate">
                          {item.subtitle}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}

          <div className="h-1" />
        </div>
      )}
    </div>
  );
}
