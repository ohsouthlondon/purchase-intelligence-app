import { and, eq, gte, isNotNull } from "drizzle-orm";

import type { AppDb } from "@/lib/db";
import { items, manualEntries, receipts } from "@/lib/db/schema";
import {
  startOfMonthWindow,
  summarizeMonthlySpend,
  type MonthlySpendRow,
  type SpendContribution,
} from "@/lib/dashboard/spend";

/**
 * Monthly-spend read layer (Milestone 3, Slice 1).
 *
 * Builds the unified-spend contributions for the window (decision D8a) and
 * delegates bucketing to the pure `summarizeMonthlySpend`. Read-only over the
 * existing tables — no schema changes.
 */

const DEFAULT_MONTHS = 12;

function toPence(value: string): number {
  return Math.round(Number.parseFloat(value) * 100);
}

/**
 * The three non-overlapping spend arms, each bounded to the window in SQL:
 *  - reviewed receipt totals (the trustworthy header amount),
 *  - non-itemized manual-entry amounts,
 *  - itemized manual spend via `items` (the header amount is excluded to avoid
 *    double counting).
 * Each reviewed receipt and each manual entry is one purchase event; manual item
 * rows add amount only — their header already counts the purchase.
 */
async function loadSpendContributions(
  db: AppDb,
  windowStart: Date,
): Promise<SpendContribution[]> {
  const receiptRows = await db
    .select({ occurredAt: receipts.purchaseDatetime, total: receipts.total })
    .from(receipts)
    .where(
      and(
        eq(receipts.reviewStatus, "reviewed"),
        isNotNull(receipts.purchaseDatetime),
        isNotNull(receipts.total),
        gte(receipts.purchaseDatetime, windowStart),
      ),
    );

  const manualRows = await db
    .select({
      occurredAt: manualEntries.purchaseDatetime,
      amount: manualEntries.amount,
      itemizedFlag: manualEntries.itemizedFlag,
    })
    .from(manualEntries)
    .where(gte(manualEntries.purchaseDatetime, windowStart));

  const itemRows = await db
    .select({ occurredAt: items.purchaseDatetime, price: items.price })
    .from(items)
    .where(
      and(
        eq(items.sourceType, "manual"),
        isNotNull(items.price),
        isNotNull(items.purchaseDatetime),
        gte(items.purchaseDatetime, windowStart),
      ),
    );

  return [
    ...receiptRows.map((row) => ({
      occurredAt: row.occurredAt!,
      amountPence: toPence(row.total!),
      isPurchase: true,
    })),
    ...manualRows.map((row) => ({
      occurredAt: row.occurredAt,
      amountPence: row.itemizedFlag ? 0 : toPence(row.amount),
      isPurchase: true,
    })),
    ...itemRows.map((row) => ({
      occurredAt: row.occurredAt!,
      amountPence: toPence(row.price!),
      isPurchase: false,
    })),
  ];
}

export interface GetMonthlySpendOptions {
  now?: Date;
  months?: number;
}

export async function getMonthlySpend(
  db: AppDb,
  options: GetMonthlySpendOptions = {},
): Promise<MonthlySpendRow[]> {
  const now = options.now ?? new Date();
  const months = options.months ?? DEFAULT_MONTHS;
  const contributions = await loadSpendContributions(
    db,
    startOfMonthWindow(now, months),
  );
  return summarizeMonthlySpend(contributions, { now, months });
}
