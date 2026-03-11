import { supabase } from "@/lib/supabase";

export async function matchBusquedas(anuncio: any) {
  if (!anuncio?.id) return;
  const { data: busquedas } = await supabase
    .from("busquedas_automaticas")
    .select("*")
    .eq("activo", true)
    .neq("usuario_id", anuncio.usuario_id);
  if (!busquedas || busquedas.length === 0) return;
  const { data: anuData } = await supabase
    .from("anuncios")
    .select("bits_conexion, conexiones")
    .eq("id", anuncio.id)
    .single();
  let saldoAnuncio = anuData?.bits_conexion ?? 0;
  for (const b of busquedas) {
    const { data: u } = await supabase
      .from("usuarios")
      .select("bits_busquedas, bits_gastados_busquedas")
      .eq("id", b.usuario_id)
      .single();
    if (!u || (u.bits_busquedas || 0) <= 0) continue;
    let match = true;
    if (b.subrubro_id && anuncio.subrubro_id !== b.subrubro_id) match = false;
    if (match && b.ciudad) {
      const ca = (anuncio.ciudad || "").toLowerCase();
      const cb = (b.ciudad || "").toLowerCase();
      if (!ca.includes(cb) && !cb.includes(ca)) match = false;
    }
    if (match && b.precio_min && anuncio.precio && anuncio.precio < b.precio_min) match = false;
    if (match && b.precio_max && anuncio.precio && anuncio.precio > b.precio_max) match = false;
    if (match && b.moneda && anuncio.moneda && b.moneda !== anuncio.moneda) match = false;
    if (match && b.keywords) {
      const texto = `${anuncio.titulo || ""} ${anuncio.descripcion || ""}`.toLowerCase();
      const kws = b.keywords.toLowerCase().split(/\s+/).filter(Boolean);
      if (!kws.every((kw: string) => texto.includes(kw))) match = false;
    }
    if (!match) continue;
    await supabase.from("usuarios").update({
      bits_busquedas: (u.bits_busquedas || 0) - 1,
      bits_gastados_busquedas: (u.bits_gastados_busquedas || 0) + 1,
    }).eq("id", b.usuario_id);
    if (saldoAnuncio > 0) {
      saldoAnuncio -= 1;
      await supabase.from("anuncios").update({
        bits_conexion: saldoAnuncio,
        conexiones: (anuData?.conexiones || 0) + 1,
      }).eq("id", anuncio.id);
    }
    await supabase.from("notificaciones").insert({
      usuario_id: b.usuario_id,
      emisor_id:  anuncio.usuario_id,
      anuncio_id: anuncio.id,
      tipo:       "match_busqueda",
      mensaje:    `🔍 Encontramos un anuncio que coincide con "${b.titulo || "tu búsqueda"}": "${anuncio.titulo}"`,
    });
    await supabase.from("busquedas_automaticas").update({
      notificaciones_recibidas: (b.notificaciones_recibidas || 0) + 1,
    }).eq("id", b.id);
  }
}
