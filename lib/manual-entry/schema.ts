import { z } from "zod";

/**
 * Boundary validation for the manual purchase entry flow (Slice 3).
 *
 * A manual purchase is captured in one of two modes:
 * - `simple`   — a non-itemized "total only" purchase (e.g. fuel, parking).
 * - `itemized` — a purchase broken into line items; each line becomes an
 *   `items` row with a null `receipt_id` (decision D3).
 *
 * These schemas are the single source of truth for what the Server Action will
 * trust. Everything downstream (record builders, DB writes) assumes the parsed
 * shape, so all coercion and limits live here.
 */

/** Largest amount we accept for a single purchase or line (sanity bound). */
const MAX_AMOUNT = 1_000_000;
const MAX_TEXT = 200;
const MAX_NOTES = 1000;

/** True when `value` has at most two decimal places (fp-tolerant). */
function hasMaxTwoDecimals(value: number): boolean {
  return Math.abs(value * 100 - Math.round(value * 100)) < 1e-9;
}

/** A positive money amount with at most two decimal places. */
const amountSchema = z.coerce
  .number({ invalid_type_error: "Enter a valid amount." })
  .positive("Amount must be greater than 0.")
  .max(MAX_AMOUNT, "Amount is too large.")
  .refine(hasMaxTwoDecimals, "Use at most 2 decimal places.");

/** Optional free text: blanks become `undefined`, otherwise trimmed + bounded. */
function optionalText(max: number) {
  return z.preprocess((value) => {
    if (typeof value !== "string") return value;
    const trimmed = value.trim();
    return trimmed.length === 0 ? undefined : trimmed;
  }, z.string().max(max).optional());
}

/** A calendar date (YYYY-MM-DD) that resolves to a real day. */
const purchaseDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a valid date.")
  .refine((value) => !Number.isNaN(Date.parse(`${value}T12:00:00Z`)), {
    message: "Choose a valid date.",
  });

/** A single line in an itemized purchase. */
const lineItemSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Item name is required.")
    .max(MAX_TEXT, "Item name is too long."),
  price: amountSchema,
  quantity: z.coerce
    .number()
    .positive("Quantity must be greater than 0.")
    .max(MAX_AMOUNT, "Quantity is too large.")
    .optional(),
});

const baseFields = {
  merchant: optionalText(MAX_TEXT),
  purchaseDate: purchaseDateSchema,
  category: optionalText(MAX_TEXT),
  notes: optionalText(MAX_NOTES),
};

const simpleEntrySchema = z.object({
  mode: z.literal("simple"),
  ...baseFields,
  amount: amountSchema,
});

const itemizedEntrySchema = z.object({
  mode: z.literal("itemized"),
  ...baseFields,
  items: z
    .array(lineItemSchema)
    .min(1, "Add at least one item.")
    .max(100, "Too many items."),
});

export const manualEntryFormSchema = z.discriminatedUnion("mode", [
  simpleEntrySchema,
  itemizedEntrySchema,
]);

export type ManualEntryInput = z.infer<typeof manualEntryFormSchema>;
export type ManualLineItemInput = z.infer<typeof lineItemSchema>;
