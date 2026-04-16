import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Solo se llama cuando el comprador NO tiene referido_por (sin cascada)
export async function acreditarSocios(compradorId: string, bitsComprados: number) {
  // 1. Socio principal — solo si el comprador no tiene cadena de referidos
  const { data: compCheck } = await supabase
    .from("usuarios")
    .select("referido_por")
    .eq("id", compradorId)
    .single();

  if (!compCheck?.referido_por) {
    const { data: principal } = await supabase
      .from("socios_comerciales")
      .select("*")
      .eq("tipo", "principal")
      .eq("activo", true)
      .limit(1)
      .maybeSingle();

    if (principal) {
      const bitsP = Math.floor(bitsComprados * (principal.porcentaje / 100));
      if (bitsP > 0) {
        const { data: uP } = await supabase.from("usuarios").select("bits_promo,bits_promotor_total").eq("id", principal.usuario_id).single();
        if (uP) {
          await supabase.from("usuarios").update({
            bits_promo: (uP.bits_promo || 0) + bitsP,
            bits_promotor_total: (uP.bits_promotor_total || 0) + bitsP,
          }).eq("id", principal.usuario_id);
        }
        await supabase.from("socios_comerciales").update({
          bits_promotor_acumulado: (principal.bits_promotor_acumulado || 0) + bitsP,
        }).eq("id", principal.id);
        await supabase.from("log_socios_comerciales").insert({
          socio_id: principal.id,
          usuario_comprador_id: compradorId,
          bits_comprados: bitsComprados,
          porcentaje: principal.porcentaje,
          bits_acreditados: bitsP,
          concepto: "Compra de BIT — Socio Principal (sin referidor)",
        });
      }
    }
  }

  // 2. Socio regional del comprador (siempre se acredita)
  const { data: comprador } = await supabase
    .from("usuarios")
    .select("socio_regional_id")
    .eq("id", compradorId)
    .single();

  if (comprador?.socio_regional_id) {
    const { data: regional } = await supabase
      .from("socios_comerciales")
      .select("*")
      .eq("id", comprador.socio_regional_id)
      .eq("activo", true)
      .single();

    if (regional) {
      const bitsR = Math.floor(bitsComprados * (regional.porcentaje / 100));
      if (bitsR > 0) {
        const { data: uR } = await supabase.from("usuarios").select("bits_promo,bits_promotor_total").eq("id", regional.usuario_id).single();
        if (uR) {
          await supabase.from("usuarios").update({
            bits_promo: (uR.bits_promo || 0) + bitsR,
            bits_promotor_total: (uR.bits_promotor_total || 0) + bitsR,
          }).eq("id", regional.usuario_id);
        }
        await supabase.from("socios_comerciales").update({
          bits_promotor_acumulado: (regional.bits_promotor_acumulado || 0) + bitsR,
        }).eq("id", regional.id);
        await supabase.from("log_socios_comerciales").insert({
          socio_id: regional.id,
          usuario_comprador_id: compradorId,
          bits_comprados: bitsComprados,
          porcentaje: regional.porcentaje,
          bits_acreditados: bitsR,
          concepto: "Compra de BIT — Socio Regional",
        });
      }
    }
  }
}
