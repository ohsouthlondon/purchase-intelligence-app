import { relations } from "drizzle-orm";
import {
  boolean,
  date,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * Purchase Intelligence App — relational schema.
 *
 * Conventions (per approved decisions):
 * - Primary keys are UUIDs (gen_random_uuid()).
 * - Money is stored as NUMERIC(12,2) and interpreted as GBP (single-currency v1).
 * - Timestamps are stored as `timestamptz` in UTC; the UI displays Europe/London.
 * - `items.receipt_id` is NULLABLE so itemized manual purchases can exist as
 *   item rows without a parent receipt (source_type = 'manual').
 *
 * Planned (Milestone 3, not built here): a canonical "unified spend" analytics
 * view that UNIONs receipt totals with non-itemized manual_entries amounts, so
 * dashboards can aggregate all spend consistently regardless of capture path.
 */

// --- Enums -----------------------------------------------------------------

export const ocrStatusEnum = pgEnum("ocr_status", [
  "pending",
  "parsed",
  "reviewed",
  "saved",
  "failed",
]);

export const reviewStatusEnum = pgEnum("review_status", [
  "unreviewed",
  "reviewed",
]);

export const itemSourceTypeEnum = pgEnum("item_source_type", [
  "receipt",
  "manual",
]);

export const insightTypeEnum = pgEnum("insight_type", [
  "bulk_buy",
  "convenience_topup",
  "pre_payday_spike",
  "merchant_fragmentation",
  "stable_staple",
]);

// --- Payday cycles ---------------------------------------------------------

export const paydayCycles = pgTable("payday_cycles", {
  id: uuid("id").primaryKey().defaultRandom(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  paydayDate: date("payday_date").notNull(),
  label: text("label"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// --- Receipts --------------------------------------------------------------

export const receipts = pgTable("receipts", {
  id: uuid("id").primaryKey().defaultRandom(),
  sourceImageUrl: text("source_image_url"),
  merchantNameRaw: text("merchant_name_raw"),
  merchantNameNormalized: text("merchant_name_normalized"),
  purchaseDatetime: timestamp("purchase_datetime", { withTimezone: true }),
  subtotal: numeric("subtotal", { precision: 12, scale: 2 }),
  total: numeric("total", { precision: 12, scale: 2 }),
  tax: numeric("tax", { precision: 12, scale: 2 }),
  currency: text("currency").default("GBP").notNull(),
  ocrStatus: ocrStatusEnum("ocr_status").default("pending").notNull(),
  parseConfidence: numeric("parse_confidence", { precision: 5, scale: 4 }),
  reviewStatus: reviewStatusEnum("review_status")
    .default("unreviewed")
    .notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// --- Items (receipt line items AND itemized manual entries) ----------------
// receipt_id is NULLABLE: manual item rows have source_type='manual' and no
// parent receipt (approved decision D3).

export const items = pgTable("items", {
  id: uuid("id").primaryKey().defaultRandom(),
  receiptId: uuid("receipt_id").references(() => receipts.id, {
    onDelete: "cascade",
  }),
  sourceType: itemSourceTypeEnum("source_type").notNull(),
  rawLineText: text("raw_line_text"),
  itemNameRaw: text("item_name_raw"),
  itemNameNormalized: text("item_name_normalized"),
  itemGroup: text("item_group"),
  variant: text("variant"),
  quantityValue: numeric("quantity_value"),
  quantityUnit: text("quantity_unit"),
  unitSizeValue: numeric("unit_size_value"),
  unitSizeUnit: text("unit_size_unit"),
  price: numeric("price", { precision: 12, scale: 2 }),
  category: text("category"),
  merchantNameNormalized: text("merchant_name_normalized"),
  purchaseDatetime: timestamp("purchase_datetime", { withTimezone: true }),
  paydayCycleId: uuid("payday_cycle_id").references(() => paydayCycles.id, {
    onDelete: "set null",
  }),
  confidence: numeric("confidence", { precision: 5, scale: 4 }),
  excludedFlag: boolean("excluded_flag").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// --- Manual entries (non-itemized or summary purchases) --------------------

export const manualEntries = pgTable("manual_entries", {
  id: uuid("id").primaryKey().defaultRandom(),
  merchant: text("merchant"),
  purchaseDatetime: timestamp("purchase_datetime", {
    withTimezone: true,
  }).notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  category: text("category"),
  notes: text("notes"),
  itemizedFlag: boolean("itemized_flag").default(false).notNull(),
  paydayCycleId: uuid("payday_cycle_id").references(() => paydayCycles.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// --- Insights (generated artifacts; populated in Milestone 4) --------------

export const insights = pgTable("insights", {
  id: uuid("id").primaryKey().defaultRandom(),
  insightType: insightTypeEnum("insight_type").notNull(),
  title: text("title").notNull(),
  explanation: text("explanation").notNull(),
  evidencePayload: jsonb("evidence_payload").default({}).notNull(),
  confidenceScore: numeric("confidence_score", { precision: 5, scale: 4 }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// --- Relations -------------------------------------------------------------

export const receiptsRelations = relations(receipts, ({ many }) => ({
  items: many(items),
}));

export const paydayCyclesRelations = relations(paydayCycles, ({ many }) => ({
  items: many(items),
  manualEntries: many(manualEntries),
}));

export const itemsRelations = relations(items, ({ one }) => ({
  receipt: one(receipts, {
    fields: [items.receiptId],
    references: [receipts.id],
  }),
  paydayCycle: one(paydayCycles, {
    fields: [items.paydayCycleId],
    references: [paydayCycles.id],
  }),
}));

export const manualEntriesRelations = relations(manualEntries, ({ one }) => ({
  paydayCycle: one(paydayCycles, {
    fields: [manualEntries.paydayCycleId],
    references: [paydayCycles.id],
  }),
}));
