import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { usuario_id } = await req.json();
    if (!usuario_id) {
      return NextResponse.json({ error: "usuario_id requerido" }, { status: 400 });
    }

    const { data: w } = await supabase
      .from("usuarios")
      .select("bits, bits_free, bits_promo")
      .eq("id", usuario_id)
      .single();

    if (!w) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    let rest = 1;
    const upd: { bits_free?: number; bits?: number; bits_promo?: number } = {};

    if (w.bits_free > 0) {
      const d = Math.min(w.bits_free, rest);
      upd.bits_free = w.bits_free - d;
      rest -= d;
    }
    if (rest > 0 && w.bits > 0) {
      const d = Math.min(w.bits, rest);
      upd.bits = w.bits - d;
      rest -= d;
    }
    if (rest > 0 && w.bits_promo > 0) {
      const d = Math.min(w.bits_promo, rest);
      upd.bits_promo = w.bits_promo - d;
      rest -= d;
    }

    if (Object.keys(upd).length > 0) {
      await supabase.from("usuarios").update(upd).eq("id", usuario_id);
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
