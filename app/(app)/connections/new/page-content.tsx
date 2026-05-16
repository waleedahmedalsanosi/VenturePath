"use client";

import Link from "next/link";

import { useT } from "@/lib/i18n/useT";

import { NewListingForm } from "./form";

export function NewListingPageContent({
  initialType,
  workspaceName,
}: {
  initialType: "exit" | "partnership";
  workspaceName: string;
}) {
  const t = useT("connections");
  return (
    <main className="mx-auto max-w-2xl px-6 py-10 space-y-8">
      <Link
        href="/connections"
        className="text-body-sm text-(--color-on-surface-variant) hover:underline"
      >
        {t("new.back")}
      </Link>

      <header className="space-y-2">
        <p className="text-label-md uppercase text-(--color-on-surface-variant)">
          {t("eyebrow")}
        </p>
        <h1 className="text-display-sm font-semibold tracking-tight">
          {t("new.title")}
        </h1>
        <p className="text-body-md text-(--color-on-surface-variant)">
          {t("new.subtitle", { company: workspaceName })}
        </p>
      </header>

      <NewListingForm initialType={initialType} workspaceName={workspaceName} />
    </main>
  );
}
