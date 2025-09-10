-- Insertar algunas compañías de ejemplo
INSERT INTO companies (name) VALUES 
  ('La Caja ART'),
  ('Sancor Seguros'),
  ('Allianz Argentina'),
  ('Zurich Argentina'),
  ('Federación Patronal')
ON CONFLICT (name) DO NOTHING;

-- Insertar algunos clientes de ejemplo
INSERT INTO clients (full_name, phone, email, locality) VALUES 
  ('Juan Carlos Pérez', '+54 299 123-4567', 'juan.perez@email.com', 'Picun Leufu'),
  ('María Elena González', '+54 299 234-5678', 'maria.gonzalez@email.com', 'Plaza Huincul'),
  ('Roberto Silva', '+54 299 345-6789', 'roberto.silva@email.com', 'Cutral Co')
ON CONFLICT DO NOTHING;
