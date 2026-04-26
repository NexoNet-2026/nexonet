-- ===========================================================================
-- 02-rollback-EMERGENCIA.sql
--
-- ⚠️  ATENCIÓN: SCRIPT DE EMERGENCIA — NO EJECUTAR A LA LIGERA  ⚠️
--
-- Este script DESHACE la cuarentena de huérfanos. Solo ejecutarlo si después
-- de cuarentenar se descubre que la app está fallando porque alguna imagen
-- legítimamente referenciada quedó cuarentenada.
--
-- ANTES DE EJECUTAR:
-- 1. Confirmar que el problema realmente es un huérfano cuarentenado por error.
-- 2. Probar primero un rollback selectivo (solo un archivo o un bucket).
--    Hay un bloque al final de este archivo para eso.
-- 3. Si el rollback masivo es la única opción, descomentar el bloque BEGIN-COMMIT
--    de abajo Y ejecutarlo. Por defecto está comentado para evitar accidentes.
--
-- DESPUÉS DE EJECUTAR:
-- - Cerrar inmediatamente el SQL Editor o limpiar su contenido.
-- - Investigar qué columna de la BD referenciaba el archivo y agregarla al
--   CTE referencias_validas en 01-cuarentena-INICIAL.sql.done para futuras
--   limpiezas.
-- ===========================================================================


-- ---------------------------------------------------------------------------
-- OPCIÓN A: Rollback selectivo (RECOMENDADO — descomentar y editar)
-- ---------------------------------------------------------------------------
-- Restaurar solo archivos de un bucket específico:
--
-- BEGIN;
-- UPDATE storage.objects o
-- SET name = s.name_original
-- FROM _huerfanos_storage_snapshot s
-- WHERE o.bucket_id = s.bucket_id
--   AND o.name = s.name_cuarentena
--   AND s.estado = 'cuarentena'
--   AND s.bucket_id = 'imagenes';  -- <-- editá el bucket aquí
-- UPDATE _huerfanos_storage_snapshot SET estado = 'restaurado'
-- WHERE estado = 'cuarentena' AND bucket_id = 'imagenes';
-- COMMIT;


-- Restaurar UN solo archivo conocido:
--
-- BEGIN;
-- UPDATE storage.objects o
-- SET name = s.name_original
-- FROM _huerfanos_storage_snapshot s
-- WHERE o.bucket_id = s.bucket_id
--   AND o.name = s.name_cuarentena
--   AND s.id = 123;  -- <-- editá el ID del snapshot aquí
-- UPDATE _huerfanos_storage_snapshot SET estado = 'restaurado'
-- WHERE id = 123;
-- COMMIT;


-- ---------------------------------------------------------------------------
-- OPCIÓN B: Rollback total (PELIGROSO — descomentar a conciencia)
-- ---------------------------------------------------------------------------
-- Restaura TODOS los archivos cuarentenados al estado original.
-- Solo usar como último recurso.
--
-- BEGIN;
-- UPDATE storage.objects o
-- SET name = s.name_original
-- FROM _huerfanos_storage_snapshot s
-- WHERE o.bucket_id = s.bucket_id
--   AND o.name = s.name_cuarentena
--   AND s.estado = 'cuarentena';
-- UPDATE _huerfanos_storage_snapshot
-- SET estado = 'restaurado'
-- WHERE estado = 'cuarentena';
-- COMMIT;


-- ---------------------------------------------------------------------------
-- DIAGNÓSTICO previo (este sí se puede correr siempre, es solo lectura)
-- ---------------------------------------------------------------------------
-- Ver qué hay actualmente en cuarentena y de qué tamaño:
SELECT
  bucket_id,
  estado,
  COUNT(*) AS cantidad,
  pg_size_pretty(SUM(bytes)) AS peso_total,
  MIN(fecha_snapshot)::date AS desde,
  MAX(fecha_snapshot)::date AS hasta
FROM _huerfanos_storage_snapshot
GROUP BY bucket_id, estado
ORDER BY bucket_id, estado;
