import { describe, expect, it } from "vitest";
import { DEFAULT_CATEGORIES } from "@/lib/domain/categories";
import { APP_TIME_ZONE, DEFAULT_CURRENCY } from "@/lib/domain/constants";

describe("domain defaults", () => {
  it("defaults currency to GBP", () => {
    expect(DEFAULT_CURRENCY).toBe("GBP");
  });

  it("displays timestamps in the Europe/London timezone", () => {
    expect(APP_TIME_ZONE).toBe("Europe/London");
  });

  it("seeds groceries as a default category", () => {
    expect(DEFAULT_CATEGORIES).toContain("groceries");
  });
});
