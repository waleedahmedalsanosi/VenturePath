"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useTransition } from "react";

import { useT } from "@/lib/i18n/useT";

import { switchWorkspace } from "./workspace-actions";

type NavItem = { href: string; labelKey: string };
type NavGroup = { labelKey: string; items: NavItem[] };

const EXPLORE_LINK: NavItem = { href: "/explore", labelKey: "explore" };
const LAUNCHPAD_LINK: NavItem = { href: "/dashboard", labelKey: "launchpad" };
const MESSAGES_LINK: NavItem = { href: "/connections", labelKey: "messages" };
const SETTINGS_LINK: NavItem = { href: "/setup", labelKey: "settings" };

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
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden
      className={`shrink-0 transition-transform duration-200 ${open ? "rotate-180" : "rotate-0"}`}
    >
      <path d="M2.5 4.5l3.5 3.5 3.5-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// --- Icons -----------------------------------------------------------------

function IconExplore() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.4" />
      <path d="M10.5 5.5L9 9l-3.5 1.5L7 7l3.5-1.5z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}
function IconLaunchpad() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M3 13l3-3M13 3l-6 6M9 3h4v4M10 7l-3.5-1L4 9l3 .5L7.5 13l2.5-2.5L10 7z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
function IconStartups() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect x="2.5" y="2.5" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.4" />
      <rect x="8.5" y="2.5" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.4" />
      <rect x="2.5" y="8.5" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.4" />
      <rect x="8.5" y="8.5" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}
function IconMessages() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M2.5 4.5a1.5 1.5 0 0 1 1.5-1.5h8a1.5 1.5 0 0 1 1.5 1.5v6a1.5 1.5 0 0 1-1.5 1.5H6.5L4 14v-2H4a1.5 1.5 0 0 1-1.5-1.5v-6z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}
function IconSettings() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.4" />
      <path d="M8 1.5v2M8 12.5v2M14.5 8h-2M3.5 8h-2M12.6 3.4l-1.4 1.4M4.8 11.2l-1.4 1.4M12.6 12.6l-1.4-1.4M4.8 4.8L3.4 3.4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

// --- Components ------------------------------------------------------------

interface Workspace {
  id: string;
  name: string;
}

interface SidebarProps {
  mobileOpen: boolean;
  onClose: () => void;
  desktopCollapsed: boolean;
  hasWorkspace: boolean;
  workspaces: Workspace[];
  activeWorkspaceId: string | null;
  userEmail: string;
}

function topLinkClasses(active: boolean): string {
  return `
    flex items-center gap-3 rounded-lg px-3 py-2 text-body-sm transition-colors whitespace-nowrap
    ${active
      ? "bg-(--color-primary)/15 text-(--color-on-surface) font-medium"
      : "text-(--color-on-surface-variant) hover:bg-(--color-surface-container-high) hover:text-(--color-on-surface)"
    }
  `;
}

function initialsFromEmail(email: string): string {
  const local = email.split("@")[0] ?? "";
  const parts = local.split(/[._-]+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
  return (local[0] ?? "?").toUpperCase();
}

function NestedNavGroups({
  pathname,
  t,
  onLinkClick,
}: {
  pathname: string;
  t: ReturnType<typeof useT>;
  onLinkClick: () => void;
}) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const g of NAV_GROUPS) initial[g.labelKey] = groupHasActive(pathname, g);
    return initial;
  });
  // Re-open the group containing the active route when the pathname changes
  // via client-side navigation. Tracking lastPathname with a setState during
  // render is the React-recommended pattern for "state derived from a prop";
  // it avoids the cascading-render cost of a setState-in-effect.
  const [lastPathname, setLastPathname] = useState(pathname);
  if (lastPathname !== pathname) {
    setLastPathname(pathname);
    const activeGroup = NAV_GROUPS.find((g) => groupHasActive(pathname, g));
    if (activeGroup && !expanded[activeGroup.labelKey]) {
      setExpanded({ ...expanded, [activeGroup.labelKey]: true });
    }
  }

  return (
    <div className="space-y-0.5">
      {NAV_GROUPS.map((group) => {
        const isOpen = expanded[group.labelKey] ?? false;
        const hasActive = groupHasActive(pathname, group);
        return (
          <div key={group.labelKey}>
            <button
              type="button"
              onClick={() => setExpanded((p) => ({ ...p, [group.labelKey]: !p[group.labelKey] }))}
              aria-expanded={isOpen}
              className={`
                w-full flex items-center justify-between rounded-md px-2 py-1.5
                text-label-sm uppercase tracking-wider transition-colors
                ${hasActive ? "text-(--color-on-surface-variant)" : "text-(--color-on-surface-variant)/60"}
                hover:text-(--color-on-surface-variant) hover:bg-(--color-surface-container-high)/40
              `}
            >
              <span>{t(group.labelKey)}</span>
              <Chevron open={isOpen} />
            </button>
            <div
              className="grid transition-[grid-template-rows] duration-200 ease-out"
              style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
            >
              <ul className="overflow-hidden space-y-0.5 ps-2">
                {group.items.map((item) => {
                  const active = isActive(pathname, item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={onLinkClick}
                        className={`
                          flex items-center gap-2 rounded-md px-2.5 py-1.5 text-body-sm transition-colors whitespace-nowrap
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
  );
}

function MyStartups({
  workspaces,
  activeWorkspaceId,
  pathname,
  t,
  onLinkClick,
}: {
  workspaces: Workspace[];
  activeWorkspaceId: string | null;
  pathname: string;
  t: ReturnType<typeof useT>;
  onLinkClick: () => void;
}) {
  // Default expanded — matches the reference. The active workspace's nested
  // nav is always expanded inline; other workspaces collapse to a single row
  // (click to switch to that workspace).
  const [open, setOpen] = useState(true);
  const [pending, startTransition] = useTransition();

  if (workspaces.length === 0) {
    return (
      <div className="space-y-0.5">
        <Link
          href="/setup"
          onClick={onLinkClick}
          className={topLinkClasses(isActive(pathname, "/setup"))}
        >
          <IconStartups />
          <span>{t("onboarding.add")}</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-0.5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={topLinkClasses(false) + " w-full justify-between"}
      >
        <span className="flex items-center gap-3">
          <IconStartups />
          <span>{t("my_startups")}</span>
        </span>
        <Chevron open={open} />
      </button>

      <div
        className="grid transition-[grid-template-rows] duration-200 ease-out"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden ps-2 space-y-2">
          {workspaces.map((w) => {
            const isActiveWs = w.id === activeWorkspaceId;
            return (
              <div key={w.id} className="space-y-1">
                <button
                  type="button"
                  disabled={pending || isActiveWs}
                  onClick={() => {
                    if (isActiveWs) return;
                    startTransition(() => switchWorkspace(w.id));
                  }}
                  aria-current={isActiveWs ? "true" : undefined}
                  aria-label={
                    isActiveWs ? w.name : t("my_startups.switch_to", { name: w.name })
                  }
                  className={`
                    w-full flex items-center gap-2 rounded-md px-2.5 py-1.5 text-body-sm transition-colors whitespace-nowrap
                    ${isActiveWs
                      ? "bg-(--color-primary)/10 text-(--color-on-surface) font-medium"
                      : "text-(--color-on-surface-variant) hover:bg-(--color-surface-container-high) hover:text-(--color-on-surface) disabled:opacity-50"
                    }
                  `}
                >
                  <span
                    aria-hidden
                    className={`
                      flex items-center justify-center w-5 h-5 rounded-md text-label-sm font-semibold shrink-0
                      ${isActiveWs
                        ? "bg-gradient-to-br from-(--color-gradient-start) to-(--color-gradient-end) text-[#0d1322]"
                        : "bg-(--color-surface-container-high) text-(--color-on-surface-variant)"
                      }
                    `}
                  >
                    {(w.name[0] ?? "?").toUpperCase()}
                  </span>
                  <span className="truncate text-start flex-1">{w.name}</span>
                  {isActiveWs && (
                    <span aria-hidden className="text-(--color-primary) text-label-sm">●</span>
                  )}
                </button>

                {isActiveWs && (
                  <div className="ps-3 border-s border-(--color-outline-variant)/30">
                    <NestedNavGroups pathname={pathname} t={t} onLinkClick={onLinkClick} />
                  </div>
                )}
              </div>
            );
          })}
          <Link
            href="/setup?new=1"
            onClick={onLinkClick}
            className="
              block rounded-md px-2.5 py-1.5 text-body-sm text-(--color-primary)
              hover:bg-(--color-primary)/10 transition-colors
            "
          >
            {t("my_startups.add")}
          </Link>
        </div>
      </div>
    </div>
  );
}

function UserPill({ email, t }: { email: string; t: ReturnType<typeof useT> }) {
  const initials = initialsFromEmail(email);
  const local = email.split("@")[0] ?? email;
  return (
    <div
      className="
        mx-2 mb-3 mt-2 flex items-center gap-2 rounded-xl
        bg-(--color-surface-container-high) ghost-border p-2
      "
    >
      <span
        aria-hidden
        className="
          flex items-center justify-center w-8 h-8 rounded-full shrink-0
          bg-gradient-to-br from-(--color-gradient-start) to-(--color-gradient-end)
          text-[#0d1322] text-label-sm font-semibold
        "
      >
        {initials}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-body-sm text-(--color-on-surface) truncate font-medium">
          {local}
        </p>
        <span className="
          inline-block rounded-md px-1.5 py-0.5
          bg-(--color-primary-container)/40 text-(--color-primary)
          text-label-sm font-medium tracking-wider
        ">
          {t("account.tier.free")}
        </span>
      </div>
    </div>
  );
}

export function Sidebar({
  mobileOpen,
  onClose,
  desktopCollapsed,
  hasWorkspace,
  workspaces,
  activeWorkspaceId,
  userEmail,
}: SidebarProps) {
  const pathname = usePathname();
  const t = useT("nav");

  return (
    <aside
      className={`
        fixed md:sticky top-0 start-0 z-50 flex flex-col h-screen shrink-0
        bg-(--color-surface-container-low) overflow-y-auto overflow-x-hidden
        transition-[width,transform] duration-250 ease-out
        ${mobileOpen ? "max-md:translate-x-0" : "max-md:rtl:translate-x-full max-md:ltr:-translate-x-full"}
        ${desktopCollapsed ? "md:w-0" : "md:w-64"}
        w-64
      `}
      aria-label={t("my_startups")}
    >
      <div className="flex items-center justify-between px-4 pt-5 pb-3 shrink-0">
        <Link
          href="/dashboard"
          onClick={onClose}
          className="text-label-lg font-semibold tracking-tight text-(--color-on-surface) hover:text-(--color-primary) transition-colors whitespace-nowrap inline-flex items-center gap-2"
        >
          <span className="inline-block w-2.5 h-2.5 rounded-sm bg-(--color-primary)" aria-hidden />
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

      <nav className="flex-1 px-2 pb-2 space-y-0.5">
        <Link
          href={EXPLORE_LINK.href}
          onClick={onClose}
          className={topLinkClasses(isActive(pathname, EXPLORE_LINK.href))}
        >
          <IconExplore />
          <span>{t(EXPLORE_LINK.labelKey)}</span>
        </Link>

        {hasWorkspace && (
          <Link
            href={LAUNCHPAD_LINK.href}
            onClick={onClose}
            className={topLinkClasses(isActive(pathname, LAUNCHPAD_LINK.href))}
          >
            <IconLaunchpad />
            <span>{t(LAUNCHPAD_LINK.labelKey)}</span>
          </Link>
        )}

        <div className="my-2 mx-1 h-px bg-(--color-outline-variant)/30" />

        <MyStartups
          workspaces={workspaces}
          activeWorkspaceId={activeWorkspaceId}
          pathname={pathname}
          t={t}
          onLinkClick={onClose}
        />

        <div className="my-2 mx-1 h-px bg-(--color-outline-variant)/30" />

        {hasWorkspace && (
          <Link
            href={MESSAGES_LINK.href}
            onClick={onClose}
            className={topLinkClasses(isActive(pathname, MESSAGES_LINK.href))}
          >
            <IconMessages />
            <span>{t(MESSAGES_LINK.labelKey)}</span>
          </Link>
        )}
        <Link
          href={SETTINGS_LINK.href}
          onClick={onClose}
          className={topLinkClasses(isActive(pathname, SETTINGS_LINK.href))}
        >
          <IconSettings />
          <span>{t(SETTINGS_LINK.labelKey)}</span>
        </Link>
      </nav>

      <div className="shrink-0">
        <UserPill email={userEmail} t={t} />
      </div>
    </aside>
  );
}
