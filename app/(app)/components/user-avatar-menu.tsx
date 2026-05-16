"use client";

import { useEffect, useRef, useState } from "react";

import { useT } from "@/lib/i18n/useT";

function initialsFromEmail(email: string): string {
  const local = email.split("@")[0] ?? "";
  const parts = local.split(/[._-]+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
  }
  return (local[0] ?? "?").toUpperCase();
}

export function UserAvatarMenu({ email }: { email: string }) {
  const t = useT("nav");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const initials = initialsFromEmail(email);

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
        aria-label={t("account.aria_label")}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="
          flex items-center justify-center w-9 h-9 rounded-full
          bg-gradient-to-br from-(--color-gradient-start) to-(--color-gradient-end)
          text-[#0d1322] text-label-sm font-semibold tabular-nums
          ring-2 ring-(--color-surface-container-low) hover:ring-(--color-primary)/40
          transition-shadow
        "
      >
        {initials}
      </button>
      {open && (
        <div
          role="menu"
          className="
            absolute top-full mt-2 end-0 z-50 w-64 rounded-xl
            bg-(--color-surface-container-high) ghost-border
            shadow-[0_20px_60px_-30px_rgba(13,19,34,0.5)] p-3
          "
        >
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="
              flex items-center justify-center w-9 h-9 rounded-full
              bg-gradient-to-br from-(--color-gradient-start) to-(--color-gradient-end)
              text-[#0d1322] text-label-sm font-semibold
            ">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-body-sm text-(--color-on-surface) truncate font-medium">
                {email}
              </p>
              <span className="
                inline-block mt-0.5 rounded-md px-1.5 py-0.5
                bg-(--color-primary-container)/40 text-(--color-primary)
                text-label-sm font-medium tracking-wider
              ">
                {t("account.tier.free")}
              </span>
            </div>
          </div>
          <div className="my-2 h-px bg-(--color-outline-variant)/40" />
          <form action="/auth/sign-out" method="post">
            <button
              type="submit"
              role="menuitem"
              className="
                w-full text-start rounded-md px-2 py-1.5 text-body-sm
                text-(--color-on-surface-variant) hover:text-(--color-on-surface)
                hover:bg-(--color-surface-container-low) transition-colors
              "
            >
              {t("account.sign_out")}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
