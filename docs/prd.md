# Purchase Intelligence App PRD

## Product overview

This product is a single-user personal finance web app designed to help one person understand what they buy, how often they buy it, how those purchases relate to payday cycles, and where more efficient spending strategies may exist. The core capture methods are receipt photos plus manual entries, because that supports item-level detail instead of only account-level totals.[cite:80][cite:85][cite:98]

The product goal is not generic budgeting. The goal is to build a personal purchase intelligence system that turns messy real-world shopping behaviour into structured data and then into practical recommendations, such as bulk-buy opportunities, repeated convenience top-ups, and predictable pre-payday spikes.[cite:95][cite:102][cite:106]

## Problem

Most budgeting apps focus on account balances, merchant totals, subscriptions, and high-level category spend, but they often stop short of giving item-level understanding of household purchases or actionable optimisation advice.[cite:94][cite:95][cite:102]

A user may know they spent £420 on groceries last month, but that does not reveal whether they repeatedly bought small quantities of staple items, split purchases across too many shops, or missed opportunities to bulk buy. Public receipt-scanning examples show that item-level extraction is what makes those deeper insights possible.[cite:80][cite:85][cite:98]

## Product goals

- Capture purchases from receipt photos.
- Support manual entry for purchases that do not come from receipts, such as fuel, parking, or cash spending.
- Store purchase data at both receipt level and item level.
- Show dashboards for spend by merchant, category, item, and payday period.
- Detect frequency, quantity, and timing patterns.
- Generate plain-English suggestions for more efficient spending behaviour.
- Remain single-user and simple in v1.

## Non-goals for v1

- Multi-user households.
- Direct open-banking integration.
- Automatic bank reconciliation.
- Tax or accounting workflows.
- Complex authentication or team features.
- Premium plans, subscriptions, or billing.
- Full autonomous financial advice.

## Primary user

A single UK-based user who wants visibility and control over day-to-day spending, especially groceries and recurring household purchases, and who is willing to review OCR results if that leads to better long-term insight.

## Core user stories

- As a user, I want to photograph a receipt so the app can extract merchant, date, totals, and line items.[cite:85][cite:98]
- As a user, I want to correct OCR mistakes before saving so my data stays trustworthy.[cite:85][cite:98]
- As a user, I want to manually add purchases like fuel that may not be captured via a standard receipt workflow.[cite:101][cite:102]
- As a user, I want to define my payday schedule so the app can analyse spending relative to income timing.
- As a user, I want to see what I buy most often, in what quantities, and from which merchants.[cite:95][cite:99][cite:102]
- As a user, I want the app to flag possible efficiency opportunities, such as bulk-buy candidates or repeated convenience spending.[cite:85][cite:101][cite:106]

## Product principles

### 1. Item-level truth over account-level vagueness

The app should optimise for line-item understanding, not just merchant totals, because purchase strategy depends on what was bought, not only where money was spent.[cite:80][cite:85][cite:98]

### 2. Human-in-the-loop by design

OCR and AI should accelerate capture, but the user should be able to review and correct parsed data before it becomes part of the permanent record. Public receipt tools commonly include editable review because real receipts are messy and OCR is imperfect.[cite:85][cite:96][cite:98]

### 3. Recommendations must be explainable

Every insight should be backed by visible transaction or item history. The app should not say “bulk buy pasta” unless the user can see the frequency, quantity, and timing pattern that caused that suggestion.

### 4. One-person product, low overhead

The architecture should favour simple, maintainable choices that a single builder can understand and evolve.

## Functional requirements

### Receipt capture

- User can upload a photo from desktop or mobile camera roll.
- User can add multiple receipts over time.
- App stores original receipt image.
- App tracks OCR status: pending, parsed, reviewed, saved, failed.

### OCR and parsing

- App extracts merchant, date, total, subtotal if available, and line items.[cite:85][cite:98][cite:102]
- Line items should include raw text, parsed name, price, and any detectable quantity or unit size.
- App stores OCR confidence or parsing confidence where available.[cite:96]

### Review and correction

- User can edit merchant, date, category, and totals.
- User can edit each line item before saving.
- User can merge duplicate or similar item names into a normalised item identity.
- User can mark an OCR line as noise or non-purchase text.

### Manual entries

- User can create entries without a receipt.
- Manual entries support merchant, date, category, amount, notes, and optional item details.
- Manual entries can be tagged as fuel, transport, household, cash, or custom categories.

### Dashboards

- Spend by month.
- Spend by payday cycle.
- Spend by category.
- Spend by merchant.
- Spend by item.
- Purchase frequency by item.
- Quantity purchased over time by item where quantity data exists.
- Top repeat purchases.
- Top top-up merchants.

### Insights engine

The system should produce rules-based insights first, with LLM phrasing layered on top.

Required initial insight types:
- Bulk-buy candidate.
- Repeated convenience top-up pattern.
- Pre-payday spending spike.
- Merchant fragmentation for the same category.
- Stable staple item suitable for planned purchase cadence.

### Payday logic

- User can define one or more payday dates or recurrence rules.
- App assigns each purchase to a payday cycle.
- Dashboard can filter by “days since payday” and “week in cycle.”

## Data model

### Receipt
- id
- source_image_url
- merchant_name_raw
- merchant_name_normalized
- purchase_datetime
- subtotal
- total
- tax
- currency
- ocr_status
- parse_confidence
- review_status
- notes
- created_at
- updated_at

### Item
- id
- receipt_id
- source_type (receipt/manual)
- raw_line_text
- item_name_raw
- item_name_normalized
- item_group
- variant
- quantity_value
- quantity_unit
- unit_size_value
- unit_size_unit
- price
- category
- merchant_name_normalized
- purchase_datetime
- payday_cycle_id
- confidence
- excluded_flag
- created_at
- updated_at

### Manual entry
- id
- merchant
- purchase_datetime
- amount
- category
- notes
- itemized_flag
- payday_cycle_id

### Payday cycle
- id
- start_date
- end_date
- payday_date
- label

### Insight
- id
- insight_type
- title
- explanation
- evidence_payload
- confidence_score
- created_at

## UX requirements

- Mobile-first layout.
- Fast receipt review flow with minimal taps.
- Clear difference between raw OCR text and corrected final values.
- Dashboard language should be plain English, not finance jargon.
- Every insight card should include “why this appeared.”
- Dark mode and light mode should both be supported.[cite:16]

## Suggested v1 stack

- Frontend: Next.js or React-based web app.
- UI: simple component system with responsive cards, tables, and charts.
- Database: Supabase Postgres or equivalent low-overhead hosted relational database.
- File storage: object storage for receipt images.
- OCR/parsing: API or service layer that can combine OCR plus structured parsing.[cite:91][cite:96]
- Charts: standard charting library for trends and frequency views.
- AI layer: LLM used after structured analysis, mainly for explanation and suggestion wording.[cite:81][cite:85]

## Milestones

### Milestone 1: Foundation
- Project scaffold.
- Database schema.
- Receipt image upload.
- Manual entry form.

### Milestone 2: Parsing workflow
- OCR integration.
- Parsed receipt review screen.
- Save corrected receipt and items.

### Milestone 3: Dashboard
- Merchant, category, item, and monthly views.
- Payday-cycle filters.
- Frequency tables and summary cards.

### Milestone 4: Insights
- Rules engine for first five insight types.
- Insight cards with explanation and evidence.
- LLM layer for natural-language recommendations.

### Milestone 5: Data quality
- Item aliasing.
- Merge similar items.
- Better quantity parsing.
- Duplicate receipt handling.

## Success criteria for v1

V1 is complete when all of the following are true:

- A receipt can be uploaded, parsed, corrected, and saved end to end.[cite:85][cite:98]
- A manual fuel or cash purchase can be added and appears in analysis.[cite:101][cite:102]
- The dashboard shows spend by month, merchant, category, item, and payday cycle.[cite:95][cite:99][cite:102]
- The app can surface at least five useful insights from stored data.[cite:85][cite:106]
- The user can understand why each insight was produced.
- The app feels usable on mobile and desktop.
