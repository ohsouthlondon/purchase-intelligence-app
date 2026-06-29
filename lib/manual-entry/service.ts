import type { AppDb } from "@/lib/db";
import { items as itemsTable, manualEntries } from "@/lib/db/schema";
import { buildManualEntryRecords } from "@/lib/manual-entry/records";
import type { ManualEntryInput } from "@/lib/manual-entry/schema";

/**
 * Data-access for manual purchase entries (Slice 3).
 *
 * The db is injected so production uses the Supabase-backed singleton while
 * tests use an in-process PGlite instance running the same migration.
 */

export interface CreateManualEntryResult {
  manualEntryId: string;
  itemIds: string[];
}

/**
 * Persist a validated manual purchase.
 *
 * Non-itemized purchases are a single `manual_entries` insert. Itemized
 * purchases write the header row and all `items` rows inside one transaction so
 * a partial purchase can never be persisted.
 */
export async function createManualEntry(
  db: AppDb,
  input: ManualEntryInput,
): Promise<CreateManualEntryResult> {
  const { entry, items } = buildManualEntryRecords(input);

  if (items.length === 0) {
    const [row] = await db
      .insert(manualEntries)
      .values(entry)
      .returning({ id: manualEntries.id });
    return { manualEntryId: row.id, itemIds: [] };
  }

  return db.transaction(async (tx) => {
    const [row] = await tx
      .insert(manualEntries)
      .values(entry)
      .returning({ id: manualEntries.id });

    const insertedItems = await tx
      .insert(itemsTable)
      .values(items)
      .returning({ id: itemsTable.id });

    return {
      manualEntryId: row.id,
      itemIds: insertedItems.map((item) => item.id),
    };
  });
}
