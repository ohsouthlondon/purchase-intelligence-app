import type { AppDb } from "@/lib/db";
import { receipts } from "@/lib/db/schema";
import {
  buildReceiptObjectKey,
  buildReceiptRecord,
} from "@/lib/receipts/records";
import type { ReceiptUploadInput } from "@/lib/receipts/schema";
import type { ReceiptStorage } from "@/lib/receipts/storage";

/**
 * Data-access for receipt image uploads (Slice 4).
 *
 * Both the db and the storage backend are injected so production uses the
 * Supabase-backed singleton + Supabase Storage, while tests use an in-process
 * PGlite db and an in-memory fake storage (decisions D11, D13).
 */

export interface ReceiptUploadDeps {
  db: AppDb;
  storage: ReceiptStorage;
}

export interface CreateReceiptUploadResult {
  receiptId: string;
  imageReference: string;
}

/**
 * Persist a validated receipt image: upload the bytes, then insert a `receipts`
 * row referencing the stored object in `pending` OCR state.
 *
 * The image is uploaded before the row is written, so a storage failure leaves
 * no dangling receipt. A DB failure after a successful upload can leave an
 * orphan object; for a single-user app that is an acceptable, low-frequency
 * trade-off and a storage-cleanup pass is a later concern.
 */
export async function createReceiptUpload(
  { db, storage }: ReceiptUploadDeps,
  input: ReceiptUploadInput,
): Promise<CreateReceiptUploadResult> {
  const { image } = input;
  const body = await image.arrayBuffer();
  const objectKey = buildReceiptObjectKey(image.type);

  const stored = await storage.upload({
    objectKey,
    contentType: image.type,
    body,
  });

  const [row] = await db
    .insert(receipts)
    .values(buildReceiptRecord(stored.reference))
    .returning({ id: receipts.id });

  return { receiptId: row.id, imageReference: stored.reference };
}
