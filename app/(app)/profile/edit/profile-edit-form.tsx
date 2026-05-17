"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { useT } from "@/lib/i18n/useT";

import { upsertUserProfile } from "../profile-actions";

interface InitialProfile {
  display_name: string;
  bio: string;
  avatar_url: string;
  linkedin_url: string;
  location: string;
}

export function ProfileEditForm({ initial }: { initial: InitialProfile }) {
  const t = useT("profile");
  const router = useRouter();
  const [displayName, setDisplayName] = useState(initial.display_name);
  const [bio, setBio] = useState(initial.bio);
  const [avatarUrl, setAvatarUrl] = useState(initial.avatar_url);
  const [linkedinUrl, setLinkedinUrl] = useState(initial.linkedin_url);
  const [location, setLocation] = useState(initial.location);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await upsertUserProfile({
        display_name: displayName.trim() || null,
        bio: bio.trim() || null,
        avatar_url: avatarUrl.trim() || null,
        linkedin_url: linkedinUrl.trim() || null,
        location: location.trim() || null,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      router.push("/profile");
      router.refresh();
    });
  }

  return (
    <main className="w-full mx-auto max-w-2xl px-6 py-10 space-y-6">
      <header>
        <p className="text-label-md uppercase text-(--color-on-surface-variant)">
          {t("eyebrow")}
        </p>
        <h1 className="mt-1 text-display-sm font-semibold tracking-tight">
          {t("edit.title")}
        </h1>
      </header>

      <form onSubmit={onSubmit} className="rounded-xl ghost-border p-6 space-y-5">
        <Field
          label={t("edit.display_name")}
          placeholder={t("edit.display_name.placeholder")}
          value={displayName}
          onChange={setDisplayName}
          maxLength={120}
        />
        <Field
          label={t("edit.bio")}
          placeholder={t("edit.bio.placeholder")}
          value={bio}
          onChange={setBio}
          multiline
          maxLength={500}
          counter
        />
        <Field
          label={t("edit.location")}
          placeholder={t("edit.location.placeholder")}
          value={location}
          onChange={setLocation}
          maxLength={120}
        />
        <Field
          label={t("edit.linkedin_url")}
          placeholder={t("edit.linkedin_url.placeholder")}
          value={linkedinUrl}
          onChange={setLinkedinUrl}
          maxLength={240}
          type="url"
        />
        <Field
          label={t("edit.avatar_url")}
          placeholder={t("edit.avatar_url.placeholder")}
          value={avatarUrl}
          onChange={setAvatarUrl}
          maxLength={500}
          type="url"
        />

        {error && (
          <p className="text-body-sm text-(--color-error)" role="alert">
            {t("edit.error")}: {error}
          </p>
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            href="/profile"
            className="
              rounded-lg ghost-border px-4 py-2 text-label-md
              hover:bg-(--color-surface-container-high) transition-colors
            "
          >
            {t("edit.cancel")}
          </Link>
          <button
            type="submit"
            disabled={pending}
            className="
              btn-primary-gradient rounded-lg px-4 py-2 text-label-md font-medium
              disabled:opacity-50 disabled:cursor-progress
            "
          >
            {pending ? "…" : t("edit.save")}
          </button>
        </div>
      </form>
    </main>
  );
}

function Field({
  label,
  placeholder,
  value,
  onChange,
  multiline,
  maxLength,
  counter,
  type,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  maxLength?: number;
  counter?: boolean;
  type?: string;
}) {
  const t = useT("profile");
  return (
    <label className="block">
      <span className="text-label-sm uppercase tracking-wider text-(--color-on-surface-variant)">
        {label}
      </span>
      {multiline ? (
        <textarea
          rows={4}
          value={value}
          maxLength={maxLength}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="mt-1.5 block w-full rounded-lg bg-(--color-surface-bright) ghost-border px-3.5 py-2.5 text-body-md focus:outline-none focus:border-(--color-primary)"
        />
      ) : (
        <input
          type={type ?? "text"}
          value={value}
          maxLength={maxLength}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="mt-1.5 block w-full rounded-lg bg-(--color-surface-bright) ghost-border px-3.5 py-2.5 text-body-md focus:outline-none focus:border-(--color-primary)"
        />
      )}
      {counter && maxLength && (
        <span className="block mt-1 text-body-sm text-(--color-on-surface-variant) tabular-nums">
          {t("edit.bio.counter", { count: value.length })}
        </span>
      )}
    </label>
  );
}
