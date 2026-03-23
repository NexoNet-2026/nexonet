import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { webpush } from "@/lib/webpush";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { usuario_id, titulo, mensaje, url } = await req.json();
    if (!usuario_id || !mensaje) {
      return NextResponse.json({ error: "Faltan usuario_id y mensaje" }, { status: 400 });
    }

    const { data: subs } = await supabase
      .from("push_suscripciones")
      .select("endpoint, p256dh, auth")
      .eq("usuario_id", usuario_id);

    if (!subs || subs.length === 0) {
      return NextResponse.json({ ok: true, enviados: 0 });
    }

    const payload = JSON.stringify({
      title: titulo || "NexoNet",
      body: mensaje,
      icon: "/icons/icon-192x192.png",
      badge: "/icons/icon-72x72.png",
      data: { url: url || "/" },
    });

    let enviados = 0;
    for (const sub of subs) {
      try {
        await webpush.sendNotification({
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        }, payload);
        enviados++;
      } catch (err: any) {
        // Si la suscripción expiró (410 Gone), eliminarla
        if (err?.statusCode === 410 || err?.statusCode === 404) {
          await supabase.from("push_suscripciones").delete().eq("endpoint", sub.endpoint);
        }
      }
    }

    return NextResponse.json({ ok: true, enviados });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
