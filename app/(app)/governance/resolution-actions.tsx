"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { deleteResolution, transitionResolution } from "./actions";

export function ResolutionActions({
  id,
  status,
}: {
  id: string;
  status: "draft" | "pending" | "passed" | "rejected";
}) {
  const router = useRouter();
  const [busy, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function transition(next: "pending" | "passed" | "rejected") {
    startTransition(async () => {
      setError(null);
      const r = await transitionResolution(id, next);
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
      const r = await deleteResolution(id);
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
          {status === "draft" && (
            <>
              <Link
                href={`/governance/resolutions/${id}/edit`}
                className="text-body-sm text-(--color-on-surface-variant) hover:text-(--color-primary)"
              >
                Edit
              </Link>
              <button
                onClick={() => transition("pending")}
                disabled={busy}
                className="text-body-sm text-(--color-primary) hover:underline disabled:opacity-50"
              >
                Submit
              </button>
            </>
          )}
          {status === "pending" && (
            <>
              <button
                onClick={() => transition("passed")}
                disabled={busy}
                className="text-body-sm text-(--color-success) hover:underline disabled:opacity-50"
              >
                Pass
              </button>
              <button
                onClick={() => transition("rejected")}
                disabled={busy}
                className="text-body-sm text-(--color-error) hover:underline disabled:opacity-50"
              >
                Reject
              </button>
            </>
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
