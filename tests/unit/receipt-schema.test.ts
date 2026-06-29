import { describe, expect, it } from "vitest";

import { RECEIPT_MAX_BYTES, receiptUploadSchema } from "@/lib/receipts/schema";

function imageFile(type: string, byteLength = 4, name = "receipt"): File {
  return new File([new Uint8Array(byteLength)], name, { type });
}

describe("receiptUploadSchema", () => {
  it("accepts a JPEG, PNG, or WebP image", () => {
    for (const type of ["image/jpeg", "image/png", "image/webp"]) {
      const result = receiptUploadSchema.safeParse({ image: imageFile(type) });
      expect(result.success).toBe(true);
    }
  });

  it("rejects a missing image", () => {
    const result = receiptUploadSchema.safeParse({ image: null });
    expect(result.success).toBe(false);
  });

  it("rejects a non-image content type", () => {
    const result = receiptUploadSchema.safeParse({
      image: imageFile("application/pdf"),
    });
    expect(result.success).toBe(false);
  });

  it("rejects an empty file", () => {
    const result = receiptUploadSchema.safeParse({
      image: imageFile("image/png", 0),
    });
    expect(result.success).toBe(false);
  });

  it("rejects a file larger than the size bound", () => {
    const result = receiptUploadSchema.safeParse({
      image: imageFile("image/jpeg", RECEIPT_MAX_BYTES + 1),
    });
    expect(result.success).toBe(false);
  });
});
