-- NASA Route v1 — migration manual
-- Cria os modelos do hub de cursos NASA Route (estilo Hotmart, pago em STARs).
-- Idempotente: pode ser re-executada sem efeitos colaterais.

-- ─── enum values novos ───────────────────────────────────────────────────
ALTER TYPE "StarTransactionType" ADD VALUE IF NOT EXISTS 'COURSE_PURCHASE';
ALTER TYPE "StarTransactionType" ADD VALUE IF NOT EXISTS 'COURSE_PAYOUT';

-- ─── nasa_route_category ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "nasa_route_category" (
  "id"           TEXT PRIMARY KEY,
  "slug"         TEXT NOT NULL,
  "name"         TEXT NOT NULL,
  "description"  TEXT,
  "icon_key"     TEXT,
  "order"        INTEGER NOT NULL DEFAULT 0,
  "is_active"    BOOLEAN NOT NULL DEFAULT true,
  "created_at"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"   TIMESTAMP(3) NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "nasa_route_category_slug_key"
  ON "nasa_route_category"("slug");

-- ─── nasa_route_course ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "nasa_route_course" (
  "id"                    TEXT PRIMARY KEY,
  "slug"                  TEXT NOT NULL,
  "title"                 TEXT NOT NULL,
  "subtitle"              TEXT,
  "description"           TEXT,
  "cover_url"             TEXT,
  "trailer_url"           TEXT,
  "level"                 TEXT NOT NULL DEFAULT 'beginner',
  "duration_min"          INTEGER,
  "format"                TEXT NOT NULL DEFAULT 'course',
  "creator_org_id"        TEXT NOT NULL,
  "creator_user_id"       TEXT NOT NULL,
  "category_id"           TEXT,
  "price_stars"           INTEGER NOT NULL DEFAULT 0,
  "is_published"          BOOLEAN NOT NULL DEFAULT false,
  "published_at"          TIMESTAMP(3),
  "students_count"        INTEGER NOT NULL DEFAULT 0,
  "reward_sp_on_complete" INTEGER NOT NULL DEFAULT 0,
  "created_at"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"            TIMESTAMP(3) NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "nasa_route_course_creator_slug_key"
  ON "nasa_route_course"("creator_org_id", "slug");
CREATE INDEX IF NOT EXISTS "nasa_route_course_creator_org_idx"
  ON "nasa_route_course"("creator_org_id");
CREATE INDEX IF NOT EXISTS "nasa_route_course_category_idx"
  ON "nasa_route_course"("category_id");
CREATE INDEX IF NOT EXISTS "nasa_route_course_published_idx"
  ON "nasa_route_course"("is_published", "published_at");

DO $$ BEGIN
  ALTER TABLE "nasa_route_course"
    ADD CONSTRAINT "nasa_route_course_creator_org_id_fkey"
    FOREIGN KEY ("creator_org_id") REFERENCES "organization"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "nasa_route_course"
    ADD CONSTRAINT "nasa_route_course_creator_user_id_fkey"
    FOREIGN KEY ("creator_user_id") REFERENCES "user"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "nasa_route_course"
    ADD CONSTRAINT "nasa_route_course_category_id_fkey"
    FOREIGN KEY ("category_id") REFERENCES "nasa_route_category"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── nasa_route_module ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "nasa_route_module" (
  "id"         TEXT PRIMARY KEY,
  "course_id"  TEXT NOT NULL,
  "order"      INTEGER NOT NULL DEFAULT 0,
  "title"      TEXT NOT NULL,
  "summary"    TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL
);

CREATE INDEX IF NOT EXISTS "nasa_route_module_course_order_idx"
  ON "nasa_route_module"("course_id", "order");

DO $$ BEGIN
  ALTER TABLE "nasa_route_module"
    ADD CONSTRAINT "nasa_route_module_course_id_fkey"
    FOREIGN KEY ("course_id") REFERENCES "nasa_route_course"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── nasa_route_lesson ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "nasa_route_lesson" (
  "id"              TEXT PRIMARY KEY,
  "course_id"       TEXT NOT NULL,
  "module_id"       TEXT,
  "order"           INTEGER NOT NULL DEFAULT 0,
  "title"           TEXT NOT NULL,
  "summary"         TEXT,
  "content_md"      TEXT,
  "video_url"       TEXT,
  "video_provider"  TEXT,
  "video_id"        TEXT,
  "duration_min"    INTEGER,
  "is_free_preview" BOOLEAN NOT NULL DEFAULT false,
  "award_sp"        INTEGER NOT NULL DEFAULT 10,
  "created_at"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"      TIMESTAMP(3) NOT NULL
);

CREATE INDEX IF NOT EXISTS "nasa_route_lesson_course_order_idx"
  ON "nasa_route_lesson"("course_id", "order");

DO $$ BEGIN
  ALTER TABLE "nasa_route_lesson"
    ADD CONSTRAINT "nasa_route_lesson_course_id_fkey"
    FOREIGN KEY ("course_id") REFERENCES "nasa_route_course"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "nasa_route_lesson"
    ADD CONSTRAINT "nasa_route_lesson_module_id_fkey"
    FOREIGN KEY ("module_id") REFERENCES "nasa_route_module"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── nasa_route_enrollment ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "nasa_route_enrollment" (
  "id"            TEXT PRIMARY KEY,
  "user_id"       TEXT NOT NULL,
  "course_id"     TEXT NOT NULL,
  "buyer_org_id"  TEXT,
  "paid_stars"    INTEGER NOT NULL DEFAULT 0,
  "source"        TEXT NOT NULL DEFAULT 'purchase',
  "payment_ref"   TEXT,
  "status"        TEXT NOT NULL DEFAULT 'active',
  "enrolled_at"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completed_at"  TIMESTAMP(3)
);

CREATE UNIQUE INDEX IF NOT EXISTS "nasa_route_enrollment_user_course_key"
  ON "nasa_route_enrollment"("user_id", "course_id");
CREATE INDEX IF NOT EXISTS "nasa_route_enrollment_user_idx"
  ON "nasa_route_enrollment"("user_id");
CREATE INDEX IF NOT EXISTS "nasa_route_enrollment_course_idx"
  ON "nasa_route_enrollment"("course_id");

DO $$ BEGIN
  ALTER TABLE "nasa_route_enrollment"
    ADD CONSTRAINT "nasa_route_enrollment_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "user"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "nasa_route_enrollment"
    ADD CONSTRAINT "nasa_route_enrollment_course_id_fkey"
    FOREIGN KEY ("course_id") REFERENCES "nasa_route_course"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "nasa_route_enrollment"
    ADD CONSTRAINT "nasa_route_enrollment_buyer_org_id_fkey"
    FOREIGN KEY ("buyer_org_id") REFERENCES "organization"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── nasa_route_progress ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "nasa_route_progress" (
  "id"                   TEXT PRIMARY KEY,
  "user_id"              TEXT NOT NULL,
  "course_id"            TEXT NOT NULL,
  "completed_lesson_ids" TEXT[] NOT NULL DEFAULT '{}',
  "last_lesson_id"       TEXT,
  "started_at"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completed_at"         TIMESTAMP(3)
);

CREATE UNIQUE INDEX IF NOT EXISTS "nasa_route_progress_user_course_key"
  ON "nasa_route_progress"("user_id", "course_id");
CREATE INDEX IF NOT EXISTS "nasa_route_progress_user_idx"
  ON "nasa_route_progress"("user_id");

DO $$ BEGIN
  ALTER TABLE "nasa_route_progress"
    ADD CONSTRAINT "nasa_route_progress_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "user"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "nasa_route_progress"
    ADD CONSTRAINT "nasa_route_progress_course_id_fkey"
    FOREIGN KEY ("course_id") REFERENCES "nasa_route_course"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── nasa_route_free_access ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "nasa_route_free_access" (
  "id"             TEXT PRIMARY KEY,
  "creator_org_id" TEXT NOT NULL,
  "user_id"        TEXT NOT NULL,
  "course_id"      TEXT,
  "granted_by_id"  TEXT NOT NULL,
  "granted_at"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "note"           TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS "nasa_route_free_access_org_user_course_key"
  ON "nasa_route_free_access"("creator_org_id", "user_id", "course_id");
CREATE INDEX IF NOT EXISTS "nasa_route_free_access_org_idx"
  ON "nasa_route_free_access"("creator_org_id");
CREATE INDEX IF NOT EXISTS "nasa_route_free_access_user_idx"
  ON "nasa_route_free_access"("user_id");

DO $$ BEGIN
  ALTER TABLE "nasa_route_free_access"
    ADD CONSTRAINT "nasa_route_free_access_creator_org_id_fkey"
    FOREIGN KEY ("creator_org_id") REFERENCES "organization"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "nasa_route_free_access"
    ADD CONSTRAINT "nasa_route_free_access_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "user"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "nasa_route_free_access"
    ADD CONSTRAINT "nasa_route_free_access_course_id_fkey"
    FOREIGN KEY ("course_id") REFERENCES "nasa_route_course"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "nasa_route_free_access"
    ADD CONSTRAINT "nasa_route_free_access_granted_by_id_fkey"
    FOREIGN KEY ("granted_by_id") REFERENCES "user"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
