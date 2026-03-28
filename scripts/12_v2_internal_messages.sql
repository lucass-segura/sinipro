-- v2: Tabla base para mensajería interna (futuro)
CREATE TABLE IF NOT EXISTS internal_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  from_user UUID REFERENCES auth.users(id),
  to_user UUID REFERENCES auth.users(id),
  subject VARCHAR(255),
  body TEXT,
  is_read BOOLEAN DEFAULT false,
  entity_type VARCHAR(30) CHECK (entity_type IN ('policy', 'client', 'siniestro', 'notice')),
  entity_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_internal_messages_to_user ON internal_messages(to_user);
CREATE INDEX IF NOT EXISTS idx_internal_messages_from_user ON internal_messages(from_user);
CREATE INDEX IF NOT EXISTS idx_internal_messages_is_read ON internal_messages(is_read);

ALTER TABLE internal_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own messages"
  ON internal_messages FOR SELECT
  USING (auth.uid() = to_user OR auth.uid() = from_user);

CREATE POLICY "Users can send messages"
  ON internal_messages FOR INSERT
  WITH CHECK (auth.uid() = from_user);

CREATE POLICY "Users can mark own messages as read"
  ON internal_messages FOR UPDATE
  USING (auth.uid() = to_user);
