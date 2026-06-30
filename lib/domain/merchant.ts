/**
 * Shared merchant helpers.
 *
 * Minimal normalization for item-level analytics keys. Proper alias
 * normalization is a Milestone 5 concern; for now we trim + lowercase so receipt
 * and manual items share a usable merchant key.
 */

/** Trim and lowercase a merchant name into a normalized analytics key. */
export function normalizeMerchant(merchant: string): string {
  return merchant.trim().toLowerCase();
}
