import { describe, expect, it } from "vitest";

import { Dec } from "./decimal";
import { WORKED_EXAMPLES } from "./__fixtures__/isafe-spec-examples";
import {
  computeCapImpliedPrice,
  computeConversionShares,
  computeRoundPrice,
  ISafeMathError,
  validateRound,
  validateTerms,
  type ISafeTerms,
  type RoundTerms,
} from "./isafe-math";

const validTerms: ISafeTerms = {
  investment_sar: new Dec("500000"),
  valuation_cap_sar: new Dec("5000000"),
  profit_share_ratio: new Dec("20"),
};

const validRound: RoundTerms = {
  pre_money_valuation_sar: new Dec("10000000"),
  fd_shares_pre_round: new Dec("1000000"),
};

describe("validateTerms", () => {
  it("accepts valid terms", () => {
    expect(() => validateTerms(validTerms)).not.toThrow();
  });

  it("rejects zero investment", () => {
    expect(() =>
      validateTerms({ ...validTerms, investment_sar: new Dec("0") }),
    ).toThrow(ISafeMathError);
  });

  it("rejects negative investment", () => {
    expect(() =>
      validateTerms({ ...validTerms, investment_sar: new Dec("-1") }),
    ).toThrow(/investment_sar must be > 0/);
  });

  it("rejects zero valuation cap", () => {
    expect(() =>
      validateTerms({ ...validTerms, valuation_cap_sar: new Dec("0") }),
    ).toThrow(/valuation_cap_sar must be > 0/);
  });

  it("rejects negative valuation cap", () => {
    expect(() =>
      validateTerms({
        ...validTerms,
        valuation_cap_sar: new Dec("-1000"),
      }),
    ).toThrow(ISafeMathError);
  });

  it("accepts profit_share_ratio = 0", () => {
    expect(() =>
      validateTerms({ ...validTerms, profit_share_ratio: new Dec("0") }),
    ).not.toThrow();
  });

  it("accepts profit_share_ratio = 100", () => {
    expect(() =>
      validateTerms({ ...validTerms, profit_share_ratio: new Dec("100") }),
    ).not.toThrow();
  });

  it("rejects profit_share_ratio < 0", () => {
    expect(() =>
      validateTerms({
        ...validTerms,
        profit_share_ratio: new Dec("-0.001"),
      }),
    ).toThrow(/profit_share_ratio must be in/);
  });

  it("rejects profit_share_ratio > 100", () => {
    expect(() =>
      validateTerms({
        ...validTerms,
        profit_share_ratio: new Dec("100.001"),
      }),
    ).toThrow(/profit_share_ratio must be in/);
  });
});

describe("validateRound", () => {
  it("accepts valid round", () => {
    expect(() => validateRound(validRound)).not.toThrow();
  });

  it("rejects zero pre-money valuation", () => {
    expect(() =>
      validateRound({
        ...validRound,
        pre_money_valuation_sar: new Dec("0"),
      }),
    ).toThrow(/pre_money_valuation_sar must be > 0/);
  });

  it("rejects negative pre-money valuation", () => {
    expect(() =>
      validateRound({
        ...validRound,
        pre_money_valuation_sar: new Dec("-1"),
      }),
    ).toThrow(ISafeMathError);
  });

  it("rejects zero fully diluted shares", () => {
    expect(() =>
      validateRound({ ...validRound, fd_shares_pre_round: new Dec("0") }),
    ).toThrow(/fd_shares_pre_round must be > 0/);
  });

  it("rejects negative fully diluted shares", () => {
    expect(() =>
      validateRound({ ...validRound, fd_shares_pre_round: new Dec("-1") }),
    ).toThrow(ISafeMathError);
  });
});

describe("computeRoundPrice", () => {
  it("computes pre_money / fd_shares", () => {
    const price = computeRoundPrice(validRound);
    // 10,000,000 / 1,000,000 = 10
    expect(price.eq(new Dec("10"))).toBe(true);
  });

  it("validates the round (rejects bad inputs)", () => {
    expect(() =>
      computeRoundPrice({
        ...validRound,
        fd_shares_pre_round: new Dec("0"),
      }),
    ).toThrow(ISafeMathError);
  });
});

describe("computeCapImpliedPrice", () => {
  it("computes valuation_cap / fd_shares", () => {
    const price = computeCapImpliedPrice(validTerms, validRound);
    // 5,000,000 / 1,000,000 = 5
    expect(price.eq(new Dec("5"))).toBe(true);
  });

  it("validates terms", () => {
    expect(() =>
      computeCapImpliedPrice(
        { ...validTerms, valuation_cap_sar: new Dec("0") },
        validRound,
      ),
    ).toThrow(ISafeMathError);
  });

  it("validates round", () => {
    expect(() =>
      computeCapImpliedPrice(validTerms, {
        ...validRound,
        fd_shares_pre_round: new Dec("0"),
      }),
    ).toThrow(ISafeMathError);
  });
});

describe("computeConversionShares — worked examples", () => {
  for (const example of WORKED_EXAMPLES) {
    it(`${example.name}: ${example.notes}`, () => {
      const result = computeConversionShares(example.terms, example.round);

      expect(result.binding).toBe(example.expected.binding);

      expect(result.conversion_price_sar.eq(example.expected.conversion_price_sar)).toBe(
        true,
      );

      // Use eq for exact decimal comparison — no epsilon tolerance.
      expect(result.shares.eq(example.expected.shares)).toBe(true);
    });
  }
});

describe("computeConversionShares — input validation", () => {
  it("propagates ISafeMathError for invalid terms", () => {
    expect(() =>
      computeConversionShares(
        { ...validTerms, investment_sar: new Dec("0") },
        validRound,
      ),
    ).toThrow(ISafeMathError);
  });

  it("propagates ISafeMathError for invalid round", () => {
    expect(() =>
      computeConversionShares(validTerms, {
        ...validRound,
        pre_money_valuation_sar: new Dec("0"),
      }),
    ).toThrow(ISafeMathError);
  });
});

describe("computeConversionShares — precision guarantees", () => {
  it("no floating-point drift on repeated decimal division", () => {
    // Classic JS Number trap: 0.1 + 0.2 !== 0.3
    // Build a scenario where Number math would drift.
    const terms: ISafeTerms = {
      investment_sar: new Dec("0.3"),
      valuation_cap_sar: new Dec("1"),
      profit_share_ratio: new Dec("0"),
    };
    const round: RoundTerms = {
      pre_money_valuation_sar: new Dec("10"),
      fd_shares_pre_round: new Dec("10"),
    };
    // cap_implied_price = 1 / 10 = 0.1
    // round_price = 10 / 10 = 1
    // min = 0.1 (cap binds)
    // shares = 0.3 / 0.1 = exactly 3
    const result = computeConversionShares(terms, round);
    expect(result.binding).toBe("cap");
    expect(result.shares.eq(new Dec("3"))).toBe(true);
    // The classic Number-math version would give 2.9999999999999996 or similar.
  });

  it("handles the canonical 0.1 + 0.2 === 0.3 case correctly", () => {
    // JS Number: 0.1 + 0.2 = 0.30000000000000004 (not 0.3).
    // Decimal: must produce exactly 0.3.
    const sum = new Dec("0.1").plus(new Dec("0.2"));
    expect(sum.eq(new Dec("0.3"))).toBe(true);
  });

  it("handles repeated addition without drift (10 × 0.1 = 1.0)", () => {
    let total = new Dec("0");
    for (let i = 0; i < 10; i++) {
      total = total.plus(new Dec("0.1"));
    }
    expect(total.eq(new Dec("1.0"))).toBe(true);
  });
});
