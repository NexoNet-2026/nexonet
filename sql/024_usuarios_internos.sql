-- ============================================================
-- 024_usuarios_internos.sql
-- Columnas para usuarios internos/bot de contenido semilla
-- ============================================================

ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS is_interno BOOLEAN DEFAULT FALSE;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS es_bot BOOLEAN DEFAULT FALSE;
