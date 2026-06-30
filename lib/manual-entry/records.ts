import { items, manualEntries } from "@/lib/db/schema";
import { toNoonUtc } from "@/lib/domain/datetime";
import { normalizeMerchant } from "@/lib/domain/merchant";
import { toAmountString } from "@/lib/domain/money";
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

/** Sum amounts in integer pence (fp-safe), returning a 2dp money string. */
export function sumToAmountString(amounts: readonly number[]): string {
  const pence = amounts.reduce(
    (total, amount) => total + Math.round(amount * 100),
    0,
  );
  return (pence / 100).toFixed(2);
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
  const purchaseDatetime = toNoonUtc(input.purchaseDate);
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
