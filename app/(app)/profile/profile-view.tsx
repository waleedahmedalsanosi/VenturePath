"use client";

import Link from "next/link";
import { useTransition } from "react";

import { useT } from "@/lib/i18n/useT";
import { switchWorkspaceAndGo } from "../components/workspace-actions";

interface WorkspaceRow {
  id: string;
  name: string;
  slug: string | null;
  isOwner: boolean;
}

function initialsFromEmail(email: string): string {
  const local = email.split("@")[0] ?? "";
  const parts = local.split(/[._-]+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
  return (local[0] ?? "?").toUpperCase();
}

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
  return (parts[0]?.slice(0, 2) ?? "?").toUpperCase();
}

export function ProfileView({
  email,
  createdAt,
  userId,
  workspaces,
  displayName,
  bio,
  avatarUrl,
  linkedinUrl,
  location,
}: {
  email: string;
  createdAt: string | null;
  userId: string;
  workspaces: WorkspaceRow[];
  displayName?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  linkedinUrl?: string | null;
  location?: string | null;
}) {
  const t = useT("profile");
  const tNav = useT("nav");
  const [pending, startTransition] = useTransition();

  const local = email.split("@")[0] ?? email;
  const headerName = displayName?.trim() || local;
  const initials = displayName
    ? initialsFromName(displayName)
    : initialsFromEmail(email);

  const memberSince = createdAt
    ? new Date(createdAt).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
      })
    : null;
  const ownerCount = workspaces.filter((w) => w.isOwner).length;
  const memberCount = workspaces.length - ownerCount;

  return (
    <main className="w-full mx-auto max-w-3xl px-6 py-10 space-y-10">
      <header className="flex items-start gap-5">
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt=""
            className="w-20 h-20 rounded-2xl shrink-0 object-cover ghost-border"
          />
        ) : (
          <span
            aria-hidden
            className="
              flex items-center justify-center w-20 h-20 rounded-2xl shrink-0
              bg-gradient-to-br from-(--color-gradient-start) to-(--color-gradient-end)
              text-[#0d1322] text-display-sm font-semibold
            "
          >
            {initials}
          </span>
        )}
        <div className="min-w-0 flex-1 pt-1">
          <p className="text-label-md uppercase text-(--color-on-surface-variant)">
            {t("eyebrow")}
          </p>
          <h1 className="mt-1 text-display-sm font-semibold tracking-tight truncate">
            {headerName}
          </h1>
          <p className="mt-1 text-body-md text-(--color-on-surface-variant)">
            {email}
          </p>
          {bio && (
            <p className="mt-3 text-body-md text-(--color-on-surface) whitespace-pre-wrap">
              {bio}
            </p>
          )}
          <div className="mt-3 flex gap-2 flex-wrap items-center">
            <span className="
              rounded-md px-2 py-0.5 text-label-sm font-medium tracking-wider
              bg-(--color-primary-container)/40 text-(--color-primary)
            ">
              {tNav("account.tier.free")}
            </span>
            {memberSince && (
              <span className="text-body-sm text-(--color-on-surface-variant)">
                {t("member_since", { date: memberSince })}
              </span>
            )}
            <Link
              href="/profile/edit"
              className="
                ms-auto rounded-lg ghost-border px-3 py-1.5 text-label-sm
                hover:bg-(--color-surface-container-high) transition-colors
              "
            >
              {t("edit_profile")}
            </Link>
          </div>
          {(location || linkedinUrl) && (
            <div className="mt-2 flex gap-3 flex-wrap text-body-sm text-(--color-on-surface-variant)">
              {location && <span>{location}</span>}
              {linkedinUrl && (
                <a
                  href={linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-(--color-primary) hover:underline"
                >
                  LinkedIn ↗
                </a>
              )}
            </div>
          )}
        </div>
      </header>

      <section className="rounded-xl ghost-border p-6 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-headline-sm font-medium">
            {t("section.workspaces.title")}
          </h2>
          <Link
            href="/settings"
            className="
              rounded-lg ghost-border px-3 py-1.5 text-label-sm
              hover:bg-(--color-surface-container-high) transition-colors
            "
          >
            {t("manage_in_settings")}
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Stat label={t("section.workspaces.stat.owner")} value={String(ownerCount)} />
          <Stat label={t("section.workspaces.stat.member")} value={String(memberCount)} />
        </div>
        {workspaces.length === 0 ? (
          <div className="rounded-lg ghost-border p-4 text-center">
            <p className="text-body-sm text-(--color-on-surface-variant)">
              {t("section.workspaces.empty")}
            </p>
            <Link
              href="/setup"
              className="
                inline-flex mt-3 rounded-lg bg-(--color-primary) text-(--color-on-primary)
                px-4 py-2 text-label-sm hover:opacity-90
              "
            >
              {t("section.workspaces.create_first")}
            </Link>
          </div>
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
                    startTransition(() => switchWorkspaceAndGo(w.id, "/company"));
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
      </section>

      <section className="rounded-xl ghost-border p-6 space-y-3">
        <h2 className="text-headline-sm font-medium">
          {t("section.account.title")}
        </h2>
        <p className="text-body-sm text-(--color-on-surface-variant)">
          {t("section.account.body")}
        </p>
        <p className="text-label-sm font-mono text-(--color-on-surface-variant)/70 tabular-nums">
          {t("section.account.user_id", { id: userId })}
        </p>
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-(--color-surface-container-low) ghost-border p-4">
      <p className="text-display-md font-semibold tabular-nums">{value}</p>
      <p className="text-body-sm text-(--color-on-surface-variant)">{label}</p>
    </div>
  );
}
