/**
 * iSAFE (Islamic SAFE) conversion math.
 *
 * ============================================================================
 * !!  LEGAL REVIEW REQUIRED BEFORE ANY PRODUCTION USE  !!
 * ============================================================================
 *
 * This module implements an inferred specification for Sharia-compliant SAFE
 * conversion. It has NOT been reviewed by a Saudi corporate lawyer. Before
 * any user touches this for a real fundraise, the assumptions in this file
 * MUST be validated against an authoritative iSAFE template — for example
 * 500 Global MENA's published iSAFE, Hala VC's iSAFE template, or a Saudi
 * law firm's adapted SAFE for Sharia compliance.
 *
 * ============================================================================
 * INFERRED SPECIFICATION (working assumptions)
 * ============================================================================
 *
 * An iSAFE is a Sharia-compliant variant of YC's SAFE. The key differences:
 *
 * 1. Discount rate is replaced by a profit-share-ratio.
 *    A SAFE discount is functionally identical to interest on prepaid equity
 *    (riba), which is forbidden under Sharia. The profit-share-ratio instead
 *    represents the investor's claim on profits (mudaraba/musharaka-style)
 *    and is tracked separately from conversion math — it affects dividend
 *    and exit waterfall calculations, not the conversion-to-shares step.
 *
 * 2. Conversion price at the next priced round is:
 *      conversion_price = min(round_price, valuation_cap / fd_shares_pre_round)
 *    Same as a SAFE with a valuation cap, no discount.
 *
 * 3. Shares issued at conversion:
 *      shares = investment / conversion_price
 *
 * 4. Profit-share-ratio is preserved on the cap table as metadata until exit,
 *    where it enters the waterfall (not implemented in this prototype).
 *
 * If the legal review finds the conversion math differs (e.g. some templates
 * impose a profit-share-derived cap discount), update this file and adjust
 * the worked-example fixtures.
 *
 * ============================================================================
 * UNITS
 * ============================================================================
 *
 * All amounts in SAR. Shares are dimensionless counts (decimal-safe, e.g.
 * an iSAFE may convert to a fractional share count and the cap table
 * rounds at the end per company policy).
 *
 * All math goes through `Decimal` from `./decimal.ts`. No JS Number arithmetic.
 */

import { Dec, ZERO, HUNDRED } from "./decimal";

/** Thrown when iSAFE inputs are mathematically invalid (e.g. zero investment). */
export class ISafeMathError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ISafeMathError";
  }
}

/** The terms of an iSAFE agreement as stored on the cap table. */
export interface ISafeTerms {
  /** SAR amount the investor paid. Must be > 0. */
  investment_sar: InstanceType<typeof Dec>;
  /** SAR pre-money valuation cap. Must be > 0. */
  valuation_cap_sar: InstanceType<typeof Dec>;
  /**
   * Profit-share ratio as a percentage [0, 100]. Stored for future waterfall
   * calculations; does NOT affect conversion math in this implementation.
   */
  profit_share_ratio: InstanceType<typeof Dec>;
}

/** The terms of the priced round at which the iSAFE converts. */
export interface RoundTerms {
  /**
   * Pre-money valuation of the priced round, in SAR.
   * Used to derive `round_price` together with `fd_shares_pre_round`.
   */
  pre_money_valuation_sar: InstanceType<typeof Dec>;
  /**
   * Fully diluted share count *before* this round (and before iSAFE conversion).
   * Includes existing equity, ESOP pool, prior SAFEs converting alongside this one
   * are NOT counted here — they are handled by the calling code if applicable.
   */
  fd_shares_pre_round: InstanceType<typeof Dec>;
}

/** Which side of the min() determined the conversion price. */
export type Binding = "cap" | "round" | "tied";

/** Output of a conversion calculation. */
export interface ConversionResult {
  /** Number of shares the iSAFE holder receives. */
  shares: InstanceType<typeof Dec>;
  /** SAR per share used for the conversion. */
  conversion_price_sar: InstanceType<typeof Dec>;
  /** Which input bound the conversion price. */
  binding: Binding;
}

/**
 * Validate iSAFE terms. Throws ISafeMathError with a specific message if any
 * field is mathematically invalid.
 */
export function validateTerms(terms: ISafeTerms): void {
  if (terms.investment_sar.lte(ZERO)) {
    throw new ISafeMathError(
      `investment_sar must be > 0 (got ${terms.investment_sar.toFixed()})`,
    );
  }
  if (terms.valuation_cap_sar.lte(ZERO)) {
    throw new ISafeMathError(
      `valuation_cap_sar must be > 0 (got ${terms.valuation_cap_sar.toFixed()})`,
    );
  }
  if (terms.profit_share_ratio.lt(ZERO) || terms.profit_share_ratio.gt(HUNDRED)) {
    throw new ISafeMathError(
      `profit_share_ratio must be in [0, 100] (got ${terms.profit_share_ratio.toFixed()})`,
    );
  }
}

/**
 * Validate priced-round terms. Throws ISafeMathError on invalid inputs.
 */
export function validateRound(round: RoundTerms): void {
  if (round.pre_money_valuation_sar.lte(ZERO)) {
    throw new ISafeMathError(
      `pre_money_valuation_sar must be > 0 (got ${round.pre_money_valuation_sar.toFixed()})`,
    );
  }
  if (round.fd_shares_pre_round.lte(ZERO)) {
    throw new ISafeMathError(
      `fd_shares_pre_round must be > 0 (got ${round.fd_shares_pre_round.toFixed()})`,
    );
  }
}

/**
 * Derived round price (SAR per share) implied by the priced round terms.
 *   round_price = pre_money_valuation / fd_shares_pre_round
 */
export function computeRoundPrice(round: RoundTerms): InstanceType<typeof Dec> {
  validateRound(round);
  return round.pre_money_valuation_sar.div(round.fd_shares_pre_round);
}

/**
 * Cap-implied price (SAR per share) for this iSAFE.
 *   cap_implied_price = valuation_cap_sar / fd_shares_pre_round
 */
export function computeCapImpliedPrice(
  terms: ISafeTerms,
  round: RoundTerms,
): InstanceType<typeof Dec> {
  validateTerms(terms);
  validateRound(round);
  return terms.valuation_cap_sar.div(round.fd_shares_pre_round);
}

/**
 * Compute the conversion of an iSAFE to common shares at a priced round.
 *
 * conversion_price = min(round_price, cap_implied_price)
 * shares = investment / conversion_price
 */
export function computeConversionShares(
  terms: ISafeTerms,
  round: RoundTerms,
): ConversionResult {
  validateTerms(terms);
  validateRound(round);

  const roundPrice = computeRoundPrice(round);
  const capImpliedPrice = computeCapImpliedPrice(terms, round);

  let conversionPrice: InstanceType<typeof Dec>;
  let binding: Binding;

  const cmp = capImpliedPrice.cmp(roundPrice);
  if (cmp < 0) {
    // cap_implied_price < round_price → cap is cheaper, cap binds
    conversionPrice = capImpliedPrice;
    binding = "cap";
  } else if (cmp > 0) {
    // round_price < cap_implied_price → round is cheaper, round binds
    conversionPrice = roundPrice;
    binding = "round";
  } else {
    // exactly equal — pick either, both yield the same shares
    conversionPrice = roundPrice;
    binding = "tied";
  }

  const shares = terms.investment_sar.div(conversionPrice);

  return {
    shares,
    conversion_price_sar: conversionPrice,
    binding,
  };
}
