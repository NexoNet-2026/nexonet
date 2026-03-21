-- ═══════════════════════════════════════════════════
-- BIT Promo por descargas + bits_promo en nexos
-- ═══════════════════════════════════════════════════

ALTER TABLE nexos ADD COLUMN IF NOT EXISTS bits_promo INTEGER DEFAULT 0;

CREATE TABLE IF NOT EXISTS bits_promo_descargas (
  id BIGSERIAL PRIMARY KEY,
  usuario_id UUID REFERENCES auth.users(id),
  nexo_id UUID REFERENCES nexos(id),
  descarga_id UUID,
  bits_recibidos INTEGER NOT NULL,
  comprador_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE bits_promo_descargas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bits_promo_descargas_select" ON bits_promo_descargas FOR SELECT USING (auth.uid() = usuario_id);
CREATE POLICY "bits_promo_descargas_insert" ON bits_promo_descargas FOR INSERT WITH CHECK (true);
