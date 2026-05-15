/**
 * Waterfall analysis — exit-value distribution to shareholders.
 *
 * Model assumptions (prototype simplification):
 * - 1× non-participating liquidation preference on convertibles. Each
 *   unconverted SAFE/iSAFE/Convertible Note holder elects the higher of:
 *     (a) 1× their investment (cash preference), or
 *     (b) their as-converted ownership share of the post-debt residual.
 * - Liquidation preference is paid in cash from the residual; if (a) is
 *   chosen, that investor's "ownership share" is removed from the
 *   ordinary distribution pool.
 * - Non-convertible debt paid first. Result: residual = exit - debt.
 * - For Acquisition: cash + stock components are paid from the
 *   gross_proceeds (post-debt).
 *
 * Full PRD specifies waterfall in much more detail (participating prefs,
 * caps, multiple seniority classes). Deferred. The 1× non-participating
 * model is the YC SAFE default and good enough to compare scenarios.
 */

import { Dec, ZERO, HUNDRED } from "./decimal";

export type ExitType = "acquisition" | "ipo" | "secondary" | "buyout" | "merger";

export interface OrdinaryHolder {
  id: string;
  name: string;
  kind: "ordinary";
  shares: InstanceType<typeof Dec>;
}

export interface ConvertibleHolder {
  id: string;
  name: string;
  kind: "convertible";
  /** Original investment in SAR. Used as the 1× preference. */
  investment_sar: InstanceType<typeof Dec>;
  /** Valuation cap — used to derive as-converted share count. */
  valuation_cap_sar: InstanceType<typeof Dec>;
}

export type WaterfallHolder = OrdinaryHolder | ConvertibleHolder;

export interface WaterfallInput {
  exit_value_sar: InstanceType<typeof Dec>;
  non_convertible_debt_sar: InstanceType<typeof Dec>;
  exit_type: ExitType;
  holders: WaterfallHolder[];
}

export interface WaterfallRow {
  id: string;
  name: string;
  kind: "ordinary" | "convertible";
  /** What this holder will receive in SAR. */
  payout_sar: InstanceType<typeof Dec>;
  /** Multiple of original investment (convertibles) or per-share value (ordinary). */
  return_multiple: InstanceType<typeof Dec> | null;
  /** Which path was selected for convertibles: "preference" or "as_converted". */
  path?: "preference" | "as_converted";
}

export interface WaterfallOutcome {
  rows: WaterfallRow[];
  total_distributed_sar: InstanceType<typeof Dec>;
  total_undistributed_sar: InstanceType<typeof Dec>;
  /** Residual after debt is paid, before any holder distribution. */
  residual_after_debt_sar: InstanceType<typeof Dec>;
}

/**
 * Run the waterfall.
 *
 * Algorithm:
 * 1. residual = max(exit - debt, 0)
 * 2. Compute as-converted share counts for each convertible using
 *    cap-implied price at pre-round shares (just like dilution.ts).
 * 3. For each convertible: payout_if_preferred = min(investment, residual_share)
 *    where residual_share is uncapped (can be all-of-residual if it eats it).
 *    Compare to as_converted_share = ownership × residual_after_other_prefs.
 *    Take the larger.
 * 4. Sum chosen preference payouts. Subtract from residual.
 * 5. Distribute remaining residual pro-rata among ordinary holders and
 *    convertibles that chose as-converted path, weighted by their share count.
 */
export function runWaterfall(input: WaterfallInput): WaterfallOutcome {
  const residualAfterDebt = input.exit_value_sar.minus(input.non_convertible_debt_sar);
  const residual = residualAfterDebt.lt(ZERO) ? ZERO : residualAfterDebt;

  // Pre-round ordinary shares — denominator for cap-implied conversion.
  let ordinaryShares = ZERO;
  for (const h of input.holders) {
    if (h.kind === "ordinary") ordinaryShares = ordinaryShares.plus(h.shares);
  }

  // Compute as-converted share count for each convertible (cap-implied at
  // pre-round ordinary share count). If ordinaryShares is zero, treat each
  // convertible as taking preference only.
  const convertedShares: Record<string, InstanceType<typeof Dec>> = {};
  if (ordinaryShares.gt(ZERO)) {
    for (const h of input.holders) {
      if (h.kind !== "convertible") continue;
      // shares = investment / (cap / ordinaryShares) = investment × ordinaryShares / cap
      if (h.valuation_cap_sar.eq(ZERO)) {
        convertedShares[h.id] = ZERO;
      } else {
        convertedShares[h.id] = h.investment_sar
          .mul(ordinaryShares)
          .div(h.valuation_cap_sar);
      }
    }
  }

  // For each convertible, decide preference vs as-converted by simulating:
  //   if all OTHER convertibles took as-converted, what would this one get?
  // Then pick max(preference, as_converted) for each.
  //
  // Simplified: don't model strategic ordering. Each convertible picks
  // independently the path that pays them more, assuming pro-rata for the rest.

  const totalShares = ordinaryShares.plus(
    Object.values(convertedShares).reduce((a, b) => a.plus(b), ZERO),
  );

  let preferredPool = ZERO;
  const decisions: Record<string, "preference" | "as_converted"> = {};

  for (const h of input.holders) {
    if (h.kind !== "convertible") continue;
    const asConverted = totalShares.eq(ZERO)
      ? ZERO
      : convertedShares[h.id]!.div(totalShares).mul(residual);
    if (h.investment_sar.gt(asConverted)) {
      decisions[h.id] = "preference";
      preferredPool = preferredPool.plus(h.investment_sar);
    } else {
      decisions[h.id] = "as_converted";
    }
  }

  // If preferences exceed residual, scale them down proportionally.
  const preferenceScalar =
    preferredPool.gt(residual) && preferredPool.gt(ZERO)
      ? residual.div(preferredPool)
      : new Dec(1);

  // Actual preference payout per holder.
  const payoutPreference: Record<string, InstanceType<typeof Dec>> = {};
  for (const [id, decision] of Object.entries(decisions)) {
    if (decision === "preference") {
      const holder = input.holders.find((h) => h.id === id)! as ConvertibleHolder;
      payoutPreference[id] = holder.investment_sar.mul(preferenceScalar);
    }
  }

  const totalPreferenceDistributed = Object.values(payoutPreference).reduce(
    (a, b) => a.plus(b),
    ZERO,
  );

  // Remaining residual for pro-rata distribution to ordinary + as-converted
  // convertibles.
  const remaining = residual.minus(totalPreferenceDistributed);

  // Shares participating in pro-rata.
  let proRataShares = ordinaryShares;
  for (const h of input.holders) {
    if (h.kind === "convertible" && decisions[h.id] === "as_converted") {
      proRataShares = proRataShares.plus(convertedShares[h.id]!);
    }
  }

  // Build the output rows.
  const rows: WaterfallRow[] = [];
  for (const h of input.holders) {
    if (h.kind === "ordinary") {
      const payout = proRataShares.eq(ZERO)
        ? ZERO
        : h.shares.div(proRataShares).mul(remaining);
      rows.push({
        id: h.id,
        name: h.name,
        kind: "ordinary",
        payout_sar: payout,
        return_multiple: h.shares.eq(ZERO) ? null : payout.div(h.shares),
      });
    } else {
      const decision = decisions[h.id] ?? "as_converted";
      const payout =
        decision === "preference"
          ? payoutPreference[h.id]!
          : proRataShares.eq(ZERO)
            ? ZERO
            : convertedShares[h.id]!.div(proRataShares).mul(remaining);
      const multiple = h.investment_sar.eq(ZERO)
        ? null
        : payout.div(h.investment_sar);
      rows.push({
        id: h.id,
        name: h.name,
        kind: "convertible",
        payout_sar: payout,
        return_multiple: multiple,
        path: decision,
      });
    }
  }

  const totalDistributed = rows.reduce((a, r) => a.plus(r.payout_sar), ZERO);
  const totalUndistributed = residual.minus(totalDistributed);

  return {
    rows,
    total_distributed_sar: totalDistributed,
    total_undistributed_sar: totalUndistributed.lt(ZERO) ? ZERO : totalUndistributed,
    residual_after_debt_sar: residual,
  };
}

export const EXIT_TYPE_LABELS: Record<ExitType, string> = {
  acquisition: "Acquisition (M&A)",
  ipo: "IPO",
  secondary: "Secondary sale",
  buyout: "Buyout",
  merger: "Merger",
};
