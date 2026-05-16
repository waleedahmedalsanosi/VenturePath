"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { useT } from "@/lib/i18n/useT";

type Mode = "sign-in" | "sign-up";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
      />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#0A66C2"
        d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.36V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .78 0 1.74v20.51C0 23.22.79 24 1.77 24h20.45c.98 0 1.78-.78 1.78-1.75V1.74C24 .78 23.2 0 22.22 0z"
      />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M17.05 12.04c-.02-2.27 1.85-3.36 1.94-3.42-1.06-1.55-2.71-1.76-3.3-1.78-1.4-.15-2.74.82-3.45.82-.72 0-1.82-.81-3-.78-1.54.02-2.96.9-3.75 2.28-1.6 2.77-.41 6.86 1.15 9.11.77 1.1 1.67 2.33 2.85 2.29 1.15-.05 1.58-.74 2.97-.74 1.38 0 1.78.74 3 .72 1.24-.02 2.02-1.12 2.78-2.23.87-1.27 1.23-2.51 1.25-2.58-.03-.01-2.4-.92-2.43-3.66zM14.95 5.18c.63-.77 1.06-1.83.94-2.9-.91.04-2.02.61-2.68 1.37-.59.67-1.1 1.76-.96 2.8 1.02.08 2.06-.51 2.7-1.27z"
      />
    </svg>
  );
}

export function AuthCard({
  mode,
  children,
}: {
  mode: Mode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const t = useT("auth");
  const [comingSoon, setComingSoon] = useState(false);

  function onSocialClick() {
    setComingSoon(true);
    window.setTimeout(() => setComingSoon(false), 3500);
  }

  const isSignIn = mode === "sign-in";

  return (
    <div className="w-full max-w-md">
      <div
        className="
          rounded-2xl bg-(--color-surface-container-high) ghost-border
          shadow-[0_20px_60px_-30px_rgba(13,19,34,0.35)]
          p-6 sm:p-8 space-y-5
        "
      >
        {/* Tabs */}
        <div
          role="tablist"
          aria-label={t("sign_in.heading")}
          className="grid grid-cols-2 gap-1 rounded-xl bg-(--color-surface-container-low) p-1"
        >
          <Link
            href="/sign-up"
            role="tab"
            aria-selected={!isSignIn}
            className={`
              flex items-center justify-center rounded-lg py-2 text-label-md font-medium transition-colors
              ${
                !isSignIn
                  ? "bg-(--color-surface-bright) text-(--color-on-surface) shadow-sm"
                  : "text-(--color-on-surface-variant) hover:text-(--color-on-surface)"
              }
            `}
          >
            {t("tabs.create_account")}
          </Link>
          <Link
            href={`/sign-in${pathname?.startsWith("/sign-in") ? "" : ""}`}
            role="tab"
            aria-selected={isSignIn}
            className={`
              flex items-center justify-center rounded-lg py-2 text-label-md font-medium transition-colors
              ${
                isSignIn
                  ? "bg-(--color-surface-bright) text-(--color-on-surface) shadow-sm"
                  : "text-(--color-on-surface-variant) hover:text-(--color-on-surface)"
              }
            `}
          >
            {t("tabs.sign_in")}
          </Link>
        </div>

        {/* Social auth (visual only) */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={onSocialClick}
            className="
              w-full flex items-center justify-center gap-3 rounded-lg
              bg-(--color-surface-bright) ghost-border
              py-2.5 text-label-md font-medium
              text-(--color-on-surface) hover:bg-(--color-surface-container-low)
              transition-colors
            "
          >
            <GoogleIcon />
            <span>{t("social.continue_with_google")}</span>
          </button>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onSocialClick}
              className="
                flex items-center justify-center gap-2 rounded-lg
                bg-(--color-surface-bright) ghost-border
                py-2.5 text-label-md font-medium
                text-(--color-on-surface) hover:bg-(--color-surface-container-low)
                transition-colors
              "
            >
              <LinkedInIcon />
              <span>{t("social.continue_with_linkedin")}</span>
            </button>
            <button
              type="button"
              onClick={onSocialClick}
              className="
                flex items-center justify-center gap-2 rounded-lg
                bg-(--color-surface-bright) ghost-border
                py-2.5 text-label-md font-medium
                text-(--color-on-surface) hover:bg-(--color-surface-container-low)
                transition-colors
              "
            >
              <AppleIcon />
              <span>{t("social.continue_with_apple")}</span>
            </button>
          </div>
          {comingSoon && (
            <p
              role="status"
              className="text-body-sm text-(--color-on-surface-variant) text-center pt-1"
            >
              {t("social.coming_soon")}
            </p>
          )}
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3" aria-hidden>
          <span className="flex-1 h-px bg-(--color-outline-variant)/40" />
          <span className="text-label-sm uppercase tracking-wider text-(--color-on-surface-variant)/70">
            {t(isSignIn ? "divider.or_email" : "divider.or_email_signup")}
          </span>
          <span className="flex-1 h-px bg-(--color-outline-variant)/40" />
        </div>

        {/* Email form */}
        {children}
      </div>

      {/* Footer */}
      <p
        className="mt-4 text-center text-body-sm text-(--color-on-surface-variant)/80 [&_a]:underline [&_a:hover]:text-(--color-primary)"
        dangerouslySetInnerHTML={{ __html: t("footer.terms_privacy") }}
      />
    </div>
  );
}
