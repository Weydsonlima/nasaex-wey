-- Company Type v1 — migration manual
-- Adiciona companyType/companySegment em Organization para classificar empresa
-- e permite agrupar membros por cargo hierárquico (campo Member.cargo já existia).
-- Idempotente: pode ser re-executada.

ALTER TABLE "organization"
  ADD COLUMN IF NOT EXISTS "company_type"    TEXT;

ALTER TABLE "organization"
  ADD COLUMN IF NOT EXISTS "company_segment" TEXT;

CREATE INDEX IF NOT EXISTS "organization_company_type_idx"
  ON "organization"("company_type");

-- Member.cargo já existe (criado em migration anterior). Apenas garantimos índice.
CREATE INDEX IF NOT EXISTS "member_cargo_idx"
  ON "member"("cargo");
