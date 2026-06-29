import { describe, expect, it } from "vitest";

import {
  buildReceiptObjectKey,
  buildReceiptRecord,
  extensionForContentType,
} from "@/lib/receipts/records";

describe("extensionForContentType", () => {
  it("maps known image types to file extensions", () => {
    expect(extensionForContentType("image/jpeg")).toBe("jpg");
    expect(extensionForContentType("image/png")).toBe("png");
    expect(extensionForContentType("image/webp")).toBe("webp");
  });

  it("falls back to bin for unknown types", () => {
    expect(extensionForContentType("application/pdf")).toBe("bin");
  });
});

describe("buildReceiptObjectKey", () => {
  it("produces a uuid-named key with the content-type extension", () => {
    expect(buildReceiptObjectKey("image/png")).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.png$/,
    );
  });

  it("generates a fresh key each call", () => {
    expect(buildReceiptObjectKey("image/jpeg")).not.toBe(
      buildReceiptObjectKey("image/jpeg"),
    );
  });
});

describe("buildReceiptRecord", () => {
  it("stores the image reference and starts in pending OCR state", () => {
    const record = buildReceiptRecord("receipts/abc.jpg");
    expect(record.sourceImageUrl).toBe("receipts/abc.jpg");
    expect(record.ocrStatus).toBe("pending");
  });
});
