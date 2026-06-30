/**
 * Shared date/time helpers.
 *
 * The app stores timestamps in UTC and renders Europe/London. Date-only values
 * (YYYY-MM-DD) are resolved to noon UTC so the displayed calendar day stays
 * stable across the GMT/BST boundary (decision D9).
 */

/** Resolve a date-only value (YYYY-MM-DD) to a `Date` at noon UTC. */
export function toNoonUtc(dateIso: string): Date {
  return new Date(`${dateIso}T12:00:00.000Z`);
}
