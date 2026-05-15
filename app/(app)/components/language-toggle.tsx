"use client";

import { useEffect, useState } from "react";

type Lang = "en" | "ar";

/**
 * Prototype language toggle: flips `dir` and `lang` on <html>, which switches
 * the body font to Cairo (per DESIGN.md §4) and triggers RTL mirroring via
 * Tailwind's [dir="rtl"] variant on consumers. UI strings are NOT yet
 * translated — this proves the wiring works structurally.
 */
export function LanguageToggle() {
  const [lang, setLang] = useState<Lang | null>(null);

  useEffect(() => {
    const fromAttr = document.documentElement.getAttribute("lang");
    setLang(fromAttr === "ar" ? "ar" : "en");
  }, []);

  function toggle() {
    const next: Lang = lang === "ar" ? "en" : "ar";
    document.documentElement.setAttribute("lang", next);
    document.documentElement.setAttribute("dir", next === "ar" ? "rtl" : "ltr");
    try {
      localStorage.setItem("venturepath-lang", next);
    } catch {
      // ignore
    }
    setLang(next);
  }

  if (lang === null) {
    return <span className="inline-block h-6 w-12" aria-hidden />;
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Switch to ${lang === "ar" ? "English" : "العربية"}`}
      className="rounded-sm px-2 py-1 text-body-sm text-(--color-on-surface-variant) hover:text-(--color-on-surface)"
    >
      {lang === "ar" ? "EN" : "AR"}
    </button>
  );
}
