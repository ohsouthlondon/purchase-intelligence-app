# DECISIONS.md

## Initial decisions

- Product is single-user only in v1.
- v1 excludes open-banking integration.
- Item-level storage is a first-class requirement.
- Deterministic analytics must exist before LLM-generated recommendations.
- Manual entries are a core capture path, not a fallback.
- Payday-cycle analysis is a core product differentiator.

## 2026-06-29 — Milestone 1 kickoff decisions

### Approved planning decisions

- **D1 — ORM: Drizzle** (+ drizzle-kit). SQL-first suits the aggregation-heavy
  analytics; lighter and easier to inspect than Prisma.
- **D2 — Auth: none in Milestone 1.** Optimise for local/dev-first operation.
  No shared-secret/passcode wall. If auth is needed later, add a proper
  lightweight approach then. _(Changed from the originally proposed passcode gate.)_
- **D3 — Schema: `receipt_id` nullable**, itemized manual entries create `Item`
  rows, and the analytics layer exposes one canonical "unified spend" view that
  unions receipt totals with non-itemized manual amounts.
- **D4 — IDs/money/time:** UUID primary keys; default currency **GBP**
  (single-currency v1); store all timestamps in **UTC**, display in
  **Europe/London**.
- **D6 — Image formats:** Milestone 1 supports standard web image types only
  (JPEG/PNG/WebP). HEIC is documented as a follow-up concern, not engineered now.
  _(Reduced from the originally proposed HEIC handling.)_

### Stack chosen (Slice 0)

Next.js 15 (App Router) + React 19, TypeScript 6, Tailwind CSS v4, ESLint 9
(flat config) + Prettier, Vitest + Testing Library + jsdom (unit), Playwright
(e2e). Mutations via Server Actions; Zod for boundary validation; Supabase
Postgres + Storage and Recharts to be introduced in later slices.

### Slice 0 build notes

- `next.config.ts` pins `outputFileTracingRoot` to the project dir because a
  stray `package-lock.json` in the home directory made Next infer the wrong
  workspace root.
- Added `types/styles.d.ts` (`declare module "*.css";`) — TypeScript 6 enforces
  side-effect import resolution and Next ships no bare `*.css` declaration.
- Prettier excludes `*.md` so hand-written docs are not auto-reformatted.

## 2026-06-29 — Slice 1 (database & schema)

- Schema lives in `lib/db/schema.ts` (5 tables + 4 enums). Initial migration
  generated to `drizzle/0000_silent_black_cat.sql` via `drizzle-kit generate`.
- **Drivers:** `postgres-js` for production against Supabase (`prepare: false`
  for the PgBouncer transaction pooler); **PGlite** (`@electric-sql/pglite`) for
  in-process integration tests — no Docker or credentials — applying the *same*
  migration so tests exercise the real schema.
- Schema notes beyond the PRD data model:
  - `review_status` modeled as enum `['unreviewed','reviewed']` (PRD left the
    values open).
  - `manual_entries` gained `created_at`/`updated_at` for auditing.
  - `items` has no currency column; single-currency GBP is applied app-wide.
- **Unified spend** remains planned for Milestone 3: documented in `schema.ts`
  as a view UNIONing receipt totals with non-itemized `manual_entries` amounts.
- DB scripts added: `db:generate`, `db:migrate`, `db:push`, `db:studio`.
- Verified via PGlite round-trip: receipt+items, **null `receipt_id` manual
  item (D3)**, payday cycle + manual entry, and a `jsonb` insight payload.
