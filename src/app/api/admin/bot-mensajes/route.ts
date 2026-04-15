import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

function client() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function GET() {
  try {
    const supabase = client();

    const { data: msgs, error } = await supabase
      .from("bot_mensajes")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const ids = Array.from(
      new Set((msgs || []).flatMap((m: any) => [m.bot_id, m.usuario_id]).filter(Boolean))
    );

    let byId: Record<string, any> = {};
    if (ids.length) {
      const { data: users } = await supabase
        .from("usuarios")
        .select("id, nombre_usuario, avatar_url")
        .in("id", ids);
      byId = Object.fromEntries((users || []).map((u: any) => [u.id, u]));
    }

    const enriched = (msgs || []).map((m: any) => ({
      ...m,
      bot: byId[m.bot_id] || null,
      usuario: byId[m.usuario_id] || null,
    }));

    return NextResponse.json({ mensajes: enriched });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { mensaje_id, respuesta, bot_id } = await req.json();
    if (!mensaje_id || !respuesta?.trim() || !bot_id) {
      return NextResponse.json({ error: "mensaje_id, respuesta y bot_id requeridos" }, { status: 400 });
    }

    const supabase = client();

    const { data: msg, error: errMsg } = await supabase
      .from("bot_mensajes")
      .select("usuario_id")
      .eq("id", mensaje_id)
      .single();

    if (errMsg || !msg) return NextResponse.json({ error: "Mensaje no encontrado" }, { status: 404 });

    const { error: errUpd } = await supabase
      .from("bot_mensajes")
      .update({
        respuesta,
        respondido: true,
        respondido_at: new Date().toISOString(),
      })
      .eq("id", mensaje_id);

    if (errUpd) return NextResponse.json({ error: errUpd.message }, { status: 500 });

    const { data: bot } = await supabase
      .from("usuarios")
      .select("nombre_usuario")
      .eq("id", bot_id)
      .single();

    await supabase.from("notificaciones").insert({
      usuario_id: msg.usuario_id,
      emisor_id: bot_id,
      tipo: "bot_respuesta",
      mensaje: `💬 ${bot?.nombre_usuario || "Bot"} te respondió: ${String(respuesta).slice(0, 120)}${respuesta.length > 120 ? "…" : ""}`,
      leida: false,
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
