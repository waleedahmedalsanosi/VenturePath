"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { terminateGrant } from "./actions";

export function GrantRow({
  id,
  employee,
  email,
  dept,
  options,
  strike,
  grantedOn,
  vestedPctLabel,
  status,
}: {
  id: string;
  employee: string;
  email: string;
  dept: string;
  options: string;
  strike: string;
  grantedOn: string;
  vestedPctLabel: string;
  status: string;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onTerminate() {
    startTransition(async () => {
      setError(null);
      const result = await terminateGrant(id);
      if (!result.ok) {
        setError(result.error ?? "Failed.");
        return;
      }
      setConfirming(false);
      router.refresh();
    });
  }

  return (
    <tr className="border-t border-(--color-outline-variant)/15 align-top">
      <td className="px-4 py-3">
        <div className="font-medium">{employee}</div>
        <div className="text-body-sm text-(--color-on-surface-variant) font-mono">{email}</div>
      </td>
      <td className="px-4 py-3 text-(--color-on-surface-variant)">{dept}</td>
      <td className="px-4 py-3 text-end tabular-nums">{options}</td>
      <td className="px-4 py-3 text-end tabular-nums text-(--color-on-surface-variant)">{strike}</td>
      <td className="px-4 py-3 tabular-nums text-(--color-on-surface-variant)">{grantedOn}</td>
      <td className="px-4 py-3 text-end tabular-nums">{vestedPctLabel}</td>
      <td className="px-4 py-3 text-(--color-on-surface-variant)">{status}</td>
      <td className="px-4 py-3 text-end">
        {confirming ? (
          <div className="flex items-center justify-end gap-2 whitespace-nowrap">
            <button
              type="button"
              onClick={onTerminate}
              disabled={busy}
              className="rounded-sm bg-(--color-error)/15 px-2 py-1 text-label-sm font-medium text-(--color-error) disabled:opacity-50"
            >
              {busy ? "…" : "Terminate"}
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
          <div className="flex items-center justify-end gap-3">
            <Link
              href={`/esop/grants/${id}/edit`}
              className="text-body-sm text-(--color-on-surface-variant) hover:text-(--color-on-surface)"
            >
              Edit
            </Link>
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="text-body-sm text-(--color-on-surface-variant) hover:text-(--color-error)"
            >
              Terminate
            </button>
          </div>
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
