"use client";

import { useState, useTransition, useMemo } from "react";

import { openRound, closeRound, deleteRound } from "../actions";

interface SignedTermSheet {
  investor_name: string;
  firm: string | null;
  instrument_type: string;
  terms: Record<string, unknown>;
}

interface RoundActionsProps {
  roundId: string;
  status: "draft" | "open" | "closed";
  signedTermSheets?: SignedTermSheet[];
}

function sarFromTerms(ts: SignedTermSheet): number {
  const t = ts.terms;
  if (ts.instrument_type === "ordinary") {
    const shares = Number(t.shares ?? 0);
    const price = Number(t.price_per_share_sar ?? 0);
    return shares * price;
  }
  const inv = Number(t.investment_sar ?? t.principal_sar ?? 0);
  return inv;
}

function fmtSAR(n: number): string {
  return `SAR ${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

export function RoundActions({ roundId, status, signedTermSheets = [] }: RoundActionsProps) {
  const [showCloseForm, setShowCloseForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const totalSignedSar = useMemo(
    () => signedTermSheets.reduce((sum, ts) => sum + sarFromTerms(ts), 0),
    [signedTermSheets],
  );

  function handleOpen() {
    setError(null);
    startTransition(async () => {
      const result = await openRound(roundId);
      if (!result.ok) setError(result.error ?? "Failed.");
    });
  }

  function handleDelete() {
    if (!confirm("Delete this round? This cannot be undone.")) return;
    startTransition(async () => {
      const result = await deleteRound(roundId);
      if (!result.ok) setError(result.error ?? "Failed.");
    });
  }

  function handleCloseSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await closeRound(roundId, fd);
      if (!result.ok) setError(result.error ?? "Failed.");
      else setShowCloseForm(false);
    });
  }

  return (
    <section className="space-y-4">
      {/* Action buttons */}
      <div className="flex flex-wrap items-center gap-3">
        {status === "draft" && (
          <button
            onClick={handleOpen}
            disabled={isPending}
            className="rounded-lg bg-(--color-info)/15 px-4 py-2 text-label-lg text-(--color-info) hover:bg-(--color-info)/25 transition-colors disabled:opacity-50"
          >
            {isPending ? "Opening…" : "Open round"}
          </button>
        )}

        {status === "open" && (
          <button
            onClick={() => setShowCloseForm((v) => !v)}
            className="rounded-lg bg-(--color-success)/15 px-4 py-2 text-label-lg text-(--color-success) hover:bg-(--color-success)/25 transition-colors"
          >
            {showCloseForm ? "Cancel close" : "Close round"}
          </button>
        )}

        <button
          onClick={handleDelete}
          disabled={isPending}
          className="rounded-lg px-4 py-2 text-label-lg text-(--color-error) hover:bg-(--color-error)/10 transition-colors disabled:opacity-50"
        >
          Delete round
        </button>
      </div>

      {/* Close-round form */}
      {showCloseForm && (
        <form
          onSubmit={handleCloseSubmit}
          className="rounded-xl bg-(--color-surface-container-low) p-6 space-y-5"
        >
          <div>
            <h3 className="text-label-lg font-semibold">Close round</h3>
            <p className="mt-1 text-body-sm text-(--color-on-surface-variant)">
              All unconverted iSAFE and SAFE holders will be converted to
              ordinary shares using the valuation you enter below. This action
              cannot be undone.
            </p>
          </div>

          {/* Signed term sheet preview */}
          {signedTermSheets.length > 0 && (
            <div className="rounded-lg bg-(--color-success)/8 px-4 py-3 space-y-1.5">
              <p className="text-label-sm font-medium text-(--color-success)">
                {signedTermSheets.length} signed term sheet{signedTermSheets.length !== 1 ? "s" : ""} will be promoted to the cap table
              </p>
              <ul className="space-y-0.5">
                {signedTermSheets.map((ts, i) => (
                  <li key={i} className="text-body-sm text-(--color-on-surface-variant) flex items-center justify-between">
                    <span>{ts.firm ? `${ts.investor_name} (${ts.firm})` : ts.investor_name}</span>
                    <span className="tabular-nums">{sarFromTerms(ts) > 0 ? fmtSAR(sarFromTerms(ts)) : ts.instrument_type.toUpperCase()}</span>
                  </li>
                ))}
              </ul>
              {totalSignedSar > 0 && (
                <p className="text-label-sm text-(--color-success) font-medium pt-1 border-t border-(--color-success)/20">
                  Total: {fmtSAR(totalSignedSar)}
                </p>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-label-lg" htmlFor="pre_money_valuation_sar">
                Pre-money valuation (SAR) <span className="text-(--color-error)">*</span>
              </label>
              <input
                id="pre_money_valuation_sar"
                name="pre_money_valuation_sar"
                type="number"
                min="1"
                step="1"
                required
                placeholder="e.g. 5000000"
                className="w-full rounded-lg bg-(--color-surface-container-high) px-4 py-2.5 text-body-md ghost-border focus:outline-none focus:ring-2 focus:ring-(--color-primary)/40"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-label-lg" htmlFor="fd_shares_pre_round">
                Fully diluted shares pre-round <span className="text-(--color-error)">*</span>
              </label>
              <input
                id="fd_shares_pre_round"
                name="fd_shares_pre_round"
                type="number"
                min="1"
                step="1"
                required
                placeholder="e.g. 1000000"
                className="w-full rounded-lg bg-(--color-surface-container-high) px-4 py-2.5 text-body-md ghost-border focus:outline-none focus:ring-2 focus:ring-(--color-primary)/40"
              />
              <p className="text-body-sm text-(--color-on-surface-variant)">
                Total existing ordinary + ESOP pool, before this round.
                Check the dilution modeler for this number.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-label-lg" htmlFor="actual_raise_sar">
                Actual raise (SAR)
              </label>
              <input
                id="actual_raise_sar"
                name="actual_raise_sar"
                type="number"
                min="0"
                step="1"
                placeholder="e.g. 1800000"
                defaultValue={totalSignedSar > 0 ? String(Math.round(totalSignedSar)) : undefined}
                className="w-full rounded-lg bg-(--color-surface-container-high) px-4 py-2.5 text-body-md ghost-border focus:outline-none focus:ring-2 focus:ring-(--color-primary)/40"
              />
              {totalSignedSar > 0 && (
                <p className="text-body-sm text-(--color-on-surface-variant)">
                  Pre-filled from signed term sheets. Edit if needed.
                </p>
              )}
            </div>
          </div>

          {error && (
            <p className="rounded-lg bg-(--color-error)/10 px-4 py-3 text-body-sm text-(--color-error)">
              {error}
            </p>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isPending}
              className="rounded-lg bg-(--color-success)/15 px-5 py-2.5 text-label-lg text-(--color-success) hover:bg-(--color-success)/25 transition-colors disabled:opacity-50"
            >
              {isPending ? "Closing…" : "Confirm close"}
            </button>
            <button
              type="button"
              onClick={() => setShowCloseForm(false)}
              className="rounded-lg px-5 py-2.5 text-label-lg text-(--color-on-surface-variant) hover:bg-(--color-surface-container-high) transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {error && !showCloseForm && (
        <p className="rounded-lg bg-(--color-error)/10 px-4 py-3 text-body-sm text-(--color-error)">
          {error}
        </p>
      )}
    </section>
  );
}
