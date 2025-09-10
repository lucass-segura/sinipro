-- Crear tabla de compañías
CREATE TABLE IF NOT EXISTS companies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de clientes/asegurados
CREATE TABLE IF NOT EXISTS clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  email VARCHAR(255),
  locality VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de pólizas
CREATE TABLE IF NOT EXISTS policies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE RESTRICT,
  branch VARCHAR(50) NOT NULL CHECK (branch IN ('Automotores', 'Motovehiculos', 'Responsabilidad civil')),
  vehicle_plate VARCHAR(20), -- Solo para Automotores y Motovehiculos
  first_payment_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de avisos de pólizas
CREATE TABLE IF NOT EXISTS policy_notices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  policy_id UUID REFERENCES policies(id) ON DELETE CASCADE,
  due_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'avisar' CHECK (status IN ('avisar', 'avisado', 'pagado')),
  paid_installments INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para optimizar búsquedas
CREATE INDEX IF NOT EXISTS idx_clients_full_name ON clients(full_name);
CREATE INDEX IF NOT EXISTS idx_clients_locality ON clients(locality);
CREATE INDEX IF NOT EXISTS idx_policies_client_id ON policies(client_id);
CREATE INDEX IF NOT EXISTS idx_policies_company_id ON policies(company_id);
CREATE INDEX IF NOT EXISTS idx_policy_notices_policy_id ON policy_notices(policy_id);
CREATE INDEX IF NOT EXISTS idx_policy_notices_status ON policy_notices(status);
CREATE INDEX IF NOT EXISTS idx_policy_notices_due_date ON policy_notices(due_date);
