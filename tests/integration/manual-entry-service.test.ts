// @vitest-environment node
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { eq, isNull } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type { AppDb } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { createManualEntry } from "@/lib/manual-entry/service";

// In-process Postgres running the same generated migration as production, so
// the service exercises the real schema (incl. the nullable items.receipt_id).
const client = new PGlite();
const drizzleDb = drizzle(client, { schema });
// PGlite and postgres-js produce structurally compatible Drizzle clients; the
// cast lets the service keep a single production-shaped db type.
const db = drizzleDb as unknown as AppDb;

beforeAll(async () => {
  await migrate(drizzleDb, { migrationsFolder: "./drizzle" });
});

afterAll(async () => {
  await client.close();
});

describe("createManualEntry", () => {
  it("persists a non-itemized entry as a single manual_entries row", async () => {
    const result = await createManualEntry(db, {
      mode: "simple",
      merchant: "Shell",
      purchaseDate: "2026-06-10",
      category: "fuel",
      amount: 60,
    });

    expect(result.itemIds).toHaveLength(0);

    const [entry] = await drizzleDb
      .select()
      .from(schema.manualEntries)
      .where(eq(schema.manualEntries.id, result.manualEntryId));

    expect(entry.amount).toBe("60.00");
    expect(entry.itemizedFlag).toBe(false);
    expect(entry.merchant).toBe("Shell");
  });

  it("persists an itemized entry as a header plus manual item rows", async () => {
    const result = await createManualEntry(db, {
      mode: "itemized",
      merchant: "Tesco",
      purchaseDate: "2026-06-11",
      category: "groceries",
      items: [
        { name: "Milk", price: 1.85, quantity: 2 },
        { name: "Bread", price: 1.1 },
      ],
    });

    expect(result.itemIds).toHaveLength(2);

    const [header] = await drizzleDb
      .select()
      .from(schema.manualEntries)
      .where(eq(schema.manualEntries.id, result.manualEntryId));
    expect(header.itemizedFlag).toBe(true);
    expect(header.amount).toBe("2.95");

    const itemRows = await drizzleDb
      .select()
      .from(schema.items)
      .where(eq(schema.items.merchantNameNormalized, "tesco"));
    expect(itemRows).toHaveLength(2);
    for (const item of itemRows) {
      expect(item.sourceType).toBe("manual");
      expect(item.receiptId).toBeNull();
    }
  });

  it("stores manual items with a null receipt_id (D3)", async () => {
    const orphanItems = await drizzleDb
      .select()
      .from(schema.items)
      .where(isNull(schema.items.receiptId));
    expect(orphanItems.length).toBeGreaterThanOrEqual(2);
  });
});
