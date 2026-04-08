import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { miembro_id, aprobado_por, nexo_id, usuario_id, mensaje } = await req.json();
    if (!miembro_id || !aprobado_por || !nexo_id || !usuario_id) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }

    await supabase.from("nexo_miembros")
      .update({ rol: "admin_pago_pendiente", aprobado_por })
      .eq("id", miembro_id);

    const { data: nexo } = await supabase.from("nexos").select("titulo").eq("id", nexo_id).single();
    const titulo = nexo?.titulo || "un nexo";

    await supabase.from("notificaciones").insert({
      usuario_id,
      tipo: "solicitud_admin",
      nexo_id,
      mensaje: `⭐ Fuiste aprobado como admin en "${titulo}". Pagá 500 BIT para confirmar.${mensaje ? ` — ${mensaje}` : ""}`,
      leida: false,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
