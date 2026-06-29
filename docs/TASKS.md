# TASKS.md

## Milestone 1: Foundation

Delivered in slices: Slice 0 scaffold/tooling → Slice 1 DB & schema →
Slice 2 app shell (nav + theme) → Slice 3 manual entry (E2E) → Slice 4 receipt upload.

- [x] Initialise app scaffold. _(Slice 0)_
- [x] Set up TypeScript, linting, and formatting. _(Slice 0)_
- [x] Configure database and ORM. _(Slice 1 — Drizzle + Supabase Postgres)_
- [x] Create initial schema for receipts, items, manual entries, payday cycles, and insights. _(Slice 1)_
- [ ] Add receipt image upload flow.
- [ ] Add manual purchase entry form.
- [ ] Create base layout with mobile-first navigation.
- [ ] Add dark and light mode support.

## Milestone 2: Parsing workflow

- [ ] Integrate OCR/parsing service.
- [ ] Build parsed receipt review screen.
- [ ] Allow merchant/date/total editing.
- [ ] Allow line-item correction and deletion.
- [ ] Save reviewed receipt and item rows.
- [ ] Add failed parse handling.

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
