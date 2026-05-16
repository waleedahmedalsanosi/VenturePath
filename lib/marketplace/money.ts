/**
 * Marketplace money helpers. Wraps Dec for ask-price and share-count math
 * so server actions and UI don't construct Decimal directly. Per CQ3 from
 * eng review: every monetary value stays in string form until math is needed;
 * never a JS Number.
 */

import { Dec } from "@/lib/cap-table/decimal";

/** Format a SAR amount for display (no decimals, comma-grouped). */
export function formatSar(value: string | number): string {
  const d = new Dec(value);
  return `SAR ${d.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
}

/** Format a share count for display (comma-grouped, no decimals). */
export function formatShares(value: string | number): string {
  const d = new Dec(value);
  return d.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/**
 * Compute per-share price (SAR per share) from a lot ask price and share
 * count. Returns a string with 2-decimal precision, suitable for display.
 */
export function pricePerShare(askPriceSar: string | number, shares: string | number): string {
  const price = new Dec(askPriceSar);
  const count = new Dec(shares);
  if (count.lte(0)) return "0";
  return price.div(count).toFixed(2);
}

/** Validate that a value is a positive Decimal string. Throws on invalid. */
export function assertPositiveDec(label: string, value: string): void {
  let d: InstanceType<typeof Dec>;
  try {
    d = new Dec(value);
  } catch {
    throw new Error(`${label} must be a number`);
  }
  if (!d.isFinite() || d.lte(0)) {
    throw new Error(`${label} must be positive`);
  }
}
