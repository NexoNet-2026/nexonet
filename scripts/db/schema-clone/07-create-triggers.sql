-- =========================================================================
-- 07-create-triggers.sql
-- =========================================================================
-- NexoNet Argentina - Clonado de schema PROD -> STAGING
-- Generado: 2026-04-26
-- Origen: proyecto thehpvccubxzsnbtbzmz (NexoNet APP / produccion)
-- Destino: proyecto twnjmfwegelzvecxxwtj (NexoNet STAGING)
--
-- Contenido: 4 triggers + 1 event trigger
--   - 1 trigger en auth.users   (on_auth_user_created)
--   - 3 triggers en public.*    (anuncios, usuarios, grupo_miembros)
--   - 1 event trigger global    (ensure_rls)
--
-- Nota: requiere que el script 06-create-functions.sql ya este aplicado.
--       Es seguro re-ejecutar (todos los CREATE van precedidos de DROP IF EXISTS).
--
-- Definiciones extraidas via pg_get_triggerdef en produccion (1:1 con prod).
-- =========================================================================


-- =========================================================================
-- SECCION 1/3: Trigger en auth.users (1)
-- =========================================================================
-- on_auth_user_created: cuando se crea un usuario en auth.users (signup),
-- crea su fila en public.usuarios con bits_free=3000 via handle_new_user().

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();


-- =========================================================================
-- SECCION 2/3: Triggers en public (3)
-- =========================================================================

-- on_nuevo_anuncio_match: cuando se crea un anuncio, evalua busquedas
-- guardadas activas y genera matches + notificaciones.
DROP TRIGGER IF EXISTS on_nuevo_anuncio_match ON public.anuncios;
CREATE TRIGGER on_nuevo_anuncio_match
  AFTER INSERT ON public.anuncios
  FOR EACH ROW
  EXECUTE FUNCTION handle_nuevo_anuncio_match();

-- on_nuevo_referido: cuando un usuario se crea o cambia su referido_por,
-- incrementa el contador en el promotor y lo marca como es_promotor=true.
DROP TRIGGER IF EXISTS on_nuevo_referido ON public.usuarios;
CREATE TRIGGER on_nuevo_referido
  AFTER INSERT OR UPDATE OF referido_por ON public.usuarios
  FOR EACH ROW
  EXECUTE FUNCTION handle_nuevo_referido();

-- trg_miembros_count: mantiene grupos.miembros_count sincronizado con
-- altas, bajas y cambios de estado en grupo_miembros.
DROP TRIGGER IF EXISTS trg_miembros_count ON public.grupo_miembros;
CREATE TRIGGER trg_miembros_count
  AFTER INSERT OR DELETE OR UPDATE ON public.grupo_miembros
  FOR EACH ROW
  EXECUTE FUNCTION update_miembros_count();


-- =========================================================================
-- SECCION 3/3: Event trigger (1)
-- =========================================================================
-- ensure_rls: cada vez que se crea una tabla nueva en public, habilita RLS
-- automaticamente. Tags = CREATE TABLE / CREATE TABLE AS / SELECT INTO.

DROP EVENT TRIGGER IF EXISTS ensure_rls;
CREATE EVENT TRIGGER ensure_rls
  ON ddl_command_end
  WHEN TAG IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
  EXECUTE FUNCTION public.rls_auto_enable();


-- =========================================================================
-- VERIFICACION POST-EJECUCION
-- =========================================================================
-- SELECT
--   (SELECT COUNT(*) FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid
--    JOIN pg_namespace n ON n.oid=c.relnamespace
--    WHERE NOT t.tgisinternal
--      AND ((n.nspname='public') OR (n.nspname='auth' AND c.relname='users'))
--   ) AS triggers,
--   (SELECT COUNT(*) FROM pg_event_trigger WHERE evtname='ensure_rls') AS event_trigger;
-- Esperado: 4, 1
