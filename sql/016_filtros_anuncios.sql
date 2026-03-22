-- ============================================================
-- 016_filtros_anuncios.sql
-- Columna filtros JSONB en tabla anuncios
-- ============================================================

ALTER TABLE anuncios ADD COLUMN IF NOT EXISTS filtros JSONB DEFAULT '{}';
