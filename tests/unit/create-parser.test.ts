import { describe, expect, it, vi } from "vitest";

import {
  createReceiptParser,
  withFallback,
} from "@/lib/receipts/parsing/create-parser";
import type { ReceiptParser } from "@/lib/receipts/parsing/parser";

const input = { receiptId: "r1", imageReference: "receipts/a.jpg" };

describe("createReceiptParser", () => {
  it("uses the mock provider when no live config is present", async () => {
    const parser = createReceiptParser({} as NodeJS.ProcessEnv);
    const result = (await parser.parse(input)) as { merchantName: string };
    expect(result.merchantName).toBe("Sample Store");
  });

  it("selects the live provider when configured, falling back to mock on failure", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockRejectedValue(new Error("network down"));
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const parser = createReceiptParser({
      RECEIPT_PARSER_API_URL: "https://parser.example/parse",
      RECEIPT_PARSER_API_KEY: "secret",
    } as NodeJS.ProcessEnv);
    const result = (await parser.parse(input)) as { merchantName: string };

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(result.merchantName).toBe("Sample Store");

    fetchSpy.mockRestore();
    errorSpy.mockRestore();
  });
});

describe("withFallback", () => {
  it("returns the primary result when it succeeds", async () => {
    const primary: ReceiptParser = {
      async parse() {
        return { ok: "primary" };
      },
    };
    const fallback: ReceiptParser = {
      async parse() {
        return { ok: "fallback" };
      },
    };

    expect(await withFallback(primary, fallback).parse(input)).toEqual({
      ok: "primary",
    });
  });

  it("falls back to the secondary parser when the primary throws", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const primary: ReceiptParser = {
      async parse() {
        throw new Error("unavailable");
      },
    };
    const fallback: ReceiptParser = {
      async parse() {
        return { ok: "fallback" };
      },
    };

    expect(await withFallback(primary, fallback).parse(input)).toEqual({
      ok: "fallback",
    });

    errorSpy.mockRestore();
  });
});
