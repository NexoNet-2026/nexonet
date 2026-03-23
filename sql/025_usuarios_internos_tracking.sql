-- ============================================================
-- 025_usuarios_internos_tracking.sql
-- Tracking de BIT asignados a usuarios internos/bots
-- ============================================================

ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS bits_free_asignados_total INTEGER DEFAULT 0;

CREATE TABLE IF NOT EXISTS log_bits_internos (
  id            BIGSERIAL PRIMARY KEY,
  usuario_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  cantidad      INTEGER NOT NULL,
  motivo        TEXT,
  asignado_por  UUID REFERENCES auth.users(id),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE log_bits_internos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all" ON log_bits_internos
  FOR ALL USING (
    EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND es_admin = true)
  );
