"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { recordRofrResponse } from "../actions";

export function RofrRowActions({ notificationId }: { notificationId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function respond(response: "exercise" | "decline") {
    setError(null);
    const data = new FormData();
    data.set("notification_id", notificationId);
    data.set("response", response);
    startTransition(async () => {
      const result = await recordRofrResponse(data);
      if (!result.ok) {
        setError(result.error ?? "Failed to record response.");
        return;
      }
      setOpen(false);
      router.refresh();
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-label-sm text-(--color-on-surface-variant) hover:text-(--color-primary) underline-offset-2 hover:underline"
      >
        Record
      </button>
    );
  }

  return (
    <span className="inline-flex flex-col gap-1">
      <span className="flex gap-2">
        <button
          type="button"
          onClick={() => respond("exercise")}
          disabled={pending}
          className="rounded px-2 py-0.5 text-label-sm bg-(--color-primary) text-(--color-on-primary) disabled:opacity-50"
        >
          Exercise
        </button>
        <button
          type="button"
          onClick={() => respond("decline")}
          disabled={pending}
          className="rounded px-2 py-0.5 text-label-sm ghost-border hover:bg-(--color-surface-container-high) disabled:opacity-50"
        >
          Decline
        </button>
        <button
          type="button"
          onClick={() => { setOpen(false); setError(null); }}
          className="text-label-sm text-(--color-on-surface-variant)"
        >
          ✕
        </button>
      </span>
      {error && <span className="text-body-sm text-(--color-error)">{error}</span>}
    </span>
  );
}
