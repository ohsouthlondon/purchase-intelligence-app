# PLANNING.md

## Vision

Build a personal purchase intelligence app that turns receipts and manual spend entries into structured purchase history, clear dashboards, and practical efficiency suggestions.

## Product shape

This is a single-user, mobile-first web app. It should feel like a focused personal tool rather than a startup SaaS product.

Core flow:
1. Capture receipt or manual purchase.
2. Review and correct parsed data.
3. Save structured records.
4. Explore dashboard views.
5. Read AI-assisted efficiency suggestions.

## Architecture

### Frontend
- Next.js app router or equivalent React framework.
- Mobile-first responsive UI.
- Key screens: inbox, receipt review, manual entry, dashboard, insights, settings.

### Backend
- Simple server actions or API routes.
- OCR/parsing integration behind a service boundary.
- Analytics layer separated from UI rendering.
- Rules engine for deterministic insights before any LLM summarisation.

### Database
Relational schema because the app needs:
- receipts,
- many receipt items,
- manual entries,
- payday cycles,
- generated insights,
- alias mapping for normalized items and merchants.

### Storage
Receipt images stored separately from transactional data.

## Recommended technical stack

### Recommended default
- Next.js
- TypeScript
- Tailwind or simple CSS system
- Supabase Postgres
- Supabase Storage
- Prisma or Drizzle ORM
- Chart library such as Recharts

### Why this stack
- Widely supported by Claude Code workflows.
- Good for CRUD-heavy product work.
- Easy to inspect and evolve.
- Supports relational analytics cleanly.

## Domain model assumptions

- A receipt can have zero or more parsed items.
- Some purchases are manual and may or may not be itemized.
- Items need both raw and normalized names.
- Payday cycles are computed and assigned after purchase date is known.
- Insights are generated artifacts, not source truth.

## Milestone strategy

### Milestone 1
Scaffold project, establish schema, create upload/manual entry UI, and persist data.

### Milestone 2
Implement OCR parse pipeline and review/correction flow.

### Milestone 3
Implement dashboard queries and visual views.

### Milestone 4
Implement deterministic insights, then optional LLM phrasing layer.

### Milestone 5
Improve data quality and normalization.

## Key risks

### OCR variability
Receipts vary widely in layout and print quality. The app must assume imperfect OCR and make review fast.

### Quantity ambiguity
Some receipts do not expose quantity cleanly, so the system must support partial item detail.

### Over-scoping AI
The app should not rely on the LLM to perform core calculations that belong in deterministic logic.

### Data normalization complexity
Normalising item names and merchant aliases can sprawl if not constrained carefully.

## Design principles

- Clear, calm UI.
- Strong information hierarchy.
- Fast review workflow.
- Explanations over black-box outputs.
- Use charts only where they improve understanding.

## Definition of done

A milestone is done when:
- code is implemented,
- relevant data flow works end to end,
- the feature is manually testable,
- tasks are updated,
- any important decisions are logged.
