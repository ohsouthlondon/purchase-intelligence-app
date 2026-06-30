import { describe, expect, it } from "vitest";

import { parsedReceiptSchema } from "@/lib/receipts/parsing/parsed-receipt";
import { createMockReceiptParser } from "@/lib/receipts/parsing/mock-parser";

describe("createMockReceiptParser", () => {
  it("returns deterministic output that satisfies the parsed schema", async () => {
    const parser = createMockReceiptParser();
    const first = await parser.parse({
      receiptId: "r1",
      imageReference: "receipts/a.jpg",
    });
    const second = await parser.parse({
      receiptId: "r2",
      imageReference: "receipts/b.jpg",
    });

    expect(first).toEqual(second);
    expect(parsedReceiptSchema.safeParse(first).success).toBe(true);
  });
});
