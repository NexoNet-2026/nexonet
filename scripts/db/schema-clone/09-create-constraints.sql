-- =========================================================================
-- 09-create-constraints.sql
-- =========================================================================
-- NexoNet Argentina - Clonado de schema PROD -> STAGING
-- Generado: 2026-04-26
-- Origen: proyecto thehpvccubxzsnbtbzmz (NexoNet APP / produccion)
-- Destino: proyecto twnjmfwegelzvecxxwtj (NexoNet STAGING)
--
-- Contenido: 30 constraints adicionales en public
--   - 6 CHECK
--   - 24 UNIQUE  (cada UNIQUE crea su index unico automaticamente)
--
-- Nota: requiere que las 79 tablas (01) ya existan.
--       Es seguro re-ejecutar (cada ADD va precedido de DROP IF EXISTS).
--
-- Pendiente para MEMORY.md:
--   nexo_miembros tiene 2 UNIQUE constraints redundantes sobre (nexo_id, usuario_id):
--     nexo_miembros_nexo_id_usuario_id_key  y  nexo_miembros_unique
--   Replicado 1:1 con prod. Revisar si conviene unificar a uno solo.
--
-- Definiciones extraidas via pg_get_constraintdef en produccion (1:1 con prod).
-- =========================================================================


-- =========================================================================
-- SECCION 1/2: CHECK constraints (6)
-- =========================================================================

-- Tabla: public._huerfanos_storage_snapshot
ALTER TABLE public._huerfanos_storage_snapshot DROP CONSTRAINT IF EXISTS estado_valido;
ALTER TABLE public._huerfanos_storage_snapshot ADD CONSTRAINT estado_valido CHECK ((estado = ANY (ARRAY['cuarentena'::text, 'restaurado'::text, 'purgado'::text])));

-- Tabla: public.insignias_reputacion
ALTER TABLE public.insignias_reputacion DROP CONSTRAINT IF EXISTS insignias_reputacion_tipo_check;
ALTER TABLE public.insignias_reputacion ADD CONSTRAINT insignias_reputacion_tipo_check CHECK (((tipo)::text = ANY ((ARRAY['buen_trato'::character varying, 'confiable'::character varying, 'rapido'::character varying, 'recomendado'::character varying])::text[])));

-- Tabla: public.log_fallos_sistema
ALTER TABLE public.log_fallos_sistema DROP CONSTRAINT IF EXISTS log_fallos_sistema_estado_check;
ALTER TABLE public.log_fallos_sistema ADD CONSTRAINT log_fallos_sistema_estado_check CHECK ((estado = ANY (ARRAY['pendiente'::text, 'resuelto'::text, 'descartado'::text])));
ALTER TABLE public.log_fallos_sistema DROP CONSTRAINT IF EXISTS log_fallos_sistema_severidad_check;
ALTER TABLE public.log_fallos_sistema ADD CONSTRAINT log_fallos_sistema_severidad_check CHECK ((severidad = ANY (ARRAY['critico'::text, 'advertencia'::text, 'info'::text])));

-- Tabla: public.mensajes_soporte
ALTER TABLE public.mensajes_soporte DROP CONSTRAINT IF EXISTS mensajes_soporte_tipo_check;
ALTER TABLE public.mensajes_soporte ADD CONSTRAINT mensajes_soporte_tipo_check CHECK (((tipo)::text = ANY ((ARRAY['reclamo'::character varying, 'sugerencia'::character varying, 'denuncia'::character varying, 'solicitud'::character varying, 'ayuda'::character varying])::text[])));

-- Tabla: public.nexo_resenas
ALTER TABLE public.nexo_resenas DROP CONSTRAINT IF EXISTS nexo_resenas_rating_check;
ALTER TABLE public.nexo_resenas ADD CONSTRAINT nexo_resenas_rating_check CHECK (((rating >= 1) AND (rating <= 5)));


-- =========================================================================
-- SECCION 2/2: UNIQUE constraints (24)
-- Cada UNIQUE genera automaticamente un index unico asociado.
-- =========================================================================

-- Tabla: public.anuncio_visitas  (1 unique)
ALTER TABLE public.anuncio_visitas DROP CONSTRAINT IF EXISTS anuncio_visitas_anuncio_id_visitante_id_fecha_key;
ALTER TABLE public.anuncio_visitas ADD CONSTRAINT anuncio_visitas_anuncio_id_visitante_id_fecha_key UNIQUE (anuncio_id, visitante_id, fecha);

-- Tabla: public.conexiones  (1 unique)
ALTER TABLE public.conexiones DROP CONSTRAINT IF EXISTS conexiones_anuncio_id_usuario_id_key;
ALTER TABLE public.conexiones ADD CONSTRAINT conexiones_anuncio_id_usuario_id_key UNIQUE (anuncio_id, usuario_id);

-- Tabla: public.conexiones_nexo  (1 unique)
ALTER TABLE public.conexiones_nexo DROP CONSTRAINT IF EXISTS conexiones_nexo_nexo_id_usuario_id_key;
ALTER TABLE public.conexiones_nexo ADD CONSTRAINT conexiones_nexo_nexo_id_usuario_id_key UNIQUE (nexo_id, usuario_id);

-- Tabla: public.config  (1 unique)
ALTER TABLE public.config DROP CONSTRAINT IF EXISTS config_clave_key;
ALTER TABLE public.config ADD CONSTRAINT config_clave_key UNIQUE (clave);

-- Tabla: public.grupo_invitaciones  (1 unique)
ALTER TABLE public.grupo_invitaciones DROP CONSTRAINT IF EXISTS grupo_invitaciones_grupo_id_invitado_id_key;
ALTER TABLE public.grupo_invitaciones ADD CONSTRAINT grupo_invitaciones_grupo_id_invitado_id_key UNIQUE (grupo_id, invitado_id);

-- Tabla: public.grupo_miembros  (1 unique)
ALTER TABLE public.grupo_miembros DROP CONSTRAINT IF EXISTS grupo_miembros_grupo_id_usuario_id_key;
ALTER TABLE public.grupo_miembros ADD CONSTRAINT grupo_miembros_grupo_id_usuario_id_key UNIQUE (grupo_id, usuario_id);

-- Tabla: public.insignias_reputacion  (2 uniques)
ALTER TABLE public.insignias_reputacion DROP CONSTRAINT IF EXISTS insignias_reputacion_dador_id_anuncio_id_key;
ALTER TABLE public.insignias_reputacion ADD CONSTRAINT insignias_reputacion_dador_id_anuncio_id_key UNIQUE (dador_id, anuncio_id);
ALTER TABLE public.insignias_reputacion DROP CONSTRAINT IF EXISTS insignias_reputacion_dador_id_nexo_id_key;
ALTER TABLE public.insignias_reputacion ADD CONSTRAINT insignias_reputacion_dador_id_nexo_id_key UNIQUE (dador_id, nexo_id);

-- Tabla: public.nexo_horarios  (1 unique)
ALTER TABLE public.nexo_horarios DROP CONSTRAINT IF EXISTS nexo_horarios_nexo_id_dia_key;
ALTER TABLE public.nexo_horarios ADD CONSTRAINT nexo_horarios_nexo_id_dia_key UNIQUE (nexo_id, dia);

-- Tabla: public.nexo_miembros  (2 uniques)  -- OJO: 2 UNIQUE redundantes sobre las mismas columnas, ver header
ALTER TABLE public.nexo_miembros DROP CONSTRAINT IF EXISTS nexo_miembros_nexo_id_usuario_id_key;
ALTER TABLE public.nexo_miembros ADD CONSTRAINT nexo_miembros_nexo_id_usuario_id_key UNIQUE (nexo_id, usuario_id);
ALTER TABLE public.nexo_miembros DROP CONSTRAINT IF EXISTS nexo_miembros_unique;
ALTER TABLE public.nexo_miembros ADD CONSTRAINT nexo_miembros_unique UNIQUE (nexo_id, usuario_id);

-- Tabla: public.nexo_resenas  (1 unique)
ALTER TABLE public.nexo_resenas DROP CONSTRAINT IF EXISTS nexo_resenas_nexo_id_usuario_id_key;
ALTER TABLE public.nexo_resenas ADD CONSTRAINT nexo_resenas_nexo_id_usuario_id_key UNIQUE (nexo_id, usuario_id);

-- Tabla: public.nexo_slider_anuncios  (1 unique)
ALTER TABLE public.nexo_slider_anuncios DROP CONSTRAINT IF EXISTS nexo_slider_anuncios_slider_id_anuncio_id_key;
ALTER TABLE public.nexo_slider_anuncios ADD CONSTRAINT nexo_slider_anuncios_slider_id_anuncio_id_key UNIQUE (slider_id, anuncio_id);

-- Tabla: public.nexo_visitas  (1 unique)
ALTER TABLE public.nexo_visitas DROP CONSTRAINT IF EXISTS nexo_visitas_nexo_id_visitante_id_fecha_key;
ALTER TABLE public.nexo_visitas ADD CONSTRAINT nexo_visitas_nexo_id_visitante_id_fecha_key UNIQUE (nexo_id, visitante_id, fecha);

-- Tabla: public.pagos_mp  (1 unique)
ALTER TABLE public.pagos_mp DROP CONSTRAINT IF EXISTS pagos_mp_payment_id_key;
ALTER TABLE public.pagos_mp ADD CONSTRAINT pagos_mp_payment_id_key UNIQUE (payment_id);

-- Tabla: public.push_suscripciones  (1 unique)
ALTER TABLE public.push_suscripciones DROP CONSTRAINT IF EXISTS push_suscripciones_usuario_id_endpoint_key;
ALTER TABLE public.push_suscripciones ADD CONSTRAINT push_suscripciones_usuario_id_endpoint_key UNIQUE (usuario_id, endpoint);

-- Tabla: public.slider_tipos  (1 unique)
ALTER TABLE public.slider_tipos DROP CONSTRAINT IF EXISTS slider_tipos_codigo_key;
ALTER TABLE public.slider_tipos ADD CONSTRAINT slider_tipos_codigo_key UNIQUE (codigo);

-- Tabla: public.socios_comerciales  (1 unique)
ALTER TABLE public.socios_comerciales DROP CONSTRAINT IF EXISTS socios_comerciales_codigo_referido_key;
ALTER TABLE public.socios_comerciales ADD CONSTRAINT socios_comerciales_codigo_referido_key UNIQUE (codigo_referido);

-- Tabla: public.suscripciones_mp  (1 unique)
ALTER TABLE public.suscripciones_mp DROP CONSTRAINT IF EXISTS suscripciones_mp_mp_preapproval_id_key;
ALTER TABLE public.suscripciones_mp ADD CONSTRAINT suscripciones_mp_mp_preapproval_id_key UNIQUE (mp_preapproval_id);

-- Tabla: public.usuarios  (3 uniques)
ALTER TABLE public.usuarios DROP CONSTRAINT IF EXISTS usuarios_codigo_key;
ALTER TABLE public.usuarios ADD CONSTRAINT usuarios_codigo_key UNIQUE (codigo);
ALTER TABLE public.usuarios DROP CONSTRAINT IF EXISTS usuarios_email_key;
ALTER TABLE public.usuarios ADD CONSTRAINT usuarios_email_key UNIQUE (email);
ALTER TABLE public.usuarios DROP CONSTRAINT IF EXISTS usuarios_usuario_key;
ALTER TABLE public.usuarios ADD CONSTRAINT usuarios_usuario_key UNIQUE (usuario);

-- Tabla: public.usuarios_conectados  (1 unique)
ALTER TABLE public.usuarios_conectados DROP CONSTRAINT IF EXISTS usuarios_conectados_usuario_id_key;
ALTER TABLE public.usuarios_conectados ADD CONSTRAINT usuarios_conectados_usuario_id_key UNIQUE (usuario_id);

-- Tabla: public.usuarios_mp_tokens  (1 unique)
ALTER TABLE public.usuarios_mp_tokens DROP CONSTRAINT IF EXISTS usuarios_mp_tokens_usuario_id_key;
ALTER TABLE public.usuarios_mp_tokens ADD CONSTRAINT usuarios_mp_tokens_usuario_id_key UNIQUE (usuario_id);


-- =========================================================================
-- VERIFICACION POST-EJECUCION
-- =========================================================================
-- SELECT
--   COUNT(*) FILTER (WHERE contype='u') AS unique_count,
--   COUNT(*) FILTER (WHERE contype='c') AS check_count
-- FROM pg_constraint WHERE connamespace='public'::regnamespace;
-- Esperado: unique=24, check=6
