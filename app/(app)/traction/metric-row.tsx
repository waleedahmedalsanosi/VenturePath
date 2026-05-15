"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { deleteMetric } from "./actions";

export function MetricRow({
  id,
  month,
  mrr,
  customers,
  grossMargin,
  runway,
}: {
  id: string;
  month: string;
  mrr: string;
  customers: string;
  grossMargin: string;
  runway: string;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onDelete() {
    startTransition(async () => {
      setError(null);
      const result = await deleteMetric(id);
      if (!result.ok) {
        setError(result.error ?? "Failed.");
        return;
      }
      setConfirming(false);
      router.refresh();
    });
  }

  return (
    <tr className="border-t border-(--color-outline-variant)/15">
      <td className="px-4 py-3 font-medium tabular-nums">{month}</td>
      <td className="px-4 py-3 text-end tabular-nums">{mrr}</td>
      <td className="px-4 py-3 text-end tabular-nums">{customers}</td>
      <td className="px-4 py-3 text-end tabular-nums">{grossMargin}</td>
      <td className="px-4 py-3 text-end tabular-nums">{runway}</td>
      <td className="px-4 py-3">
        {confirming ? (
          <div className="flex items-center justify-end gap-2 whitespace-nowrap">
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
              className="rounded-sm px-2 py-1 text-label-sm text-(--color-on-surface-variant)"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="text-body-sm text-(--color-on-surface-variant) hover:text-(--color-error)"
          >
            Delete
          </button>
        )}
        {error && (
          <p className="mt-1 text-body-sm text-(--color-error) text-end" role="alert">
            {error}
          </p>
        )}
      </td>
    </tr>
  );
}
