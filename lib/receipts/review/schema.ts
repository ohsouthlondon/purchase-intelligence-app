import { z } from "zod";

/**
 * Boundary validation for the header-only receipt review form (Slice 1).
 *
 * The user corrects the parsed merchant, date, and totals before the receipt
 * becomes a `reviewed` record. Line-item correction is a later Milestone 2
 * slice, so only header fields are accepted here.
 */

const MAX_AMOUNT = 1_000_000;
const MAX_TEXT = 200;
const MAX_NOTES = 1000;

function hasMaxTwoDecimals(value: number): boolean {
  return Math.abs(value * 100 - Math.round(value * 100)) < 1e-9;
}

function optionalText(max: number) {
  return z.preprocess((value) => {
    if (typeof value !== "string") return value;
    const trimmed = value.trim();
    return trimmed.length === 0 ? undefined : trimmed;
  }, z.string().max(max).optional());
}

const optionalAmount = z.preprocess(
  (value) =>
    typeof value === "string" && value.trim() === "" ? undefined : value,
  z.coerce
    .number({ invalid_type_error: "Enter a valid amount." })
    .nonnegative("Amount must be zero or positive.")
    .max(MAX_AMOUNT, "Amount is too large.")
    .refine(hasMaxTwoDecimals, "Use at most 2 decimal places.")
    .optional(),
);

const purchaseDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a valid date.")
  .refine((value) => !Number.isNaN(Date.parse(`${value}T12:00:00Z`)), {
    message: "Choose a valid date.",
  });

export const reviewReceiptSchema = z.object({
  merchant: optionalText(MAX_TEXT),
  purchaseDate: purchaseDateSchema,
  subtotal: optionalAmount,
  total: optionalAmount,
  tax: optionalAmount,
  notes: optionalText(MAX_NOTES),
});

export type ReviewReceiptInput = z.infer<typeof reviewReceiptSchema>;
