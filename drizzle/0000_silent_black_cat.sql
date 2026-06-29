CREATE TYPE "public"."insight_type" AS ENUM('bulk_buy', 'convenience_topup', 'pre_payday_spike', 'merchant_fragmentation', 'stable_staple');--> statement-breakpoint
CREATE TYPE "public"."item_source_type" AS ENUM('receipt', 'manual');--> statement-breakpoint
CREATE TYPE "public"."ocr_status" AS ENUM('pending', 'parsed', 'reviewed', 'saved', 'failed');--> statement-breakpoint
CREATE TYPE "public"."review_status" AS ENUM('unreviewed', 'reviewed');--> statement-breakpoint
CREATE TABLE "insights" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"insight_type" "insight_type" NOT NULL,
	"title" text NOT NULL,
	"explanation" text NOT NULL,
	"evidence_payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"confidence_score" numeric(5, 4),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"receipt_id" uuid,
	"source_type" "item_source_type" NOT NULL,
	"raw_line_text" text,
	"item_name_raw" text,
	"item_name_normalized" text,
	"item_group" text,
	"variant" text,
	"quantity_value" numeric,
	"quantity_unit" text,
	"unit_size_value" numeric,
	"unit_size_unit" text,
	"price" numeric(12, 2),
	"category" text,
	"merchant_name_normalized" text,
	"purchase_datetime" timestamp with time zone,
	"payday_cycle_id" uuid,
	"confidence" numeric(5, 4),
	"excluded_flag" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "manual_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"merchant" text,
	"purchase_datetime" timestamp with time zone NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"category" text,
	"notes" text,
	"itemized_flag" boolean DEFAULT false NOT NULL,
	"payday_cycle_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payday_cycles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"payday_date" date NOT NULL,
	"label" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "receipts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_image_url" text,
	"merchant_name_raw" text,
	"merchant_name_normalized" text,
	"purchase_datetime" timestamp with time zone,
	"subtotal" numeric(12, 2),
	"total" numeric(12, 2),
	"tax" numeric(12, 2),
	"currency" text DEFAULT 'GBP' NOT NULL,
	"ocr_status" "ocr_status" DEFAULT 'pending' NOT NULL,
	"parse_confidence" numeric(5, 4),
	"review_status" "review_status" DEFAULT 'unreviewed' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_receipt_id_receipts_id_fk" FOREIGN KEY ("receipt_id") REFERENCES "public"."receipts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_payday_cycle_id_payday_cycles_id_fk" FOREIGN KEY ("payday_cycle_id") REFERENCES "public"."payday_cycles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manual_entries" ADD CONSTRAINT "manual_entries_payday_cycle_id_payday_cycles_id_fk" FOREIGN KEY ("payday_cycle_id") REFERENCES "public"."payday_cycles"("id") ON DELETE set null ON UPDATE no action;