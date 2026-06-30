import { describe, expect, it } from "vitest";

import { toNoonUtc } from "@/lib/domain/datetime";
import { toAmountString } from "@/lib/domain/money";
import {
  buildManualEntryRecords,
  sumToAmountString,
} from "@/lib/manual-entry/records";
import { manualEntryFormSchema } from "@/lib/manual-entry/schema";

/** Parse raw input the way the Server Action does before building records. */
function parse(raw: unknown) {
  return manualEntryFormSchema.parse(raw);
}

describe("money helpers", () => {
  it("formats a single amount as a 2dp string", () => {
    expect(toAmountString(1.5)).toBe("1.50");
    expect(toAmountString(1)).toBe("1.00");
  });

  it("sums amounts without floating-point drift", () => {
    expect(sumToAmountString([0.1, 0.2])).toBe("0.30");
    expect(sumToAmountString([1.85, 1.1])).toBe("2.95");
  });
});

describe("toNoonUtc", () => {
  it("resolves a date-only value to noon UTC", () => {
    expect(toNoonUtc("2026-06-29").toISOString()).toBe(
      "2026-06-29T12:00:00.000Z",
    );
  });
});

describe("buildManualEntryRecords (simple)", () => {
  const records = buildManualEntryRecords(
    parse({
      mode: "simple",
      merchant: "Shell",
      purchaseDate: "2026-06-29",
      category: "fuel",
      amount: "60",
    }),
  );

  it("creates a single non-itemized manual_entries row", () => {
    expect(records.entry.itemizedFlag).toBe(false);
    expect(records.entry.amount).toBe("60.00");
    expect(records.entry.merchant).toBe("Shell");
    expect(records.entry.category).toBe("fuel");
    expect(records.items).toHaveLength(0);
  });
});

describe("buildManualEntryRecords (itemized)", () => {
  const records = buildManualEntryRecords(
    parse({
      mode: "itemized",
      merchant: "Tesco",
      purchaseDate: "2026-06-29",
      category: "groceries",
      items: [
        { name: "Milk", price: "1.85", quantity: "2" },
        { name: "Bread", price: "1.10" },
      ],
    }),
  );

  it("sets the header amount to the sum of line prices", () => {
    expect(records.entry.itemizedFlag).toBe(true);
    expect(records.entry.amount).toBe("2.95");
  });

  it("creates one manual item row per line with a null receipt_id", () => {
    expect(records.items).toHaveLength(2);
    for (const item of records.items) {
      expect(item.receiptId).toBeNull();
      expect(item.sourceType).toBe("manual");
      expect(item.merchantNameNormalized).toBe("tesco");
      expect(item.purchaseDatetime?.toISOString()).toBe(
        "2026-06-29T12:00:00.000Z",
      );
    }
  });

  it("carries per-line price and optional quantity", () => {
    const [milk, bread] = records.items;
    expect(milk.itemNameRaw).toBe("Milk");
    expect(milk.price).toBe("1.85");
    expect(milk.quantityValue).toBe("2");
    expect(bread.price).toBe("1.10");
    expect(bread.quantityValue).toBeNull();
  });
});
