-- LinnkerPage: QR de contato + overrides do vCard
ALTER TABLE "linnker_pages" ADD COLUMN "qr_enabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "linnker_pages" ADD COLUMN "qr_message_template" TEXT;
ALTER TABLE "linnker_pages" ADD COLUMN "vcard_overrides" JSONB;

-- LinnkerScan: UTM tracking + scanKind + índice de correlação
ALTER TABLE "linnker_scans" ADD COLUMN "utm_source" TEXT;
ALTER TABLE "linnker_scans" ADD COLUMN "utm_medium" TEXT;
ALTER TABLE "linnker_scans" ADD COLUMN "utm_campaign" TEXT;
ALTER TABLE "linnker_scans" ADD COLUMN "scan_kind" TEXT;
CREATE INDEX "linnker_scans_user_agent_created_at_idx" ON "linnker_scans" ("user_agent", "created_at");
