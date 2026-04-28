-- Index para acelerar Space Agenda (`/space/[nick]/agenda`).
-- Query: WHERE organization_id = ? AND is_public = true
--   AND is_archived = false AND is_guest_draft = false
--   AND published_at IS NOT NULL
-- ORDER BY start_date ASC, published_at DESC
--
-- O índice já existente `(is_public, published_at)` força o planner a varrer
-- todas as ações públicas de TODAS as orgs e filtrar depois — em produção
-- (Neon) isso virou o gargalo da página. O composto abaixo coloca
-- organization_id na frente para que cada org tenha sua própria fatia.
--
-- Idempotente: pode ser re-executada sem efeitos colaterais.

CREATE INDEX IF NOT EXISTS "actions_organization_id_is_public_published_at_idx"
  ON "actions" ("organization_id", "is_public", "published_at");
