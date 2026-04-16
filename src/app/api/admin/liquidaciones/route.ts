import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function GET() {
  const { data, error } = await supabase
    .from("log_bits_internos")
    .select("*,usuarios(nombre_usuario,codigo)")
    .ilike("motivo", "%Liquidaci%")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    console.error("[liquidaciones] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
