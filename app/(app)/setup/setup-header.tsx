"use client";

import Link from "next/link";

import { useT } from "@/lib/i18n/useT";

export function SetupHeader({ wantsNew }: { wantsNew: boolean }) {
  const t = useT("setup");
  return (
    <>
      {wantsNew && (
        <Link
          href="/"
          className="text-body-sm text-(--color-on-surface-variant) underline"
        >
          {t("back_home")}
        </Link>
      )}
      <div className="mt-4 mb-10">
        <h1 className="text-display-sm font-semibold tracking-tight">
          {wantsNew ? t("title.new_workspace") : t("title.first_workspace")}
        </h1>
        <p className="mt-2 text-body-md text-(--color-on-surface-variant)">
          {wantsNew ? t("subtitle.new_workspace") : t("subtitle.first_workspace")}
        </p>
      </div>
    </>
  );
}
