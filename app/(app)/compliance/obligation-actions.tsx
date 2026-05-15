"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { deleteObligation, markComplete, reopenObligation } from "./actions";
import type { ComplianceStatus } from "@/lib/compliance/status";

export function ObligationActions({
  id,
  status,
  name,
}: {
  id: string;
  status: ComplianceStatus;
  name: string;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onMark() {
    startTransition(async () => {
      setError(null);
      const result = await markComplete(id);
      if (!result.ok) {
        setError(result.error ?? "Failed.");
        return;
      }
      router.refresh();
    });
  }

  function onReopen() {
    startTransition(async () => {
      setError(null);
      const result = await reopenObligation(id);
      if (!result.ok) {
        setError(result.error ?? "Failed.");
        return;
      }
      router.refresh();
    });
  }

  function onDelete() {
    startTransition(async () => {
      setError(null);
      const result = await deleteObligation(id);
      if (!result.ok) {
        setError(result.error ?? "Failed.");
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
          <span className="text-body-sm text-(--color-on-surface-variant)">
            Delete {name}?
          </span>
          <button
            type="button"
            onClick={onDelete}
            disabled={busy}
            className="rounded-sm bg-(--color-error)/15 px-2 py-1 text-label-sm font-medium text-(--color-error) disabled:opacity-50"
          >
            {busy ? "…" : "Confirm"}
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            disabled={busy}
            className="rounded-sm px-2 py-1 text-label-sm text-(--color-on-surface-variant) hover:text-(--color-on-surface)"
          >
            Cancel
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-3 whitespace-nowrap">
          {status === "complete" ? (
            <button
              type="button"
              onClick={onReopen}
              disabled={busy}
              className="text-body-sm text-(--color-on-surface-variant) hover:text-(--color-primary) disabled:opacity-50"
            >
              Reopen
            </button>
          ) : (
            <button
              type="button"
              onClick={onMark}
              disabled={busy}
              className="text-body-sm text-(--color-success) hover:text-(--color-on-surface) disabled:opacity-50"
            >
              Mark complete
            </button>
          )}
          <button
            type="button"
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
