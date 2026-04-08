import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { usuario_id, nexo_id, nexo_titulo, motivo, creador_id } = await req.json();
    if (!usuario_id || !nexo_id || !creador_id) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }

    const { data: usuario } = await supabase.from("usuarios").select("nombre_usuario").eq("id", usuario_id).single();
    const nombre = usuario?.nombre_usuario || "Un usuario";
    const motivoTexto = motivo || "Sin motivo";

    // Insertar en contactos_nexonet
    await supabase.from("contactos_nexonet").insert({
      usuario_id,
      tipo: "reclamo",
      mensaje: `Baja de grupo: ${nexo_titulo}. Motivo: ${motivoTexto}`,
      estado: "pendiente",
    });

    // Notificar al creador del nexo
    await supabase.from("notificaciones").insert({
      usuario_id: creador_id,
      tipo: "sistema",
      nexo_id,
      mensaje: `🚪 ${nombre} solicitó la baja de "${nexo_titulo}".${motivo ? ` Motivo: ${motivo}` : ""}`,
      leida: false,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
