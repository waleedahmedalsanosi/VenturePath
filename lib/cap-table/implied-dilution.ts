/**
 * Implied single-round dilution helpers.
 *
 * Used by:
 * - /rounds/new form (client-side preview)
 * - setRoundVisibility server action (publish gate)
 * - /dilution modeler (warn-only banner)
 */

/**
 * Returns the implied dilution percentage for a round:
 *   raise / (preMoney + raise) × 100
 *
 * Returns null if inputs are invalid (non-finite, non-positive preMoney,
 * negative raise).
 */
export function impliedDilutionPct(
  preMoney: number,
  raise: number,
): number | null {
  if (!isFinite(preMoney) || !isFinite(raise)) return null;
  if (preMoney <= 0) return null;
  if (raise < 0) return null;
  const post = preMoney + raise;
  return (raise / post) * 100;
}

export type DilutionVerdict = "ok" | "warn" | "block";

/**
 * Classifies an implied-dilution percentage:
 * - null  → 'ok'   (insufficient data, no verdict)
 * - > 50% → 'block'
 * - > 30% → 'warn'
 * - ≤ 30% → 'ok'
 */
export function dilutionVerdict(pct: number | null): DilutionVerdict {
  if (pct === null) return "ok";
  if (pct > 50) return "block";
  if (pct > 30) return "warn";
  return "ok";
}
