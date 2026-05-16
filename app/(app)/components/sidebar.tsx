"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useMemo } from "react";

import { useT } from "@/lib/i18n/useT";

type NavItem = { href: string; labelKey: string };
type NavGroup = { labelKey: string; items: NavItem[] };

// Standalone top-level links (outside any collapsible group).
const EXPLORE_LINK: NavItem = { href: "/explore", labelKey: "explore" };
const DASHBOARD_LINK: NavItem = { href: "/dashboard", labelKey: "dashboard" };

const ONBOARDING_GROUP: NavGroup = {
  labelKey: "onboarding.label",
  items: [{ href: "/setup", labelKey: "onboarding.add" }],
};

const NAV_GROUPS: NavGroup[] = [
  {
    labelKey: "groups.company",
    items: [
      { href: "/company", labelKey: "items.company" },
      { href: "/members", labelKey: "items.members" },
    ],
  },
  {
    labelKey: "groups.equity",
    items: [
      { href: "/cap-table", labelKey: "items.cap_table" },
      { href: "/esop", labelKey: "items.esop" },
    ],
  },
  {
    labelKey: "groups.investment",
    items: [
      { href: "/rounds", labelKey: "items.rounds" },
      { href: "/term-sheets", labelKey: "items.term_sheets" },
      { href: "/investor-updates", labelKey: "items.investor_updates" },
      { href: "/marketplace", labelKey: "items.marketplace" },
      { href: "/connections", labelKey: "items.connections" },
    ],
  },
  {
    labelKey: "groups.modeling",
    items: [
      { href: "/dilution", labelKey: "items.dilution" },
      { href: "/waterfall", labelKey: "items.waterfall" },
      { href: "/acquisition", labelKey: "items.acquisition" },
      { href: "/valuation", labelKey: "items.valuation" },
    ],
  },
  {
    labelKey: "groups.operations",
    items: [
      { href: "/governance", labelKey: "items.governance" },
      { href: "/compliance", labelKey: "items.compliance" },
      { href: "/vault", labelKey: "items.vault" },
      { href: "/traction", labelKey: "items.traction" },
    ],
  },
  {
    labelKey: "groups.activity",
    items: [{ href: "/audit", labelKey: "items.audit" }],
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
  const t = useT("nav");

  const groups = useMemo<NavGroup[]>(
    () => (hasWorkspace ? NAV_GROUPS : [ONBOARDING_GROUP]),
    [hasWorkspace],
  );
  const topLinks = useMemo(
    () => (hasWorkspace ? [DASHBOARD_LINK, EXPLORE_LINK] : [EXPLORE_LINK]),
    [hasWorkspace],
  );

  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const g of NAV_GROUPS) initial[g.labelKey] = false;
    initial[ONBOARDING_GROUP.labelKey] = true;
    return initial;
  });

  useEffect(() => {
    const activeGroup = groups.find((g) => groupHasActive(pathname, g));
    if (activeGroup) {
      setExpanded((prev) => ({ ...prev, [activeGroup.labelKey]: true }));
    }
  }, [pathname, groups]);

  function toggleGroup(labelKey: string) {
    setExpanded((prev) => ({ ...prev, [labelKey]: !prev[labelKey] }));
  }

  return (
    <aside
      className={`
        fixed md:sticky top-0 start-0 z-50 flex flex-col h-screen shrink-0
        bg-(--color-surface-container-low) overflow-y-auto overflow-x-hidden
        transition-[width,transform] duration-250 ease-out
        ${mobileOpen ? "max-md:translate-x-0" : "max-md:rtl:translate-x-full max-md:ltr:-translate-x-full"}
        ${desktopCollapsed ? "md:w-0" : "md:w-60"}
        w-60
      `}
      aria-label={t("groups.company")}
    >
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
          aria-label={t("language.switch_to", { lang: t("language.en") })}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
            <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <div className="mx-3 mb-2 h-px bg-(--color-surface-container-high)" />

      <nav className="px-2 pb-2">
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
                  {t(link.labelKey)}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="mx-3 mb-2 h-px bg-(--color-surface-container-high)" />

      <nav className="flex-1 px-2 pb-6">
        <div className="space-y-0.5">
          {groups.map((group) => {
            const isOpen = expanded[group.labelKey] ?? false;
            const hasActive = groupHasActive(pathname, group);

            return (
              <div key={group.labelKey}>
                <button
                  type="button"
                  onClick={() => toggleGroup(group.labelKey)}
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
                  <span>{t(group.labelKey)}</span>
                  <Chevron open={isOpen} />
                </button>

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
                            {t(item.labelKey)}
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
