import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const COSTO = 500;
const COMISION_CREADOR = 100;

export async function POST(req: Request) {
  try {
    const { nexo_id, slider_id, link, usuario_id } = await req.json();
    if (!nexo_id || !slider_id || !link || !usuario_id) {
      return NextResponse.json({ error: "Faltan campos" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const linkStr = String(link).trim();
    const mNexo = linkStr.match(/\/nexo\/([^/?#\s]+)/);
    const mAnuncio = linkStr.match(/\/anuncios\/([^/?#\s]+)/);
    const esNexo = !!mNexo;
    const refId = (mNexo?.[1] || mAnuncio?.[1] || linkStr).trim();
    if (!refId) return NextResponse.json({ error: "Link inválido" }, { status: 400 });

    let titulo = "", descripcion: string | null = null, miniatura: string | null = null, fuenteId: string | number = refId;

    if (esNexo) {
      const { data: nexo, error: errN } = await supabase
        .from("nexos")
        .select("id, titulo, descripcion, avatar_url, estado")
        .eq("id", refId)
        .maybeSingle();
      if (errN) return NextResponse.json({ error: errN.message }, { status: 500 });
      if (!nexo) return NextResponse.json({ error: "Nexo no encontrado" }, { status: 404 });
      titulo = nexo.titulo;
      descripcion = nexo.descripcion || null;
      miniatura = nexo.avatar_url || null;
      fuenteId = nexo.id;
    } else {
      const { data: anuncio, error: errAn } = await supabase
        .from("anuncios")
        .select("id, titulo, descripcion, imagenes, usuario_id")
        .eq("id", refId)
        .maybeSingle();
      if (errAn) return NextResponse.json({ error: errAn.message }, { status: 500 });
      if (!anuncio) return NextResponse.json({ error: "Anuncio no encontrado" }, { status: 404 });
      titulo = anuncio.titulo;
      descripcion = anuncio.descripcion || null;
      miniatura = Array.isArray(anuncio.imagenes) && anuncio.imagenes.length > 0 ? anuncio.imagenes[0] : null;
      fuenteId = anuncio.id;
    }

    const itemTipo = esNexo ? "nexo" : "anuncio";

    const { data: miembro, error: errM } = await supabase
      .from("nexo_miembros")
      .select("id, rol, estado")
      .eq("nexo_id", nexo_id)
      .eq("usuario_id", usuario_id)
      .eq("estado", "activo")
      .maybeSingle();
    if (errM) return NextResponse.json({ error: errM.message }, { status: 500 });
    if (!miembro) return NextResponse.json({ error: "No sos miembro activo del nexo" }, { status: 403 });

    const { data: existente } = await supabase
      .from("nexo_slider_items")
      .select("id")
      .eq("slider_id", slider_id)
      .eq("tipo", itemTipo)
      .eq("url", String(fuenteId))
      .maybeSingle();
    if (existente) return NextResponse.json({ error: "Ese ítem ya está en el slider" }, { status: 409 });

    const { data: usuario, error: errU } = await supabase
      .from("usuarios")
      .select("bits, bits_free, bits_promo")
      .eq("id", usuario_id)
      .single();
    if (errU || !usuario) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

    const bits_free = usuario.bits_free || 0;
    const bits = usuario.bits || 0;
    const bits_promo = usuario.bits_promo || 0;
    if (bits_free + bits + bits_promo < COSTO) {
      return NextResponse.json({ error: "No tenés BITs suficientes" }, { status: 402 });
    }

    let rFree = bits_free, rBits = bits, rPromo = bits_promo, restante = COSTO;
    const tomar = (disp: number) => { const t = Math.min(disp, restante); restante -= t; return disp - t; };
    rFree = tomar(rFree);
    if (restante > 0) rBits = tomar(rBits);
    if (restante > 0) rPromo = tomar(rPromo);

    const { error: errUpd } = await supabase
      .from("usuarios")
      .update({ bits_free: rFree, bits: rBits, bits_promo: rPromo })
      .eq("id", usuario_id);
    if (errUpd) return NextResponse.json({ error: `cobro: ${errUpd.message}` }, { status: 500 });

    const { data: creador } = await supabase
      .from("nexo_miembros")
      .select("usuario_id")
      .eq("nexo_id", nexo_id)
      .eq("rol", "creador")
      .eq("estado", "activo")
      .maybeSingle();

    if (creador?.usuario_id) {
      const { data: uCre } = await supabase
        .from("usuarios")
        .select("bits_promo")
        .eq("id", creador.usuario_id)
        .single();
      if (uCre) {
        await supabase
          .from("usuarios")
          .update({ bits_promo: (uCre.bits_promo || 0) + COMISION_CREADOR })
          .eq("id", creador.usuario_id);
      }
    }

    const { data: item, error: errIns } = await supabase
      .from("nexo_slider_items")
      .insert({
        slider_id,
        tipo: itemTipo,
        url: String(fuenteId),
        titulo,
        descripcion,
        miniatura_url: miniatura,
      })
      .select("id, titulo, descripcion, miniatura_url, url, tipo")
      .single();

    if (errIns || !item) {
      return NextResponse.json({ error: `insert: ${errIns?.message || "desconocido"}` }, { status: 500 });
    }

    if (creador?.usuario_id && creador.usuario_id !== usuario_id) {
      await supabase.from("notificaciones").insert({
        usuario_id: creador.usuario_id,
        tipo: "sistema",
        leida: false,
        mensaje: `Un miembro agregó un ${itemTipo} al slider de tu grupo. +${COMISION_CREADOR} BIT Promo.`,
        nexo_id,
        anuncio_id: esNexo ? null : fuenteId,
        emisor_id: usuario_id,
      });
    }

    return NextResponse.json({ ok: true, item });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
