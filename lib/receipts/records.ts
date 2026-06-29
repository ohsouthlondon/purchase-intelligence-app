import { randomUUID } from "node:crypto";

import { receipts } from "@/lib/db/schema";
import type { ReceiptImageType } from "@/lib/receipts/schema";

/**
 * Pure transforms for the receipt upload flow (Slice 4).
 *
 * No DB or storage access lives here — these functions are deterministic enough
 * to unit test (object-key generation aside, which depends only on a random id).
 */

type NewReceipt = typeof receipts.$inferInsert;

const EXTENSION_BY_TYPE: Record<ReceiptImageType, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/** Map an allowed image MIME type to its file extension (fallback: `bin`). */
export function extensionForContentType(contentType: string): string {
  return EXTENSION_BY_TYPE[contentType as ReceiptImageType] ?? "bin";
}

/** A unique object key for a receipt image within its storage bucket. */
export function buildReceiptObjectKey(contentType: string): string {
  return `${randomUUID()}.${extensionForContentType(contentType)}`;
}

/**
 * Build the `receipts` row for a freshly uploaded image.
 *
 * The receipt starts `pending` OCR with no merchant/date/totals — those are
 * filled by the Milestone 2 parsing/review flow. `sourceImageReference` is the
 * bucket-qualified path the image was stored at (decision D12), so it can be
 * resolved to a signed URL later when there is a screen that displays it.
 */
export function buildReceiptRecord(sourceImageReference: string): NewReceipt {
  return {
    sourceImageUrl: sourceImageReference,
    ocrStatus: "pending",
  };
}
