"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useMemo } from "react";

// Standalone top-level links (outside any collapsible group).
// Dashboard is gated behind having a workspace; Explore is open to everyone.
const EXPLORE_LINK = { href: "/explore", label: "Explore" };
const DASHBOARD_LINK = { href: "/dashboard", label: "Dashboard" };

type NavGroup = { label: string; items: Array<{ href: string; label: string }> };

// Onboarding group shown to users who haven't created a workspace yet.
const ONBOARDING_GROUP: NavGroup = {
  label: "My startup",
  items: [{ href: "/setup", label: "Add your startup" }],
};

// Collapsible nav groups (shown only once the user has a workspace)
const NAV_GROUPS: NavGroup[] = [
  {
    label: "Company",
    items: [
      { href: "/company", label: "Company" },
      { href: "/members", label: "Members" },
    ],
  },
  {
    label: "Equity",
    items: [
      { href: "/cap-table", label: "Cap table" },
      { href: "/esop", label: "ESOP" },
      { href: "/rounds", label: "Rounds" },
    ],
  },
  {
    label: "Modeling",
    items: [
      { href: "/dilution", label: "Dilution" },
      { href: "/waterfall", label: "Waterfall" },
      { href: "/acquisition", label: "M&A" },
      { href: "/valuation", label: "Valuation" },
    ],
  },
  {
    label: "Operations",
    items: [
      { href: "/governance", label: "Governance" },
      { href: "/compliance", label: "Compliance" },
      { href: "/vault", label: "Vault" },
      { href: "/traction", label: "Traction" },
    ],
  },
  {
    label: "Activity",
    items: [{ href: "/audit", label: "Audit" }],
  },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  if (href === "/explore") return pathname === "/explore" || pathname.startsWith("/explore/");
  return pathname === href || pathname.startsWith(`${href}/`);
}

function groupHasActive(pathname: string, group: NavGroup): boolean {
  return group.items.some((item) => isActive(pathname, item.href));
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 13 13"
      fill="none"
      aria-hidden
      className={`shrink-0 transition-transform duration-200 ${open ? "rotate-180" : "rotate-0"}`}
    >
      <path
        d="M2.5 4.5l4 4 4-4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface SidebarProps {
  mobileOpen: boolean;
  onClose: () => void;
  desktopCollapsed: boolean;
  hasWorkspace: boolean;
}

export function Sidebar({ mobileOpen, onClose, desktopCollapsed, hasWorkspace }: SidebarProps) {
  const pathname = usePathname();

  // Pre-workspace users see only the onboarding group; everyone else sees the full nav.
  const groups = useMemo<NavGroup[]>(
    () => (hasWorkspace ? NAV_GROUPS : [ONBOARDING_GROUP]),
    [hasWorkspace],
  );
  // Dashboard is hidden until the user has a workspace (owner or shareholder).
  const topLinks = useMemo(
    () => (hasWorkspace ? [DASHBOARD_LINK, EXPLORE_LINK] : [EXPLORE_LINK]),
    [hasWorkspace],
  );

  // All groups collapsed by default; active group auto-expands. Onboarding group
  // starts open so the "Add your startup" CTA is immediately visible.
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const g of NAV_GROUPS) initial[g.label] = false;
    initial[ONBOARDING_GROUP.label] = true;
    return initial;
  });

  // Auto-expand whichever group contains the current route
  useEffect(() => {
    const activeGroup = groups.find((g) => groupHasActive(pathname, g));
    if (activeGroup) {
      setExpanded((prev) => ({ ...prev, [activeGroup.label]: true }));
    }
  }, [pathname, groups]);

  function toggleGroup(label: string) {
    setExpanded((prev) => ({ ...prev, [label]: !prev[label] }));
  }

  return (
    <aside
      className={`
        fixed md:sticky top-0 left-0 z-50 flex flex-col h-screen shrink-0
        bg-(--color-surface-container-low) overflow-y-auto overflow-x-hidden
        transition-[width,transform] duration-250 ease-out
        ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
        md:translate-x-0
        ${desktopCollapsed ? "md:w-0" : "md:w-60"}
        w-60
      `}
      aria-label="Primary navigation"
    >
      {/* Sidebar top: logo + mobile close */}
      <div className="flex items-center justify-between px-4 pt-5 pb-3 shrink-0">
        <Link
          href="/dashboard"
          onClick={onClose}
          className="text-label-lg font-semibold tracking-tight text-(--color-on-surface) hover:text-(--color-primary) transition-colors whitespace-nowrap"
        >
          VenturePath
        </Link>
        <button
          type="button"
          onClick={onClose}
          className="md:hidden flex items-center justify-center rounded-md p-1.5 text-(--color-on-surface-variant) hover:text-(--color-on-surface) hover:bg-(--color-surface-container-high) transition-colors"
          aria-label="Close navigation"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
            <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Thin tonal divider (no border — tonal shift only) */}
      <div className="mx-3 mb-2 h-px bg-(--color-surface-container-high)" />

      {/* Top standalone links */}
      <nav className="px-2 pb-2" aria-label="Main shortcuts">
        <ul className="space-y-0.5">
          {topLinks.map((link) => {
            const active = isActive(pathname, link.href);
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={onClose}
                  className={`
                    flex items-center gap-2 rounded-md px-3 py-2 text-body-sm transition-colors whitespace-nowrap
                    ${active
                      ? "bg-(--color-primary)/15 text-(--color-on-surface) font-medium"
                      : "text-(--color-on-surface-variant) hover:bg-(--color-surface-container-high) hover:text-(--color-on-surface)"
                    }
                  `}
                >
                  {active && (
                    <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-(--color-primary)" aria-hidden />
                  )}
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="mx-3 mb-2 h-px bg-(--color-surface-container-high)" />

      {/* Collapsible groups */}
      <nav className="flex-1 px-2 pb-6" aria-label="Navigation sections">
        <div className="space-y-0.5">
          {groups.map((group) => {
            const isOpen = expanded[group.label] ?? false;
            const hasActive = groupHasActive(pathname, group);

            return (
              <div key={group.label}>
                {/* Group header */}
                <button
                  type="button"
                  onClick={() => toggleGroup(group.label)}
                  className={`
                    w-full flex items-center justify-between px-3 py-2 rounded-md
                    text-label-sm uppercase tracking-wider transition-colors whitespace-nowrap
                    ${hasActive
                      ? "text-(--color-on-surface-variant)"
                      : "text-(--color-on-surface-variant)/50"
                    }
                    hover:text-(--color-on-surface-variant) hover:bg-(--color-surface-container-high)/60
                  `}
                  aria-expanded={isOpen}
                >
                  <span>{group.label}</span>
                  <Chevron open={isOpen} />
                </button>

                {/* Animated items via CSS grid rows */}
                <div
                  className="grid transition-[grid-template-rows] duration-200 ease-out"
                  style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                >
                  <ul className="overflow-hidden space-y-0.5 pb-0.5">
                    {group.items.map((item) => {
                      const active = isActive(pathname, item.href);
                      return (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            onClick={onClose}
                            className={`
                              flex items-center gap-2 rounded-md px-3 py-2 text-body-sm transition-colors whitespace-nowrap
                              ${active
                                ? "bg-(--color-primary)/15 text-(--color-on-surface) font-medium"
                                : "text-(--color-on-surface-variant) hover:bg-(--color-surface-container-high) hover:text-(--color-on-surface)"
                              }
                            `}
                          >
                            {active && (
                              <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-(--color-primary)" aria-hidden />
                            )}
                            {item.label}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </nav>
    </aside>
  );
}
