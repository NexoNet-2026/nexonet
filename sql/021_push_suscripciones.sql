-- ============================================================
-- 021_push_suscripciones.sql
-- Suscripciones push para notificaciones del navegador
-- ============================================================

CREATE TABLE IF NOT EXISTS push_suscripciones (
  id          BIGSERIAL PRIMARY KEY,
  usuario_id  UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint    TEXT NOT NULL,
  p256dh      TEXT NOT NULL,
  auth        TEXT NOT NULL,
  dispositivo TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(usuario_id, endpoint)
);

ALTER TABLE push_suscripciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usuario_own" ON push_suscripciones
  FOR ALL USING (usuario_id = auth.uid())
  WITH CHECK (usuario_id = auth.uid());

CREATE POLICY "admin_all" ON push_suscripciones
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND es_admin = true)
  );
