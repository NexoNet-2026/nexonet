import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { PRECIO_NEGOCIO_MENSUAL } from "@/lib/precios";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const COSTO_MENSUAL = PRECIO_NEGOCIO_MENSUAL;

export async function POST(req: NextRequest) {
  try {
    const { nexo_id, usuario_id } = await req.json();
    if (!nexo_id || !usuario_id) return NextResponse.json({ error: "Faltan datos" }, { status: 400 });

    const { data: nexo } = await supabase
      .from("nexos")
      .select("id, usuario_id, tipo, estado, siguiente_pago")
      .eq("id", nexo_id)
      .single();

    if (!nexo || nexo.usuario_id !== usuario_id || nexo.tipo !== "servicio") {
      return NextResponse.json({ error: "Servicio no encontrado" }, { status: 404 });
    }

    const { data: user } = await supabase
      .from("usuarios")
      .select("bits, bits_free, bits_promo")
      .eq("id", usuario_id)
      .single();

    if (!user) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

    const totalBits = (user.bits || 0) + (user.bits_free || 0) + (user.bits_promo || 0);
    if (totalBits < COSTO_MENSUAL) {
      return NextResponse.json({ error: `Necesitás ${COSTO_MENSUAL.toLocaleString('es-AR')} BIT. Tenés ${totalBits.toLocaleString('es-AR')}.` }, { status: 400 });
    }

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

    const ahora = new Date();
    const desde = nexo.siguiente_pago && new Date(nexo.siguiente_pago) > ahora
      ? new Date(nexo.siguiente_pago)
      : ahora;
    const hasta = new Date(desde.getTime() + 30 * 24 * 60 * 60 * 1000);

    await supabase.from("nexos").update({
      siguiente_pago: hasta.toISOString(),
      estado: "activo",
    }).eq("id", nexo_id);

    await supabase.from("notificaciones").insert({
      usuario_id,
      tipo: "sistema",
      mensaje: `✅ Servicio renovado por 30 días. Próximo pago: ${hasta.toLocaleDateString("es-AR")}`,
      leida: false,
    });

    return NextResponse.json({ ok: true, siguiente_pago: hasta.toISOString() });
  } catch (err: any) {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
