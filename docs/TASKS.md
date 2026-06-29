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
Slice 2 real OCR provider behind the seam → later slice line-item correction.

- [ ] Integrate OCR/parsing service. _(Slice 1: parser seam + Zod-validated
      contract + deterministic stub landed; real provider is Slice 2)_
- [x] Build parsed receipt review screen. _(Slice 1 — header-only scaffold;
      line items read-only)_
- [x] Allow merchant/date/total editing. _(Slice 1)_
- [ ] Allow line-item correction and deletion.
- [x] Save reviewed receipt and item rows. _(Slice 1 — items persisted at parse;
      review saves the header and marks the receipt reviewed)_
- [x] Add failed parse handling. _(Slice 1 — parser/validation failure sets
      `ocr_status='failed'` + reason note, writes no items)_

## Milestone 3: Dashboard

- [ ] Build monthly spend summary.
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
