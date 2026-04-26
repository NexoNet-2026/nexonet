# Storage cleanup — cuarentena y purga de huérfanos

> Procedimiento para detectar, cuarentenar y eventualmente purgar archivos huérfanos en los buckets de Supabase Storage de NexoNet.

## Qué es la "cuarentena de huérfanos"

Un archivo en Supabase Storage se considera **huérfano** cuando ya no tiene ninguna fila en la base que lo referencie (ej: un avatar cuyo usuario fue eliminado, una imagen subida en un wizard que el usuario abandonó antes de crear el nexo, una imagen de anuncio cuyo anuncio fue borrado).

La cuarentena consiste en **renombrar** esos archivos a un prefijo `_trash/<fecha>_…` en el mismo bucket, en lugar de borrarlos directo. Esto da una ventana de seguridad por si:

- El detector de huérfanos tuvo un falso positivo (alguna referencia que vive en una tabla nueva o que se buscó mal en el query).
- Aparece una feature que necesita los archivos.
- Algún usuario reporta un faltante.

Después de un período de gracia, los archivos cuarentenados se **purgan** definitivamente vía Storage API o dashboard de Supabase (no por SQL — ver "lecciones aprendidas" abajo).

## Cuarentena del 25-Abr-2026

| Item | Valor |
|---|---|
| Fecha de ejecución | 2026-04-25 |
| Total archivos cuarentenados | 197 |
| Tamaño total | ~142 MB |
| Buckets afectados | 4 |
| Prefijo de cuarentena | `_trash/20260425_…` |
| Tabla de tracking | `_huerfanos_storage_snapshot` |
| Estado | `cuarentena` (pendiente de purga) |

### Detalle por bucket

| Bucket      | Vivos (post-cuarentena) | Peso vivo  | Cuarentenados | Peso cuarentena |
|-------------|------------------------:|-----------:|--------------:|----------------:|
| `nexos`     |                       5 |  1.97 MB   |            99 |          81 MB  |
| `imagenes`  |                       3 |  2.08 MB   |            94 |          60 MB  |
| `avatares`  |                       0 |     —      |             2 |        919 kB   |
| `anuncios`  |                       0 |     —      |             2 |         92 kB   |
| **TOTAL**   |                   **8** | **~4 MB**  |       **197** |    **~142 MB**  |

**Observaciones:**

- Los buckets `avatares` y `anuncios` quedaron sin archivos vivos. Esto se debe a que la BD apunta mayormente a URLs externas de Pexels (datos seed) o a paths que viven en `nexos`/`imagenes` (convención vieja del código). Pendiente: consolidar a qué bucket sube cada tipo de contenido (ver pendientes de centralización en `src/lib/storage/buckets.ts`).
- Existe un bucket `nexos-descargas` referenciado en `src/app/nexo/[id]/page.tsx:400` que **no está creado** en Supabase Storage. Es código preparado para una funcionalidad aún no usada.
- Convivían dos convenciones de path en los archivos cuarentenados: vieja (`anuncios/29/0.jpg`, ID numérico) y nueva (`anuncios/{uuid}/...`). Toda la convención vieja quedó cuarentenada en bloque.

## Purga definitiva — ⚠️ NO antes del 9-May-2026

La purga es **irreversible**. La ventana de gracia mínima es de 2 semanas desde la cuarentena (25-Abr → 9-May). Antes de esa fecha:

- ❌ NO ejecutar `04-purga-script-API.ts`.
- ❌ NO purgar manualmente vía dashboard usando `03-purga-MANUAL-via-dashboard.md`.
- ✅ Mantener los archivos en `_trash/20260425_…` y revisar reportes de usuarios.

## Archivos en este directorio

| Archivo | Propósito | Cuándo se usa |
|---|---|---|
| `01-cuarentena-INICIAL.sql.done` | Script SQL ejecutado el 25-Abr-2026 que renombró los huérfanos al prefijo `_trash/`. El sufijo `.done` indica que ya corrió. | Histórico — referencia para auditoría. NO re-ejecutar. |
| `02-rollback-EMERGENCIA.sql` | Script SQL que revierte la cuarentena (renombra los archivos de `_trash/…` a su nombre original). | **Solo emergencia** — ver advertencia abajo. |
| `03-purga-MANUAL-via-dashboard.md` | Instrucciones paso a paso para purgar los archivos cuarentenados desde el dashboard de Supabase. | Cuando llegue el 9-May-2026 — alternativa al script. |
| `04-purga-script-API.ts` | Script Node con `@supabase/supabase-js` que purga los archivos vía Storage API. | Cuando llegue el 9-May-2026 — alternativa al manual. |

## ⚠️ Advertencia sobre `02-rollback-EMERGENCIA.sql`

**Este script jamás debe ejecutarse a la ligera.** Solo tiene sentido si:

- Se descubre que la cuarentena del 25-Abr-2026 fue masivamente errónea (falsos positivos a gran escala).
- Aún no se purgaron los archivos (después de la purga, el rollback ya no puede recuperar nada).
- Hay un plan claro de qué hacer después (no rollback "por las dudas").

Si el problema es un par de archivos puntuales, **no** correr el rollback completo — restaurar a mano los archivos específicos vía dashboard.

## Lecciones aprendidas

1. **`storage.protect_delete()` impide DELETE directo en `storage.objects`.** La purga definitiva no se puede hacer con `DELETE FROM storage.objects WHERE ...`. Hay dos caminos válidos: (a) borrado manual desde el dashboard de Supabase; (b) script Node usando la Storage API con la service role key (ver `04-purga-script-API.ts`).

2. **Después de cuarentenar, cerrar el SQL Editor.** El 2026-04-25, durante el primer intento, el bloque de rollback se ejecutó accidentalmente y revirtió la cuarentena. La re-aplicación fue trivial gracias al snapshot, pero conviene evitar el doble trabajo cerrando la pestaña.

3. **El snapshot es el activo más valioso.** Mientras `_huerfanos_storage_snapshot` exista con los registros, la operación es 100% reversible y reproducible. No borrar esa tabla sin antes purgar definitivamente.
