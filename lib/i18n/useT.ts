"use client";

import { useTranslation as useReactI18nTranslation } from "react-i18next";

/**
 * Unified i18n hook for the entire app.
 *
 * Usage:
 *   const t = useT("cap_table");
 *   <h1>{t("title")}</h1>
 *
 * Or with the common namespace:
 *   const t = useT();
 *   <button>{t("actions.save")}</button>
 *
 * For multiple namespaces in one component:
 *   const tNav = useT("nav");
 *   const tCommon = useT();
 */
export function useT(namespace?: string) {
  const { t } = useReactI18nTranslation(namespace);
  return t as (key: string, options?: Record<string, unknown>) => string;
}
