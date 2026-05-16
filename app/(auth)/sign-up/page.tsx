"use client";

import { useState } from "react";
import Link from "next/link";

import { useT } from "@/lib/i18n/useT";
import { createClient } from "@/lib/supabase/client";

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const t = useT("auth");
  const tCommon = useT();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    const supabase = createClient();
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setBusy(false);
      return;
    }

    setSent(true);
    setBusy(false);
  }

  if (sent) {
    return (
      <div className="space-y-4">
        <h2 className="text-headline-md font-medium">{t("sign_up.check_email.heading")}</h2>
        <p
          className="text-body-md text-(--color-on-surface-variant)"
          dangerouslySetInnerHTML={{
            __html: t("sign_up.check_email.body", { email }),
          }}
        />
        <p className="text-body-sm text-(--color-on-surface-variant)">
          {t("sign_up.check_email.wrong_address")}{" "}
          <button
            onClick={() => setSent(false)}
            className="text-(--color-primary) underline"
          >
            {t("sign_up.check_email.try_again")}
          </button>
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <h2 className="text-headline-md font-medium">{t("sign_up.heading")}</h2>

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
          minLength={8}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 block w-full rounded-sm bg-(--color-surface-container-high) ghost-border px-3 py-2 focus:outline-none focus:border-(--color-primary)"
        />
        <span className="mt-1 block text-body-sm text-(--color-on-surface-variant)">
          {t("sign_up.password_hint")}
        </span>
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
        {busy ? t("sign_up.creating") : t("sign_up.submit")}
      </button>

      <p className="text-body-sm text-(--color-on-surface-variant)">
        {t("sign_up.have_account")}{" "}
        <Link href="/sign-in" className="text-(--color-primary) underline">
          {t("sign_up.sign_in_link")}
        </Link>
      </p>
    </form>
  );
}
