// src/app/api/nexos/notificar-cv-visto/route.ts
// Notifica al dueño de un trabajo que un reclutador cerró el modal del CV
// sin enviar mensaje. Solo dispara para tipo='trabajo' y verifica que exista
// una fila en conexiones_nexo (sanity check contra abuso).
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { logFallo } from "@/lib/log-fallos";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

export async function POST(req: Request) {
  try {
    // Auth Bearer — cualquier usuario autenticado, pero el usuario_id del body
    // debe coincidir con la sesión (evita spam usando UUIDs ajenos)
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
    if (!token) {
      return NextResponse.json({ error: "Falta token de autorización" }, { status: 401 });
    }
    const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data: { user }, error: authErr } = await supabaseAuth.auth.getUser(token);
    if (authErr || !user) {
      return NextResponse.json({ error: "Sesión inválida" }, { status: 401 });
    }

    const { nexo_id, usuario_id } = await req.json();
    if (!nexo_id || !usuario_id) {
      return NextResponse.json({ error: "nexo_id y usuario_id son requeridos" }, { status: 400 });
    }
    if (user.id !== usuario_id) {
      return NextResponse.json({ error: "Usuario no coincide con sesión" }, { status: 403 });
    }

    // 1. Leer nexo
    const { data: nexo, error: nexoErr } = await supabase
      .from("nexos")
      .select("id, usuario_id, tipo, titulo")
      .eq("id", nexo_id)
      .single();
    if (nexoErr || !nexo) {
      return NextResponse.json({ error: "Nexo no encontrado" }, { status: 404 });
    }

    // 2. Solo para trabajos — protege contra disparos erróneos
    if (nexo.tipo !== "trabajo") {
      return NextResponse.json({ ok: true, skipped: true });
    }

    // 3. Sanity check: el usuario debe haber conectado realmente
    const { data: conexion } = await supabase
      .from("conexiones_nexo")
      .select("id")
      .eq("nexo_id", nexo_id)
      .eq("usuario_id", usuario_id)
      .maybeSingle();
    if (!conexion) {
      return NextResponse.json({ ok: false, error: "No conectado" }, { status: 403 });
    }

    // 4. Leer nombre del reclutador
    const { data: visor } = await supabase
      .from("usuarios")
      .select("nombre_usuario")
      .eq("id", usuario_id)
      .single();
    const nombreVisor = visor?.nombre_usuario || "Un usuario";

    // 5. Insertar notificación al dueño del trabajo
    const mensaje = `📎 ${nombreVisor} vio tu CV en "${nexo.titulo}"`;
    const { error: notifErr } = await supabase.from("notificaciones").insert({
      usuario_id: nexo.usuario_id,
      emisor_id: usuario_id,
      tipo: "sistema",
      nexo_id,
      leida: false,
      mensaje,
    });
    if (notifErr) {
      await logFallo({
        severidad: "advertencia",
        contexto: "notificar-cv-visto",
        operacion: "insert_notif_cv_visto",
        usuario_id: nexo.usuario_id,
        datos_contexto: { nexo_id, visor_id: usuario_id, mensaje, error: notifErr },
        error_mensaje: notifErr.message,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[notificar-cv-visto] error:", err);
    return NextResponse.json({ error: err?.message || "Error interno" }, { status: 500 });
  }
}
