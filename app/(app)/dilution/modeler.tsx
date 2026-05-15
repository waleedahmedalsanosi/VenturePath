"use client";

import { useMemo, useState } from "react";

import { Dec } from "@/lib/cap-table/decimal";
import {
  modelDilution,
  type DilutionInput,
  type DilutionOutcome,
} from "@/lib/cap-table/dilution";

export type ExistingHolder =
  | {
      id: string;
      name: string;
      kind: "ordinary";
      shares: string;
    }
  | {
      id: string;
      name: string;
      kind: "convertible";
      investment_sar: string;
      valuation_cap_sar: string;
    };

const inputClass =
  "block w-full rounded-sm bg-(--color-surface-container-high) ghost-border px-3 py-2 focus:outline-none focus:border-(--color-primary) tabular-nums";

export function Modeler({ existing }: { existing: ExistingHolder[] }) {
  const [preMoney, setPreMoney] = useState("10000000");
  const [includeNew, setIncludeNew] = useState(true);
  const [newName, setNewName] = useState("New investor");
  const [newInvestment, setNewInvestment] = useState("1000000");
  const [newCap, setNewCap] = useState("8000000");

  const result = useMemo<DilutionOutcome | { error: string } | null>(() => {
    if (existing.length === 0) return null;
    let preMoneyDec: InstanceType<typeof Dec>;
    try {
      preMoneyDec = new Dec(preMoney);
      if (preMoneyDec.lte(0)) throw new Error("must be > 0");
    } catch {
      return { error: "Pre-money valuation must be > 0." };
    }

    const inputs: DilutionInput[] = existing.map((h) => {
      if (h.kind === "ordinary") {
        return {
          id: h.id,
          name: h.name,
          kind: "ordinary",
          shares: new Dec(h.shares),
        };
      }
      return {
        id: h.id,
        name: h.name,
        kind: "convertible",
        investment_sar: new Dec(h.investment_sar),
        valuation_cap_sar: new Dec(h.valuation_cap_sar),
      };
    });

    let hypo:
      | { name: string; investment_sar: InstanceType<typeof Dec>; valuation_cap_sar: InstanceType<typeof Dec> }
      | undefined;
    if (includeNew) {
      try {
        const inv = new Dec(newInvestment);
        const cap = new Dec(newCap);
        if (inv.lte(0) || cap.lte(0)) throw new Error("must be > 0");
        hypo = { name: newName || "New investor", investment_sar: inv, valuation_cap_sar: cap };
      } catch {
        return { error: "New investor amounts must be positive numbers." };
      }
    }

    try {
      return modelDilution(inputs, {
        pre_money_valuation_sar: preMoneyDec,
        fd_shares_pre_round: new Dec(1), // recomputed inside
      }, hypo);
    } catch (e) {
      return { error: (e as Error).message };
    }
  }, [existing, preMoney, includeNew, newName, newInvestment, newCap]);

  const hasOrdinary = existing.some((h) => h.kind === "ordinary");

  if (!hasOrdinary) {
    return (
      <div className="rounded-xl bg-(--color-surface-container-low) p-12 text-center">
        <p className="text-body-md text-(--color-on-surface-variant)">
          Add at least one Ordinary shareholder on the Cap Table before
          modeling dilution.
        </p>
      </div>
    );
  }

  return (
    <>
      <section className="rounded-xl bg-(--color-surface-container-low) p-6 space-y-4">
        <h2 className="text-label-md uppercase text-(--color-on-surface-variant)">
          Round terms
        </h2>
        <label className="block max-w-sm">
          <span className="text-label-md uppercase text-(--color-on-surface-variant)">
            Pre-money valuation (SAR)
          </span>
          <input
            value={preMoney}
            onChange={(e) => setPreMoney(e.target.value)}
            type="text"
            inputMode="decimal"
            className={inputClass}
          />
        </label>
      </section>

      <section className="rounded-xl bg-(--color-surface-container-low) p-6 space-y-4">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={includeNew}
            onChange={(e) => setIncludeNew(e.target.checked)}
            className="h-4 w-4 accent-(--color-primary)"
          />
          <span className="text-label-lg font-medium">
            Include a hypothetical new investment
          </span>
        </label>

        {includeNew && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <label className="block">
              <span className="text-label-md uppercase text-(--color-on-surface-variant)">
                Investor name
              </span>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                type="text"
                className={inputClass}
              />
            </label>
            <label className="block">
              <span className="text-label-md uppercase text-(--color-on-surface-variant)">
                Investment (SAR)
              </span>
              <input
                value={newInvestment}
                onChange={(e) => setNewInvestment(e.target.value)}
                type="text"
                inputMode="decimal"
                className={inputClass}
              />
            </label>
            <label className="block">
              <span className="text-label-md uppercase text-(--color-on-surface-variant)">
                Valuation cap (SAR)
              </span>
              <input
                value={newCap}
                onChange={(e) => setNewCap(e.target.value)}
                type="text"
                inputMode="decimal"
                className={inputClass}
              />
            </label>
          </div>
        )}
      </section>

      <section className="rounded-xl bg-(--color-surface-container-low) p-6">
        <h2 className="text-label-md uppercase text-(--color-on-surface-variant) mb-4">
          Post-conversion ownership
        </h2>

        {result && "error" in result ? (
          <p className="text-body-sm text-(--color-error)">{result.error}</p>
        ) : result ? (
          <>
            <p className="text-body-sm text-(--color-on-surface-variant) mb-3">
              Round price: SAR{" "}
              <span className="tabular-nums">{result.round_price_sar.toFixed(4)}</span>{" "}
              per share. Post-conversion shares total{" "}
              <span className="tabular-nums">
                {result.total_shares.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
              </span>
              .
            </p>
            <table className="w-full text-body-sm">
              <thead>
                <tr className="text-label-md uppercase text-(--color-on-surface-variant)">
                  <th className="px-4 py-3 text-start font-normal">Holder</th>
                  <th className="px-4 py-3 text-start font-normal">Source</th>
                  <th className="px-4 py-3 text-end font-normal">Shares</th>
                  <th className="px-4 py-3 text-end font-normal">Ownership</th>
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
                      {r.label}
                    </td>
                    <td className="px-4 py-3 text-end tabular-nums">
                      {r.shares.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                    </td>
                    <td className="px-4 py-3 text-end tabular-nums">
                      {r.ownership_pct.toFixed(2)}%
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
