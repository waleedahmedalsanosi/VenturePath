"use client";

import { useState, useTransition } from "react";

import { setRoundVisibility } from "../actions";

interface VisibilityToggleProps {
  roundId: string;
  isPublic: boolean;
  status: "draft" | "open" | "closed";
  publicProfilePublished: boolean;
}

export function VisibilityToggle({
  roundId,
  isPublic,
  status,
  publicProfilePublished,
}: VisibilityToggleProps) {
  const [checked, setChecked] = useState(isPublic);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    const next = !checked;
    setChecked(next);
    setError(null);
    startTransition(async () => {
      const result = await setRoundVisibility(roundId, next);
      if (!result.ok) {
        setChecked(!next);
        setError(result.error ?? "Failed.");
      }
    });
  }

  const willShow = checked && status !== "draft" && publicProfilePublished;
  const isDraft = status === "draft";
  const profileNotPublished = !publicProfilePublished;

  return (
    <section className="rounded-xl bg-(--color-surface-container-low) p-5 space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-label-lg font-medium">
            Make this round discoverable to other investors on VenturePath
          </h3>
          <p className="text-body-sm text-(--color-on-surface-variant) max-w-md">
            Your round will appear in the Browse tab. Round details and
            documents are still protected.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          onClick={handleToggle}
          disabled={isPending}
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

      {/* Status hints */}
      {checked && isDraft && (
        <p className="rounded-md bg-(--color-warning)/10 px-3 py-2 text-body-sm text-(--color-warning)">
          Drafts are never shown publicly. Open the round to publish.
        </p>
      )}
      {checked && profileNotPublished && !isDraft && (
        <p className="rounded-md bg-(--color-warning)/10 px-3 py-2 text-body-sm text-(--color-warning)">
          Your public profile is not published. Enable it in{" "}
          <a href="/company" className="underline">Company → Public profile</a>{" "}
          for this round to appear.
        </p>
      )}
      {willShow && (
        <p className="rounded-md bg-(--color-success)/10 px-3 py-2 text-body-sm text-(--color-success)">
          Live on your public profile.
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
