-- Agregar campo para rastrear quién avisó
ALTER TABLE policy_notices 
ADD COLUMN notified_by VARCHAR(255);

-- Crear índice para optimizar consultas
CREATE INDEX idx_policy_notices_notified_by ON policy_notices(notified_by);
