import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ahora = new Date();
  const en5dias = new Date(ahora.getTime() + 5 * 24 * 60 * 60 * 1000);
  const notificados: string[] = [];
  const pausados: string[] = [];

  // 1. VENCIDOS — nexos cuyo siguiente_pago ya pasó y están activos
  const { data: vencidos } = await supabase
    .from("nexos")
    .select("id, titulo, usuario_id, tipo")
    .in("tipo", ["empresa", "servicio"])
    .eq("estado", "activo")
    .lt("siguiente_pago", ahora.toISOString())
    .is("trial_hasta", null); // no pausar durante trial

  if (vencidos && vencidos.length > 0) {
    for (const n of vencidos) {
      // Pausar el nexo
      await supabase.from("nexos").update({ estado: "pausado" }).eq("id", n.id);

      // Notificar al dueño
      await supabase.from("notificaciones").insert({
        usuario_id: n.usuario_id,
        tipo: "sistema",
        mensaje: `⚠️ Tu ${n.tipo} "${n.titulo}" fue pausado por falta de pago. Renovalo con 10.000 BIT para reactivarlo.`,
        leida: false,
        nexo_id: n.id,
      });

      pausados.push(n.id);
    }
  }

  // 2. POR VENCER — nexos con siguiente_pago en los próximos 5 días
  const { data: porVencer } = await supabase
    .from("nexos")
    .select("id, titulo, usuario_id, tipo, siguiente_pago")
    .in("tipo", ["empresa", "servicio"])
    .eq("estado", "activo")
    .gte("siguiente_pago", ahora.toISOString())
    .lte("siguiente_pago", en5dias.toISOString());

  if (porVencer && porVencer.length > 0) {
    for (const n of porVencer) {
      const dias = Math.ceil((new Date(n.siguiente_pago).getTime() - ahora.getTime()) / 86400000);

      // Evitar notificar dos veces el mismo día — verificar si ya se notificó hoy
      const hoy = ahora.toISOString().slice(0, 10);
      const { data: yaNotificado } = await supabase
        .from("notificaciones")
        .select("id")
        .eq("usuario_id", n.usuario_id)
        .eq("nexo_id", n.id)
        .gte("created_at", `${hoy}T00:00:00.000Z`)
        .ilike("mensaje", "%vence en%")
        .maybeSingle();

      if (!yaNotificado) {
        await supabase.from("notificaciones").insert({
          usuario_id: n.usuario_id,
          tipo: "sistema",
          mensaje: `⏰ Tu ${n.tipo} "${n.titulo}" vence en ${dias} día${dias !== 1 ? "s" : ""}. Renovalo con 10.000 BIT para no perder visibilidad.`,
          leida: false,
          nexo_id: n.id,
        });
        notificados.push(n.id);
      }
    }
  }

  // 3. TRIAL VENCIDO — nexos con trial_hasta pasado y siguiente_pago pasado
  const { data: trialsVencidos } = await supabase
    .from("nexos")
    .select("id, titulo, usuario_id, tipo, trial_hasta")
    .in("tipo", ["empresa", "servicio"])
    .eq("estado", "activo")
    .not("trial_hasta", "is", null)
    .lt("trial_hasta", ahora.toISOString());

  if (trialsVencidos && trialsVencidos.length > 0) {
    for (const n of trialsVencidos) {
      await supabase.from("nexos").update({ estado: "pausado", trial_hasta: null }).eq("id", n.id);

      await supabase.from("notificaciones").insert({
        usuario_id: n.usuario_id,
        tipo: "sistema",
        mensaje: `🎯 Tu período de prueba de "${n.titulo}" terminó. Activá tu plan por 10.000 BIT/mes para seguir activo en NexoNet.`,
        leida: false,
        nexo_id: n.id,
      });

      pausados.push(n.id);
    }
  }

  return NextResponse.json({
    ok: true,
    pausados: pausados.length,
    notificados: notificados.length,
    trialsVencidos: trialsVencidos?.length || 0,
  });
}
