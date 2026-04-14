import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { usuario_id } = await req.json();
    if (!usuario_id) return NextResponse.json({ error: "usuario_id requerido" }, { status: 400 });

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // 1. Limpiar anuncios y sus dependencias
    const { data: anunciosUser } = await supabase.from("anuncios").select("id").eq("usuario_id", usuario_id);
    if (anunciosUser?.length) {
      const ids = anunciosUser.map(a => a.id);
      await supabase.from("anuncio_visitas").delete().in("anuncio_id", ids);
      await supabase.from("busqueda_matches").delete().in("anuncio_id", ids);
    }
    await supabase.from("anuncios").delete().eq("usuario_id", usuario_id);

    // 2. Limpiar nexos y sus dependencias
    const { data: nexosUser } = await supabase.from("nexos").select("id").eq("usuario_id", usuario_id);
    if (nexosUser?.length) {
      const ids = nexosUser.map(n => n.id);
      await supabase.from("nexo_mensajes").delete().in("nexo_id", ids);
      await supabase.from("nexo_miembros").delete().in("nexo_id", ids);
      await supabase.from("nexo_visitas").delete().in("nexo_id", ids);
      await supabase.from("nexo_slider_items").delete().in("nexo_id", ids);
      await supabase.from("nexo_sliders").delete().in("nexo_id", ids);
      await supabase.from("nexo_descargas_pagos").delete().in("nexo_id", ids);
      await supabase.from("nexo_descargas").delete().in("nexo_id", ids);
      await supabase.from("nexos").delete().eq("usuario_id", usuario_id);
    }

    // 3. Limpiar resto de tablas relacionadas al usuario
    const tablas = [
      "notificaciones",
      "mensajes",
      "push_suscripciones",
      "nexo_miembros",
      "log_bits_internos",
      "busquedas_automaticas",
      "busqueda_matches",
      "insignias_reputacion",
      "comisiones_promotor",
      "pagos_mp",
      "sesiones_log",
      "usuarios_conectados",
      "anuncio_visitas",
      "nexo_visitas",
      "bits_promo_descargas",
      "contactos_nexonet",
      "socios_comerciales",
      "conexiones",
      "conexiones_nexo",
      "suscripciones_mp",
      "usuarios_mp_tokens",
    ];
    for (const tabla of tablas) {
      await supabase.from(tabla).delete().eq("usuario_id", usuario_id);
    }

    // También limpiar mensajes donde es emisor o receptor
    await supabase.from("mensajes").delete().eq("emisor_id", usuario_id);
    await supabase.from("mensajes").delete().eq("receptor_id", usuario_id);
    await supabase.from("notificaciones").delete().eq("emisor_id", usuario_id);
    await supabase.from("comisiones_promotor").delete().eq("promotor_id", usuario_id);
    await supabase.from("comisiones_promotor").delete().eq("origen_id", usuario_id);
    await supabase.from("conexiones").delete().eq("vendedor_id", usuario_id);
    await supabase.from("conexiones_nexo").delete().eq("vendedor_id", usuario_id);
    await supabase.from("insignias_reputacion").delete().eq("receptor_id", usuario_id);
    await supabase.from("insignias_reputacion").delete().eq("emisor_id", usuario_id);

    // 4. Eliminar de tabla usuarios
    await supabase.from("usuarios").delete().eq("id", usuario_id);

    // 5. Eliminar de auth.users
    const { error: authError } = await supabase.auth.admin.deleteUser(usuario_id);

    if (authError && !authError.message.includes("not found")) {
      return NextResponse.json({ error: authError.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("Error en eliminar-usuario:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
