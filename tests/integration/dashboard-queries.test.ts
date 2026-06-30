// @vitest-environment node
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type { AppDb } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { getMonthlySpend } from "@/lib/dashboard/queries";

const client = new PGlite();
const drizzleDb = drizzle(client, { schema });
const db = drizzleDb as unknown as AppDb;

const NOW = new Date("2026-06-15T12:00:00.000Z");

function noon(dateIso: string): Date {
  return new Date(`${dateIso}T12:00:00.000Z`);
}

beforeAll(async () => {
  await migrate(drizzleDb, { migrationsFolder: "./drizzle" });

  // June: a reviewed receipt (£10.00) + a non-itemized manual entry (£5.50).
  await drizzleDb.insert(schema.receipts).values({
    sourceImageUrl: "receipts/june.jpg",
    ocrStatus: "reviewed",
    reviewStatus: "reviewed",
    purchaseDatetime: noon("2026-06-05"),
    total: "10.00",
  });
  await drizzleDb.insert(schema.manualEntries).values({
    purchaseDatetime: noon("2026-06-10"),
    amount: "5.50",
    itemizedFlag: false,
  });

  // May: an itemized manual entry — header (£7.00, excluded) + two items.
  await drizzleDb.insert(schema.manualEntries).values({
    purchaseDatetime: noon("2026-05-20"),
    amount: "7.00",
    itemizedFlag: true,
  });
  await drizzleDb.insert(schema.items).values([
    {
      sourceType: "manual",
      itemNameRaw: "Coffee",
      price: "3.00",
      purchaseDatetime: noon("2026-05-20"),
    },
    {
      sourceType: "manual",
      itemNameRaw: "Pastry",
      price: "4.00",
      purchaseDatetime: noon("2026-05-20"),
    },
  ]);

  // Excluded: an unreviewed (parsed) receipt must not count.
  await drizzleDb.insert(schema.receipts).values({
    sourceImageUrl: "receipts/parsed.jpg",
    ocrStatus: "parsed",
    reviewStatus: "unreviewed",
    purchaseDatetime: noon("2026-06-01"),
    total: "99.00",
  });

  // Excluded: a reviewed receipt before the 12-month window.
  await drizzleDb.insert(schema.receipts).values({
    sourceImageUrl: "receipts/old.jpg",
    ocrStatus: "reviewed",
    reviewStatus: "reviewed",
    purchaseDatetime: noon("2024-01-01"),
    total: "50.00",
  });
});

afterAll(async () => {
  await client.close();
});

describe("getMonthlySpend", () => {
  it("sums reviewed receipts and non-itemized manual entries by month", async () => {
    const rows = await getMonthlySpend(db, { now: NOW, months: 12 });
    const june = rows.find((row) => row.month === "2026-06")!;

    expect(june.totalPence).toBe(1550); // 1000 + 550
    expect(june.total).toBe("15.50");
    expect(june.purchaseCount).toBe(2);
  });

  it("counts itemized manual spend via items, excluding the header amount", async () => {
    const rows = await getMonthlySpend(db, { now: NOW, months: 12 });
    const may = rows.find((row) => row.month === "2026-05")!;

    expect(may.totalPence).toBe(700); // 300 + 400; £7.00 header excluded
    expect(may.purchaseCount).toBe(1); // the itemized entry is one purchase
  });

  it("excludes unreviewed receipts and rows outside the window", async () => {
    const rows = await getMonthlySpend(db, { now: NOW, months: 12 });
    const total = rows.reduce((sum, row) => sum + row.totalPence, 0);

    // Only June (1550) + May (700); the £99 parsed receipt and £50 old receipt
    // are both excluded.
    expect(total).toBe(2250);
  });
});
