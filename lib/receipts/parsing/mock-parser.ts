import type { ReceiptParser } from "@/lib/receipts/parsing/parser";

/**
 * Mock receipt parser (Milestone 2).
 *
 * Returns fixed, internally consistent structured receipt data **without reading
 * the image**. It is the local/dev default and the fallback the live adapter
 * degrades to when the provider is unavailable or fails (see `createReceiptParser`).
 * Values are deliberately low-confidence to reinforce that the human review step
 * is where the trustworthy record is created.
 */
export function createMockReceiptParser(): ReceiptParser {
  return {
    async parse() {
      return {
        merchantName: "Sample Store",
        purchaseDate: "2026-06-01",
        subtotal: 4.3,
        tax: 0.2,
        total: 4.5,
        currency: "GBP",
        confidence: 0.5,
        lineItems: [
          {
            rawText: "MILK 2L",
            name: "Milk",
            quantity: 1,
            unitPrice: 1.85,
            totalPrice: 1.85,
            confidence: 0.6,
          },
          {
            rawText: "WHOLEMEAL BREAD",
            name: "Bread",
            quantity: 1,
            unitPrice: 1.1,
            totalPrice: 1.1,
            confidence: 0.55,
          },
          {
            rawText: "BANANAS LOOSE",
            name: "Bananas",
            quantity: 1,
            unitPrice: 1.35,
            totalPrice: 1.35,
            confidence: 0.4,
          },
        ],
      };
    },
  };
}
