-- Adiciona toggle explícito "Tornar público na Spacehome" para Projects e Forms.
--
-- Antes desta migration:
--   - org_projects.is_active=true expunha o projeto na Spacehome (qualquer projeto ativo).
--   - forms.published=true expunha o form na Spacehome (qualquer form publicado).
-- Risco: dados internos (ICPs, slogan, voiceTone) e formulários de uso interno
--        ficavam visíveis para qualquer visitante.
--
-- Depois:
--   - is_public_on_space=false por padrão (opt-in).
--   - O endpoint público filtra por essa flag (além de is_active/published).
--   - Usuário precisa marcar explicitamente no editor de cada item.
--
-- Idempotente: pode rodar várias vezes sem efeito colateral.

ALTER TABLE "org_projects"
  ADD COLUMN IF NOT EXISTS "is_public_on_space" boolean NOT NULL DEFAULT false;

ALTER TABLE "forms"
  ADD COLUMN IF NOT EXISTS "is_public_on_space" boolean NOT NULL DEFAULT false;

-- Índices parciais para acelerar queries da Spacehome
CREATE INDEX IF NOT EXISTS "org_projects_org_public_idx"
  ON "org_projects" ("organization_id", "is_public_on_space")
  WHERE "is_public_on_space" = true;

-- Coluna se chama "organizationId" (camelCase) na tabela forms — sem @map no Prisma
CREATE INDEX IF NOT EXISTS "forms_org_public_idx"
  ON "forms" ("organizationId", "is_public_on_space")
  WHERE "is_public_on_space" = true;
