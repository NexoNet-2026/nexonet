import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { usuario_id } = await req.json();
    if (!usuario_id) return NextResponse.json({ error: "Falta usuario_id" }, { status: 400 });

    // Limpiar datos relacionados
    await supabase.from("notificaciones").delete().eq("usuario_id", usuario_id);
    await supabase.from("nexo_miembros").delete().eq("usuario_id", usuario_id);
    await supabase.from("anuncios").delete().eq("usuario_id", usuario_id);
    await supabase.from("nexo_slider_items").delete().eq("publicado_por", usuario_id);
    await supabase.from("nexos").delete().eq("usuario_id", usuario_id);
    await supabase.from("log_bits_internos").delete().eq("usuario_id", usuario_id);
    await supabase.from("push_suscripciones").delete().eq("usuario_id", usuario_id);
    await supabase.from("usuarios").delete().eq("id", usuario_id);

    // Eliminar de Supabase Auth
    await supabase.auth.admin.deleteUser(usuario_id);

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
