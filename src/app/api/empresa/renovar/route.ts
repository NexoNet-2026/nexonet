import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const COSTO_MENSUAL = 10000;

export async function POST(req: NextRequest) {
  try {
    const { nexo_id, usuario_id } = await req.json();
    if (!nexo_id || !usuario_id) return NextResponse.json({ error: "Faltan datos" }, { status: 400 });

    // Verify nexo exists and belongs to user
    const { data: nexo } = await supabase
      .from("nexos")
      .select("id, usuario_id, tipo, estado, siguiente_pago")
      .eq("id", nexo_id)
      .single();

    if (!nexo || nexo.usuario_id !== usuario_id || nexo.tipo !== "empresa") {
      return NextResponse.json({ error: "Empresa no encontrada" }, { status: 404 });
    }

    // Check user has enough BIT
    const { data: user } = await supabase
      .from("usuarios")
      .select("bits, bits_free, bits_promo")
      .eq("id", usuario_id)
      .single();

    if (!user) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

    const totalBits = (user.bits || 0) + (user.bits_free || 0) + (user.bits_promo || 0);
    if (totalBits < COSTO_MENSUAL) {
      return NextResponse.json({ error: `Necesitás ${COSTO_MENSUAL} BIT. Tenés ${totalBits}.` }, { status: 400 });
    }

    // Deduct BIT: free -> promo -> nexo
    let resta = COSTO_MENSUAL;
    let newFree = user.bits_free || 0;
    let newPromo = user.bits_promo || 0;
    let newBits = user.bits || 0;

    if (newFree >= resta) { newFree -= resta; resta = 0; }
    else if (newFree > 0) { resta -= newFree; newFree = 0; }
    if (resta > 0) {
      if (newPromo >= resta) { newPromo -= resta; resta = 0; }
      else if (newPromo > 0) { resta -= newPromo; newPromo = 0; }
    }
    if (resta > 0) { newBits -= resta; }

    await supabase.from("usuarios").update({
      bits: Math.max(0, newBits),
      bits_free: Math.max(0, newFree),
      bits_promo: Math.max(0, newPromo),
    }).eq("id", usuario_id);

    // Extend payment period
    const ahora = new Date();
    const desde = nexo.siguiente_pago && new Date(nexo.siguiente_pago) > ahora
      ? new Date(nexo.siguiente_pago)
      : ahora;
    const hasta = new Date(desde.getTime() + 30 * 24 * 60 * 60 * 1000);

    await supabase.from("nexos").update({
      siguiente_pago: hasta.toISOString(),
      estado: "activo",
    }).eq("id", nexo_id);

    // Record payment
    await supabase.from("empresa_pagos").insert({
      nexo_id,
      usuario_id,
      bits_pagados: COSTO_MENSUAL,
      periodo_desde: desde.toISOString(),
      periodo_hasta: hasta.toISOString(),
    });

    // Notification
    await supabase.from("notificaciones").insert({
      usuario_id,
      tipo: "sistema",
      mensaje: `✅ Empresa renovada por 30 días. Próximo pago: ${hasta.toLocaleDateString("es-AR")}`,
      leida: false,
    });

    return NextResponse.json({ ok: true, siguiente_pago: hasta.toISOString() });
  } catch (err: any) {
    console.error("Empresa renovar error:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
