# Purga manual via dashboard de Supabase

> Procedimiento para purgar los archivos cuarentenados el 25-Abr-2026 usando la UI del dashboard de Supabase.
> **Alternativa al script** `04-purga-script-API.ts`. Usar uno o el otro, no ambos.

## ⚠️ Pre-condiciones

Antes de empezar:

- [ ] **Hoy es 9-May-2026 o posterior** (período de gracia de 2 semanas vencido).
- [ ] No hay reportes pendientes de usuarios sobre archivos faltantes.
- [ ] La tabla `_huerfanos_storage_snapshot` tiene 197 filas con `estado = 'cuarentena'` y `name_cuarentena LIKE '_trash/20260425_%'`. Verificar con:
  ```sql
  SELECT bucket_id, COUNT(*)
  FROM _huerfanos_storage_snapshot
  WHERE estado = 'cuarentena'
    AND name_cuarentena LIKE '_trash/20260425_%'
  GROUP BY bucket_id;
  ```
  Los conteos deben coincidir con la tabla del README.

## Procedimiento por bucket

Repetir los pasos para cada uno de los 4 buckets cuarentenados.

### 1. Abrir el bucket en el dashboard

1. Ir a https://supabase.com/dashboard → proyecto `thehpvccubxzsnbtbzmz` → **Storage**.
2. Click en el bucket (ej: `imagenes`).

### 2. Navegar a la carpeta `_trash/`

1. En el explorador de archivos, click en la carpeta `_trash/`.
2. Verificar que se ven archivos con prefijo `20260425_…`.

### 3. Seleccionar todos los archivos del 20260425

1. **Filtro / búsqueda**: usar el buscador del dashboard para filtrar por `20260425_`.
2. **Seleccionar todos**: tildar el checkbox del header de la lista para seleccionar la página completa.
3. ⚠️ Si hay paginación (más de ~100 archivos), repetir página por página.

### 4. Eliminar el lote

1. Click en el botón **"Delete"** (ícono de tacho).
2. Confirmar en el modal de confirmación.
3. Esperar a que termine — puede tardar varios segundos por lote.

### 5. Verificar

1. Re-buscar `20260425_` en `_trash/` — no deben quedar resultados para ese bucket.
2. Pasar al siguiente bucket.

## Después de purgar los 4 buckets

Marcar los registros como purgados en el snapshot. Ejecutar en el SQL Editor:

```sql
UPDATE _huerfanos_storage_snapshot
SET estado = 'purgado',
    purgado_at = now()
WHERE estado = 'cuarentena'
  AND name_cuarentena LIKE '_trash/20260425_%';
```

> ⚠️ Si la columna `purgado_at` no existe en el snapshot, omitirla del UPDATE.

## Verificación final

```sql
-- Debe devolver 0
SELECT COUNT(*)
FROM _huerfanos_storage_snapshot
WHERE estado = 'cuarentena'
  AND name_cuarentena LIKE '_trash/20260425_%';

-- Debe devolver 197
SELECT COUNT(*)
FROM _huerfanos_storage_snapshot
WHERE estado = 'purgado'
  AND name_cuarentena LIKE '_trash/20260425_%';
```

## Si algo sale mal a mitad de camino

- Si purgaste algunos buckets pero no todos: el snapshot tendrá una mezcla de `cuarentena` y `purgado`. Continuar con los faltantes — la operación es idempotente.
- Si el dashboard tira error en algún archivo: anotar el `name_cuarentena` y el `bucket_id`, terminar el resto, y atacar los problemáticos uno por uno desde el script `04-purga-script-API.ts`.
- Si dudás: **parar y pedir revisión humana antes de continuar.**
