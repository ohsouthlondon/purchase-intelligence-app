import type { ReceiptParser } from "@/lib/receipts/parsing/parser";

/**
 * Deterministic placeholder parser (Milestone 2, Slice 1).
 *
 * Returns a fixed, internally consistent structured receipt **without reading
 * the image**. It exists only to exercise the parse → review → save seam end to
 * end before a real OCR provider is wired in (Slice 2), and must not ship as the
 * production parser. Values are deliberately low-confidence to reinforce that
 * the human review step is where the trustworthy record is created.
 */
export function createStubReceiptParser(): ReceiptParser {
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
            price: 1.85,
            quantity: 1,
            confidence: 0.6,
          },
          {
            rawText: "WHOLEMEAL BREAD",
            name: "Bread",
            price: 1.1,
            quantity: 1,
            confidence: 0.55,
          },
          {
            rawText: "BANANAS LOOSE",
            name: "Bananas",
            price: 1.35,
            quantity: 1,
            confidence: 0.4,
          },
        ],
      };
    },
  };
}
