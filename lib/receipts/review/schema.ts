import { z } from "zod";

import { hasMaxTwoDecimals } from "@/lib/domain/money";

/**
 * Boundary validation for the receipt review form.
 *
 * The user corrects the parsed merchant, date, and totals — and, since the
 * line-item slice, edits or removes individual parsed line items — before the
 * receipt becomes a `reviewed` record. `items` is OPTIONAL on purpose: when it
 * is absent the save touches only the header (the original header-only contract
 * is preserved); when present it is the full surviving set, so anything missing
 * from it is treated as deleted.
 */

const MAX_AMOUNT = 1_000_000;
const MAX_QUANTITY = 100_000;
const MAX_TEXT = 200;
const MAX_NOTES = 1000;
const MAX_ITEMS = 500;

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

const optionalQuantity = z.preprocess(
  (value) =>
    typeof value === "string" && value.trim() === "" ? undefined : value,
  z.coerce
    .number({ invalid_type_error: "Enter a valid quantity." })
    .positive("Quantity must be greater than 0.")
    .max(MAX_QUANTITY, "Quantity is too large.")
    .optional(),
);

const purchaseDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a valid date.")
  .refine((value) => !Number.isNaN(Date.parse(`${value}T12:00:00Z`)), {
    message: "Choose a valid date.",
  });

// One edited line item. `id` ties the correction back to an existing `items`
// row; the service ignores ids that do not belong to the receipt, so a stale or
// forged id can never write across receipts.
export const reviewItemSchema = z.object({
  id: z.string().min(1, "Item id is required.").max(MAX_TEXT),
  itemName: optionalText(MAX_TEXT),
  quantity: optionalQuantity,
  price: optionalAmount,
});

export const reviewReceiptSchema = z.object({
  merchant: optionalText(MAX_TEXT),
  purchaseDate: purchaseDateSchema,
  subtotal: optionalAmount,
  total: optionalAmount,
  tax: optionalAmount,
  notes: optionalText(MAX_NOTES),
  items: z.array(reviewItemSchema).max(MAX_ITEMS).optional(),
});

export type ReviewReceiptInput = z.infer<typeof reviewReceiptSchema>;
export type ReviewItemInput = z.infer<typeof reviewItemSchema>;
