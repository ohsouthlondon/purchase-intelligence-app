import { describe, expect, it } from "vitest";

import { parsedReceiptSchema } from "@/lib/receipts/parsing/parsed-receipt";
import { createStubReceiptParser } from "@/lib/receipts/parsing/stub-parser";

describe("createStubReceiptParser", () => {
  it("returns deterministic output that satisfies the parsed schema", async () => {
    const parser = createStubReceiptParser();
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
