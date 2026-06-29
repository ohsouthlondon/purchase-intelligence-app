import { describe, expect, it } from "vitest";

import { parsedReceiptSchema } from "@/lib/receipts/parsing/parsed-receipt";
import {
  buildParsedItemRows,
  buildParsedReceiptUpdate,
} from "@/lib/receipts/parsing/records";

const parsed = parsedReceiptSchema.parse({
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
      quantity: 2,
      confidence: 0.6,
    },
  ],
});

describe("buildParsedReceiptUpdate", () => {
  const update = buildParsedReceiptUpdate(parsed);

  it("maps header fields and sets parsed status", () => {
    expect(update.ocrStatus).toBe("parsed");
    expect(update.merchantNameRaw).toBe("Tesco");
    expect(update.merchantNameNormalized).toBe("tesco");
    expect(update.subtotal).toBe("4.30");
    expect(update.total).toBe("4.50");
    expect(update.tax).toBe("0.20");
    expect(update.parseConfidence).toBe("0.5000");
    expect(update.purchaseDatetime?.toISOString()).toBe(
      "2026-06-10T12:00:00.000Z",
    );
  });
});

describe("buildParsedItemRows", () => {
  const rows = buildParsedItemRows("receipt-1", parsed);

  it("creates one receipt-sourced row per parsed line", () => {
    expect(rows).toHaveLength(1);
    const [milk] = rows;
    expect(milk.receiptId).toBe("receipt-1");
    expect(milk.sourceType).toBe("receipt");
    expect(milk.rawLineText).toBe("MILK");
    expect(milk.itemNameRaw).toBe("Milk");
    expect(milk.price).toBe("1.85");
    expect(milk.quantityValue).toBe("2");
    expect(milk.confidence).toBe("0.6000");
    expect(milk.merchantNameNormalized).toBe("tesco");
    expect(milk.purchaseDatetime?.toISOString()).toBe(
      "2026-06-10T12:00:00.000Z",
    );
  });
});
