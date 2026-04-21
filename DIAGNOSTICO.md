# DIAGNÓSTICO NEXONET

Fecha: 2026-04-21
Rama actual: `master`

---

## 1. ARQUITECTURA

**Tipo de proyecto:** Next.js 16 (App Router) con TypeScript.

Justificación:
- `package.json` declara `"next": "16.1.6"` y scripts `next dev` / `next build` / `next start`.
- Existe `next.config.ts` en la raíz.
- Existe `src/app/` con `layout.tsx` y `page.tsx` (App Router, no Pages Router).
- **NO** existe `src/pages/` ni `pages/`.
- **NO** hay ningún `index.html` en la raíz ni archivos `.html` en todo el proyecto.

**Versiones:**
- Next.js: **16.1.6**
- React / React-DOM: **19.2.3**
- TypeScript: `^5`
- Node: no hay `engines` declarado en `package.json`, ni `.nvmrc`.

**Dependencies:**
```
@supabase/auth-helpers-nextjs  ^0.15.0
@supabase/ssr                  ^0.8.0
@supabase/supabase-js          ^2.98.0
leaflet                        ^1.9.4
next                           16.1.6
react                          19.2.3
react-dom                      19.2.3
react-leaflet                  ^5.0.0
resend                         ^6.9.4
web-push                       ^3.6.7
```

**DevDependencies:**
```
@tailwindcss/postcss           ^4
@types/leaflet                 ^1.9.21
@types/node                    ^20
@types/react                   ^19
@types/react-dom               ^19
@types/web-push                ^3.6.4
eslint                         ^9
eslint-config-next             16.1.6
tailwindcss                    ^4
typescript                     ^5
```

---

## 2. ESTRUCTURA DE ARCHIVOS

**Árbol hasta 3 niveles** (ignorando `node_modules`, `.next`, `.git`, `dist`, `build`, `.vercel`):

```
nexonet/
├── .claude/
├── .vscode/
├── docs/
├── public/
├── sql/
└── src/
    ├── app/
    │   ├── _components/
    │   ├── _hooks/
    │   ├── _lib/
    │   ├── admin/
    │   ├── anuncios/
    │   ├── api/
    │   ├── auth/
    │   ├── buscar/
    │   ├── busqueda-ia/
    │   ├── categoria/
    │   ├── chat/
    │   ├── comprar/
    │   ├── grupos/
    │   ├── legal/
    │   ├── login/
    │   ├── mapa/
    │   ├── mis-anuncios/
    │   ├── nexo/
    │   ├── notificaciones/
    │   ├── nueva-contrasena/
    │   ├── pago/
    │   ├── perfil/
    │   ├── promotor/
    │   ├── publicar/
    │   ├── registro/
    │   ├── tienda/
    │   └── usuario/
    ├── components/
    │   └── nexo/
    └── lib/
```

**Archivos por extensión** (excluyendo `node_modules`, `.next`, `.git`):
- `.tsx`: **67**
- `.ts`: **53**
- `.jsx`: **0**
- `.js`: **1** (`public/sw-push.js`)
- `.html`: **0**
- `.css`: **1** (`src/app/globals.css`)
- `.sql`: **29** (carpeta `sql/`)

---

## 3. RUTAS / PÁGINAS (Next.js App Router)

Todas las `page.tsx` bajo `src/app/` y su ruta pública:

| Archivo | Ruta pública |
|---|---|
| `src/app/page.tsx` | `/` |
| `src/app/admin/page.tsx` | `/admin` |
| `src/app/admin/bots/page.tsx` | `/admin/bots` |
| `src/app/admin/importar/page.tsx` | `/admin/importar` |
| `src/app/admin/login/page.tsx` | `/admin/login` |
| `src/app/admin/usuarios-internos/page.tsx` | `/admin/usuarios-internos` |
| `src/app/anuncios/[id]/page.tsx` | `/anuncios/[id]` |
| `src/app/auth/confirm/page.tsx` | `/auth/confirm` |
| `src/app/buscar/page.tsx` | `/buscar` |
| `src/app/busqueda-ia/page.tsx` | `/busqueda-ia` |
| `src/app/categoria/[rubro]/page.tsx` | `/categoria/[rubro]` |
| `src/app/chat/[anuncio_id]/[usuario_id]/page.tsx` | `/chat/[anuncio_id]/[usuario_id]` |
| `src/app/chat/nexo/[nexo_id]/[usuario_id]/page.tsx` | `/chat/nexo/[nexo_id]/[usuario_id]` |
| `src/app/comprar/page.tsx` | `/comprar` |
| `src/app/grupos/page.tsx` | `/grupos` |
| `src/app/grupos/admin/page.tsx` | `/grupos/admin` |
| `src/app/grupos/categoria/[categoria]/page.tsx` | `/grupos/categoria/[categoria]` |
| `src/app/grupos/crear/page.tsx` | `/grupos/crear` |
| `src/app/grupos/[id]/page.tsx` | `/grupos/[id]` |
| `src/app/legal/page.tsx` | `/legal` |
| `src/app/legal/cookies/page.tsx` | `/legal/cookies` |
| `src/app/legal/copyright/page.tsx` | `/legal/copyright` |
| `src/app/legal/privacidad/page.tsx` | `/legal/privacidad` |
| `src/app/legal/terminos/page.tsx` | `/legal/terminos` |
| `src/app/login/page.tsx` | `/login` |
| `src/app/mapa/page.tsx` | `/mapa` |
| `src/app/mis-anuncios/page.tsx` | `/mis-anuncios` |
| `src/app/nexo/crear/page.tsx` | `/nexo/crear` |
| `src/app/nexo/crear/[tipo]/page.tsx` | `/nexo/crear/[tipo]` |
| `src/app/nexo/[id]/page.tsx` | `/nexo/[id]` |
| `src/app/nexo/[id]/admin/page.tsx` | `/nexo/[id]/admin` |
| `src/app/nexo/[id]/stats/page.tsx` | `/nexo/[id]/stats` |
| `src/app/notificaciones/page.tsx` | `/notificaciones` |
| `src/app/nueva-contrasena/page.tsx` | `/nueva-contrasena` |
| `src/app/pago/error/page.tsx` | `/pago/error` |
| `src/app/pago/exito/page.tsx` | `/pago/exito` |
| `src/app/perfil/[userId]/page.tsx` | `/perfil/[userId]` |
| `src/app/promotor/page.tsx` | `/promotor` |
| `src/app/publicar/page.tsx` | `/publicar` |
| `src/app/registro/page.tsx` | `/registro` |
| `src/app/tienda/page.tsx` | `/tienda` |
| `src/app/usuario/page.tsx` | `/usuario` |

**Total: 42 páginas.**

**API Routes (route.ts) — 39 endpoints** agrupados en: `admin/*`, `anuncios/*`, `busqueda-ia/*`, `chat/*`, `cron/vencimientos`, `empresa/renovar`, `mercadopago/*`, `mp/*`, `nexo/*`, `nexos/*`, `publico/contadores`, `push/*`, `registro/completar`, `servicio/renovar`, `soporte/enviar`.

---

## 4. COMPONENTES CLAVE

### `src/components/` (componentes globales)

| Archivo | Propósito inferido |
|---|---|
| `AyudaPopup.tsx` | Popup de ayuda contextual (lee `config_global.ayuda_popups_activos`). |
| `BannerCompartir.tsx` | Banner invitando a compartir. |
| `BannerPromotor.tsx` | Banner para la sección/rol promotor. |
| `BotonCompartir.tsx` | Botón reutilizable de compartir (Web Share). |
| `BottomNav.tsx` | Barra de navegación inferior (mobile). |
| `Header.tsx` | Header global de la app. |
| `MapaLeaflet.tsx` | Wrapper de mapa Leaflet (cliente-only, transpile). |
| `OnboardingPopup.tsx` | Popup de onboarding para usuarios nuevos. |
| `PopupAccesoGrupo.tsx` | Popup para solicitar/conceder acceso a grupos. |
| `PopupCompra.tsx` | Popup de compra de bits/productos (tiene comentario `// ─── Tipos ──`). |
| `PopupPago.tsx` | Popup de pago (MercadoPago/bits) (tiene comentario `// ─── Tipos ──`). |
| `SoportePopup.tsx` | Popup de soporte; consulta `usuarios(nombre_usuario, codigo)`. |

### `src/components/nexo/`

| Archivo | Propósito inferido |
|---|---|
| `FlashEnvio.tsx` | Envío flash (feature de empresas/servicios). |
| `HorariosAdmin.tsx` | Editor de horarios para nexos tipo empresa/servicio. |
| `PlantillasMensaje.tsx` | Gestor de plantillas de mensaje de nexo. |
| `ResenaWidget.tsx` | Widget de reseñas del nexo. |

### `src/app/_components/` (componentes locales de la home)

| Archivo | Propósito inferido |
|---|---|
| `BotonDarInsignia.tsx` | Botón para otorgar insignia de reputación. |
| `HeroBuscador.tsx` | Hero con buscador de la home. |
| `InsigniaLogro.tsx` | Muestra insignia de logro. |
| `InsigniaReputacion.tsx` | Muestra insignia de reputación. |
| `Slider.tsx` | Slider genérico (items, tarjetas). |
| `TarjetaAnuncio.tsx` | Tarjeta de anuncio en listados. |
| `TarjetaNexo.tsx` | Tarjeta de nexo (grupo/empresa/servicio/trabajo). |
| `TarjetaVacia.tsx` | Placeholder de tarjeta vacía. |

### `src/app/_lib/` y `src/app/_hooks/`

| Archivo | Propósito |
|---|---|
| `_lib/home-constants.ts` | Tipos `Anuncio`/`Nexo`/`Rubro`/`Subrubro`, constantes `FUENTES`, `TIPO_EMOJI`, helpers de precio/estilos. |
| `_lib/insignias.ts` | Helpers de insignias. |
| `_hooks/useHomeData.ts` | Hook que carga anuncios, nexos, rubros, subrubros, visitas, items de sliders y horarios para la home. |

### `src/lib/` (utilidades backend y shared)

`email.ts`, `horarios.ts`, `log-fallos.ts`, `matchBusquedas.ts`, `productos.ts`, `socios.ts`, `supabase.ts`, `webpush.ts`.

Nota: ninguno de los componentes tiene docstring de primera línea; los propósitos se infieren por nombre y uso.

---

## 5. INTEGRACIÓN CON SUPABASE

### Cliente

**Cliente canónico browser:** `src/lib/supabase.ts`
```ts
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

Además, **35 archivos** importan `createClient`. La mayoría son rutas API bajo `src/app/api/**/route.ts` que crean clientes server-side con service role para operaciones privilegiadas (admin, cron, webhooks MP, push, etc.). Archivos destacados:
- `src/lib/supabase.ts` (cliente compartido)
- `src/lib/log-fallos.ts`, `src/lib/socios.ts` (helpers server)
- 33 rutas en `src/app/api/**` con `createClient` propio

### Tablas consultadas (`.from('…')`)

**60 tablas únicas**:
```
anuncios, anuncio_visitas, avatares, barrios,
bits_promo_descargas, bot_mensajes, busqueda_matches,
busquedas_automaticas, ciudades, comisiones_promotor,
conexiones, conexiones_nexo, config, config_app, config_global,
contactos_nexonet, copyright_claims, empresa_pagos,
filtros_busqueda_ia, grupo_categorias, grupo_invitaciones,
grupo_miembros, grupo_subcategorias, grupos, imagenes,
insignias_reputacion, liquidaciones_promotor,
log_bits_internos, log_fallos_sistema, log_socios_comerciales,
mensajes, mensajes_soporte, nexo_descargas,
nexo_descarga_solicitudes, nexo_descargas_pagos,
nexo_flash_envios, nexo_horarios, nexo_mensajes, nexo_miembros,
nexo_plantillas_mensaje, nexo_resenas, nexo_slider_items,
nexo_sliders, nexo_visitas, nexos, notificaciones, pagos_mp,
provincias, push_suscripciones, rubros, sesiones_log,
socios_comerciales, solicitudes_reembolso_promotor,
subrubro_filtros, subrubros, sugerencias_categorias,
suscripciones_mp, trabajo_subrubros, usuarios,
usuarios_conectados, usuarios_mp_tokens
```

### Storage buckets (`.storage.from('…')`)

4 buckets: `anuncios`, `avatares`, `imagenes`, `nexos`.

### Carpeta `supabase/`

**NO existe una carpeta `supabase/`** con `migrations/` o `functions/` (formato CLI de Supabase).

En su lugar hay **`sql/` con 29 archivos SQL numerados** aplicados manualmente:
```
001_insignias.sql               015_filtros_busqueda_ia.sql
002_rubros_empresa_servicio_trabajo.sql  016_filtros_anuncios.sql
003_empresa_trial_pagos.sql     017_membresia_grupo_vencimiento.sql
004_busquedas_automaticas_rls.sql  018_vencimiento_items.sql
005_migrar_grupos_a_nexos.sql   019_usuarios_lat_lng.sql
006_copyright_claims.sql        020_config_global.sql
007_bits_promo_descargas.sql    021_push_suscripciones.sql
008_admin_pago_pendiente.sql    022_suscripciones_mp.sql
009_categorias_ejemplo.sql      023_limpiar_pruebas.sql
009_servicios_completo.sql      024_usuarios_internos.sql
010_rls_rubros_entidades.sql    025_usuarios_internos_tracking.sql
010_rls_rubros_publico.sql      026_socios_comerciales.sql
011_trabajo_completo.sql        027_mensajes_soporte.sql
012_empresa_completo.sql
013_grupos_categorias_completo.sql
014_usuarios_conectados.sql
```
Ojo: hay dos `009_…` y dos `010_…` — colisión de prefijos en la numeración manual.

---

## 6. CONFIGURACIÓN DE DEPLOY

### `vercel.json` (contenido completo)

```json
{
  "crons": [
    {
      "path": "/api/cron/vencimientos",
      "schedule": "0 9 * * *"
    }
  ]
}
```

### `next.config.ts` (contenido completo)

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["leaflet", "react-leaflet"],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'www.rosariogarage.com' },
      { protocol: 'https', hostname: 'rosariogarage.com' },
      { protocol: 'https', hostname: 'www.bienesrosario.com' },
      { protocol: 'https', hostname: 'bienesrosario.com' },
      { protocol: 'https', hostname: 'http2.mlstatic.com' },
      { protocol: 'https', hostname: '*.mlstatic.com' },
      { protocol: 'https', hostname: 'images.evisos.com.ar' },
      { protocol: 'https', hostname: '*.supabase.co' },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, no-cache, must-revalidate",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
```

### `.env.example`

**No existe `.env.example`.** Solo hay `.env.local` (con valores reales) — **no está versionado pero tampoco hay plantilla pública**. Variables detectadas en el código: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, más las típicas de service role / MercadoPago / Resend / VAPID que usan las API routes.

### Scripts de `package.json`

```
dev    → next dev
build  → next build
start  → next start
lint   → eslint
```

---

## 7. ESTADO DE GIT

- **Branch actual:** `master`
- **Remote origin:** `https://github.com/NexoNet-2026/nexonet.git` (fetch y push)

**Últimos 10 commits:**
```
55e3888 2026-04-19 fix: trabajo usa slider propio con TarjetaAnuncio y subrubro correcto
fac6300 2026-04-19 fix: trabajo es anuncio con 1 foto de perfil
e685c4b 2026-04-19 fix: trabajo y anuncio sin tabs ni sliders en vista /nexo/[id]
ae5d783 2026-04-19 fix: trabajo vuelve a nexos con 1 foto en avatar_url
b89e5dd 2026-04-19 Revert "fix: trabajo es anuncio con 1 foto, no nexo con CV"
52fc648 2026-04-19 Revert "fix: redirect de trabajo va a /anuncios/[id] como los anuncios"
cc89e29 2026-04-19 fix: redirect de trabajo va a /anuncios/[id] como los anuncios
6016de9 2026-04-19 fix: trabajo es anuncio con 1 foto, no nexo con CV
2ae88d9 2026-04-19 Revert "fix: trabajo rompía al subir imagen + feature CV adjunto"
40b4714 2026-04-19 Revert "feat: desbloqueo de CV al conectar con trabajos (chat interno)"
```

**Archivos modificados sin commitear:**
```
 M .claude/settings.local.json
 M src/app/_hooks/useHomeData.ts
 M src/app/_lib/home-constants.ts
```

**Branches:**
- Locales: `master`
- Remotos: `origin/HEAD -> origin/master`, `origin/master`

---

## 8. SEÑALES DE "DOBLE ARQUITECTURA"

- **¿`.html` en raíz Y `src/app/` coexistiendo?** → **NO.** Cero archivos `.html` en todo el repo.
- **¿Carpetas tipo `v1`, `old`, `backup`, `legacy`?** → **NO.** Ninguna.
- **¿Múltiples `package.json` en subcarpetas del proyecto?** → **NO.** Solo existe `/package.json` (los otros son dentro de `.next/` y `node_modules/`, que son artefactos de build/deps, no submódulos).

**Conclusión del bloque:** no hay evidencia de doble arquitectura ni de un "proyecto viejo" conviviendo con el nuevo.

---

## RESUMEN EN 5 LÍNEAS

1. Es un **monolito Next.js 16 App Router + React 19 + TypeScript**, con Supabase (auth + DB + storage) y MercadoPago/Resend/web-push como integraciones de pago, mail y notificaciones push.
2. La app está **razonablemente organizada** (42 páginas, 39 API routes, componentes globales en `src/components` y específicos de home en `src/app/_components`), sin artefactos de legacy ni doble arquitectura.
3. La **gestión de base de datos es manual y frágil**: 29 `.sql` numerados en `/sql` con **colisiones de prefijo (009 y 010 duplicados)**, sin CLI de Supabase ni carpeta `supabase/migrations`, y sin `.env.example` que documente variables.
4. El historial reciente muestra **mucha duda sobre el modelo de "trabajo"** (¿anuncio o nexo?) — 10 commits seguidos entre fixes y reverts sobre el mismo tema; la arquitectura de datos en esa feature todavía no está asentada.
5. **Estado de salud:** código tipado y compila limpio, pero hay **deuda operacional** (sin migrations formales, sin `.env.example`, `Cache-Control: no-store` global que puede pegarle al performance en Vercel) y **deuda conceptual** específica del modelo "trabajo" que convendría cerrar antes de seguir apilando features encima.
