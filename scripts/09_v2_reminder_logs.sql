-- v2: Historial de recordatorios enviados a clientes
CREATE TABLE IF NOT EXISTS reminder_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  notice_id UUID REFERENCES policy_notices(id) ON DELETE CASCADE,
  sent_by UUID REFERENCES auth.users(id),
  channel VARCHAR(20) CHECK (channel IN ('whatsapp', 'email', 'manual')),
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  recipient_phone VARCHAR(50),
  recipient_email VARCHAR(255),
  message_preview TEXT
);

CREATE INDEX IF NOT EXISTS idx_reminder_logs_notice_id ON reminder_logs(notice_id);
CREATE INDEX IF NOT EXISTS idx_reminder_logs_sent_by ON reminder_logs(sent_by);
CREATE INDEX IF NOT EXISTS idx_reminder_logs_sent_at ON reminder_logs(sent_at);

-- RLS: todos los usuarios autenticados pueden ver y crear logs
ALTER TABLE reminder_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view reminder logs"
  ON reminder_logs FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert reminder logs"
  ON reminder_logs FOR INSERT
  WITH CHECK (auth.uid() = sent_by);
