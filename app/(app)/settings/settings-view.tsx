"use client";

import Link from "next/link";

import { LanguageToggle } from "@/app/(app)/components/language-toggle";
import { ThemeToggle } from "@/app/(app)/components/theme-toggle";
import { useT } from "@/lib/i18n/useT";

export function SettingsView({
  email,
  createdAt,
}: {
  email: string;
  createdAt: string | null;
}) {
  const t = useT("settings");
  const tAuth = useT("auth");

  const memberSince = createdAt
    ? new Date(createdAt).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <main className="mx-auto max-w-3xl px-6 py-10 space-y-10">
      <header>
        <p className="text-label-md uppercase text-(--color-on-surface-variant)">
          {t("eyebrow")}
        </p>
        <h1 className="mt-1 text-display-sm font-semibold tracking-tight">
          {t("title")}
        </h1>
        <p className="mt-2 text-body-md text-(--color-on-surface-variant)">
          {t("subtitle")}
        </p>
      </header>

      <section className="rounded-xl ghost-border p-6 space-y-4">
        <h2 className="text-headline-sm font-medium">{t("section.account.title")}</h2>
        <Field label={t("section.account.email")} value={email} />
        {memberSince && (
          <Field label={t("section.account.member_since")} value={memberSince} />
        )}
      </section>

      <section className="rounded-xl ghost-border p-6 space-y-4">
        <h2 className="text-headline-sm font-medium">
          {t("section.preferences.title")}
        </h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-body-md text-(--color-on-surface)">
              {t("section.preferences.language")}
            </p>
            <p className="text-body-sm text-(--color-on-surface-variant)">
              {t("section.preferences.language_hint")}
            </p>
          </div>
          <LanguageToggle />
        </div>
        <div className="h-px bg-(--color-outline-variant)/30" />
        <div className="flex items-center justify-between">
          <div>
            <p className="text-body-md text-(--color-on-surface)">
              {t("section.preferences.theme")}
            </p>
            <p className="text-body-sm text-(--color-on-surface-variant)">
              {t("section.preferences.theme_hint")}
            </p>
          </div>
          <ThemeToggle />
        </div>
      </section>

      <section className="rounded-xl ghost-border p-6 space-y-4">
        <h2 className="text-headline-sm font-medium">
          {t("section.workspaces.title")}
        </h2>
        <p className="text-body-sm text-(--color-on-surface-variant)">
          {t("section.workspaces.body")}
        </p>
        <div>
          <Link
            href="/setup?new=1"
            className="
              inline-flex rounded-lg ghost-border px-4 py-2 text-label-sm
              hover:bg-(--color-surface-container-high) transition-colors
            "
          >
            {t("section.workspaces.new_startup")}
          </Link>
        </div>
      </section>

      <section className="rounded-xl ghost-border p-6 space-y-4">
        <h2 className="text-headline-sm font-medium">{t("section.session.title")}</h2>
        <p className="text-body-sm text-(--color-on-surface-variant)">
          {t("section.session.body")}
        </p>
        <form action="/auth/sign-out" method="post">
          <button
            type="submit"
            className="
              rounded-lg ghost-border px-4 py-2 text-label-sm
              text-(--color-error) hover:bg-(--color-error)/10 transition-colors
            "
          >
            {tAuth("sign_out.label")}
          </button>
        </form>
      </section>
    </main>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-body-sm text-(--color-on-surface-variant)">{label}</span>
      <span className="text-body-md text-(--color-on-surface) font-medium truncate max-w-[60%]">
        {value}
      </span>
    </div>
  );
}
