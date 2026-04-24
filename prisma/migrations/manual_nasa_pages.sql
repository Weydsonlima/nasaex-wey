-- NASA Pages — migration manual (apenas os novos artefatos)
DO $$ BEGIN
  CREATE TYPE "NasaPageStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "NasaPageIntent" AS ENUM ('INSTITUTIONAL', 'LANDING', 'BIO_LINK', 'EVENT', 'PRODUCT', 'PORTFOLIO', 'CUSTOM');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "NasaPageDomainStatus" AS ENUM ('PENDING', 'VERIFIED', 'FAILED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "NasaPageDomainSource" AS ENUM ('EXTERNAL', 'PURCHASED_VIA_NASA');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "NasaPageDomainPurchaseStatus" AS ENUM ('NOT_STARTED', 'SEARCHING', 'AWAITING_PAYMENT', 'PAID', 'REGISTERING', 'ACTIVE', 'FAILED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "nasa_pages" (
  "id"                            TEXT NOT NULL,
  "organization_id"               TEXT NOT NULL,
  "user_id"                       TEXT NOT NULL,
  "slug"                          TEXT NOT NULL,
  "title"                         TEXT NOT NULL,
  "description"                   TEXT,
  "favicon_url"                   TEXT,
  "og_image_url"                  TEXT,
  "intent"                        "NasaPageIntent" NOT NULL DEFAULT 'CUSTOM',
  "status"                        "NasaPageStatus" NOT NULL DEFAULT 'DRAFT',
  "layer_count"                   INTEGER NOT NULL DEFAULT 1,
  "palette"                       JSONB NOT NULL DEFAULT '{}',
  "font_family"                   TEXT,
  "layout"                        JSONB NOT NULL DEFAULT '{}',
  "published_layout"              JSONB,
  "published_at"                  TIMESTAMP(3),
  "custom_domain"                 TEXT,
  "domain_status"                 "NasaPageDomainStatus",
  "domain_source"                 "NasaPageDomainSource",
  "domain_verify_token"           TEXT,
  "is_template"                   BOOLEAN NOT NULL DEFAULT false,
  "template_marked_by_moderator"  BOOLEAN NOT NULL DEFAULT false,
  "template_category"             TEXT,
  "stars_spent"                   INTEGER NOT NULL DEFAULT 0,
  "created_at"                    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"                    TIMESTAMP(3) NOT NULL,
  CONSTRAINT "nasa_pages_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "nasa_pages_slug_key"          ON "nasa_pages"("slug");
CREATE UNIQUE INDEX IF NOT EXISTS "nasa_pages_custom_domain_key" ON "nasa_pages"("custom_domain");
CREATE INDEX        IF NOT EXISTS "nasa_pages_organization_id_idx" ON "nasa_pages"("organization_id");
CREATE INDEX        IF NOT EXISTS "nasa_pages_status_idx"          ON "nasa_pages"("status");
CREATE INDEX        IF NOT EXISTS "nasa_pages_custom_domain_idx"   ON "nasa_pages"("custom_domain");

ALTER TABLE "nasa_pages" DROP CONSTRAINT IF EXISTS "nasa_pages_organization_id_fkey";
ALTER TABLE "nasa_pages" ADD CONSTRAINT "nasa_pages_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "nasa_pages" DROP CONSTRAINT IF EXISTS "nasa_pages_user_id_fkey";
ALTER TABLE "nasa_pages" ADD CONSTRAINT "nasa_pages_user_id_fkey"         FOREIGN KEY ("user_id")         REFERENCES "user"("id")         ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "nasa_page_versions" (
  "id"         TEXT NOT NULL,
  "page_id"    TEXT NOT NULL,
  "snapshot"   JSONB NOT NULL,
  "label"      TEXT,
  "created_by" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "nasa_page_versions_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "nasa_page_versions_page_id_idx" ON "nasa_page_versions"("page_id");
ALTER TABLE "nasa_page_versions" DROP CONSTRAINT IF EXISTS "nasa_page_versions_page_id_fkey";
ALTER TABLE "nasa_page_versions" ADD CONSTRAINT "nasa_page_versions_page_id_fkey" FOREIGN KEY ("page_id") REFERENCES "nasa_pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "nasa_page_assets" (
  "id"               TEXT NOT NULL,
  "page_id"          TEXT NOT NULL,
  "organization_id"  TEXT NOT NULL,
  "url"              TEXT NOT NULL,
  "kind"             TEXT NOT NULL,
  "original_name"    TEXT,
  "size_bytes"       INTEGER,
  "created_at"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "nasa_page_assets_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "nasa_page_assets_page_id_idx"         ON "nasa_page_assets"("page_id");
CREATE INDEX IF NOT EXISTS "nasa_page_assets_organization_id_idx" ON "nasa_page_assets"("organization_id");
ALTER TABLE "nasa_page_assets" DROP CONSTRAINT IF EXISTS "nasa_page_assets_page_id_fkey";
ALTER TABLE "nasa_page_assets" ADD CONSTRAINT "nasa_page_assets_page_id_fkey" FOREIGN KEY ("page_id") REFERENCES "nasa_pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "nasa_page_visits" (
  "id"         TEXT NOT NULL,
  "page_id"    TEXT NOT NULL,
  "path"       TEXT,
  "referrer"   TEXT,
  "user_agent" TEXT,
  "country"    TEXT,
  "ip_address" TEXT,
  "device"     TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "nasa_page_visits_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "nasa_page_visits_page_id_idx"    ON "nasa_page_visits"("page_id");
CREATE INDEX IF NOT EXISTS "nasa_page_visits_created_at_idx" ON "nasa_page_visits"("created_at");
ALTER TABLE "nasa_page_visits" DROP CONSTRAINT IF EXISTS "nasa_page_visits_page_id_fkey";
ALTER TABLE "nasa_page_visits" ADD CONSTRAINT "nasa_page_visits_page_id_fkey" FOREIGN KEY ("page_id") REFERENCES "nasa_pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "nasa_page_domain_purchases" (
  "id"                TEXT NOT NULL,
  "page_id"           TEXT NOT NULL,
  "provider"          TEXT NOT NULL,
  "requested_domain"  TEXT NOT NULL,
  "tld_price_cents"   INTEGER,
  "currency"          TEXT,
  "checkout_url"      TEXT,
  "external_order_id" TEXT,
  "status"            "NasaPageDomainPurchaseStatus" NOT NULL DEFAULT 'NOT_STARTED',
  "last_error"        TEXT,
  "created_at"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"        TIMESTAMP(3) NOT NULL,
  CONSTRAINT "nasa_page_domain_purchases_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "nasa_page_domain_purchases_page_id_key" ON "nasa_page_domain_purchases"("page_id");
CREATE INDEX        IF NOT EXISTS "nasa_page_domain_purchases_status_idx"  ON "nasa_page_domain_purchases"("status");
ALTER TABLE "nasa_page_domain_purchases" DROP CONSTRAINT IF EXISTS "nasa_page_domain_purchases_page_id_fkey";
ALTER TABLE "nasa_page_domain_purchases" ADD CONSTRAINT "nasa_page_domain_purchases_page_id_fkey" FOREIGN KEY ("page_id") REFERENCES "nasa_pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
