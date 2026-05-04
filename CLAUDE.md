# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Comandos

```bash
npm run dev      # dev server en http://localhost:3000
npm run build    # build de producción (corre type-check + lint de Next)
npm start        # servir el build
npm run lint     # eslint (config: eslint-config-next)
```

No hay framework de tests configurado. Para validar cambios, hacer `npm run build` (atrapa errores de TS y reglas de Next) y, si tocan UI, abrir el dev server.

Path alias: `@/*` → `./src/*` (definido en `tsconfig.json`).

## Variables de entorno

`.env.local` debe definir:
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — públicas, van al cliente.
- `SUPABASE_SERVICE_ROLE_KEY` — secreta, **solo** para route handlers en `src/app/api/**`.

## Arquitectura

### App 100 % client-side sobre Supabase

La app es Next.js 16 (App Router) pero hoy es prácticamente una SPA: las páginas son Client Components que importan un único cliente Supabase desde `src/lib/supabase.ts` y consultan datos desde el navegador. No hay Server Components consumiendo Supabase con service-role. **Toda la seguridad se apoya en RLS de Postgres** — si tocás una tabla nueva, asumí que necesitás policies y ver `sql/` para el patrón.

Los route handlers en `src/app/api/**` son las únicas piezas server-side. Se usan cuando hace falta `SUPABASE_SERVICE_ROLE_KEY` (admin), integrar servicios externos (Mercado Pago, Resend, Web Push) o ejecutar lógica que no puede correr en el cliente. Webhooks de MP, cron de vencimientos, envíos de mail y matching de búsquedas IA viven acá.

Implicación: cuando agregás features de lectura/escritura simples, lo idiomático del repo es hacerlo client-side con el cliente compartido, no crear un endpoint nuevo. Reservá `/api/*` para lo que de verdad lo necesita.

### Convención de carpetas en `src/`

- `src/app/_components`, `src/app/_hooks`, `src/app/_lib` — **específicos de la home** (`src/app/page.tsx`). El guion bajo los excluye del routing.
- `src/components`, `src/lib` — **compartidos** entre múltiples páginas.

No es duplicidad, es co-locación deliberada. Antes de crear un componente compartido nuevo, verificá si ya existe en `src/components/` (Header, BottomNav, popups de pago/compra/acceso, MapaLeaflet, etc.).

### Estrategia de cache en `next.config.ts` (regla "última gana")

Next aplica **todas** las reglas de `headers()` que matchean, y para un mismo header key gana la **última**. Por eso el orden actual es:

1. Catch-all `(.*)` → `no-store` (default conservador).
2. `/_next/static/*` y `/_next/image/*` → `immutable` 1 año (pisan el catch-all).
3. Assets por extensión (png, jpg, woff…) → 1 día.

Si invertís el orden, los assets dejan de cachearse. Documentado en comentarios del archivo. Si agregás reglas nuevas, ponelas **después** del catch-all.

### Migraciones SQL

`sql/NNN_descripcion.sql` numerado secuencialmente. No hay tooling de migraciones — los scripts se aplican a mano contra Supabase. Al sumar un cambio de schema:
1. Crear el archivo con el siguiente número libre.
2. Incluir las RLS policies en el mismo archivo (la app depende de ellas).
3. Mencionarlo en el commit y, si aplica, en `docs/auditoria-final.md`.

### Cron y middleware

- `vercel.json` declara un único cron: `/api/cron/vencimientos` diario 09:00 UTC, marca anuncios y servicios vencidos.
- `src/middleware.ts` redirige 301 la URL de preview de Vercel (`nexonet-git-master-…vercel.app`) a `nexonet.ar` para evitar contenido duplicado.

### PWA

Manifest en `public/manifest.json`, service worker propio para Web Push (no de Next). Si tocás íconos, mantenerlos cuadrados con safe zone ~80 % (modo `maskable`).

## Workflow del proyecto

- Trabajo directo en `master` (proyecto solo, pre-lanzamiento). Push a `master` → Vercel deploya a `nexonet.ar`.
- La auditoría técnica viva está en [docs/auditoria-final.md](docs/auditoria-final.md). Items tienen IDs:
  - **B-XX** Bloqueantes (antes de lanzar)
  - **L-XX** Limpiezas seguras
  - **N-XX** Nice to have post-lanzamiento
  - **A-XX** Aclarar con el dueño del producto
- Convención de commits: `tipo: ID descripción` (ej. `feat: B-01 cache-control selectivo en next.config`). Mantenerla cuando el cambio corresponde a un item de la auditoría.
- [docs/CHANGELOG.md](docs/CHANGELOG.md) registra cambios relevantes; `docs/sesiones/` tiene notas históricas de sesiones de desarrollo.
- El idioma del proyecto es español: nombres de carpetas (`anuncios`, `publicar`, `nexo`), commits, comentarios, docs, UI. Mantener español al agregar código nuevo.

## Decisiones a tener presente

- **Grupos están en la tabla `nexos`**, no `grupos`. La cuenta de miembros se calcula en runtime, no se persiste.
- **No hay integración con WhatsApp** ni se planea agregarla.
- En toggles admin sobre la columna `activo`, la UI los muestra como **"visible/oculto"**, no "activo/inactivo".
- El **Botón de Arrepentimiento** (Ley 24.240, Defensa del Consumidor argentina) en `/legal/arrepentimiento` es obligatorio y notifica al admin vía Resend — no removerlo.
