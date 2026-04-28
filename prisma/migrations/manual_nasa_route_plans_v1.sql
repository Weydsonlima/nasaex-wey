-- NASA Route — Plans v1 (planos por curso)
-- Idempotente: pode ser re-executada.
-- Inclui backfill: cria 1 plano "Padrão" para cada curso existente, vincula
-- TODAS as aulas a ele e atualiza enrollments existentes para apontarem para
-- esse plano.

-- ─── nasa_route_plan ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "nasa_route_plan" (
  "id"          TEXT PRIMARY KEY,
  "course_id"   TEXT NOT NULL,
  "name"        TEXT NOT NULL,
  "description" TEXT,
  "price_stars" INTEGER NOT NULL DEFAULT 0,
  "order"       INTEGER NOT NULL DEFAULT 0,
  "is_default"  BOOLEAN NOT NULL DEFAULT false,
  "created_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "nasa_route_plan_course_order_idx"
  ON "nasa_route_plan" ("course_id", "order");

DO $$ BEGIN
  ALTER TABLE "nasa_route_plan"
    ADD CONSTRAINT "nasa_route_plan_course_id_fkey"
    FOREIGN KEY ("course_id") REFERENCES "nasa_route_course"("id")
    ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── nasa_route_plan_lesson (M:N plano ↔ aula) ───────────────────────────
CREATE TABLE IF NOT EXISTS "nasa_route_plan_lesson" (
  "id"         TEXT PRIMARY KEY,
  "plan_id"    TEXT NOT NULL,
  "lesson_id"  TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS "nasa_route_plan_lesson_plan_lesson_key"
  ON "nasa_route_plan_lesson" ("plan_id", "lesson_id");
CREATE INDEX IF NOT EXISTS "nasa_route_plan_lesson_lesson_idx"
  ON "nasa_route_plan_lesson" ("lesson_id");

DO $$ BEGIN
  ALTER TABLE "nasa_route_plan_lesson"
    ADD CONSTRAINT "nasa_route_plan_lesson_plan_id_fkey"
    FOREIGN KEY ("plan_id") REFERENCES "nasa_route_plan"("id")
    ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "nasa_route_plan_lesson"
    ADD CONSTRAINT "nasa_route_plan_lesson_lesson_id_fkey"
    FOREIGN KEY ("lesson_id") REFERENCES "nasa_route_lesson"("id")
    ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── nasa_route_plan_attachment (PDFs e links externos) ──────────────────
CREATE TABLE IF NOT EXISTS "nasa_route_plan_attachment" (
  "id"          TEXT PRIMARY KEY,
  "plan_id"     TEXT NOT NULL,
  "kind"        TEXT NOT NULL,           -- "pdf" | "link"
  "title"       TEXT NOT NULL,
  "url"         TEXT,
  "file_key"    TEXT,
  "file_size"   INTEGER,
  "description" TEXT,
  "order"       INTEGER NOT NULL DEFAULT 0,
  "created_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "nasa_route_plan_attachment_plan_order_idx"
  ON "nasa_route_plan_attachment" ("plan_id", "order");

DO $$ BEGIN
  ALTER TABLE "nasa_route_plan_attachment"
    ADD CONSTRAINT "nasa_route_plan_attachment_plan_id_fkey"
    FOREIGN KEY ("plan_id") REFERENCES "nasa_route_plan"("id")
    ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── enrollment.plan_id ──────────────────────────────────────────────────
ALTER TABLE "nasa_route_enrollment"
  ADD COLUMN IF NOT EXISTS "plan_id" TEXT;

CREATE INDEX IF NOT EXISTS "nasa_route_enrollment_plan_idx"
  ON "nasa_route_enrollment" ("plan_id");

DO $$ BEGIN
  ALTER TABLE "nasa_route_enrollment"
    ADD CONSTRAINT "nasa_route_enrollment_plan_id_fkey"
    FOREIGN KEY ("plan_id") REFERENCES "nasa_route_plan"("id")
    ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ═════════════════════════════════════════════════════════════════════════
-- BACKFILL — cria plano "Padrão" para cada curso, vincula todas as aulas e
-- atualiza enrollments existentes para apontarem para o plano criado.
-- ═════════════════════════════════════════════════════════════════════════

-- 1) Criar 1 plano default por curso que ainda não tem nenhum plano.
INSERT INTO "nasa_route_plan" ("id", "course_id", "name", "description", "price_stars", "order", "is_default", "created_at", "updated_at")
SELECT
  'plan_def_' || c."id",
  c."id",
  'Acesso completo',
  'Acesso a todas as aulas do curso.',
  c."price_stars",
  0,
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "nasa_route_course" c
WHERE NOT EXISTS (
  SELECT 1 FROM "nasa_route_plan" p WHERE p."course_id" = c."id"
);

-- 2) Vincular todas as aulas do curso ao plano default (apenas para os planos
--    default que acabamos de criar, identificados pelo prefixo de id).
INSERT INTO "nasa_route_plan_lesson" ("id", "plan_id", "lesson_id", "created_at")
SELECT
  'pl_def_' || l."id",
  'plan_def_' || l."course_id",
  l."id",
  CURRENT_TIMESTAMP
FROM "nasa_route_lesson" l
WHERE EXISTS (
  SELECT 1 FROM "nasa_route_plan" p
  WHERE p."id" = 'plan_def_' || l."course_id" AND p."is_default" = true
)
AND NOT EXISTS (
  SELECT 1 FROM "nasa_route_plan_lesson" pl
  WHERE pl."plan_id" = 'plan_def_' || l."course_id" AND pl."lesson_id" = l."id"
);

-- 3) Atualizar enrollments existentes para apontarem ao plano default.
UPDATE "nasa_route_enrollment" e
SET "plan_id" = 'plan_def_' || e."course_id"
WHERE e."plan_id" IS NULL
  AND EXISTS (
    SELECT 1 FROM "nasa_route_plan" p
    WHERE p."id" = 'plan_def_' || e."course_id" AND p."is_default" = true
  );
