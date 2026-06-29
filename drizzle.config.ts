import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    // Only used by `migrate`/`push`/`studio`. `generate` works without a DB.
    url: process.env.DATABASE_URL ?? "",
  },
  strict: true,
  verbose: true,
});
