# NexoNet Argentina

Plataforma argentina de anuncios y comunidades. Combina clasificados (productos, servicios, trabajo) y catálogos de empresas con grupos sociales (deportivos, vecinales, culturales, de estudio). Modelo freemium: 3 anuncios gratis por usuario, paquetes pagos, destacados, y conexiones pagas entre oferta y demanda.

🌐 **Producción:** [nexonet.ar](https://nexonet.ar)
📋 **Estado:** pre-lanzamiento — auditoría técnica en curso. Ver [docs/auditoria-final.md](docs/auditoria-final.md).

---

## Stack

- **Framework:** [Next.js 16](https://nextjs.org) (App Router) + React 19 + TypeScript
- **Base de datos y auth:** [Supabase](https://supabase.com) (Postgres + RLS)
- **Hosting:** [Vercel](https://vercel.com) (deploy automático desde `master`)
- **Email transaccional:** [Resend](https://resend.com)
- **Pagos:** Mercado Pago (Argentina)
- **Mapas:** Leaflet + React-Leaflet
- **Push notifications:** Web Push API

---

## Cómo correr local

Requisitos: Node 20+, npm.

```bash
git clone https://github.com/NexoNet-2026/nexonet.git
cd nexonet
npm install
npm run dev
```

La app queda disponible en `http://localhost:3000`.

### Variables de entorno

Crear un archivo `.env.local` en la raíz con:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

Las dos primeras son públicas (van al cliente). La tercera es secreta y solo se usa en endpoints API del lado servidor.

### Build de producción

```bash
npm run build
npm start
```

---

## Estructura del repo

```
nexonet/
├── docs/                  # Documentación interna (auditoría, changelog, sesiones)
├── public/                # Assets estáticos (íconos, manifest, service worker)
├── scripts/               # Scripts de utilidad (PowerShell, SQL, helpers)
├── sql/                   # Migraciones SQL y scripts de DB
├── src/
│   ├── app/               # App Router de Next
│   │   ├── _components/   # Componentes ESPECÍFICOS de la home
│   │   ├── _hooks/        # Hooks específicos de la home
│   │   ├── _lib/          # Utilidades específicas de la home
│   │   ├── api/           # Route handlers (endpoints)
│   │   └── [otras]/       # Páginas
│   ├── components/        # Componentes COMPARTIDOS entre páginas
│   ├── lib/               # Utilidades compartidas (cliente Supabase, helpers)
│   └── middleware.ts      # Redirect de URL de Vercel a nexonet.ar
├── next.config.ts         # Config de Next + estrategia de cache
├── vercel.json            # Cron jobs (vencimientos diarios)
└── package.json
```

**Convención de nombres:** las carpetas con guion bajo (`_components`, `_hooks`, `_lib`) son específicas de la home. Las carpetas sin guion bajo (`components`, `lib`) son compartidas entre múltiples páginas. No es duplicidad, es co-locación.

---

## Decisiones arquitectónicas no obvias

Cosas que no son evidentes leyendo solo el código:

### Cliente Supabase único en el browser
Todo el repo importa un único cliente Supabase desde `src/lib/supabase.ts`, creado con `createClient` de `@supabase/supabase-js`. La app es predominantemente client-side: los datos viven en Supabase y se piden desde el navegador del usuario. La seguridad se apoya 100% en las RLS policies de Postgres.

### Regla "última gana" en `headers()` de Next
En `next.config.ts`, las reglas de `Cache-Control` se aplican TODAS las que matchean, y para un mismo header key gana la **última**. Por eso el catch-all `(.*) → no-store` va al PRINCIPIO del array de retorno, y las reglas específicas de cache (chunks de Next, assets) van DESPUÉS para que pisen el catch-all. Si invertís el orden, los assets dejan de cachearse. Está documentado en comentarios dentro del archivo.

### Cron de vencimientos
Se ejecuta todos los días a las 9:00 (hora UTC) declarado en `vercel.json`, llamando a `/api/cron/vencimientos`. Marca anuncios y servicios vencidos.

### Botón de Arrepentimiento (Ley 24.240)
La Ley argentina de Defensa del Consumidor exige un botón de arrepentimiento accesible desde la home. Está implementado en `/legal/arrepentimiento` con notificación al admin vía Resend.

---

## Documentación

- [docs/auditoria-final.md](docs/auditoria-final.md) — Auditoría técnica y de producto pre-lanzamiento (en construcción).
- [docs/CHANGELOG.md](docs/CHANGELOG.md) — Historial de cambios relevantes.
- [docs/sesiones/](docs/sesiones/) — Notas de sesiones de desarrollo (contexto histórico).

---

## Workflow de desarrollo

1. Trabajar en `master` directo (proyecto solo, pre-lanzamiento). En el futuro: feature branches.
2. Commits descriptivos referenciando IDs de auditoría (`B-01`, `L-04`, etc.) cuando aplique.
3. `git push origin master` → Vercel deploya automáticamente a `nexonet.ar`.
4. Validar headers/comportamiento en producción después de cada deploy con cambios funcionales.

---

## Licencia

© 2025-2026 Adrián Morra. Todos los derechos reservados.

Este repositorio es público para fines de transparencia y trazabilidad, pero el código no está bajo licencia de uso libre. Cualquier reutilización requiere autorización expresa.
