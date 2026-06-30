import { describe, expect, it } from "vitest";

import {
  startOfMonthWindow,
  summarizeMonthlySpend,
  type SpendContribution,
} from "@/lib/dashboard/spend";

/**
 * Unit tests for the pure monthly-spend aggregation (Milestone 3, Slice 1).
 */

const now = new Date("2026-06-15T12:00:00.000Z");

function at(dateIso: string): Date {
  return new Date(`${dateIso}T12:00:00.000Z`);
}

describe("summarizeMonthlySpend", () => {
  it("returns one zero-filled row per month, newest first", () => {
    const rows = summarizeMonthlySpend([], { now, months: 12 });

    expect(rows).toHaveLength(12);
    expect(rows[0].month).toBe("2026-06");
    expect(rows[0].label).toBe("June 2026");
    expect(rows[11].month).toBe("2025-07");
    expect(rows.every((row) => row.totalPence === 0)).toBe(true);
    expect(rows.every((row) => row.purchaseCount === 0)).toBe(true);
  });

  it("sums amounts into the right month and counts purchase events only", () => {
    const contributions: SpendContribution[] = [
      { occurredAt: at("2026-06-01"), amountPence: 1085, isPurchase: true },
      { occurredAt: at("2026-06-20"), amountPence: 250, isPurchase: true },
      // amount-only row (e.g. an itemized manual item): adds £ but not a count
      { occurredAt: at("2026-06-20"), amountPence: 500, isPurchase: false },
    ];

    const june = summarizeMonthlySpend(contributions, { now, months: 12 }).find(
      (row) => row.month === "2026-06",
    )!;

    expect(june.totalPence).toBe(1835);
    expect(june.total).toBe("18.35");
    expect(june.purchaseCount).toBe(2);
  });

  it("separates contributions across distinct months", () => {
    const rows = summarizeMonthlySpend(
      [
        { occurredAt: at("2026-06-10"), amountPence: 1000, isPurchase: true },
        { occurredAt: at("2026-05-10"), amountPence: 700, isPurchase: true },
      ],
      { now, months: 12 },
    );

    expect(rows.find((row) => row.month === "2026-06")!.totalPence).toBe(1000);
    expect(rows.find((row) => row.month === "2026-05")!.totalPence).toBe(700);
  });

  it("ignores contributions outside the window", () => {
    const rows = summarizeMonthlySpend(
      [{ occurredAt: at("2025-01-15"), amountPence: 9999, isPurchase: true }],
      { now, months: 12 },
    );

    expect(rows.every((row) => row.totalPence === 0)).toBe(true);
  });

  it("stays fp-safe when formatting summed pence", () => {
    const contributions: SpendContribution[] = [10, 10, 10].map((pence) => ({
      occurredAt: at("2026-06-10"),
      amountPence: pence,
      isPurchase: false,
    }));

    const june = summarizeMonthlySpend(contributions, { now, months: 12 }).find(
      (row) => row.month === "2026-06",
    )!;

    expect(june.total).toBe("0.30");
  });
});

describe("startOfMonthWindow", () => {
  it("returns the first instant of the oldest month in the window", () => {
    expect(startOfMonthWindow(now, 12).toISOString()).toBe(
      "2025-07-01T00:00:00.000Z",
    );
  });

  it("rolls the year back across January", () => {
    expect(
      startOfMonthWindow(new Date("2026-01-10T12:00:00Z"), 3).toISOString(),
    ).toBe("2025-11-01T00:00:00.000Z");
  });
});
