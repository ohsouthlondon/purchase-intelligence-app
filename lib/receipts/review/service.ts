import { and, eq, notInArray } from "drizzle-orm";

import type { AppDb } from "@/lib/db";
import { items, receipts } from "@/lib/db/schema";
import { toNoonUtc } from "@/lib/domain/datetime";
import { normalizeMerchant } from "@/lib/domain/merchant";
import { toAmountString } from "@/lib/domain/money";
import type { ReviewReceiptInput } from "@/lib/receipts/review/schema";

/**
 * Persist a reviewed receipt (Milestone 2).
 *
 * Writes the user's corrected header fields, reconciles the parsed line items
 * with the user's edits and deletions, and transitions the receipt to the final
 * reviewed state (`ocr_status = 'reviewed'`, `review_status = 'reviewed'`). The
 * header update and item reconciliation run in ONE transaction so a partial
 * failure can never leave a half-saved review.
 *
 * `input.items`, when present, is the full surviving set: rows missing from it
 * are deleted, and item updates are scoped to this receipt so a stale or forged
 * id can never write across receipts. When `input.items` is absent the line
 * items are left untouched (the original header-only contract).
 */

function money(value: number | undefined): string | null {
  return value == null ? null : toAmountString(value);
}

function quantity(value: number | undefined): string | null {
  return value == null ? null : String(value);
}

export async function saveReviewedReceipt(
  db: AppDb,
  receiptId: string,
  input: ReviewReceiptInput,
): Promise<void> {
  const merchant = input.merchant ?? null;
  const editedItems = input.items;

  await db.transaction(async (tx) => {
    const updated = await tx
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

    if (!editedItems) return;

    const scope = and(
      eq(items.receiptId, receiptId),
      eq(items.sourceType, "receipt"),
    );
    const survivingIds = editedItems.map((item) => item.id);

    // Delete any receipt line the user removed during review. With no
    // survivors, drop them all (an empty `notInArray` is invalid SQL).
    await tx
      .delete(items)
      .where(
        survivingIds.length > 0
          ? and(scope, notInArray(items.id, survivingIds))
          : scope,
      );

    // Apply corrections to the survivors, each scoped to this receipt.
    for (const item of editedItems) {
      await tx
        .update(items)
        .set({
          itemNameRaw: item.itemName ?? null,
          price: money(item.price),
          quantityValue: quantity(item.quantity),
          updatedAt: new Date(),
        })
        .where(and(eq(items.id, item.id), scope));
    }
  });
}
