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
