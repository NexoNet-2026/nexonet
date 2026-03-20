// src/app/api/mp/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN!;

// Mapa paquete → columna Supabase y cantidad
const PAQUETES: Record<string, { col: string; cantidad: number; ilimitado?: boolean }> = {
  "bit_nexo_500":           { col: "bits",            cantidad: 500   },
  "bit_nexo_1000":          { col: "bits",            cantidad: 1000  },
  "bit_nexo_5000":          { col: "bits",            cantidad: 5000  },
  "bit_nexo_ilimitado":     { col: "bits",            cantidad: 99999, ilimitado: true },
  "bit_anuncio_3":          { col: "bits_anuncio",    cantidad: 3     },
  "bit_anuncio_10":         { col: "bits_anuncio",    cantidad: 10    },
  "bit_anuncio_emp_50":     { col: "bits_anuncio",    cantidad: 50    },
  "bit_conexion_1000":      { col: "bits_conexion",   cantidad: 1000  },
  "bit_conexion_5000":      { col: "bits_conexion",   cantidad: 5000  },
  "bit_conexion_ilimitado": { col: "bits_conexion",   cantidad: 99999, ilimitado: true },
  "bit_grupo":              { col: "bits_grupo",      cantidad: 500   },
  "bit_link":               { col: "bits_link",       cantidad: 500   },
  "bit_adjunto":            { col: "bits_adjunto",    cantidad: 500   },
  "bit_ia_1000":            { col: "bits_busquedas",  cantidad: 1000  },
  "bit_ia_5000":            { col: "bits_busquedas",  cantidad: 5000  },
  "bit_ia_ilimitado":       { col: "bits_busquedas",  cantidad: 99999, ilimitado: true },
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("MP Webhook:", JSON.stringify(body));

    // Solo procesar pagos aprobados
    if (body.type !== "payment") return NextResponse.json({ ok: true });

    const paymentId = body.data?.id;
    if (!paymentId) return NextResponse.json({ ok: true });

    // Obtener detalle del pago
    const res = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { "Authorization": `Bearer ${ACCESS_TOKEN}` },
    });
    const pago = await res.json();

    if (pago.status !== "approved") return NextResponse.json({ ok: true });

    // Parsear external_reference: "usuario_id|paquete|timestamp"
    const ref = pago.external_reference || "";
    const partes = ref.split("|");
    if (partes.length < 2) return NextResponse.json({ ok: true });

    const usuario_id = partes[0];
    const paquete    = partes[1];
    const pkg = PAQUETES[paquete];

    if (!pkg) {
      console.error("Paquete no encontrado:", paquete);
      return NextResponse.json({ ok: true });
    }

    // Verificar que no se acreditó antes (idempotencia)
    const { data: yaAcreditado } = await supabase
      .from("pagos_mp")
      .select("id")
      .eq("payment_id", String(paymentId))
      .single();

    if (yaAcreditado) {
      console.log("Pago ya acreditado:", paymentId);
      return NextResponse.json({ ok: true });
    }

    // Obtener usuario actual
    const { data: usuario } = await supabase
      .from("usuarios")
      .select("id, bits, bits_anuncio, bits_conexion, bits_grupo, bits_link, bits_adjunto, bits_busquedas, bits_totales_acumulados")
      .eq("id", usuario_id)
      .single();

    if (!usuario) {
      console.error("Usuario no encontrado:", usuario_id);
      return NextResponse.json({ ok: true });
    }

    // Calcular nuevo valor
    const actual = (usuario as any)[pkg.col] || 0;
    const nuevo  = pkg.ilimitado ? 99999 : actual + pkg.cantidad;

    // Acreditar BIT + recalcular insignia de logro
    const acumuladoActual = (usuario as any).bits_totales_acumulados || 0;
    const nuevoAcumulado  = acumuladoActual + (pkg.ilimitado ? 99999 : pkg.cantidad);
    const NIVELES_LOGRO: [string, number][] = [["diamante",10000],["platino",5000],["oro",1000],["plata",500],["bronce",100],["ninguna",0]];
    const insignia = NIVELES_LOGRO.find(([, min]) => nuevoAcumulado >= min)?.[0] || "ninguna";
    await supabase.from("usuarios").update({
      [pkg.col]: nuevo,
      bits_totales_acumulados: nuevoAcumulado,
      insignia_logro: insignia,
    }).eq("id", usuario_id);

    // Registrar pago para idempotencia
    await supabase.from("pagos_mp").insert({
      payment_id:   String(paymentId),
      usuario_id,
      paquete,
      monto:        pago.transaction_amount,
      estado:       "approved",
      bits_col:     pkg.col,
      bits_cant:    pkg.cantidad,
    });

    // Notificación in-app
    await supabase.from("notificaciones").insert({
      usuario_id,
      tipo:    "sistema",
      mensaje: `✅ Pago aprobado — Se acreditaron ${pkg.cantidad >= 99999 ? "BIT Ilimitados" : pkg.cantidad + " BIT"} en tu cuenta`,
      leida:   false,
    });

    console.log(`✅ Acreditados ${pkg.cantidad} en ${pkg.col} para usuario ${usuario_id}`);
    return NextResponse.json({ ok: true });

  } catch (err) {
    console.error("Webhook error:", err);
    return NextResponse.json({ ok: true }); // Siempre 200 para MP
  }
}

// MP también hace GET para verificar el endpoint
export async function GET() {
  return NextResponse.json({ ok: true });
}
