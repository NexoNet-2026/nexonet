-- =========================================================================
-- 06-create-functions.sql
-- =========================================================================
-- NexoNet Argentina - Clonado de schema PROD -> STAGING
-- Generado: 2026-04-26
-- Origen: proyecto thehpvccubxzsnbtbzmz (NexoNet APP / producción)
-- Destino: proyecto twnjmfwegelzvecxxwtj (NexoNet STAGING)
--
-- Contenido: 12 functions del schema public
--   - 7 RPC / functions normales
--   - 4 trigger functions (los triggers que las usan se crean en 07)
--   - 1 event trigger function (el event trigger en sí va en 07)
--
-- Nota: requiere que ya existan tablas (01) y sequences.
--       Es seguro re-ejecutar (todas usan CREATE OR REPLACE).
-- =========================================================================


-- =========================================================================
-- SECCIÓN 1/3: RPC y functions de utilidad (7)
-- =========================================================================

-- acreditar_comisiones_promotor
CREATE OR REPLACE FUNCTION public.acreditar_comisiones_promotor(p_usuario_id uuid, p_monto numeric, p_concepto text DEFAULT 'BIT Nexo'::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_actual_id    uuid := p_usuario_id;
  v_monto_actual numeric := p_monto;
  v_comision     numeric;
  v_promotor_id  uuid;
  v_nivel        integer := 1;
BEGIN
  LOOP
    -- Buscar el promotor del usuario actual
    SELECT referido_por INTO v_promotor_id
    FROM usuarios WHERE id = v_actual_id;

    EXIT WHEN v_promotor_id IS NULL;

    -- Calcular 30% del monto de este nivel
    v_comision := ROUND(v_monto_actual * 0.30, 2);

    EXIT WHEN v_comision <= 0;

    -- Acreditar al promotor
    UPDATE usuarios SET
      bits_promotor       = bits_promotor + v_comision,
      bits_promotor_total = bits_promotor_total + v_comision,
      es_promotor         = true
    WHERE id = v_promotor_id;

    -- Registrar en historial
    INSERT INTO comisiones_promotor
      (promotor_id, origen_id, monto_origen, monto_comision, nivel, concepto)
    VALUES
      (v_promotor_id, p_usuario_id, v_monto_actual, v_comision, v_nivel, p_concepto);

    -- Subir un nivel: el monto que sube es la comisión que recibió este nivel
    v_actual_id    := v_promotor_id;
    v_monto_actual := v_comision;
    v_nivel        := v_nivel + 1;

    -- Safety: max 20 niveles para evitar loops infinitos
    EXIT WHEN v_nivel > 20;
  END LOOP;
END;
$function$;

-- fn_cerrar_sesion
CREATE OR REPLACE FUNCTION public.fn_cerrar_sesion(p_sesion_id bigint, p_paginas jsonb DEFAULT NULL::jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  UPDATE sesiones_log SET
    fin = now(),
    duracion_seg = EXTRACT(EPOCH FROM (now() - inicio))::int,
    paginas_visitadas = COALESCE(p_paginas, paginas_visitadas)
  WHERE id = p_sesion_id AND fin IS NULL;
END;
$function$;

-- fn_heartbeat
CREATE OR REPLACE FUNCTION public.fn_heartbeat(p_usuario_id uuid, p_pagina text DEFAULT NULL::text, p_dispositivo text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO sesiones_heartbeat (usuario_id, pagina, dispositivo, ts)
  VALUES (p_usuario_id, p_pagina, p_dispositivo, now());

  UPDATE usuarios SET
    ultima_actividad = now(),
    ultima_pagina    = COALESCE(p_pagina, ultima_pagina)
  WHERE id = p_usuario_id;
END;
$function$;

-- fn_iniciar_sesion
CREATE OR REPLACE FUNCTION public.fn_iniciar_sesion(p_usuario_id uuid, p_dispositivo text DEFAULT NULL::text)
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE v_id BIGINT;
BEGIN
  INSERT INTO sesiones_log (usuario_id, dispositivo, inicio)
  VALUES (p_usuario_id, p_dispositivo, now())
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$function$;

-- generar_codigo_usuario
CREATE OR REPLACE FUNCTION public.generar_codigo_usuario()
 RETURNS text
 LANGUAGE plpgsql
AS $function$
DECLARE
  num integer;
BEGIN
  num := nextval('codigo_usuario_seq');
  RETURN 'NXN-' || LPAD(num::text, 6, '0');
END;
$function$;

-- renovar_publicaciones_mensual
CREATE OR REPLACE FUNCTION public.renovar_publicaciones_mensual()
 RETURNS void
 LANGUAGE plpgsql
AS $function$
DECLARE
  rec        RECORD;
  u          RECORD;
  costo      INTEGER := 500;
  saldo_free INTEGER;
  saldo_pago INTEGER;
  saldo_prom INTEGER;
  usado_free INTEGER;
  usado_pago INTEGER;
  usado_prom INTEGER;
BEGIN
  FOR rec IN
    SELECT a.*
    FROM anuncios a
    WHERE a.estado = 'activo'
      AND a.renovacion_automatica = true
      AND a.proxima_renovacion <= now()
  LOOP
    SELECT bits_free, bits_pago, bits_promotor
      INTO saldo_free, saldo_pago, saldo_prom
    FROM usuarios WHERE id = rec.usuario_id
    FOR UPDATE;

    IF (COALESCE(saldo_free,0) + COALESCE(saldo_pago,0) + COALESCE(saldo_prom,0)) < costo THEN
      UPDATE anuncios SET
        estado = 'pausado_sin_saldo',
        renovacion_automatica = false
      WHERE id = rec.id;

      INSERT INTO notificaciones (usuario_id, tipo, mensaje, anuncio_id)
      VALUES (rec.usuario_id, 'renovacion_fallida',
              'Tu anuncio "' || rec.titulo || '" no se pudo renovar por falta de saldo.',
              rec.id);
      CONTINUE;
    END IF;

    -- Consumir en orden: free -> promotor -> pago
    usado_free := LEAST(COALESCE(saldo_free,0), costo);
    usado_prom := LEAST(COALESCE(saldo_prom,0), costo - usado_free);
    usado_pago := costo - usado_free - usado_prom;

    UPDATE usuarios SET
      bits_free     = bits_free     - usado_free,
      bits_promotor = bits_promotor - usado_prom,
      bits_pago     = bits_pago     - usado_pago
    WHERE id = rec.usuario_id;

    INSERT INTO movimientos_bits (usuario_id, anuncio_id, tipo, monto_free, monto_promotor, monto_pago, concepto)
    VALUES (rec.usuario_id, rec.id, 'renovacion', usado_free, usado_prom, usado_pago,
            'Renovación mensual: ' || rec.titulo);

    UPDATE anuncios SET
      proxima_renovacion = now() + interval '30 days',
      ultima_renovacion  = now()
    WHERE id = rec.id;

    -- Comisiones para promotores en cadena (sobre lo realmente pagado)
    IF usado_pago > 0 THEN
      PERFORM acreditar_comisiones_promotor(rec.usuario_id, usado_pago, 'Renovación anuncio');
    END IF;
  END LOOP;
END;
$function$;

-- resetear_bits_free_mensual
CREATE OR REPLACE FUNCTION public.resetear_bits_free_mensual()
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
  UPDATE usuarios
  SET
    bits_free       = 3000,
    bits_free_fecha = now()
  WHERE bits_free_fecha IS NULL
     OR bits_free_fecha < (now() - interval '30 days');
END;
$function$;


-- =========================================================================
-- SECCIÓN 2/3: Trigger functions (4) — los CREATE TRIGGER van en 07
-- =========================================================================

-- handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.usuarios (id, bits_free, created_at)
  VALUES (NEW.id, 3000, now())
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$function$;

-- handle_nuevo_anuncio_match
CREATE OR REPLACE FUNCTION public.handle_nuevo_anuncio_match()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_busqueda RECORD;
  v_usuario  RECORD;
  v_match    boolean;
BEGIN
  -- Sólo evaluar si el anuncio quedó activo
  IF NEW.estado <> 'activo' THEN
    RETURN NEW;
  END IF;

  FOR v_busqueda IN
    SELECT b.*
    FROM busquedas_guardadas b
    WHERE b.activa = true
      AND (b.categoria_id IS NULL OR b.categoria_id = NEW.categoria_id)
      AND (b.tipo IS NULL OR b.tipo = NEW.tipo)
      AND b.usuario_id <> NEW.usuario_id
  LOOP
    v_match := true;

    -- Filtro de precio
    IF v_busqueda.precio_min IS NOT NULL AND NEW.precio < v_busqueda.precio_min THEN
      v_match := false;
    END IF;
    IF v_busqueda.precio_max IS NOT NULL AND NEW.precio > v_busqueda.precio_max THEN
      v_match := false;
    END IF;

    -- Filtro de keywords (cualquier palabra debe aparecer)
    IF v_match AND v_busqueda.keywords IS NOT NULL AND array_length(v_busqueda.keywords, 1) > 0 THEN
      IF NOT EXISTS (
        SELECT 1
        FROM unnest(v_busqueda.keywords) AS k
        WHERE NEW.titulo ILIKE '%' || k || '%'
           OR NEW.descripcion ILIKE '%' || k || '%'
      ) THEN
        v_match := false;
      END IF;
    END IF;

    -- Filtro de localidad
    IF v_match AND v_busqueda.localidad_id IS NOT NULL
       AND v_busqueda.localidad_id <> NEW.localidad_id THEN
      v_match := false;
    END IF;

    IF v_match THEN
      -- Evitar duplicados: ya existe match para esta búsqueda + anuncio
      IF NOT EXISTS (
        SELECT 1 FROM matches_anuncios
        WHERE busqueda_id = v_busqueda.id AND anuncio_id = NEW.id
      ) THEN
        INSERT INTO matches_anuncios (busqueda_id, anuncio_id, usuario_id, creado_at)
        VALUES (v_busqueda.id, NEW.id, v_busqueda.usuario_id, now());

        SELECT * INTO v_usuario FROM usuarios WHERE id = v_busqueda.usuario_id;

        INSERT INTO notificaciones (usuario_id, tipo, mensaje, anuncio_id, busqueda_id)
        VALUES (
          v_busqueda.usuario_id,
          'match_anuncio',
          'Hay un nuevo anuncio que coincide con tu búsqueda "' || v_busqueda.nombre || '": ' || NEW.titulo,
          NEW.id,
          v_busqueda.id
        );
      END IF;
    END IF;
  END LOOP;

  RETURN NEW;
END;
$function$;

-- handle_nuevo_referido
CREATE OR REPLACE FUNCTION public.handle_nuevo_referido()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  IF NEW.referido_por IS NOT NULL AND
     (TG_OP = 'INSERT' OR OLD.referido_por IS DISTINCT FROM NEW.referido_por) THEN
    UPDATE usuarios SET
      cantidad_referidos = COALESCE(cantidad_referidos, 0) + 1,
      es_promotor        = true
    WHERE id = NEW.referido_por;
  END IF;
  RETURN NEW;
END;
$function$;

-- update_miembros_count
CREATE OR REPLACE FUNCTION public.update_miembros_count()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.estado = 'activo' THEN
    UPDATE grupos SET miembros_count = miembros_count + 1 WHERE id = NEW.grupo_id;
  ELSIF TG_OP = 'DELETE' AND OLD.estado = 'activo' THEN
    UPDATE grupos SET miembros_count = GREATEST(miembros_count - 1, 0) WHERE id = OLD.grupo_id;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.estado <> 'activo' AND NEW.estado = 'activo' THEN
      UPDATE grupos SET miembros_count = miembros_count + 1 WHERE id = NEW.grupo_id;
    ELSIF OLD.estado = 'activo' AND NEW.estado <> 'activo' THEN
      UPDATE grupos SET miembros_count = GREATEST(miembros_count - 1, 0) WHERE id = NEW.grupo_id;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$function$;


-- =========================================================================
-- SECCIÓN 3/3: Event trigger functions (1) — el CREATE EVENT TRIGGER va en 07
-- =========================================================================

-- rls_auto_enable
CREATE OR REPLACE FUNCTION public.rls_auto_enable()
 RETURNS event_trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$function$;


-- =========================================================================
-- VERIFICACIÓN POST-EJECUCIÓN
-- =========================================================================
-- SELECT COUNT(*) FROM pg_proc WHERE pronamespace='public'::regnamespace;
-- Esperado: 12
