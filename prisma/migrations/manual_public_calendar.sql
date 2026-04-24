-- Calendário Público — migration manual (Fase 1 + 2)
-- Aplica: campos públicos em `actions` + novos modelos (likes/views/shares/reminders)

-- ─── Enums ───────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE "EventCategory" AS ENUM (
    'WORKSHOP', 'PALESTRA', 'LANCAMENTO', 'WEBINAR', 'NETWORKING',
    'CURSO', 'REUNIAO', 'HACKATHON', 'CONFERENCIA', 'OUTRO'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "ReminderChannel" AS ENUM ('WHATSAPP', 'EMAIL');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ─── Extensão de `actions` ───────────────────────────────────────────────

ALTER TABLE "actions"
  ADD COLUMN IF NOT EXISTS "is_public"          BOOLEAN        NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "public_slug"        TEXT,
  ADD COLUMN IF NOT EXISTS "published_at"       TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "view_count"         INTEGER        NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "likes_count"        INTEGER        NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "share_count"        INTEGER        NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "country"            TEXT           DEFAULT 'BR',
  ADD COLUMN IF NOT EXISTS "state"              TEXT,
  ADD COLUMN IF NOT EXISTS "city"               TEXT,
  ADD COLUMN IF NOT EXISTS "address"            TEXT,
  ADD COLUMN IF NOT EXISTS "event_category"     "EventCategory",
  ADD COLUMN IF NOT EXISTS "registration_url"   TEXT,
  ADD COLUMN IF NOT EXISTS "form_id"            TEXT,
  ADD COLUMN IF NOT EXISTS "is_guest_draft"     BOOLEAN        NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "guest_draft_token"  TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "actions_public_slug_key"       ON "actions"("public_slug");
CREATE UNIQUE INDEX IF NOT EXISTS "actions_guest_draft_token_key" ON "actions"("guest_draft_token");
CREATE INDEX        IF NOT EXISTS "actions_is_public_published_at_idx" ON "actions"("is_public", "published_at");
CREATE INDEX        IF NOT EXISTS "actions_country_state_city_idx"     ON "actions"("country", "state", "city");
CREATE INDEX        IF NOT EXISTS "actions_event_category_idx"         ON "actions"("event_category");

-- ─── action_likes ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "action_likes" (
  "id"          TEXT         NOT NULL,
  "action_id"   TEXT         NOT NULL,
  "user_id"     TEXT,
  "fingerprint" TEXT,
  "created_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "action_likes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "action_likes_action_id_user_id_key"     ON "action_likes"("action_id", "user_id");
CREATE UNIQUE INDEX IF NOT EXISTS "action_likes_action_id_fingerprint_key" ON "action_likes"("action_id", "fingerprint");
CREATE INDEX        IF NOT EXISTS "action_likes_action_id_idx"             ON "action_likes"("action_id");
CREATE INDEX        IF NOT EXISTS "action_likes_user_id_idx"               ON "action_likes"("user_id");

ALTER TABLE "action_likes"
  ADD CONSTRAINT "action_likes_action_id_fkey" FOREIGN KEY ("action_id")
    REFERENCES "actions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "action_likes"
  ADD CONSTRAINT "action_likes_user_id_fkey" FOREIGN KEY ("user_id")
    REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ─── action_views ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "action_views" (
  "id"           TEXT         NOT NULL,
  "action_id"    TEXT         NOT NULL,
  "fingerprint"  TEXT         NOT NULL,
  "user_id"      TEXT,
  "referrer"     TEXT,
  "sharer_token" TEXT,
  "created_at"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "action_views_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "action_views_action_id_fingerprint_key" ON "action_views"("action_id", "fingerprint");
CREATE INDEX        IF NOT EXISTS "action_views_action_id_created_at_idx"  ON "action_views"("action_id", "created_at");
CREATE INDEX        IF NOT EXISTS "action_views_sharer_token_idx"          ON "action_views"("sharer_token");

ALTER TABLE "action_views"
  ADD CONSTRAINT "action_views_action_id_fkey" FOREIGN KEY ("action_id")
    REFERENCES "actions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─── public_action_shares ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "public_action_shares" (
  "id"             TEXT         NOT NULL,
  "action_id"      TEXT         NOT NULL,
  "sharer_user_id" TEXT,
  "sharer_token"   TEXT         NOT NULL,
  "platform"       TEXT,
  "clicks"         INTEGER      NOT NULL DEFAULT 0,
  "created_at"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "public_action_shares_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "public_action_shares_sharer_token_key"   ON "public_action_shares"("sharer_token");
CREATE INDEX        IF NOT EXISTS "public_action_shares_action_id_idx"      ON "public_action_shares"("action_id");
CREATE INDEX        IF NOT EXISTS "public_action_shares_sharer_user_id_idx" ON "public_action_shares"("sharer_user_id");

ALTER TABLE "public_action_shares"
  ADD CONSTRAINT "public_action_shares_action_id_fkey" FOREIGN KEY ("action_id")
    REFERENCES "actions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public_action_shares"
  ADD CONSTRAINT "public_action_shares_sharer_user_id_fkey" FOREIGN KEY ("sharer_user_id")
    REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ─── action_reminders ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "action_reminders" (
  "id"           TEXT              NOT NULL,
  "action_id"    TEXT              NOT NULL,
  "user_id"      TEXT,
  "phone_number" TEXT              NOT NULL,
  "channel"      "ReminderChannel" NOT NULL DEFAULT 'WHATSAPP',
  "remind_at"    TIMESTAMP(3)      NOT NULL,
  "sent"         BOOLEAN           NOT NULL DEFAULT false,
  "sent_at"      TIMESTAMP(3),
  "consent_at"   TIMESTAMP(3)      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_at"   TIMESTAMP(3)      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "action_reminders_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "action_reminders_action_id_sent_idx"  ON "action_reminders"("action_id", "sent");
CREATE INDEX IF NOT EXISTS "action_reminders_remind_at_sent_idx"  ON "action_reminders"("remind_at", "sent");

ALTER TABLE "action_reminders"
  ADD CONSTRAINT "action_reminders_action_id_fkey" FOREIGN KEY ("action_id")
    REFERENCES "actions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "action_reminders"
  ADD CONSTRAINT "action_reminders_user_id_fkey" FOREIGN KEY ("user_id")
    REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
