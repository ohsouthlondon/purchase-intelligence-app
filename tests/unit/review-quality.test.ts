import { describe, expect, it } from "vitest";

import {
  assessParseQuality,
  isLowConfidence,
  LOW_CONFIDENCE_THRESHOLD,
  type ParseQualityInput,
} from "@/lib/receipts/review/quality";

/**
 * Unit tests for the parse-quality assessor (Milestone 2).
 *
 * These pin the structured verdict the review banner is rendered on top of, so
 * the natural-language copy can change without weakening the logic guarantees.
 */

const complete: ParseQualityInput = {
  merchant: "Tesco",
  purchaseDate: "2026-06-01",
  total: "4.50",
  itemCount: 3,
  parseConfidence: "0.9000",
};

describe("assessParseQuality", () => {
  it("rates a complete, confident parse as good", () => {
    const result = assessParseQuality(complete);

    expect(result.level).toBe("good");
    expect(result.missingFields).toEqual([]);
    expect(result.hasItems).toBe(true);
    expect(result.lowConfidence).toBe(false);
  });

  it("flags missing header fields as partial and names them in order", () => {
    const result = assessParseQuality({
      ...complete,
      merchant: "   ",
      total: "",
    });

    expect(result.level).toBe("partial");
    expect(result.missingFields).toEqual(["merchant", "total"]);
  });

  it("treats an empty line-item list as a partial parse", () => {
    const result = assessParseQuality({ ...complete, itemCount: 0 });

    expect(result.level).toBe("partial");
    expect(result.hasItems).toBe(false);
  });

  it("rates a complete-but-low-confidence parse as low", () => {
    const result = assessParseQuality({
      ...complete,
      parseConfidence: "0.5000",
    });

    expect(result.level).toBe("low");
    expect(result.lowConfidence).toBe(true);
  });

  it("prefers the partial verdict over low confidence when both apply", () => {
    const result = assessParseQuality({
      ...complete,
      merchant: "",
      parseConfidence: "0.1000",
    });

    expect(result.level).toBe("partial");
    expect(result.lowConfidence).toBe(true);
  });

  it("does not treat a null confidence as low", () => {
    const result = assessParseQuality({ ...complete, parseConfidence: null });

    expect(result.level).toBe("good");
    expect(result.lowConfidence).toBe(false);
  });
});

describe("isLowConfidence", () => {
  it("is false at the threshold boundary", () => {
    expect(isLowConfidence(LOW_CONFIDENCE_THRESHOLD.toFixed(4))).toBe(false);
  });

  it("is true just below the threshold", () => {
    expect(isLowConfidence("0.5999")).toBe(true);
  });

  it("is false for null or unparseable input", () => {
    expect(isLowConfidence(null)).toBe(false);
    expect(isLowConfidence("not-a-number")).toBe(false);
  });
});
