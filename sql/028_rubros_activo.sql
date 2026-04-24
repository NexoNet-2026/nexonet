-- ============================================================
-- 028_rubros_activo.sql
-- Bloque 2 Objetivo 3: columna `activo` (visible/oculto) en
-- rubros y subrubros de empresa, servicio y trabajo.
-- Default true => todos los rubros existentes quedan visibles.
-- ============================================================

ALTER TABLE empresa_rubros     ADD COLUMN IF NOT EXISTS activo BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE empresa_subrubros  ADD COLUMN IF NOT EXISTS activo BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE servicio_rubros    ADD COLUMN IF NOT EXISTS activo BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE servicio_subrubros ADD COLUMN IF NOT EXISTS activo BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE trabajo_rubros     ADD COLUMN IF NOT EXISTS activo BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE trabajo_subrubros  ADD COLUMN IF NOT EXISTS activo BOOLEAN NOT NULL DEFAULT true;

COMMENT ON COLUMN empresa_rubros.activo     IS 'Si false, el rubro queda oculto en selectores públicos (publicar, buscar, nexo/crear). UI admin lo etiqueta "visible/oculto".';
COMMENT ON COLUMN empresa_subrubros.activo  IS 'Si false, el subrubro queda oculto en selectores públicos (publicar, buscar, nexo/crear). UI admin lo etiqueta "visible/oculto".';
COMMENT ON COLUMN servicio_rubros.activo    IS 'Si false, el rubro queda oculto en selectores públicos (publicar, buscar, nexo/crear). UI admin lo etiqueta "visible/oculto".';
COMMENT ON COLUMN servicio_subrubros.activo IS 'Si false, el subrubro queda oculto en selectores públicos (publicar, buscar, nexo/crear). UI admin lo etiqueta "visible/oculto".';
COMMENT ON COLUMN trabajo_rubros.activo     IS 'Si false, el rubro queda oculto en selectores públicos (publicar, buscar, nexo/crear). UI admin lo etiqueta "visible/oculto".';
COMMENT ON COLUMN trabajo_subrubros.activo  IS 'Si false, el subrubro queda oculto en selectores públicos (publicar, buscar, nexo/crear). UI admin lo etiqueta "visible/oculto".';
