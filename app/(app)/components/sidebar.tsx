"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

const NAV_GROUPS: Array<{ label: string; items: Array<{ href: string; label: string }> }> = [
  {
    label: "Overview",
    items: [{ href: "/dashboard", label: "Dashboard" }],
  },
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
  {
    label: "Community",
    items: [{ href: "/explore", label: "Explore" }],
  },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function groupHasActive(pathname: string, group: typeof NAV_GROUPS[number]): boolean {
  return group.items.some((item) => isActive(pathname, item.href));
}

// Chevron icon — rotates when expanded
function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      aria-hidden
      className={`shrink-0 transition-transform duration-200 ${open ? "rotate-180" : "rotate-0"}`}
    >
      <path
        d="M3 5l4 4 4-4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Hamburger icon (3 lines → X on open)
function HamburgerIcon({ open }: { open: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      {open ? (
        // X
        <>
          <path d="M4 4l10 10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M14 4L4 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </>
      ) : (
        // Hamburger
        <>
          <path d="M2.5 4.5h13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M2.5 9h13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M2.5 13.5h13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Per-group collapsed state — active group starts expanded, others too by default
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(NAV_GROUPS.map((g) => [g.label, false])),
  );

  // When route changes, ensure the active group is expanded
  useEffect(() => {
    const activeGroup = NAV_GROUPS.find((g) => groupHasActive(pathname, g));
    if (activeGroup) {
      setCollapsed((prev) =>
        prev[activeGroup.label] ? { ...prev, [activeGroup.label]: false } : prev,
      );
    }
  }, [pathname]);

  function toggleGroup(label: string) {
    setCollapsed((prev) => ({ ...prev, [label]: !prev[label] }));
  }

  return (
    <>
      {/* Mobile hamburger trigger — fixed top-left, animated icon */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="md:hidden fixed top-3.5 left-3.5 z-30 flex items-center justify-center rounded-lg bg-(--color-surface-container-high) p-2.5 text-(--color-on-surface) transition-colors hover:bg-(--color-surface-bright)"
        aria-label={open ? "Close navigation" : "Open navigation"}
        aria-expanded={open}
      >
        <HamburgerIcon open={open} />
      </button>

      {/* Mobile backdrop */}
      {open && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={`
          fixed md:sticky top-0 left-0 z-50 flex flex-col h-screen
          w-60 shrink-0 bg-(--color-surface-container-low) overflow-y-auto
          transition-transform duration-250 ease-out
          ${open ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0
        `}
        aria-label="Primary navigation"
      >
        {/* Sidebar header — logo + close on mobile */}
        <div className="flex items-center justify-between px-4 pt-5 pb-4">
          <Link
            href="/dashboard"
            onClick={() => setOpen(false)}
            className="text-label-lg font-semibold tracking-tight text-(--color-on-surface) hover:text-(--color-primary) transition-colors"
          >
            VenturePath
          </Link>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="md:hidden flex items-center justify-center rounded-md p-1.5 text-(--color-on-surface-variant) hover:text-(--color-on-surface) hover:bg-(--color-surface-container-high) transition-colors"
            aria-label="Close navigation"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Nav groups */}
        <nav className="flex-1 px-2 pb-6 space-y-0.5" aria-label="Main">
          {NAV_GROUPS.map((group) => {
            const isCollapsed = collapsed[group.label] ?? false;
            const hasActive = groupHasActive(pathname, group);

            return (
              <div key={group.label}>
                {/* Group header — clickable to collapse */}
                <button
                  type="button"
                  onClick={() => toggleGroup(group.label)}
                  className={`
                    w-full flex items-center justify-between px-3 py-2 rounded-md
                    text-label-sm uppercase tracking-wider transition-colors
                    ${hasActive
                      ? "text-(--color-on-surface-variant)"
                      : "text-(--color-on-surface-variant)/60"
                    }
                    hover:text-(--color-on-surface-variant) hover:bg-(--color-surface-container-high)/50
                  `}
                  aria-expanded={!isCollapsed}
                >
                  <span>{group.label}</span>
                  <Chevron open={!isCollapsed} />
                </button>

                {/* Collapsible items using CSS grid trick for smooth animation */}
                <div
                  className="grid transition-[grid-template-rows] duration-200 ease-out"
                  style={{ gridTemplateRows: isCollapsed ? "0fr" : "1fr" }}
                >
                  <ul className="overflow-hidden space-y-0.5 pb-1">
                    {group.items.map((item) => {
                      const active = isActive(pathname, item.href);
                      return (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            onClick={() => setOpen(false)}
                            className={`
                              flex items-center gap-2 rounded-md px-3 py-2 text-body-sm transition-colors
                              ${active
                                ? "bg-(--color-primary)/15 text-(--color-on-surface) font-medium"
                                : "text-(--color-on-surface-variant) hover:bg-(--color-surface-container-high) hover:text-(--color-on-surface)"
                              }
                            `}
                          >
                            {/* Active indicator dot */}
                            {active && (
                              <span
                                className="shrink-0 w-1.5 h-1.5 rounded-full bg-(--color-primary)"
                                aria-hidden
                              />
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
        </nav>
      </aside>
    </>
  );
}
