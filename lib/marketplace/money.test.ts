import { describe, expect, it } from "vitest";

import { assertPositiveDec, formatSar, formatShares, pricePerShare } from "./money";

describe("formatSar", () => {
  it("comma-groups thousands", () => {
    expect(formatSar("1234567")).toBe("SAR 1,234,567");
  });
  it("handles zero", () => {
    expect(formatSar("0")).toBe("SAR 0");
  });
  it("strips decimals", () => {
    expect(formatSar("1500.75")).toBe("SAR 1,501");
  });
});

describe("formatShares", () => {
  it("comma-groups", () => {
    expect(formatShares("500000")).toBe("500,000");
  });
});

describe("pricePerShare", () => {
  it("divides exactly", () => {
    expect(pricePerShare("10000", "100")).toBe("100.00");
  });
  it("preserves precision", () => {
    expect(pricePerShare("1", "3")).toBe("0.33");
  });
  it("returns 0 for zero shares", () => {
    expect(pricePerShare("100", "0")).toBe("0");
  });
});

describe("assertPositiveDec", () => {
  it("accepts positive integers", () => {
    expect(() => assertPositiveDec("price", "100")).not.toThrow();
  });
  it("accepts positive decimals as strings", () => {
    expect(() => assertPositiveDec("price", "0.01")).not.toThrow();
  });
  it("rejects zero", () => {
    expect(() => assertPositiveDec("price", "0")).toThrow(/positive/);
  });
  it("rejects negative", () => {
    expect(() => assertPositiveDec("price", "-1")).toThrow(/positive/);
  });
  it("rejects non-numeric", () => {
    expect(() => assertPositiveDec("price", "abc")).toThrow(/number/);
  });
});
