import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { logFallo } from "@/lib/log-fallos";

export async function POST(req: Request) {
  try {
    const { usuario_id, columna, cantidad, nota } = await req.json();
    if (!usuario_id || !columna || cantidad === undefined)
      return NextResponse.json({ error: "Faltan campos" }, { status: 400 });

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data: u, error: fetchError } = await supabase
      .from("usuarios")
      .select("bits,bits_free,bits_promo")
      .eq("id", usuario_id)
      .single();

    if (fetchError || !u) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

    const actual = u[columna as keyof typeof u] as number || 0;
    const nuevo = Math.max(0, actual + cantidad);

    const { error } = await supabase
      .from("usuarios")
      .update({ [columna]: nuevo })
      .eq("id", usuario_id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Comisión en cascada ilimitada
    if (cantidad > 0 && (columna === "bits" || columna === "bits_promo")) {
      const { data: refUser } = await supabase.from("usuarios").select("nombre_usuario,nombre").eq("id", usuario_id).single();
      const nombreRef = refUser?.nombre_usuario || refUser?.nombre || "un referido";
      let currentId = usuario_id;
      let comisionBase = cantidad;
      const visitados = new Set<string>();

      while (comisionBase > 0) {
        const { data: current } = await supabase
          .from("usuarios")
          .select("referido_por")
          .eq("id", currentId)
          .single();

        if (!current?.referido_por || visitados.has(current.referido_por)) break;
        visitados.add(current.referido_por);

        const { data: promotor } = await supabase
          .from("usuarios")
          .select("bits_promo, bits_promotor_total, codigo")
          .eq("id", current.referido_por)
          .single();

        if (!promotor) break;

        const { data: socio } = await supabase
          .from("socios_comerciales")
          .select("porcentaje")
          .eq("usuario_id", current.referido_por)
          .eq("activo", true)
          .maybeSingle();

        const porcentaje = socio ? (socio.porcentaje / 100) : 0.20;
        const comision = Math.floor(comisionBase * porcentaje);

        // Si la comisión redondea a 0 pero la base sigue siendo positiva, no cortamos:
        // pasamos al siguiente eslabón con la base intacta (eslabón "transparente").
        if (comision <= 0) {
          if (comisionBase <= 0) break;
          currentId = current.referido_por;
          continue;
        }

        const { error: upCascadaErr } = await supabase.from("usuarios").update({
          bits_promo: (promotor.bits_promo || 0) + comision,
          bits_promotor_total: (promotor.bits_promotor_total || 0) + comision,
        }).eq("id", current.referido_por);
        if (upCascadaErr) await logFallo({
          severidad: "critico",
          contexto: "asignar-bit",
          operacion: "update_cascada_promo",
          usuario_id: current.referido_por,
          datos_contexto: { comision, nivel: visitados.size, referido_origen: usuario_id, error: upCascadaErr },
          error_mensaje: upCascadaErr.message,
        });

        if (socio) {
          const { data: socioData } = await supabase
            .from("socios_comerciales")
            .select("bits_promotor_acumulado")
            .eq("usuario_id", current.referido_por)
            .eq("activo", true)
            .single();
          if (socioData) {
            const { error: upSocioErr } = await supabase
              .from("socios_comerciales")
              .update({ bits_promotor_acumulado: (socioData.bits_promotor_acumulado || 0) + comision })
              .eq("usuario_id", current.referido_por)
              .eq("activo", true);
            if (upSocioErr) await logFallo({
              severidad: "critico",
              contexto: "asignar-bit",
              operacion: "update_socio_acumulado",
              usuario_id: current.referido_por,
              datos_contexto: { comision, acumulado_prev: socioData.bits_promotor_acumulado || 0, error: upSocioErr },
              error_mensaje: upSocioErr.message,
            });
          }
        }

        const nivel = visitados.size;
        const pctLabel = socio ? `${socio.porcentaje}% socio` : "20%";
        const { error: notifCascadaErr } = await supabase.from("notificaciones").insert({
          usuario_id: current.referido_por,
          tipo: "sistema",
          mensaje: `⭐ Recibiste ${comision.toLocaleString()} BIT Promo de comisión (${pctLabel}) por tu referido ${nombreRef}${nivel > 1 ? ` (nivel ${nivel})` : ""}`,
          leida: false,
        });
        if (notifCascadaErr) await logFallo({
          severidad: "advertencia",
          contexto: "asignar-bit",
          operacion: "insert_notif_cascada",
          usuario_id: current.referido_por,
          datos_contexto: { comision, nivel: visitados.size, pctLabel, error: notifCascadaErr },
          error_mensaje: notifCascadaErr.message,
        });

        const { error: logErr } = await supabase.from("log_bits_internos").insert({
          usuario_id: current.referido_por,
          cantidad: comision,
          motivo: `Comisión nivel ${nivel} (${pctLabel}) — referido ${usuario_id} recibió ${cantidad} BIT (asignación admin)`,
          asignado_por: usuario_id,
        });
        if (logErr) await logFallo({
          severidad: "critico",
          contexto: "asignar-bit",
          operacion: "insert_log_cascada",
          usuario_id: current.referido_por,
          datos_contexto: { comision, nivel: visitados.size, pctLabel, referido_origen: usuario_id, error: logErr },
          error_mensaje: logErr.message,
        });

        comisionBase = comision;
        currentId = current.referido_por;
      }
    }

    const tipoLabel = columna === "bits" ? "Nexo" : columna === "bits_free" ? "Free" : "Promo";
    const msgNot = cantidad > 0
      ? `💰 Recibiste ${Math.abs(cantidad)} BIT ${tipoLabel} desde NexoNet${nota ? ` — ${nota}` : ""}`
      : `💸 Se debitaron ${Math.abs(cantidad)} BIT ${tipoLabel} desde NexoNet${nota ? ` — ${nota}` : ""}`;
    const { error: notifFinalErr } = await supabase.from("notificaciones").insert({
      usuario_id,
      tipo: "sistema",
      mensaje: msgNot,
      leida: false,
    });
    if (notifFinalErr) await logFallo({
      severidad: "advertencia",
      contexto: "asignar-bit",
      operacion: "insert_notif_final",
      usuario_id,
      datos_contexto: { cantidad, columna, nuevo, error: notifFinalErr },
      error_mensaje: notifFinalErr.message,
    });

    return NextResponse.json({ ok: true, nuevo });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
