import { z } from "zod";

/**
 * Boundary contract for parser output (Milestone 2, Slice 1).
 *
 * A `ReceiptParser` talks to an external OCR/parsing system, so its result is
 * untrusted: the parse pipeline validates it with this schema **before** any
 * persistence. The shape is intentionally permissive about presence (real
 * receipts are messy — fields may be missing) but strict about types, ranges,
 * and money precision so nothing malformed reaches the database.
 */

const MAX_AMOUNT = 1_000_000;
const MAX_RAW_TEXT = 500;
const MAX_NAME = 200;

/** True when `value` has at most two decimal places (fp-tolerant). */
function hasMaxTwoDecimals(value: number): boolean {
  return Math.abs(value * 100 - Math.round(value * 100)) < 1e-9;
}

const moneyValue = z
  .number()
  .nonnegative("Money must be zero or positive.")
  .max(MAX_AMOUNT, "Money value is too large.")
  .refine(hasMaxTwoDecimals, "Use at most 2 decimal places.");

const optionalMoney = moneyValue.nullable().optional();
const optionalConfidence = z.number().min(0).max(1).nullable().optional();

const optionalDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD.")
  .refine((value) => !Number.isNaN(Date.parse(`${value}T12:00:00Z`)), {
    message: "Date is not a real calendar day.",
  })
  .nullable()
  .optional();

export const parsedLineItemSchema = z.object({
  rawText: z
    .string()
    .trim()
    .min(1, "Raw line text is required.")
    .max(MAX_RAW_TEXT),
  name: z.string().trim().max(MAX_NAME).nullable().optional(),
  price: optionalMoney,
  quantity: z
    .number()
    .positive("Quantity must be greater than 0.")
    .max(MAX_AMOUNT)
    .nullable()
    .optional(),
  confidence: optionalConfidence,
});

export const parsedReceiptSchema = z.object({
  merchantName: z.string().trim().max(MAX_NAME).nullable().optional(),
  purchaseDate: optionalDate,
  subtotal: optionalMoney,
  total: optionalMoney,
  tax: optionalMoney,
  currency: z.string().trim().max(8).nullable().optional(),
  confidence: optionalConfidence,
  lineItems: z.array(parsedLineItemSchema).max(500),
});

export type ParsedReceipt = z.infer<typeof parsedReceiptSchema>;
export type ParsedLineItem = z.infer<typeof parsedLineItemSchema>;
