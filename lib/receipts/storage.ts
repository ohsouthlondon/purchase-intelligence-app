/**
 * Receipt image storage port (Slice 4).
 *
 * The service depends on this abstraction, not on Supabase directly, so
 * production uses the Supabase Storage adapter while tests use an in-process
 * in-memory fake (mirrors the injectable `AppDb` pattern from decision D11).
 */

/** Bytes plus metadata for a single receipt image upload. */
export interface ReceiptStorageUpload {
  /** Object key within the bucket (e.g. `<uuid>.jpg`). */
  objectKey: string;
  /** MIME type of the image. */
  contentType: string;
  /** Raw image bytes (a valid `fetch` body without typed-array generics). */
  body: ArrayBuffer;
}

/** Where a receipt image was persisted. */
export interface StoredReceiptImage {
  /** Bucket the object was written to. */
  bucket: string;
  /** Object key within the bucket. */
  path: string;
  /** Bucket-qualified reference stored on the receipt (`<bucket>/<path>`). */
  reference: string;
}

export interface ReceiptStorage {
  upload(upload: ReceiptStorageUpload): Promise<StoredReceiptImage>;
}
