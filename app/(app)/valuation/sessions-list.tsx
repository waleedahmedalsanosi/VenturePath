"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { deleteSession } from "./actions";

interface Session {
  id: string;
  label: string;
  methodology: string;
  result_low_sar: number | string | null;
  result_mid_sar: number | string | null;
  result_high_sar: number | string | null;
  created_at: string;
}

const METHOD_LABELS: Record<string, string> = {
  revenue_multiple: "Revenue Multiple",
  scorecard: "Scorecard",
  berkus: "Berkus",
  dcf: "DCF",
};

function fmtSAR(v: number | string | null): string {
  if (v === null) return "—";
  const n = typeof v === "string" ? Number(v) : v;
  if (!Number.isFinite(n)) return "—";
  return `SAR ${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function SessionsList({ sessions }: { sessions: Session[] }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState<string | null>(null);
  const [busy, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onDelete(id: string) {
    startTransition(async () => {
      setError(null);
      const r = await deleteSession(id);
      if (!r.ok) {
        setError(r.error ?? "Failed.");
        return;
      }
      setConfirming(null);
      router.refresh();
    });
  }

  if (sessions.length === 0) {
    return (
      <section>
        <h2 className="text-label-md uppercase text-(--color-on-surface-variant) mb-4">
          Saved sessions
        </h2>
        <div className="rounded-xl bg-(--color-surface-container-low) p-8 text-center">
          <p className="text-body-md text-(--color-on-surface-variant)">
            Run a calculation, label it, save it. Sessions are always private —
            never shown to shareholders or investors.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section>
      <h2 className="text-label-md uppercase text-(--color-on-surface-variant) mb-4">
        Saved sessions ({sessions.length})
      </h2>
      <div className="rounded-xl bg-(--color-surface-container-low) overflow-hidden">
        <table className="w-full text-body-sm">
          <thead>
            <tr className="text-label-md uppercase text-(--color-on-surface-variant)">
              <th className="px-4 py-3 text-start font-normal">Label</th>
              <th className="px-4 py-3 text-start font-normal">Method</th>
              <th className="px-4 py-3 text-end font-normal">Low</th>
              <th className="px-4 py-3 text-end font-normal">Mid</th>
              <th className="px-4 py-3 text-end font-normal">High</th>
              <th className="px-4 py-3 text-start font-normal">Saved</th>
              <th className="px-4 py-3 text-end font-normal" />
            </tr>
          </thead>
          <tbody>
            {sessions.map((s) => (
              <tr key={s.id} className="border-t border-(--color-outline-variant)/15">
                <td className="px-4 py-3 font-medium">{s.label}</td>
                <td className="px-4 py-3 text-(--color-on-surface-variant)">
                  {METHOD_LABELS[s.methodology] ?? s.methodology}
                </td>
                <td className="px-4 py-3 text-end tabular-nums">{fmtSAR(s.result_low_sar)}</td>
                <td className="px-4 py-3 text-end tabular-nums font-medium">{fmtSAR(s.result_mid_sar)}</td>
                <td className="px-4 py-3 text-end tabular-nums">{fmtSAR(s.result_high_sar)}</td>
                <td className="px-4 py-3 tabular-nums text-(--color-on-surface-variant)">{fmtDate(s.created_at)}</td>
                <td className="px-4 py-3 text-end">
                  {confirming === s.id ? (
                    <div className="flex items-center justify-end gap-2 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onDelete(s.id)}
                        disabled={busy}
                        className="rounded-sm bg-(--color-error)/15 px-2 py-1 text-label-sm font-medium text-(--color-error) disabled:opacity-50"
                      >
                        Confirm
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirming(null)}
                        disabled={busy}
                        className="rounded-sm px-2 py-1 text-label-sm text-(--color-on-surface-variant)"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirming(s.id)}
                      className="text-body-sm text-(--color-on-surface-variant) hover:text-(--color-error)"
                    >
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {error && (
          <p className="px-4 py-3 text-body-sm text-(--color-error)" role="alert">
            {error}
          </p>
        )}
      </div>
    </section>
  );
}
