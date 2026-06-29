import { describe, expect, it } from "vitest";

import { parsedReceiptSchema } from "@/lib/receipts/parsing/parsed-receipt";

const valid = {
  merchantName: "Tesco",
  purchaseDate: "2026-06-10",
  subtotal: 4.3,
  tax: 0.2,
  total: 4.5,
  currency: "GBP",
  confidence: 0.5,
  lineItems: [
    {
      rawText: "MILK",
      name: "Milk",
      price: 1.85,
      quantity: 1,
      confidence: 0.6,
    },
  ],
};

describe("parsedReceiptSchema", () => {
  it("accepts well-formed parser output", () => {
    expect(parsedReceiptSchema.safeParse(valid).success).toBe(true);
  });

  it("accepts minimal output with empty line items", () => {
    expect(parsedReceiptSchema.safeParse({ lineItems: [] }).success).toBe(true);
  });

  it("rejects a negative price", () => {
    expect(
      parsedReceiptSchema.safeParse({
        ...valid,
        lineItems: [{ rawText: "X", price: -1 }],
      }).success,
    ).toBe(false);
  });

  it("rejects money with more than two decimal places", () => {
    expect(
      parsedReceiptSchema.safeParse({ ...valid, total: 4.555 }).success,
    ).toBe(false);
  });

  it("rejects confidence above 1", () => {
    expect(
      parsedReceiptSchema.safeParse({ ...valid, confidence: 1.5 }).success,
    ).toBe(false);
  });

  it("rejects a line item with empty raw text", () => {
    expect(
      parsedReceiptSchema.safeParse({ lineItems: [{ rawText: "" }] }).success,
    ).toBe(false);
  });

  it("rejects an invalid calendar date", () => {
    expect(
      parsedReceiptSchema.safeParse({ ...valid, purchaseDate: "2026-13-40" })
        .success,
    ).toBe(false);
  });
});
