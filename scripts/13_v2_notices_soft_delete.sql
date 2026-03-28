-- v2: Soft delete en policy_notices (para conservar estadísticas)
ALTER TABLE policy_notices ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_policy_notices_deleted_at ON policy_notices(deleted_at);

-- Vista para avisos activos (sin eliminar) — recomendado usar en queries
CREATE OR REPLACE VIEW active_notices AS
  SELECT * FROM policy_notices WHERE deleted_at IS NULL;

-- Las notas persistentes del asegurado ya existen en clients.notes (agregado en script 08)
-- Se mostrarán en la card de recordatorio consultando policies.clients.notes
