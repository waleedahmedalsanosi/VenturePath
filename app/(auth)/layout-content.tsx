"use client";

import Link from "next/link";

import { LanguageToggle } from "@/app/(app)/components/language-toggle";
import { useT } from "@/lib/i18n/useT";

export function AuthLayoutContent({ children }: { children: React.ReactNode }) {
  const t = useT("auth");
  const tCommon = useT();

  return (
    <main className="relative min-h-screen md:grid md:grid-cols-2">
      {/* Marketing pane — always dark regardless of theme */}
      <aside
        className="
          relative hidden md:flex flex-col justify-between
          bg-[#0d1322] text-[#dde2f8]
          p-10 lg:p-14 overflow-hidden
        "
      >
        {/* Ambient gradient backdrop */}
        <div
          className="
            pointer-events-none absolute inset-0
            bg-[radial-gradient(at_20%_20%,rgba(122,212,227,0.18),transparent_55%),radial-gradient(at_80%_85%,rgba(10,126,140,0.28),transparent_60%)]
          "
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(122,212,227,1) 1px, transparent 1px), linear-gradient(90deg, rgba(122,212,227,1) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
          aria-hidden
        />

        <div className="relative">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-label-lg font-semibold tracking-tight text-white hover:text-[#7ad4e3] transition-colors"
          >
            <span className="inline-block w-2.5 h-2.5 rounded-sm bg-[#7ad4e3]" />
            {tCommon("app.name")}
          </Link>
        </div>

        <div className="relative max-w-lg">
          <span
            className="
              inline-flex items-center gap-2 rounded-full
              bg-[#7ad4e3]/12 text-[#7ad4e3]
              px-3 py-1 text-label-sm font-medium tracking-wide
              ring-1 ring-[#7ad4e3]/25
            "
          >
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#7ad4e3] animate-pulse" />
            {t("marketing.pill")}
          </span>
          <h1 className="mt-6 text-display-md md:text-display-lg font-semibold tracking-tight leading-[1.05] text-white">
            {t("marketing.headline")}
          </h1>
          <p className="mt-5 text-body-lg text-[#8b92a8] max-w-md">
            {t("marketing.subhead")}
          </p>
        </div>

        <div className="relative flex items-end justify-between text-label-sm text-[#8b92a8]/80">
          <span>{tCommon("footer.tagline")}</span>
        </div>
      </aside>

      {/* Right column: auth card */}
      <section className="relative flex flex-col min-h-screen md:min-h-0">
        {/* Top bar: mobile logo + lang toggle */}
        <div className="flex items-center justify-between px-6 pt-6 md:px-10 md:pt-8">
          <Link
            href="/"
            className="md:hidden inline-flex items-center gap-2 text-label-lg font-semibold tracking-tight"
          >
            <span className="inline-block w-2.5 h-2.5 rounded-sm bg-(--color-primary)" />
            {tCommon("app.name")}
          </Link>
          <span className="hidden md:block" />
          <LanguageToggle />
        </div>

        <div className="flex-1 flex items-center justify-center px-6 py-10 md:px-10">
          {children}
        </div>
      </section>
    </main>
  );
}
