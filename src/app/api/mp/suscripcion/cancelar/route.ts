import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { suscripcion_id } = await req.json();
    if (!suscripcion_id) return NextResponse.json({ error: "Falta suscripcion_id" }, { status: 400 });

    const { data: sub } = await supabase
      .from("suscripciones_mp")
      .select("mp_preapproval_id")
      .eq("id", suscripcion_id)
      .single();

    if (!sub?.mp_preapproval_id) {
      return NextResponse.json({ error: "Suscripción no encontrada" }, { status: 404 });
    }

    // Cancelar en MP
    await fetch(`https://api.mercadopago.com/preapproval/${sub.mp_preapproval_id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.MP_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({ status: "cancelled" }),
    });

    // Actualizar en DB
    await supabase.from("suscripciones_mp").update({
      estado: "cancelled",
      updated_at: new Date().toISOString(),
    }).eq("id", suscripcion_id);

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
