import { eq } from "drizzle-orm";

import type { AppDb } from "@/lib/db";
import { receipts } from "@/lib/db/schema";
import { toNoonUtc } from "@/lib/domain/datetime";
import { normalizeMerchant } from "@/lib/domain/merchant";
import { toAmountString } from "@/lib/domain/money";
import type { ReviewReceiptInput } from "@/lib/receipts/review/schema";

/**
 * Persist a reviewed receipt header (Milestone 2, Slice 1).
 *
 * Writes the user's corrected header fields and transitions the receipt to the
 * final reviewed state (`ocr_status = 'reviewed'`, `review_status = 'reviewed'`).
 * Line items are read-only in this slice, so they are left untouched here.
 */

function money(value: number | undefined): string | null {
  return value == null ? null : toAmountString(value);
}

export async function saveReviewedReceipt(
  db: AppDb,
  receiptId: string,
  input: ReviewReceiptInput,
): Promise<void> {
  const merchant = input.merchant ?? null;

  const updated = await db
    .update(receipts)
    .set({
      merchantNameRaw: merchant,
      merchantNameNormalized: merchant ? normalizeMerchant(merchant) : null,
      purchaseDatetime: toNoonUtc(input.purchaseDate),
      subtotal: money(input.subtotal),
      total: money(input.total),
      tax: money(input.tax),
      notes: input.notes ?? null,
      ocrStatus: "reviewed",
      reviewStatus: "reviewed",
      updatedAt: new Date(),
    })
    .where(eq(receipts.id, receiptId))
    .returning({ id: receipts.id });

  if (updated.length === 0) {
    throw new Error(`Receipt ${receiptId} not found.`);
  }
}
