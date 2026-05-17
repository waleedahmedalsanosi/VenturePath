"use client";

import { useState, useTransition } from "react";

import { useT } from "@/lib/i18n/useT";

import { setListingVisibility } from "../actions";

interface ListingVisibilityToggleProps {
  listingId: string;
  isPublic: boolean;
  rofrLockedUntil: string | null; // ISO string of latest open window_expires_at, or null
}

export function ListingVisibilityToggle({
  listingId,
  isPublic,
  rofrLockedUntil,
}: ListingVisibilityToggleProps) {
  const t = useT("marketplace");
  const [checked, setChecked] = useState(isPublic);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isLocked = Boolean(rofrLockedUntil);

  function handleToggle() {
    if (isLocked) return;
    const next = !checked;
    setChecked(next);
    setError(null);
    startTransition(async () => {
      const result = await setListingVisibility(listingId, next);
      if (!result.ok) {
        setChecked(!next);
        setError(result.error ?? "Failed.");
      }
    });
  }

  const lockDateFormatted = rofrLockedUntil
    ? new Date(rofrLockedUntil).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : null;

  return (
    <section className="rounded-xl bg-(--color-surface-container-low) p-5 space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-label-lg font-medium">
            {t("visibility.toggle.label")}
          </h3>
          <p className="text-body-sm text-(--color-on-surface-variant) max-w-md">
            {t("visibility.toggle.sublabel")}
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          onClick={handleToggle}
          disabled={isPending || isLocked}
          title={
            isLocked && lockDateFormatted
              ? t("visibility.toggle.rofr_locked", { date: lockDateFormatted })
              : undefined
          }
          className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
            checked
              ? "bg-(--color-primary)/60"
              : "bg-(--color-surface-bright)"
          } disabled:opacity-50`}
        >
          <span
            className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-(--color-on-surface) transition-transform ${
              checked ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      {isLocked && lockDateFormatted && (
        <p className="rounded-md bg-(--color-warning)/10 px-3 py-2 text-body-sm text-(--color-warning)">
          {t("visibility.toggle.rofr_locked", { date: lockDateFormatted })}
        </p>
      )}
      {checked && !isLocked && (
        <p className="rounded-md bg-(--color-success)/10 px-3 py-2 text-body-sm text-(--color-success)">
          Live on the Marketplace Browse tab.
        </p>
      )}
      {error && (
        <p className="rounded-md bg-(--color-error)/10 px-3 py-2 text-body-sm text-(--color-error)">
          {error}
        </p>
      )}
    </section>
  );
}
