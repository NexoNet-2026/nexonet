-- ═══════════════════════════════════════════════════
-- INSIGNIAS - Tabla de reputación + campos de logro
-- ═══════════════════════════════════════════════════

-- Tabla de insignias de reputación (las dan otros usuarios)
CREATE TABLE IF NOT EXISTS insignias_reputacion (
  id BIGSERIAL PRIMARY KEY,
  receptor_id UUID NOT NULL REFERENCES auth.users(id),
  dador_id UUID NOT NULL REFERENCES auth.users(id),
  anuncio_id INTEGER REFERENCES anuncios(id),
  nexo_id UUID REFERENCES nexos(id),
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('buen_trato', 'confiable', 'rapido', 'recomendado')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(dador_id, anuncio_id),
  UNIQUE(dador_id, nexo_id)
);

-- Campos de insignia de logro en usuarios
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS insignia_logro VARCHAR(20) DEFAULT 'ninguna';
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS bits_totales_acumulados INTEGER DEFAULT 0;

-- Índices
CREATE INDEX IF NOT EXISTS idx_insignias_rep_receptor ON insignias_reputacion(receptor_id);
CREATE INDEX IF NOT EXISTS idx_insignias_rep_anuncio ON insignias_reputacion(anuncio_id);
CREATE INDEX IF NOT EXISTS idx_insignias_rep_nexo ON insignias_reputacion(nexo_id);

-- RLS (permitir lectura pública, inserción autenticada)
ALTER TABLE insignias_reputacion ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Insignias visibles para todos"
  ON insignias_reputacion FOR SELECT
  USING (true);

CREATE POLICY "Usuarios autenticados pueden dar insignias"
  ON insignias_reputacion FOR INSERT
  WITH CHECK (auth.uid() = dador_id);
