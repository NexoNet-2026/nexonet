import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { usuario_id, subscription, dispositivo } = await req.json();
    if (!usuario_id || !subscription?.endpoint || !subscription?.keys) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }

    await supabase.from("push_suscripciones").upsert({
      usuario_id,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      dispositivo: dispositivo || null,
    }, { onConflict: "usuario_id,endpoint" });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
