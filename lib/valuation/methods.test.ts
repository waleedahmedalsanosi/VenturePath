import { describe, expect, it } from "vitest";

import { Dec } from "@/lib/cap-table/decimal";
import { berkus, dcf, revenueMultiple, scorecard } from "./methods";

describe("revenueMultiple", () => {
  it("multiplies ARR by min/mid/max multiples", () => {
    const r = revenueMultiple({
      arr_sar: new Dec("1000000"),
      yoy_growth_pct: new Dec("50"),
      gross_margin_pct: new Dec("70"),
      multiple_min: new Dec("4"),
      multiple_mid: new Dec("8"),
      multiple_max: new Dec("14"),
    });
    expect(r.low_sar.eq(4_000_000)).toBe(true);
    expect(r.mid_sar.eq(8_000_000)).toBe(true);
    expect(r.high_sar.eq(14_000_000)).toBe(true);
  });

  it("flags high growth as supporting premium multiple", () => {
    const r = revenueMultiple({
      arr_sar: new Dec("1000000"),
      yoy_growth_pct: new Dec("150"),
      gross_margin_pct: new Dec("70"),
      multiple_min: new Dec("4"),
      multiple_mid: new Dec("8"),
      multiple_max: new Dec("14"),
    });
    expect(r.notes.some((n) => n.includes("Triple-digit"))).toBe(true);
  });

  it("flags low gross margin as compressing multiples", () => {
    const r = revenueMultiple({
      arr_sar: new Dec("1000000"),
      yoy_growth_pct: new Dec("50"),
      gross_margin_pct: new Dec("30"),
      multiple_min: new Dec("4"),
      multiple_mid: new Dec("8"),
      multiple_max: new Dec("14"),
    });
    expect(r.notes.some((n) => n.includes("below 40%"))).toBe(true);
  });
});

describe("scorecard", () => {
  it("returns comparable median when all scores are 5 (median)", () => {
    const r = scorecard({
      team_score: new Dec("5"),
      market_size_score: new Dec("5"),
      product_stage_score: new Dec("5"),
      competition_score: new Dec("5"),
      comparable_median_sar: new Dec("5000000"),
    });
    expect(r.mid_sar.eq(5_000_000)).toBe(true);
  });

  it("scales up when scores exceed median", () => {
    const r = scorecard({
      team_score: new Dec("10"),
      market_size_score: new Dec("10"),
      product_stage_score: new Dec("10"),
      competition_score: new Dec("10"),
      comparable_median_sar: new Dec("5000000"),
    });
    // All scores = 2× → comparable × 2 = 10M
    expect(r.mid_sar.eq(10_000_000)).toBe(true);
  });

  it("scales down when scores are below median", () => {
    const r = scorecard({
      team_score: new Dec("2"),
      market_size_score: new Dec("2"),
      product_stage_score: new Dec("2"),
      competition_score: new Dec("2"),
      comparable_median_sar: new Dec("5000000"),
    });
    // All scores = 0.4× → comparable × 0.4 = 2M
    expect(r.mid_sar.eq(2_000_000)).toBe(true);
  });

  it("returns Low/High at ±25% of mid", () => {
    const r = scorecard({
      team_score: new Dec("5"),
      market_size_score: new Dec("5"),
      product_stage_score: new Dec("5"),
      competition_score: new Dec("5"),
      comparable_median_sar: new Dec("4000000"),
    });
    expect(r.low_sar.eq(3_000_000)).toBe(true);
    expect(r.high_sar.eq(5_000_000)).toBe(true);
  });
});

describe("berkus", () => {
  it("sums clamped drivers", () => {
    const r = berkus({
      idea_sar: new Dec("1000000"),
      prototype_sar: new Dec("1500000"),
      team_sar: new Dec("2000000"),
      relationships_sar: new Dec("500000"),
      rollout_sar: new Dec("800000"),
      driver_max_sar: new Dec("2000000"),
    });
    // 1M + 1.5M + 2M + 0.5M + 0.8M = 5.8M
    expect(r.mid_sar.eq(5_800_000)).toBe(true);
  });

  it("clamps individual drivers at driver_max", () => {
    const r = berkus({
      idea_sar: new Dec("99999999"),  // way over cap
      prototype_sar: new Dec("0"),
      team_sar: new Dec("0"),
      relationships_sar: new Dec("0"),
      rollout_sar: new Dec("0"),
      driver_max_sar: new Dec("2000000"),
    });
    expect(r.mid_sar.eq(2_000_000)).toBe(true);
  });

  it("treats negative drivers as zero", () => {
    const r = berkus({
      idea_sar: new Dec("-500"),
      prototype_sar: new Dec("1000000"),
      team_sar: new Dec("0"),
      relationships_sar: new Dec("0"),
      rollout_sar: new Dec("0"),
      driver_max_sar: new Dec("2000000"),
    });
    expect(r.mid_sar.eq(1_000_000)).toBe(true);
  });
});

describe("dcf", () => {
  it("computes PV of constant EBITDA flows + terminal value", () => {
    // Revenue 1M each year, margin 20% each year, discount 10%, terminal 5×
    // Each year EBITDA = 200K
    // PV of years 1-5: 200K × (1/1.1 + 1/1.1^2 + ... + 1/1.1^5)
    // Annuity factor for 5y @ 10% ≈ 3.79
    // PV operating ≈ 758,000
    // Terminal: 200K × 5 = 1M, discounted /1.1^5 ≈ 620,921
    // Mid ≈ 1,378,921
    const r = dcf({
      revenues_sar: [
        new Dec("1000000"),
        new Dec("1000000"),
        new Dec("1000000"),
        new Dec("1000000"),
        new Dec("1000000"),
      ],
      ebitda_margin_pcts: [
        new Dec("20"),
        new Dec("20"),
        new Dec("20"),
        new Dec("20"),
        new Dec("20"),
      ],
      discount_rate_pct: new Dec("10"),
      terminal_multiple: new Dec("5"),
    });
    // Allow ±1 SAR for rounding.
    expect(r.mid_sar.gt(1_370_000)).toBe(true);
    expect(r.mid_sar.lt(1_390_000)).toBe(true);
  });

  it("Low/High are ±20% of Mid", () => {
    const r = dcf({
      revenues_sar: [
        new Dec("1000000"),
        new Dec("2000000"),
        new Dec("4000000"),
        new Dec("8000000"),
        new Dec("16000000"),
      ],
      ebitda_margin_pcts: [
        new Dec("0"),
        new Dec("10"),
        new Dec("15"),
        new Dec("20"),
        new Dec("25"),
      ],
      discount_rate_pct: new Dec("20"),
      terminal_multiple: new Dec("8"),
    });
    expect(r.low_sar.div(r.mid_sar).toFixed(2)).toBe("0.80");
    expect(r.high_sar.div(r.mid_sar).toFixed(2)).toBe("1.20");
  });

  it("higher discount rate produces lower valuation", () => {
    const inputs = {
      revenues_sar: [
        new Dec("1000000"),
        new Dec("1000000"),
        new Dec("1000000"),
        new Dec("1000000"),
        new Dec("1000000"),
      ] as DcfInputs["revenues_sar"],
      ebitda_margin_pcts: [
        new Dec("20"),
        new Dec("20"),
        new Dec("20"),
        new Dec("20"),
        new Dec("20"),
      ] as DcfInputs["ebitda_margin_pcts"],
      terminal_multiple: new Dec("5"),
    };
    const cheap = dcf({ ...inputs, discount_rate_pct: new Dec("10") });
    const expensive = dcf({ ...inputs, discount_rate_pct: new Dec("30") });
    expect(cheap.mid_sar.gt(expensive.mid_sar)).toBe(true);
  });
});

// Type alias for the typed tuples in the last test.
type DcfInputs = Parameters<typeof dcf>[0];
