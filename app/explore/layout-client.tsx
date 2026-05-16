"use client";

import Link from "next/link";

import { useT } from "@/lib/i18n/useT";

export function SignOutButton() {
  const t = useT("auth");
  return (
    <form action="/auth/sign-out" method="post">
      <button
        type="submit"
        className="underline hover:text-(--color-on-surface)"
      >
        {t("sign_out.label")}
      </button>
    </form>
  );
}

export function GuestHeader() {
  const tLanding = useT("landing");
  const tAuth = useT("auth");
  const tCommon = useT();
  return (
    <header className="px-6 py-4">
      <div className="mx-auto max-w-6xl flex items-center justify-between gap-4">
        <Link
          href="/"
          className="text-headline-sm font-semibold tracking-tight"
        >
          {tCommon("app.name")}
        </Link>
        <nav className="flex items-center gap-4 text-body-sm">
          <Link
            href="/sign-in"
            className="text-(--color-on-surface-variant) hover:text-(--color-on-surface) transition-colors"
          >
            {tAuth("sign_in.submit")}
          </Link>
          <Link
            href="/sign-up"
            className="btn-primary-gradient rounded-lg px-4 py-1.5 text-label-lg font-medium"
          >
            {tLanding("hero.cta.primary")}
          </Link>
        </nav>
      </div>
    </header>
  );
}
