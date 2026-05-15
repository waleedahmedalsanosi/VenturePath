/**
 * Dilution modeling — compute ownership changes when convertibles convert.
 *
 * Build directly on isafe-math.ts. The math is the same for SAFE and iSAFE
 * (cap-implied vs round-price, min wins). For prototype we treat all
 * convertibles uniformly: each instrument has a valuation_cap and
 * investment amount, and we model conversion at the same priced round.
 *
 * DEFERRED for production: discount-rate handling on SAFE (we ignore it
 * here so the math stays single-spec). Convertible note interest accrual.
 */

import { Dec, ZERO } from "./decimal";
import { computeConversionShares, type RoundTerms } from "./isafe-math";

/** A holder of either Ordinary Shares or an unconverted convertible. */
export interface DilutionInput {
  id: string;
  name: string;
  kind: "ordinary" | "convertible";
  /** For ordinary: shares count. For convertibles: undefined. */
  shares?: InstanceType<typeof Dec>;
  /** For convertibles: required. For ordinary: undefined. */
  investment_sar?: InstanceType<typeof Dec>;
  /** For convertibles: required. For ordinary: undefined. */
  valuation_cap_sar?: InstanceType<typeof Dec>;
}

export interface HypotheticalNew {
  name: string;
  investment_sar: InstanceType<typeof Dec>;
  valuation_cap_sar: InstanceType<typeof Dec>;
}

export interface DilutionOutcome {
  /** Final ownership table after conversion. Sums to 100. */
  rows: Array<{
    id: string;
    name: string;
    label: string;        // "Ordinary" or "iSAFE/SAFE Conv." or "New investor"
    shares: InstanceType<typeof Dec>;
    ownership_pct: InstanceType<typeof Dec>;
  }>;
  total_shares: InstanceType<typeof Dec>;
  round_price_sar: InstanceType<typeof Dec>;
}

/**
 * Run the dilution model.
 *
 * Algorithm:
 * 1. Start with total_ordinary_shares as the existing baseline.
 * 2. For each existing convertible, compute its conversion at the round
 *    terms using min(round_price, cap_implied_price).
 * 3. For the hypothetical new instrument, do the same.
 * 4. Sum new shares from conversions.
 * 5. Final % = each_holder_shares / total_after_conversion.
 *
 * Note on "fd_shares_pre_round": for iSAFE math, that field represents the
 * fully-diluted shares before this round. We use the current ordinary
 * share count as a simplification (no ESOP-in-the-pre-money modeling). This
 * matches the most common pre-money SAFE convention.
 */
export function modelDilution(
  existing: DilutionInput[],
  round: RoundTerms,
  hypothetical?: HypotheticalNew,
): DilutionOutcome {
  // Pre-round total ordinary shares.
  let preRoundShares = ZERO;
  for (const h of existing) {
    if (h.kind === "ordinary" && h.shares) {
      preRoundShares = preRoundShares.plus(h.shares);
    }
  }

  if (preRoundShares.lte(ZERO)) {
    throw new Error("Need at least one ordinary shareholder to model dilution.");
  }

  const roundTerms: RoundTerms = {
    pre_money_valuation_sar: round.pre_money_valuation_sar,
    fd_shares_pre_round: preRoundShares,
  };

  const rows: DilutionOutcome["rows"] = [];

  // Ordinary holders contribute their existing share counts.
  for (const h of existing) {
    if (h.kind === "ordinary" && h.shares) {
      rows.push({
        id: h.id,
        name: h.name,
        label: "Ordinary",
        shares: h.shares,
        ownership_pct: ZERO, // computed later
      });
    }
  }

  // Convert each existing convertible at the round.
  for (const h of existing) {
    if (h.kind !== "convertible" || !h.investment_sar || !h.valuation_cap_sar) continue;
    const result = computeConversionShares(
      {
        investment_sar: h.investment_sar,
        valuation_cap_sar: h.valuation_cap_sar,
        profit_share_ratio: ZERO,  // unused for share math
      },
      roundTerms,
    );
    rows.push({
      id: h.id,
      name: h.name,
      label: "Convertible (converted)",
      shares: result.shares,
      ownership_pct: ZERO,
    });
  }

  // Hypothetical new investor.
  if (hypothetical) {
    const result = computeConversionShares(
      {
        investment_sar: hypothetical.investment_sar,
        valuation_cap_sar: hypothetical.valuation_cap_sar,
        profit_share_ratio: ZERO,
      },
      roundTerms,
    );
    rows.push({
      id: "__new",
      name: hypothetical.name,
      label: "New investor",
      shares: result.shares,
      ownership_pct: ZERO,
    });
  }

  // Total post-conversion. Compute % for each row.
  let total = ZERO;
  for (const r of rows) total = total.plus(r.shares);
  for (const r of rows) {
    r.ownership_pct = total.eq(ZERO) ? ZERO : r.shares.div(total).mul(100);
  }

  const roundPrice = round.pre_money_valuation_sar.div(preRoundShares);

  return {
    rows,
    total_shares: total,
    round_price_sar: roundPrice,
  };
}
