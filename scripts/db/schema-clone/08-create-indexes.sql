-- =========================================================================
-- 08-create-indexes.sql
-- =========================================================================
-- NexoNet Argentina - Clonado de schema PROD -> STAGING
-- Generado: 2026-04-26
-- Origen: proyecto thehpvccubxzsnbtbzmz (NexoNet APP / produccion)
-- Destino: proyecto twnjmfwegelzvecxxwtj (NexoNet STAGING)
--
-- Contenido: 32 indexes adicionales en 16 tablas de public
--   (excluye los automaticos por PK, UNIQUE constraint y FK)
--
-- Nota: requiere que las 79 tablas (01) ya existan.
--       Es seguro re-ejecutar (cada CREATE va precedido de DROP IF EXISTS).
--
-- Definiciones extraidas via pg_get_indexdef en produccion (1:1 con prod).
-- =========================================================================

-- ========================================================================
-- Tabla: public._huerfanos_storage_snapshot  (2 indexes)
-- ========================================================================
DROP INDEX IF EXISTS public.idx_huerfanos_bucket_name_orig;
CREATE INDEX idx_huerfanos_bucket_name_orig ON public._huerfanos_storage_snapshot USING btree (bucket_id, name_original);
DROP INDEX IF EXISTS public.idx_huerfanos_estado;
CREATE INDEX idx_huerfanos_estado ON public._huerfanos_storage_snapshot USING btree (estado);

-- ========================================================================
-- Tabla: public.busqueda_matches  (2 indexes)
-- ========================================================================
DROP INDEX IF EXISTS public.busqueda_matches_busqueda_id_idx;
CREATE INDEX busqueda_matches_busqueda_id_idx ON public.busqueda_matches USING btree (busqueda_id);
DROP INDEX IF EXISTS public.busqueda_matches_usuario_id_idx;
CREATE INDEX busqueda_matches_usuario_id_idx ON public.busqueda_matches USING btree (usuario_id);

-- ========================================================================
-- Tabla: public.comisiones_promotor  (1 indexes)
-- ========================================================================
DROP INDEX IF EXISTS public.idx_comisiones_promotor_id;
CREATE INDEX idx_comisiones_promotor_id ON public.comisiones_promotor USING btree (promotor_id);

-- ========================================================================
-- Tabla: public.insignias_reputacion  (3 indexes)
-- ========================================================================
DROP INDEX IF EXISTS public.idx_insignias_rep_anuncio;
CREATE INDEX idx_insignias_rep_anuncio ON public.insignias_reputacion USING btree (anuncio_id);
DROP INDEX IF EXISTS public.idx_insignias_rep_nexo;
CREATE INDEX idx_insignias_rep_nexo ON public.insignias_reputacion USING btree (nexo_id);
DROP INDEX IF EXISTS public.idx_insignias_rep_receptor;
CREATE INDEX idx_insignias_rep_receptor ON public.insignias_reputacion USING btree (receptor_id);

-- ========================================================================
-- Tabla: public.log_fallos_sistema  (4 indexes)
-- ========================================================================
DROP INDEX IF EXISTS public.idx_log_fallos_contexto_created;
CREATE INDEX idx_log_fallos_contexto_created ON public.log_fallos_sistema USING btree (contexto, created_at DESC);
DROP INDEX IF EXISTS public.idx_log_fallos_estado_created;
CREATE INDEX idx_log_fallos_estado_created ON public.log_fallos_sistema USING btree (estado, created_at DESC);
DROP INDEX IF EXISTS public.idx_log_fallos_severidad_created;
CREATE INDEX idx_log_fallos_severidad_created ON public.log_fallos_sistema USING btree (severidad, created_at DESC);
DROP INDEX IF EXISTS public.idx_log_fallos_usuario;
CREATE INDEX idx_log_fallos_usuario ON public.log_fallos_sistema USING btree (usuario_id);

-- ========================================================================
-- Tabla: public.mensajes  (5 indexes)
-- ========================================================================
DROP INDEX IF EXISTS public.idx_mensajes_anuncio;
CREATE INDEX idx_mensajes_anuncio ON public.mensajes USING btree (anuncio_id);
DROP INDEX IF EXISTS public.idx_mensajes_created;
CREATE INDEX idx_mensajes_created ON public.mensajes USING btree (created_at DESC);
DROP INDEX IF EXISTS public.idx_mensajes_emisor;
CREATE INDEX idx_mensajes_emisor ON public.mensajes USING btree (emisor_id);
DROP INDEX IF EXISTS public.idx_mensajes_receptor;
CREATE INDEX idx_mensajes_receptor ON public.mensajes USING btree (receptor_id);
DROP INDEX IF EXISTS public.mensajes_nexo_id_idx;
CREATE INDEX mensajes_nexo_id_idx ON public.mensajes USING btree (nexo_id);

-- ========================================================================
-- Tabla: public.nexo_mensajes  (1 indexes)
-- ========================================================================
DROP INDEX IF EXISTS public.idx_nexo_mensajes_nexo;
CREATE INDEX idx_nexo_mensajes_nexo ON public.nexo_mensajes USING btree (nexo_id);

-- ========================================================================
-- Tabla: public.nexo_miembros  (2 indexes)
-- ========================================================================
DROP INDEX IF EXISTS public.idx_nexo_miembros_nexo;
CREATE INDEX idx_nexo_miembros_nexo ON public.nexo_miembros USING btree (nexo_id);
DROP INDEX IF EXISTS public.idx_nexo_miembros_user;
CREATE INDEX idx_nexo_miembros_user ON public.nexo_miembros USING btree (usuario_id);

-- ========================================================================
-- Tabla: public.nexo_slider_items  (1 indexes)
-- ========================================================================
DROP INDEX IF EXISTS public.idx_nexo_items_slider;
CREATE INDEX idx_nexo_items_slider ON public.nexo_slider_items USING btree (slider_id);

-- ========================================================================
-- Tabla: public.nexo_sliders  (1 indexes)
-- ========================================================================
DROP INDEX IF EXISTS public.idx_nexo_sliders_nexo;
CREATE INDEX idx_nexo_sliders_nexo ON public.nexo_sliders USING btree (nexo_id);

-- ========================================================================
-- Tabla: public.nexos  (3 indexes)
-- ========================================================================
DROP INDEX IF EXISTS public.idx_nexos_estado;
CREATE INDEX idx_nexos_estado ON public.nexos USING btree (estado);
DROP INDEX IF EXISTS public.idx_nexos_tipo;
CREATE INDEX idx_nexos_tipo ON public.nexos USING btree (tipo);
DROP INDEX IF EXISTS public.idx_nexos_usuario;
CREATE INDEX idx_nexos_usuario ON public.nexos USING btree (usuario_id);

-- ========================================================================
-- Tabla: public.notificaciones  (2 indexes)
-- ========================================================================
DROP INDEX IF EXISTS public.idx_notificaciones_created;
CREATE INDEX idx_notificaciones_created ON public.notificaciones USING btree (created_at DESC);
DROP INDEX IF EXISTS public.idx_notificaciones_usuario;
CREATE INDEX idx_notificaciones_usuario ON public.notificaciones USING btree (usuario_id, leida);

-- ========================================================================
-- Tabla: public.pagos_mp  (2 indexes)
-- ========================================================================
DROP INDEX IF EXISTS public.idx_pagos_mp_payment;
CREATE INDEX idx_pagos_mp_payment ON public.pagos_mp USING btree (payment_id);
DROP INDEX IF EXISTS public.idx_pagos_mp_usuario;
CREATE INDEX idx_pagos_mp_usuario ON public.pagos_mp USING btree (usuario_id);

-- ========================================================================
-- Tabla: public.sesiones_log  (1 indexes)
-- ========================================================================
DROP INDEX IF EXISTS public.idx_sl_inicio;
CREATE INDEX idx_sl_inicio ON public.sesiones_log USING btree (inicio DESC);

-- ========================================================================
-- Tabla: public.usuarios  (1 indexes)
-- ========================================================================
DROP INDEX IF EXISTS public.idx_usuarios_referido_por;
CREATE INDEX idx_usuarios_referido_por ON public.usuarios USING btree (referido_por);

-- ========================================================================
-- Tabla: public.usuarios_conectados  (1 indexes)
-- ========================================================================
DROP INDEX IF EXISTS public.idx_uc_last_seen;
CREATE INDEX idx_uc_last_seen ON public.usuarios_conectados USING btree (last_seen DESC);

-- =========================================================================
-- VERIFICACION POST-EJECUCION
-- =========================================================================
-- SELECT COUNT(*) AS indexes_a_clonar
-- FROM pg_index i
-- JOIN pg_class c ON c.oid=i.indexrelid
-- JOIN pg_namespace n ON n.oid=c.relnamespace
-- WHERE n.nspname='public'
--   AND NOT i.indisprimary AND NOT i.indisunique
--   AND NOT EXISTS (SELECT 1 FROM pg_constraint con WHERE con.conindid=i.indexrelid);
-- Esperado: 32
