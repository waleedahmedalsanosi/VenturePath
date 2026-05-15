"use client";

import { useMemo, useState } from "react";

import { Dec } from "@/lib/cap-table/decimal";
import { runWaterfall, type WaterfallHolder } from "@/lib/cap-table/waterfall";

export type AcqSeed = Array<
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

type DealType = "all_cash" | "cash_stock" | "stock_for_stock";
type EsopTreatment = "cash_out" | "accelerate" | "rollover";

const DEAL_TYPE_LABELS: Record<DealType, string> = {
  all_cash: "All Cash",
  cash_stock: "Cash + Stock Rollover",
  stock_for_stock: "Stock-for-Stock Merger",
};

const ESOP_TREATMENT_LABELS: Record<EsopTreatment, string> = {
  cash_out: "Cash out at strike",
  accelerate: "Accelerate vesting (100%)",
  rollover: "Rollover to acquirer options",
};

function fmtSAR(n: number | string): string {
  const v = typeof n === "string" ? Number(n) : n;
  if (!Number.isFinite(v)) return "SAR —";
  return `SAR ${v.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

function fmtDecSAR(d: InstanceType<typeof Dec>): string {
  return fmtSAR(Number(d.toFixed(0)));
}

function Tile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-md bg-(--color-surface-container-high) p-4">
      <p className="text-label-md uppercase text-(--color-on-surface-variant)">{label}</p>
      <p className="mt-2 text-headline-sm font-semibold tracking-tight tabular-nums">{value}</p>
      {sub && <p className="mt-1 text-body-sm text-(--color-on-surface-variant)">{sub}</p>}
    </div>
  );
}

export function AcquisitionModeler({
  seed,
  esopAllocated,
  esopVested,
  esopStrikeRef,
}: {
  seed: AcqSeed;
  esopAllocated: string;
  esopVested: string;
  esopStrikeRef: string | null;
}) {
  const [dealPrice, setDealPrice] = useState("100000000");
  const [cashPct, setCashPct] = useState("100");
  const [earnoutAmount, setEarnoutAmount] = useState("0");
  const [earnoutProb, setEarnoutProb] = useState("50");
  const [carveoutPct, setCarveoutPct] = useState("5");
  const [dealType, setDealType] = useState<DealType>("all_cash");
  const [esopTreatment, setEsopTreatment] = useState<EsopTreatment>("cash_out");
  const [debt, setDebt] = useState("0");

  const result = useMemo(() => {
    try {
      const priceDec = new Dec(dealPrice);
      const earnDec = new Dec(earnoutAmount || "0");
      const earnProbDec = new Dec(earnoutProb || "0").div(100);
      const cashPctDec = new Dec(cashPct || "100").div(100);
      const carveoutPctDec = new Dec(carveoutPct || "0").div(100);
      const debtDec = new Dec(debt || "0");

      if (
        priceDec.lt(0) ||
        cashPctDec.lt(0) ||
        cashPctDec.gt(1) ||
        carveoutPctDec.lt(0) ||
        carveoutPctDec.gte(1)
      ) {
        return { error: "Please enter valid numbers (price > 0, percentages 0-100)." };
      }

      // Effective deal value = base price + probability-weighted earn-out.
      const effectiveDeal = priceDec.plus(earnDec.mul(earnProbDec));

      // Cash component only goes through waterfall.
      const cashComponent = effectiveDeal.mul(cashPctDec);

      // Carve-out comes off the top (management + advisor incentives).
      const carveout = cashComponent.mul(carveoutPctDec);
      const distributable = cashComponent.minus(carveout).minus(debtDec);

      if (distributable.lte(0)) {
        return { error: "Distributable proceeds are zero or negative after debt and carve-out." };
      }

      if (seed.length === 0) return null;

      const holders: WaterfallHolder[] = seed.map((h) =>
        h.kind === "ordinary"
          ? { id: h.id, name: h.name, kind: "ordinary", shares: new Dec(h.shares) }
          : {
              id: h.id,
              name: h.name,
              kind: "convertible",
              investment_sar: new Dec(h.investment_sar),
              valuation_cap_sar: new Dec(h.valuation_cap_sar),
            },
      );

      const waterfall = runWaterfall({
        exit_value_sar: distributable,
        non_convertible_debt_sar: new Dec(0),
        exit_type: "acquisition",
        holders,
      });

      // ESOP payout (cash-out treatment).
      let esopPayout = new Dec(0);
      if (esopTreatment === "cash_out" && esopStrikeRef) {
        // Implied share price = distributable / total ordinary shares.
        const ordShares = seed
          .filter((h): h is Extract<AcqSeed[number], { kind: "ordinary" }> => h.kind === "ordinary")
          .reduce((acc, h) => acc.plus(new Dec(h.shares)), new Dec(0));
        if (ordShares.gt(0)) {
          const impliedPricePerShare = distributable.div(ordShares);
          const strikeRef = new Dec(esopStrikeRef);
          const intrinsic = impliedPricePerShare.minus(strikeRef);
          if (intrinsic.gt(0)) {
            esopPayout = intrinsic.mul(new Dec(esopVested));
          }
        }
      } else if (esopTreatment === "accelerate" && esopStrikeRef) {
        const ordShares = seed
          .filter((h): h is Extract<AcqSeed[number], { kind: "ordinary" }> => h.kind === "ordinary")
          .reduce((acc, h) => acc.plus(new Dec(h.shares)), new Dec(0));
        if (ordShares.gt(0)) {
          const impliedPricePerShare = distributable.div(ordShares);
          const strikeRef = new Dec(esopStrikeRef);
          const intrinsic = impliedPricePerShare.minus(strikeRef);
          if (intrinsic.gt(0)) {
            // Full pool (allocated), not just vested.
            esopPayout = intrinsic.mul(new Dec(esopAllocated));
          }
        }
      }

      return {
        effectiveDeal,
        cashComponent,
        carveout,
        debtDec,
        distributable,
        waterfall,
        esopPayout,
        stockComponent: effectiveDeal.minus(cashComponent),
      };
    } catch {
      return { error: "Enter valid numbers in all fields." };
    }
  }, [
    dealPrice, cashPct, earnoutAmount, earnoutProb, carveoutPct,
    dealType, esopTreatment, debt, seed, esopAllocated, esopVested, esopStrikeRef,
  ]);

  if (seed.length === 0) {
    return (
      <div className="rounded-xl bg-(--color-surface-container-low) p-12 text-center">
        <p className="text-body-md text-(--color-on-surface-variant)">
          Add shareholders on the Cap Table before modelling an acquisition.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Deal terms */}
      <section className="rounded-xl bg-(--color-surface-container-low) p-6 space-y-4">
        <h2 className="text-label-md uppercase text-(--color-on-surface-variant)">Deal terms</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="block">
            <span className="text-label-md uppercase text-(--color-on-surface-variant)">
              Deal type
            </span>
            <select
              value={dealType}
              onChange={(e) => {
                const v = e.target.value as DealType;
                setDealType(v);
                if (v === "all_cash") setCashPct("100");
                if (v === "stock_for_stock") setCashPct("0");
              }}
              className={inputClass}
            >
              {(Object.entries(DEAL_TYPE_LABELS) as [DealType, string][]).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-label-md uppercase text-(--color-on-surface-variant)">
              Acquisition price (SAR)
            </span>
            <input
              value={dealPrice}
              onChange={(e) => setDealPrice(e.target.value)}
              type="text"
              inputMode="decimal"
              className={inputClass}
            />
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <label className="block">
            <span className="text-label-md uppercase text-(--color-on-surface-variant)">
              Cash component (%)
            </span>
            <input
              value={cashPct}
              onChange={(e) => setCashPct(e.target.value)}
              type="text"
              inputMode="decimal"
              disabled={dealType === "all_cash" || dealType === "stock_for_stock"}
              className={`${inputClass} disabled:opacity-50`}
            />
          </label>
          <label className="block">
            <span className="text-label-md uppercase text-(--color-on-surface-variant)">
              Earn-out (SAR)
            </span>
            <input
              value={earnoutAmount}
              onChange={(e) => setEarnoutAmount(e.target.value)}
              type="text"
              inputMode="decimal"
              className={inputClass}
              placeholder="0"
            />
          </label>
          <label className="block">
            <span className="text-label-md uppercase text-(--color-on-surface-variant)">
              Earn-out probability (%)
            </span>
            <input
              value={earnoutProb}
              onChange={(e) => setEarnoutProb(e.target.value)}
              type="text"
              inputMode="decimal"
              className={inputClass}
              placeholder="50"
            />
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="block">
            <span className="text-label-md uppercase text-(--color-on-surface-variant)">
              Management carve-out (%)
            </span>
            <input
              value={carveoutPct}
              onChange={(e) => setCarveoutPct(e.target.value)}
              type="text"
              inputMode="decimal"
              className={inputClass}
              placeholder="5"
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
              placeholder="0"
            />
          </label>
        </div>

        <label className="block">
          <span className="text-label-md uppercase text-(--color-on-surface-variant)">
            ESOP treatment
          </span>
          <select
            value={esopTreatment}
            onChange={(e) => setEsopTreatment(e.target.value as EsopTreatment)}
            className={inputClass}
          >
            {(Object.entries(ESOP_TREATMENT_LABELS) as [EsopTreatment, string][]).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </label>
      </section>

      {/* Results */}
      {result && "error" in result ? (
        <p className="text-body-sm text-(--color-error)">{result.error}</p>
      ) : result ? (
        <>
          <section className="rounded-xl bg-(--color-surface-container-low) p-6 space-y-4">
            <h2 className="text-label-md uppercase text-(--color-on-surface-variant)">
              Deal summary
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Tile label="Effective deal value" value={fmtDecSAR(result.effectiveDeal)} sub="incl. prob-weighted earn-out" />
              <Tile label="Cash component" value={fmtDecSAR(result.cashComponent)} />
              <Tile label="Mgmt carve-out" value={fmtDecSAR(result.carveout)} />
              <Tile label="Distributable" value={fmtDecSAR(result.distributable)} sub="after debt + carve-out" />
            </div>
            {result.stockComponent.gt(0) && (
              <div className="rounded-md bg-(--color-warning)/10 px-4 py-3 text-body-sm text-(--color-warning)">
                SAR {Number(result.stockComponent.toFixed(0)).toLocaleString()} in acquirer stock — modelled separately; only cash distribution is shown below.
              </div>
            )}
          </section>

          <section className="rounded-xl bg-(--color-surface-container-low) p-6">
            <h2 className="text-label-md uppercase text-(--color-on-surface-variant) mb-4">
              Shareholder distribution
            </h2>
            <table className="w-full text-body-sm">
              <thead>
                <tr className="text-label-md uppercase text-(--color-on-surface-variant)">
                  <th className="px-4 py-3 text-start font-normal">Holder</th>
                  <th className="px-4 py-3 text-start font-normal">Type</th>
                  <th className="px-4 py-3 text-start font-normal">Path</th>
                  <th className="px-4 py-3 text-end font-normal">Payout</th>
                  <th className="px-4 py-3 text-end font-normal">Multiple</th>
                </tr>
              </thead>
              <tbody>
                {result.waterfall.rows.map((r) => (
                  <tr key={r.id} className="border-t border-(--color-outline-variant)/15">
                    <td className="px-4 py-3 font-medium">{r.name}</td>
                    <td className="px-4 py-3 text-(--color-on-surface-variant)">
                      {r.kind === "ordinary" ? "Ordinary" : "Convertible"}
                    </td>
                    <td className="px-4 py-3 text-(--color-on-surface-variant)">
                      {r.path === "preference" ? "1× preference" : r.kind === "convertible" ? "As-converted" : "—"}
                    </td>
                    <td className="px-4 py-3 text-end tabular-nums">{fmtDecSAR(r.payout_sar)}</td>
                    <td className="px-4 py-3 text-end tabular-nums text-(--color-on-surface-variant)">
                      {r.return_multiple ? `${r.return_multiple.toFixed(2)}×` : "—"}
                    </td>
                  </tr>
                ))}

                {(esopTreatment === "cash_out" || esopTreatment === "accelerate") &&
                  result.esopPayout.gt(0) && (
                    <tr className="border-t border-(--color-outline-variant)/15">
                      <td className="px-4 py-3 font-medium text-(--color-on-surface-variant)">
                        ESOP pool ({esopTreatment === "accelerate" ? "fully accelerated" : "vested options"})
                      </td>
                      <td className="px-4 py-3 text-(--color-on-surface-variant)">Options</td>
                      <td className="px-4 py-3 text-(--color-on-surface-variant)">Intrinsic value</td>
                      <td className="px-4 py-3 text-end tabular-nums">{fmtDecSAR(result.esopPayout)}</td>
                      <td className="px-4 py-3 text-end tabular-nums text-(--color-on-surface-variant)">—</td>
                    </tr>
                  )}
              </tbody>
            </table>
          </section>
        </>
      ) : null}
    </>
  );
}
