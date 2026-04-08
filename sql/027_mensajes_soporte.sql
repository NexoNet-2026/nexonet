-- ============================================================
-- 027_mensajes_soporte.sql
-- Mensajes de soporte de usuarios a NexoNet
-- ============================================================

CREATE TABLE IF NOT EXISTS mensajes_soporte (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  nombre_usuario TEXT,
  codigo         TEXT,
  tipo           VARCHAR(20) NOT NULL CHECK (tipo IN ('reclamo','sugerencia','denuncia','solicitud','ayuda')),
  mensaje        TEXT NOT NULL,
  estado         VARCHAR(20) DEFAULT 'pendiente',
  respuesta      TEXT,
  respondido_at  TIMESTAMPTZ,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE mensajes_soporte ENABLE ROW LEVEL SECURITY;

CREATE POLICY "insert_all" ON mensajes_soporte FOR INSERT WITH CHECK (true);
CREATE POLICY "select_own" ON mensajes_soporte FOR SELECT USING (usuario_id = auth.uid());
CREATE POLICY "admin_all"  ON mensajes_soporte FOR ALL USING (
  EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND es_admin = true)
);
