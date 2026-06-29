import { z } from "zod";

/**
 * Boundary validation for the receipt image upload flow (Slice 4).
 *
 * The Server Action receives an untrusted `File` from the browser via FormData.
 * This schema is the single source of truth for what we will accept before any
 * upload or DB write happens: a non-empty image of an allowed type within a
 * sane size bound. OCR/parsing is out of scope here — uploaded receipts are
 * persisted in `pending` state for the Milestone 2 parsing flow.
 */

/** Allowed receipt image MIME types (decision D6: standard web image types). */
export const RECEIPT_ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export type ReceiptImageType = (typeof RECEIPT_ALLOWED_TYPES)[number];

/** Largest receipt image we accept (10 MB sanity bound). */
export const RECEIPT_MAX_BYTES = 10 * 1024 * 1024;

const allowedTypes = new Set<string>(RECEIPT_ALLOWED_TYPES);

const receiptImageSchema = z
  .instanceof(File, { message: "Choose a receipt image to upload." })
  .refine((file) => file.size > 0, "The selected file is empty.")
  .refine(
    (file) => file.size <= RECEIPT_MAX_BYTES,
    "Image must be 10 MB or smaller.",
  )
  .refine(
    (file) => allowedTypes.has(file.type),
    "Use a JPEG, PNG, or WebP image.",
  );

export const receiptUploadSchema = z.object({
  image: receiptImageSchema,
});

export type ReceiptUploadInput = z.infer<typeof receiptUploadSchema>;
