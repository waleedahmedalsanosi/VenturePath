import { describe, expect, it } from "vitest";

import { computeStatus, nextDueDate } from "./status";

describe("computeStatus", () => {
  const now = new Date("2026-05-15T00:00:00Z");

  it("returns 'complete' when completed_at is set, even if past due", () => {
    expect(
      computeStatus(
        { due_date: "2026-04-01", completed_at: "2026-04-02T00:00:00Z" },
        now,
      ),
    ).toBe("complete");
  });

  it("returns 'overdue' when due_date is past and not completed", () => {
    expect(
      computeStatus({ due_date: "2026-05-14", completed_at: null }, now),
    ).toBe("overdue");
  });

  it("returns 'due_soon' when due within 30 days", () => {
    expect(
      computeStatus({ due_date: "2026-06-10", completed_at: null }, now),
    ).toBe("due_soon");
  });

  it("returns 'due_soon' on the exact 30-day boundary", () => {
    expect(
      computeStatus({ due_date: "2026-06-14", completed_at: null }, now),
    ).toBe("due_soon");
  });

  it("returns 'upcoming' when due more than 30 days out", () => {
    expect(
      computeStatus({ due_date: "2026-07-01", completed_at: null }, now),
    ).toBe("upcoming");
  });

  it("returns 'due_soon' when due_date is today", () => {
    expect(
      computeStatus({ due_date: "2026-05-15", completed_at: null }, now),
    ).toBe("due_soon");
  });
});

describe("nextDueDate", () => {
  it("returns null for one_time", () => {
    expect(nextDueDate("2026-05-15", "one_time")).toBeNull();
  });

  it("adds one month for monthly", () => {
    expect(nextDueDate("2026-05-15", "monthly")).toBe("2026-06-15");
  });

  it("adds three months for quarterly", () => {
    expect(nextDueDate("2026-01-31", "quarterly")).toBe("2026-05-01");
    // ^ JS Date rolls Jan 31 + 3 months → May 1 (April has 30 days).
    //   This matches user expectation for "quarterly from Jan 31".
  });

  it("adds one year for annual", () => {
    expect(nextDueDate("2026-12-31", "annual")).toBe("2027-12-31");
  });

  it("handles year wrap on monthly", () => {
    expect(nextDueDate("2026-12-15", "monthly")).toBe("2027-01-15");
  });
});
