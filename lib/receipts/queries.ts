import { and, asc, eq } from "drizzle-orm";

import type { AppDb } from "@/lib/db";
import { items, receipts } from "@/lib/db/schema";

/**
 * Read helpers for the receipt review flow (Milestone 2, Slice 1).
 */

export type ReceiptRow = typeof receipts.$inferSelect;
export type ItemRow = typeof items.$inferSelect;

export interface ReceiptWithItems {
  receipt: ReceiptRow;
  items: ItemRow[];
}

/** Load a receipt with its receipt-sourced line items, or null if not found. */
export async function getReceiptWithItems(
  db: AppDb,
  receiptId: string,
): Promise<ReceiptWithItems | null> {
  const [receipt] = await db
    .select()
    .from(receipts)
    .where(eq(receipts.id, receiptId));

  if (!receipt) return null;

  const rows = await db
    .select()
    .from(items)
    .where(and(eq(items.receiptId, receiptId), eq(items.sourceType, "receipt")))
    .orderBy(asc(items.createdAt));

  return { receipt, items: rows };
}
