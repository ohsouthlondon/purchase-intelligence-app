import { items, receipts } from "@/lib/db/schema";
import { toNoonUtc } from "@/lib/domain/datetime";
import { normalizeMerchant } from "@/lib/domain/merchant";
import { toAmountString } from "@/lib/domain/money";
import type { ParsedReceipt } from "@/lib/receipts/parsing/parsed-receipt";

/**
 * Pure transforms from validated parser output to DB row values (Slice 1).
 *
 * No DB access lives here — deterministic and unit-testable. Money is formatted
 * as a fixed 2dp string and confidence as a 4dp string for the NUMERIC columns
 * (Drizzle represents NUMERIC as `string`). Date-only values are stored at noon
 * UTC so the displayed Europe/London day is stable across GMT/BST (decision D9).
 */

type ReceiptUpdate = Partial<typeof receipts.$inferInsert>;
type NewItem = typeof items.$inferInsert;

function toConfidenceString(value: number): string {
  return value.toFixed(4);
}

function money(value: number | null | undefined): string | null {
  return value == null ? null : toAmountString(value);
}

function confidence(value: number | null | undefined): string | null {
  return value == null ? null : toConfidenceString(value);
}

/** Header fields to write onto the receipt, transitioning it to `parsed`. */
export function buildParsedReceiptUpdate(parsed: ParsedReceipt): ReceiptUpdate {
  const merchant = parsed.merchantName ?? null;
  return {
    merchantNameRaw: merchant,
    merchantNameNormalized: merchant ? normalizeMerchant(merchant) : null,
    purchaseDatetime: parsed.purchaseDate
      ? toNoonUtc(parsed.purchaseDate)
      : null,
    subtotal: money(parsed.subtotal),
    total: money(parsed.total),
    tax: money(parsed.tax),
    parseConfidence: confidence(parsed.confidence),
    ocrStatus: "parsed",
    ...(parsed.currency ? { currency: parsed.currency } : {}),
  };
}

/** One `items` row per parsed line, denormalized for standalone analytics. */
export function buildParsedItemRows(
  receiptId: string,
  parsed: ParsedReceipt,
): NewItem[] {
  const merchantNameNormalized = parsed.merchantName
    ? normalizeMerchant(parsed.merchantName)
    : null;
  const purchaseDatetime = parsed.purchaseDate
    ? toNoonUtc(parsed.purchaseDate)
    : null;

  return parsed.lineItems.map((line) => ({
    receiptId,
    sourceType: "receipt",
    rawLineText: line.rawText,
    itemNameRaw: line.name ?? null,
    // Persist the per-unit price; the line total (`totalPrice`) is not stored yet.
    price: money(line.unitPrice),
    quantityValue: line.quantity != null ? String(line.quantity) : null,
    confidence: confidence(line.confidence),
    merchantNameNormalized,
    purchaseDatetime,
  }));
}
