import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, email, nombre, nombre_usuario, whatsapp, codigo, codigo_promotor_ref, referido_por, socio_regional_id } = body;
    if (!id || !email || !nombre_usuario) return NextResponse.json({ error: "Faltan campos" }, { status: 400 });

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data: codigoData, error: rpcError } = await supabase.rpc("generar_codigo_usuario");
    if (rpcError) return NextResponse.json({ error: rpcError.message }, { status: 500 });

    // El upsert con onConflict:"email" resuelve el reintento de forma atómica:
    // si ya existe una fila con ese email la actualiza en lugar de duplicar,
    // sin el DELETE+INSERT previo que abría una race condition y podía perder
    // referidos ya vinculados.
    const { error } = await supabase.from("usuarios").upsert({
      id, email,
      nombre: nombre || null,
      nombre_usuario,
      whatsapp: whatsapp || null,
      codigo: codigo || codigoData,
      codigo_promotor_ref: codigo_promotor_ref || null,
      referido_por: referido_por || null,
      socio_regional_id: socio_regional_id || null,
      bits_free: 3000,
      bits_free_fecha: new Date().toISOString(),
    }, { onConflict: "email", ignoreDuplicates: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true, codigo: codigoData });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
