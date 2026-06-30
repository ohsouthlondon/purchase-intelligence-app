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

  it("leaves items undefined when none are provided", () => {
    expect(reviewReceiptSchema.parse(valid).items).toBeUndefined();
  });

  it("accepts and coerces edited line items", () => {
    const result = reviewReceiptSchema.parse({
      ...valid,
      items: [{ id: "i1", itemName: "Milk", quantity: "2", price: "1.85" }],
    });
    expect(result.items?.[0]).toMatchObject({
      id: "i1",
      itemName: "Milk",
      quantity: 2,
      price: 1.85,
    });
  });

  it("treats blank item name, quantity, and price as undefined", () => {
    const result = reviewReceiptSchema.parse({
      ...valid,
      items: [{ id: "i1", itemName: "", quantity: "", price: "" }],
    });
    expect(result.items?.[0].id).toBe("i1");
    expect(result.items?.[0].itemName).toBeUndefined();
    expect(result.items?.[0].quantity).toBeUndefined();
    expect(result.items?.[0].price).toBeUndefined();
  });

  it("rejects an item with a blank id", () => {
    expect(
      reviewReceiptSchema.safeParse({
        ...valid,
        items: [{ id: "", price: "1.00" }],
      }).success,
    ).toBe(false);
  });

  it("rejects an item price with more than two decimals", () => {
    expect(
      reviewReceiptSchema.safeParse({
        ...valid,
        items: [{ id: "i1", price: "1.234" }],
      }).success,
    ).toBe(false);
  });

  it("rejects a non-positive item quantity", () => {
    expect(
      reviewReceiptSchema.safeParse({
        ...valid,
        items: [{ id: "i1", quantity: "0" }],
      }).success,
    ).toBe(false);
  });
});
