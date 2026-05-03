# BLOQUE 1 — PRECIOS (10.000 BIT mensual de empresa)

Fecha: 2026-04-21
Scope: búsqueda read-only, sin modificaciones.

---

## 1. `10000` / `10.000` en carpeta `sql/`

```
sql/003_empresa_trial_pagos.sql:7   ALTER TABLE nexos ADD COLUMN IF NOT EXISTS plan_mensual_bits INTEGER DEFAULT 10000;
sql/003_empresa_trial_pagos.sql:13  bits_pagados INTEGER DEFAULT 10000,
sql/020_config_global.sql:29        ('bits_empresa_mensual', '10000', 'BIT mensuales para mantener una empresa activa')
```

**Lectura:** hay dos fuentes de verdad en la base:
- `nexos.plan_mensual_bits` con default `10000` (por fila, por nexo-empresa) y `empresa_pagos.bits_pagados` default `10000`.
- `config_global.clave = 'bits_empresa_mensual'` valor `'10000'` (configurable en runtime, pero nadie lo está leyendo — ver punto 2).

No aparece `10.000` (con punto) en ningún SQL: solo se usa el formato entero.

---

## 2. `10000` hardcodeado en `src/` (`.ts`, `.tsx`, `.js`, `.jsx`)

Agrupado por lo que es **precio/costo de empresa** vs ruido (timeouts, insignias, bits_free iniciales).

### 2.a. Precio/costo mensual de empresa (lo que te interesa)

| Archivo : línea | Contexto |
|---|---|
| `src/app/api/empresa/renovar/route.ts:9` | `const COSTO_MENSUAL = 10000;` — renovación de empresa. |
| `src/app/api/servicio/renovar/route.ts:9` | `const COSTO_MENSUAL = 10000;` — renovación de servicio (mismo precio, misma constante hardcodeada). |
| `src/app/api/mp/webhook/route.ts:91` | `const bitsCantidad = sub.tipo === "empresa" ? 10000 : 500;` — webhook MP asigna 10k bits cuando la suscripción es de empresa. |
| `src/app/nexo/crear/page.tsx:246` | `payload.plan_mensual_bits = 10000;` — al crear un nexo-empresa por este flow. |
| `src/app/nexo/crear/page.tsx:504` | `if (bitsTotal < 10000) { alert("Necesitás 10.000 BIT…"); return; }` — validación cliente del costo. |
| `src/app/nexo/crear/page.tsx:505` | `const campo = (perfil?.bits_free||0)>=10000 ? "bits_free" : (perfil?.bits_promo||0)>=10000 ? "bits_promo" : "bits";` |
| `src/app/nexo/crear/page.tsx:507-508` | descuenta `valor-10000` del campo elegido. |
| `src/app/nexo/crear/[tipo]/page.tsx:320` | `payload.plan_mensual_bits = 10000;` — mismo patrón en el flow por tipo. |
| `src/app/nexo/crear/[tipo]/page.tsx:958` | `if ((perfil.bits_free||0) < 10000) { alert("No tenés suficientes BIT Free."); return; }` |
| `src/app/nexo/crear/[tipo]/page.tsx:960-961` | Update y setPerfil: `-10000` en `bits_free`. |
| `src/app/nexo/crear/[tipo]/page.tsx:963` | `if ((perfil.bits||0) < 10000) …` |
| `src/app/nexo/crear/[tipo]/page.tsx:965-966` | Update y setPerfil: `-10000` en `bits`. |
| `src/app/nexo/crear/[tipo]/page.tsx:968` | `if ((perfil.bits_promo||0) < 10000) …` |
| `src/app/nexo/crear/[tipo]/page.tsx:970-971` | Update y setPerfil: `-10000` en `bits_promo`. |

### 2.b. Productos de la tienda (`src/lib/productos.ts`)

| Archivo : línea | Contexto |
|---|---|
| `src/lib/productos.ts:16` | `{ id:"coninf", label:"Ilimitados", precio:10000, duracion:"30 días" … }` — BIT Conexiones Ilimitadas. |
| `src/lib/productos.ts:22` | `{ id:"fl_pai", label:"PROMO Flash País", precio:10000, duracion:"30 días" … }` — Flash País. |

### 2.c. Pack SKUs en `crear-preferencia` (MercadoPago)

| Archivo : línea | Contexto |
|---|---|
| `src/app/api/mp/crear-preferencia/route.ts:20` | `"bit_nexo_ilimitado": { titulo: "BIT Nexo Ilimitado 30 días", precio: 10000, … }` |
| `src/app/api/mp/crear-preferencia/route.ts:24` | `"bit_anuncio_emp_50": { titulo: "50 BIT Anuncio Empresa", precio: 10000, … }` |
| `src/app/api/mp/crear-preferencia/route.ts:28` | `"bit_conexion_ilimitado": { titulo: "BIT Conexión Ilimitado 30 días", precio: 10000, … }` |
| `src/app/api/mp/crear-preferencia/route.ts:45` | `"bit_ia_ilimitado": { titulo: "BIT Búsqueda IA Ilimitado 30 días", precio: 10000, … }` |

### 2.d. Ruido (no relacionado al precio de empresa, no tocar)

- `src/app/admin/usuarios-internos/page.tsx:24,70,94,252` — bits_free iniciales para usuarios internos (bots/seed).
- `src/app/admin/page.tsx:1238`, `src/app/api/mp/webhook/route.ts:209`, `src/app/_lib/insignias.ts`, `src/app/_components/InsigniaLogro.tsx`, `src/app/api/admin/simular-compra/route.ts`, `src/app/usuario/page.tsx`, `src/app/perfil/[userId]/page.tsx` — umbrales de **insignias de logro** (`10000000` = 10M para platino, no es el 10k mensual).
- `src/app/promotor/page.tsx:104,123` — umbral de reembolso `100000` (100k, no 10k).
- `src/app/api/admin/rg-scrape-lote/route.ts:29`, `src/app/api/admin/scrape-url/route.ts:48` — `AbortSignal.timeout(10000)` (10 segundos, timeout HTTP).

### 2.e. Conclusión del punto 2

El **"10.000 BIT mensual de empresa"** está **hardcodeado en al menos 14 lugares** del código (sin contar SQL):
- 2 constantes `COSTO_MENSUAL = 10000` (empresa renovar, servicio renovar).
- 1 ternario en el webhook de MP.
- 2 asignaciones de `plan_mensual_bits = 10000` al crear nexo-empresa.
- 9 usos en `src/app/nexo/crear/[tipo]/page.tsx` (validación, descuento y actualización de bits en 3 caminos: bits_free / bits / bits_promo).
- 1 uso en `src/app/nexo/crear/page.tsx` (validación + descuento).

**Ninguno** de estos sitios lee `config_global.bits_empresa_mensual`. La clave en `config_global` existe pero está huérfana — cambiar el valor en la base **no** cambia el precio efectivo.

---

## 3. Contenido de `config_global`

**No puedo ejecutar SQL directo contra Supabase desde acá** (solo tengo acceso al repo local). Necesito que corras vos esta query en el SQL Editor de Supabase y pegues el resultado en esta sección:

```sql
SELECT clave, valor FROM config_global ORDER BY clave;
```

### Valores esperados según el seed (`sql/020_config_global.sql:23-30`)

Si nadie los modificó después, debería devolver exactamente esto:

| clave | valor |
|---|---|
| `bits_empresa_mensual` | `10000` |
| `bits_ingreso_grupo` | `500` |
| `bits_registro_promotor` | `1000` |
| `email_soporte` | `soporte@nexonet.ar` |
| `nombre_plataforma` | `NexoNet Argentina` |
| `whatsapp_soporte` | `5493413251818` |

> ⚠️ **Pegá acá el resultado real** cuando lo ejecutes en Supabase, para confirmar que no hay claves extra agregadas a mano ni valores distintos al seed.

---

## 4. Estructura y contenido de `empresa_pagos`

### Estructura según `sql/003_empresa_trial_pagos.sql:9-17`

```sql
CREATE TABLE empresa_pagos (
  id             BIGSERIAL PRIMARY KEY,
  nexo_id        UUID REFERENCES nexos(id) ON DELETE CASCADE,
  usuario_id     UUID REFERENCES auth.users(id),
  bits_pagados   INTEGER DEFAULT 10000,
  periodo_desde  TIMESTAMPTZ,
  periodo_hasta  TIMESTAMPTZ,
  created_at     TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE empresa_pagos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "empresa_pagos_select" ON empresa_pagos FOR SELECT USING (true);
CREATE POLICY "empresa_pagos_insert" ON empresa_pagos FOR INSERT WITH CHECK (auth.uid() = usuario_id);
```

**Columnas:** `id`, `nexo_id`, `usuario_id`, `bits_pagados` (default 10000), `periodo_desde`, `periodo_hasta`, `created_at`.
**RLS:** SELECT público, INSERT solo el propio usuario. **No hay políticas UPDATE ni DELETE** → en la práctica son inmutables (bien).

### Contenido actual

Corré:

```sql
SELECT * FROM empresa_pagos ORDER BY created_at DESC LIMIT 5;
-- y también: SELECT COUNT(*) FROM empresa_pagos;
```

> ⚠️ **Pegá acá el resultado real.** Si `COUNT(*) = 0`, confirma que la lógica de renovación (`api/empresa/renovar/route.ts`) todavía no se disparó en producción o no hay ninguna empresa pasada de trial.

Nota: en Supabase SQL Editor, `\d empresa_pagos` (psql meta-command) **no funciona** — usá:
```sql
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'empresa_pagos'
ORDER BY ordinal_position;
```

---

## 5. Archivos que contienen la palabra "empresa" en `src/` (top 30)

29 archivos únicos (limité a ts/tsx, ordenados por relevancia/agrupados):

**API (server):**
- `src/app/api/empresa/renovar/route.ts` — endpoint renovación mensual.
- `src/app/api/mp/webhook/route.ts` — webhook que procesa `sub.tipo === "empresa"`.
- `src/app/api/admin/crear-bot/route.ts`
- `src/app/api/busqueda-ia/match/route.ts`
- `src/app/api/cron/vencimientos/route.ts` — cron diario (`vercel.json → 0 9 * * *`).

**Páginas:**
- `src/app/page.tsx` — home (listados de empresas).
- `src/app/anuncios/[id]/page.tsx`
- `src/app/nexo/crear/page.tsx` — creación de nexo (usa `10000`).
- `src/app/nexo/crear/[tipo]/page.tsx` — creación por tipo (usa `10000` en 9 lugares).
- `src/app/nexo/[id]/page.tsx`, `src/app/nexo/[id]/admin/page.tsx`, `src/app/nexo/[id]/stats/page.tsx`
- `src/app/admin/page.tsx`, `src/app/admin/bots/page.tsx`
- `src/app/usuario/page.tsx`, `src/app/publicar/page.tsx`, `src/app/buscar/page.tsx`
- `src/app/chat/nexo/[nexo_id]/[usuario_id]/page.tsx`, `src/app/chat/[anuncio_id]/[usuario_id]/page.tsx`
- `src/app/mapa/page.tsx`, `src/app/perfil/[userId]/page.tsx`
- `src/app/busqueda-ia/page.tsx`

**Hooks / libs:**
- `src/app/_hooks/useHomeData.ts`
- `src/app/_lib/home-constants.ts`

**Componentes:**
- `src/components/BannerCompartir.tsx`, `OnboardingPopup.tsx`, `BottomNav.tsx`, `AyudaPopup.tsx`, `MapaLeaflet.tsx`

---

## Lectura rápida / próximo paso sugerido (no ejecutado)

El precio **10.000 BIT mensual de empresa** hoy vive en **tres lugares** que no hablan entre sí:
1. Default de columna `nexos.plan_mensual_bits` y `empresa_pagos.bits_pagados` en SQL.
2. Clave `bits_empresa_mensual` en `config_global` — **huérfana, nadie la lee**.
3. **14+ literales `10000` regados** por el código TS/TSX.

Si querés centralizarlo, el camino limpio es: (a) leer `config_global.bits_empresa_mensual` desde un único helper server-side, (b) pasarlo al cliente vía un layout/provider o como prop al flow de creación de nexo-empresa, (c) reemplazar los 14 literales por esa constante. Antes de tocar nada, **confirmar el contenido real de `config_global`** (punto 3) para saber si alguien ya lo cambió en prod.
