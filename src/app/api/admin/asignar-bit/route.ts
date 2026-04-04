import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { usuario_id, columna, cantidad, nota } = await req.json();
    console.log("ASIGNAR-BIT REQUEST:", { usuario_id, columna, cantidad });
    if (!usuario_id || !columna || cantidad === undefined)
      return NextResponse.json({ error: "Faltan campos" }, { status: 400 });

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data: u, error: fetchError } = await supabase
      .from("usuarios")
      .select("bits,bits_free,bits_promo")
      .eq("id", usuario_id)
      .single();

    if (fetchError || !u) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

    const actual = u[columna as keyof typeof u] as number || 0;
    const nuevo = Math.max(0, actual + cantidad);
    const bits_saldo = Math.max(0, (u.bits||0) + (u.bits_free||0) + (u.bits_promo||0) + cantidad);

    const { error } = await supabase
      .from("usuarios")
      .update({ [columna]: nuevo, bits_saldo })
      .eq("id", usuario_id);

    console.log("UPDATE resultado:", error, "columna:", columna, "nuevo:", nuevo, "usuario:", usuario_id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Buscar si el usuario tiene referido_por
    const { data: usuarioData } = await supabase
      .from("usuarios")
      .select("referido_por")
      .eq("id", usuario_id)
      .single();

    if (usuarioData?.referido_por && cantidad > 0 && (columna === "bits" || columna === "bits_promo")) {
      const { data: promotor } = await supabase
        .from("usuarios")
        .select("bits_promo, bits_promotor_total, codigo")
        .eq("id", usuarioData.referido_por)
        .single();

      if (promotor) {
        const esNAN = promotor.codigo === "NAN-5194178";
        const porcentaje = esNAN ? 0.30 : 0.20;
        const comision = Math.floor(cantidad * porcentaje);

        await supabase.from("usuarios").update({
          bits_promo: (promotor.bits_promo || 0) + comision,
          bits_promotor_total: (promotor.bits_promotor_total || 0) + comision,
        }).eq("id", usuarioData.referido_por);

        await supabase.from("notificaciones").insert({
          usuario_id: usuarioData.referido_por,
          tipo: "sistema",
          mensaje: `⭐ Recibiste ${comision} BIT Promo de comisión por tu referido`,
          leida: false,
        });
      }
    }

    if (nota) {
      await supabase.from("notificaciones").insert({
        usuario_id,
        tipo: "sistema",
        mensaje: `${cantidad > 0 ? "💰 Recibiste" : "💸 Se debitaron"} ${Math.abs(cantidad)} ${columna.replace("_"," ").toUpperCase()}${nota ? ` — ${nota}` : ""}`,
        leida: false,
      });
    }

    return NextResponse.json({ ok: true, nuevo, bits_saldo });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
