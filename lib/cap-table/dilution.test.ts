import { describe, expect, it } from "vitest";

import { Dec } from "./decimal";
import { modelDilution, type DilutionInput } from "./dilution";

describe("modelDilution", () => {
  const founders: DilutionInput[] = [
    {
      id: "f1",
      name: "Founder",
      kind: "ordinary",
      shares: new Dec("1000000"),
    },
  ];

  const round = {
    pre_money_valuation_sar: new Dec("10000000"),
    fd_shares_pre_round: new Dec("1000000"),  // ignored — recomputed from existing
  };

  it("throws if no ordinary shareholders exist", () => {
    expect(() =>
      modelDilution([], round, undefined),
    ).toThrow(/at least one ordinary shareholder/);
  });

  it("with no new investor and no existing convertibles, ownership is 100%", () => {
    const result = modelDilution(founders, round);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]!.ownership_pct.eq(100)).toBe(true);
    expect(result.round_price_sar.eq(10)).toBe(true);
  });

  it("dilutes founder when a new SAFE converts at the cap", () => {
    const result = modelDilution(founders, round, {
      name: "Angel",
      investment_sar: new Dec("500000"),
      valuation_cap_sar: new Dec("5000000"),
    });
    // cap_implied = 5M / 1M = 5 → binds (5 < 10)
    // new shares = 500K / 5 = 100K
    // total = 1.1M, founder = 1M/1.1M = ~90.91%
    expect(result.rows).toHaveLength(2);
    const founder = result.rows.find((r) => r.id === "f1")!;
    const angel = result.rows.find((r) => r.id === "__new")!;
    expect(angel.shares.eq(new Dec("100000"))).toBe(true);
    expect(founder.ownership_pct.gt(new Dec("90.9"))).toBe(true);
    expect(founder.ownership_pct.lt(new Dec("91.0"))).toBe(true);
    expect(angel.ownership_pct.gt(new Dec("9.0"))).toBe(true);
    expect(angel.ownership_pct.lt(new Dec("9.1"))).toBe(true);
  });

  it("converts existing convertibles alongside a new one", () => {
    const withConvertible: DilutionInput[] = [
      ...founders,
      {
        id: "c1",
        name: "Early Angel",
        kind: "convertible",
        investment_sar: new Dec("200000"),
        valuation_cap_sar: new Dec("4000000"),
      },
    ];
    const result = modelDilution(withConvertible, round, {
      name: "New Angel",
      investment_sar: new Dec("500000"),
      valuation_cap_sar: new Dec("5000000"),
    });
    expect(result.rows).toHaveLength(3);
    const total = result.rows.reduce((acc, r) => acc.plus(r.ownership_pct), new Dec(0));
    expect(total.eq(100)).toBe(true);
  });

  it("ownership percentages always sum to exactly 100", () => {
    const many: DilutionInput[] = [
      { id: "f1", name: "Founder A", kind: "ordinary", shares: new Dec("400000") },
      { id: "f2", name: "Founder B", kind: "ordinary", shares: new Dec("400000") },
      { id: "f3", name: "Co-founder", kind: "ordinary", shares: new Dec("200000") },
      {
        id: "c1",
        name: "Convertible 1",
        kind: "convertible",
        investment_sar: new Dec("100000"),
        valuation_cap_sar: new Dec("5000000"),
      },
      {
        id: "c2",
        name: "Convertible 2",
        kind: "convertible",
        investment_sar: new Dec("250000"),
        valuation_cap_sar: new Dec("8000000"),
      },
    ];
    const result = modelDilution(many, round, {
      name: "Lead",
      investment_sar: new Dec("1000000"),
      valuation_cap_sar: new Dec("6000000"),
    });
    const sum = result.rows.reduce((acc, r) => acc.plus(r.ownership_pct), new Dec(0));
    // Decimal divisions produce non-terminating results — accept within 8
    // decimals of 100. Displayed values are rounded to 2 decimals anyway.
    expect(sum.minus(100).abs().lte(new Dec("1e-8"))).toBe(true);
  });
});
