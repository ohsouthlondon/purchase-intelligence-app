// @vitest-environment node
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { isNull } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import * as schema from "@/lib/db/schema";

// In-process Postgres (no Docker, no Supabase credentials needed). Exercises
// the same generated migration that production runs against Supabase.
const client = new PGlite();
const db = drizzle(client, { schema });

beforeAll(async () => {
  await migrate(db, { migrationsFolder: "./drizzle" });
});

afterAll(async () => {
  await client.close();
});

describe("database schema (pglite)", () => {
  it("applies the generated migration and round-trips a receipt with items", async () => {
    const [receipt] = await db
      .insert(schema.receipts)
      .values({
        merchantNameRaw: "TESCO",
        merchantNameNormalized: "tesco",
        total: "12.50",
      })
      .returning();

    expect(receipt.id).toBeDefined();
    expect(receipt.currency).toBe("GBP"); // default
    expect(receipt.ocrStatus).toBe("pending"); // default

    await db.insert(schema.items).values({
      receiptId: receipt.id,
      sourceType: "receipt",
      itemNameRaw: "Milk 2L",
      price: "1.85",
    });

    const lineItems = await db.query.items.findMany({
      where: (item, { eq }) => eq(item.receiptId, receipt.id),
    });
    expect(lineItems).toHaveLength(1);
    expect(lineItems[0]?.sourceType).toBe("receipt");
  });

  it("allows manual item rows with a null receipt_id (D3)", async () => {
    const [manualItem] = await db
      .insert(schema.items)
      .values({
        receiptId: null,
        sourceType: "manual",
        itemNameRaw: "Diesel",
        price: "60.00",
      })
      .returning();

    expect(manualItem.receiptId).toBeNull();
    expect(manualItem.sourceType).toBe("manual");

    const orphanItems = await db
      .select()
      .from(schema.items)
      .where(isNull(schema.items.receiptId));
    expect(orphanItems.length).toBeGreaterThanOrEqual(1);
  });

  it("stores a payday cycle and an associated manual entry", async () => {
    const [cycle] = await db
      .insert(schema.paydayCycles)
      .values({
        startDate: "2026-06-01",
        endDate: "2026-06-30",
        paydayDate: "2026-06-25",
        label: "June 2026",
      })
      .returning();

    const [entry] = await db
      .insert(schema.manualEntries)
      .values({
        merchant: "Shell",
        purchaseDatetime: new Date("2026-06-10T08:30:00Z"),
        amount: "60.00",
        category: "fuel",
        paydayCycleId: cycle.id,
      })
      .returning();

    expect(entry.amount).toBe("60.00");
    expect(entry.itemizedFlag).toBe(false); // default
    expect(entry.paydayCycleId).toBe(cycle.id);
  });

  it("stores an insight with a jsonb evidence payload", async () => {
    const [insight] = await db
      .insert(schema.insights)
      .values({
        insightType: "bulk_buy",
        title: "Consider bulk-buying milk",
        explanation: "Bought 8 times this cycle in small quantities.",
        evidencePayload: { item: "milk", purchases: 8 },
      })
      .returning();

    expect(insight.insightType).toBe("bulk_buy");
    expect(insight.evidencePayload).toEqual({ item: "milk", purchases: 8 });
  });
});
