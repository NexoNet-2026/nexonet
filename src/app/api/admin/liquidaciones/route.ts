import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function GET() {
  const { data: logs, error } = await supabase
    .from("log_bits_internos")
    .select("*")
    .ilike("motivo", "%Liquidaci%")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    console.error("[liquidaciones] Error logs:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const uids = [...new Set((logs || []).map((l: any) => l.usuario_id).filter(Boolean))];
  let usuariosMap: Record<string, { nombre_usuario: string; codigo: string }> = {};

  if (uids.length > 0) {
    const { data: users, error: e2 } = await supabase
      .from("usuarios")
      .select("id,nombre_usuario,codigo")
      .in("id", uids);
    if (e2) console.error("[liquidaciones] Error usuarios:", e2);
    (users || []).forEach((u: any) => { usuariosMap[u.id] = { nombre_usuario: u.nombre_usuario, codigo: u.codigo }; });
  }

  const data = (logs || []).map((l: any) => ({
    ...l,
    usuarios: usuariosMap[l.usuario_id] || null,
  }));

  return NextResponse.json({ data });
}
