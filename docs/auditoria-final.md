# Auditoría técnica y de producto — NexoNet Argentina

> **Versión:** 0.3 (en construcción)
> **Inicio:** 03-May-2026
> **Última actualización:** 03-May-2026
> **Estado:** Fase 1.1 y 1.2 cerradas. Tanda 1 de limpieza ejecutada. B-01 (Cache-Control) en curso. Pendientes: 1.3 (DB), 1.4 (env/servicios), Fase 2 (producto/UX), Fase 3 (lanzamiento).

---

## 0. Cómo leer este documento

- **Bloqueantes (B-XX):** hay que resolverlos antes del lanzamiento público.
- **Limpiezas (L-XX):** mejoras de orden sin riesgo, ejecutables en cualquier momento.
- **Nice to Have (N-XX):** mejoras post-lanzamiento.
- **Aclarar (A-XX):** dudas pendientes con el dueño del producto antes de decidir.

Cada item tiene: descripción, evidencia (de dónde salió), impacto, acción concreta, estado (`pendiente`, `en curso`, `hecho [commit X]`).

---

## 1. Resumen ejecutivo

NexoNet es una app Next.js 16 + React 19 + Supabase, deployada en Vercel sobre nexonet.ar. Tiene **44 páginas y 40 endpoints API** ya cableados, una sola PWA, base de email transaccional funcionando (Resend), legales completos (términos, privacidad, cookies, arrepentimiento, copyright) y un panel admin maduro.

**No hay convivencia de dos arquitecturas** (HTML vanilla vs Next.js): solo existe la app Next.js. Lo que parecía dos códigos en paralelo era confusión con commits viejos. La app sí tiene una **decisión arquitectónica importante** que está afectando rendimiento y SEO: está construida 100% como SPA client-side, sin Server Components consumiendo Supabase del lado server. Esto es viable para lanzamiento pero compromete indexación.

Para ir al lanzamiento hay **3 bloqueantes técnicos críticos** identificados hasta ahora, **6 limpiezas seguras** ejecutables en una tarde, y un puñado de Nice to Have agendados para post-lanzamiento.

---

## 2. Lo que ya está bien

- Stack moderno y coherente: Next 16.1.6, React 19.2.3, TypeScript estricto.
- `.env*` correctamente excluidos de Git (verificado con `git ls-files`).
- `vercel.json` minimalista, con cron diario de vencimientos correctamente declarado.
- PWA completa: manifest, service worker de push notifications, íconos.
- Una sola fuente de cliente Supabase (`src/lib/supabase.ts`) — no hay convivencia de clientes viejos y nuevos.
- Estructura de componentes con co-locación clara: `src/app/_components/`, `_lib/`, `_hooks/` para lo específico de la home; `src/components/`, `src/lib/` para lo compartido entre páginas. **No es duplicidad, es organización deliberada.**
- Legales completos y separados por tema (términos, privacidad, cookies, arrepentimiento, copyright).
- Cobertura funcional muy amplia: auth, anuncios, grupos (nexos), chat dual, panel admin con bots e importación, pagos con Mercado Pago (preferencias, suscripciones, OAuth, webhook), búsqueda con IA, mapa.
- Email transaccional Resend funcionando end-to-end con dominio verificado.
- Botón de Arrepentimiento (Ley 24.240) operativo.

---

## 3. Bloqueantes para lanzar (Must Have)

### B-01 — Header `Cache-Control: no-store` aplicado a TODA la app
- **Evidencia:** `next.config.ts`, función `headers()` con `source: "/(.*)"`.
- **Impacto:** rompe el cacheo del navegador y la CDN de Vercel para imágenes, CSS, JS, fuentes, páginas. Cada navegación re-descarga todo. Penaliza Lighthouse, Core Web Vitals y SEO. Aumenta costo de Vercel (bandwidth + function invocations). Mata datos móviles de los usuarios.
- **Acción:** reemplazar por una estrategia diferenciada: `no-store` solo en `/api/*` y rutas de sesión privada; `Cache-Control: public, max-age=31536000, immutable` para `/_next/static/*`; `Cache-Control: public, max-age=0, must-revalidate` para HTML de páginas (deja que Next maneje la revalidación). Antes de cambiar, verificar si había un problema real de "contenido viejo en home" que motivó el header — si lo había, resolverlo con `revalidate` por página, no con `no-store` global.
- **Estado:** pendiente.

### B-02 — App 100% client-side, sin SSR/SSG en páginas públicas
- **Evidencia:** los 47 archivos que importan `@/lib/supabase` lo hacen como Client Components. Home, categorías, fichas de anuncios — todo se renderiza en el browser después de bajar HTML vacío.
- **Impacto:** Google ve HTML vacío en el primer crawl. Anuncios y categorías no se indexan como contenido del sitio. Para una plataforma de clasificados que vive del SEO orgánico (competencia: MercadoLibre, OLX, Evisos), esto es serio. Bonus negativo: peor LCP, peor experiencia en conexiones lentas.
- **Acción:** convertir las páginas públicas críticas a Server Components con SSG/ISR. Mínimo necesario para lanzamiento: `/` (home), `/categoria/[rubro]`, `/anuncios/[id]`, `/grupos`, `/grupos/[id]`. Esto requiere introducir `@supabase/ssr` (que ya está instalado) para crear un cliente server-side, y agregar `middleware` que refresque la sesión en cada request.
- **Costo estimado:** 1-2 sesiones de trabajo focal. Es el item más grande del documento.
- **Estado:** pendiente.

### B-03 — README.md es boilerplate genérico de create-next-app
- **Evidencia:** `README.md` en la raíz, contenido pegado de la plantilla por defecto.
- **Impacto:** baja calidad percibida si el repo es público o si se incorpora otro dev. Sin información sobre stack, vars de entorno necesarias, cómo correr STAGING vs PROD, decisiones arquitectónicas relevantes.
- **Acción:** reescribir con lo mínimo: qué es NexoNet, comandos para correr local, variables que necesita, link a `auditoria-final.md` y `CHANGELOG.md`, decisiones de arquitectura clave.
- **Estado:** pendiente.

### B-04 — Íconos de PWA no cumplen el contrato del manifest
- **Evidencia:** `public/manifest.json` declara `icon-192.png` como 192×192 y `icon-512.png` como 512×512, ambos con `purpose: "maskable"`. Pero `public/icon-512.png` real mide 346×375 px (rectangular). Falta verificar `public/icon-192.png`.
- **Impacto:** al instalar la PWA en Android, iPhone o desktop, el ícono se ve recortado, deformado o pixelado. Mala primera impresión post-instalación. Lighthouse PWA audit lo va a marcar como fallo.
- **Acción:** generar dos íconos correctos: 192×192 px y 512×512 px, ambos cuadrados, con safe zone central de ~80% para que el modo `maskable` funcione bien (los SO recortan los bordes). Reemplazar los archivos en `public/`. Tener idealmente un tercero para `apple-touch-icon` (180×180 px) y declararlo en el `<head>`.
- **Estado:** pospuesto — el dueño del producto definirá identidad visual fuera del chat. Cuando haya logo/ícono definitivo, reemplazar archivos en `public/` y verificar que sean cuadrados con safe zone del 80%.

---

## 4. Limpiezas seguras (ejecutables hoy)

### L-01 — Desinstalar dependencias muertas
- **Evidencia:** `@supabase/auth-helpers-nextjs` y `@supabase/ssr` están en `package.json` pero el grep en `src/` no devuelve un solo import de ellas.
- **Acción:** `npm uninstall @supabase/auth-helpers-nextjs @supabase/ssr`.
- **Nota:** `@supabase/ssr` se va a re-instalar cuando abordemos B-02. Es OK desinstalarla ahora.
- **Estado:** hecho [commit 4590b0d].

### L-02 — Borrar `errores.txt` (0 bytes)
- **Acción:** `rm errores.txt`.
- **Estado:** hecho [commit 4590b0d].

### L-03 — Resolver `icon-512.png` en raíz del repo
- **Hallazgo (revisado):** los dos archivos NO eran duplicados. El de `public/icon-512.png` pesa 166 KB y mide 346×375 px. El de la raíz pesa 1.32 MB y mide 832×1256 px (vertical, probablemente un artwork original sin optimizar).
- **Acción:** decidir si el archivo de la raíz tiene valor histórico (mover a `docs/sesiones/diseño/` o similar) o se borra. No tiene referencias activas en el código.
- **Estado:** pendiente — depende de decisión del dueño del producto.

### L-04 — Mover archivos de notas sueltos a `docs/sesiones/`
- **Evidencia:** raíz contiene `BLOQUE1_PRECIOS.md`, `CONTEXT.md`, `DIAGNOSTICO.md`, `MEMORY.md`, `CONTEXTO_PROXIMO_CHAT.md` (este último ya gitignoreado).
- **Acción:** crear `docs/sesiones/` y mover ahí los .md de notas. Mantenerlos por trazabilidad de decisiones pasadas, no borrarlos.
- **Estado:** hecho [commit 4590b0d].

### L-05 — Mover scripts PowerShell a `scripts/`
- **Evidencia:** raíz contiene `copiar-nexonet.ps1` y `exportar-nexonet.ps1`.
- **Acción:** moverlos a `scripts/` (que ya existe).
- **Estado:** hecho [commit 4590b0d].

### L-06 — Agregar `*.tsbuildinfo` a `.gitignore` y borrar el actual
- **Evidencia:** `tsconfig.tsbuildinfo` en raíz, no debería estar en Git.
- **Acción:** verificar si está trackeado, si lo está hacer `git rm --cached`, agregar `*.tsbuildinfo` al `.gitignore`, borrar el archivo del disco.
- **Estado:** hecho [commit 4590b0d].

---

## 5. Nice to Have (post-lanzamiento)

### N-01 — Subir `target` de TypeScript de `ES2017` a `ES2022`
- Pequeño, mejora performance de transpilación y permite features modernas.

### N-02 — Agregar script `typecheck` a `package.json`
- `"typecheck": "tsc --noEmit"` para correr antes de cada deploy.

### N-03 — Resolver `_components` vs `components` documentado
- No hace falta unificar, pero conviene agregar un `README.md` corto en `src/` explicando la convención (con guion bajo = específico de página, sin guion bajo = compartido).

### N-04 — Reemplazar `@supabase/auth-helpers-nextjs` definitivamente
- Ya borrado en L-01, queda como recordatorio: nunca volver a instalarla, está deprecada.

### N-05 — Validación de formularios con `zod` y `react-hook-form`
- Hoy probablemente se valida a mano. Para registro, publicar anuncio, crear grupo, etc., es deuda técnica.

---

## 6. Aclarar con el dueño del producto

### A-01 — `.env.production.local` en disco local
- **Hallazgo:** existe el archivo pero el dueño no recuerda haberlo creado. Probable origen: `vercel link` o `vercel pull` en alguna sesión anterior.
- **Riesgo:** correr `npm run dev` apuntando a PROD sin querer.
- **Pendiente:** decidir si se borra. No bloqueante.

### A-02 — Duplicidad de namespaces en API: `/api/mp/*` vs `/api/mercadopago/*`
- **Hallazgo:** dos namespaces en endpoints de Mercado Pago. Hipótesis: uno es OAuth de conexión de cuenta (vendedor), otro son cobros. A confirmar abriendo los archivos en Fase 1.2 cuando lleguemos a APIs.
- **Pendiente:** resolver en Fase 1.2 (continuación) o Fase 2.

### A-03 — Coexistencia de `grupos/*` y `nexo/*` como rutas
- **Hallazgo:** existen `src/app/grupos/...` y `src/app/nexo/...` con páginas similares (admin, crear, listado).
- **Pendiente:** abrir ambas y decidir si una es legacy o si tienen propósitos distintos.

### A-04 — Identificar dónde se usa `SUPABASE_SERVICE_ROLE_KEY`
- **Hallazgo:** la variable está definida pero el grep de `@/lib/supabase` no la cubre. Algún endpoint en `/api/*` la lee directo. La `service_role` salta RLS.
- **Pendiente:** rastrear todos los `process.env.SUPABASE_SERVICE_ROLE_KEY` en el código y verificar que solo se use en endpoints estrictamente necesarios y autenticados.
- **Recordatorio cruzado:** sigue pendiente rotar la clave de STAGING (quedó expuesta en chat anterior).

### A-05 — Regla `.gitignore` para `CONTEXTO_PROXIMO_CHAT.md` matchea cualquier ubicación
- **Hallazgo:** la línea `CONTEXTO_PROXIMO_CHAT.md` en `.gitignore` (sin barra inicial) matchea el archivo en cualquier carpeta. Tras moverlo a `docs/sesiones/`, sigue invisible para Git allí también.
- **Decisión a tomar:** ¿lo dejamos así (siempre ignorado) o cambiamos la regla a `/CONTEXTO_PROXIMO_CHAT.md` para que solo se ignore si está en raíz?
- **Recomendación:** dejarlo como está. Es contexto efímero entre sesiones de Claude, no tiene valor versionable.
- **Estado:** pendiente — decisión menor.

---

## 7. Pendientes heredados (de sesiones previas)

Sin verificar todavía en esta auditoría — confirmar estado en su momento:

1. Quitar `http://localhost:3000/**` de Redirect URLs en PROD (Supabase).
2. Replicar plantilla bonita de email PROD a STAGING.
3. Configurar Cloudflare Email Routing para `nexonet.ar` (recibir replies).
4. Limpieza técnica de `/api/registro/completar/route.ts` (dead code y DELETE riesgoso).
5. Rotar `SUPABASE_SERVICE_ROLE_KEY` de STAGING.
6. Limpiar usuarios de prueba en PROD antes de lanzar.

---

## 8. Fase 1.3 — Base de datos (PENDIENTE)

// Por completar: tablas, RLS por tabla, triggers, functions, índices, policies de Storage.

---

## 9. Fase 1.4 — Variables de entorno y servicios (PENDIENTE)

// Por completar: vars en Vercel (PROD y Preview), Supabase (Auth providers, Storage, Email templates, Site URL, Redirect URLs), Resend (dominios verificados, API keys), Mercado Pago (credenciales por entorno).

---

## 10. Fase 2 — Auditoría de producto / UX (PENDIENTE)

// Por completar: recorrida funcional con screenshots de cada flujo (registro, login, publicar anuncio, buscar, ficha, contactar, crear grupo, unirse a grupo, chat, admin).

---

## 11. Fase 3 — Checklist de lanzamiento (PENDIENTE)

// Por completar: T&C revisados por abogado, datos del responsable visibles, performance/SEO/analytics, plan beta cerrada, plan lanzamiento abierto, marketing inicial.

---

## 12. Calendario sugerido (borrador)

Calendario tentativo, se ajusta a medida que avanzamos:

- **Semana 1 (esta):** cerrar Fase 1 completa (1.2 + 1.3 + 1.4) + ejecutar limpiezas L-01 a L-06.
- **Semana 2:** abordar B-01 (cache) y B-03 (README). Empezar Fase 2 (producto/UX) con screenshots.
- **Semana 3-4:** abordar B-02 (SEO/SSR) — el item más grande. Migrar páginas públicas a Server Components.
- **Semana 5:** Fase 3 (lanzamiento) — checklist completo.
- **Semana 6:** beta cerrada con 5-10 personas de confianza.
- **Semana 7:** lanzamiento público.

---

## Bitácora de cambios

- **03-May-2026:** Documento creado. Fase 1.1 y 1.2 cerradas.
- **03-May-2026:** Tanda 1 de limpieza ejecutada (commit 4590b0d). L-01, L-02, L-04, L-05, L-06 hechos. L-03 redefinido. Nuevo bloqueante B-04. Nuevo aclarar A-05.
- **03-May-2026:** B-04 pospuesto por decisión del dueño (definición de marca pendiente). Iniciando B-01 (Cache-Control).
