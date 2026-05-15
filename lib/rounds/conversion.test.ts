import { describe, expect, it } from "vitest";

import { convertSafe } from "./conversion";

// Pre-money: SAR 10,000,000 / 1,000,000 shares = SAR 10 per share

describe("convertSafe — cap binds", () => {
  it("uses cap-implied price when cap < round price", () => {
    // cap = 5M, round pre-money = 10M, fd = 1M shares
    // cap_implied = 5M/1M = 5/sh, round = 10M/1M = 10/sh → cap binds
    // shares = 500K / 5 = 100,000
    const result = convertSafe(
      { investment_sar: "500000", valuation_cap_sar: "5000000", safe_type: "post_money" },
      "10000000",
      "1000000",
    );
    expect(result.binding).toBe("cap");
    expect(parseFloat(result.conversion_price_sar)).toBeCloseTo(5, 4);
    expect(parseFloat(result.shares)).toBeCloseTo(100000, 0);
  });
});

describe("convertSafe — round price binds", () => {
  it("uses round price when cap > round price", () => {
    // cap = 20M, round = 10M → round price = 10/sh binds
    // shares = 200K / 10 = 20,000
    const result = convertSafe(
      { investment_sar: "200000", valuation_cap_sar: "20000000", safe_type: "post_money" },
      "10000000",
      "1000000",
    );
    expect(result.binding).toBe("round");
    expect(parseFloat(result.conversion_price_sar)).toBeCloseTo(10, 4);
    expect(parseFloat(result.shares)).toBeCloseTo(20000, 0);
  });

  it("returns binding=tied when cap exactly equals round price", () => {
    // cap = 10M, round = 10M → tied
    const result = convertSafe(
      { investment_sar: "100000", valuation_cap_sar: "10000000", safe_type: "post_money" },
      "10000000",
      "1000000",
    );
    expect(result.binding).toBe("tied");
    expect(parseFloat(result.shares)).toBeCloseTo(10000, 0);
  });
});

describe("convertSafe — discount rate only (no cap)", () => {
  it("applies discount to round price", () => {
    // round = 10/sh, 20% discount → 8/sh
    // shares = 800K / 8 = 100,000
    const result = convertSafe(
      {
        investment_sar: "800000",
        valuation_cap_sar: "0",
        discount_rate: "20",
        safe_type: "post_money",
      },
      "10000000",
      "1000000",
    );
    expect(result.binding).toBe("discount");
    expect(parseFloat(result.conversion_price_sar)).toBeCloseTo(8, 4);
    expect(parseFloat(result.shares)).toBeCloseTo(100000, 0);
  });
});

describe("convertSafe — cap AND discount", () => {
  it("picks cap when cap-implied < discounted price", () => {
    // cap = 4M → cap_implied = 4/sh
    // round = 10/sh, 20% discount → discounted = 8/sh
    // min(4, 8) = 4 → cap binds
    const result = convertSafe(
      {
        investment_sar: "400000",
        valuation_cap_sar: "4000000",
        discount_rate: "20",
        safe_type: "post_money",
      },
      "10000000",
      "1000000",
    );
    expect(result.binding).toBe("cap");
    expect(parseFloat(result.conversion_price_sar)).toBeCloseTo(4, 4);
    expect(parseFloat(result.shares)).toBeCloseTo(100000, 0);
  });

  it("picks discount when discounted price < cap-implied", () => {
    // cap = 15M → cap_implied = 15/sh
    // round = 10/sh, 30% discount → discounted = 7/sh
    // min(15, 7) = 7 → discount binds
    const result = convertSafe(
      {
        investment_sar: "700000",
        valuation_cap_sar: "15000000",
        discount_rate: "30",
        safe_type: "post_money",
      },
      "10000000",
      "1000000",
    );
    expect(result.binding).toBe("discount");
    expect(parseFloat(result.conversion_price_sar)).toBeCloseTo(7, 4);
    expect(parseFloat(result.shares)).toBeCloseTo(100000, 0);
  });
});

describe("convertSafe — validation", () => {
  it("throws when fd_shares_pre_round is zero", () => {
    expect(() =>
      convertSafe(
        { investment_sar: "100000", valuation_cap_sar: "5000000", safe_type: "post_money" },
        "10000000",
        "0",
      ),
    ).toThrow();
  });

  it("throws when pre_money_valuation is zero", () => {
    expect(() =>
      convertSafe(
        { investment_sar: "100000", valuation_cap_sar: "5000000", safe_type: "post_money" },
        "0",
        "1000000",
      ),
    ).toThrow();
  });

  it("throws when investment is zero", () => {
    expect(() =>
      convertSafe(
        { investment_sar: "0", valuation_cap_sar: "5000000", safe_type: "post_money" },
        "10000000",
        "1000000",
      ),
    ).toThrow();
  });
});
