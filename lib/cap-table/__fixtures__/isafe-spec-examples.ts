/**
 * Worked iSAFE conversion examples.
 *
 * Each fixture is a hand-verified scenario that the implementation must match
 * exactly. When the legal review provides a different authoritative spec, REPLACE
 * these fixtures with the spec's worked examples and update the math module to
 * match.
 *
 * Format: input terms → expected output.
 * Units: SAR for money, dimensionless decimal for shares.
 */

import { Dec } from "../decimal";
import type { ConversionResult, ISafeTerms, RoundTerms } from "../isafe-math";

export interface WorkedExample {
  name: string;
  notes: string;
  terms: ISafeTerms;
  round: RoundTerms;
  expected: ConversionResult;
}

export const WORKED_EXAMPLES: WorkedExample[] = [
  {
    name: "cap-binds-typical-seed",
    notes:
      "Standard early-stage iSAFE — cap is set well below the next round's valuation, so the cap-implied price binds.",
    terms: {
      investment_sar: new Dec("500000"),
      valuation_cap_sar: new Dec("5000000"),
      profit_share_ratio: new Dec("20"),
    },
    round: {
      pre_money_valuation_sar: new Dec("10000000"),
      fd_shares_pre_round: new Dec("1000000"),
    },
    expected: {
      // round_price = 10M / 1M = 10 SAR/share
      // cap_implied_price = 5M / 1M = 5 SAR/share → binds
      // shares = 500K / 5 = 100,000
      shares: new Dec("100000"),
      conversion_price_sar: new Dec("5"),
      binding: "cap",
    },
  },
  {
    name: "round-binds-high-cap",
    notes:
      "Investor was generous (high cap relative to next round). The round price is cheaper, so the round price binds.",
    terms: {
      investment_sar: new Dec("500000"),
      valuation_cap_sar: new Dec("20000000"),
      profit_share_ratio: new Dec("15"),
    },
    round: {
      pre_money_valuation_sar: new Dec("10000000"),
      fd_shares_pre_round: new Dec("1000000"),
    },
    expected: {
      // round_price = 10M / 1M = 10 → binds
      // cap_implied_price = 20M / 1M = 20
      // shares = 500K / 10 = 50,000
      shares: new Dec("50000"),
      conversion_price_sar: new Dec("10"),
      binding: "round",
    },
  },
  {
    name: "tied-prices",
    notes:
      "Cap exactly equals the next round's pre-money valuation. The two derived prices are identical.",
    terms: {
      investment_sar: new Dec("500000"),
      valuation_cap_sar: new Dec("10000000"),
      profit_share_ratio: new Dec("10"),
    },
    round: {
      pre_money_valuation_sar: new Dec("10000000"),
      fd_shares_pre_round: new Dec("1000000"),
    },
    expected: {
      // round_price = cap_implied = 10 → tied
      shares: new Dec("50000"),
      conversion_price_sar: new Dec("10"),
      binding: "tied",
    },
  },
  {
    name: "decimal-precision-thirds",
    notes:
      "Exercises decimal precision with non-terminating quotients. Without decimal arithmetic, 1/3-style numbers drift.",
    terms: {
      investment_sar: new Dec("333333.33"),
      valuation_cap_sar: new Dec("1000000"),
      profit_share_ratio: new Dec("0"),
    },
    round: {
      pre_money_valuation_sar: new Dec("2000000"),
      fd_shares_pre_round: new Dec("100000"),
    },
    expected: {
      // round_price = 2M / 100K = 20
      // cap_implied_price = 1M / 100K = 10 → binds
      // shares = 333333.33 / 10 = 33,333.333
      shares: new Dec("33333.333"),
      conversion_price_sar: new Dec("10"),
      binding: "cap",
    },
  },
  {
    name: "huge-numbers-series-a",
    notes:
      "Series A scale (100M SAR investment into a billion-SAR cap). Confirms no overflow in intermediate math.",
    terms: {
      investment_sar: new Dec("100000000"),
      valuation_cap_sar: new Dec("1000000000"),
      profit_share_ratio: new Dec("12.5"),
    },
    round: {
      pre_money_valuation_sar: new Dec("5000000000"),
      fd_shares_pre_round: new Dec("50000000"),
    },
    expected: {
      // round_price = 5B / 50M = 100
      // cap_implied_price = 1B / 50M = 20 → binds
      // shares = 100M / 20 = 5,000,000
      shares: new Dec("5000000"),
      conversion_price_sar: new Dec("20"),
      binding: "cap",
    },
  },
  {
    name: "small-pre-seed-cap-binds",
    notes:
      "Tiny pre-seed cheque (50K SAR) with a low cap. Confirms the math works at the smallest realistic scale.",
    terms: {
      investment_sar: new Dec("50000"),
      valuation_cap_sar: new Dec("500000"),
      profit_share_ratio: new Dec("25"),
    },
    round: {
      pre_money_valuation_sar: new Dec("750000"),
      fd_shares_pre_round: new Dec("100000"),
    },
    expected: {
      // round_price = 750K / 100K = 7.5
      // cap_implied_price = 500K / 100K = 5 → binds
      // shares = 50K / 5 = 10,000
      shares: new Dec("10000"),
      conversion_price_sar: new Dec("5"),
      binding: "cap",
    },
  },
  {
    name: "zero-profit-share-still-valid",
    notes:
      "profit_share_ratio of 0 is allowed (pure-equity iSAFE, no profit share). Should not affect conversion math.",
    terms: {
      investment_sar: new Dec("100000"),
      valuation_cap_sar: new Dec("2000000"),
      profit_share_ratio: new Dec("0"),
    },
    round: {
      pre_money_valuation_sar: new Dec("3000000"),
      fd_shares_pre_round: new Dec("500000"),
    },
    expected: {
      // round_price = 3M / 500K = 6
      // cap_implied_price = 2M / 500K = 4 → binds
      // shares = 100K / 4 = 25,000
      shares: new Dec("25000"),
      conversion_price_sar: new Dec("4"),
      binding: "cap",
    },
  },
  {
    name: "max-profit-share-100-percent",
    notes:
      "profit_share_ratio of 100% (max) is allowed. Same conversion math.",
    terms: {
      investment_sar: new Dec("250000"),
      valuation_cap_sar: new Dec("2500000"),
      profit_share_ratio: new Dec("100"),
    },
    round: {
      pre_money_valuation_sar: new Dec("4000000"),
      fd_shares_pre_round: new Dec("400000"),
    },
    expected: {
      // round_price = 4M / 400K = 10
      // cap_implied_price = 2.5M / 400K = 6.25 → binds
      // shares = 250K / 6.25 = 40,000
      shares: new Dec("40000"),
      conversion_price_sar: new Dec("6.25"),
      binding: "cap",
    },
  },
];
