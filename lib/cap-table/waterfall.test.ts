import { describe, expect, it } from "vitest";

import { Dec } from "./decimal";
import { runWaterfall, type WaterfallHolder } from "./waterfall";

const founder: WaterfallHolder = {
  id: "f1",
  name: "Founder",
  kind: "ordinary",
  shares: new Dec("1000000"),
};

describe("runWaterfall", () => {
  it("distributes 100% of exit to a single ordinary holder", () => {
    const result = runWaterfall({
      exit_value_sar: new Dec("10000000"),
      non_convertible_debt_sar: new Dec("0"),
      exit_type: "acquisition",
      holders: [founder],
    });
    expect(result.residual_after_debt_sar.eq(10_000_000)).toBe(true);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]!.payout_sar.eq(10_000_000)).toBe(true);
  });

  it("subtracts non-convertible debt before distribution", () => {
    const result = runWaterfall({
      exit_value_sar: new Dec("10000000"),
      non_convertible_debt_sar: new Dec("2000000"),
      exit_type: "acquisition",
      holders: [founder],
    });
    expect(result.residual_after_debt_sar.eq(8_000_000)).toBe(true);
    expect(result.rows[0]!.payout_sar.eq(8_000_000)).toBe(true);
  });

  it("clamps residual to zero when debt exceeds exit", () => {
    const result = runWaterfall({
      exit_value_sar: new Dec("1000000"),
      non_convertible_debt_sar: new Dec("2000000"),
      exit_type: "acquisition",
      holders: [founder],
    });
    expect(result.residual_after_debt_sar.eq(0)).toBe(true);
    expect(result.rows[0]!.payout_sar.eq(0)).toBe(true);
  });

  it("gives a convertible holder the 1x preference when as-converted is worse", () => {
    // Founder 1M shares + Angel 100K SAR @ 10M cap. Exit = 5M.
    // Cap-implied shares for Angel: 100K * 1M / 10M = 10K shares.
    // As-converted: 10K / 1.01M ≈ 0.99% of 5M ≈ 49,505 SAR
    // Preference: 100K SAR
    // Angel picks preference (100K > 49.5K).
    const result = runWaterfall({
      exit_value_sar: new Dec("5000000"),
      non_convertible_debt_sar: new Dec("0"),
      exit_type: "acquisition",
      holders: [
        founder,
        {
          id: "a1",
          name: "Angel",
          kind: "convertible",
          investment_sar: new Dec("100000"),
          valuation_cap_sar: new Dec("10000000"),
        },
      ],
    });
    const angel = result.rows.find((r) => r.id === "a1")!;
    expect(angel.path).toBe("preference");
    expect(angel.payout_sar.eq(100_000)).toBe(true);
    // Founder gets the remaining 4.9M (100% of 4.9M since they're the only
    // ordinary participating).
    const founderRow = result.rows.find((r) => r.id === "f1")!;
    expect(founderRow.payout_sar.eq(4_900_000)).toBe(true);
  });

  it("gives a convertible holder as-converted when better than preference", () => {
    // Founder 1M shares + Angel 1M SAR @ 5M cap. Exit = 100M.
    // Cap-implied: 1M * 1M / 5M = 200K shares.
    // As-converted: 200K / 1.2M ≈ 16.67% of 100M = 16.67M
    // Preference: 1M
    // Angel picks as-converted (16.67M >> 1M).
    const result = runWaterfall({
      exit_value_sar: new Dec("100000000"),
      non_convertible_debt_sar: new Dec("0"),
      exit_type: "acquisition",
      holders: [
        founder,
        {
          id: "a1",
          name: "Angel",
          kind: "convertible",
          investment_sar: new Dec("1000000"),
          valuation_cap_sar: new Dec("5000000"),
        },
      ],
    });
    const angel = result.rows.find((r) => r.id === "a1")!;
    expect(angel.path).toBe("as_converted");
    // Sum should equal residual.
    const sum = result.rows.reduce((a, r) => a.plus(r.payout_sar), new Dec(0));
    expect(sum.minus(100_000_000).abs().lte(new Dec("0.01"))).toBe(true);
  });

  it("scales preferences down when they exceed residual", () => {
    // Two angels each 1M SAR preferred. Exit 1M, debt 0. Residual 1M.
    // Each would prefer their 1M preference (>> as-converted on small exit),
    // but combined preference (2M) exceeds residual (1M). Scale to 0.5x each.
    const result = runWaterfall({
      exit_value_sar: new Dec("1000000"),
      non_convertible_debt_sar: new Dec("0"),
      exit_type: "acquisition",
      holders: [
        founder,
        {
          id: "a1",
          name: "Angel A",
          kind: "convertible",
          investment_sar: new Dec("1000000"),
          valuation_cap_sar: new Dec("10000000"),
        },
        {
          id: "a2",
          name: "Angel B",
          kind: "convertible",
          investment_sar: new Dec("1000000"),
          valuation_cap_sar: new Dec("10000000"),
        },
      ],
    });
    const a1 = result.rows.find((r) => r.id === "a1")!;
    const a2 = result.rows.find((r) => r.id === "a2")!;
    // Each angel gets 500K (half their preference).
    expect(a1.payout_sar.eq(500_000)).toBe(true);
    expect(a2.payout_sar.eq(500_000)).toBe(true);
    // Founder gets 0 (preferences ate the residual).
    const founderRow = result.rows.find((r) => r.id === "f1")!;
    expect(founderRow.payout_sar.eq(0)).toBe(true);
  });

  it("sums payouts to total_distributed", () => {
    const result = runWaterfall({
      exit_value_sar: new Dec("50000000"),
      non_convertible_debt_sar: new Dec("5000000"),
      exit_type: "acquisition",
      holders: [
        founder,
        {
          id: "c1",
          name: "Conv",
          kind: "convertible",
          investment_sar: new Dec("500000"),
          valuation_cap_sar: new Dec("8000000"),
        },
      ],
    });
    const sum = result.rows.reduce((a, r) => a.plus(r.payout_sar), new Dec(0));
    expect(sum.eq(result.total_distributed_sar)).toBe(true);
    expect(
      sum.plus(result.total_undistributed_sar).minus(result.residual_after_debt_sar).abs().lte(new Dec("0.01")),
    ).toBe(true);
  });
});
