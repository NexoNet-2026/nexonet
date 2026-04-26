/**
 * 04-purga-script-API.ts
 *
 * Purga vía Supabase Storage API los archivos cuarentenados el 25-Abr-2026.
 * Alternativa automatizada al proceso manual de 03-purga-MANUAL-via-dashboard.md.
 *
 * ⚠️ JAMÁS ejecutar antes del 9-May-2026.
 *    Leer scripts/db/storage-cleanup/README.md antes de usar.
 *
 * Uso:
 *   1. Asegurarse que .env / .env.local tiene SUPABASE_URL y
 *      SUPABASE_SERVICE_ROLE_KEY (NO la anon key — necesita service role
 *      para bypass de RLS y para poder borrar de cualquier bucket).
 *   2. Correr:  npx tsx --env-file=.env.local scripts/db/storage-cleanup/04-purga-script-API.ts
 *      (o configurar dotenv como prefieras).
 *
 * Idempotente: si se corre dos veces, la segunda no encuentra nada con
 * estado='cuarentena' y termina sin hacer nada.
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ Faltan variables de entorno. Necesito SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY.");
  console.error("   No usar la anon key — el delete de Storage requiere service role.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

type SnapshotRow = {
  id: number | string;
  bucket_id: string;
  name_cuarentena: string;
};

type FailureRow = {
  id: SnapshotRow["id"];
  bucket_id: string;
  name_cuarentena: string;
  error: string;
};

const PREFIX = "_trash/20260425_";
const PROGRESS_EVERY = 10;

async function main() {
  console.log("🔍 Buscando archivos cuarentenados en _huerfanos_storage_snapshot…");

  const { data: rows, error: selErr } = await supabase
    .from("_huerfanos_storage_snapshot")
    .select("id,bucket_id,name_cuarentena")
    .eq("estado", "cuarentena")
    .like("name_cuarentena", `${PREFIX}%`);

  if (selErr) {
    console.error("❌ Error leyendo el snapshot:", selErr);
    process.exit(1);
  }

  const total = rows?.length ?? 0;
  if (total === 0) {
    console.log("✅ No hay archivos en cuarentena con prefijo " + PREFIX + ". Nada que purgar.");
    return;
  }

  console.log(`📦 Total a purgar: ${total} archivos.`);
  console.log("⏳ Ejecutando remove() vía Storage API…\n");

  const failures: FailureRow[] = [];
  const purgedIds: SnapshotRow["id"][] = [];
  let processed = 0;

  for (const row of rows as SnapshotRow[]) {
    try {
      const { error: rmErr } = await supabase.storage
        .from(row.bucket_id)
        .remove([row.name_cuarentena]);

      if (rmErr) {
        failures.push({
          id: row.id,
          bucket_id: row.bucket_id,
          name_cuarentena: row.name_cuarentena,
          error: rmErr.message,
        });
      } else {
        purgedIds.push(row.id);
      }
    } catch (e: any) {
      failures.push({
        id: row.id,
        bucket_id: row.bucket_id,
        name_cuarentena: row.name_cuarentena,
        error: e?.message ?? String(e),
      });
    }

    processed++;
    if (processed % PROGRESS_EVERY === 0 || processed === total) {
      console.log(`   ${processed}/${total} (✅ ${purgedIds.length}  ❌ ${failures.length})`);
    }
  }

  console.log("\n📝 Marcando como 'purgado' en el snapshot…");

  if (purgedIds.length > 0) {
    const { error: upErr } = await supabase
      .from("_huerfanos_storage_snapshot")
      .update({ estado: "purgado" })
      .in("id", purgedIds);

    if (upErr) {
      console.error("⚠️  El borrado físico funcionó pero falló el UPDATE del snapshot:", upErr);
      console.error("    Marcá manualmente con:");
      console.error(`    UPDATE _huerfanos_storage_snapshot SET estado='purgado' WHERE id IN (${purgedIds.join(",")});`);
    } else {
      console.log(`   ✅ ${purgedIds.length} filas marcadas como 'purgado'.`);
    }
  }

  console.log("\n────────────────────────────────────────");
  console.log(`Resumen final:`);
  console.log(`   Total procesados : ${total}`);
  console.log(`   ✅ Purgados      : ${purgedIds.length}`);
  console.log(`   ❌ Fallaron      : ${failures.length}`);
  console.log("────────────────────────────────────────");

  if (failures.length > 0) {
    console.log("\nDetalle de los fallos:\n");
    for (const f of failures) {
      console.log(`   [${f.bucket_id}] ${f.name_cuarentena}`);
      console.log(`      id=${f.id}  error=${f.error}`);
    }
    console.log("\n→ Los registros que fallaron quedaron con estado='cuarentena' en el snapshot.");
    console.log("  Revisalos manualmente y volvé a correr el script (idempotente) o purgá vía dashboard.");
    process.exit(2);
  }
}

main().catch((e) => {
  console.error("💥 Error no esperado:", e);
  process.exit(1);
});
