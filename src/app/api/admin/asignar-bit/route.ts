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

    const { error } = await supabase
      .from("usuarios")
      .update({ [columna]: nuevo })
      .eq("id", usuario_id);

    console.log("UPDATE resultado:", error, "columna:", columna, "nuevo:", nuevo, "usuario:", usuario_id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Comisión en cascada ilimitada
    if (cantidad > 0 && (columna === "bits" || columna === "bits_promo")) {
      const { data: refUser } = await supabase.from("usuarios").select("nombre_usuario,nombre").eq("id", usuario_id).single();
      const nombreRef = refUser?.nombre_usuario || refUser?.nombre || "un referido";
      let currentId = usuario_id;
      let comisionBase = cantidad;
      const visitados = new Set<string>();

      while (comisionBase > 0) {
        const { data: current } = await supabase
          .from("usuarios")
          .select("referido_por")
          .eq("id", currentId)
          .single();

        if (!current?.referido_por || visitados.has(current.referido_por)) break;
        visitados.add(current.referido_por);

        const { data: promotor } = await supabase
          .from("usuarios")
          .select("bits_promo, bits_promotor_total, codigo")
          .eq("id", current.referido_por)
          .single();

        if (!promotor) break;

        const esNAN = promotor.codigo === "NAN-5194178";
        const porcentaje = esNAN ? 0.30 : 0.20;
        const comision = Math.floor(comisionBase * porcentaje);

        if (comision <= 0) break;

        await supabase.from("usuarios").update({
          bits_promo: (promotor.bits_promo || 0) + comision,
          bits_promotor_total: (promotor.bits_promotor_total || 0) + comision,
        }).eq("id", current.referido_por);

        const nivel = visitados.size;
        await supabase.from("notificaciones").insert({
          usuario_id: current.referido_por,
          tipo: "sistema",
          mensaje: `⭐ Recibiste ${comision} BIT Promo de comisión por tu referido ${nombreRef}${nivel > 1 ? ` (nivel ${nivel})` : ""}`,
          leida: false,
        });

        comisionBase = comision;
        currentId = current.referido_por;
      }
    }

    const tipoLabel = columna === "bits" ? "Nexo" : columna === "bits_free" ? "Free" : "Promo";
    const msgNot = cantidad > 0
      ? `💰 Recibiste ${Math.abs(cantidad)} BIT ${tipoLabel} desde NexoNet${nota ? ` — ${nota}` : ""}`
      : `💸 Se debitaron ${Math.abs(cantidad)} BIT ${tipoLabel} desde NexoNet${nota ? ` — ${nota}` : ""}`;
    await supabase.from("notificaciones").insert({
      usuario_id,
      tipo: "sistema",
      mensaje: msgNot,
      leida: false,
    });

    return NextResponse.json({ ok: true, nuevo });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
