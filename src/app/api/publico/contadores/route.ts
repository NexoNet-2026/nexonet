import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { count: realRegistrados } = await supabase
      .from("usuarios")
      .select("id", { count: "exact", head: true });

    const hace5 = new Date(Date.now() - 5 * 60 * 1000).toISOString();

    let realActivos = 0;
    const { count: cActivos, error: errActivos } = await supabase
      .from("usuarios")
      .select("id", { count: "exact", head: true })
      .gte("last_seen", hace5);

    if (!errActivos && typeof cActivos === "number") realActivos = cActivos;

    const { data: cfg } = await supabase
      .from("config_app")
      .select("usuarios_mult, usuarios_suma, activos_mult, activos_suma, updated_at")
      .eq("id", "global")
      .maybeSingle();

    const uMult = Number(cfg?.usuarios_mult ?? 1);
    const uSuma = Number(cfg?.usuarios_suma ?? 0);
    const aMult = Number(cfg?.activos_mult ?? 1);
    const aSuma = Number(cfg?.activos_suma ?? 0);

    const usuarios_registrados = Math.max(0, Math.floor((realRegistrados || 0) * uMult + uSuma));
    const usuarios_activos = Math.max(0, Math.floor(realActivos * aMult + aSuma));

    return NextResponse.json({
      usuarios_registrados,
      usuarios_activos,
      updated_at: cfg?.updated_at ?? null,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
