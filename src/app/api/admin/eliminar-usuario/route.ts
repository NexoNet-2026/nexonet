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

    // Limpiar dependencias en orden
    await supabase.from("notificaciones").delete().eq("usuario_id", usuario_id);
    await supabase.from("push_suscripciones").delete().eq("usuario_id", usuario_id);
    await supabase.from("nexo_miembros").delete().eq("usuario_id", usuario_id);
    await supabase.from("log_bits_internos").delete().eq("usuario_id", usuario_id);
    await supabase.from("busquedas_automaticas").delete().eq("usuario_id", usuario_id);
    await supabase.from("insignias_reputacion").delete().eq("usuario_id", usuario_id);
    await supabase.from("anuncios").delete().eq("usuario_id", usuario_id);

    // Limpiar nexos y sus dependencias
    const { data: nexosUser } = await supabase.from("nexos").select("id").eq("usuario_id", usuario_id);
    if (nexosUser?.length) {
      const ids = nexosUser.map(n => n.id);
      await supabase.from("nexo_mensajes").delete().in("nexo_id", ids);
      await supabase.from("nexo_miembros").delete().in("nexo_id", ids);
      await supabase.from("nexo_slider_items").delete().in("nexo_id", ids);
      await supabase.from("nexo_sliders").delete().in("nexo_id", ids);
      await supabase.from("nexo_descargas_pagos").delete().in("nexo_id", ids);
      await supabase.from("nexo_descargas").delete().in("nexo_id", ids);
      await supabase.from("nexos").delete().eq("usuario_id", usuario_id);
    }

    // Eliminar de tabla usuarios
    await supabase.from("usuarios").delete().eq("id", usuario_id);

    // Eliminar de auth.users
    const { error: authError } = await supabase.auth.admin.deleteUser(usuario_id);
    if (authError) {
      console.error("Error eliminando de auth:", authError);
      return NextResponse.json({ error: authError.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("Error en eliminar-usuario:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
