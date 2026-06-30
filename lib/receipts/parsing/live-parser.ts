import type {
  ReceiptParser,
  ReceiptParserInput,
} from "@/lib/receipts/parsing/parser";

/**
 * Live receipt-parsing adapter (Milestone 2, Slice 2).
 *
 * Talks to an external OCR/extraction provider over HTTP and returns the
 * provider's raw JSON as `unknown` — the parse pipeline validates it with
 * `parsedReceiptSchema` before anything is trusted. The provider is configured
 * entirely through environment variables, so the app runs locally on the mock
 * provider when they are absent (the selection lives in `createReceiptParser`).
 *
 * This is intentionally the simplest adapter that keeps the seam clean: a real
 * provider with a different request/response shape only changes THIS file.
 */

const ENDPOINT_ENV = "RECEIPT_PARSER_API_URL";
const API_KEY_ENV = "RECEIPT_PARSER_API_KEY";
const REQUEST_TIMEOUT_MS = 15_000;

export interface LiveParserConfig {
  endpoint: string;
  apiKey: string;
}

/**
 * Reads the live-provider config from the environment, or `null` when either
 * variable is missing — the signal `createReceiptParser` uses to fall back to
 * the mock provider.
 */
export function readLiveParserConfig(
  env: NodeJS.ProcessEnv = process.env,
): LiveParserConfig | null {
  const endpoint = env[ENDPOINT_ENV]?.trim();
  const apiKey = env[API_KEY_ENV]?.trim();
  if (!endpoint || !apiKey) return null;
  return { endpoint, apiKey };
}

export function createLiveReceiptParser(
  config: LiveParserConfig,
): ReceiptParser {
  return {
    async parse(input: ReceiptParserInput): Promise<unknown> {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
      try {
        const response = await fetch(config.endpoint, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            authorization: `Bearer ${config.apiKey}`,
          },
          body: JSON.stringify({
            receiptId: input.receiptId,
            imageReference: input.imageReference,
          }),
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error(
            `Receipt parser responded with HTTP ${response.status}.`,
          );
        }
        return await response.json();
      } finally {
        clearTimeout(timeout);
      }
    },
  };
}
