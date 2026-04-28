-- Forge — campo client_data para dados do Contratante (entrada manual)
-- Idempotente: pode ser re-executada sem efeito colateral.

ALTER TABLE "forge_contracts"
  ADD COLUMN IF NOT EXISTS "client_data" JSONB;
