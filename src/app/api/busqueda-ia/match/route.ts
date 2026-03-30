import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { busqueda_id, usuario_id } = await req.json();
    if (!busqueda_id || !usuario_id) return NextResponse.json({ error: "Faltan datos" }, { status: 400 });

    // Traer búsqueda
    const { data: b } = await supabase.from("busquedas_automaticas").select("*").eq("id", busqueda_id).single();
    if (!b) return NextResponse.json({ error: "Búsqueda no encontrada" }, { status: 404 });

    // Traer saldo BIT del usuario
    const { data: u } = await supabase.from("usuarios").select("bits,bits_free,bits_promo").eq("id", usuario_id).single();
    if (!u) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    const saldoTotal = (u.bits||0) + (u.bits_free||0) + (u.bits_promo||0);
    if (saldoTotal <= 0) return NextResponse.json({ error: "Sin BIT disponibles" }, { status: 400 });

    // Buscar publicaciones según tipo
    let matchesFinal: any[] = [];

    if (b.tipo_nexo === "anuncio" || !b.tipo_nexo) {
      // Buscar en anuncios
      let query = supabase.from("anuncios").select("id,titulo,precio,moneda,ciudad,provincia,usuario_id,created_at")
        .eq("estado", "activo");

      if (b.subrubro_id) query = query.eq("subrubro_id", b.subrubro_id);
      if (b.precio_min)  query = query.gte("precio", b.precio_min);
      if (b.precio_max)  query = query.lte("precio", b.precio_max);
      if (b.ciudad)      query = query.ilike("ciudad", `%${b.ciudad}%`);
      if (b.provincia)   query = query.ilike("provincia", `%${b.provincia}%`);
      if (b.moneda)      query = query.eq("moneda", b.moneda);
      if (b.keywords) {
        const words = b.keywords.trim().split(/\s+/);
        for (const w of words) query = query.ilike("titulo", `%${w}%`);
      }

      const { data: yaMatcheados } = await supabase.from("busqueda_matches")
        .select("anuncio_id").eq("busqueda_id", busqueda_id);
      const excluir = (yaMatcheados||[]).map((m:any) => m.anuncio_id);
      if (excluir.length > 0) query = query.not("id", "in", `(${excluir.join(",")})`);
      query = query.neq("usuario_id", usuario_id);

      const { data: anuncios } = await query.limit(20);
      matchesFinal = anuncios || [];

    } else {
      // Buscar en nexos (empresa, servicio, grupo, trabajo)
      let query = supabase.from("nexos").select("id,titulo,precio,moneda,ciudad,provincia,usuario_id,created_at,tipo")
        .eq("estado", "activo")
        .eq("tipo", b.tipo_nexo);

      if (b.ciudad)    query = query.ilike("ciudad", `%${b.ciudad}%`);
      if (b.provincia) query = query.ilike("provincia", `%${b.provincia}%`);
      if (b.keywords) {
        const words = b.keywords.trim().split(/\s+/);
        for (const w of words) query = query.ilike("titulo", `%${w}%`);
      }

      const { data: yaMatcheados } = await supabase.from("busqueda_matches")
        .select("anuncio_id").eq("busqueda_id", busqueda_id);
      const excluir = (yaMatcheados||[]).map((m:any) => m.anuncio_id);
      if (excluir.length > 0) query = query.not("id", "in", `(${excluir.join(",")})`);
      query = query.neq("usuario_id", usuario_id);

      const { data: nexos } = await query.limit(20);
      matchesFinal = nexos || [];
    }

    if (matchesFinal.length === 0) return NextResponse.json({ matches: [], bits_consumidos: 0 });

    // Limitar por saldo disponible
    const matchesPosibles = Math.min(matchesFinal.length, saldoTotal);
    matchesFinal = matchesFinal.slice(0, matchesPosibles);
    const bitsAConsumir = matchesFinal.length;

    // Insertar matches
    const inserts = matchesFinal.map((a:any) => ({
      busqueda_id, usuario_id, anuncio_id: a.id, bits_consumidos: 1,
    }));
    await supabase.from("busqueda_matches").insert(inserts);

    // Descontar BIT al usuario (primero promo, luego nexo, luego free)
    let restante = bitsAConsumir;
    const updUser: any = {};
    if ((u.bits_promo||0) > 0) {
      const desc = Math.min(restante, u.bits_promo||0);
      updUser.bits_promo = (u.bits_promo||0) - desc;
      restante -= desc;
    }
    if (restante > 0 && (u.bits||0) > 0) {
      const desc = Math.min(restante, u.bits||0);
      updUser.bits = (u.bits||0) - desc;
      restante -= desc;
    }
    if (restante > 0 && (u.bits_free||0) > 0) {
      const desc = Math.min(restante, u.bits_free||0);
      updUser.bits_free = (u.bits_free||0) - desc;
    }
    updUser.bits_gastados_busquedas = ((await supabase.from("usuarios").select("bits_gastados_busquedas").eq("id",usuario_id).single()).data?.bits_gastados_busquedas||0) + bitsAConsumir;
    await supabase.from("usuarios").update(updUser).eq("id", usuario_id);

    // Actualizar contador de notificaciones de la búsqueda
    await supabase.from("busquedas_automaticas").update({
      notificaciones_recibidas: (b.notificaciones_recibidas||0) + bitsAConsumir,
    }).eq("id", busqueda_id);

    // Obtener datos del buscador
    const { data: buscador } = await supabase.from("usuarios")
      .select("nombre_usuario, codigo, ciudad, provincia")
      .eq("id", usuario_id).single();
    const nombreBuscador = buscador?.nombre_usuario || "Un usuario";
    const ubicBuscador = [buscador?.ciudad, buscador?.provincia].filter(Boolean).join(", ");

    // Enviar chat al anunciante solo si tiene bits_conexion > 0
    for (const a of matchesFinal) {
      if (!a.usuario_id) continue;
      // Solo descontar bits_conexion para anuncios
      if (b.tipo_nexo === "anuncio" || !b.tipo_nexo) {
        const { data: anu } = await supabase.from("anuncios")
          .select("bits_conexion").eq("id", a.id).single();
        if (!anu || (anu.bits_conexion || 0) <= 0) continue;
        await supabase.from("anuncios")
          .update({ bits_conexion: anu.bits_conexion - 1 })
          .eq("id", a.id);
      }

      await supabase.from("mensajes").insert({
        anuncio_id:  a.id,
        emisor_id:   usuario_id,
        receptor_id: a.usuario_id,
        texto:       `🤖 Búsqueda IA: ${nombreBuscador} (${buscador?.codigo||""})${ubicBuscador ? " de " + ubicBuscador : ""} está buscando algo similar a tu anuncio "${a.titulo}". ¡Respondé rápido! Para contactarlo escribile al chat.`,
      });
      await supabase.from("notificaciones").insert({
        usuario_id: a.usuario_id,
        tipo:       "match",
        mensaje:    `🤖 ${nombreBuscador} (${buscador?.codigo||""})${ubicBuscador ? " de " + ubicBuscador : ""} encontró tu publicación "${a.titulo}" con la búsqueda IA. ¡Conectate!`,
        anuncio_id: a.id,
        leida:      false,
      });
    }

    // Notificar al usuario buscador
    for (const a of matchesFinal) {
      await supabase.from("notificaciones").insert({
        usuario_id: usuario_id,
        tipo:       "match",
        mensaje:    `🤖 Búsqueda IA encontró un anuncio que coincide: "${a.titulo}" — ${a.ciudad || ""}`,
        anuncio_id: a.id,
        leida:      false,
      });
    }

    return NextResponse.json({ matches: matchesFinal, bits_consumidos: bitsAConsumir });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
