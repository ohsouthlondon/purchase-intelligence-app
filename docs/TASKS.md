# TASKS.md

## Milestone 1: Foundation

Delivered in slices: Slice 0 scaffold/tooling → Slice 1 DB & schema →
Slice 2 app shell (nav + theme) → Slice 3 manual entry (E2E) → Slice 4 receipt upload.

- [x] Initialise app scaffold. _(Slice 0)_
- [x] Set up TypeScript, linting, and formatting. _(Slice 0)_
- [x] Configure database and ORM. _(Slice 1 — Drizzle + Supabase Postgres)_
- [x] Create initial schema for receipts, items, manual entries, payday cycles, and insights. _(Slice 1)_
- [x] Add receipt image upload flow. _(Slice 4 — Server Action + Zod; Supabase Storage via an injectable port; persists a pending `receipts` row)_
- [x] Add manual purchase entry form. _(Slice 3 — Server Action + Zod, non-itemized & itemized)_
- [x] Create base layout with mobile-first navigation. _(Slice 2)_
- [x] Add dark and light mode support. _(Slice 2)_

## Milestone 2: Parsing workflow

In slices: Slice 1 parse seam (stub) + header-only review scaffold →
Slice 2 live provider behind the seam (mock fallback) + auto-parse on upload →
Slice 3 parse-quality UX → Slice 4 line-item correction and deletion.

- [x] Integrate OCR/parsing service. _(Slice 2 — live HTTP adapter selected by
      `createReceiptParser` with automatic mock fallback; upload auto-parses so
      review opens pre-filled. Slice 1 landed the seam + Zod contract + mock.)_
- [x] Build parsed receipt review screen. _(Slice 1 — header-only scaffold;
      line items read-only)_
- [x] Allow merchant/date/total editing. _(Slice 1)_
- [x] Allow line-item correction and deletion. _(Slice 4 — each parsed line's
      name/quantity/unit price is editable and removable in
      `receipt-items-editor`; `rawLineText` stays read-only as evidence. Adding
      new lines is out of scope.)_
- [x] Save reviewed receipt and item rows. _(Slice 4 — `saveReviewedReceipt`
      now reconciles item edits and deletions in the same transaction as the
      header; absent `items` leaves rows untouched. Slice 1 persisted items at
      parse time.)_
- [x] Add failed parse handling. _(Slice 1 — parser/validation failure sets
      `ocr_status='failed'` + reason note, writes no items)_
- [x] Surface parse quality in review. _(Slice 3 — derived, no-schema notice for
      partial/low-confidence parses, per-item low-confidence flag, clearer
      failed-state retry copy; logic in `lib/receipts/review/quality.ts`)_

## Milestone 3: Dashboard

- [x] Build monthly spend summary. _(Slice 1 — `/dashboard` shows last-12-month
      spend + purchase counts. Unified spend per D8a: reviewed receipt totals +
      non-itemized manual amounts + manual item prices. Pure aggregation in
      `lib/dashboard/spend.ts`, read layer in `lib/dashboard/queries.ts`.)_
- [ ] Build merchant spend view.
- [ ] Build category spend view.
- [ ] Build item frequency table.
- [ ] Build quantity-over-time view where quantity data exists.
- [ ] Add payday-cycle filters and views.

## Milestone 4: Insights

- [ ] Implement bulk-buy candidate rule.
- [ ] Implement convenience top-up pattern rule.
- [ ] Implement pre-payday spike rule.
- [ ] Implement merchant fragmentation rule.
- [ ] Implement stable staple cadence rule.
- [ ] Build insight cards with supporting evidence.
- [ ] Add optional LLM phrasing layer on top of deterministic results.

## Milestone 5: Data quality

- [ ] Add merchant alias normalization.
- [ ] Add item alias normalization.
- [ ] Add merge flow for similar items.
- [ ] Add duplicate receipt detection.
- [ ] Improve quantity parsing heuristics.

## Working rules

- Complete tasks in milestone order unless a dependency forces a change.
- Update checkboxes immediately after verified completion.
- Add newly discovered tasks in the correct milestone.
