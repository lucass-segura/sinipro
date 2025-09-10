-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para actualizar updated_at
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_policies_updated_at BEFORE UPDATE ON policies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_policy_notices_updated_at BEFORE UPDATE ON policy_notices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Función para crear aviso automático cuando se crea una póliza
CREATE OR REPLACE FUNCTION create_initial_notice()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO policy_notices (policy_id, due_date, status)
    VALUES (NEW.id, NEW.first_payment_date, 'avisar');
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para crear aviso automático
CREATE TRIGGER create_policy_notice AFTER INSERT ON policies FOR EACH ROW EXECUTE FUNCTION create_initial_notice();
