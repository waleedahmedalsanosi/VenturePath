"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

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
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile hamburger trigger */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="md:hidden fixed top-4 left-4 z-30 rounded-md bg-(--color-surface-container-high) p-2 text-(--color-on-surface)"
        aria-label="Open navigation"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
          <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </button>

      {/* Mobile backdrop */}
      {open && (
        <div
          className="md:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed md:sticky top-0 left-0 z-50 h-screen md:h-[calc(100vh-0px)]
          w-60 shrink-0 bg-(--color-surface-container-low) overflow-y-auto
          transition-transform duration-200 ease-out
          ${open ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0
        `}
        aria-label="Primary navigation"
      >
        <div className="flex md:hidden items-center justify-between px-4 py-3">
          <span className="text-label-md uppercase text-(--color-on-surface-variant)">
            Menu
          </span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-md p-1 text-(--color-on-surface-variant) hover:text-(--color-on-surface)"
            aria-label="Close navigation"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
              <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <nav className="px-3 py-4 space-y-6">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="px-3 mb-2 text-label-sm uppercase tracking-wider text-(--color-on-surface-variant)/70">
                {group.label}
              </p>
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const active = isActive(pathname, item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className={`
                          block rounded-md px-3 py-2 text-body-sm transition-colors
                          ${active
                            ? "bg-(--color-primary)/15 text-(--color-on-surface) font-medium"
                            : "text-(--color-on-surface-variant) hover:bg-(--color-surface-container-high) hover:text-(--color-on-surface)"
                          }
                        `}
                      >
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}
