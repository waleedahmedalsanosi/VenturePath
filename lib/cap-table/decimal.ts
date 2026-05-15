/**
 * Decimal wrapper for cap-table math.
 *
 * Why decimal.js: JS Number is IEEE 754 floating point. 0.1 + 0.2 !== 0.3.
 * For financial math (SAR amounts, ownership percentages, share counts) we
 * need exact decimal arithmetic. Per eng review decision 3.
 *
 * Why this wrapper exists: keep `decimal.js` import behind a thin layer so we
 * can swap libraries later (e.g. native JS BigDecimal once it ships) without
 * touching every call site, and so the JSONB serialization contract is in
 * one place.
 *
 * Wire contract: every NUMERIC value crossing the JSON boundary is a string,
 * never a JS Number. Postgres returns NUMERIC as a string via PostgREST. We
 * stay in string form until we need math, then construct a Dec.
 */

import { Decimal } from "decimal.js";

// Globally configure decimal.js precision once.
// 40 digits of precision is overkill for any plausible cap table — total shares
// up to 10^15 (a quadrillion), down to 10^-8 ownership precision, all room
// for intermediate multiplications without overflow.
Decimal.set({
  precision: 40,
  // Round half to even (banker's rounding) — fewer biases than half-up.
  rounding: Decimal.ROUND_HALF_EVEN,
  // Disable exponential notation in toString for amounts the user will see.
  toExpNeg: -20,
  toExpPos: 40,
});

/** Re-export for ergonomic call sites. */
export { Decimal as Dec };

/** Coerce a JSON-safe string to a Decimal. Returns undefined for null. */
export function fromJSON(value: string | number | null | undefined): Decimal | undefined {
  if (value === null || value === undefined) return undefined;
  return new Decimal(value);
}

/** Serialize a Decimal back to JSON as a string (never a Number). */
export function toJSON(value: Decimal | undefined): string | null {
  if (value === undefined) return null;
  return value.toFixed();
}

/** Reusable zero constant. */
export const ZERO = new Decimal(0);

/** Reusable one constant. */
export const ONE = new Decimal(1);

/** Reusable one hundred (for percentage calculations). */
export const HUNDRED = new Decimal(100);
