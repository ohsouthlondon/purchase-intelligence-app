import {
  createLiveReceiptParser,
  readLiveParserConfig,
} from "@/lib/receipts/parsing/live-parser";
import { createMockReceiptParser } from "@/lib/receipts/parsing/mock-parser";
import type { ReceiptParser } from "@/lib/receipts/parsing/parser";

/**
 * Composition root for the receipt parser (Milestone 2, Slice 2).
 *
 * This is the ONLY place that decides which provider runs, so the UI and the
 * parse pipeline depend solely on the `ReceiptParser` port and never change when
 * the provider does:
 *
 * - Live provider configured   → live adapter, wrapped so any failure falls back
 *   to mock output (an unavailable provider must never block capture).
 * - Live provider unconfigured → mock adapter directly (the local/dev default).
 */

/** Wraps `primary` so a thrown error transparently falls back to `fallback`. */
export function withFallback(
  primary: ReceiptParser,
  fallback: ReceiptParser,
): ReceiptParser {
  return {
    async parse(input) {
      try {
        return await primary.parse(input);
      } catch (error) {
        console.error(
          "Live receipt parser failed; falling back to mock output",
          error,
        );
        return fallback.parse(input);
      }
    },
  };
}

export function createReceiptParser(
  env: NodeJS.ProcessEnv = process.env,
): ReceiptParser {
  const mock = createMockReceiptParser();
  const config = readLiveParserConfig(env);
  if (!config) return mock;
  return withFallback(createLiveReceiptParser(config), mock);
}
