-- Forge — campos institucionais para variáveis e contratos
-- Idempotente: pode ser re-executada sem efeito colateral.

ALTER TABLE "organization"
  ADD COLUMN IF NOT EXISTS "cnpj"          TEXT,
  ADD COLUMN IF NOT EXISTS "contact_email" TEXT,
  ADD COLUMN IF NOT EXISTS "contact_phone" TEXT;
