-- v2: Campos adicionales para asegurados
ALTER TABLE clients ADD COLUMN IF NOT EXISTS dni VARCHAR(20);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS address VARCHAR(255);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS birth_date DATE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS notes TEXT;

CREATE INDEX IF NOT EXISTS idx_clients_dni ON clients(dni);
