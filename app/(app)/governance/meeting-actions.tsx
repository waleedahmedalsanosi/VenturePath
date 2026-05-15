"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { deleteMeeting, updateMeetingStatus } from "./actions";

export function MeetingActions({
  id,
  status,
}: {
  id: string;
  status: "upcoming" | "completed" | "cancelled";
}) {
  const router = useRouter();
  const [busy, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function setStatus(next: "upcoming" | "completed" | "cancelled") {
    startTransition(async () => {
      setError(null);
      const r = await updateMeetingStatus(id, next);
      if (!r.ok) {
        setError(r.error ?? "Failed.");
        return;
      }
      router.refresh();
    });
  }

  function onDelete() {
    startTransition(async () => {
      setError(null);
      const r = await deleteMeeting(id);
      if (!r.ok) {
        setError(r.error ?? "Failed.");
        return;
      }
      setConfirming(false);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      {confirming ? (
        <div className="flex items-center gap-2 whitespace-nowrap">
          <button
            onClick={onDelete}
            disabled={busy}
            className="rounded-sm bg-(--color-error)/15 px-2 py-1 text-label-sm font-medium text-(--color-error) disabled:opacity-50"
          >
            Confirm
          </button>
          <button
            onClick={() => setConfirming(false)}
            disabled={busy}
            className="rounded-sm px-2 py-1 text-label-sm text-(--color-on-surface-variant)"
          >
            Cancel
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-3 whitespace-nowrap">
          {status === "upcoming" && (
            <>
              <button
                onClick={() => setStatus("completed")}
                disabled={busy}
                className="text-body-sm text-(--color-success) hover:underline disabled:opacity-50"
              >
                Mark held
              </button>
              <button
                onClick={() => setStatus("cancelled")}
                disabled={busy}
                className="text-body-sm text-(--color-on-surface-variant) hover:text-(--color-on-surface) disabled:opacity-50"
              >
                Cancel
              </button>
            </>
          )}
          {(status === "completed" || status === "cancelled") && (
            <button
              onClick={() => setStatus("upcoming")}
              disabled={busy}
              className="text-body-sm text-(--color-on-surface-variant) hover:text-(--color-primary) disabled:opacity-50"
            >
              Reopen
            </button>
          )}
          <button
            onClick={() => setConfirming(true)}
            disabled={busy}
            className="text-body-sm text-(--color-on-surface-variant) hover:text-(--color-error) disabled:opacity-50"
          >
            Delete
          </button>
        </div>
      )}
      {error && (
        <p className="text-body-sm text-(--color-error)" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
