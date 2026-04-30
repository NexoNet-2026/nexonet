# Pendientes técnicos detectados (sesión 26-Abr-2026)

1. **Bucket fantasma: `nexos-descargas`**
   - Referenciado en `src/app/nexo/[id]/page.tsx:400`
   - NO existe en Supabase Storage
   - Decisión: dejar el código pero crear el bucket cuando se implemente la feature de descargas, o eliminar la referencia si la feature ya no se planea.

2. **Centralización de buckets de storage**
   - 5 buckets distintos referenciados como literales en 6 archivos (auditoría completa en sesión 26-Abr-2026).
   - Crear `src/lib/storage/buckets.ts` con constantes `BUCKET_AVATARES`, `BUCKET_NEXOS`, `BUCKET_NEXOS_DESCARGAS`, `BUCKET_ANUNCIOS`, `BUCKET_IMAGENES`.
   - Crear helper `uploadToStorage(bucket, path, file, options)` que centralice upload + getPublicUrl.
   - Refactorizar los 6 archivos para usar las constantes y el helper.
   - Sumar al helper la lógica de compresión cliente (browser-image-compression, WebP, max 500KB, resize a 1600px).

3. **Inconsistencia bucket vs path: bucket `imagenes` guarda anuncios viejos**
   - Convención vieja: `anuncios/{id_numerico}/foto.jpg` en bucket `imagenes`.
   - Convención nueva: bucket `anuncios` para anuncios.
   - Pendiente: definir oficialmente qué bucket usa cada tipo de contenido y migrar lo que quede.

4. **Optimización de imágenes (estrategia 4 capas)**
   - Capa 1: Pre-upload en cliente con `browser-image-compression` (urgente, antes de tener usuarios reales).
   - Capa 2: Multi-tamaño (thumb 400px + full 1600px).
   - Capa 3: Edge Function red de seguridad para archivos > 500KB.
   - Capa 4 (futuro): Cloudflare R2 cuando se rompa el límite de storage del Free tier.

5. **Trigger anti-huérfanos**
   - Cuando se borra un anuncio/grupo/perfil/etc, sus archivos quedan huérfanos.
   - Implementar trigger BD o lógica en helper de borrado que mueva archivos a `_trash/` automáticamente.
   - Esto evita rehacer el proceso manual de cuarentena cada N meses.

6. **Smoke test post-cuarentena pendiente**
   - Verificar visualmente en localhost que ninguna imagen quedó rota tras la cuarentena del 26-Abr.
   - Si algo se rompe: usar `02-rollback-EMERGENCIA.sql`.

7. **Purga definitiva de huérfanos**
   - Fecha mínima: 9-May-2026.
   - Vía recomendada: dashboard manual (Opción A en `03-purga-MANUAL-via-dashboard.md`).
   - Vía alternativa: `04-purga-script-API.ts`.


# Cierre de sesión 29-Abr-2026

## Lo cerrado hoy
- **Clonado PROD -> STAGING completo** (proyecto STAGING `twnjmfwegelzvecxxwtj`):
  79 tablas, 121 FKs, 192 policies, 12 functions, 4 triggers + 1 event trigger, 32 indexes, 30 constraints, 6690 filas de seed en 22 tablas. Verificado por SELECT de control (los 7 contadores dieron exactos).
- **`.env.local` reapuntado a STAGING** (creado con Read-Host para no exponer keys en chat). El `.env.local` viejo de PROD quedó respaldado como `.env.production.local`.
- **Vercel confirmado apuntando a PROD** (`thehpvccubxzsnbtbzmz`) en variable `NEXT_PUBLIC_SUPABASE_URL`, scope "All Environments".
- **Smoke test OK**: `npm run dev` levanta apuntando a STAGING, Network confirma requests a `twnjmfwegelzvecxxwtj.supabase.co`.

## Rotación de service_role en PROD (29-Abr-2026)
- **Causa**: `.claude/settings.local.json` estaba trackeado en git con el `service_role` JWT de PROD inline en varios comandos curl autorizados. 4 commits con esa key llegaron a `origin/master`: `9bab788`, `f753012`, `7807f1a`, `1542a70`.
- **Acción**:
  1. Generada nueva secret key `default_v3` en Supabase PROD.
  2. Cargada en Vercel (Production env, "All Environments") + redeploy Ready en 55s.
  3. Verificado nexonet.ar operativo con la nueva key (login persistente, anuncios visibles).
  4. `default_v2` (la expuesta) eliminada del dashboard.
- **Estado**: las versiones del JWT que quedaron en el historial de git ya no sirven para nada. Limpieza del historial NO ejecutada (queda como pendiente, ver abajo).
- **`.claude/` agregado a `.gitignore`** y sacado del tracking con `git rm --cached`. El archivo sigue en disco para uso de Claude Code, pero git ya no lo ve.

## Aprendizajes (para evitar fricción en futuras sesiones)
- **NUNCA correr `cat .env.local`** ni equivalentes en chat. Para verificar contenido sin exponer secretos: usar `Test-Path`, contar líneas, mostrar primeros N caracteres.
- **PowerShell `Read-Host`**: dentro de `Read-Host`, `Ctrl+V` no pega — inserta el carácter de control `^V`. Hay que pegar con **click derecho** en la terminal.
- **`Set-Content` con here-string** (`@"..."@`) es la forma confiable de escribir varias líneas en un archivo desde PowerShell, sin BOM cuando se usa `-Encoding UTF8` en PS 7+ (en PS 5.1 sí mete BOM, ojo si reusamos esto).
- **Cuando git imprime `rm 'archivo'` después de `git rm --cached`**, eso es output informativo, NO un comando. Si lo copiás y pegás como comando, borrás el archivo del disco.

# Pendientes técnicos detectados (sesión 29-Abr-2026)
6. **Limpieza del historial de git para borrar el JWT viejo expuesto**
   - El `service_role` `default_v2` ya está invalidado en Supabase, pero el JWT como string sigue presente en los 4 commits mencionados arriba (`9bab788`, `f753012`, `7807f1a`, `1542a70`).
   - No es un riesgo de acceso (la key no funciona), pero queda como huella de mala práctica visible en el repo.
   - Solución: `git filter-repo` o BFG Repo-Cleaner para reescribir esos commits sacando el contenido de `.claude/settings.local.json`. Requiere `git push --force` y coordinación si hay otros colaboradores.
   - Prioridad: baja (cosmética).
7. **Variables marcadas "Needs Attention" en Vercel**
   - Detectadas en Settings -> Environments -> Production: `SUPABASE_SERVICE_ROLE_KEY` (post-rotación), `VAPID_PRIVATE_KEY`, `CRON_SECRET`.
   - Significado a confirmar (puede ser que Vercel detectó que estaban vacías, expuestas en logs, o duplicadas). Revisar en próxima sesión.
8. **Env vars de Supabase en Vercel scope "All Environments"**
   - `NEXT_PUBLIC_SUPABASE_URL` y compañía están seteadas para Production + Preview + Development a la vez, todas apuntando a PROD.
   - Cuando empecemos a usar branches de Preview o el ambiente Development, conviene scopearlas: Production -> PROD, Preview/Development -> STAGING.
9. **Warning de Next 16: `middleware` -> `proxy`**
   - `next dev` tira: `The "middleware" file convention is deprecated. Please use "proxy" instead.`
   - Migrar el archivo `middleware.ts` (o `.js`) a la nueva convención `proxy` cuando haya una ventana tranquila. No bloquea hoy.
10. **`.env.production.local` queda en disco con la key vieja invalidada**
    - Es el respaldo del `.env.local` original que apuntaba a PROD.
    - Como la `service_role` que contiene ya está invalidada, el archivo es inofensivo pero engañoso: si en el futuro alguien lo lee creyendo que es válido, va a confundirse.
    - Decisión: actualizarlo con la key nueva (`default_v3`) para que sirva si volvemos a apuntar local a PROD, o borrarlo y dejarlo solo en Vercel.
