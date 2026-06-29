// @vitest-environment node
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type { AppDb } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { saveReviewedReceipt } from "@/lib/receipts/review/service";

const client = new PGlite();
const drizzleDb = drizzle(client, { schema });
const db = drizzleDb as unknown as AppDb;

beforeAll(async () => {
  await migrate(drizzleDb, { migrationsFolder: "./drizzle" });
});

afterAll(async () => {
  await client.close();
});

describe("saveReviewedReceipt", () => {
  it("persists header edits and marks the receipt reviewed", async () => {
    const [row] = await drizzleDb
      .insert(schema.receipts)
      .values({
        sourceImageUrl: "receipts/r.jpg",
        ocrStatus: "parsed",
        merchantNameRaw: "Old",
      })
      .returning({ id: schema.receipts.id });

    await saveReviewedReceipt(db, row.id, {
      merchant: "Tesco",
      purchaseDate: "2026-06-10",
      subtotal: 4.3,
      total: 4.5,
      tax: 0.2,
      notes: "looks right",
    });

    const [receipt] = await drizzleDb
      .select()
      .from(schema.receipts)
      .where(eq(schema.receipts.id, row.id));

    expect(receipt.ocrStatus).toBe("reviewed");
    expect(receipt.reviewStatus).toBe("reviewed");
    expect(receipt.merchantNameRaw).toBe("Tesco");
    expect(receipt.merchantNameNormalized).toBe("tesco");
    expect(receipt.total).toBe("4.50");
    expect(receipt.purchaseDatetime?.toISOString()).toBe(
      "2026-06-10T12:00:00.000Z",
    );
  });

  it("throws when the receipt does not exist", async () => {
    await expect(
      saveReviewedReceipt(db, "00000000-0000-0000-0000-000000000000", {
        purchaseDate: "2026-06-10",
      }),
    ).rejects.toThrow();
  });
});
