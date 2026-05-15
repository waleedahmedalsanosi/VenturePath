/**
 * Conversion math for SAFE instruments at a priced round.
 *
 * iSAFE conversion lives in lib/cap-table/isafe-math.ts (Sharia-compliant).
 * This file handles standard SAFE and convertible note conversion.
 *
 * ⚠  LEGAL REVIEW REQUIRED before production use — same caveat as isafe-math.ts.
 */

import { Dec, ZERO } from "@/lib/cap-table/decimal";

export interface SafeConversionInput {
  investment_sar: string;
  valuation_cap_sar: string;
  discount_rate?: string;
  safe_type: "post_money" | "pre_money";
}

export interface ConversionResult {
  shares: string;
  conversion_price_sar: string;
  binding: "cap" | "round" | "discount" | "tied";
}

/**
 * Convert a SAFE (standard, non-iSAFE) at a priced round.
 *
 * For both pre-money and post-money SAFE, the conversion price is:
 *   cap_implied  = valuation_cap / fd_shares_pre_round
 *   round_price  = pre_money_valuation / fd_shares_pre_round
 *   discounted   = round_price * (1 - discount_rate/100)   [if discount exists]
 *
 *   conversion_price = min of applicable prices:
 *     - both cap and discount: min(cap_implied, discounted)
 *     - cap only:              min(cap_implied, round_price)
 *     - discount only:         discounted
 *     - neither:               round_price
 *
 *   shares = investment / conversion_price
 */
export function convertSafe(
  safe: SafeConversionInput,
  preMoneySar: string,
  fdSharesPreRound: string,
): ConversionResult {
  const investment = new Dec(safe.investment_sar);
  const cap = new Dec(safe.valuation_cap_sar);
  const preMoney = new Dec(preMoneySar);
  const fdShares = new Dec(fdSharesPreRound);

  if (fdShares.lte(ZERO)) throw new Error("fd_shares_pre_round must be > 0");
  if (preMoney.lte(ZERO)) throw new Error("pre_money_valuation_sar must be > 0");
  if (investment.lte(ZERO)) throw new Error("investment_sar must be > 0");

  const roundPrice = preMoney.div(fdShares);
  const capImplied = cap.gt(ZERO) ? cap.div(fdShares) : null;

  const discountRate = safe.discount_rate ? new Dec(safe.discount_rate) : null;
  const discountedPrice =
    discountRate && discountRate.gt(ZERO)
      ? roundPrice.mul(new Dec(1).minus(discountRate.div(100)))
      : null;

  let conversionPrice: InstanceType<typeof Dec>;
  let binding: ConversionResult["binding"];

  if (capImplied && discountedPrice) {
    if (capImplied.lte(discountedPrice)) {
      conversionPrice = capImplied;
      binding = "cap";
    } else {
      conversionPrice = discountedPrice;
      binding = "discount";
    }
  } else if (capImplied) {
    if (capImplied.lt(roundPrice)) {
      conversionPrice = capImplied;
      binding = "cap";
    } else if (capImplied.eq(roundPrice)) {
      conversionPrice = roundPrice;
      binding = "tied";
    } else {
      conversionPrice = roundPrice;
      binding = "round";
    }
  } else if (discountedPrice) {
    conversionPrice = discountedPrice;
    binding = "discount";
  } else {
    conversionPrice = roundPrice;
    binding = "round";
  }

  const shares = investment.div(conversionPrice);

  return {
    shares: shares.toFixed(6),
    conversion_price_sar: conversionPrice.toFixed(6),
    binding,
  };
}
