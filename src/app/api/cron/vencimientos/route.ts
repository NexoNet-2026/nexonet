import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  // Verificar que viene de Vercel Cron
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const resultados = { anuncios: 0, empresas: 0, membresias: 0, notificaciones: 0 };
  const hoy = new Date().toISOString();

  // ═══════════════════════════════════
  // 1. ANUNCIOS vencidos → pausar o auto-renovar
  // ═══════════════════════════════════
  const { data: anunciosVencidos } = await supabase
    .from("anuncios")
    .select("id, usuario_id, titulo, renovar_automatico")
    .eq("estado", "activo")
    .lt("fecha_vencimiento", hoy);

  for (const a of anunciosVencidos || []) {
    const { data: usuario } = await supabase
      .from("usuarios")
      .select("bits, bits_free, bits_promo")
      .eq("id", a.usuario_id)
      .single();

    const totalBits = (usuario?.bits || 0) + (usuario?.bits_free || 0) + (usuario?.bits_promo || 0);

    if (a.renovar_automatico && totalBits >= 500) {
      // Auto-renovar: cobrar 500 BIT y extender 30 días
      const campo = (usuario?.bits_free || 0) >= 500 ? "bits_free" : (usuario?.bits || 0) >= 500 ? "bits" : "bits_promo";
      await supabase.from("usuarios").update({ [campo]: (usuario![campo as keyof typeof usuario] as number) - 500 }).eq("id", a.usuario_id);
      await supabase.from("anuncios").update({
        fecha_vencimiento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      }).eq("id", a.id);
      await supabase.from("notificaciones").insert({
        usuario_id: a.usuario_id, tipo: "sistema", leida: false,
        mensaje: `🔄 Tu anuncio "${a.titulo}" fue renovado automáticamente por 500 BIT.`,
      });
      resultados.notificaciones++;
    } else {
      // Pausar anuncio
      await supabase.from("anuncios").update({ estado: "pausado" }).eq("id", a.id);
      await supabase.from("notificaciones").insert({
        usuario_id: a.usuario_id, tipo: "sistema", leida: false,
        mensaje: `⚠️ Tu anuncio "${a.titulo}" fue pausado por vencimiento. Renovalo desde Mis Anuncios.`,
      });
      resultados.notificaciones++;
    }
    resultados.anuncios++;
  }

  // ═══════════════════════════════════
  // 2. EMPRESAS vencidas → pausar o auto-renovar
  // ═══════════════════════════════════
  const { data: empresasVencidas } = await supabase
    .from("nexos")
    .select("id, usuario_id, titulo")
    .eq("tipo", "empresa")
    .eq("estado", "activo")
    .lt("siguiente_pago", hoy);

  for (const e of empresasVencidas || []) {
    const { data: usuario } = await supabase
      .from("usuarios")
      .select("bits, bits_free, bits_promo")
      .eq("id", e.usuario_id)
      .single();

    const totalBits = (usuario?.bits || 0) + (usuario?.bits_free || 0) + (usuario?.bits_promo || 0);

    if (totalBits >= 10000) {
      // Auto-renovar empresa: prioridad bits_free → bits → bits_promo
      let restante = 10000;
      const updates: Record<string, number> = {};
      for (const campo of ["bits_free", "bits", "bits_promo"] as const) {
        const disponible = (usuario![campo as keyof typeof usuario] as number) || 0;
        const descontar = Math.min(disponible, restante);
        if (descontar > 0) {
          updates[campo] = disponible - descontar;
          restante -= descontar;
        }
        if (restante <= 0) break;
      }
      await supabase.from("usuarios").update(updates).eq("id", e.usuario_id);
      await supabase.from("nexos").update({
        siguiente_pago: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      }).eq("id", e.id);
      // Registrar pago en empresa_pagos
      await supabase.from("empresa_pagos").insert({
        nexo_id: e.id, usuario_id: e.usuario_id, monto_bits: 10000,
        periodo_desde: hoy,
        periodo_hasta: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });
      await supabase.from("notificaciones").insert({
        usuario_id: e.usuario_id, tipo: "sistema", leida: false,
        mensaje: `🔄 Tu empresa "${e.titulo}" fue renovada automáticamente por 10.000 BIT.`,
      });
      resultados.notificaciones++;
    } else {
      await supabase.from("nexos").update({ estado: "pausado" }).eq("id", e.id);
      await supabase.from("notificaciones").insert({
        usuario_id: e.usuario_id, tipo: "sistema", leida: false,
        mensaje: `⚠️ Tu empresa "${e.titulo}" fue pausada por vencimiento. Renovála desde tu panel.`,
      });
      resultados.notificaciones++;
    }
    resultados.empresas++;
  }

  // ═══════════════════════════════════
  // 3. MEMBRESÍAS DE GRUPOS vencidas → auto-renovar o suspender
  // ═══════════════════════════════════
  const { data: membresiasVencidas } = await supabase
    .from("nexo_miembros")
    .select("id, usuario_id, nexo_id, bits_pagados")
    .eq("estado", "activo")
    .lt("vence_el", hoy)
    .gt("bits_pagados", 0);

  for (const m of membresiasVencidas || []) {
    // Obtener datos del nexo (grupo)
    const { data: nexo } = await supabase
      .from("nexos")
      .select("titulo, config, usuario_id")
      .eq("id", m.nexo_id)
      .single();

    // Obtener BIT del miembro
    const { data: usuario } = await supabase
      .from("usuarios")
      .select("bits, bits_free, bits_promo")
      .eq("id", m.usuario_id)
      .single();

    const totalBits = (usuario?.bits || 0) + (usuario?.bits_free || 0) + (usuario?.bits_promo || 0);

    if (totalBits >= 500) {
      // Auto-renovar membresía: prioridad bits_free → bits → bits_promo
      let restante = 500;
      const updates: Record<string, number> = {};
      for (const campo of ["bits_free", "bits", "bits_promo"] as const) {
        const disponible = (usuario![campo as keyof typeof usuario] as number) || 0;
        const descontar = Math.min(disponible, restante);
        if (descontar > 0) {
          updates[campo] = disponible - descontar;
          restante -= descontar;
        }
        if (restante <= 0) break;
      }
      await supabase.from("usuarios").update(updates).eq("id", m.usuario_id);

      // Acreditar 150 BIT Promotor al dueño del grupo
      if (nexo?.usuario_id) {
        const { data: dueno } = await supabase
          .from("usuarios")
          .select("bits_promo, bits_promotor_total")
          .eq("id", nexo.usuario_id)
          .single();
        if (dueno) {
          await supabase.from("usuarios").update({
            bits_promo: (dueno.bits_promo || 0) + 150,
            bits_promotor_total: (dueno.bits_promotor_total || 0) + 150,
          }).eq("id", nexo.usuario_id);
        }
      }

      // Extender 30 días
      await supabase.from("nexo_miembros").update({
        vence_el: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        fecha_pago: hoy,
        bits_pagados: (m.bits_pagados || 0) + 500,
      }).eq("id", m.id);

      await supabase.from("notificaciones").insert({
        usuario_id: m.usuario_id, tipo: "sistema", leida: false,
        mensaje: `🔄 Tu membresía en "${nexo?.titulo}" fue renovada automáticamente por 500 BIT.`,
      });
      resultados.notificaciones++;
    } else {
      // Suspender membresía
      await supabase.from("nexo_miembros").update({ estado: "vencido" }).eq("id", m.id);
      await supabase.from("notificaciones").insert({
        usuario_id: m.usuario_id, tipo: "sistema", leida: false,
        mensaje: `⚠️ Tu membresía en "${nexo?.titulo}" venció. Recargá BIT para renovarla.`,
      });
      resultados.notificaciones++;
    }
    resultados.membresias++;
  }

  return NextResponse.json({
    ok: true,
    timestamp: hoy,
    ...resultados,
  });
}
