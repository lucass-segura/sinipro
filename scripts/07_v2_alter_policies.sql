-- v2: Agregar número de póliza y estado activo
ALTER TABLE policies ADD COLUMN IF NOT EXISTS policy_number VARCHAR(100);
ALTER TABLE policies ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_policies_policy_number ON policies(policy_number);

-- Ampliar ramas permitidas
ALTER TABLE policies DROP CONSTRAINT IF EXISTS policies_branch_check;
ALTER TABLE policies ADD CONSTRAINT policies_branch_check
  CHECK (branch IN (
    'Automotores', 'Motovehiculos', 'Responsabilidad civil',
    'Hogar', 'Comercio', 'Vida', 'Accidentes Personales', 'Otro'
  ));
