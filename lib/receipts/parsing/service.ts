import { and, eq } from "drizzle-orm";

import type { AppDb } from "@/lib/db";
import { items, receipts } from "@/lib/db/schema";
import {
  parsedReceiptSchema,
  type ParsedReceipt,
} from "@/lib/receipts/parsing/parsed-receipt";
import {
  buildParsedItemRows,
  buildParsedReceiptUpdate,
} from "@/lib/receipts/parsing/records";
import type { ReceiptParser } from "@/lib/receipts/parsing/parser";

/**
 * Parse pipeline for an uploaded receipt (Milestone 2, Slice 1).
 *
 * Loads a receipt, runs the injected parser, validates the (untrusted) output
 * with Zod, then persists the parsed header and line items. The whole
 * replace-and-update — header update + delete prior receipt items + reinsert —
 * runs inside ONE transaction so re-parsing can never leave deleted-but-not-
 * reinserted state. Parser/validation failures mark the receipt `failed`.
 */

const MAX_FAILURE_NOTE = 1000;

export interface ParseReceiptDeps {
  db: AppDb;
  parser: ReceiptParser;
}

export interface ParseReceiptResult {
  status: "parsed" | "reviewed" | "failed";
  message: string;
}

async function markFailed(
  db: AppDb,
  receiptId: string,
  reason: string,
): Promise<void> {
  await db
    .update(receipts)
    .set({
      ocrStatus: "failed",
      notes: reason.slice(0, MAX_FAILURE_NOTE),
      updatedAt: new Date(),
    })
    .where(eq(receipts.id, receiptId));
}

export async function parseReceipt(
  { db, parser }: ParseReceiptDeps,
  receiptId: string,
): Promise<ParseReceiptResult> {
  const [receipt] = await db
    .select({
      id: receipts.id,
      sourceImageUrl: receipts.sourceImageUrl,
      reviewStatus: receipts.reviewStatus,
    })
    .from(receipts)
    .where(eq(receipts.id, receiptId));

  if (!receipt) {
    throw new Error(`Receipt ${receiptId} not found.`);
  }

  // Never clobber a record the user has already reviewed and corrected.
  if (receipt.reviewStatus === "reviewed") {
    return {
      status: "reviewed",
      message: "This receipt has already been reviewed.",
    };
  }

  if (!receipt.sourceImageUrl) {
    await markFailed(db, receiptId, "No source image to parse.");
    return { status: "failed", message: "This receipt has no image to parse." };
  }

  let parsed: ParsedReceipt;
  try {
    const raw = await parser.parse({
      receiptId,
      imageReference: receipt.sourceImageUrl,
    });
    parsed = parsedReceiptSchema.parse(raw);
  } catch (error) {
    console.error("Receipt parse failed", error);
    const reason =
      error instanceof Error ? error.message : "Unknown parser error";
    await markFailed(db, receiptId, reason);
    return {
      status: "failed",
      message:
        "Could not read this receipt. Re-try parsing or add it manually.",
    };
  }

  const headerUpdate = buildParsedReceiptUpdate(parsed);
  const itemRows = buildParsedItemRows(receiptId, parsed);

  await db.transaction(async (tx) => {
    await tx
      .update(receipts)
      .set({ ...headerUpdate, updatedAt: new Date() })
      .where(eq(receipts.id, receiptId));

    await tx
      .delete(items)
      .where(
        and(eq(items.receiptId, receiptId), eq(items.sourceType, "receipt")),
      );

    if (itemRows.length > 0) {
      await tx.insert(items).values(itemRows);
    }
  });

  return {
    status: "parsed",
    message: "Receipt parsed. Review and correct the details below.",
  };
}
