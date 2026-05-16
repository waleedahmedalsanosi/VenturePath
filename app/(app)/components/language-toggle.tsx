"use client";

import { useEffect, useState } from "react";

type Lang = "en" | "ar";

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

  // Aria label is intentionally bilingual (announces the destination language
  // in the destination language) so screen readers in either mode read it
  // sensibly. The button shows the OTHER language code.
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={lang === "ar" ? "Switch to English" : "التحويل إلى العربية"}
      className="rounded-sm px-2 py-1 text-body-sm text-(--color-on-surface-variant) hover:text-(--color-on-surface)"
    >
      {lang === "ar" ? "EN" : "AR"}
    </button>
  );
}
