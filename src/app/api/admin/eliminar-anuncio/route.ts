import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-server";

export async function POST(req: Request) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) return auth.response;
    const { supabase } = auth;

    const { anuncio_id } = await req.json();
    if (!anuncio_id) return NextResponse.json({ error: "anuncio_id requerido" }, { status: 400 });

    await supabase.from("anuncio_visitas").delete().eq("anuncio_id", anuncio_id);
    await supabase.from("busqueda_matches").delete().eq("anuncio_id", anuncio_id);
    await supabase.from("mensajes").delete().eq("anuncio_id", anuncio_id);
    await supabase.from("notificaciones").delete().eq("anuncio_id", anuncio_id);

    const { error } = await supabase.from("anuncios").delete().eq("id", anuncio_id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
