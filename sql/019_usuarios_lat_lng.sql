-- ============================================================
-- 019_usuarios_lat_lng.sql
-- Columnas de ubicación y dirección en tabla usuarios
-- ============================================================

ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS lat DECIMAL(10,8);
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS lng DECIMAL(11,8);
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS barrio TEXT;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS direccion TEXT;
