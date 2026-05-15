/**
 * Ownership computations for the cap table overview.
 *
 * Prototype scope: only Ordinary Share holders contribute to ownership
 * percentages. iSAFE holders appear in the cap table as "Unconverted"
 * until a priced round triggers conversion (then iSAFE math in
 * `./isafe-math.ts` produces share counts that join the totals).
 */

import { Dec, fromJSON, ZERO } from "./decimal";
import { ISafeMathError } from "./isafe-math";

import type { Database } from "@/lib/supabase/types";

type ShareholderRow = Database["public"]["Tables"]["shareholders"]["Row"];

export interface OrdinaryInstrumentData {
  shares: string;
  price_per_share_sar: string;
}

export interface ISafeInstrumentData {
  investment_sar: string;
  valuation_cap_sar: string;
  profit_share_ratio: string;
  conversion_status: "unconverted" | "converted";
  conversion_date?: string;
}

export interface CapTableSummary {
  /** Sum of all Ordinary share counts (Decimal). */
  total_ordinary_shares: InstanceType<typeof Dec>;
  /** Count of unconverted iSAFEs. */
  isafe_count: number;
  /** Sum of all iSAFE investments in SAR. */
  total_isafe_investment_sar: InstanceType<typeof Dec>;
  /** Highest iSAFE valuation cap seen, or zero if none. */
  highest_isafe_cap_sar: InstanceType<typeof Dec>;
}

export interface ShareholderWithOwnership {
  row: ShareholderRow;
  /** Decimal percentage [0, 100] for Ordinary; null for iSAFE (unconverted). */
  ownership_pct: InstanceType<typeof Dec> | null;
}

/** Compute summary KPI numbers from a list of shareholders. */
export function summarize(rows: ShareholderRow[]): CapTableSummary {
  let totalOrdinary = ZERO;
  let isafeCount = 0;
  let totalIsafeInvestment = ZERO;
  let highestCap = ZERO;

  for (const row of rows) {
    if (row.instrument_type === "ordinary") {
      const data = row.instrument_data as unknown as OrdinaryInstrumentData;
      const shares = fromJSON(data.shares);
      if (!shares) {
        throw new ISafeMathError(
          `Ordinary row ${row.id} missing 'shares' in instrument_data`,
        );
      }
      totalOrdinary = totalOrdinary.plus(shares);
    } else if (row.instrument_type === "isafe") {
      const data = row.instrument_data as unknown as ISafeInstrumentData;
      if (data.conversion_status === "unconverted") {
        isafeCount += 1;
        const investment = fromJSON(data.investment_sar);
        const cap = fromJSON(data.valuation_cap_sar);
        if (investment) totalIsafeInvestment = totalIsafeInvestment.plus(investment);
        if (cap && cap.gt(highestCap)) highestCap = cap;
      }
      // Converted iSAFEs would surface as ordinary-equivalent share counts
      // by the conversion service (out of prototype scope).
    }
  }

  return {
    total_ordinary_shares: totalOrdinary,
    isafe_count: isafeCount,
    total_isafe_investment_sar: totalIsafeInvestment,
    highest_isafe_cap_sar: highestCap,
  };
}

/** Compute ownership percentage for each shareholder. */
export function withOwnership(
  rows: ShareholderRow[],
): ShareholderWithOwnership[] {
  const { total_ordinary_shares } = summarize(rows);

  return rows.map((row) => {
    if (row.instrument_type !== "ordinary" || total_ordinary_shares.eq(ZERO)) {
      return { row, ownership_pct: null };
    }
    const data = row.instrument_data as unknown as OrdinaryInstrumentData;
    const shares = fromJSON(data.shares);
    if (!shares) return { row, ownership_pct: null };
    const pct = shares.div(total_ordinary_shares).mul(100);
    return { row, ownership_pct: pct };
  });
}
