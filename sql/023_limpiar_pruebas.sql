-- ============================================================
-- 023_limpiar_pruebas.sql
-- Limpiar datos de prueba (ejecutar manualmente)
-- ============================================================

-- Eliminar slider items de nexos de prueba
DELETE FROM nexo_slider_items WHERE nexo_id IN (
  SELECT id FROM nexos WHERE titulo ILIKE '%prueba%' OR titulo ILIKE '%test%'
  OR titulo ILIKE '%hggh%' OR titulo ILIKE '%mhfg%' OR titulo ILIKE '%dfg%'
);

-- Eliminar sliders de nexos de prueba
DELETE FROM nexo_sliders WHERE nexo_id IN (
  SELECT id FROM nexos WHERE titulo ILIKE '%prueba%' OR titulo ILIKE '%test%'
  OR titulo ILIKE '%hggh%' OR titulo ILIKE '%mhfg%' OR titulo ILIKE '%dfg%'
);

-- Eliminar miembros de nexos de prueba
DELETE FROM nexo_miembros WHERE nexo_id IN (
  SELECT id FROM nexos WHERE titulo ILIKE '%prueba%' OR titulo ILIKE '%test%'
  OR titulo ILIKE '%hggh%' OR titulo ILIKE '%mhfg%' OR titulo ILIKE '%dfg%'
);

-- Eliminar nexos de prueba
DELETE FROM nexos WHERE titulo ILIKE '%prueba%' OR titulo ILIKE '%test%'
OR titulo ILIKE '%hggh%' OR titulo ILIKE '%mhfg%' OR titulo ILIKE '%dfg%';

-- Eliminar anuncios de prueba
DELETE FROM anuncios WHERE titulo ILIKE '%prueba%' OR titulo ILIKE '%test%'
OR titulo ILIKE '%hggh%' OR titulo ILIKE '%dfg%' OR titulo ILIKE '%asd%'
OR titulo ILIKE '%qwe%';
