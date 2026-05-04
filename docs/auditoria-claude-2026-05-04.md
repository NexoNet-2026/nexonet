# Auditoría general — NexoNet (2026-05-04)

> **Autor:** auditoría asistida por Claude (read-only).
> **Alcance:** complementaria a [auditoria-final.md](auditoria-final.md). Continúa la numeración de IDs (B-01..B-04 y L-01..L-06 ya usados).
> **Foco:** hallazgos que afectan producción real pre-lanzamiento. No es checklist exhaustivo.
> **Convenciones de IDs:** `B-XX` bloqueante para lanzar, `L-XX` limpieza segura, `N-XX` nice to have, `A-XX` aclarar con producto.

---

## 1. Resumen ejecutivo

Top 10, ordenado por urgencia operativa:

1. **CRÍTICO — `/api/admin/*` sin verificar admin (B-05).** ~12 de 14 endpoints en [src/app/api/admin/](../src/app/api/admin/) usan `SUPABASE_SERVICE_ROLE_KEY` sin chequear `es_admin_sistema`. Sólo [reintentar-fallo](../src/app/api/admin/reintentar-fallo/route.ts) y [simular-compra](../src/app/api/admin/simular-compra/route.ts) validan. Cualquiera con la URL puede eliminar usuarios/anuncios, crear bots o asignar BIT.
2. **CRÍTICO — Webhook Mercado Pago: firma evadible (B-06).** [src/app/api/mp/webhook/route.ts:26-51](../src/app/api/mp/webhook/route.ts) sólo valida si `MP_WEBHOOK_SECRET` está seteado **y** llegan los 3 headers. Omitir cualquiera salta el check. Riesgo: acreditar BIT con `external_reference` falsificado.
3. **CRÍTICO — `/api/push/enviar` confía en `usuario_id` del body (B-07).** [src/app/api/push/enviar/route.ts:12-15](../src/app/api/push/enviar/route.ts) permite spam push a cualquier usuario sin verificar la sesión del caller.
4. **CRÍTICO — SSRF en `/api/admin/scrape-url` (B-08).** [src/app/api/admin/scrape-url/route.ts:37-49](../src/app/api/admin/scrape-url/route.ts) hace `fetch(url)` con cualquier protocolo y host. Combinado con B-05, es accesible sin auth.
5. **ALTO — Endpoints públicos con service-role (L-13).** `chat/enviar-mensaje`, `anuncios/conectar`, `soporte/enviar`, `publico/contadores`: rompen least-privilege y validación de inputs ausente.
6. **ALTO — Headers de seguridad ausentes (B-09).** Faltan HSTS, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, CSP en [next.config.ts:30-48](../next.config.ts).
7. **MEDIO — Archivos > 1000 líneas (N-01).** `admin/page.tsx` (~3.355), `nexo/[id]/page.tsx` (~1.439), tres más por encima de 1.200. Mantenibilidad post-lanzamiento.
8. **MEDIO — `leaflet` + `react-leaflet` en bundle global (L-21).** Sólo se usan en `/mapa`, pero están en `transpilePackages`.
9. **MEDIO — Manejo de errores fragmentado (L-11).** `alert()` (~194), state `toast` (~122) y state `error` (~222) conviven sin patrón unificado.
10. **BAJO — Restos de la migración grupos→nexos.** [PopupAccesoGrupo.tsx](../src/components/PopupAccesoGrupo.tsx) huérfano (L-07); [src/app/grupos/](../src/app/grupos/) sólo redirige (L-08); admin sigue consultando tabla legacy `grupos` (L-10).

**Cuatro must-fix antes de abrir al público:** B-05, B-06, B-07, B-08. Son explotables hoy mismo. Tiempo estimado conjunto: 2-4 h.

---

## 2. Código muerto y archivos huérfanos

### L-07 — `PopupAccesoGrupo` no se usa
- **Evidencia:** `grep PopupAccesoGrupo src/` devuelve sólo el `export default` del propio archivo, sin importadores.
- **Ubicación:** [src/components/PopupAccesoGrupo.tsx](../src/components/PopupAccesoGrupo.tsx) (~194 líneas).
- **Impacto:** carga cognitiva al leer `src/components/`; el componente sigue lógica de la tabla legacy `grupos`.
- **Severidad:** BAJO.
- **Acción:** eliminar el archivo.
- **Estado:** pendiente.

### L-08 — Carpeta `src/app/grupos/` con páginas-redirect
- **Evidencia:** [src/app/grupos/page.tsx](../src/app/grupos/page.tsx) hace `router.replace("/buscar?tipo=grupos")`; `[id]/page.tsx` redirige a `/nexo/{id}`; `crear/page.tsx` y `admin/page.tsx` también.
- **Impacto:** rutas vivas que sólo agregan overhead de hidratación + redirect.
- **Severidad:** BAJO.
- **Acción:** eliminar la carpeta tras confirmar que no hay enlaces externos a `/grupos*`. Si se quiere preservar SEO de URLs viejas, mover los redirects a `middleware.ts`.
- **Estado:** pendiente.

### L-09 — Migraciones SQL con número duplicado
- **Evidencia:** `sql/010_rls_rubros_entidades.sql` y `sql/010_rls_rubros_publico.sql` comparten el mismo prefijo `010`.
- **Impacto:** ambigüedad al aplicar migraciones a mano; el orden de aplicación queda indeterminado.
- **Severidad:** BAJO.
- **Acción:** renombrar uno a `031_rls_rubros_publico.sql` (siguiente número libre) y dejar nota en [docs/CHANGELOG.md](CHANGELOG.md).
- **Estado:** pendiente.

### L-10 — Tabla legacy `grupos` consultada desde admin
- **Evidencia:** `grep "from(\"grupos\")" src/app/admin/` da varias ocurrencias en [src/app/admin/page.tsx](../src/app/admin/page.tsx) (alrededor de la línea 74).
- **Impacto:** datos viejos visibles en panel admin; refuerza la confusión grupos vs nexos.
- **Severidad:** MEDIO.
- **Acción:** confirmar con producto si admin debe seguir mostrando la tabla `grupos` (legacy de migración) o se remueve. Ver A-01.
- **Estado:** pendiente.

### A-01 — Consumidor de `/api/push/enviar` sin identificar
- **Evidencia:** `grep "/api/push/enviar" src/` no devuelve llamadas desde UI; sólo `/api/push/suscribir` se invoca desde Header.
- **Impacto:** si nadie lo invoca, es código vivo + superficie de ataque innecesaria (ver B-07). Si lo invoca un cron o admin externo, hay que blindarlo.
- **Acción:** confirmar con dueño del producto si está cableado a algún flujo (admin de notificaciones, cron). Si no, eliminar o autenticar.

---

## 3. Inconsistencias

### L-11 — Tres patrones de feedback de error
- **Evidencia:** ~194 `alert()`, ~122 toasts custom (`useState` con `setToast`), ~222 `useState` con `error` mostrado o no en el JSX.
- **Ubicaciones de muestra:** [src/app/admin/page.tsx](../src/app/admin/page.tsx) (alert + setError), [src/components/PopupCompra.tsx](../src/components/PopupCompra.tsx) (toast), [src/app/chat/](../src/app/chat/) (toast).
- **Impacto:** UX inconsistente, difícil de testear y de mantener (cada flujo decide).
- **Severidad:** MEDIO.
- **Acción:** agregar `src/lib/useToast.ts` (hook simple sobre estado global) y reemplazar `alert()` progresivamente. No es bloqueante para lanzar.
- **Estado:** pendiente.

### L-12 — Mezcla de `getSession()` y `getUser()` en cliente
- **Evidencia:** ambos patrones aparecen en `src/app/admin/*` y `src/app/usuario/*`.
- **Impacto:** semántica distinta (`getUser()` valida con el server, `getSession()` lee del storage local). Confunde a quien lee el código.
- **Severidad:** BAJO.
- **Acción:** definir patrón canónico (en SPA pura, `getSession()` es lo idiomático) y dejarlo en [CLAUDE.md](../CLAUDE.md). Ver A-02.

### A-02 — Patrón canónico de auth
- **Acción:** decidir y documentar: ¿`getSession()` siempre? ¿`getUser()` cuando se mutan datos críticos? Dejarlo escrito antes de tocar 80 archivos.

### L-12bis — Restos de tablas `grupo_*` en SQL
- **Evidencia:** existen `grupo_categorias`, `grupo_subcategorias`, `grupo_miembros`, `grupo_invitaciones` en `sql/`. La migración `sql/005_migrar_grupos_a_nexos.sql` movió datos pero no DROP-eó las tablas.
- **Impacto:** doble fuente de verdad; las RLS policies de las legacy hay que mantenerlas igual.
- **Severidad:** BAJO.
- **Acción:** crear `sql/031_drop_grupos_legacy.sql` cuando se confirme (con grep) que ningún `from("grupo_...")` queda en código.

---

## 4. Riesgos de seguridad

### B-05 — `/api/admin/*` sin verificar `es_admin_sistema` `[CRÍTICO]`
- **Evidencia:** lectura directa de los handlers. Endpoints sin check: `eliminar-usuario`, `eliminar-anuncio`, `crear-bot`, `crear-bot/ia`, `bot-mensajes`, `config-contadores`, `liquidaciones`, `asignar-bit`, `pexels-buscar`, `rg-buscar`, `rg-scrape-lote`, `scrape-url`. Validan correctamente: [reintentar-fallo](../src/app/api/admin/reintentar-fallo/route.ts), [simular-compra](../src/app/api/admin/simular-compra/route.ts).
- **Impacto:** explotable inmediatamente. Cualquiera con la URL puede:
  - Eliminar usuarios/anuncios/bots por completo (incluyendo `auth.users` via service-role).
  - Crear bots con BIT ilimitado.
  - Modificar contadores globales y liquidaciones.
- **Acción:** crear helper único `requireAdmin(req)` (en `src/lib/auth-server.ts` o similar) que:
  1. lea `Authorization: Bearer <token>` del header,
  2. valide con `supabase.auth.getUser(token)`,
  3. consulte `usuarios.es_admin_sistema = true`,
  4. devuelva 401/403 si falla.
  Aplicarlo en todos los handlers afectados antes del `createClient` con service-role. Patrón ya está en `simular-compra:54` y `reintentar-fallo:96`.
- **Severidad:** CRÍTICO.
- **Estado:** pendiente.

### B-06 — Webhook MP: firma evadible `[CRÍTICO]`
- **Evidencia:** [src/app/api/mp/webhook/route.ts:26-51](../src/app/api/mp/webhook/route.ts). El `if (secret)` envuelve la validación; dentro, `if (xSignature && xRequestId && dataId)` sólo verifica si los 3 headers existen. Si un atacante omite cualquier header, salta el check y el body pasa al procesamiento.
- **Impacto:** acreditación fraudulenta de BIT. Mitigado parcialmente por idempotencia con `pagos_mp` (línea 174-182): un `payment_id` ya acreditado no se re-acredita; pero un atacante puede inventar `payment_id` que la API de MP devuelve `404` y romper el flujo.
- **Acción:**
  1. exigir que `MP_WEBHOOK_SECRET` exista en startup (fail-fast).
  2. Rechazar 401 si faltan los headers, no saltar el check.
  3. Confiar **sólo** en lo que devuelva `https://api.mercadopago.com/v1/payments/{id}` con `ACCESS_TOKEN` para `external_reference` y `transaction_amount`.
- **Severidad:** CRÍTICO.
- **Estado:** pendiente.

### B-07 — `/api/push/enviar` acepta `usuario_id` del body sin auth `[CRÍTICO]`
- **Evidencia:** [src/app/api/push/enviar/route.ts:12-15](../src/app/api/push/enviar/route.ts).
- **Impacto:** spam push masivo a cualquier usuario suscripto. Daña la confianza en la marca y puede llevar a desinstalación de la PWA.
- **Acción:** dos caminos:
  - Si lo invoca un caller autenticado (admin/usuario con permiso): leer la sesión del request, no del body.
  - Si lo invoca un cron interno: proteger con `INTERNAL_API_SECRET` en header (mismo patrón que `CRON_SECRET`).
  - Si nadie lo invoca (ver A-01): eliminar el endpoint.
- **Severidad:** CRÍTICO.
- **Estado:** pendiente.

### B-08 — SSRF en `/api/admin/scrape-url` `[CRÍTICO]`
- **Evidencia:** [src/app/api/admin/scrape-url/route.ts:37-49](../src/app/api/admin/scrape-url/route.ts). `fetch(url)` sin restringir protocolo/host. Vectores: `file:///etc/passwd`, `http://localhost:5432`, `http://169.254.169.254/latest/meta-data/` (en cloud), `http://10.0.0.1/`.
- **Impacto:** filtrado de credenciales del entorno cloud, mapeo de red interna, lectura de archivos locales del runtime.
- **Acción:**
  1. Aplicar B-05 (admin-check) primero.
  2. Validar `new URL(url).protocol === "https:"`.
  3. Resolver el host y rechazar IPs RFC1918 (`10.*`, `192.168.*`, `172.16-31.*`), loopback (`127.*`), link-local (`169.254.*`), IPv6 reservadas.
  4. Whitelist opcional de dominios conocidos (rosariogarage, mlstatic, etc. — los mismos que `next.config.ts`).
- **Severidad:** CRÍTICO.
- **Estado:** pendiente.

### B-09 — Headers de seguridad ausentes `[ALTO]`
- **Evidencia:** [next.config.ts:30-48](../next.config.ts) sólo configura `Cache-Control`.
- **Impacto:** sin HSTS la primera visita puede downgradear a HTTP; sin `X-Content-Type-Options: nosniff` el navegador puede intentar ejecutar respuestas mal tipadas; sin `Referrer-Policy` se filtran URLs internas a terceros (analytics, embeds); sin CSP las inyecciones XSS escalan.
- **Acción:** agregar al catch-all `(.*)` headers:
  - `Strict-Transport-Security: max-age=31536000; includeSubDomains`
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: geolocation=(self), camera=(), microphone=()` (geo se usa para el mapa)
  - `X-Frame-Options: SAMEORIGIN`
  - CSP: arrancar con `Content-Security-Policy-Report-Only` 1-2 semanas, ajustar y migrar a enforce.
  La regla "última gana" de `next.config.ts` no afecta a estos keys porque no chocan con `Cache-Control`.
- **Severidad:** ALTO.
- **Estado:** pendiente.

### L-13 — Endpoints públicos usan service-role `[ALTO]`
- **Evidencia:** `/api/publico/contadores`, `/api/chat/enviar-mensaje`, `/api/anuncios/conectar`, `/api/soporte/enviar` crean cliente con `SUPABASE_SERVICE_ROLE_KEY`.
- **Impacto:** least-privilege roto. Si una RLS policy se rompe, el endpoint sigue pudiendo escribir/leer todo. Combinado con falta de validación de inputs (L-14), amplifica daño.
- **Acción:** migrar a cliente anon + RLS donde sea suficiente. Reservar service-role sólo para ops admin verificadas (B-05).
- **Severidad:** ALTO.
- **Estado:** pendiente.

### L-14 — Validación de inputs ausente en API routes `[MEDIO]`
- **Evidencia:** `chat/enviar-mensaje:11`, `anuncios/conectar:12`, `soporte/enviar:10` hacen destructuring directo del body. `parseInt(anuncio_id)` sin chequear `Number.isInteger` ni rangos. `mensaje` y `texto` sin tope de longitud → DoS por payload de 1MB y filas gigantes en DB.
- **Acción:** sumar `zod` (~10 KB) o guards manuales con tipos canónicos: `usuario_id` UUID, `mensaje` ≤ 5000 chars, IDs `int positivo`. Patrón idiomático Next es validar al inicio del handler y devolver 400 con mensaje descriptivo.
- **Severidad:** MEDIO.
- **Estado:** pendiente.

### L-15 — Cron `/api/cron/vencimientos` con auth simple `[BAJO]`
- **Evidencia:** [src/app/api/cron/vencimientos/route.ts:11-14](../src/app/api/cron/vencimientos/route.ts) valida `Authorization: Bearer ${CRON_SECRET}`.
- **Impacto:** correcto, pero si el secret se filtra, no hay segunda barrera.
- **Acción:** sumar verificación de header `x-vercel-cron` (lo agrega Vercel cuando dispara desde su scheduler) en defensa-en-profundidad.
- **Severidad:** BAJO.
- **Estado:** pendiente.

### L-16 — RLS de tablas legacy `grupo_*`
- **Evidencia:** las tablas existen, los archivos `sql/0XX_grupo*.sql` no fueron auditados a fondo.
- **Acción:** confirmar `ENABLE ROW LEVEL SECURITY` en cada `grupo_*`. Si la tabla está vacía y nadie consulta, eliminarla via L-12bis.
- **Severidad:** BAJO.

---

## 5. Deuda técnica evidente

### L-17 — `console.log` de debug en componentes UI
- **Ubicaciones (≈13 ocurrencias):** [src/app/admin/page.tsx](../src/app/admin/page.tsx), [src/app/buscar/page.tsx](../src/app/buscar/page.tsx), [src/app/mis-anuncios/page.tsx](../src/app/mis-anuncios/page.tsx), [src/app/nexo/[id]/page.tsx](../src/app/nexo/[id]/page.tsx), [src/app/nexo/[id]/admin/page.tsx](../src/app/nexo/[id]/admin/page.tsx), [src/app/nexo/crear/[tipo]/page.tsx](../src/app/nexo/crear/[tipo]/page.tsx), [src/app/publicar/page.tsx](../src/app/publicar/page.tsx).
- **Distinguir:** los `console.error` con tracking estructurado (p. ej. en `src/lib/log-fallos.ts` y `email.ts`) son intencionales — dejarlos. Lo que hay que limpiar son los `console.log("ANUNCIOS:", ...)`, `"PAGO_ADMIN CHECK"`, `"descontarBitReceptor LLAMANDO"`, etc.
- **Impacto:** ruido en consola del usuario y filtrado leve de detalle interno.
- **Severidad:** MEDIO.
- **Acción:** pasada de grep + remoción manual antes del lanzamiento.
- **Estado:** pendiente.

### L-18 — `: any` / `as any` en 73 archivos
- **Top 5 contaminados:** [src/app/nexo/[id]/page.tsx](../src/app/nexo/[id]/page.tsx), [src/app/admin/page.tsx](../src/app/admin/page.tsx), [src/app/nexo/[id]/admin/page.tsx](../src/app/nexo/[id]/admin/page.tsx), [src/app/nexo/crear/[tipo]/page.tsx](../src/app/nexo/crear/[tipo]/page.tsx), [src/components/MapaLeaflet.tsx](../src/components/MapaLeaflet.tsx).
- **Impacto:** type-safety desactivado en lógica core (nexos, anuncios, usuarios).
- **Severidad:** MEDIO.
- **Acción:** definir interfaces `Nexo`, `Anuncio`, `Usuario`, `NexoMiembro` en `src/lib/types.ts` (o usar generated types de Supabase con `supabase gen types typescript`). Reemplazar progresivamente; no bloquea lanzamiento.
- **Estado:** pendiente.

### L-19 — `@ts-ignore` puntual
- **Evidencia:** [src/app/nexo/[id]/stats/page.tsx:54](../src/app/nexo/[id]/stats/page.tsx).
- **Severidad:** BAJO.
- **Acción:** se cierra solo cuando se atiende L-18.

### N-01 — Archivos > 1.000 líneas
- **Evidencia:**
  - `src/app/admin/page.tsx` ≈ 3.355 líneas
  - `src/app/nexo/[id]/page.tsx` ≈ 1.439
  - `src/app/nexo/[id]/admin/page.tsx` ≈ 1.291
  - `src/app/usuario/page.tsx` ≈ 1.281
  - `src/app/buscar/page.tsx` ≈ 1.189
- **Impacto:** lectura, code review y onboarding cuesta caro. No bloquea lanzar pero sí evolucionar.
- **Severidad:** MEDIO (post-lanzamiento).
- **Acción:** split por tabs/secciones en sub-componentes. `admin/page.tsx` es el caso más urgente: separar Dashboard, Usuarios, Anuncios, Nexos, Liquidaciones en componentes hijos.
- **Estado:** pendiente.

### L-20 — TODO accionable: migrar a `slider_tipos`
- **Evidencia:** [src/app/nexo/crear/[tipo]/page.tsx:11](../src/app/nexo/crear/[tipo]/page.tsx) — `TODO: migrar grupo/servicio/trabajo a slider_tipos. Hoy solo empresa lee de la tabla`.
- **Severidad:** BAJO (deuda intencional, en curso como Bloque 2).
- **Acción:** continuar Bloque 2 según plan.

---

## 6. Dependencias

### L-21 — `leaflet` + `react-leaflet` en bundle global
- **Evidencia:** [next.config.ts:7](../next.config.ts) los tiene en `transpilePackages`. El consumidor único es [src/components/MapaLeaflet.tsx](../src/components/MapaLeaflet.tsx), usado sólo en `/mapa`.
- **Impacto:** ≈200 KB gzip extra en cada navegación, incluso para usuarios que nunca abren el mapa.
- **Severidad:** MEDIO.
- **Acción:** importar el componente en `/mapa/page.tsx` con `dynamic(() => import("@/components/MapaLeaflet"), { ssr: false })`. Mantener `transpilePackages` mientras el `dynamic` lo siga necesitando para el bundle del mapa.
- **Estado:** pendiente.

**Otras dependencias:** sin muertes nuevas; L-01 ya removió las dos legacy. Versiones major al día (Next 16, React 19, TS 5, Tailwind 4, ESLint 9). Recomendado correr `npm audit` antes de lanzar para ver advisories nuevos.

---

## 7. Performance

| Hallazgo | Ubicación | Severidad | Comentario |
|---|---|---|---|
| Bundle global con leaflet (= L-21) | — | MEDIO | Ver L-21 |
| `<img>` directo en avatares de nexos | [src/app/page.tsx](../src/app/page.tsx) (línea ≈ 102), [src/app/anuncios/[id]/page.tsx](../src/app/anuncios/[id]/page.tsx) | BAJO (N-02) | Pasar a `<Image>` cuando se haga corrida de Lighthouse. Son avatares chicos, no urge. |
| Listas con `.limit(300/500)` sin paginación | [src/app/categoria/[rubro]/page.tsx](../src/app/categoria/[rubro]/page.tsx), [src/app/buscar/page.tsx](../src/app/buscar/page.tsx) | BAJO (N-03) | Sólo molesta si la base supera 300 anuncios. Implementar infinite scroll o `.range()` cuando llegue ese punto. |

**No detectado:** queries N+1 (los `in()` están bien usados), `useEffect` con dependencias-objeto problemáticas, caching agresivo del service worker (sólo maneja push, no caché de fetches).

---

## 8. Lista priorizada para pre-lanzamiento

**Must-fix (4 ítems, ≈ 2-4 h en total):**
1. B-05 — admin-check en todos los `/api/admin/*`.
2. B-06 — firma MP obligatoria.
3. B-07 — auth en `/api/push/enviar`.
4. B-08 — anti-SSRF en `scrape-url`.

**Should-fix antes de abrir tráfico (≈ 1 día):**
5. B-09 — headers de seguridad.
6. L-13 — service-role fuera de endpoints públicos.
7. L-14 — validación de inputs.

**Limpiezas de bajo riesgo (cuando haya tiempo):**
- L-07 a L-21 según prioridad. L-09 (renombrar SQL duplicado) es trivial.

**Post-lanzamiento:**
- N-01 (split de archivos grandes), N-02 (`<Image>`), N-03 (paginación).
- L-11 (centralizar errores en `useToast`), L-18 (matar `any`).

**A coordinar con producto:**
- A-01 — destino real de `/api/push/enviar`.
- A-02 — patrón canónico de auth (`getSession` vs `getUser`).
