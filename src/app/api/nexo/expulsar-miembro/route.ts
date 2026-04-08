import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { nexo_id, miembro_id, usuario_id, accion, motivo } = await req.json();
    if (!nexo_id || !miembro_id || !usuario_id || !accion) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }
    if (accion !== "expulsado" && accion !== "bloqueado") {
      return NextResponse.json({ error: "Acción inválida" }, { status: 400 });
    }

    await supabase.from("nexo_miembros").update({ estado: accion }).eq("id", miembro_id);

    // Acreditar 500 BIT Promo como reembolso
    const { data: usuario } = await supabase.from("usuarios").select("bits_promo, bits_promotor_total").eq("id", usuario_id).single();
    if (usuario) {
      await supabase.from("usuarios").update({
        bits_promo: (usuario.bits_promo || 0) + 500,
        bits_promotor_total: (usuario.bits_promotor_total || 0) + 500,
      }).eq("id", usuario_id);
    }

    const { data: nexo } = await supabase.from("nexos").select("titulo").eq("id", nexo_id).single();
    const label = accion === "expulsado" ? "expulsado/a" : "bloqueado/a";
    const msg = `🚫 Fuiste ${label} de "${nexo?.titulo || "un nexo"}". Se te acreditaron 500 BIT Promo como reembolso.${motivo ? ` — Motivo: ${motivo}` : ""}`;

    await supabase.from("notificaciones").insert({
      usuario_id,
      tipo: "sistema",
      nexo_id,
      mensaje: msg,
      leida: false,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
