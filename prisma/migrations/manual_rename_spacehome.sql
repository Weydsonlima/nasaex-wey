-- Rename "Space Page" → "Spacehome"
-- Renomeia colunas em `organization` e a tabela `space_page_audit_log`.
-- Idempotente: usa IF EXISTS / IF NOT EXISTS em todos os pontos.

-- ─── 1. Renomear colunas em `organization` ───────────────────────────────

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organization' AND column_name = 'is_space_page_public'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organization' AND column_name = 'is_spacehome_public'
  ) THEN
    ALTER TABLE "organization"
      RENAME COLUMN "is_space_page_public" TO "is_spacehome_public";
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organization' AND column_name = 'space_page_template'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organization' AND column_name = 'spacehome_template'
  ) THEN
    ALTER TABLE "organization"
      RENAME COLUMN "space_page_template" TO "spacehome_template";
  END IF;
END $$;

-- ─── 2. Renomear tabela `space_page_audit_log` → `spacehome_audit_log` ──

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'space_page_audit_log'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'spacehome_audit_log'
  ) THEN
    ALTER TABLE "space_page_audit_log" RENAME TO "spacehome_audit_log";
  END IF;
END $$;

-- Renomeia o índice da tabela renomeada (se existir com o nome antigo)
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE indexname = 'space_page_audit_log_org_id_created_at_idx'
  ) THEN
    ALTER INDEX "space_page_audit_log_org_id_created_at_idx"
      RENAME TO "spacehome_audit_log_org_id_created_at_idx";
  END IF;
END $$;

-- Renomeia a sequence/PK se aplicável (Prisma usa cuid, não serial → no-op)
