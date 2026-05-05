// src/lib/auth-server.ts
// Helper único para route handlers de /api/admin/*.
// Valida que el caller sea admin (es_admin_sistema=true) usando el Bearer
// token del header Authorization. Devuelve un cliente Supabase con
// service-role listo para usar, evitando duplicar createClient en cada handler.
import { NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export type RequireAdminResult =
  | { ok: true; userId: string; supabase: SupabaseClient }
  | { ok: false; response: NextResponse };

export async function requireAdmin(req: Request): Promise<RequireAdminResult> {
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!token) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Falta token de autorización" }, { status: 401 }),
    };
  }

  const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data: { user }, error: authErr } = await supabaseAuth.auth.getUser(token);
  if (authErr || !user) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Sesión inválida" }, { status: 401 }),
    };
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: caller } = await supabase
    .from("usuarios")
    .select("es_admin_sistema")
    .eq("id", user.id)
    .single();

  if (!caller?.es_admin_sistema) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Requiere permiso de admin" }, { status: 403 }),
    };
  }

  return { ok: true, userId: user.id, supabase };
}
