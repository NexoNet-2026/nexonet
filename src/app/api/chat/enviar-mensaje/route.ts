import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { emisor_id, receptor_id, texto, anuncio_id, nexo_id, titulo } = await req.json();
    if (!emisor_id || !receptor_id || !texto) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }

    // Leer saldo del emisor
    const { data: w } = await supabase
      .from("usuarios")
      .select("bits, bits_free, bits_promo")
      .eq("id", emisor_id)
      .single();

    if (!w || (w.bits_free + w.bits + w.bits_promo) < 1) {
      return NextResponse.json({
        error: "sin_bits",
        wallet: w || { bits: 0, bits_free: 0, bits_promo: 0 },
      }, { status: 402 });
    }

    // Descontar 1 BIT: bits_free → bits → bits_promo
    let rest = 1;
    const upd: { bits_free?: number; bits?: number; bits_promo?: number } = {};

    if (w.bits_free > 0) {
      const d = Math.min(w.bits_free, rest);
      upd.bits_free = w.bits_free - d;
      rest -= d;
    }
    if (rest > 0 && w.bits > 0) {
      const d = Math.min(w.bits, rest);
      upd.bits = w.bits - d;
      rest -= d;
    }
    if (rest > 0 && w.bits_promo > 0) {
      const d = Math.min(w.bits_promo, rest);
      upd.bits_promo = w.bits_promo - d;
      rest -= d;
    }

    await supabase.from("usuarios").update(upd).eq("id", emisor_id);

    // Insertar mensaje
    const msgData: any = { emisor_id, receptor_id, texto };
    if (anuncio_id) msgData.anuncio_id = anuncio_id;
    await supabase.from("mensajes").insert(msgData);

    // Insertar notificación
    const notifData: any = {
      usuario_id: receptor_id,
      emisor_id,
      tipo: "conexion",
      mensaje: `💬 Nuevo mensaje sobre "${titulo || "un contenido"}"`,
      leida: false,
    };
    if (anuncio_id) notifData.anuncio_id = anuncio_id;
    if (nexo_id) notifData.nexo_id = nexo_id;
    await supabase.from("notificaciones").insert(notifData);

    // Wallet actualizado
    const wallet = {
      bits_free: upd.bits_free ?? w.bits_free,
      bits: upd.bits ?? w.bits,
      bits_promo: upd.bits_promo ?? w.bits_promo,
    };

    return NextResponse.json({ ok: true, wallet });
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
