/**
 * Receipt parsing port (Milestone 2, Slice 1).
 *
 * Mirrors the injectable-dependency pattern used for the database (`AppDb`,
 * D11) and storage (`ReceiptStorage`, D13): the pipeline depends on this
 * abstraction so a stub drives dev/test today and a real OCR/vision provider
 * drops in behind it in Slice 2.
 *
 * `parse` returns `unknown` on purpose — the result comes from an external
 * system and must be validated with `parsedReceiptSchema` at the boundary
 * before it is trusted or persisted.
 */

export interface ReceiptParserInput {
  /** The receipt being parsed (handy for provider-side correlation/logging). */
  receiptId: string;
  /** Bucket-qualified image reference stored on the receipt (`<bucket>/<key>`). */
  imageReference: string;
}

export interface ReceiptParser {
  parse(input: ReceiptParserInput): Promise<unknown>;
}
