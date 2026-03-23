-- ============================================================
-- 017_membresia_grupo_vencimiento.sql
-- Campos de vencimiento de membresía en nexo_miembros
-- ============================================================

ALTER TABLE nexo_miembros ADD COLUMN IF NOT EXISTS fecha_pago TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE nexo_miembros ADD COLUMN IF NOT EXISTS vence_el TIMESTAMPTZ;

-- Para todos los miembros activos con bits_pagados > 0, setear vencimiento a 30 días desde hoy
UPDATE nexo_miembros
SET vence_el = NOW() + INTERVAL '30 days'
WHERE estado = 'activo' AND bits_pagados > 0 AND vence_el IS NULL;
