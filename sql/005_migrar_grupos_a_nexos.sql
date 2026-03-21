-- ═══════════════════════════════════════════════════
-- MIGRACIÓN: grupos → nexos (tipo='grupo')
-- Ejecutar una sola vez. Luego el sistema viejo se desactiva.
-- ═══════════════════════════════════════════════════

-- 1. Migrar registros de grupos a nexos
INSERT INTO nexos (id, usuario_id, tipo, titulo, descripcion, avatar_url, banner_url, ciudad, provincia, estado, config, created_at)
SELECT
  gen_random_uuid(),
  creador_id,
  'grupo',
  COALESCE(nombre, 'Sin nombre'),
  descripcion,
  imagen,
  imagen_fondo,
  ciudad,
  provincia,
  CASE WHEN activo THEN 'activo' ELSE 'pausado' END,
  jsonb_build_object(
    'tipo_acceso', CASE WHEN pago_ingreso_admin THEN 'pago' ELSE 'libre' END
  ) || COALESCE(config::jsonb, '{}'::jsonb),
  created_at
FROM grupos
WHERE NOT EXISTS (
  -- Evitar duplicados si se ejecuta más de una vez
  SELECT 1 FROM nexos n WHERE n.titulo = grupos.nombre AND n.usuario_id = grupos.creador_id AND n.tipo = 'grupo'
);

-- 2. Crear tabla temporal de mapeo viejo_id → nuevo_id
CREATE TEMP TABLE IF NOT EXISTS grupo_nexo_map AS
SELECT g.id AS grupo_id, n.id AS nexo_id
FROM grupos g
JOIN nexos n ON n.titulo = g.nombre AND n.usuario_id = g.creador_id AND n.tipo = 'grupo';

-- 3. Migrar miembros
INSERT INTO nexo_miembros (nexo_id, usuario_id, rol, estado, created_at)
SELECT
  m.nexo_id,
  gm.usuario_id,
  gm.rol,
  gm.estado,
  gm.created_at
FROM grupo_miembros gm
JOIN grupo_nexo_map m ON m.grupo_id = gm.grupo_id
WHERE NOT EXISTS (
  SELECT 1 FROM nexo_miembros nm WHERE nm.nexo_id = m.nexo_id AND nm.usuario_id = gm.usuario_id
);

-- 4. Crear slider de chat para cada grupo migrado
INSERT INTO nexo_sliders (nexo_id, titulo, tipo, orden, activo)
SELECT m.nexo_id, 'Chat', 'mensajes', 0, true
FROM grupo_nexo_map m
WHERE NOT EXISTS (
  SELECT 1 FROM nexo_sliders ns WHERE ns.nexo_id = m.nexo_id AND ns.tipo = 'mensajes'
);

-- 5. Migrar mensajes a nexo_mensajes
INSERT INTO nexo_mensajes (nexo_id, usuario_id, texto, created_at)
SELECT
  m.nexo_id,
  gm.usuario_id,
  gm.texto,
  gm.created_at
FROM grupo_mensajes gm
JOIN grupo_nexo_map m ON m.grupo_id = gm.grupo_id;

-- Limpiar tabla temporal
DROP TABLE IF EXISTS grupo_nexo_map;

-- NOTA: No se eliminan las tablas viejas (grupos, grupo_miembros, grupo_mensajes)
-- para mantener backup. Se pueden eliminar después de verificar la migración.
