-- v2: Tabla base para módulo de siniestros (futuro)
CREATE TABLE IF NOT EXISTS siniestros (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  policy_id UUID REFERENCES policies(id) ON DELETE RESTRICT,
  client_id UUID REFERENCES clients(id) ON DELETE RESTRICT,
  company_id UUID REFERENCES companies(id) ON DELETE RESTRICT,
  numero_siniestro VARCHAR(100),
  fecha_ocurrencia DATE,
  fecha_denuncia DATE,
  tipo VARCHAR(100),
  descripcion TEXT,
  estado VARCHAR(30) DEFAULT 'abierto'
    CHECK (estado IN ('abierto', 'en_proceso', 'resuelto', 'cerrado')),
  monto_estimado DECIMAL(12,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_siniestros_client_id ON siniestros(client_id);
CREATE INDEX IF NOT EXISTS idx_siniestros_policy_id ON siniestros(policy_id);
CREATE INDEX IF NOT EXISTS idx_siniestros_estado ON siniestros(estado);

CREATE TRIGGER update_siniestros_updated_at
  BEFORE UPDATE ON siniestros
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
