"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

import { useT } from "@/lib/i18n/useT";
import { createClient } from "@/lib/supabase/client";

function safeReturnTo(value: string | null): string {
  // Default destination after sign-in is the explore page (discovery).
  // Users with workspaces still see /dashboard via the sidebar; explore
  // surfaces other people's listings and companies.
  if (!value) return "/explore";
  if (!value.startsWith("/")) return "/explore";
  if (value.startsWith("//")) return "/explore";
  return value;
}

export function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = safeReturnTo(searchParams.get("returnTo"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const t = useT("auth");
  const tCommon = useT();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setBusy(false);
      return;
    }

    router.push(returnTo);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <h2 className="text-headline-md font-medium">{t("sign_in.heading")}</h2>

      <label className="block">
        <span className="text-label-md uppercase text-(--color-on-surface-variant)">
          {tCommon("labels.email")}
        </span>
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 block w-full rounded-sm bg-(--color-surface-container-high) ghost-border px-3 py-2 focus:outline-none focus:border-(--color-primary)"
        />
      </label>

      <label className="block">
        <span className="text-label-md uppercase text-(--color-on-surface-variant)">
          {tCommon("labels.password")}
        </span>
        <input
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 block w-full rounded-sm bg-(--color-surface-container-high) ghost-border px-3 py-2 focus:outline-none focus:border-(--color-primary)"
        />
      </label>

      {error && (
        <p className="text-body-sm text-(--color-error)" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="btn-primary-gradient w-full rounded-lg py-2.5 text-label-lg font-medium disabled:opacity-50"
      >
        {busy ? t("sign_in.signing_in") : t("sign_in.submit")}
      </button>

      <p className="text-body-sm text-(--color-on-surface-variant)">
        {t("sign_in.no_account")}{" "}
        <Link href="/sign-up" className="text-(--color-primary) underline">
          {t("sign_in.create_account")}
        </Link>
      </p>
    </form>
  );
}
