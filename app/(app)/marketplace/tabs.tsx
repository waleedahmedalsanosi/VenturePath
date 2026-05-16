"use client";

import Link from "next/link";

import { useT } from "@/lib/i18n/useT";

export function MarketplaceTabs({ active }: { active: "browse" | "mine" }) {
  const t = useT("marketplace");
  return (
    <nav
      className="mx-auto max-w-5xl px-6 pt-6"
      aria-label={t("tabs.aria_label", { defaultValue: "Marketplace tabs" }) as unknown as string}
    >
      <div className="inline-flex rounded-lg bg-(--color-surface-container-low) ghost-border p-1">
        <Tab href="/marketplace" label={t("tabs.browse")} active={active === "browse"} />
        <Tab href="/marketplace?tab=mine" label={t("tabs.mine")} active={active === "mine"} />
      </div>
    </nav>
  );
}

function Tab({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`
        rounded-md px-4 py-1.5 text-label-md font-medium transition-colors
        ${active
          ? "bg-(--color-surface-bright) text-(--color-on-surface) shadow-sm"
          : "text-(--color-on-surface-variant) hover:text-(--color-on-surface)"
        }
      `}
    >
      {label}
    </Link>
  );
}
