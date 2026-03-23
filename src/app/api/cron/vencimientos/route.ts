import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { enviarEmail, emailVencimiento } from "@/lib/email";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const EN30D = () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
const fechaEnDias = (d: number) => new Date(Date.now() + d * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
const diasHasta = (fecha: string) => Math.ceil((new Date(fecha).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

function descontarBits(usuario: any, monto: number): { updates: Record<string, number>; ok: boolean } {
  let restante = monto;
  const updates: Record<string, number> = {};
  for (const campo of ["bits_free", "bits", "bits_promo"]) {
    const disponible = (usuario?.[campo] || 0) as number;
    const descontar = Math.min(disponible, restante);
    if (descontar > 0) { updates[campo] = disponible - descontar; restante -= descontar; }
    if (restante <= 0) break;
  }
  return { updates, ok: restante <= 0 };
}

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const res = { anuncios: 0, empresas: 0, membresias: 0, items: 0, avisos: 0, emails: 0 };
  const hoy = new Date().toISOString();
  const dia1 = fechaEnDias(1);
  const dia3 = fechaEnDias(3);

  // Cargar número de WhatsApp de soporte
  const { data: waConfig } = await supabase.from("config_global").select("valor").eq("clave","whatsapp_soporte").single();
  const wa = waConfig?.valor || "5493413251818";
  const waLink = (txt: string) => `https://wa.me/${wa}?text=${encodeURIComponent(txt)}`;

  // ═══════════════════════════════════════════════════════════════
  // 1. ANUNCIOS VENCIDOS → pausar o auto-renovar
  // ═══════════════════════════════════════════════════════════════
  const { data: anunciosVencidos } = await supabase
    .from("anuncios")
    .select("id, usuario_id, titulo, renovar_automatico")
    .eq("estado", "activo")
    .lt("fecha_vencimiento", hoy);

  for (const a of anunciosVencidos || []) {
    const { data: usuario } = await supabase.from("usuarios").select("bits, bits_free, bits_promo, email, nombre").eq("id", a.usuario_id).single();
    const total = (usuario?.bits || 0) + (usuario?.bits_free || 0) + (usuario?.bits_promo || 0);

    if (a.renovar_automatico && total >= 500) {
      const { updates } = descontarBits(usuario, 500);
      await supabase.from("usuarios").update(updates).eq("id", a.usuario_id);
      await supabase.from("anuncios").update({ fecha_vencimiento: EN30D() }).eq("id", a.id);
      await supabase.from("notificaciones").insert({ usuario_id: a.usuario_id, tipo: "sistema", leida: false, mensaje: `🔄 Tu anuncio "${a.titulo}" fue renovado automáticamente por 500 BIT.` });
      res.avisos++;
    } else {
      await supabase.from("anuncios").update({ estado: "pausado" }).eq("id", a.id);
      await supabase.from("notificaciones").insert({ usuario_id: a.usuario_id, tipo: "sistema", leida: false, mensaje: `⚠️ Tu anuncio "${a.titulo}" fue pausado por vencimiento. Renovalo desde Mis Anuncios o escribinos: ${waLink("Hola NexoNet, quiero renovar mi anuncio " + a.titulo)}` });
      if (usuario?.email) { await enviarEmail(usuario.email, `⚠️ Anuncio pausado: ${a.titulo}`, emailVencimiento(usuario.nombre || "Usuario", "anuncio", a.titulo, 0, "https://nexonet.vercel.app/mis-anuncios")); res.emails++; }
      res.avisos++;
    }
    res.anuncios++;
  }

  // ═══════════════════════════════════════════════════════════════
  // 2. EMPRESAS VENCIDAS → pausar o auto-renovar
  // ═══════════════════════════════════════════════════════════════
  const { data: empresasVencidas } = await supabase
    .from("nexos").select("id, usuario_id, titulo")
    .eq("tipo", "empresa").eq("estado", "activo").lt("siguiente_pago", hoy);

  for (const e of empresasVencidas || []) {
    const { data: usuario } = await supabase.from("usuarios").select("bits, bits_free, bits_promo, email, nombre").eq("id", e.usuario_id).single();
    const total = (usuario?.bits || 0) + (usuario?.bits_free || 0) + (usuario?.bits_promo || 0);

    if (total >= 10000) {
      const { updates } = descontarBits(usuario, 10000);
      await supabase.from("usuarios").update(updates).eq("id", e.usuario_id);
      await supabase.from("nexos").update({ siguiente_pago: EN30D() }).eq("id", e.id);
      await supabase.from("empresa_pagos").insert({ nexo_id: e.id, usuario_id: e.usuario_id, monto_bits: 10000, periodo_desde: hoy, periodo_hasta: EN30D() });
      await supabase.from("notificaciones").insert({ usuario_id: e.usuario_id, tipo: "sistema", leida: false, mensaje: `🔄 Tu empresa "${e.titulo}" fue renovada automáticamente por 10.000 BIT.` });
      res.avisos++;
    } else {
      await supabase.from("nexos").update({ estado: "pausado" }).eq("id", e.id);
      await supabase.from("notificaciones").insert({ usuario_id: e.usuario_id, tipo: "sistema", leida: false, mensaje: `⚠️ Tu empresa "${e.titulo}" fue pausada por vencimiento. Renovála desde tu panel o escribinos: ${waLink("Hola NexoNet, quiero renovar mi empresa " + e.titulo)}` });
      if (usuario?.email) { await enviarEmail(usuario.email, `⚠️ Empresa pausada: ${e.titulo}`, emailVencimiento(usuario.nombre || "Usuario", "empresa", e.titulo, 0, `https://nexonet.vercel.app/nexo/${e.id}/admin`)); res.emails++; }
      res.avisos++;
    }
    res.empresas++;
  }

  // ═══════════════════════════════════════════════════════════════
  // 3. MEMBRESÍAS VENCIDAS → auto-renovar o suspender
  // ═══════════════════════════════════════════════════════════════
  const { data: membresiasVencidas } = await supabase
    .from("nexo_miembros").select("id, usuario_id, nexo_id, bits_pagados")
    .eq("estado", "activo").lt("vence_el", hoy).gt("bits_pagados", 0);

  for (const m of membresiasVencidas || []) {
    const { data: nexo } = await supabase.from("nexos").select("titulo, config, usuario_id").eq("id", m.nexo_id).single();
    const { data: usuario } = await supabase.from("usuarios").select("bits, bits_free, bits_promo, email, nombre").eq("id", m.usuario_id).single();
    const total = (usuario?.bits || 0) + (usuario?.bits_free || 0) + (usuario?.bits_promo || 0);

    if (total >= 500) {
      const { updates } = descontarBits(usuario, 500);
      await supabase.from("usuarios").update(updates).eq("id", m.usuario_id);
      if (nexo?.usuario_id) {
        const { data: dueno } = await supabase.from("usuarios").select("bits_promo, bits_promotor_total").eq("id", nexo.usuario_id).single();
        if (dueno) await supabase.from("usuarios").update({ bits_promo: (dueno.bits_promo || 0) + 150, bits_promotor_total: (dueno.bits_promotor_total || 0) + 150 }).eq("id", nexo.usuario_id);
      }
      await supabase.from("nexo_miembros").update({ vence_el: EN30D(), fecha_pago: hoy, bits_pagados: (m.bits_pagados || 0) + 500 }).eq("id", m.id);
      await supabase.from("notificaciones").insert({ usuario_id: m.usuario_id, tipo: "sistema", leida: false, mensaje: `🔄 Tu membresía en "${nexo?.titulo}" fue renovada automáticamente por 500 BIT.` });
      res.avisos++;
    } else {
      await supabase.from("nexo_miembros").update({ estado: "vencido" }).eq("id", m.id);
      await supabase.from("notificaciones").insert({ usuario_id: m.usuario_id, tipo: "sistema", leida: false, mensaje: `⚠️ Tu membresía en "${nexo?.titulo}" venció. Recargá BIT o escribinos: ${waLink("Hola NexoNet, quiero renovar mi membresía en " + (nexo?.titulo||""))}` });
      if (usuario?.email) { await enviarEmail(usuario.email, `⚠️ Membresía vencida: ${nexo?.titulo}`, emailVencimiento(usuario.nombre || "Usuario", "membresía de grupo", nexo?.titulo || "", 0, `https://nexonet.vercel.app/nexo/${m.nexo_id}`)); res.emails++; }
      res.avisos++;
    }
    res.membresias++;
  }

  // ═══════════════════════════════════════════════════════════════
  // 4. SLIDER ITEMS VENCIDOS → desactivar
  // ═══════════════════════════════════════════════════════════════
  const { data: itemsVencidos } = await supabase
    .from("nexo_slider_items").select("id, nexo_id, titulo")
    .eq("activo", true).lt("vence_el", hoy);

  for (const item of itemsVencidos || []) {
    await supabase.from("nexo_slider_items").update({ activo: false }).eq("id", item.id);
    const { data: nexo } = await supabase.from("nexos").select("usuario_id, titulo").eq("id", item.nexo_id).single();
    if (nexo) {
      const { data: usr } = await supabase.from("usuarios").select("email, nombre").eq("id", nexo.usuario_id).single();
      await supabase.from("notificaciones").insert({ usuario_id: nexo.usuario_id, tipo: "sistema", leida: false, mensaje: `📄 El archivo "${item.titulo}" en "${nexo.titulo}" venció y fue desactivado.` });
      if (usr?.email) { await enviarEmail(usr.email, `Archivo vencido: ${item.titulo}`, emailVencimiento(usr.nombre || "Usuario", "archivo", item.titulo, 0, `https://nexonet.vercel.app/nexo/${item.nexo_id}/admin`)); res.emails++; }
      res.avisos++;
    }
    res.items++;
  }

  // ═══════════════════════════════════════════════════════════════
  // 5. AVISOS PREVIOS (3 días y 1 día antes)
  // ═══════════════════════════════════════════════════════════════

  // 5a. Anuncios próximos a vencer
  const { data: anunciosProx } = await supabase
    .from("anuncios").select("id, usuario_id, titulo, fecha_vencimiento")
    .eq("estado", "activo")
    .or(`fecha_vencimiento.gte.${dia1}T00:00:00,fecha_vencimiento.lt.${dia1}T23:59:59,fecha_vencimiento.gte.${dia3}T00:00:00,fecha_vencimiento.lt.${dia3}T23:59:59`);

  for (const a of anunciosProx || []) {
    const dias = diasHasta(a.fecha_vencimiento);
    if (dias !== 1 && dias !== 3) continue;
    const { data: usr } = await supabase.from("usuarios").select("email, nombre").eq("id", a.usuario_id).single();
    const url = "https://nexonet.vercel.app/mis-anuncios";
    await supabase.from("notificaciones").insert({ usuario_id: a.usuario_id, tipo: "sistema", leida: false, mensaje: `⏰ Tu anuncio "${a.titulo}" vence en ${dias} día${dias > 1 ? "s" : ""}. Renovalo desde Mis Anuncios.` });
    if (usr?.email) { await enviarEmail(usr.email, `${dias === 1 ? "🔴 Vence mañana" : "🟡 Vence en 3 días"}: ${a.titulo}`, emailVencimiento(usr.nombre || "Usuario", "anuncio", a.titulo, dias, url)); res.emails++; }
    res.avisos++;
  }

  // 5b. Empresas próximas a vencer
  const { data: empresasProx } = await supabase
    .from("nexos").select("id, usuario_id, titulo, siguiente_pago")
    .eq("tipo", "empresa").eq("estado", "activo")
    .or(`siguiente_pago.gte.${dia1}T00:00:00,siguiente_pago.lt.${dia1}T23:59:59,siguiente_pago.gte.${dia3}T00:00:00,siguiente_pago.lt.${dia3}T23:59:59`);

  for (const e of empresasProx || []) {
    const dias = diasHasta(e.siguiente_pago);
    if (dias !== 1 && dias !== 3) continue;
    const { data: usr } = await supabase.from("usuarios").select("email, nombre").eq("id", e.usuario_id).single();
    const url = `https://nexonet.vercel.app/nexo/${e.id}/admin`;
    await supabase.from("notificaciones").insert({ usuario_id: e.usuario_id, tipo: "sistema", leida: false, mensaje: `⏰ Tu empresa "${e.titulo}" vence en ${dias} día${dias > 1 ? "s" : ""}. Necesitás 10.000 BIT para renovar.` });
    if (usr?.email) { await enviarEmail(usr.email, `${dias === 1 ? "🔴 Vence mañana" : "🟡 Vence en 3 días"}: ${e.titulo}`, emailVencimiento(usr.nombre || "Usuario", "empresa", e.titulo, dias, url)); res.emails++; }
    res.avisos++;
  }

  // 5c. Membresías de grupos próximas a vencer
  const { data: membresiasProx } = await supabase
    .from("nexo_miembros").select("id, usuario_id, nexo_id, vence_el")
    .eq("estado", "activo").gt("bits_pagados", 0)
    .or(`vence_el.gte.${dia1}T00:00:00,vence_el.lt.${dia1}T23:59:59,vence_el.gte.${dia3}T00:00:00,vence_el.lt.${dia3}T23:59:59`);

  for (const m of membresiasProx || []) {
    const dias = diasHasta(m.vence_el);
    if (dias !== 1 && dias !== 3) continue;
    const { data: nexo } = await supabase.from("nexos").select("titulo").eq("id", m.nexo_id).single();
    const { data: usr } = await supabase.from("usuarios").select("email, nombre").eq("id", m.usuario_id).single();
    const url = `https://nexonet.vercel.app/nexo/${m.nexo_id}`;
    await supabase.from("notificaciones").insert({ usuario_id: m.usuario_id, tipo: "sistema", leida: false, mensaje: `⏰ Tu membresía en "${nexo?.titulo}" vence en ${dias} día${dias > 1 ? "s" : ""}. Asegurate de tener 500 BIT.` });
    if (usr?.email) { await enviarEmail(usr.email, `${dias === 1 ? "🔴 Vence mañana" : "🟡 Vence en 3 días"}: membresía en ${nexo?.titulo}`, emailVencimiento(usr.nombre || "Usuario", "membresía de grupo", nexo?.titulo || "", dias, url)); res.emails++; }
    res.avisos++;
  }

  return NextResponse.json({ ok: true, timestamp: hoy, ...res });
}
