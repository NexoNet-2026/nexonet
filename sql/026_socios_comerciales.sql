-- ============================================================
-- 026_socios_comerciales.sql
-- Sistema de socios comerciales (principal + regionales)
-- ============================================================

CREATE TABLE IF NOT EXISTS socios_comerciales (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id                UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo                      VARCHAR(20) NOT NULL, -- 'principal' | 'regional'
  porcentaje                DECIMAL(5,2) NOT NULL, -- 30.00 para principal
  region                    TEXT,
  codigo_referido           TEXT UNIQUE,
  activo                    BOOLEAN DEFAULT TRUE,
  bits_promotor_acumulado   INTEGER DEFAULT 0,
  bits_promotor_reintegrado INTEGER DEFAULT 0,
  created_at                TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE socios_comerciales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all" ON socios_comerciales
  FOR ALL USING (
    EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND es_admin = true)
  );

CREATE POLICY "socio_own" ON socios_comerciales
  FOR SELECT USING (usuario_id = auth.uid());

CREATE TABLE IF NOT EXISTS log_socios_comerciales (
  id                    BIGSERIAL PRIMARY KEY,
  socio_id              UUID REFERENCES socios_comerciales(id) ON DELETE CASCADE,
  usuario_comprador_id  UUID REFERENCES auth.users(id),
  bits_comprados        INTEGER NOT NULL,
  porcentaje            DECIMAL(5,2) NOT NULL,
  bits_acreditados      INTEGER NOT NULL,
  concepto              TEXT,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE log_socios_comerciales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_log" ON log_socios_comerciales
  FOR ALL USING (
    EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND es_admin = true)
  );

CREATE POLICY "socio_own_log" ON log_socios_comerciales
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM socios_comerciales WHERE id = socio_id AND usuario_id = auth.uid())
  );

ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS socio_regional_id UUID;
