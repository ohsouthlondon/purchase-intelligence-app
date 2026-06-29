import { items, manualEntries } from "@/lib/db/schema";
import type { ManualEntryInput } from "@/lib/manual-entry/schema";

/**
 * Pure transforms from validated manual-entry input to DB row values.
 *
 * No DB access lives here — these functions are deterministic and unit-testable.
 * Money is handled in integer pence to avoid floating-point drift, then
 * formatted as a fixed 2dp string for the NUMERIC(12,2) columns (Drizzle
 * represents NUMERIC as `string`).
 */

type NewManualEntry = typeof manualEntries.$inferInsert;
type NewItem = typeof items.$inferInsert;

export interface ManualEntryRecords {
  entry: NewManualEntry;
  items: NewItem[];
}

/** Format a single amount as a 2dp money string (e.g. 1.5 -> "1.50"). */
export function toAmountString(amount: number): string {
  return (Math.round(amount * 100) / 100).toFixed(2);
}

/** Sum amounts in integer pence (fp-safe), returning a 2dp money string. */
export function sumToAmountString(amounts: readonly number[]): string {
  const pence = amounts.reduce(
    (total, amount) => total + Math.round(amount * 100),
    0,
  );
  return (pence / 100).toFixed(2);
}

/**
 * Resolve a date-only value (YYYY-MM-DD) to a timestamp at noon UTC. Noon keeps
 * the displayed calendar day stable across GMT/BST (Europe/London), since the
 * app stores UTC and renders Europe/London (decision D4).
 */
export function toPurchaseDatetime(purchaseDate: string): Date {
  return new Date(`${purchaseDate}T12:00:00.000Z`);
}

/**
 * Minimal merchant normalization placeholder for item-level analytics. Proper
 * alias normalization is a Milestone 5 concern; for now we lowercase + trim so
 * itemized manual items carry a usable merchant key.
 */
function normalizeMerchant(merchant: string): string {
  return merchant.trim().toLowerCase();
}

/**
 * Build the row values for a manual purchase.
 *
 * - `simple`   -> one `manual_entries` row (itemized_flag = false), no items.
 * - `itemized` -> one `manual_entries` header (itemized_flag = true, amount =
 *   sum of line prices) PLUS one `items` row per line (receipt_id = null,
 *   source_type = 'manual'). The header amount is excluded from the future
 *   unified-spend amount union to avoid double counting (decision D3).
 */
export function buildManualEntryRecords(
  input: ManualEntryInput,
): ManualEntryRecords {
  const purchaseDatetime = toPurchaseDatetime(input.purchaseDate);
  const merchant = input.merchant ?? null;
  const category = input.category ?? null;
  const notes = input.notes ?? null;

  if (input.mode === "simple") {
    return {
      entry: {
        merchant,
        purchaseDatetime,
        amount: toAmountString(input.amount),
        category,
        notes,
        itemizedFlag: false,
      },
      items: [],
    };
  }

  const merchantNameNormalized = merchant ? normalizeMerchant(merchant) : null;
  const itemRows: NewItem[] = input.items.map((line) => ({
    receiptId: null,
    sourceType: "manual",
    itemNameRaw: line.name,
    quantityValue: line.quantity != null ? String(line.quantity) : null,
    price: toAmountString(line.price),
    category,
    merchantNameNormalized,
    purchaseDatetime,
  }));

  return {
    entry: {
      merchant,
      purchaseDatetime,
      amount: sumToAmountString(input.items.map((line) => line.price)),
      category,
      notes,
      itemizedFlag: true,
    },
    items: itemRows,
  };
}
