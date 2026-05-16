"use client";

import Link from "next/link";

import { LanguageToggle } from "@/app/(app)/components/language-toggle";
import { ThemeToggle } from "@/app/(app)/components/theme-toggle";
import { useT } from "@/lib/i18n/useT";

const FEATURE_KEYS = [
  "cap_table",
  "rounds",
  "esop",
  "governance",
  "compliance",
  "vault",
  "traction",
  "marketplace",
  "connections",
  "public_profile",
  "bilingual",
] as const;

const DIFFERENTIATOR_KEYS = ["sharia", "ksa", "trust"] as const;

export function LandingPage() {
  const t = useT("landing");
  const tCommon = useT();
  const tAuth = useT("auth");
  // eslint-disable-next-line react-hooks/purity -- year is acceptable at render
  const year = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-(--color-surface) text-(--color-on-surface)">
      {/* Top bar */}
      <header className="border-b border-(--color-outline-variant)/15">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-headline-sm font-semibold tracking-tight">
            {tCommon("app.name")}
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <LanguageToggle />
            <Link
              href="/sign-in"
              className="text-body-sm text-(--color-on-surface-variant) hover:text-(--color-on-surface)"
            >
              {tAuth("sign_in.submit")}
            </Link>
            <Link
              href="/sign-up"
              className="rounded-lg bg-(--color-primary) text-(--color-on-primary) px-4 py-2 text-label-sm hover:opacity-90"
            >
              {t("hero.cta.primary")}
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 py-20 md:py-28">
        <p className="text-label-md uppercase tracking-wider text-(--color-on-surface-variant)">
          {t("hero.eyebrow")}
        </p>
        <h1 className="mt-4 text-display-md md:text-display-lg font-semibold tracking-tight max-w-4xl">
          {t("hero.headline")}
        </h1>
        <p className="mt-6 text-body-lg text-(--color-on-surface-variant) max-w-2xl">
          {t("hero.subhead")}
        </p>
        <div className="mt-10 flex gap-3 flex-wrap">
          <Link
            href="/sign-up"
            className="rounded-lg bg-(--color-primary) text-(--color-on-primary) px-6 py-3 text-label-lg font-medium hover:opacity-90"
          >
            {t("hero.cta.primary")}
          </Link>
          <Link
            href="/explore"
            className="rounded-lg ghost-border px-6 py-3 text-label-lg hover:bg-(--color-surface-container-high)"
          >
            {t("hero.cta.explore")}
          </Link>
        </div>
      </section>

      {/* Features grid */}
      <section className="border-t border-(--color-outline-variant)/15 bg-(--color-surface-container-low)">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="text-headline-lg font-semibold tracking-tight mb-12">
            {t("features.heading")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURE_KEYS.map((key) => (
              <article
                key={key}
                className="rounded-xl bg-(--color-surface-container-high) p-6"
              >
                <h3 className="text-headline-sm font-semibold mb-3">
                  {t(`features.${key}.title`)}
                </h3>
                <p className="text-body-md text-(--color-on-surface-variant)">
                  {t(`features.${key}.body`)}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Differentiators */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="text-headline-lg font-semibold tracking-tight mb-12">
          {t("differentiators.heading")}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {DIFFERENTIATOR_KEYS.map((key) => (
            <article key={key}>
              <h3 className="text-headline-md font-semibold mb-3">
                {t(`differentiators.${key}.title`)}
              </h3>
              <p className="text-body-md text-(--color-on-surface-variant)">
                {t(`differentiators.${key}.body`)}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-(--color-outline-variant)/15">
        <div className="mx-auto max-w-3xl px-6 py-20 text-center">
          <h2 className="text-headline-lg md:text-display-sm font-semibold tracking-tight">
            {t("cta.heading")}
          </h2>
          <p className="mt-4 text-body-lg text-(--color-on-surface-variant)">
            {t("cta.subheading")}
          </p>
          <div className="mt-10 flex gap-3 justify-center flex-wrap">
            <Link
              href="/sign-up"
              className="rounded-lg bg-(--color-primary) text-(--color-on-primary) px-6 py-3 text-label-lg font-medium hover:opacity-90"
            >
              {t("cta.primary")}
            </Link>
            <Link
              href="/explore"
              className="rounded-lg ghost-border px-6 py-3 text-label-lg hover:bg-(--color-surface-container-high)"
            >
              {t("cta.secondary")}
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-(--color-outline-variant)/15">
        <div className="mx-auto max-w-6xl px-6 py-10 flex items-center justify-between flex-wrap gap-4">
          <p className="text-body-sm text-(--color-on-surface-variant)">
            {t("footer.tagline")}
          </p>
          <p className="text-body-sm text-(--color-on-surface-variant)">
            {t("footer.copyright", { year })}
          </p>
        </div>
      </footer>
    </div>
  );
}
