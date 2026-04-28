-- Space Page v1 — migration manual
-- Aplica: campos da Space Page em `organization` + `nbox_items`
-- e cria os novos modelos (organograma, profile card, skills, tools,
-- followers, reviews, news/posts, comments, audit log).
--
-- Idempotente: pode ser re-executada sem efeitos colaterais.

-- ─── Enums ───────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE "JobCategory" AS ENUM (
    'EXECUTIVE', 'TECH', 'DESIGN', 'PRODUCT', 'MARKETING', 'SALES',
    'OPERATIONS', 'FINANCE', 'HR', 'LEGAL', 'OTHER'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "ReviewStatus" AS ENUM ('APPROVED', 'PENDING', 'HIDDEN');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Adiciona o valor SPACE_PAGE ao enum existente NasaPageIntent
ALTER TYPE "NasaPageIntent" ADD VALUE IF NOT EXISTS 'SPACE_PAGE';

-- ─── Extensão de `organization` ──────────────────────────────────────────

ALTER TABLE "organization"
  ADD COLUMN IF NOT EXISTS "bio"                  TEXT,
  ADD COLUMN IF NOT EXISTS "banner_url"           TEXT,
  ADD COLUMN IF NOT EXISTS "website"              TEXT,
  ADD COLUMN IF NOT EXISTS "is_space_page_public" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "space_page_template"  TEXT DEFAULT 'default',
  ADD COLUMN IF NOT EXISTS "nasa_page_id"         TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "organization_nasa_page_id_key"
  ON "organization"("nasa_page_id");

DO $$ BEGIN
  ALTER TABLE "organization"
    ADD CONSTRAINT "organization_nasa_page_id_fkey" FOREIGN KEY ("nasa_page_id")
      REFERENCES "nasa_pages"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ─── Extensão de `nbox_items` ────────────────────────────────────────────

ALTER TABLE "nbox_items"
  ADD COLUMN IF NOT EXISTS "is_public"    BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "public_token" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "nbox_items_public_token_key"
  ON "nbox_items"("public_token");
CREATE INDEX IF NOT EXISTS "nbox_items_organization_id_is_public_idx"
  ON "nbox_items"("organization_id", "is_public");

-- ─── job_title_catalog ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "job_title_catalog" (
  "id"         TEXT          NOT NULL,
  "title"      TEXT          NOT NULL,
  "slug"       TEXT          NOT NULL,
  "category"   "JobCategory" NOT NULL,
  "level"      INTEGER       NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "job_title_catalog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "job_title_catalog_title_key" ON "job_title_catalog"("title");
CREATE UNIQUE INDEX IF NOT EXISTS "job_title_catalog_slug_key"  ON "job_title_catalog"("slug");
CREATE INDEX        IF NOT EXISTS "job_title_catalog_category_level_idx"
  ON "job_title_catalog"("category", "level");

-- ─── org_roles ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "org_roles" (
  "id"             TEXT         NOT NULL,
  "org_id"         TEXT         NOT NULL,
  "user_id"        TEXT,
  "job_title_id"   TEXT         NOT NULL,
  "custom_label"   TEXT,
  "parent_id"      TEXT,
  "department"     TEXT,
  "order"          INTEGER      NOT NULL DEFAULT 0,
  "public_consent" BOOLEAN      NOT NULL DEFAULT false,
  "consented_at"   TIMESTAMP(3),
  "show_photo"     BOOLEAN      NOT NULL DEFAULT true,
  "show_name"      BOOLEAN      NOT NULL DEFAULT true,
  "created_at"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"     TIMESTAMP(3) NOT NULL,
  CONSTRAINT "org_roles_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "org_roles_org_id_idx"                 ON "org_roles"("org_id");
CREATE INDEX IF NOT EXISTS "org_roles_parent_id_idx"              ON "org_roles"("parent_id");
CREATE INDEX IF NOT EXISTS "org_roles_org_id_public_consent_idx"  ON "org_roles"("org_id", "public_consent");

DO $$ BEGIN
  ALTER TABLE "org_roles"
    ADD CONSTRAINT "org_roles_org_id_fkey" FOREIGN KEY ("org_id")
      REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "org_roles"
    ADD CONSTRAINT "org_roles_user_id_fkey" FOREIGN KEY ("user_id")
      REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "org_roles"
    ADD CONSTRAINT "org_roles_job_title_id_fkey" FOREIGN KEY ("job_title_id")
      REFERENCES "job_title_catalog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "org_roles"
    ADD CONSTRAINT "org_roles_parent_id_fkey" FOREIGN KEY ("parent_id")
      REFERENCES "org_roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ─── user_profile_cards ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "user_profile_cards" (
  "id"             TEXT         NOT NULL,
  "user_id"        TEXT         NOT NULL,
  "headline"       TEXT,
  "bio"            TEXT,
  "cv_url"         TEXT,
  "linkedin_url"   TEXT,
  "github_url"     TEXT,
  "portfolio_url"  TEXT,
  "email"          TEXT,
  "is_public"      BOOLEAN      NOT NULL DEFAULT false,
  "show_headline"  BOOLEAN      NOT NULL DEFAULT true,
  "show_bio"       BOOLEAN      NOT NULL DEFAULT true,
  "show_cv"        BOOLEAN      NOT NULL DEFAULT false,
  "show_linkedin"  BOOLEAN      NOT NULL DEFAULT true,
  "show_github"    BOOLEAN      NOT NULL DEFAULT true,
  "show_portfolio" BOOLEAN      NOT NULL DEFAULT true,
  "show_email"     BOOLEAN      NOT NULL DEFAULT false,
  "show_skills"    BOOLEAN      NOT NULL DEFAULT true,
  "show_tools"     BOOLEAN      NOT NULL DEFAULT true,
  "updated_at"     TIMESTAMP(3) NOT NULL,
  CONSTRAINT "user_profile_cards_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "user_profile_cards_user_id_key" ON "user_profile_cards"("user_id");

DO $$ BEGIN
  ALTER TABLE "user_profile_cards"
    ADD CONSTRAINT "user_profile_cards_user_id_fkey" FOREIGN KEY ("user_id")
      REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ─── skills ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "skills" (
  "id"   TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  CONSTRAINT "skills_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "skills_name_key" ON "skills"("name");
CREATE UNIQUE INDEX IF NOT EXISTS "skills_slug_key" ON "skills"("slug");

-- ─── user_skills ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "user_skills" (
  "id"         TEXT         NOT NULL,
  "profile_id" TEXT         NOT NULL,
  "skill_id"   TEXT         NOT NULL,
  "level"      INTEGER      NOT NULL DEFAULT 3,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "user_skills_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "user_skills_profile_id_skill_id_key"
  ON "user_skills"("profile_id", "skill_id");

DO $$ BEGIN
  ALTER TABLE "user_skills"
    ADD CONSTRAINT "user_skills_profile_id_fkey" FOREIGN KEY ("profile_id")
      REFERENCES "user_profile_cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "user_skills"
    ADD CONSTRAINT "user_skills_skill_id_fkey" FOREIGN KEY ("skill_id")
      REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ─── tool_catalog ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "tool_catalog" (
  "id"       TEXT NOT NULL,
  "name"     TEXT NOT NULL,
  "slug"     TEXT NOT NULL,
  "icon_url" TEXT,
  "category" TEXT,
  CONSTRAINT "tool_catalog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "tool_catalog_name_key" ON "tool_catalog"("name");
CREATE UNIQUE INDEX IF NOT EXISTS "tool_catalog_slug_key" ON "tool_catalog"("slug");

-- ─── user_tools ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "user_tools" (
  "id"          TEXT         NOT NULL,
  "profile_id"  TEXT         NOT NULL,
  "tool_id"     TEXT         NOT NULL,
  "proficiency" INTEGER      NOT NULL DEFAULT 3,
  "created_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "user_tools_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "user_tools_profile_id_tool_id_key"
  ON "user_tools"("profile_id", "tool_id");

DO $$ BEGIN
  ALTER TABLE "user_tools"
    ADD CONSTRAINT "user_tools_profile_id_fkey" FOREIGN KEY ("profile_id")
      REFERENCES "user_profile_cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "user_tools"
    ADD CONSTRAINT "user_tools_tool_id_fkey" FOREIGN KEY ("tool_id")
      REFERENCES "tool_catalog"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ─── org_follows ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "org_follows" (
  "id"         TEXT         NOT NULL,
  "org_id"     TEXT         NOT NULL,
  "user_id"    TEXT         NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "org_follows_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "org_follows_org_id_user_id_key" ON "org_follows"("org_id", "user_id");
CREATE INDEX        IF NOT EXISTS "org_follows_org_id_idx"         ON "org_follows"("org_id");
CREATE INDEX        IF NOT EXISTS "org_follows_user_id_idx"        ON "org_follows"("user_id");

DO $$ BEGIN
  ALTER TABLE "org_follows"
    ADD CONSTRAINT "org_follows_org_id_fkey" FOREIGN KEY ("org_id")
      REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "org_follows"
    ADD CONSTRAINT "org_follows_user_id_fkey" FOREIGN KEY ("user_id")
      REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ─── company_reviews ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "company_reviews" (
  "id"          TEXT           NOT NULL,
  "org_id"      TEXT           NOT NULL,
  "author_id"   TEXT,
  "author_name" TEXT,
  "rating"      INTEGER        NOT NULL,
  "title"       TEXT,
  "comment"     TEXT,
  "verified"    BOOLEAN        NOT NULL DEFAULT false,
  "status"      "ReviewStatus" NOT NULL DEFAULT 'PENDING',
  "ip_hash"     TEXT,
  "fingerprint" TEXT,
  "created_at"  TIMESTAMP(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "company_reviews_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "company_reviews_org_id_status_idx" ON "company_reviews"("org_id", "status");
CREATE INDEX IF NOT EXISTS "company_reviews_created_at_idx"    ON "company_reviews"("created_at");

DO $$ BEGIN
  ALTER TABLE "company_reviews"
    ADD CONSTRAINT "company_reviews_org_id_fkey" FOREIGN KEY ("org_id")
      REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "company_reviews"
    ADD CONSTRAINT "company_reviews_author_id_fkey" FOREIGN KEY ("author_id")
      REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ─── company_posts ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "company_posts" (
  "id"           TEXT         NOT NULL,
  "org_id"       TEXT         NOT NULL,
  "author_id"    TEXT         NOT NULL,
  "title"        TEXT         NOT NULL,
  "slug"         TEXT         NOT NULL,
  "excerpt"      TEXT,
  "content"      JSONB        NOT NULL,
  "cover_url"    TEXT,
  "is_published" BOOLEAN      NOT NULL DEFAULT false,
  "published_at" TIMESTAMP(3),
  "view_count"   INTEGER      NOT NULL DEFAULT 0,
  "created_at"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"   TIMESTAMP(3) NOT NULL,
  CONSTRAINT "company_posts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "company_posts_slug_key" ON "company_posts"("slug");
CREATE INDEX        IF NOT EXISTS "company_posts_org_id_is_published_published_at_idx"
  ON "company_posts"("org_id", "is_published", "published_at");

DO $$ BEGIN
  ALTER TABLE "company_posts"
    ADD CONSTRAINT "company_posts_org_id_fkey" FOREIGN KEY ("org_id")
      REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "company_posts"
    ADD CONSTRAINT "company_posts_author_id_fkey" FOREIGN KEY ("author_id")
      REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ─── company_post_comments ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "company_post_comments" (
  "id"          TEXT           NOT NULL,
  "post_id"     TEXT           NOT NULL,
  "author_id"   TEXT,
  "author_name" TEXT,
  "content"     TEXT           NOT NULL,
  "parent_id"   TEXT,
  "status"      "ReviewStatus" NOT NULL DEFAULT 'PENDING',
  "created_at"  TIMESTAMP(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "company_post_comments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "company_post_comments_post_id_created_at_idx"
  ON "company_post_comments"("post_id", "created_at");
CREATE INDEX IF NOT EXISTS "company_post_comments_status_idx"
  ON "company_post_comments"("status");

DO $$ BEGIN
  ALTER TABLE "company_post_comments"
    ADD CONSTRAINT "company_post_comments_post_id_fkey" FOREIGN KEY ("post_id")
      REFERENCES "company_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "company_post_comments"
    ADD CONSTRAINT "company_post_comments_author_id_fkey" FOREIGN KEY ("author_id")
      REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "company_post_comments"
    ADD CONSTRAINT "company_post_comments_parent_id_fkey" FOREIGN KEY ("parent_id")
      REFERENCES "company_post_comments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ─── space_page_audit_log ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "space_page_audit_log" (
  "id"         TEXT         NOT NULL,
  "org_id"     TEXT         NOT NULL,
  "actor_id"   TEXT,
  "action"     TEXT         NOT NULL,
  "target"     TEXT,
  "metadata"   JSONB,
  "ip_hash"    TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "space_page_audit_log_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "space_page_audit_log_org_id_created_at_idx"
  ON "space_page_audit_log"("org_id", "created_at");

DO $$ BEGIN
  ALTER TABLE "space_page_audit_log"
    ADD CONSTRAINT "space_page_audit_log_org_id_fkey" FOREIGN KEY ("org_id")
      REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
