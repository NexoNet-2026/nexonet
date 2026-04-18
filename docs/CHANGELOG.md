# Changelog

## [2026-04-18] — Fix cascada socios + eliminación admin nexos

### Fixed
- **Cascada de comisiones con socios comerciales**: el endpoint de asignación manual de BIT (`src/app/api/admin/asignar-bit/route.ts`) ahora lee el porcentaje real desde la tabla `socios_comerciales` en lugar de usar el hardcode de NAN-5194178 con 30%. Usuario1 como socio al 40% y Gapachu como socia principal al 30% ahora reciben su porcentaje correcto en cada nivel de la cascada. Commit: `dcbb2a7`.

- **Eliminación de nexos desde admin**: se agregaron RLS policies en Supabase para permitir que Gapachu (admin UUID `f9b23e04-c591-44bf-9efb-51966c30a083`) pueda hacer DELETE/UPDATE sobre `nexos` y todas sus tablas hijas. Antes los borrados en admin parecían funcionar pero no persistían en DB porque las policies solo permitían operar sobre nexos propios (`auth.uid() = usuario_id`).

### Database changes (aplicados en Supabase, NO en código)
Las siguientes policies se crearon manualmente en SQL Editor:
- `admin_nexos_delete`, `admin_nexos_update` en tabla `nexos`
- `admin_<tabla>_all` en: `nexo_miembros`, `nexo_visitas`, `nexo_descargas_pagos`, `bits_promo_descargas`, `nexo_descargas`, `nexo_slider_items`, `nexo_sliders`, `nexo_mensajes`, `notificaciones`
- `admin_all` en `log_socios_comerciales`

### Pending / Known issues
- Errores 400 en consola al cargar admin (queries a `thehpvccubxzsnbtbzmz.supabase.co`) — pendiente diagnosticar.
- Pago real con MP falló en checkout (tarjeta rechazada por MP, no por NexoNet).
- Simulación de webhook MP pendiente para verificar cascada en flujo de pago real.
- Debug `console.log('[cascada-admin]')` sigue activo en `src/app/api/admin/asignar-bit/route.ts` — limpiar cuando se confirme que no hay más bugs.

### Testing verified
- Asignación manual de 10.000 BIT a Usuario5 distribuye correctamente:
  - Usuario4: 2000 (20%)
  - Usuario3: 400 (20%)
  - Usuario2: 80 (20%)
  - Usuario1: 32 (40% socio)
  - Gapachu: 9 (30% socio)
- Eliminación de nexo 'Jeep eterno' desde admin persiste en DB después de F5.
