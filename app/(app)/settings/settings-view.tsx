"use client";

import Link from "next/link";
import { useTransition, useState, useRef } from "react";

import { LanguageToggle } from "@/app/(app)/components/language-toggle";
import { ThemeToggle } from "@/app/(app)/components/theme-toggle";
import { switchWorkspaceAndGo } from "@/app/(app)/components/workspace-actions";
import { useT } from "@/lib/i18n/useT";

import {
  updatePassword,
  updateEmail,
  updateUserPreferences,
  updateNotificationPreference,
  requestDataExport,
  requestAccountDeletion,
} from "./settings-actions";

// ── Types ─────────────────────────────────────────────────────────────────────

interface WorkspaceRow {
  id: string;
  name: string;
  slug: string | null;
  isOwner: boolean;
}

type NotificationType =
  | "inquiry_received"
  | "inquiry_accepted"
  | "inquiry_declined"
  | "rofr_notified"
  | "investor_update_opened"
  | "compliance_overdue"
  | "round_visibility_changed";

const NOTIFICATION_TYPES: NotificationType[] = [
  "inquiry_received",
  "inquiry_accepted",
  "inquiry_declined",
  "rofr_notified",
  "investor_update_opened",
  "compliance_overdue",
  "round_visibility_changed",
];

const COMMON_TIMEZONES = [
  "Asia/Riyadh",
  "Asia/Dubai",
  "Asia/Kuwait",
  "Asia/Bahrain",
  "Asia/Qatar",
  "Africa/Cairo",
  "Europe/London",
  "Europe/Paris",
  "America/New_York",
  "America/Los_Angeles",
  "Asia/Karachi",
  "Asia/Kolkata",
  "UTC",
];

// ── Main component ────────────────────────────────────────────────────────────

export function SettingsView({
  email,
  createdAt,
  workspaces,
  dateFormat: initialDateFormat,
  timezone: initialTimezone,
  hasPendingDeletion,
}: {
  email: string;
  createdAt: string | null;
  workspaces: WorkspaceRow[];
  dateFormat: "iso" | "us" | "eu";
  timezone: string;
  hasPendingDeletion: boolean;
}) {
  const t = useT("settings");
  const tAuth = useT("auth");
  const tNav = useT("nav");

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

      {/* 1. Account identity */}
      <section className="rounded-xl ghost-border p-6 space-y-4">
        <h2 className="text-headline-sm font-medium">
          {t("section.account.title")}
        </h2>
        <Field label={t("section.account.email")} value={email} />
        {memberSince && (
          <Field label={t("section.account.member_since")} value={memberSince} />
        )}
      </section>

      {/* 2. Security */}
      <SecuritySection t={t} />

      {/* 3. Preferences */}
      <PreferencesSection
        t={t}
        initialDateFormat={initialDateFormat}
        initialTimezone={initialTimezone}
      />

      {/* 4. Notifications */}
      <NotificationsSection t={t} tNav={tNav} />

      {/* 5. Workspaces */}
      <WorkspacesSection t={t} workspaces={workspaces} />

      {/* 6. Plan & billing */}
      <PlanSection t={t} />

      {/* 7. Privacy */}
      <PrivacySection t={t} hasPendingDeletion={hasPendingDeletion} />

      {/* 8. Session */}
      <section className="rounded-xl ghost-border p-6 space-y-4">
        <h2 className="text-headline-sm font-medium">
          {t("section.session.title")}
        </h2>
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

// ── Security section ──────────────────────────────────────────────────────────

function SecuritySection({ t }: { t: (key: string) => string }) {
  const [pwState, setPwState] = useState<"idle" | "loading" | "ok" | "error">(
    "idle",
  );
  const [pwError, setPwError] = useState("");
  const [emailState, setEmailState] = useState<
    "idle" | "loading" | "ok" | "error"
  >("idle");
  const [emailError, setEmailError] = useState("");
  const [, startTransition] = useTransition();

  const currentPwRef = useRef<HTMLInputElement>(null);
  const newPwRef = useRef<HTMLInputElement>(null);
  const newEmailRef = useRef<HTMLInputElement>(null);

  function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    const current = currentPwRef.current?.value ?? "";
    const next = newPwRef.current?.value ?? "";
    setPwState("loading");
    setPwError("");
    startTransition(async () => {
      const res = await updatePassword(current, next);
      if (res.ok) {
        setPwState("ok");
        if (currentPwRef.current) currentPwRef.current.value = "";
        if (newPwRef.current) newPwRef.current.value = "";
      } else {
        setPwState("error");
        setPwError(res.error ?? t("security.password.error"));
      }
    });
  }

  function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    const next = newEmailRef.current?.value ?? "";
    setEmailState("loading");
    setEmailError("");
    startTransition(async () => {
      const res = await updateEmail(next);
      if (res.ok) {
        setEmailState("ok");
        if (newEmailRef.current) newEmailRef.current.value = "";
      } else {
        setEmailState("error");
        setEmailError(res.error ?? t("security.email.error"));
      }
    });
  }

  return (
    <section className="rounded-xl ghost-border p-6 space-y-6">
      <div>
        <h2 className="text-headline-sm font-medium">
          {t("section.security.title")}
        </h2>
        <p className="mt-1 text-body-sm text-(--color-on-surface-variant)">
          {t("section.security.subtitle")}
        </p>
      </div>

      {/* Change password */}
      <div className="space-y-3">
        <p className="text-body-md font-medium text-(--color-on-surface)">
          {t("security.password.label")}
        </p>
        <form onSubmit={handlePasswordSubmit} className="space-y-3">
          <input
            ref={currentPwRef}
            type="password"
            autoComplete="current-password"
            placeholder={t("security.password.current.placeholder")}
            aria-label={t("security.password.current")}
            className="w-full rounded-lg ghost-border bg-(--color-surface-container-high) px-3 py-2 text-body-sm outline-none focus:ring-2 focus:ring-(--color-primary)/50"
          />
          <input
            ref={newPwRef}
            type="password"
            autoComplete="new-password"
            placeholder={t("security.password.new.placeholder")}
            aria-label={t("security.password.new")}
            className="w-full rounded-lg ghost-border bg-(--color-surface-container-high) px-3 py-2 text-body-sm outline-none focus:ring-2 focus:ring-(--color-primary)/50"
          />
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={pwState === "loading"}
              className="rounded-lg ghost-border px-4 py-2 text-label-sm hover:bg-(--color-surface-container-high) transition-colors disabled:opacity-50"
            >
              {t("security.password.save")}
            </button>
            {pwState === "ok" && (
              <span className="text-body-sm text-(--color-success)">
                {t("security.password.saved")}
              </span>
            )}
            {pwState === "error" && (
              <span className="text-body-sm text-(--color-error)">{pwError}</span>
            )}
          </div>
        </form>
      </div>

      <div className="h-px bg-(--color-outline-variant)/30" />

      {/* Change email */}
      <div className="space-y-3">
        <p className="text-body-md font-medium text-(--color-on-surface)">
          {t("security.email.label")}
        </p>
        <form onSubmit={handleEmailSubmit} className="space-y-3">
          <input
            ref={newEmailRef}
            type="email"
            autoComplete="email"
            placeholder={t("security.email.new.placeholder")}
            aria-label={t("security.email.new")}
            className="w-full rounded-lg ghost-border bg-(--color-surface-container-high) px-3 py-2 text-body-sm outline-none focus:ring-2 focus:ring-(--color-primary)/50"
          />
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={emailState === "loading"}
              className="rounded-lg ghost-border px-4 py-2 text-label-sm hover:bg-(--color-surface-container-high) transition-colors disabled:opacity-50"
            >
              {t("security.email.save")}
            </button>
            {emailState === "ok" && (
              <span className="text-body-sm text-(--color-success)">
                {t("security.email.saved")}
              </span>
            )}
            {emailState === "error" && (
              <span className="text-body-sm text-(--color-error)">
                {emailError}
              </span>
            )}
          </div>
        </form>
      </div>

      <div className="h-px bg-(--color-outline-variant)/30" />

      {/* 2FA — coming soon */}
      <ComingSoonCard
        title={t("security.2fa_coming_soon")}
        body={t("security.2fa_coming_soon.body")}
        badge={t("security.coming_soon_badge")}
      />

      <div className="h-px bg-(--color-outline-variant)/30" />

      {/* Active sessions — coming soon */}
      <ComingSoonCard
        title={t("security.sessions_coming_soon")}
        body={t("security.sessions_coming_soon.body")}
        badge={t("security.coming_soon_badge")}
      />
    </section>
  );
}

// ── Preferences section ───────────────────────────────────────────────────────

function PreferencesSection({
  t,
  initialDateFormat,
  initialTimezone,
}: {
  t: (key: string) => string;
  initialDateFormat: "iso" | "us" | "eu";
  initialTimezone: string;
}) {
  const [dateFormat, setDateFormat] = useState<"iso" | "us" | "eu">(
    initialDateFormat,
  );
  const [timezone, setTimezone] = useState(initialTimezone);
  const [saveState, setSaveState] = useState<"idle" | "loading" | "ok" | "error">(
    "idle",
  );
  const [saveError, setSaveError] = useState("");
  const [, startTransition] = useTransition();

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaveState("loading");
    setSaveError("");
    startTransition(async () => {
      const res = await updateUserPreferences({ date_format: dateFormat, timezone });
      if (res.ok) {
        setSaveState("ok");
      } else {
        setSaveState("error");
        setSaveError(res.error ?? t("section.preferences.error"));
      }
    });
  }

  return (
    <section className="rounded-xl ghost-border p-6 space-y-6">
      <h2 className="text-headline-sm font-medium">
        {t("section.preferences.title")}
      </h2>

      {/* Language */}
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

      {/* Theme */}
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

      <div className="h-px bg-(--color-outline-variant)/30" />

      {/* Date format + timezone */}
      <form onSubmit={handleSave} className="space-y-5">
        <div className="space-y-2">
          <p className="text-body-md text-(--color-on-surface)">
            {t("section.preferences.date_format.label")}
          </p>
          <div className="flex flex-wrap gap-3">
            {(["iso", "us", "eu"] as const).map((fmt) => (
              <label key={fmt} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="date_format"
                  value={fmt}
                  checked={dateFormat === fmt}
                  onChange={() => setDateFormat(fmt)}
                  className="accent-(--color-primary)"
                />
                <span className="text-body-sm text-(--color-on-surface)">
                  {t(`section.preferences.date_format.${fmt}`)}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="timezone"
            className="text-body-md text-(--color-on-surface)"
          >
            {t("section.preferences.timezone.label")}
          </label>
          <input
            id="timezone"
            list="common-timezones"
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            placeholder={t("section.preferences.timezone.placeholder")}
            className="w-full rounded-lg ghost-border bg-(--color-surface-container-high) px-3 py-2 text-body-sm outline-none focus:ring-2 focus:ring-(--color-primary)/50"
          />
          <datalist id="common-timezones">
            {COMMON_TIMEZONES.map((tz) => (
              <option key={tz} value={tz} />
            ))}
          </datalist>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saveState === "loading"}
            className="rounded-lg ghost-border px-4 py-2 text-label-sm hover:bg-(--color-surface-container-high) transition-colors disabled:opacity-50"
          >
            {t("section.preferences.save")}
          </button>
          {saveState === "ok" && (
            <span className="text-body-sm text-(--color-success)">
              {t("section.preferences.saved")}
            </span>
          )}
          {saveState === "error" && (
            <span className="text-body-sm text-(--color-error)">{saveError}</span>
          )}
        </div>
      </form>
    </section>
  );
}

// ── Notifications section ─────────────────────────────────────────────────────

function NotificationsSection({
  t,
  tNav,
}: {
  t: (key: string) => string;
  tNav: (key: string) => string;
}) {
  // Local optimistic state: all default to true
  const [prefs, setPrefs] = useState<
    Record<NotificationType, { email: boolean; inapp: boolean }>
  >(
    Object.fromEntries(
      NOTIFICATION_TYPES.map((type) => [type, { email: true, inapp: true }]),
    ) as Record<NotificationType, { email: boolean; inapp: boolean }>,
  );

  const [, startTransition] = useTransition();

  function handleToggle(
    type: NotificationType,
    channel: "email" | "inapp",
    enabled: boolean,
  ) {
    // Optimistic update
    setPrefs((prev) => ({
      ...prev,
      [type]: { ...prev[type], [channel]: enabled },
    }));
    startTransition(async () => {
      await updateNotificationPreference(type, channel, enabled);
    });
  }

  return (
    <section className="rounded-xl ghost-border p-6 space-y-4">
      <div>
        <h2 className="text-headline-sm font-medium">
          {t("section.notifications.title")}
        </h2>
        <p className="mt-1 text-body-sm text-(--color-on-surface-variant)">
          {t("section.notifications.subtitle")}
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-body-sm">
          <thead>
            <tr className="border-b border-(--color-outline-variant)/30">
              <th className="text-start py-2 text-(--color-on-surface-variant) font-medium">
                {t("section.notifications.col.type")}
              </th>
              <th className="py-2 px-4 text-center text-(--color-on-surface-variant) font-medium">
                {t("section.notifications.col.email")}
              </th>
              <th className="py-2 px-4 text-center text-(--color-on-surface-variant) font-medium">
                {t("section.notifications.col.inapp")}
              </th>
            </tr>
          </thead>
          <tbody>
            {NOTIFICATION_TYPES.map((type) => (
              <tr
                key={type}
                className="border-b border-(--color-outline-variant)/20 last:border-0"
              >
                <td className="py-3 text-(--color-on-surface)">
                  {tNav(`notifications.title.${type}`)}
                </td>
                <td className="py-3 px-4 text-center">
                  <input
                    type="checkbox"
                    checked={prefs[type].email}
                    onChange={(e) =>
                      handleToggle(type, "email", e.target.checked)
                    }
                    className="accent-(--color-primary) w-4 h-4"
                    aria-label={`${tNav(`notifications.title.${type}`)} email`}
                  />
                </td>
                <td className="py-3 px-4 text-center">
                  <input
                    type="checkbox"
                    checked={prefs[type].inapp}
                    onChange={(e) =>
                      handleToggle(type, "inapp", e.target.checked)
                    }
                    className="accent-(--color-primary) w-4 h-4"
                    aria-label={`${tNav(`notifications.title.${type}`)} in-app`}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// ── Workspaces section ────────────────────────────────────────────────────────

function WorkspacesSection({
  t,
  workspaces,
}: {
  t: (key: string) => string;
  workspaces: WorkspaceRow[];
}) {
  const [pending, startTransition] = useTransition();

  return (
    <section className="rounded-xl ghost-border p-6 space-y-4">
      <h2 className="text-headline-sm font-medium">
        {t("section.workspaces.title")}
      </h2>
      <p className="text-body-sm text-(--color-on-surface-variant)">
        {t("section.workspaces.body")}
      </p>

      {workspaces.length === 0 ? (
        <p className="text-body-sm text-(--color-on-surface-variant)">
          {t("section.workspaces.empty")}
        </p>
      ) : (
        <ul className="divide-y divide-(--color-outline-variant)/30">
          {workspaces.map((w) => (
            <li key={w.id} className="py-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-body-md font-medium text-(--color-on-surface) truncate">
                  {w.name}
                </p>
                <p className="text-body-sm text-(--color-on-surface-variant)">
                  {w.isOwner
                    ? t("section.workspaces.role.owner")
                    : t("section.workspaces.role.member")}
                </p>
              </div>
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  startTransition(() =>
                    switchWorkspaceAndGo(w.id, "/company"),
                  );
                }}
                className="
                  rounded-md px-3 py-1.5 text-label-sm text-(--color-primary)
                  hover:bg-(--color-primary)/10 transition-colors shrink-0
                  disabled:opacity-50 disabled:cursor-progress
                "
              >
                {t("section.workspaces.view")}
              </button>
            </li>
          ))}
        </ul>
      )}

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
  );
}

// ── Plan & billing section ────────────────────────────────────────────────────

function PlanSection({ t }: { t: (key: string) => string }) {
  return (
    <section className="rounded-xl ghost-border p-6 space-y-4">
      <h2 className="text-headline-sm font-medium">{t("section.plan.title")}</h2>

      <div className="flex items-start gap-4">
        <div
          className="
            rounded-lg px-3 py-1 text-label-sm font-semibold tracking-wide
            bg-(--color-primary)/15 text-(--color-primary) shrink-0
          "
        >
          {t("section.plan.free_name")}
        </div>
        <div className="space-y-1 min-w-0">
          <p className="text-body-sm text-(--color-on-surface-variant)">
            {t("section.plan.included")}
          </p>
          <p className="text-body-sm text-(--color-on-surface-variant)">
            {t("section.plan.upgrade_hint")}
          </p>
        </div>
      </div>

      <a
        href="mailto:hello@venturepath.example?subject=Upgrade%20inquiry"
        className="
          inline-flex rounded-lg ghost-border px-4 py-2 text-label-sm
          text-(--color-primary) hover:bg-(--color-primary)/10 transition-colors
        "
      >
        {t("section.plan.upgrade_cta")}
      </a>
    </section>
  );
}

// ── Privacy section ───────────────────────────────────────────────────────────

function PrivacySection({
  t,
  hasPendingDeletion,
}: {
  t: (key: string) => string;
  hasPendingDeletion: boolean;
}) {
  const [exportState, setExportState] = useState<"idle" | "loading">("idle");
  const [deleteStep, setDeleteStep] = useState<"idle" | "confirm" | "done">(
    hasPendingDeletion ? "done" : "idle",
  );
  const [deleteReason, setDeleteReason] = useState("");
  const [, startTransition] = useTransition();

  function handleExport() {
    setExportState("loading");
    startTransition(async () => {
      const res = await requestDataExport();
      setExportState("idle");
      if (res.ok && res.json) {
        const blob = new Blob([res.json], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `venturepath-export-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      }
    });
  }

  function handleDeleteConfirm() {
    startTransition(async () => {
      await requestAccountDeletion(deleteReason);
      setDeleteStep("done");
    });
  }

  return (
    <section className="rounded-xl ghost-border p-6 space-y-6">
      <div>
        <h2 className="text-headline-sm font-medium">
          {t("section.privacy.title")}
        </h2>
        <p className="mt-1 text-body-sm text-(--color-on-surface-variant)">
          {t("section.privacy.subtitle")}
        </p>
      </div>

      {/* Data export */}
      <div className="space-y-2">
        <p className="text-body-md font-medium text-(--color-on-surface)">
          {t("section.privacy.export_cta")}
        </p>
        <p className="text-body-sm text-(--color-on-surface-variant)">
          {t("section.privacy.export_hint")}
        </p>
        <button
          type="button"
          disabled={exportState === "loading"}
          onClick={handleExport}
          className="
            rounded-lg ghost-border px-4 py-2 text-label-sm
            hover:bg-(--color-surface-container-high) transition-colors
            disabled:opacity-50 disabled:cursor-progress
          "
        >
          {exportState === "loading"
            ? t("section.privacy.export_downloading")
            : t("section.privacy.export_cta")}
        </button>
      </div>

      <div className="h-px bg-(--color-outline-variant)/30" />

      {/* Account deletion */}
      <div className="space-y-3">
        <p className="text-body-md font-medium text-(--color-on-surface)">
          {t("section.privacy.delete_cta")}
        </p>
        <p className="text-body-sm text-(--color-on-surface-variant)">
          {t("section.privacy.delete_hint")}
        </p>

        {deleteStep === "idle" && (
          <button
            type="button"
            onClick={() => setDeleteStep("confirm")}
            className="
              rounded-lg ghost-border px-4 py-2 text-label-sm
              text-(--color-error) hover:bg-(--color-error)/10 transition-colors
            "
          >
            {t("section.privacy.delete_cta")}
          </button>
        )}

        {deleteStep === "confirm" && (
          <div className="rounded-xl bg-(--color-error)/8 border border-(--color-error)/30 p-4 space-y-4">
            <p className="text-body-sm font-semibold text-(--color-error)">
              {t("section.privacy.delete_confirm_title")}
            </p>
            <p className="text-body-sm text-(--color-on-surface-variant)">
              {t("section.privacy.delete_confirm_body")}
            </p>
            <div className="space-y-2">
              <label
                htmlFor="delete-reason"
                className="text-body-sm text-(--color-on-surface-variant)"
              >
                {t("section.privacy.delete_reason.label")}
              </label>
              <textarea
                id="delete-reason"
                rows={2}
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                placeholder={t("section.privacy.delete_reason.placeholder")}
                className="w-full rounded-lg ghost-border bg-(--color-surface-container-high) px-3 py-2 text-body-sm outline-none focus:ring-2 focus:ring-(--color-error)/40 resize-none"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="
                  rounded-lg px-4 py-2 text-label-sm font-medium
                  bg-(--color-error) text-white hover:opacity-90 transition-opacity
                "
              >
                {t("section.privacy.delete_confirm_proceed")}
              </button>
              <button
                type="button"
                onClick={() => setDeleteStep("idle")}
                className="
                  rounded-lg ghost-border px-4 py-2 text-label-sm
                  hover:bg-(--color-surface-container-high) transition-colors
                "
              >
                {t("section.privacy.delete_cancel")}
              </button>
            </div>
          </div>
        )}

        {deleteStep === "done" && (
          <p className="text-body-sm text-(--color-on-surface-variant)">
            {t("section.privacy.delete_pending")}
          </p>
        )}
      </div>
    </section>
  );
}

// ── Shared sub-components ─────────────────────────────────────────────────────

function ComingSoonCard({
  title,
  body,
  badge,
}: {
  title: string;
  body: string;
  badge: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 opacity-60">
      <div className="space-y-1">
        <p className="text-body-md font-medium text-(--color-on-surface)">
          {title}
        </p>
        <p className="text-body-sm text-(--color-on-surface-variant)">{body}</p>
      </div>
      <span
        className="
          shrink-0 rounded-full px-2.5 py-0.5 text-label-xs font-medium
          bg-(--color-surface-container-high) text-(--color-on-surface-variant)
          border border-(--color-outline-variant)/40
        "
      >
        {badge}
      </span>
    </div>
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
