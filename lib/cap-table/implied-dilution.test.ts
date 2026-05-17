import { describe, expect, it } from "vitest";

import { dilutionVerdict, impliedDilutionPct } from "./implied-dilution";

describe("impliedDilutionPct", () => {
  it("computes correct percentage for a standard round", () => {
    // 1M raise on 4M pre-money → post = 5M → 20%
    const pct = impliedDilutionPct(4_000_000, 1_000_000);
    expect(pct).toBeCloseTo(20, 5);
  });

  it("computes 60% for the audit example (pre=400k, raise=600k)", () => {
    const pct = impliedDilutionPct(400_000, 600_000);
    expect(pct).toBeCloseTo(60, 5);
  });

  it("returns null for preMoney <= 0", () => {
    expect(impliedDilutionPct(0, 1_000_000)).toBeNull();
    expect(impliedDilutionPct(-1, 1_000_000)).toBeNull();
  });

  it("returns null for negative raise", () => {
    expect(impliedDilutionPct(1_000_000, -1)).toBeNull();
  });

  it("returns 0% for a zero raise", () => {
    // raise=0 → 0/(preMoney+0)×100 = 0
    expect(impliedDilutionPct(5_000_000, 0)).toBeCloseTo(0, 5);
  });

  it("returns null for non-finite inputs", () => {
    expect(impliedDilutionPct(Infinity, 1_000_000)).toBeNull();
    expect(impliedDilutionPct(1_000_000, NaN)).toBeNull();
    expect(impliedDilutionPct(NaN, NaN)).toBeNull();
  });

  it("boundary: exactly 30% dilution", () => {
    // raise / (pre + raise) = 0.30 → raise = 0.30 * pre + 0.30 * raise
    // 0.70 * raise = 0.30 * pre → raise = pre * 3/7
    const pre = 7_000_000;
    const raise = 3_000_000; // post=10M → 3/10 = 30%
    expect(impliedDilutionPct(pre, raise)).toBeCloseTo(30, 5);
  });

  it("boundary: exactly 50% dilution", () => {
    // raise = preMoney → raise/(2*raise) = 50%
    expect(impliedDilutionPct(5_000_000, 5_000_000)).toBeCloseTo(50, 5);
  });
});

describe("dilutionVerdict", () => {
  it("returns 'ok' for null", () => {
    expect(dilutionVerdict(null)).toBe("ok");
  });

  it("returns 'ok' for 0%", () => {
    expect(dilutionVerdict(0)).toBe("ok");
  });

  it("returns 'ok' for exactly 30%", () => {
    // boundary: 30 is NOT > 30, so it's 'ok'
    expect(dilutionVerdict(30)).toBe("ok");
  });

  it("returns 'warn' for 30.01%", () => {
    expect(dilutionVerdict(30.01)).toBe("warn");
  });

  it("returns 'warn' for 40%", () => {
    expect(dilutionVerdict(40)).toBe("warn");
  });

  it("returns 'ok' for exactly 50%", () => {
    // boundary: 50 is NOT > 50, so it's 'warn' (> 30)
    expect(dilutionVerdict(50)).toBe("warn");
  });

  it("returns 'block' for 50.01%", () => {
    expect(dilutionVerdict(50.01)).toBe("block");
  });

  it("returns 'block' for 60%", () => {
    expect(dilutionVerdict(60)).toBe("block");
  });

  it("returns 'block' for 100%", () => {
    expect(dilutionVerdict(100)).toBe("block");
  });
});
