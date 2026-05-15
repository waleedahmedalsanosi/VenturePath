/**
 * Valuation methodologies — Revenue Multiple, Scorecard, Berkus, DCF.
 * Each function takes typed inputs and returns Low/Mid/High in SAR.
 *
 * All math via decimal.js. Inputs are NEVER trusted to be numbers — strings
 * are parsed and validated at the boundary. These functions assume valid
 * already-parsed Decimal inputs.
 */

import { Dec, ZERO } from "@/lib/cap-table/decimal";

export interface ValuationRange {
  low_sar: InstanceType<typeof Dec>;
  mid_sar: InstanceType<typeof Dec>;
  high_sar: InstanceType<typeof Dec>;
  notes: string[];  // brief explanation per assumption
}

// ============================================================================
// Revenue Multiple — for post-revenue startups
// ============================================================================

export interface RevenueMultipleInputs {
  arr_sar: InstanceType<typeof Dec>;
  yoy_growth_pct: InstanceType<typeof Dec>;  // 0-1000+
  gross_margin_pct: InstanceType<typeof Dec>;  // 0-100
  multiple_min: InstanceType<typeof Dec>;  // e.g. 4
  multiple_mid: InstanceType<typeof Dec>;  // e.g. 8
  multiple_max: InstanceType<typeof Dec>;  // e.g. 14
}

export function revenueMultiple(i: RevenueMultipleInputs): ValuationRange {
  // Simple model: ARR × multiple. Growth and margin influence which point in
  // the multiple range the company deserves, but we report the full Low/Mid/High
  // range for the user to see optionality.
  const low = i.arr_sar.mul(i.multiple_min);
  const mid = i.arr_sar.mul(i.multiple_mid);
  const high = i.arr_sar.mul(i.multiple_max);

  const notes: string[] = [
    `Low = ARR × ${i.multiple_min.toFixed(1)}× = ${low.toFixed(0)}`,
    `Mid = ARR × ${i.multiple_mid.toFixed(1)}× (recommended)`,
    `High = ARR × ${i.multiple_max.toFixed(1)}×`,
  ];
  if (i.yoy_growth_pct.gte(100)) {
    notes.push(`Triple-digit YoY growth (${i.yoy_growth_pct.toFixed(0)}%) supports the higher end.`);
  }
  if (i.gross_margin_pct.gte(70)) {
    notes.push(`Strong gross margin (${i.gross_margin_pct.toFixed(0)}%) supports a premium multiple.`);
  } else if (i.gross_margin_pct.lt(40)) {
    notes.push(`Gross margin below 40% — multiples typically compress.`);
  }

  return { low_sar: low, mid_sar: mid, high_sar: high, notes };
}

// ============================================================================
// Scorecard — for pre-revenue startups vs comparable median
// ============================================================================

export interface ScorecardInputs {
  team_score: InstanceType<typeof Dec>;  // 0-10
  market_size_score: InstanceType<typeof Dec>;  // 0-10
  product_stage_score: InstanceType<typeof Dec>;  // 0-10
  competition_score: InstanceType<typeof Dec>;  // 0-10
  comparable_median_sar: InstanceType<typeof Dec>;
}

// Standard Bill Payne scorecard weights, adapted to the PRD's 4 categories.
// We weight team highest, then market, then product, then competition.
const SCORECARD_WEIGHTS = {
  team: new Dec("0.35"),
  market: new Dec("0.30"),
  product: new Dec("0.20"),
  competition: new Dec("0.15"),
};
const SCORECARD_BASELINE = new Dec(5);

export function scorecard(i: ScorecardInputs): ValuationRange {
  // Each score is on a 0-10 scale. A score of 5 means "median", contributing 1.0×
  // to the adjustment. A score of 10 means "exceptional", contributing 2.0×.
  const factor = (s: InstanceType<typeof Dec>): InstanceType<typeof Dec> => s.div(SCORECARD_BASELINE);

  const adjustment = factor(i.team_score)
    .mul(SCORECARD_WEIGHTS.team)
    .plus(factor(i.market_size_score).mul(SCORECARD_WEIGHTS.market))
    .plus(factor(i.product_stage_score).mul(SCORECARD_WEIGHTS.product))
    .plus(factor(i.competition_score).mul(SCORECARD_WEIGHTS.competition));

  const mid = i.comparable_median_sar.mul(adjustment);
  // Low/High = ±25% around mid (rough comp dispersion).
  const low = mid.mul(new Dec("0.75"));
  const high = mid.mul(new Dec("1.25"));

  return {
    low_sar: low,
    mid_sar: mid,
    high_sar: high,
    notes: [
      `Adjustment factor: ${adjustment.toFixed(3)}× of comparable median (${i.comparable_median_sar.toFixed(0)})`,
      `Weights: Team 35%, Market 30%, Product 20%, Competition 15%`,
      `Low/High band: ±25% (typical comp dispersion)`,
    ],
  };
}

// ============================================================================
// Berkus — for pre-revenue, max ~SAR 10M
// ============================================================================

export interface BerkusInputs {
  /** Each driver score is 0 to driver_max_sar. */
  idea_sar: InstanceType<typeof Dec>;
  prototype_sar: InstanceType<typeof Dec>;
  team_sar: InstanceType<typeof Dec>;
  relationships_sar: InstanceType<typeof Dec>;
  rollout_sar: InstanceType<typeof Dec>;
  /** Per-driver cap. Default 2M for the standard 5-driver Berkus. */
  driver_max_sar: InstanceType<typeof Dec>;
}

export function berkus(i: BerkusInputs): ValuationRange {
  // Cap each driver to driver_max, sum them.
  const clamped = (v: InstanceType<typeof Dec>) =>
    v.lt(ZERO) ? ZERO : v.gt(i.driver_max_sar) ? i.driver_max_sar : v;

  const mid = clamped(i.idea_sar)
    .plus(clamped(i.prototype_sar))
    .plus(clamped(i.team_sar))
    .plus(clamped(i.relationships_sar))
    .plus(clamped(i.rollout_sar));

  // Berkus is opinionated, so the "range" is tighter: ±15%.
  const low = mid.mul(new Dec("0.85"));
  const high = mid.mul(new Dec("1.15"));

  return {
    low_sar: low,
    mid_sar: mid,
    high_sar: high,
    notes: [
      `Sum of 5 drivers, each capped at ${i.driver_max_sar.toFixed(0)} SAR`,
      `Idea / Prototype / Team / Relationships / Rollout`,
      `Berkus is a pre-revenue method — caps at roughly ${i.driver_max_sar.mul(5).toFixed(0)} SAR`,
    ],
  };
}

// ============================================================================
// DCF — Discounted Cash Flow, for growth-stage companies
// ============================================================================

export interface DcfInputs {
  /** Projected revenues for years 1-5 in SAR. */
  revenues_sar: [
    InstanceType<typeof Dec>,
    InstanceType<typeof Dec>,
    InstanceType<typeof Dec>,
    InstanceType<typeof Dec>,
    InstanceType<typeof Dec>,
  ];
  /** EBITDA margin trajectory year 1-5 as percentages (e.g. 0, 5, 10, 15, 20). */
  ebitda_margin_pcts: [
    InstanceType<typeof Dec>,
    InstanceType<typeof Dec>,
    InstanceType<typeof Dec>,
    InstanceType<typeof Dec>,
    InstanceType<typeof Dec>,
  ];
  /** Discount rate as a percentage (e.g. 25 = 25%). */
  discount_rate_pct: InstanceType<typeof Dec>;
  /** Terminal multiple applied to year-5 EBITDA. */
  terminal_multiple: InstanceType<typeof Dec>;
}

export function dcf(i: DcfInputs): ValuationRange {
  const discountRate = i.discount_rate_pct.div(100);
  const onePlusR = new Dec(1).plus(discountRate);

  // Sum of discounted EBITDA per year.
  let pvSum = ZERO;
  for (let year = 0; year < 5; year++) {
    const rev = i.revenues_sar[year]!;
    const marginPct = i.ebitda_margin_pcts[year]!;
    const ebitda = rev.mul(marginPct.div(100));
    // discount factor = 1 / (1+r)^(year+1)
    const power = onePlusR.pow(year + 1);
    pvSum = pvSum.plus(ebitda.div(power));
  }

  // Terminal value: year-5 EBITDA × terminal multiple, discounted to today.
  const year5Ebitda = i.revenues_sar[4]!.mul(i.ebitda_margin_pcts[4]!.div(100));
  const terminalValue = year5Ebitda.mul(i.terminal_multiple);
  const terminalPv = terminalValue.div(onePlusR.pow(5));

  const mid = pvSum.plus(terminalPv);
  // Sensitivity: ±20% to reflect discount-rate uncertainty.
  const low = mid.mul(new Dec("0.80"));
  const high = mid.mul(new Dec("1.20"));

  return {
    low_sar: low,
    mid_sar: mid,
    high_sar: high,
    notes: [
      `5-year DCF + terminal value (year-5 EBITDA × ${i.terminal_multiple.toFixed(1)}× multiple)`,
      `Discount rate ${i.discount_rate_pct.toFixed(1)}%`,
      `PV of operating cash flows: ${pvSum.toFixed(0)} SAR`,
      `PV of terminal value: ${terminalPv.toFixed(0)} SAR`,
      `Low/High: ±20% sensitivity band`,
    ],
  };
}
