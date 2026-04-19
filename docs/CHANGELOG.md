# Changelog

## [2026-04-18] — Fix cascada socios + eliminación admin nexos

### Fixed
- **Cascada de comisiones con socios comerciales**: el endpoint de asignación manual de BIT (`src/app/api/admin/asignar-bit/route.ts`) ahora lee el porcentaje real desde la tabla `socios_comerciales` en lugar de usar el hardcode de NAN-5194178 con 30%. Usuario1 como socio al 40% y Gapachu como socia principal al 30% ahora reciben su porcentaje correcto en cada nivel de la cascada. Commit: `dcbb2a7`.

- **Eliminación de nexos desde admin**: se agregaron RLS policies en Supabase para permitir que Gapachu (admin UUID `f9b23e04-c591-44bf-9efb-51966c30a083`) pueda hacer DELETE/UPDATE sobre `nexos` y todas sus tablas hijas. Antes los borrados en admin parecían funcionar pero no persistían en DB porque las policies solo permitían operar sobre nexos propios (`auth.uid() = usuario_id`).

- **Limpieza de debug logs en `asignar-bit`**: se eliminaron los 3 `console.log` de debug de `src/app/api/admin/asignar-bit/route.ts` — `ASIGNAR-BIT REQUEST`, `UPDATE resultado` y `[cascada-admin] nodo`. Commit: `6d716d0`.

- **Errores 400 en `/admin` al cargar**: 3 queries (a `grupos`, `socios_comerciales` y `contactos_nexonet`) fallaban porque sus FKs (`creador_id` / `usuario_id`) apuntaban a `auth.users` en vez de `public.usuarios`, lo que impedía a PostgREST resolver el embed desde el cliente. Fix: se dropearon las 3 FKs viejas y se recrearon apuntando a `public.usuarios`. Aplicado vía SQL directo en Supabase — no hay migration file todavía. Commit: `5264a39`.

- **Botón admin "Simular compra"**: nuevo endpoint `POST /api/admin/simular-compra` + botón 🧪 morado en tab Usuarios del panel admin. Replica la lógica del webhook de MercadoPago sin consultar la API real ni cobrar dinero. Auth server-side (Bearer token + `es_admin_sistema=true`). Trazabilidad: prefijo `[SIMULACIÓN ADMIN]` en notificaciones y `log_bits_internos`, `pagos_mp.estado='simulado'` con `monto=0`. Commit: `522ee1e`.

- **Limpieza de paquetes BIT obsoletos**: el mapa `PAQUETES` tenía 22 IDs legacy; la tienda pública solo vende 6 (`bit_500`, `bit_1500`, `bit_3000`, `bit_6000`, `bit_12000`, `bit_30000`). Eliminados los 16 IDs huérfanos en `webhook/route.ts`, `simular-compra/route.ts` y `PAQUETES_SIM` del admin. Commit: `80a3d22`.

- **Bug crítico en SELECT de usuarios**: el webhook de MP y `simular-compra` pedían columnas inexistentes en la tabla `usuarios` (`bits_anuncio`, `bits_conexion`, `bits_grupo`, `bits_link`, `bits_adjunto`). Supabase devolvía error y el endpoint interpretaba "Usuario no encontrado", abortando con 404 antes de acreditar BIT o disparar cascada. El bug afectaba también al webhook real — cualquier pago aprobado de MP habría fallado silenciosamente. Fix: recortar el SELECT a las columnas reales (`bits`, `bits_busquedas`, `bits_totales_acumulados`). Commit: `bbc5646`.

- **Cascada con socio 0% resuelta (Opción 1 - Transparente)**: si la comisión redondea a 0 pero la base sigue siendo positiva, el eslabón no cobra pero la cascada sigue con la base intacta al siguiente nivel. Evita que se corte prematuramente cuando un socio con % alto redondea sobre base chica. Verificado en vivo con Usuario6 → `bit_1500`: 320/64/12/2 se mantienen idénticos, Usuario1 y Gapachu quedan transparentes y la cadena termina naturalmente en `referido_por=NULL`. Commit: `fe241c9`.

- **Error handling agregado a `asignar-bit/route.ts`**: las 3 operaciones secundarias (update cascada, insert notif al eslabón, insert notif final al receptor) ahora logean con `console.error` prefijo `[asignar-bit]` si fallan. Sin abortar el flujo — atomicidad real queda en Deuda técnica (refactor a RPC). Commit: `b5bf971`.

- **Paridad total de `asignar-bit` con webhook y `simular-compra`**: además del acumulado del socio (confirmado como bug), se aplicaron otros 3 fixes que aparecieron al revisar la paridad — cascada transparente (faltaba el fix `fe241c9` en este archivo), inserción en `log_bits_internos` por nivel de cascada, y formato de notificación alineado con `toLocaleString` + `pctLabel`. Error handling `[asignar-bit]` extendido a los inserts/updates nuevos. Commit: `7a14f8b`.

### Database changes (aplicados en Supabase, NO en código)
Las siguientes policies se crearon manualmente en SQL Editor:
- `admin_nexos_delete`, `admin_nexos_update` en tabla `nexos`
- `admin_<tabla>_all` en: `nexo_miembros`, `nexo_visitas`, `nexo_descargas_pagos`, `bits_promo_descargas`, `nexo_descargas`, `nexo_slider_items`, `nexo_sliders`, `nexo_mensajes`, `notificaciones`
- `admin_all` en `log_socios_comerciales`

SQL aplicado para redirigir 3 FKs de `auth.users` → `public.usuarios` (fix errores 400 en admin):

```sql
ALTER TABLE public.grupos DROP CONSTRAINT grupos_creador_id_fkey;
ALTER TABLE public.grupos ADD CONSTRAINT grupos_creador_id_fkey
  FOREIGN KEY (creador_id) REFERENCES public.usuarios(id) ON DELETE SET NULL;

ALTER TABLE public.socios_comerciales DROP CONSTRAINT socios_comerciales_usuario_id_fkey;
ALTER TABLE public.socios_comerciales ADD CONSTRAINT socios_comerciales_usuario_id_fkey
  FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE CASCADE;

ALTER TABLE public.contactos_nexonet DROP CONSTRAINT contactos_nexonet_usuario_id_fkey;
ALTER TABLE public.contactos_nexonet ADD CONSTRAINT contactos_nexonet_usuario_id_fkey
  FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE CASCADE;
```

### Pending / Known issues
- Pago real con MP falló en checkout (tarjeta rechazada por MP, no por NexoNet).

### Deuda técnica
- **`asignar-bit`: falta atomicidad**. Si falla el `insert` de notificación después del `update` de `bits_promo`, el referido ya cobró pero no fue notificado (o el caso inverso). Refactor a RPC / función SQL (`plpgsql`) para que el update de bits y el insert de notificación corran en una sola transacción. No urgente.

### Verificaciones de integridad
- **`pagos_mp` revisado** con `SELECT ... WHERE estado='approved'`: 0 filas huérfanas. El bug del SELECT roto nunca afectó clientes reales porque ningún pago real llegó a entrar al webhook post-bug — todos los intentos quedaron en `pending` o fueron rechazados por MP antes de aprobarse.

### Testing verified
- Asignación manual de 10.000 BIT a Usuario5 distribuye correctamente:
  - Usuario4: 2000 (20%)
  - Usuario3: 400 (20%)
  - Usuario2: 80 (20%)
  - Usuario1: 32 (40% socio)
  - Gapachu: 9 (30% socio)
- Eliminación de nexo 'Jeep eterno' desde admin persiste en DB después de F5.
- **Cascada de comisiones verificada end-to-end** con la herramienta de simulación. Test con Usuario6 → `bit_1500` (1.600 BIT): Usuario5=320, Usuario4=64, Usuario3=12, Usuario2=2 (✓ todos coinciden con cálculo teórico). Cascada llega a Usuario2 con base=2; Usuario1 (40% socio) y Gapachu (30% socio) quedan como eslabones transparentes (`floor` redondea a 0, no cobran) y la cadena termina naturalmente en `referido_por=NULL`. Comportamiento esperado post-fix `fe241c9`.
