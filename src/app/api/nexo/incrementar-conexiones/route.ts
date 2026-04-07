import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { nexo_ids } = await req.json();
    if (!Array.isArray(nexo_ids) || nexo_ids.length === 0) {
      return NextResponse.json({ error: "nexo_ids requerido" }, { status: 400 });
    }

    const { data: nexos } = await supabase
      .from("nexos")
      .select("id, conexiones_recibidas")
      .in("id", nexo_ids);

    if (nexos) {
      await Promise.all(
        nexos.map((n) =>
          supabase
            .from("nexos")
            .update({ conexiones_recibidas: (n.conexiones_recibidas || 0) + 1 })
            .eq("id", n.id)
        )
      );
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
