import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { usuario_id, tipo, referencia_id, monto, descripcion, back_url } = await req.json();
    if (!usuario_id || !tipo || !monto) {
      return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
    }

    const res = await fetch("https://api.mercadopago.com/preapproval", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.MP_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        reason: descripcion || `Suscripción NexoNet — ${tipo}`,
        auto_recurring: {
          frequency: 1,
          frequency_type: "months",
          transaction_amount: monto,
          currency_id: "ARS",
        },
        back_url: back_url || "https://nexonet.ar/usuario",
        status: "pending",
      }),
    });

    const data = await res.json();
    if (!data.id) {
      console.error("Error MP preapproval:", data);
      return NextResponse.json({ error: "Error al crear suscripción en MercadoPago" }, { status: 500 });
    }

    await supabase.from("suscripciones_mp").insert({
      usuario_id,
      mp_preapproval_id: data.id,
      tipo,
      referencia_id: referencia_id ? String(referencia_id) : null,
      monto,
      estado: "pending",
    });

    return NextResponse.json({ init_point: data.init_point, id: data.id });
  } catch (e: any) {
    console.error("Error suscripcion/crear:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
