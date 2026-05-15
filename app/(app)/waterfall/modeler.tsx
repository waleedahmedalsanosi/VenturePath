"use client";

import { useMemo, useState } from "react";

import { Dec } from "@/lib/cap-table/decimal";
import {
  EXIT_TYPE_LABELS,
  runWaterfall,
  type ExitType,
  type WaterfallHolder,
  type WaterfallOutcome,
} from "@/lib/cap-table/waterfall";

export type WaterfallSeed = Array<
  | { id: string; name: string; kind: "ordinary"; shares: string }
  | {
      id: string;
      name: string;
      kind: "convertible";
      investment_sar: string;
      valuation_cap_sar: string;
    }
>;

const inputClass =
  "block w-full rounded-sm bg-(--color-surface-container-high) ghost-border px-3 py-2 focus:outline-none focus:border-(--color-primary) tabular-nums";

function fmtSAR(d: InstanceType<typeof Dec>): string {
  const n = Number(d.toFixed(0));
  return `SAR ${n.toLocaleString("en-US")}`;
}

export function WaterfallModeler({ seed }: { seed: WaterfallSeed }) {
  const [exitValue, setExitValue] = useState("50000000");
  const [debt, setDebt] = useState("0");
  const [exitType, setExitType] = useState<ExitType>("acquisition");

  const result = useMemo<WaterfallOutcome | { error: string } | null>(() => {
    if (seed.length === 0) return null;
    let exitDec: InstanceType<typeof Dec>;
    let debtDec: InstanceType<typeof Dec>;
    try {
      exitDec = new Dec(exitValue);
      debtDec = new Dec(debt);
      if (exitDec.lt(0) || debtDec.lt(0)) throw new Error("must be ≥ 0");
    } catch {
      return { error: "Exit value and debt must be non-negative numbers." };
    }

    const holders: WaterfallHolder[] = seed.map((h) =>
      h.kind === "ordinary"
        ? {
            id: h.id,
            name: h.name,
            kind: "ordinary",
            shares: new Dec(h.shares),
          }
        : {
            id: h.id,
            name: h.name,
            kind: "convertible",
            investment_sar: new Dec(h.investment_sar),
            valuation_cap_sar: new Dec(h.valuation_cap_sar),
          },
    );

    try {
      return runWaterfall({
        exit_value_sar: exitDec,
        non_convertible_debt_sar: debtDec,
        exit_type: exitType,
        holders,
      });
    } catch (e) {
      return { error: (e as Error).message };
    }
  }, [seed, exitValue, debt, exitType]);

  if (seed.length === 0) {
    return (
      <div className="rounded-xl bg-(--color-surface-container-low) p-12 text-center">
        <p className="text-body-md text-(--color-on-surface-variant)">
          Add shareholders on the Cap Table before running a waterfall.
        </p>
      </div>
    );
  }

  return (
    <>
      <section className="rounded-xl bg-(--color-surface-container-low) p-6 space-y-4">
        <h2 className="text-label-md uppercase text-(--color-on-surface-variant)">
          Exit terms
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <label className="block">
            <span className="text-label-md uppercase text-(--color-on-surface-variant)">
              Exit value (SAR)
            </span>
            <input
              value={exitValue}
              onChange={(e) => setExitValue(e.target.value)}
              type="text"
              inputMode="decimal"
              className={inputClass}
            />
          </label>
          <label className="block">
            <span className="text-label-md uppercase text-(--color-on-surface-variant)">
              Non-convertible debt (SAR)
            </span>
            <input
              value={debt}
              onChange={(e) => setDebt(e.target.value)}
              type="text"
              inputMode="decimal"
              className={inputClass}
            />
          </label>
          <label className="block">
            <span className="text-label-md uppercase text-(--color-on-surface-variant)">
              Exit type
            </span>
            <select
              value={exitType}
              onChange={(e) => setExitType(e.target.value as ExitType)}
              className={inputClass}
            >
              {(Object.entries(EXIT_TYPE_LABELS) as [ExitType, string][]).map(
                ([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ),
              )}
            </select>
          </label>
        </div>
      </section>

      <section className="rounded-xl bg-(--color-surface-container-low) p-6">
        <h2 className="text-label-md uppercase text-(--color-on-surface-variant) mb-4">
          Distribution
        </h2>
        {result && "error" in result ? (
          <p className="text-body-sm text-(--color-error)">{result.error}</p>
        ) : result ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              <Tile
                label="Residual after debt"
                value={fmtSAR(result.residual_after_debt_sar)}
              />
              <Tile
                label="Total distributed"
                value={fmtSAR(result.total_distributed_sar)}
              />
              <Tile
                label="Undistributed"
                value={fmtSAR(result.total_undistributed_sar)}
              />
            </div>

            <table className="w-full text-body-sm">
              <thead>
                <tr className="text-label-md uppercase text-(--color-on-surface-variant)">
                  <th className="px-4 py-3 text-start font-normal">Holder</th>
                  <th className="px-4 py-3 text-start font-normal">Source</th>
                  <th className="px-4 py-3 text-start font-normal">Path</th>
                  <th className="px-4 py-3 text-end font-normal">Payout</th>
                  <th className="px-4 py-3 text-end font-normal">Multiple</th>
                </tr>
              </thead>
              <tbody>
                {result.rows.map((r) => (
                  <tr
                    key={r.id}
                    className="border-t border-(--color-outline-variant)/15"
                  >
                    <td className="px-4 py-3 font-medium">{r.name}</td>
                    <td className="px-4 py-3 text-(--color-on-surface-variant)">
                      {r.kind === "ordinary" ? "Ordinary" : "Convertible"}
                    </td>
                    <td className="px-4 py-3 text-(--color-on-surface-variant)">
                      {r.path === "preference"
                        ? "1× preference"
                        : r.kind === "convertible"
                          ? "As-converted"
                          : "—"}
                    </td>
                    <td className="px-4 py-3 text-end tabular-nums">
                      {fmtSAR(r.payout_sar)}
                    </td>
                    <td className="px-4 py-3 text-end tabular-nums text-(--color-on-surface-variant)">
                      {r.return_multiple
                        ? `${r.return_multiple.toFixed(2)}×`
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        ) : null}
      </section>
    </>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-(--color-surface-container-high) p-4">
      <p className="text-label-md uppercase text-(--color-on-surface-variant)">
        {label}
      </p>
      <p className="mt-2 text-headline-sm font-semibold tracking-tight tabular-nums">
        {value}
      </p>
    </div>
  );
}
