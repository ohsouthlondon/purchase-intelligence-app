/**
 * Shared money helpers.
 *
 * Amounts are stored in NUMERIC(12,2) columns (Drizzle represents NUMERIC as
 * `string`), so they are formatted to a fixed 2dp string. Rounding to pence
 * keeps both formatting and validation free of floating-point drift.
 */

/** Format a single amount as a 2dp money string (e.g. 1.5 -> "1.50"). */
export function toAmountString(amount: number): string {
  return (Math.round(amount * 100) / 100).toFixed(2);
}

/** True when `value` has at most two decimal places (fp-tolerant). */
export function hasMaxTwoDecimals(value: number): boolean {
  return Math.abs(value * 100 - Math.round(value * 100)) < 1e-9;
}
