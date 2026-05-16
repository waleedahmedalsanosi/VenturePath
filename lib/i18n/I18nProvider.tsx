"use client";

import { createInstance, type i18n } from "i18next";
import { I18nextProvider, initReactI18next } from "react-i18next";
import { useEffect, useState } from "react";

import enCommon from "./locales/en/common.json";
import enNav from "./locales/en/nav.json";
import enAuth from "./locales/en/auth.json";
import enSetup from "./locales/en/setup.json";
import enDashboard from "./locales/en/dashboard.json";
import enCapTable from "./locales/en/cap_table.json";
import enEsop from "./locales/en/esop.json";
import enRounds from "./locales/en/rounds.json";
import enTermSheets from "./locales/en/term_sheets.json";
import enInvestorUpdates from "./locales/en/investor_updates.json";
import enMarketplace from "./locales/en/marketplace.json";
import enConnections from "./locales/en/connections.json";
import enGovernance from "./locales/en/governance.json";
import enCompliance from "./locales/en/compliance.json";
import enVault from "./locales/en/vault.json";
import enTraction from "./locales/en/traction.json";
import enValuation from "./locales/en/valuation.json";
import enDilution from "./locales/en/dilution.json";
import enWaterfall from "./locales/en/waterfall.json";
import enAcquisition from "./locales/en/acquisition.json";
import enMembers from "./locales/en/members.json";
import enAudit from "./locales/en/audit.json";
import enCompany from "./locales/en/company.json";
import enExplore from "./locales/en/explore.json";
import enDataRoom from "./locales/en/data_room.json";
import enUpdates from "./locales/en/updates.json";
import enInvite from "./locales/en/invite.json";
import enLanding from "./locales/en/landing.json";

import arCommon from "./locales/ar/common.json";
import arNav from "./locales/ar/nav.json";
import arAuth from "./locales/ar/auth.json";
import arSetup from "./locales/ar/setup.json";
import arDashboard from "./locales/ar/dashboard.json";
import arCapTable from "./locales/ar/cap_table.json";
import arEsop from "./locales/ar/esop.json";
import arRounds from "./locales/ar/rounds.json";
import arTermSheets from "./locales/ar/term_sheets.json";
import arInvestorUpdates from "./locales/ar/investor_updates.json";
import arMarketplace from "./locales/ar/marketplace.json";
import arConnections from "./locales/ar/connections.json";
import arGovernance from "./locales/ar/governance.json";
import arCompliance from "./locales/ar/compliance.json";
import arVault from "./locales/ar/vault.json";
import arTraction from "./locales/ar/traction.json";
import arValuation from "./locales/ar/valuation.json";
import arDilution from "./locales/ar/dilution.json";
import arWaterfall from "./locales/ar/waterfall.json";
import arAcquisition from "./locales/ar/acquisition.json";
import arMembers from "./locales/ar/members.json";
import arAudit from "./locales/ar/audit.json";
import arCompany from "./locales/ar/company.json";
import arExplore from "./locales/ar/explore.json";
import arDataRoom from "./locales/ar/data_room.json";
import arUpdates from "./locales/ar/updates.json";
import arInvite from "./locales/ar/invite.json";
import arLanding from "./locales/ar/landing.json";

const NAMESPACES = [
  "common", "nav", "auth", "setup", "dashboard", "cap_table", "esop",
  "rounds", "term_sheets", "investor_updates", "marketplace", "connections",
  "governance", "compliance", "vault", "traction", "valuation", "dilution",
  "waterfall", "acquisition", "members", "audit", "company", "explore",
  "data_room", "updates", "invite", "landing",
] as const;

const resources = {
  en: {
    common: enCommon, nav: enNav, auth: enAuth, setup: enSetup,
    dashboard: enDashboard, cap_table: enCapTable, esop: enEsop,
    rounds: enRounds, term_sheets: enTermSheets,
    investor_updates: enInvestorUpdates, marketplace: enMarketplace,
    connections: enConnections, governance: enGovernance,
    compliance: enCompliance, vault: enVault, traction: enTraction,
    valuation: enValuation, dilution: enDilution, waterfall: enWaterfall,
    acquisition: enAcquisition, members: enMembers, audit: enAudit,
    company: enCompany, explore: enExplore, data_room: enDataRoom,
    updates: enUpdates, invite: enInvite, landing: enLanding,
  },
  ar: {
    common: arCommon, nav: arNav, auth: arAuth, setup: arSetup,
    dashboard: arDashboard, cap_table: arCapTable, esop: arEsop,
    rounds: arRounds, term_sheets: arTermSheets,
    investor_updates: arInvestorUpdates, marketplace: arMarketplace,
    connections: arConnections, governance: arGovernance,
    compliance: arCompliance, vault: arVault, traction: arTraction,
    valuation: arValuation, dilution: arDilution, waterfall: arWaterfall,
    acquisition: arAcquisition, members: arMembers, audit: arAudit,
    company: arCompany, explore: arExplore, data_room: arDataRoom,
    updates: arUpdates, invite: arInvite, landing: arLanding,
  },
};

function createI18n(lang: "en" | "ar"): i18n {
  const instance = createInstance();
  instance
    .use(initReactI18next)
    .init({
      lng: lang,
      fallbackLng: "en",
      ns: NAMESPACES,
      defaultNS: "common",
      resources,
      interpolation: { escapeValue: false },
      returnNull: false,
    });
  return instance;
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<"en" | "ar">("en");
  const [instance, setInstance] = useState<i18n | null>(null);

  useEffect(() => {
    // Hydrate from <html lang>; LanguageToggle keeps html in sync.
    const attr = document.documentElement.getAttribute("lang");
    const initial: "en" | "ar" = attr === "ar" ? "ar" : "en";
    setLang(initial);
    setInstance(createI18n(initial));

    const observer = new MutationObserver(() => {
      const next = document.documentElement.getAttribute("lang") === "ar" ? "ar" : "en";
      setLang((curr) => {
        if (curr === next) return curr;
        return next;
      });
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["lang"],
    });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!instance) return;
    if (instance.language !== lang) {
      instance.changeLanguage(lang);
    }
  }, [lang, instance]);

  if (!instance) {
    // First render server-side or before hydrate: render plain children.
    // useT will fall back to key names until provider is ready, which is fine
    // because the fallback render is the SSR pass with English.
    return <>{children}</>;
  }

  return <I18nextProvider i18n={instance}>{children}</I18nextProvider>;
}
