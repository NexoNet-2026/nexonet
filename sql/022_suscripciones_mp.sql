-- ============================================================
-- 022_suscripciones_mp.sql
-- Suscripciones de débito automático via MercadoPago
-- ============================================================

CREATE TABLE IF NOT EXISTS suscripciones_mp (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  mp_preapproval_id TEXT UNIQUE,
  mp_plan_id      TEXT,
  tipo            VARCHAR(20) NOT NULL,  -- 'anuncio' | 'empresa' | 'grupo'
  referencia_id   TEXT,                  -- id del anuncio, nexo o membresía
  monto           DECIMAL(10,2) NOT NULL,
  moneda          VARCHAR(5) DEFAULT 'ARS',
  estado          VARCHAR(20) DEFAULT 'pending', -- pending | authorized | paused | cancelled
  proximo_cobro   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE suscripciones_mp ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usuario_own" ON suscripciones_mp
  FOR ALL USING (usuario_id = auth.uid())
  WITH CHECK (usuario_id = auth.uid());

CREATE POLICY "admin_all" ON suscripciones_mp
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND es_admin = true)
  );
