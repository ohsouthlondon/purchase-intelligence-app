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

  async function seedReceiptWithItems() {
    const [receipt] = await drizzleDb
      .insert(schema.receipts)
      .values({ sourceImageUrl: "receipts/i.jpg", ocrStatus: "parsed" })
      .returning({ id: schema.receipts.id });

    const inserted = await drizzleDb
      .insert(schema.items)
      .values([
        {
          receiptId: receipt.id,
          sourceType: "receipt",
          rawLineText: "MILK 2L",
          itemNameRaw: "Milk",
          price: "1.85",
          quantityValue: "1",
        },
        {
          receiptId: receipt.id,
          sourceType: "receipt",
          rawLineText: "BREAD",
          itemNameRaw: "Bread",
          price: "1.10",
          quantityValue: "1",
        },
      ])
      .returning({ id: schema.items.id });

    return { receiptId: receipt.id, itemIds: inserted.map((row) => row.id) };
  }

  function loadItems(receiptId: string) {
    return drizzleDb
      .select()
      .from(schema.items)
      .where(eq(schema.items.receiptId, receiptId));
  }

  it("applies item edits and deletes removed items", async () => {
    const { receiptId, itemIds } = await seedReceiptWithItems();

    await saveReviewedReceipt(db, receiptId, {
      purchaseDate: "2026-06-10",
      items: [
        { id: itemIds[0], itemName: "Whole Milk", quantity: 2, price: 1.99 },
      ],
    });

    const rows = await loadItems(receiptId);
    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe(itemIds[0]);
    expect(rows[0].itemNameRaw).toBe("Whole Milk");
    expect(rows[0].price).toBe("1.99");
    expect(rows[0].quantityValue).toBe("2");
  });

  it("removes all line items when an empty set is saved", async () => {
    const { receiptId } = await seedReceiptWithItems();

    await saveReviewedReceipt(db, receiptId, {
      purchaseDate: "2026-06-10",
      items: [],
    });

    expect(await loadItems(receiptId)).toHaveLength(0);
  });

  it("leaves line items untouched when items are omitted", async () => {
    const { receiptId } = await seedReceiptWithItems();

    await saveReviewedReceipt(db, receiptId, { purchaseDate: "2026-06-10" });

    expect(await loadItems(receiptId)).toHaveLength(2);
  });

  it("ignores item ids that belong to another receipt", async () => {
    const a = await seedReceiptWithItems();
    const b = await seedReceiptWithItems();

    // Saving receipt A with B's id must not edit or delete B's rows.
    await saveReviewedReceipt(db, a.receiptId, {
      purchaseDate: "2026-06-10",
      items: [{ id: b.itemIds[0], itemName: "Injected", price: 9.99 }],
    });

    const aRows = await loadItems(a.receiptId);
    expect(aRows).toHaveLength(0); // A's own rows were not in the surviving set

    const bRows = await loadItems(b.receiptId);
    expect(bRows).toHaveLength(2); // B untouched
    expect(bRows.every((row) => row.itemNameRaw !== "Injected")).toBe(true);
  });
});
