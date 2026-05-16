"use client";

import { useT } from "@/lib/i18n/useT";

export function SearchBar() {
  const t = useT("nav");

  return (
    <label className="relative block flex-1 max-w-xl">
      <span className="sr-only">{t("search.aria_label")}</span>
      <svg
        className="
          pointer-events-none absolute top-1/2 -translate-y-1/2
          start-3 text-(--color-on-surface-variant)
        "
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        aria-hidden
      >
        <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M11 11l3 3"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
      <input
        type="search"
        placeholder={t("search.placeholder")}
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
  );
}
