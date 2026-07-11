import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { esMiembroDeNexo } from "@/lib/nexoAuth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Rate limiting: máximo de mensajes por emisor dentro de la ventana.
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_VENTANA_MS = 60 * 1000; // 1 minuto

export async function POST(req: Request) {
  try {
    const { emisor_id, receptor_id, texto, anuncio_id, nexo_id, titulo } = await req.json();
    if (!emisor_id || !receptor_id || !texto) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }

    // El mensaje tiene que pertenecer a un anuncio o a un nexo (contexto obligatorio)
    if (!anuncio_id && !nexo_id) {
      return NextResponse.json({ error: "Falta contexto (anuncio o nexo)" }, { status: 400 });
    }

    // Validar que el emisor pertenece a la conversación
    if (anuncio_id) {
      // El chat de anuncio es entre el dueño del anuncio y un interesado:
      // el emisor tiene que ser una de esas dos partes.
      const { data: anuncio } = await supabase
        .from("anuncios")
        .select("usuario_id")
        .eq("id", anuncio_id)
        .single();
      if (!anuncio) {
        return NextResponse.json({ error: "Anuncio inexistente" }, { status: 404 });
      }
      const dueno = anuncio.usuario_id;
      if (emisor_id !== dueno && receptor_id !== dueno) {
        return NextResponse.json({ error: "No autorizado" }, { status: 403 });
      }
    } else {
      // Chat de nexo: el emisor tiene que ser miembro del nexo
      if (!(await esMiembroDeNexo(supabase, emisor_id, nexo_id))) {
        return NextResponse.json({ error: "No autorizado" }, { status: 403 });
      }
    }

    // Rate limiting: no más de RATE_LIMIT_MAX mensajes por minuto por emisor.
    // Se cuenta contra la tabla mensajes (compartido entre instancias serverless).
    const desde = new Date(Date.now() - RATE_LIMIT_VENTANA_MS).toISOString();
    const { count: recientes } = await supabase
      .from("mensajes")
      .select("*", { count: "exact", head: true })
      .eq("emisor_id", emisor_id)
      .gte("created_at", desde);
    if ((recientes ?? 0) >= RATE_LIMIT_MAX) {
      return NextResponse.json(
        { error: "rate_limit", detalle: "Demasiados mensajes. Esperá un momento." },
        { status: 429 }
      );
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
