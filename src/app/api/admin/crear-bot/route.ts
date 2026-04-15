import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { randomBytes } from "crypto";

export async function POST(req: Request) {
  try {
    const { nombre, tipo, subtipo, descripcion, avatar_url, banner_url } = await req.json();

    if (!nombre || !tipo) {
      return NextResponse.json({ error: "nombre y tipo son requeridos" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const slug = String(nombre).toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9\-]/g, "");
    const sufijo = randomBytes(3).toString("hex");
    const email = `${slug}-${sufijo}@bot.nexonet.ar`;
    const password = randomBytes(16).toString("hex");

    // 1. Crear auth user
    const { data: authUser, error: authErr } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { es_bot: true, nombre_usuario: nombre },
    });

    if (authErr || !authUser?.user) {
      return NextResponse.json({ error: authErr?.message || "Error creando auth user" }, { status: 500 });
    }

    const bot_id = authUser.user.id;

    // 2. Insertar en usuarios
    const { error: errUser } = await supabase.from("usuarios").insert({
      id: bot_id,
      email,
      nombre_usuario: nombre,
      nombre,
      es_bot: true,
      bot_activo: true,
      plan: "nexoempresa",
      bits: 99999,
      bits_free: 99999,
      avatar_url: avatar_url || null,
    });

    if (errUser) {
      await supabase.auth.admin.deleteUser(bot_id);
      return NextResponse.json({ error: `usuarios: ${errUser.message}` }, { status: 500 });
    }

    // 3. Crear nexo o anuncio según tipo
    const esAnuncio = tipo === "anuncio" || tipo === "trabajo";

    if (esAnuncio) {
      const { data: anuncio, error: errAn } = await supabase
        .from("anuncios")
        .insert({
          usuario_id: bot_id,
          tipo,
          titulo: nombre,
          descripcion: descripcion || null,
          avatar_url: avatar_url || null,
          banner_url: banner_url || null,
          estado: "activo",
        })
        .select("id")
        .single();

      if (errAn || !anuncio) {
        await supabase.from("usuarios").delete().eq("id", bot_id);
        await supabase.auth.admin.deleteUser(bot_id);
        return NextResponse.json({ error: `anuncios: ${errAn?.message || "desconocido"}` }, { status: 500 });
      }

      return NextResponse.json({ ok: true, bot_id, anuncio_id: anuncio.id, email });
    }

    const { data: nexo, error: errNexo } = await supabase
      .from("nexos")
      .insert({
        usuario_id: bot_id,
        tipo,
        subtipo: subtipo || null,
        titulo: nombre,
        descripcion: descripcion || null,
        avatar_url: avatar_url || null,
        banner_url: banner_url || null,
        estado: "activo",
      })
      .select("id")
      .single();

    if (errNexo || !nexo) {
      await supabase.from("usuarios").delete().eq("id", bot_id);
      await supabase.auth.admin.deleteUser(bot_id);
      return NextResponse.json({ error: `nexos: ${errNexo?.message || "desconocido"}` }, { status: 500 });
    }

    // 4. Si es grupo, insertar en nexo_miembros
    if (tipo === "grupo") {
      const { error: errMiembro } = await supabase.from("nexo_miembros").insert({
        nexo_id: nexo.id,
        usuario_id: bot_id,
        rol: "creador",
        estado: "activo",
      });
      if (errMiembro) {
        console.error("[crear-bot] nexo_miembros fallo (no crítico):", errMiembro);
      }

      const { error: errAdmin } = await supabase.from("nexo_miembros").insert({
        nexo_id: nexo.id,
        usuario_id: "f9b23e04-c591-44bf-9efb-51966c30a083",
        rol: "admin",
        estado: "activo",
      });
      if (errAdmin) {
        console.error("[crear-bot] nexo_miembros admin fallo (no crítico):", errAdmin);
      }
    }

    return NextResponse.json({ ok: true, bot_id, nexo_id: nexo.id, email });
  } catch (e: any) {
    console.error("[crear-bot] catch:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
