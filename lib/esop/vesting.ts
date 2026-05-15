/**
 * ESOP vesting calculations.
 * All math at the date level — no time-of-day handling. Cliff + linear graded
 * vesting matches the standard 4yr/1yr-cliff industry convention as the
 * simplest model. PRD's optional "custom schedule per period" is deferred.
 */

import { Dec } from "@/lib/cap-table/decimal";

import type { Database } from "@/lib/supabase/types";

type Grant = Database["public"]["Tables"]["esop_grants"]["Row"];

/**
 * Fraction vested at a given as-of date, in [0, 1]. Returns 0 before the
 * cliff. For immediate grants, always 1.
 */
export function vestedFraction(grant: Grant, asOf: Date = new Date()): InstanceType<typeof Dec> {
  if (grant.vesting_type === "immediate") return new Dec(1);
  if (!grant.vesting_start_date || !grant.vesting_end_date) return new Dec(0);

  const start = new Date(`${grant.vesting_start_date}T00:00:00Z`).getTime();
  const end = new Date(`${grant.vesting_end_date}T00:00:00Z`).getTime();
  const asOfMs = asOf.getTime();

  if (asOfMs >= end) return new Dec(1);
  if (asOfMs <= start) return new Dec(0);

  // Cliff: nothing vests until start + cliff_months
  const cliffMs = monthsToMs(grant.cliff_months);
  if (asOfMs < start + cliffMs) return new Dec(0);

  // Linear from cliff to end.
  const elapsed = asOfMs - start;
  const total = end - start;
  return new Dec(elapsed).div(total);
}

/** Number of vested options as a Decimal. */
export function vestedOptions(grant: Grant, asOf: Date = new Date()): InstanceType<typeof Dec> {
  return vestedFraction(grant, asOf).mul(new Dec(grant.options_count));
}

function monthsToMs(months: number): number {
  // 30.4375 days per month average — close enough at vesting horizons.
  return Math.round(months * 30.4375 * 86_400_000);
}

export const DEPARTMENT_LABELS: Record<
  Database["public"]["Enums"]["esop_department"],
  string
> = {
  engineering: "Engineering",
  product: "Product",
  sales: "Sales",
  operations: "Operations",
  design: "Design",
  legal: "Legal",
  finance: "Finance",
  other: "Other",
};

export const VESTING_FREQ_LABELS: Record<
  Database["public"]["Enums"]["esop_vesting_frequency"],
  string
> = {
  monthly: "Monthly",
  quarterly: "Quarterly",
  annual: "Annual",
};

export const GRANT_STATUS_LABELS: Record<
  Database["public"]["Enums"]["esop_grant_status"],
  string
> = {
  active: "Active",
  fully_vested: "Fully vested",
  terminated: "Terminated",
};
