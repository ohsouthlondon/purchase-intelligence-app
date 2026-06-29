import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

type Database = ReturnType<typeof createDb>;

/**
 * Shared Drizzle database type. Exported so data-access functions can accept an
 * injectable db (production via {@link getDb}, tests via an in-process PGlite
 * instance) instead of reaching for the singleton directly.
 */
export type AppDb = Database;

let sql: ReturnType<typeof postgres> | undefined;
let database: Database | undefined;

function createDb(connectionString: string) {
  // `prepare: false` is required for Supabase's transaction pooler (PgBouncer),
  // which does not support prepared statements.
  sql = postgres(connectionString, { prepare: false });
  return drizzle(sql, { schema });
}

/**
 * Returns the shared Drizzle client backed by Supabase Postgres.
 *
 * Initialised lazily so that builds and code paths that never touch the
 * database do not require a live connection or `DATABASE_URL`.
 */
export function getDb(): Database {
  if (!database) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error(
        "DATABASE_URL is not set. Copy .env.example to .env.local and set it before using the database.",
      );
    }
    database = createDb(connectionString);
  }
  return database;
}
