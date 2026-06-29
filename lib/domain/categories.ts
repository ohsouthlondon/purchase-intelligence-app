/**
 * Seeded purchase categories surfaced in the UI. Stored as free text on
 * receipts/items/manual entries so custom categories are also allowed (D5).
 */
export const DEFAULT_CATEGORIES = [
  "groceries",
  "fuel",
  "transport",
  "household",
  "dining",
  "cash",
  "other",
] as const;

export type DefaultCategory = (typeof DEFAULT_CATEGORIES)[number];
