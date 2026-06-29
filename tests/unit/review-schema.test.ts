import { describe, expect, it } from "vitest";

import { reviewReceiptSchema } from "@/lib/receipts/review/schema";

const valid = { purchaseDate: "2026-06-10", merchant: "Tesco", total: "4.50" };

describe("reviewReceiptSchema", () => {
  it("accepts a valid header", () => {
    expect(reviewReceiptSchema.safeParse(valid).success).toBe(true);
  });

  it("coerces money strings to numbers", () => {
    const result = reviewReceiptSchema.parse(valid);
    expect(result.total).toBe(4.5);
  });

  it("treats blank optional money as undefined", () => {
    const result = reviewReceiptSchema.parse({
      ...valid,
      subtotal: "",
      tax: "",
    });
    expect(result.subtotal).toBeUndefined();
    expect(result.tax).toBeUndefined();
  });

  it("requires a valid date", () => {
    expect(
      reviewReceiptSchema.safeParse({ ...valid, purchaseDate: "nope" }).success,
    ).toBe(false);
  });

  it("rejects money with more than two decimal places", () => {
    expect(
      reviewReceiptSchema.safeParse({ ...valid, total: "4.555" }).success,
    ).toBe(false);
  });

  it("rejects negative money", () => {
    expect(
      reviewReceiptSchema.safeParse({ ...valid, total: "-1" }).success,
    ).toBe(false);
  });
});
