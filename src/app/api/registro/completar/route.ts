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

    // Si ya existe en usuarios con ese email, eliminar para permitir reintento limpio
    await supabase.from("usuarios").delete().eq("email", email);

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

    // Acreditar BIT al promotor referidor
    if (referido_por) {
      const bits = referido_por === "ab56253d-b92e-4b73-a19a-3cd0cd95c458" ? 1500 : 1000;
      const { data: promotor } = await supabase.from("usuarios").select("bits_promotor,bits_promotor_total").eq("id", referido_por).single();
      if (promotor) {
        await supabase.from("usuarios").update({
          bits_promotor: (promotor.bits_promotor || 0) + bits,
          bits_promotor_total: (promotor.bits_promotor_total || 0) + bits,
          es_promotor: true,
        }).eq("id", referido_por);
      }
    }

    return NextResponse.json({ ok: true, codigo: codigoData });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
