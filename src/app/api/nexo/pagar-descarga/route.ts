import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { comprador_id, nexo_id, descarga_id, precio_bits } = await req.json();

    // 1) Validar campos
    if (!comprador_id || !nexo_id || !descarga_id || !precio_bits)
      return NextResponse.json({ error: "Faltan campos" }, { status: 400 });

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // 2) Leer saldo del comprador y verificar
    const { data: comprador, error: errComprador } = await supabase
      .from("usuarios")
      .select("bits, bits_gastados_adjuntos")
      .eq("id", comprador_id)
      .single();

    if (errComprador || !comprador)
      return NextResponse.json({ error: "Comprador no encontrado" }, { status: 404 });

    if ((comprador.bits || 0) < precio_bits)
      return NextResponse.json({ error: "Saldo insuficiente" }, { status: 400 });

    // 3) Leer nexo para obtener dueño
    const { data: nexo, error: errNexo } = await supabase
      .from("nexos")
      .select("usuario_id")
      .eq("id", nexo_id)
      .single();

    if (errNexo || !nexo)
      return NextResponse.json({ error: "Nexo no encontrado" }, { status: 404 });

    const duenio_id = nexo.usuario_id;

    // 4) Descontar bits al comprador
    await supabase
      .from("usuarios")
      .update({
        bits: (comprador.bits || 0) - precio_bits,
        bits_gastados_adjuntos: (comprador.bits_gastados_adjuntos || 0) + precio_bits,
      })
      .eq("id", comprador_id);

    // 5) Calcular reparto
    const bitsCreador = Math.floor(precio_bits * 0.9);
    const bitsNexonet = precio_bits - bitsCreador;

    // 6) Acreditar al dueño
    const { data: duenio } = await supabase
      .from("usuarios")
      .select("bits_promo, bits_promotor_total")
      .eq("id", duenio_id)
      .single();

    if (duenio) {
      await supabase
        .from("usuarios")
        .update({
          bits_promo: (duenio.bits_promo || 0) + bitsCreador,
          bits_promotor_total: (duenio.bits_promotor_total || 0) + bitsCreador,
        })
        .eq("id", duenio_id);
    }

    // 7) Notificar al dueño
    await supabase.from("notificaciones").insert({
      usuario_id: duenio_id,
      tipo: "sistema",
      mensaje: `💰 Recibiste ${bitsCreador} BIT Promo por una descarga en tu nexo`,
      leida: false,
    });

    // 8) Comisión en cascada ilimitada por referido_por
    const { data: compradorRef } = await supabase
      .from("usuarios")
      .select("nombre_usuario, nombre")
      .eq("id", comprador_id)
      .single();
    const nombreRef = compradorRef?.nombre_usuario || compradorRef?.nombre || "un usuario";

    let currentId = duenio_id;
    let comisionBase = bitsCreador;
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
      const porcentaje = esNAN ? 0.3 : 0.2;
      const comision = Math.floor(comisionBase * porcentaje);

      if (comision <= 0) break;

      await supabase
        .from("usuarios")
        .update({
          bits_promo: (promotor.bits_promo || 0) + comision,
          bits_promotor_total: (promotor.bits_promotor_total || 0) + comision,
        })
        .eq("id", current.referido_por);

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

    // 9) Insertar en bits_promo_descargas
    await supabase.from("bits_promo_descargas").insert({
      usuario_id: duenio_id,
      duenio_id,
      nexo_id,
      descarga_id,
      bits_recibidos: bitsCreador,
      comprador_id,
    });

    // 10) Insertar en nexo_descargas_pagos
    await supabase.from("nexo_descargas_pagos").insert({
      descarga_id,
      nexo_id,
      comprador_id,
      admin_id: duenio_id,
      duenio_id,
      bits_pagados: precio_bits,
      bits_admin: bitsCreador,
      bits_creador: bitsCreador,
      bits_nexonet: bitsNexonet,
    });

    // 11) Incrementar contador descargas en nexo_descargas y nexo_slider_items
    const { data: descarga } = await supabase
      .from("nexo_descargas")
      .select("descargas")
      .eq("id", descarga_id)
      .single();

    if (descarga) {
      await supabase
        .from("nexo_descargas")
        .update({ descargas: (descarga.descargas || 0) + 1 })
        .eq("id", descarga_id);
    }

    const { data: sliderItem } = await supabase
      .from("nexo_slider_items")
      .select("descargas")
      .eq("descarga_id", descarga_id)
      .single();

    if (sliderItem) {
      await supabase
        .from("nexo_slider_items")
        .update({ descargas: (sliderItem.descargas || 0) + 1 })
        .eq("descarga_id", descarga_id);
    }

    // 12) Respuesta
    return NextResponse.json({
      ok: true,
      bits_cobrados: precio_bits,
      bits_acreditados: bitsCreador,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
