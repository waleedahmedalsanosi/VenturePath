import { describe, expect, it } from "vitest";

import { Dec } from "@/lib/cap-table/decimal";
import { vestedFraction, vestedOptions } from "./vesting";

import type { Database } from "@/lib/supabase/types";

type Grant = Database["public"]["Tables"]["esop_grants"]["Row"];

function makeGrant(overrides: Partial<Grant>): Grant {
  return {
    id: "g1",
    pool_id: "p1",
    workspace_id: "w1",
    employee_name: "Alice",
    employee_email: "alice@example.com",
    department: "engineering",
    options_count: "10000",
    strike_price_sar: "1.00",
    grant_date: "2025-01-01",
    vesting_type: "graded",
    vesting_start_date: "2025-01-01",
    vesting_end_date: "2029-01-01",
    cliff_months: 12,
    vesting_frequency: "monthly",
    status: "active",
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
    deleted_at: null,
    ...overrides,
  };
}

describe("vestedFraction", () => {
  it("returns 1 for immediate vesting at any date", () => {
    const grant = makeGrant({ vesting_type: "immediate", vesting_start_date: null, vesting_end_date: null });
    expect(vestedFraction(grant, new Date("2024-01-01")).eq(1)).toBe(true);
  });

  it("returns 0 before vesting_start_date", () => {
    const grant = makeGrant({});
    expect(vestedFraction(grant, new Date("2024-12-31")).eq(0)).toBe(true);
  });

  it("returns 0 during the cliff period (before cliff date)", () => {
    const grant = makeGrant({ cliff_months: 12 });
    // 6 months in — still in cliff
    expect(vestedFraction(grant, new Date("2025-07-01")).eq(0)).toBe(true);
  });

  it("returns 1 after vesting_end_date", () => {
    const grant = makeGrant({});
    expect(vestedFraction(grant, new Date("2030-01-01")).eq(1)).toBe(true);
  });

  it("returns ~25% just past the 1-year cliff (4-year vest)", () => {
    const grant = makeGrant({ cliff_months: 12 });
    // Day 366 of a 4-year vest ≈ 25% (slightly over because cliff is a single
    // unlock moment, then linear)
    const result = vestedFraction(grant, new Date("2026-01-02"));
    expect(result.gt(new Dec("0.24"))).toBe(true);
    expect(result.lt(new Dec("0.26"))).toBe(true);
  });

  it("returns ~50% halfway through (2 years of a 4-year vest)", () => {
    const grant = makeGrant({ cliff_months: 12 });
    const result = vestedFraction(grant, new Date("2027-01-01"));
    expect(result.gt(new Dec("0.49"))).toBe(true);
    expect(result.lt(new Dec("0.51"))).toBe(true);
  });

  it("returns 0 if cliff exists but end date is before cliff (broken data)", () => {
    const grant = makeGrant({
      vesting_start_date: "2025-01-01",
      vesting_end_date: "2025-06-01",  // 5 months
      cliff_months: 12,
    });
    expect(vestedFraction(grant, new Date("2025-07-01")).eq(1)).toBe(true);
    // past end → 1 regardless of cliff
  });

  it("returns 0 if vesting dates are missing (graded grant with no schedule)", () => {
    const grant = makeGrant({
      vesting_type: "graded",
      vesting_start_date: null,
      vesting_end_date: null,
    });
    expect(vestedFraction(grant, new Date("2026-01-01")).eq(0)).toBe(true);
  });
});

describe("vestedOptions", () => {
  it("returns full options_count when fully vested", () => {
    const grant = makeGrant({ vesting_type: "immediate", options_count: "5000" });
    expect(vestedOptions(grant).eq(5000)).toBe(true);
  });

  it("returns half of options at halfway point", () => {
    const grant = makeGrant({ options_count: "10000", cliff_months: 12 });
    const result = vestedOptions(grant, new Date("2027-01-01"));
    // Expect approximately 5000
    expect(result.gt(4900)).toBe(true);
    expect(result.lt(5100)).toBe(true);
  });
});
