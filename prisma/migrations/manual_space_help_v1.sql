-- Space Help v1 — migration manual
-- Cria os modelos do hub educacional NASA Space Help (trilhas + tutoriais por funcionalidade).
-- Idempotente: pode ser re-executada sem efeitos colaterais.

-- ─── space_help_category ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "space_help_category" (
  "id"               TEXT PRIMARY KEY,
  "slug"             TEXT NOT NULL,
  "name"             TEXT NOT NULL,
  "description"      TEXT,
  "icon_key"         TEXT,
  "app_id"           TEXT,
  "order"            INTEGER NOT NULL DEFAULT 0,
  "is_published"     BOOLEAN NOT NULL DEFAULT true,
  "organization_id"  TEXT,
  "created_at"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"       TIMESTAMP(3) NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "space_help_category_slug_key"
  ON "space_help_category"("slug");
CREATE INDEX IF NOT EXISTS "space_help_category_org_order_idx"
  ON "space_help_category"("organization_id", "order");

-- ─── space_help_feature ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "space_help_feature" (
  "id"             TEXT PRIMARY KEY,
  "slug"           TEXT NOT NULL,
  "title"          TEXT NOT NULL,
  "summary"        TEXT,
  "category_id"    TEXT NOT NULL,
  "order"          INTEGER NOT NULL DEFAULT 0,
  "youtube_url"    TEXT,
  "updated_by_id"  TEXT,
  "created_at"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"     TIMESTAMP(3) NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "space_help_feature_category_slug_key"
  ON "space_help_feature"("category_id", "slug");
CREATE INDEX IF NOT EXISTS "space_help_feature_category_order_idx"
  ON "space_help_feature"("category_id", "order");

DO $$ BEGIN
  ALTER TABLE "space_help_feature"
    ADD CONSTRAINT "space_help_feature_category_id_fkey"
    FOREIGN KEY ("category_id") REFERENCES "space_help_category"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── space_help_step ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "space_help_step" (
  "id"             TEXT PRIMARY KEY,
  "feature_id"     TEXT NOT NULL,
  "order"          INTEGER NOT NULL DEFAULT 0,
  "title"          TEXT NOT NULL,
  "description"    TEXT NOT NULL,
  "screenshot_url" TEXT,
  "annotations"    JSONB,
  "created_at"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "space_help_step_feature_order_idx"
  ON "space_help_step"("feature_id", "order");

DO $$ BEGIN
  ALTER TABLE "space_help_step"
    ADD CONSTRAINT "space_help_step_feature_id_fkey"
    FOREIGN KEY ("feature_id") REFERENCES "space_help_feature"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── space_help_badge ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "space_help_badge" (
  "id"          TEXT PRIMARY KEY,
  "slug"        TEXT NOT NULL,
  "name"        TEXT NOT NULL,
  "description" TEXT,
  "icon_url"    TEXT,
  "color"       TEXT,
  "is_active"   BOOLEAN NOT NULL DEFAULT true,
  "created_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS "space_help_badge_slug_key"
  ON "space_help_badge"("slug");

-- ─── space_help_track ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "space_help_track" (
  "id"                  TEXT PRIMARY KEY,
  "slug"                TEXT NOT NULL,
  "title"               TEXT NOT NULL,
  "subtitle"            TEXT,
  "description"         TEXT,
  "cover_url"           TEXT,
  "level"               TEXT NOT NULL DEFAULT 'beginner',
  "duration_min"        INTEGER,
  "category_id"         TEXT,
  "order"               INTEGER NOT NULL DEFAULT 0,
  "is_published"        BOOLEAN NOT NULL DEFAULT true,
  "reward_stars"        INTEGER NOT NULL DEFAULT 0,
  "reward_space_points" INTEGER NOT NULL DEFAULT 0,
  "reward_badge_id"     TEXT,
  "created_at"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"          TIMESTAMP(3) NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "space_help_track_slug_key"
  ON "space_help_track"("slug");
CREATE INDEX IF NOT EXISTS "space_help_track_category_order_idx"
  ON "space_help_track"("category_id", "order");

DO $$ BEGIN
  ALTER TABLE "space_help_track"
    ADD CONSTRAINT "space_help_track_category_id_fkey"
    FOREIGN KEY ("category_id") REFERENCES "space_help_category"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "space_help_track"
    ADD CONSTRAINT "space_help_track_reward_badge_id_fkey"
    FOREIGN KEY ("reward_badge_id") REFERENCES "space_help_badge"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── space_help_lesson ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "space_help_lesson" (
  "id"           TEXT PRIMARY KEY,
  "track_id"     TEXT NOT NULL,
  "order"        INTEGER NOT NULL DEFAULT 0,
  "title"        TEXT NOT NULL,
  "summary"      TEXT,
  "content_md"   TEXT,
  "youtube_url"  TEXT,
  "duration_min" INTEGER,
  "created_at"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "space_help_lesson_track_order_idx"
  ON "space_help_lesson"("track_id", "order");

DO $$ BEGIN
  ALTER TABLE "space_help_lesson"
    ADD CONSTRAINT "space_help_lesson_track_id_fkey"
    FOREIGN KEY ("track_id") REFERENCES "space_help_track"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── space_help_progress ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "space_help_progress" (
  "id"                   TEXT PRIMARY KEY,
  "user_id"              TEXT NOT NULL,
  "track_id"             TEXT NOT NULL,
  "completed_lesson_ids" TEXT[] NOT NULL DEFAULT '{}',
  "started_at"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completed_at"         TIMESTAMP(3)
);

CREATE UNIQUE INDEX IF NOT EXISTS "space_help_progress_user_track_key"
  ON "space_help_progress"("user_id", "track_id");
CREATE INDEX IF NOT EXISTS "space_help_progress_user_idx"
  ON "space_help_progress"("user_id");

DO $$ BEGIN
  ALTER TABLE "space_help_progress"
    ADD CONSTRAINT "space_help_progress_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "user"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "space_help_progress"
    ADD CONSTRAINT "space_help_progress_track_id_fkey"
    FOREIGN KEY ("track_id") REFERENCES "space_help_track"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── user_space_help_badge ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "user_space_help_badge" (
  "id"        TEXT PRIMARY KEY,
  "user_id"   TEXT NOT NULL,
  "badge_id"  TEXT NOT NULL,
  "track_id"  TEXT,
  "earned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS "user_space_help_badge_user_badge_key"
  ON "user_space_help_badge"("user_id", "badge_id");
CREATE INDEX IF NOT EXISTS "user_space_help_badge_user_idx"
  ON "user_space_help_badge"("user_id");

DO $$ BEGIN
  ALTER TABLE "user_space_help_badge"
    ADD CONSTRAINT "user_space_help_badge_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "user"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "user_space_help_badge"
    ADD CONSTRAINT "user_space_help_badge_badge_id_fkey"
    FOREIGN KEY ("badge_id") REFERENCES "space_help_badge"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "user_space_help_badge"
    ADD CONSTRAINT "user_space_help_badge_track_id_fkey"
    FOREIGN KEY ("track_id") REFERENCES "space_help_track"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
