// @vitest-environment node
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { and, eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type { AppDb } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { parseReceipt } from "@/lib/receipts/parsing/service";
import { createStubReceiptParser } from "@/lib/receipts/parsing/stub-parser";
import type { ReceiptParser } from "@/lib/receipts/parsing/parser";

const client = new PGlite();
const drizzleDb = drizzle(client, { schema });
const db = drizzleDb as unknown as AppDb;

beforeAll(async () => {
  await migrate(drizzleDb, { migrationsFolder: "./drizzle" });
});

afterAll(async () => {
  await client.close();
});

async function insertPendingReceipt(): Promise<string> {
  const [row] = await drizzleDb
    .insert(schema.receipts)
    .values({ sourceImageUrl: "receipts/test.jpg", ocrStatus: "pending" })
    .returning({ id: schema.receipts.id });
  return row.id;
}

async function receiptItems(receiptId: string) {
  return drizzleDb
    .select()
    .from(schema.items)
    .where(
      and(
        eq(schema.items.receiptId, receiptId),
        eq(schema.items.sourceType, "receipt"),
      ),
    );
}

async function getReceipt(receiptId: string) {
  const [row] = await drizzleDb
    .select()
    .from(schema.receipts)
    .where(eq(schema.receipts.id, receiptId));
  return row;
}

describe("parseReceipt", () => {
  it("parses a pending receipt into header fields + item rows", async () => {
    const id = await insertPendingReceipt();
    const result = await parseReceipt(
      { db, parser: createStubReceiptParser() },
      id,
    );

    expect(result.status).toBe("parsed");
    const receipt = await getReceipt(id);
    expect(receipt.ocrStatus).toBe("parsed");
    expect(receipt.merchantNameRaw).toBe("Sample Store");
    expect(receipt.total).toBe("4.50");
    expect(receipt.parseConfidence).toBe("0.5000");

    const its = await receiptItems(id);
    expect(its).toHaveLength(3);
    expect(its.every((item) => item.sourceType === "receipt")).toBe(true);
  });

  it("is idempotent on re-parse (replaces items, no duplicates)", async () => {
    const id = await insertPendingReceipt();
    await parseReceipt({ db, parser: createStubReceiptParser() }, id);
    await parseReceipt({ db, parser: createStubReceiptParser() }, id);
    expect(await receiptItems(id)).toHaveLength(3);
  });

  it("marks the receipt failed when the parser throws and writes no items", async () => {
    const id = await insertPendingReceipt();
    const failing: ReceiptParser = {
      async parse() {
        throw new Error("ocr boom");
      },
    };

    const result = await parseReceipt({ db, parser: failing }, id);

    expect(result.status).toBe("failed");
    const receipt = await getReceipt(id);
    expect(receipt.ocrStatus).toBe("failed");
    expect(receipt.notes).toContain("ocr boom");
    expect(await receiptItems(id)).toHaveLength(0);
  });

  it("marks failed when parser output fails schema validation", async () => {
    const id = await insertPendingReceipt();
    const badParser: ReceiptParser = {
      async parse() {
        return { lineItems: [{ rawText: "X", price: -5 }] };
      },
    };

    const result = await parseReceipt({ db, parser: badParser }, id);

    expect(result.status).toBe("failed");
    expect((await getReceipt(id)).ocrStatus).toBe("failed");
    expect(await receiptItems(id)).toHaveLength(0);
  });

  it("does not clobber an already-reviewed receipt", async () => {
    const id = await insertPendingReceipt();
    await drizzleDb
      .update(schema.receipts)
      .set({
        reviewStatus: "reviewed",
        ocrStatus: "reviewed",
        merchantNameRaw: "My Edit",
      })
      .where(eq(schema.receipts.id, id));

    const result = await parseReceipt(
      { db, parser: createStubReceiptParser() },
      id,
    );

    expect(result.status).toBe("reviewed");
    expect((await getReceipt(id)).merchantNameRaw).toBe("My Edit");
  });
});
