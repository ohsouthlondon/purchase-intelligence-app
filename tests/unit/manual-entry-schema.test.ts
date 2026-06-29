import { describe, expect, it } from "vitest";

import { manualEntryFormSchema } from "@/lib/manual-entry/schema";

describe("manualEntryFormSchema", () => {
  const validSimple = {
    mode: "simple",
    purchaseDate: "2026-06-29",
    amount: "12.50",
  };

  it("accepts a minimal non-itemized entry", () => {
    const result = manualEntryFormSchema.safeParse(validSimple);
    expect(result.success).toBe(true);
  });

  it("coerces string amounts to numbers", () => {
    const result = manualEntryFormSchema.parse(validSimple);
    if (result.mode !== "simple") throw new Error("expected simple mode");
    expect(result.amount).toBe(12.5);
  });

  it("treats blank optional text as undefined", () => {
    const result = manualEntryFormSchema.parse({
      ...validSimple,
      merchant: "   ",
      category: "",
      notes: "",
    });
    expect(result.merchant).toBeUndefined();
    expect(result.category).toBeUndefined();
    expect(result.notes).toBeUndefined();
  });

  it("rejects a non-positive amount", () => {
    const result = manualEntryFormSchema.safeParse({
      ...validSimple,
      amount: "0",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an amount with more than two decimal places", () => {
    const result = manualEntryFormSchema.safeParse({
      ...validSimple,
      amount: "1.999",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid date", () => {
    const result = manualEntryFormSchema.safeParse({
      ...validSimple,
      purchaseDate: "2026-13-40",
    });
    expect(result.success).toBe(false);
  });

  it("accepts an itemized entry with one or more lines", () => {
    const result = manualEntryFormSchema.safeParse({
      mode: "itemized",
      purchaseDate: "2026-06-29",
      merchant: "Tesco",
      items: [
        { name: "Milk", price: "1.85", quantity: "2" },
        { name: "Bread", price: "1.10" },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("rejects an itemized entry with no items", () => {
    const result = manualEntryFormSchema.safeParse({
      mode: "itemized",
      purchaseDate: "2026-06-29",
      items: [],
    });
    expect(result.success).toBe(false);
  });

  it("rejects an itemized line with a blank name", () => {
    const result = manualEntryFormSchema.safeParse({
      mode: "itemized",
      purchaseDate: "2026-06-29",
      items: [{ name: "  ", price: "1.00" }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects an unknown mode", () => {
    const result = manualEntryFormSchema.safeParse({
      mode: "bogus",
      purchaseDate: "2026-06-29",
      amount: "1.00",
    });
    expect(result.success).toBe(false);
  });
});
