-- ============================================================
-- 020_config_global.sql
-- Configuración global de la plataforma
-- ============================================================

CREATE TABLE IF NOT EXISTS config_global (
  clave TEXT PRIMARY KEY,
  valor TEXT NOT NULL,
  descripcion TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE config_global ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pub_select" ON config_global
  FOR SELECT USING (true);

CREATE POLICY "admin_all" ON config_global
  FOR ALL USING (
    EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND es_admin = true)
  );

INSERT INTO config_global (clave, valor, descripcion) VALUES
  ('whatsapp_soporte', '5493413251818', 'Número de WhatsApp de soporte (con código de país, sin +)'),
  ('email_soporte', 'soporte@nexonet.ar', 'Email de soporte'),
  ('nombre_plataforma', 'NexoNet Argentina', 'Nombre de la plataforma'),
  ('bits_registro_promotor', '1000', 'BIT que recibe el promotor por cada registro'),
  ('bits_ingreso_grupo', '500', 'BIT que paga el usuario al unirse a un grupo'),
  ('bits_empresa_mensual', '10000', 'BIT mensuales para mantener una empresa activa')
ON CONFLICT DO NOTHING;
