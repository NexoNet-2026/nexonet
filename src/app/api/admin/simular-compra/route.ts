// src/app/api/admin/simular-compra/route.ts
// Replica la lógica del webhook de MercadoPago (src/app/api/mp/webhook/route.ts)
// sin consultar la API de MP. Herramienta admin para diagnosticar cascada de comisiones.
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { logFallo } from "@/lib/log-fallos";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const PAQUETES: Record<string, { col: string; cantidad: number; ilimitado?: boolean }> = {
  "bit_500":   { col: "bits", cantidad: 500   },
  "bit_1500":  { col: "bits", cantidad: 1600  },
  "bit_3000":  { col: "bits", cantidad: 3300  },
  "bit_6000":  { col: "bits", cantidad: 6800  },
  "bit_12000": { col: "bits", cantidad: 14000 },
  "bit_30000": { col: "bits", cantidad: 36000 },
};

const NIVELES_LOGRO: [string, number][] = [
  ["diamante",  20000000],
  ["platino",   10000000],
  ["oro",        5000000],
  ["plata",      1000000],
  ["bronce",      100000],
  ["ninguna",          0],
];

export async function POST(req: Request) {
  try {
    // 1. Auth admin (Bearer token en header → usuarios.es_admin_sistema=true)
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
    if (!token) {
      return NextResponse.json({ error: "Falta token de autorización" }, { status: 403 });
    }

    const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data: { user }, error: authErr } = await supabaseAuth.auth.getUser(token);
    if (authErr || !user) {
      return NextResponse.json({ error: "Sesión inválida" }, { status: 403 });
    }

    const { data: caller } = await supabase
      .from("usuarios")
      .select("es_admin_sistema")
      .eq("id", user.id)
      .single();
    if (!caller?.es_admin_sistema) {
      return NextResponse.json({ error: "Requiere permiso de admin" }, { status: 403 });
    }

    // 2. Validar body
    const { usuario_id, paquete } = await req.json();
    if (!usuario_id || !paquete) {
      return NextResponse.json({ error: "usuario_id y paquete son requeridos" }, { status: 400 });
    }

    const pkg = PAQUETES[paquete];
    if (!pkg) {
      return NextResponse.json({ error: `Paquete inválido: ${paquete}` }, { status: 400 });
    }

    // 3. Obtener usuario (mismas columnas que el webhook real)
    const { data: usuario } = await supabase
      .from("usuarios")
      .select("id, bits, bits_busquedas, bits_totales_acumulados")
      .eq("id", usuario_id)
      .single();

    if (!usuario) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    // 4. Payment ID ficticio único por timestamp
    const payment_id = `SIM_${Date.now()}_${usuario_id.slice(0, 8)}`;

    // 5. Calcular nuevo valor + insignia_logro (idéntico al webhook)
    const actual = (usuario as any)[pkg.col] || 0;
    const nuevo = pkg.ilimitado ? 99999 : actual + pkg.cantidad;
    const acumuladoActual = (usuario as any).bits_totales_acumulados || 0;
    const nuevoAcumulado = acumuladoActual + (pkg.ilimitado ? 99999 : pkg.cantidad);
    const insignia = NIVELES_LOGRO.find(([, min]) => nuevoAcumulado >= min)?.[0] || "ninguna";

    // 6. Update usuarios
    const { error: updateErr } = await supabase.from("usuarios").update({
      [pkg.col]: nuevo,
      bits_totales_acumulados: nuevoAcumulado,
      insignia_logro: insignia,
    }).eq("id", usuario_id);

    if (updateErr) {
      return NextResponse.json({ error: "Error actualizando usuario: " + updateErr.message }, { status: 500 });
    }

    // 7. Registrar en pagos_mp (estado="simulado", monto=0)
    const { error: pagoErr } = await supabase.from("pagos_mp").insert({
      payment_id,
      usuario_id,
      paquete,
      monto: 0,
      estado: "simulado",
      bits_col: pkg.col,
      bits_cant: pkg.cantidad,
    });
    if (pagoErr) await logFallo({
      severidad: "critico",
      contexto: "simular-compra",
      operacion: "insert_pagos_mp",
      usuario_id,
      datos_contexto: {
        usuario_id_destino: usuario_id,
        payment_id,
        paquete,
        monto: 0,
        estado: "simulado",
        bits_col: pkg.col,
        bits_cant: pkg.cantidad,
        error: pagoErr,
      },
      error_mensaje: pagoErr.message,
    });

    // 8. Notificación al comprador
    const cantTxt = pkg.ilimitado ? "BIT Ilimitados" : `${pkg.cantidad.toLocaleString()} BIT`;
    const mensajeComprador = `✅ [SIMULACIÓN ADMIN] Se acreditaron ${cantTxt} en tu cuenta`;
    const { error: notifErr } = await supabase.from("notificaciones").insert({
      usuario_id,
      tipo: "sistema",
      mensaje: mensajeComprador,
      leida: false,
    });
    if (notifErr) await logFallo({
      severidad: "advertencia",
      contexto: "simular-compra",
      operacion: "insert_notif_comprador",
      usuario_id,
      datos_contexto: { usuario_id_destino: usuario_id, mensaje: mensajeComprador, payment_id, paquete, cantidad: pkg.cantidad, error: notifErr },
      error_mensaje: notifErr.message,
    });

    // 9. Cascada de comisiones (idéntica al webhook, con prefijo [SIMULACIÓN ADMIN] en mensajes)
    const cascada: Array<{ nivel: number; usuario_id: string; porcentaje: number; comision: number }> = [];
    let tieneCascada = false;
    try {
      const { data: refUser } = await supabase
        .from("usuarios")
        .select("nombre_usuario,nombre,referido_por")
        .eq("id", usuario_id)
        .single();
      const nombreRef = refUser?.nombre_usuario || refUser?.nombre || "un referido";
      tieneCascada = !!refUser?.referido_por;

      let currentId = usuario_id;
      let comisionBase = pkg.cantidad;
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
          contexto: "simular-compra",
          operacion: "update_cascada_promo",
          usuario_id: current.referido_por,
          datos_contexto: { comision, nivel: visitados.size, referido_origen: usuario_id, payment_id, error: upCascadaErr },
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
              contexto: "simular-compra",
              operacion: "update_socio_acumulado",
              usuario_id: current.referido_por,
              datos_contexto: { comision, acumulado_prev: socioData.bits_promotor_acumulado || 0, payment_id, error: upSocioErr },
              error_mensaje: upSocioErr.message,
            });
          }
        }

        const nivel = visitados.size;
        const pctLabel = socio ? `${socio.porcentaje}% socio` : "20%";

        const notifMensaje = `⭐ [SIMULACIÓN ADMIN] Recibiste ${comision.toLocaleString()} BIT Promo de comisión (${pctLabel}) por tu referido ${nombreRef}${nivel > 1 ? ` (nivel ${nivel})` : ""}`;
        const { error: notifCascadaErr } = await supabase.from("notificaciones").insert({
          usuario_id: current.referido_por,
          tipo: "sistema",
          mensaje: notifMensaje,
          leida: false,
        });
        if (notifCascadaErr) await logFallo({
          severidad: "advertencia",
          contexto: "simular-compra",
          operacion: "insert_notif_cascada",
          usuario_id: current.referido_por,
          datos_contexto: { usuario_id_destino: current.referido_por, mensaje: notifMensaje, comision, nivel, pctLabel, payment_id, error: notifCascadaErr },
          error_mensaje: notifCascadaErr.message,
        });

        const logMotivo = `[SIMULACIÓN ADMIN] Comisión nivel ${nivel} (${pctLabel}) — referido ${usuario_id} compró ${pkg.cantidad} BIT (paquete: ${paquete})`;
        const { error: logErr } = await supabase.from("log_bits_internos").insert({
          usuario_id: current.referido_por,
          cantidad: comision,
          motivo: logMotivo,
          asignado_por: usuario_id,
        });
        if (logErr) await logFallo({
          severidad: "critico",
          contexto: "simular-compra",
          operacion: "insert_log_cascada",
          usuario_id: current.referido_por,
          datos_contexto: { usuario_id_destino: current.referido_por, motivo: logMotivo, comision, nivel, pctLabel, referido_origen: usuario_id, payment_id, error: logErr },
          error_mensaje: logErr.message,
        });

        cascada.push({
          nivel,
          usuario_id: current.referido_por,
          porcentaje: socio ? socio.porcentaje : 20,
          comision,
        });

        comisionBase = comision;
        currentId = current.referido_por;
      }
    } catch (e: any) {
      await logFallo({
        severidad: "critico",
        contexto: "simular-compra",
        operacion: "catch_cascada",
        usuario_id,
        datos_contexto: { payment_id, error: String(e) },
        error_mensaje: e?.message || String(e),
      });
    }

    // 10. Si el comprador no tiene cadena de referidos, acreditar a socios comerciales
    if (!tieneCascada) {
      try {
        const { acreditarSocios } = await import("@/lib/socios");
        await acreditarSocios(usuario_id, pkg.cantidad);
      } catch (e: any) {
        await logFallo({
          severidad: "critico",
          contexto: "simular-compra",
          operacion: "catch_acreditar_socios",
          usuario_id,
          datos_contexto: { payment_id, cantidad: pkg.cantidad, error: String(e) },
          error_mensaje: e?.message || String(e),
        });
      }
    }

    return NextResponse.json({
      ok: true,
      payment_id,
      acreditado: { col: pkg.col, cantidad: pkg.ilimitado ? 99999 : pkg.cantidad },
      cascada,
    });
  } catch (err: any) {
    await logFallo({
      severidad: "critico",
      contexto: "simular-compra",
      operacion: "catch_endpoint",
      datos_contexto: { error: String(err) },
      error_mensaje: err?.message || String(err),
    });
    return NextResponse.json({ error: err.message || "Error interno" }, { status: 500 });
  }
}
