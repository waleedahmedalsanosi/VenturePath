"use client";

import { useT } from "@/lib/i18n/useT";

export function AuthLayoutContent({ children }: { children: React.ReactNode }) {
  const t = useT();
  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-12">
          <h1 className="text-display-sm font-semibold tracking-tight">{t("app.name")}</h1>
          <p className="mt-1 text-body-md text-(--color-on-surface-variant)">
            {t("app.tagline")}
          </p>
        </div>
        {children}
      </div>
    </main>
  );
}
