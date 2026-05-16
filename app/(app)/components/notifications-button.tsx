"use client";

import { useEffect, useRef, useState } from "react";

import { useT } from "@/lib/i18n/useT";

export function NotificationsButton() {
  const t = useT("nav");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label={t("notifications.aria_label")}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="
          relative flex items-center justify-center w-9 h-9 rounded-lg
          bg-(--color-surface-container-low) ghost-border
          text-(--color-on-surface-variant) hover:text-(--color-on-surface)
          hover:bg-(--color-surface-container-high) transition-colors
        "
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
          <path
            d="M3 12V7a5 5 0 0 1 10 0v5l1 1H2l1-1z"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
          <path
            d="M6 13a2 2 0 0 0 4 0"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        </svg>
      </button>
      {open && (
        <div
          role="dialog"
          aria-label={t("notifications.title")}
          className="
            absolute top-full mt-2 end-0 z-50 w-72 rounded-xl
            bg-(--color-surface-container-high) ghost-border
            shadow-[0_20px_60px_-30px_rgba(13,19,34,0.5)] p-4
          "
        >
          <p className="text-label-md font-medium text-(--color-on-surface) mb-2">
            {t("notifications.title")}
          </p>
          <p className="text-body-sm text-(--color-on-surface-variant)">
            {t("notifications.empty")}
          </p>
        </div>
      )}
    </div>
  );
}
