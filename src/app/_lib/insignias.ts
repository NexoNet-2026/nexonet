import { supabase } from "@/lib/supabase";

const NIVELES: [string, number][] = [
  ["diamante", 10000],
  ["platino",  5000],
  ["oro",      1000],
  ["plata",    500],
  ["bronce",   100],
  ["ninguna",  0],
];

export function calcularNivel(bitsTotales: number): string {
  for (const [nivel, min] of NIVELES) {
    if (bitsTotales >= min) return nivel;
  }
  return "ninguna";
}

/** Recalculates insignia_logro for a user based on bits_totales_acumulados */
export async function recalcularInsigniaLogro(usuarioId: string) {
  const { data } = await supabase
    .from("usuarios")
    .select("bits_totales_acumulados")
    .eq("id", usuarioId)
    .single();
  if (!data) return;
  const nivel = calcularNivel(data.bits_totales_acumulados || 0);
  await supabase.from("usuarios").update({ insignia_logro: nivel }).eq("id", usuarioId);
  return nivel;
}

/** Adds bits to bits_totales_acumulados and recalculates insignia */
export async function acumularBitsYRecalcular(usuarioId: string, cantidadNueva: number) {
  const { data } = await supabase
    .from("usuarios")
    .select("bits_totales_acumulados")
    .eq("id", usuarioId)
    .single();
  if (!data) return;
  const nuevo = (data.bits_totales_acumulados || 0) + cantidadNueva;
  const nivel = calcularNivel(nuevo);
  await supabase.from("usuarios").update({
    bits_totales_acumulados: nuevo,
    insignia_logro: nivel,
  }).eq("id", usuarioId);
  return nivel;
}
