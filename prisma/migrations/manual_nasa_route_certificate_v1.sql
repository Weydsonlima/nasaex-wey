-- NASA Route — Certificate v1
-- Idempotente: pode ser re-executada.

CREATE TABLE IF NOT EXISTS "nasa_route_certificate" (
  "id"            TEXT PRIMARY KEY,
  "code"          TEXT NOT NULL,
  "user_id"       TEXT NOT NULL,
  "course_id"     TEXT NOT NULL,
  "enrollment_id" TEXT NOT NULL,
  "student_name"  TEXT NOT NULL,
  "course_title"  TEXT NOT NULL,
  "org_name"      TEXT NOT NULL,
  "duration_min"  INTEGER,
  "issued_at"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS "nasa_route_certificate_code_key"
  ON "nasa_route_certificate" ("code");
CREATE UNIQUE INDEX IF NOT EXISTS "nasa_route_certificate_enrollment_key"
  ON "nasa_route_certificate" ("enrollment_id");
CREATE INDEX IF NOT EXISTS "nasa_route_certificate_user_idx"
  ON "nasa_route_certificate" ("user_id");
CREATE INDEX IF NOT EXISTS "nasa_route_certificate_course_idx"
  ON "nasa_route_certificate" ("course_id");

DO $$ BEGIN
  ALTER TABLE "nasa_route_certificate"
    ADD CONSTRAINT "nasa_route_certificate_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "user"("id")
    ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "nasa_route_certificate"
    ADD CONSTRAINT "nasa_route_certificate_course_id_fkey"
    FOREIGN KEY ("course_id") REFERENCES "nasa_route_course"("id")
    ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "nasa_route_certificate"
    ADD CONSTRAINT "nasa_route_certificate_enrollment_id_fkey"
    FOREIGN KEY ("enrollment_id") REFERENCES "nasa_route_enrollment"("id")
    ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
