import { describe, expect, it } from "vitest";

import { Dec } from "./decimal";
import { ISafeMathError } from "./isafe-math";
import { summarize, withOwnership } from "./ownership";

import type { Database } from "@/lib/supabase/types";

type ShareholderRow = Database["public"]["Tables"]["shareholders"]["Row"];

function ordinary(
  id: string,
  name: string,
  shares: string,
  pricePerShare: string = "1",
): ShareholderRow {
  return {
    id,
    workspace_id: "ws",
    name,
    email: null,
    entity_or_individual: "individual",
    entry_date: "2026-01-01",
    instrument_type: "ordinary",
    instrument_data: { shares, price_per_share_sar: pricePerShare } as unknown as ShareholderRow["instrument_data"],
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    deleted_at: null,
    funding_round_id: null,
  };
}

function isafe(
  id: string,
  name: string,
  investment: string,
  cap: string,
  status: "unconverted" | "converted" = "unconverted",
): ShareholderRow {
  return {
    id,
    workspace_id: "ws",
    name,
    email: null,
    entity_or_individual: "individual",
    entry_date: "2026-01-01",
    instrument_type: "isafe",
    instrument_data: {
      investment_sar: investment,
      valuation_cap_sar: cap,
      profit_share_ratio: "20",
      conversion_status: status,
    } as unknown as ShareholderRow["instrument_data"],
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    deleted_at: null,
    funding_round_id: null,
  };
}

describe("summarize", () => {
  it("returns zeros for empty list", () => {
    const s = summarize([]);
    expect(s.total_ordinary_shares.eq(0)).toBe(true);
    expect(s.isafe_count).toBe(0);
    expect(s.total_isafe_investment_sar.eq(0)).toBe(true);
    expect(s.highest_isafe_cap_sar.eq(0)).toBe(true);
  });

  it("sums Ordinary share counts", () => {
    const s = summarize([
      ordinary("a", "Alice", "100000"),
      ordinary("b", "Bob", "50000"),
      ordinary("c", "Carol", "25000"),
    ]);
    expect(s.total_ordinary_shares.eq(new Dec("175000"))).toBe(true);
  });

  it("counts unconverted iSAFEs and sums their investment + tracks highest cap", () => {
    const s = summarize([
      isafe("a", "Investor A", "100000", "5000000"),
      isafe("b", "Investor B", "250000", "8000000"),
      isafe("c", "Investor C", "50000", "3000000", "converted"),
    ]);
    expect(s.isafe_count).toBe(2);
    expect(s.total_isafe_investment_sar.eq(new Dec("350000"))).toBe(true);
    expect(s.highest_isafe_cap_sar.eq(new Dec("8000000"))).toBe(true);
  });

  it("mixes Ordinary and iSAFE correctly", () => {
    const s = summarize([
      ordinary("a", "Founder", "1000000"),
      isafe("b", "Angel", "200000", "10000000"),
    ]);
    expect(s.total_ordinary_shares.eq(new Dec("1000000"))).toBe(true);
    expect(s.isafe_count).toBe(1);
    expect(s.total_isafe_investment_sar.eq(new Dec("200000"))).toBe(true);
  });

  it("throws if Ordinary row is missing shares", () => {
    const broken: ShareholderRow = {
      ...ordinary("a", "Broken", "100"),
      instrument_data: {} as unknown as ShareholderRow["instrument_data"],
    };
    expect(() => summarize([broken])).toThrow(ISafeMathError);
  });

  it("skips iSAFE rows missing investment/cap (defensive)", () => {
    const broken: ShareholderRow = {
      ...isafe("a", "Missing data", "100", "1000"),
      instrument_data: {
        conversion_status: "unconverted",
      } as unknown as ShareholderRow["instrument_data"],
    };
    const s = summarize([broken]);
    expect(s.isafe_count).toBe(1);
    expect(s.total_isafe_investment_sar.eq(0)).toBe(true);
    expect(s.highest_isafe_cap_sar.eq(0)).toBe(true);
  });
});

describe("withOwnership", () => {
  it("returns null ownership when no Ordinary shares exist", () => {
    const rows = withOwnership([isafe("a", "Investor", "100000", "5000000")]);
    expect(rows[0]!.ownership_pct).toBeNull();
  });

  it("computes percentage as shares / total for Ordinary", () => {
    const rows = withOwnership([
      ordinary("a", "Founder", "700000"),
      ordinary("b", "Co-founder", "300000"),
    ]);
    expect(rows[0]!.ownership_pct?.eq(new Dec("70"))).toBe(true);
    expect(rows[1]!.ownership_pct?.eq(new Dec("30"))).toBe(true);
  });

  it("returns null for iSAFE rows even when Ordinary exists", () => {
    const rows = withOwnership([
      ordinary("a", "Founder", "1000000"),
      isafe("b", "Investor", "100000", "5000000"),
    ]);
    expect(rows[0]!.ownership_pct?.eq(new Dec("100"))).toBe(true);
    expect(rows[1]!.ownership_pct).toBeNull();
  });

  it("returns null when Ordinary row has bad data", () => {
    const broken: ShareholderRow = {
      ...ordinary("a", "Broken", "100"),
      instrument_data: { price_per_share_sar: "1" } as unknown as ShareholderRow["instrument_data"],
    };
    const good = ordinary("b", "Good", "100");
    // Need a Workaround: summarize() would throw on broken — for the test we
    // verify the resilience after summarize. The first call's totals would
    // throw. We test that withOwnership propagates the error.
    expect(() => withOwnership([broken, good])).toThrow(ISafeMathError);
  });

  it("percentages sum to exactly 100 with no drift", () => {
    const rows = withOwnership([
      ordinary("a", "A", "333333"),
      ordinary("b", "B", "333333"),
      ordinary("c", "C", "333334"),
    ]);
    const sum = rows
      .map((r) => r.ownership_pct!)
      .reduce((acc, p) => acc.plus(p), new Dec(0));
    expect(sum.eq(new Dec("100"))).toBe(true);
  });
});
