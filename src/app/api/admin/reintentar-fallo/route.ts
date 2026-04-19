// src/app/api/admin/reintentar-fallo/route.ts
// Reintenta un insert fallido usando el payload guardado en log_fallos_sistema.datos_contexto.
// Solo acepta operaciones en la whitelist (REINSERTABLES) para no habilitar inserts arbitrarios.
// Si el reintento funciona, marca el fallo como resuelto automáticamente.
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

type ReintentoBuilder = (ctx: any) => { tabla: string; payload: Record<string, any> };

const REINSERTABLES: Record<string, ReintentoBuilder> = {
  insert_log_cascada: (ctx) => ({
    tabla: "log_bits_internos",
    payload: {
      usuario_id: ctx.usuario_id_destino,
      cantidad: ctx.comision,
      motivo: ctx.motivo,
      asignado_por: ctx.referido_origen,
    },
  }),
  insert_notif_cascada: (ctx) => ({
    tabla: "notificaciones",
    payload: {
      usuario_id: ctx.usuario_id_destino,
      tipo: "sistema",
      mensaje: ctx.mensaje,
      leida: false,
    },
  }),
  insert_notif_final: (ctx) => ({
    tabla: "notificaciones",
    payload: {
      usuario_id: ctx.usuario_id_destino,
      tipo: "sistema",
      mensaje: ctx.mensaje,
      leida: false,
    },
  }),
  insert_notif_comprador: (ctx) => ({
    tabla: "notificaciones",
    payload: {
      usuario_id: ctx.usuario_id_destino,
      tipo: "sistema",
      mensaje: ctx.mensaje,
      leida: false,
    },
  }),
  insert_notif_suscripcion: (ctx) => ({
    tabla: "notificaciones",
    payload: {
      usuario_id: ctx.usuario_id_destino,
      tipo: "sistema",
      mensaje: ctx.mensaje,
      leida: false,
    },
  }),
  insert_pagos_mp: (ctx) => ({
    tabla: "pagos_mp",
    payload: {
      payment_id: ctx.payment_id,
      usuario_id: ctx.usuario_id_destino,
      paquete: ctx.paquete,
      monto: ctx.monto,
      estado: ctx.estado,
      bits_col: ctx.bits_col,
      bits_cant: ctx.bits_cant,
    },
  }),
};

export async function POST(req: Request) {
  try {
    // 1. Auth admin (Bearer token → es_admin_sistema)
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
    const { fallo_id } = await req.json();
    if (!fallo_id) {
      return NextResponse.json({ error: "fallo_id requerido" }, { status: 400 });
    }

    // 3. Leer el fallo
    const { data: fallo, error: fetchErr } = await supabase
      .from("log_fallos_sistema")
      .select("*")
      .eq("id", fallo_id)
      .single();
    if (fetchErr || !fallo) {
      return NextResponse.json({ error: "Fallo no encontrado" }, { status: 400 });
    }
    if (fallo.estado !== "pendiente") {
      return NextResponse.json({
        error: `Fallo ya está en estado '${fallo.estado}', no se puede reintentar`,
      }, { status: 400 });
    }

    // 4. Whitelist
    const builder = REINSERTABLES[fallo.operacion];
    if (!builder) {
      return NextResponse.json({
        error: `Operación '${fallo.operacion}' no reinsertable por seguridad`,
      }, { status: 400 });
    }

    // 5. Construir payload desde datos_contexto
    const ctx = fallo.datos_contexto || {};
    const { tabla, payload } = builder(ctx);

    // Validar que todos los campos obligatorios están presentes
    // (protege contra fallos viejos guardados antes del enriquecimiento de datos_contexto)
    for (const [k, v] of Object.entries(payload)) {
      if (v === undefined || v === null) {
        return NextResponse.json({
          error: `Campo faltante en datos_contexto para reintento: ${k}`,
        }, { status: 400 });
      }
    }

    // 6. Ejecutar el insert
    const { error: insertErr } = await supabase.from(tabla).insert(payload);
    if (insertErr) {
      // El reintento volvió a fallar. NO marcamos como resuelto.
      // NO registramos un fallo nuevo (evitamos bucle falla-de-falla).
      console.error("[reintentar-fallo] insert falló:", insertErr);
      return NextResponse.json({
        error: `Reintento falló: ${insertErr.message}`,
      }, { status: 500 });
    }

    // 7. Marcar fallo como resuelto
    const now = new Date();
    const fechaStr = now.toISOString().slice(0, 16).replace("T", " ");
    const { error: updErr } = await supabase.from("log_fallos_sistema").update({
      estado: "resuelto",
      resuelto_por: user.id,
      resuelto_at: now.toISOString(),
      resolucion_nota: `Reintento automático exitoso (${fechaStr})`,
    }).eq("id", fallo_id);
    if (updErr) {
      // Insert fue OK pero update del log falló. Avisamos al admin para que marque manual.
      console.error("[reintentar-fallo] update log falló tras insert OK:", updErr);
      return NextResponse.json({
        ok: true,
        operacion: fallo.operacion,
        warning: "Insert exitoso pero no pude marcar el fallo como resuelto. Marcalo manualmente.",
      });
    }

    return NextResponse.json({ ok: true, operacion: fallo.operacion });
  } catch (err: any) {
    console.error("[reintentar-fallo] error:", err);
    return NextResponse.json({ error: err?.message || "Error interno" }, { status: 500 });
  }
}
