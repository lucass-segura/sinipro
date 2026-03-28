-- v2: Tabla base para gestión de documentos/archivos (futuro)
CREATE TABLE IF NOT EXISTS documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_type VARCHAR(30) CHECK (entity_type IN ('policy', 'client', 'siniestro', 'notice')),
  entity_id UUID NOT NULL,
  uploaded_by UUID REFERENCES auth.users(id),
  file_name VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_documents_entity ON documents(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON documents(uploaded_by);

-- Storage bucket para documentos (ejecutar en Supabase Dashboard o via API)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false);
