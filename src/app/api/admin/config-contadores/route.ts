import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

function client() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function GET() {
  try {
    const supabase = client();
    const { data, error } = await supabase
      .from("config_app")
      .select("*")
      .eq("id", "global")
      .maybeSingle();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json(
      data ?? { id: "global", usuarios_mult: 1, usuarios_suma: 0, activos_mult: 1, activos_suma: 0, updated_at: null }
    );
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const usuarios_mult = Number(body.usuarios_mult);
    const usuarios_suma = Number(body.usuarios_suma);
    const activos_mult = Number(body.activos_mult);
    const activos_suma = Number(body.activos_suma);

    if ([usuarios_mult, usuarios_suma, activos_mult, activos_suma].some(n => !Number.isFinite(n))) {
      return NextResponse.json({ error: "Valores numéricos inválidos" }, { status: 400 });
    }

    const supabase = client();
    const { data, error } = await supabase
      .from("config_app")
      .upsert(
        {
          id: "global",
          usuarios_mult,
          usuarios_suma,
          activos_mult,
          activos_suma,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      )
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true, data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
