// src/lib/acreditar-pago.ts
// Acreditación de BIT por compra de paquete (Mercado Pago), reutilizable entre
// el webhook (primer intento) y el cron de reintentos. Fuente única de verdad
// para los montos de paquetes y los niveles de insignia.
import type { SupabaseClient } from "@supabase/supabase-js";
import { logFallo } from "@/lib/log-fallos";

// Mapa paquete → columna Supabase y cantidad
export const PAQUETES: Record<string, { col: string; cantidad: number; ilimitado?: boolean }> = {
  "bit_500":   { col: "bits", cantidad: 500   },
  "bit_1500":  { col: "bits", cantidad: 1600  },
  "bit_3000":  { col: "bits", cantidad: 3300  },
  "bit_6000":  { col: "bits", cantidad: 6800  },
  "bit_12000": { col: "bits", cantidad: 14000 },
  "bit_30000": { col: "bits", cantidad: 36000 },
};

export const NIVELES_LOGRO: [string, number][] = [
  ["diamante", 20000000],
  ["platino",  10000000],
  ["oro",       5000000],
  ["plata",     1000000],
  ["bronce",     100000],
  ["ninguna",         0],
];

export interface ResultadoAcreditacion {
  ok: boolean;
  yaAcreditado?: boolean;
  error?: string;
}

/**
 * Acredita al comprador los BIT de un paquete y registra el pago en pagos_mp
 * (idempotente por payment_id). Recalcula la insignia de logro y notifica.
 *
 * NO ejecuta la cascada de comisiones a referidos: esa corre solo en el primer
 * paso del webhook para evitar doble acreditación en reintentos.
 */
export async function acreditarBitComprador(
  supabase: SupabaseClient,
  args: { usuario_id: string; paquete: string; paymentId: string; monto: number | null }
): Promise<ResultadoAcreditacion> {
  const { usuario_id, paquete, paymentId, monto } = args;

  const pkg = PAQUETES[paquete];
  if (!pkg) return { ok: false, error: `Paquete inválido: ${paquete}` };
  if (!usuario_id) return { ok: false, error: "usuario_id vacío" };

  // Idempotencia: si ya hay un pago registrado, no volver a acreditar
  const { data: yaAcreditado } = await supabase
    .from("pagos_mp")
    .select("id")
    .eq("payment_id", String(paymentId))
    .single();
  if (yaAcreditado) return { ok: true, yaAcreditado: true };

  const { data: usuario } = await supabase
    .from("usuarios")
    .select("id, bits, bits_totales_acumulados")
    .eq("id", usuario_id)
    .single();
  if (!usuario) return { ok: false, error: `Usuario no encontrado: ${usuario_id}` };

  const actual = (usuario as any)[pkg.col] || 0;
  const nuevo  = pkg.ilimitado ? 99999 : actual + pkg.cantidad;
  const acumuladoActual = (usuario as any).bits_totales_acumulados || 0;
  const nuevoAcumulado  = acumuladoActual + (pkg.ilimitado ? 99999 : pkg.cantidad);
  const insignia = NIVELES_LOGRO.find(([, min]) => nuevoAcumulado >= min)?.[0] || "ninguna";

  const { error: upErr } = await supabase.from("usuarios").update({
    [pkg.col]: nuevo,
    bits_totales_acumulados: nuevoAcumulado,
    insignia_logro: insignia,
  }).eq("id", usuario_id);
  if (upErr) return { ok: false, error: upErr.message };

  // Registrar pago para idempotencia
  const { error: pagoErr } = await supabase.from("pagos_mp").insert({
    payment_id: String(paymentId),
    usuario_id,
    paquete,
    monto,
    estado: "approved",
    bits_col: pkg.col,
    bits_cant: pkg.cantidad,
  });
  if (pagoErr) await logFallo({
    severidad: "critico",
    contexto: "acreditar-pago",
    operacion: "insert_pagos_mp",
    usuario_id,
    datos_contexto: { paymentId, paquete, error: pagoErr },
    error_mensaje: pagoErr.message,
  });

  // Notificación in-app
  const { error: notifErr } = await supabase.from("notificaciones").insert({
    usuario_id,
    tipo: "sistema",
    leida: false,
    mensaje: `✅ Pago aprobado — Se acreditaron ${pkg.cantidad >= 99999 ? "BIT Ilimitados" : pkg.cantidad + " BIT"} en tu cuenta`,
  });
  if (notifErr) await logFallo({
    severidad: "advertencia",
    contexto: "acreditar-pago",
    operacion: "insert_notif_comprador",
    usuario_id,
    datos_contexto: { paymentId, paquete, error: notifErr },
    error_mensaje: notifErr.message,
  });

  return { ok: true };
}
