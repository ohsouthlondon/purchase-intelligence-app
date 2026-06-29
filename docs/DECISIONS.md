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

## 2026-06-29 — Slice 2 (app shell: nav + theme)

App-shell-only slice. No business logic, data access, or schema changes.

- **Nav structure:** five top-level destinations defined once in
  `lib/navigation.ts` (`NAV_ITEMS`): Inbox `/`, Dashboard `/dashboard`,
  Capture `/capture`, Insights `/insights`, Settings `/settings`. `/capture`
  is a placeholder hub that Slice 3 (manual entry) and Slice 4 (receipt upload)
  will fill. `/dashboard` → Milestone 3, `/insights` → Milestone 4.
- **Mobile-first nav:** single fixed bottom tab bar (`components/app-nav.tsx`),
  centered with a `max-w-md` so it also reads well on desktop — deliberately no
  separate desktop sidebar (single-user tool, KISS, avoids a second nav to keep
  in sync). Active route via `usePathname()` + `isActiveRoute()` (root matches
  exactly; sections match nested paths).
- **D7 — Theme: `next-themes`** (`attribute="class"`, `defaultTheme="system"`,
  `enableSystem`) over a hand-rolled script — battle-tested, handles SSR,
  persistence, system sync, and no flash of wrong theme. `<html>` carries
  `suppressHydrationWarning`. Tailwind v4 needs the class strategy enabled in
  CSS, so `app/globals.css` adds
  `@custom-variant dark (&:where(.dark, .dark *))`.
- **Icons:** `lucide-react` (tree-shakeable) instead of hand-maintained SVGs.
- **Deps added:** `next-themes`, `lucide-react`. No schema changes.
- **Verification:** `prettier --check` clean, `next lint` clean, Vitest 15/15
  (incl. new `tests/unit/navigation.test.ts`), `next build` succeeds with all 6
  routes prerendered static, Playwright e2e 3/3 (home brand+inbox, bottom-nav
  routing, theme toggle flipping `.dark` on `<html>`). Installed the Playwright
  chromium binary to run e2e locally.

## 2026-06-29 — Slice 3 (manual purchase entry)

Manual-entry-only slice. No OCR, auth, or dashboards; no schema changes (used
the existing `manual_entries`/`items` tables).

- **D8 — Persistence model.** Every manual purchase is one `manual_entries`
  row. A non-itemized ("total only") entry stores the entered total with
  `itemized_flag = false`. An itemized entry stores a header row with
  `itemized_flag = true` and `amount` = the fp-safe sum of line prices, **plus**
  one `items` row per line (`receipt_id = NULL`, `source_type = 'manual'`), per
  D3. Items have no FK to the header (schema unchanged); they carry denormalized
  merchant/category/purchase datetime so item-level analytics work standalone.
- **D8a — Unified-spend contract (reaffirms D3).** The future Milestone 3 view
  must sum `receipts.total` + `manual_entries.amount WHERE itemized_flag=false`
  + `items.price WHERE source_type='manual'`. Itemized headers are **excluded**
  from the manual-amount arm so itemized spend is counted once (via items).
- **D9 — Date-only capture stored at noon UTC.** The form captures a calendar
  date; it is persisted as `T12:00:00.000Z` so the displayed Europe/London day
  is stable across GMT/BST (consistent with D4: store UTC, display London).
- **D10 — Server Action takes a plain object, not FormData.** The client form
  builds a serializable payload (incl. the nested items array) and calls
  `submitManualEntry(input: unknown)`, which Zod-validates at the boundary
  before any write. Avoids brittle indexed-FormData parsing for the dynamic
  item list. Money is validated as positive with ≤2dp and stored as a 2dp
  string for `NUMERIC(12,2)`.
- **D11 — Injectable db type.** `lib/db/client.ts` exports `AppDb` so
  `createManualEntry(db, input)` runs against Supabase in production and an
  in-process PGlite instance in integration tests. Itemized writes use a
  transaction so a partial purchase can never persist.
- **Layering:** `lib/manual-entry/{schema,records,service}.ts` separate
  validation, pure row-building (deterministic, unit-tested), and DB access.
- **Categories:** free-text input backed by a `<datalist>` of
  `DEFAULT_CATEGORIES` (custom values allowed, per D5).
- **Deps added:** `zod`. No schema/migration changes.
- **Verification:** Vitest 40/40 (Zod accept/reject, record builder incl.
  fp-safe sum + null `receipt_id` + noon-UTC, form mode toggle/add-remove/
  mocked submit, **PGlite integration** proving the real persistence path),
  `next lint` clean, `prettier --check` clean, `next build` OK (9 routes,
  `/capture/manual` prerendered), Playwright 5/5. Successful save-to-DB is
  covered by the integration test, not e2e, because the test env has no
  `DATABASE_URL` (same approach as Slice 1).

## 2026-06-29 — Slice 4 (receipt image upload)

Upload-and-persist-only slice. **No OCR, parsing, or review flow** (Milestone 2);
no auth; no dashboards; **no schema changes** (used the existing `receipts`
columns `source_image_url` / `ocr_status` / `review_status`).

- **D12 — Stored image reference & private bucket.** The uploaded object is
  written to a **private** Supabase Storage bucket under a key `<uuid>.<ext>`,
  and `receipts.source_image_url` stores the bucket-qualified path
  `"<bucket>/<key>"` (not a public URL). Rationale: there is no screen that
  displays receipt images yet (review/display is Milestone 2), and financial
  receipts should not be world-readable. Signed-URL generation is deferred to
  when a reader needs it. A fresh receipt is persisted with `ocr_status =
  'pending'` and otherwise-null merchant/date/totals — those are filled by the
  Milestone 2 parsing/review flow.
- **D13 — Storage via an injectable port + a thin REST adapter (no SDK).**
  `lib/receipts/storage.ts` defines a `ReceiptStorage` port; `service.ts`
  depends on it so production uses Supabase Storage while the integration test
  injects an in-memory fake (mirrors D11's injectable `AppDb`). The production
  adapter (`supabase-storage.ts`) performs a single REST `POST` to the Storage
  API with `fetch` rather than pulling in `@supabase/supabase-js`, keeping the
  dependency footprint at zero for a one-operation feature. Swapping to the SDK
  later is a localized change behind the port. **No deps added.**
- **Server-side upload only.** The client form posts the raw `File` via
  `FormData` to the Server Action; the upload runs server-side with the
  **service-role key** (`SUPABASE_SERVICE_ROLE_KEY`), so secrets never reach the
  browser. This deliberately diverges from D10 (manual entry uses a plain
  object): a single binary file's natural carrier is `FormData`.
- **Ordering / failure mode.** The image is uploaded **before** the row is
  inserted, so a storage failure leaves no dangling receipt (proven by test).
  A DB failure after a successful upload can orphan an object — an acceptable,
  low-frequency trade-off for a single-user app; a storage-cleanup pass is a
  later concern.
- **Validation (D6).** Boundary Zod schema accepts only JPEG/PNG/WebP, rejects
  empty/oversized (>10 MB) and missing files.
- **Layering:** `lib/receipts/{schema,records,storage,supabase-storage,service}.ts`
  separate validation, pure row/object-key building, the storage port, the
  Supabase adapter, and DB access.
- **Env:** documented `SUPABASE_URL` (server-side, falls back to
  `NEXT_PUBLIC_SUPABASE_URL`) in `.env.example` alongside the existing
  `SUPABASE_SERVICE_ROLE_KEY` / `SUPABASE_RECEIPTS_BUCKET` placeholders.
- **Verification:** Vitest 55/55 (schema accept/reject, record/object-key
  builders, form behavior with mocked action, **PGlite integration** proving a
  `pending` `receipts` row is written + bytes/content-type reach storage + no
  row on storage failure), `next lint` clean, `prettier --check` clean,
  `next build` OK (10 routes, `/capture/receipt` prerendered), Playwright 7/7.
  Real Supabase upload is verified manually/deferred because the test env has no
  Supabase credentials (same rationale as Slices 1 & 3).
