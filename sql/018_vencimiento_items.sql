-- ============================================================
-- 018_vencimiento_items.sql
-- Campos de vencimiento en slider items y descargas
-- ============================================================

ALTER TABLE nexo_slider_items ADD COLUMN IF NOT EXISTS vence_el TIMESTAMPTZ;
ALTER TABLE nexo_descargas ADD COLUMN IF NOT EXISTS vence_el TIMESTAMPTZ;

UPDATE nexo_slider_items SET vence_el = created_at + INTERVAL '30 days' WHERE vence_el IS NULL;
UPDATE nexo_descargas SET vence_el = created_at + INTERVAL '30 days' WHERE vence_el IS NULL;
