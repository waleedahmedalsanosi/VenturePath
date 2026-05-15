"use client";

import { useEffect, useState } from "react";

import { roundsTranslations, type RoundsKey } from "./rounds";

type Lang = "en" | "ar";

function getLang(): Lang {
  if (typeof document === "undefined") return "en";
  return document.documentElement.getAttribute("lang") === "ar" ? "ar" : "en";
}

/**
 * Returns a `t(key)` function scoped to the rounds module.
 * Re-renders when the user switches language via LanguageToggle.
 */
export function useRoundsT() {
  const [lang, setLang] = useState<Lang>("en");

  useEffect(() => {
    setLang(getLang());

    // Watch for lang attribute changes from LanguageToggle.
    const observer = new MutationObserver(() => setLang(getLang()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
    return () => observer.disconnect();
  }, []);

  return (key: RoundsKey): string => roundsTranslations[lang][key] ?? roundsTranslations.en[key];
}
