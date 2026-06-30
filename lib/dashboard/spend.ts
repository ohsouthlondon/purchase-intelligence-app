import { toAmountString } from "@/lib/domain/money";

/**
 * Pure monthly-spend aggregation (Milestone 3, Slice 1).
 *
 * Buckets spend contributions into the last `months` calendar months and sums
 * them, fp-safe, in integer pence. No DB access — deterministic and
 * unit-testable. The query layer (`lib/dashboard/queries.ts`) is responsible for
 * turning the unified-spend arms (decision D8a) into `SpendContribution`s.
 *
 * Month bucketing keys off the stored UTC year-month. Date-only values are
 * persisted at noon UTC (decision D9), which never crosses a month boundary for
 * the displayed Europe/London day, so no timezone conversion is needed here.
 */

export interface SpendContribution {
  /** When the purchase happened (stored at noon UTC for date-only captures). */
  occurredAt: Date;
  /** Amount in integer pence (fp-safe); may be 0 for count-only events. */
  amountPence: number;
  /**
   * True for one-per-purchase events (receipts, manual entries); false for
   * amount-only rows such as itemized manual items.
   */
  isPurchase: boolean;
}

export interface MonthlySpendRow {
  /** Sortable month key, e.g. "2026-06". */
  month: string;
  /** Human label, e.g. "June 2026". */
  label: string;
  totalPence: number;
  /** `totalPence` as a 2dp money string, e.g. "18.35". */
  total: string;
  purchaseCount: number;
}

export interface MonthlySpendOptions {
  now: Date;
  months: number;
}

const MONTH_LABEL_FORMAT = new Intl.DateTimeFormat("en-GB", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

function monthKey(date: Date): string {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  return `${year}-${String(month).padStart(2, "0")}`;
}

function monthLabel(key: string): string {
  const [year, month] = key.split("-").map(Number);
  return MONTH_LABEL_FORMAT.format(new Date(Date.UTC(year, month - 1, 1)));
}

/** First instant (UTC) of the oldest month in an N-month window ending at `now`. */
export function startOfMonthWindow(now: Date, months: number): Date {
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (months - 1), 1),
  );
}

/**
 * Bucket contributions into the last `months` calendar months (newest first),
 * summing pence and counting purchase events. Months with no activity are
 * zero-filled so the series is continuous; contributions outside the window are
 * ignored.
 */
export function summarizeMonthlySpend(
  contributions: readonly SpendContribution[],
  { now, months }: MonthlySpendOptions,
): MonthlySpendRow[] {
  const buckets = new Map<
    string,
    { totalPence: number; purchaseCount: number }
  >();
  const orderedKeys: string[] = [];

  const cursor = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  for (let i = 0; i < months; i += 1) {
    const key = monthKey(cursor);
    orderedKeys.push(key);
    buckets.set(key, { totalPence: 0, purchaseCount: 0 });
    cursor.setUTCMonth(cursor.getUTCMonth() - 1);
  }

  for (const contribution of contributions) {
    const bucket = buckets.get(monthKey(contribution.occurredAt));
    if (!bucket) continue; // outside the window
    bucket.totalPence += contribution.amountPence;
    if (contribution.isPurchase) bucket.purchaseCount += 1;
  }

  return orderedKeys.map((key) => {
    const bucket = buckets.get(key)!;
    return {
      month: key,
      label: monthLabel(key),
      totalPence: bucket.totalPence,
      total: toAmountString(bucket.totalPence / 100),
      purchaseCount: bucket.purchaseCount,
    };
  });
}
