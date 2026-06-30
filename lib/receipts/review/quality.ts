/**
 * Parse-quality assessment for the receipt review flow (Milestone 2).
 *
 * Turns the already-loaded review data into a small, explainable verdict so the
 * UI can tell the user — in plain language — whether a `parsed` receipt is
 * trustworthy, thin (missing key header fields or items), or merely
 * low-confidence. Pure and unit-testable: the natural-language banner is
 * rendered ON TOP of this structured result (CLAUDE.md rule 8), never the other
 * way round. No DB access and no schema dependency — it reads only values the
 * page already passes to the form.
 */

/** Verdict, worst-first: `partial` outranks `low` outranks `good`. */
export type ParseQualityLevel = "good" | "low" | "partial";

export interface ParseQualityInput {
  merchant: string;
  purchaseDate: string;
  total: string;
  itemCount: number;
  parseConfidence: string | null;
}

export interface ParseQuality {
  level: ParseQualityLevel;
  /** Human labels for key header fields the parser left blank. */
  missingFields: string[];
  hasItems: boolean;
  lowConfidence: boolean;
}

// Below this 0–1 score a parse is treated as low-confidence and the user is
// nudged to double-check prefilled values. The mock parser deliberately scores
// at/under this line so local/dev data always reinforces the review step.
export const LOW_CONFIDENCE_THRESHOLD = 0.6;

function isBlank(value: string): boolean {
  return value.trim().length === 0;
}

/** Parses a NUMERIC-as-string confidence into a number, or null if unusable. */
function toConfidence(value: string | null): number | null {
  if (value == null) return null;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

/** True when a stored confidence is present and below the trust threshold. */
export function isLowConfidence(value: string | null): boolean {
  const parsed = toConfidence(value);
  return parsed != null && parsed < LOW_CONFIDENCE_THRESHOLD;
}

export function assessParseQuality(input: ParseQualityInput): ParseQuality {
  const missingFields: string[] = [];
  if (isBlank(input.merchant)) missingFields.push("merchant");
  if (isBlank(input.purchaseDate)) missingFields.push("date");
  if (isBlank(input.total)) missingFields.push("total");

  const hasItems = input.itemCount > 0;
  const lowConfidence = isLowConfidence(input.parseConfidence);

  const level: ParseQualityLevel =
    missingFields.length > 0 || !hasItems
      ? "partial"
      : lowConfidence
        ? "low"
        : "good";

  return { level, missingFields, hasItems, lowConfidence };
}
