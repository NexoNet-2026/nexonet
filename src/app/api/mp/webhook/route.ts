// src/app/api/mp/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { logFallo } from "@/lib/log-fallos";
import { PRECIO_NEGOCIO_MENSUAL } from "@/lib/precios";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN!;

// Mapa paquete → columna Supabase y cantidad
const PAQUETES: Record<string, { col: string; cantidad: number; ilimitado?: boolean }> = {
  "bit_500":   { col: "bits", cantidad: 500   },
  "bit_1500":  { col: "bits", cantidad: 1600  },
  "bit_3000":  { col: "bits", cantidad: 3300  },
  "bit_6000":  { col: "bits", cantidad: 6800  },
  "bit_12000": { col: "bits", cantidad: 14000 },
  "bit_30000": { col: "bits", cantidad: 36000 },
};

export async function POST(req: NextRequest) {
  try {
    const secret = process.env.MP_WEBHOOK_SECRET;
    if (secret) {
      const xSignature = req.headers.get('x-signature');
      const xRequestId = req.headers.get('x-request-id');
      const { searchParams } = new URL(req.url);
      const dataId = searchParams.get('data.id');

      if (xSignature && xRequestId && dataId) {
        const manifest = 'id:' + dataId + ';request-id:' + xRequestId + ';ts:' + xSignature.split(',').find(p => p.startsWith('ts='))?.split('=')[1] + ';';
        const { createHmac } = await import('crypto');
        const hash = createHmac('sha256', secret).update(manifest).digest('hex');
        const v1 = xSignature.split(',').find(p => p.startsWith('v1='))?.split('=')[1];
        if (hash !== v1) {
          console.warn('MP Webhook firma inválida');
          await logFallo({
            severidad: "advertencia",
            contexto: "webhook-mp",
            operacion: "firma_invalida",
            usuario_id: null,
            datos_contexto: { xSignature, xRequestId, dataId },
            error_mensaje: "HMAC signature verification failed",
          });
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
      }
    }

    const body = await req.json();

    // ── Suscripciones (preapproval) ──
    if (body.type === "subscription_preapproval") {
      const preapprovalId = body.data?.id;
      if (preapprovalId) {
        const mpRes = await fetch(`https://api.mercadopago.com/preapproval/${preapprovalId}`, {
          headers: { "Authorization": `Bearer ${ACCESS_TOKEN}` },
        });
        const pre = await mpRes.json();
        const nuevoEstado = pre.status === "authorized" ? "authorized" : pre.status === "cancelled" ? "cancelled" : pre.status === "paused" ? "paused" : "pending";
        const { error: upPreErr } = await supabase.from("suscripciones_mp").update({
          estado: nuevoEstado,
          updated_at: new Date().toISOString(),
        }).eq("mp_preapproval_id", preapprovalId);
        if (upPreErr) await logFallo({
          severidad: "advertencia",
          contexto: "webhook-mp",
          operacion: "update_suscripcion_preapproval",
          datos_contexto: { preapprovalId, nuevoEstado, error: upPreErr },
          error_mensaje: upPreErr.message,
        });
      }
      return NextResponse.json({ ok: true });
    }

    // ── Pagos de suscripción (authorized_payment) ──
    if (body.type === "subscription_authorized_payment") {
      const payId = body.data?.id;
      if (payId) {
        const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${payId}`, {
          headers: { "Authorization": `Bearer ${ACCESS_TOKEN}` },
        });
        const pago = await mpRes.json();
        if (pago.status === "approved" && pago.metadata?.preapproval_id) {
          const { data: sub } = await supabase.from("suscripciones_mp")
            .select("*").eq("mp_preapproval_id", pago.metadata.preapproval_id).single();
          if (sub) {
            // Acreditar BIT según tipo
            const bitsCantidad = sub.tipo === "empresa" ? PRECIO_NEGOCIO_MENSUAL : 500;
            const { data: usr } = await supabase.from("usuarios").select("bits").eq("id", sub.usuario_id).single();
            if (usr) {
              const { error: upSubBitsErr } = await supabase.from("usuarios").update({ bits: (usr.bits || 0) + bitsCantidad }).eq("id", sub.usuario_id);
              if (upSubBitsErr) await logFallo({
                severidad: "critico",
                contexto: "webhook-mp",
                operacion: "update_usuario_bits_suscripcion",
                usuario_id: sub.usuario_id,
                datos_contexto: { bitsCantidad, tipo: sub.tipo, payId, error: upSubBitsErr },
                error_mensaje: upSubBitsErr.message,
              });
            }
            // Actualizar próximo cobro
            const { error: upCobroErr } = await supabase.from("suscripciones_mp").update({
              proximo_cobro: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              updated_at: new Date().toISOString(),
            }).eq("id", sub.id);
            if (upCobroErr) await logFallo({
              severidad: "advertencia",
              contexto: "webhook-mp",
              operacion: "update_proximo_cobro",
              usuario_id: sub.usuario_id,
              datos_contexto: { sub_id: sub.id, error: upCobroErr },
              error_mensaje: upCobroErr.message,
            });
            // Notificar
            const mensajeSub = `💳 Débito automático: se acreditaron ${bitsCantidad.toLocaleString()} BIT por tu suscripción de ${sub.tipo}.`;
            const { error: notifSubErr } = await supabase.from("notificaciones").insert({
              usuario_id: sub.usuario_id, tipo: "sistema", leida: false,
              mensaje: mensajeSub,
            });
            if (notifSubErr) await logFallo({
              severidad: "advertencia",
              contexto: "webhook-mp",
              operacion: "insert_notif_suscripcion",
              usuario_id: sub.usuario_id,
              datos_contexto: { usuario_id_destino: sub.usuario_id, mensaje: mensajeSub, bitsCantidad, tipo: sub.tipo, error: notifSubErr },
              error_mensaje: notifSubErr.message,
            });
          }
        }
      }
      return NextResponse.json({ ok: true });
    }

    // Solo procesar pagos aprobados (compra directa)
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
      await logFallo({
        severidad: "advertencia",
        contexto: "webhook-mp",
        operacion: "paquete_invalido",
        usuario_id,
        datos_contexto: { paquete, paymentId, external_reference: ref },
        error_mensaje: `Paquete no encontrado: ${paquete}`,
      });
      return NextResponse.json({ ok: true });
    }

    // Verificar que no se acreditó antes (idempotencia)
    const { data: yaAcreditado } = await supabase
      .from("pagos_mp")
      .select("id")
      .eq("payment_id", String(paymentId))
      .single();

    if (yaAcreditado) {
      return NextResponse.json({ ok: true });
    }

    // Obtener usuario actual
    const { data: usuario } = await supabase
      .from("usuarios")
      .select("id, bits, bits_busquedas, bits_totales_acumulados")
      .eq("id", usuario_id)
      .single();

    if (!usuario) {
      await logFallo({
        severidad: "advertencia",
        contexto: "webhook-mp",
        operacion: "usuario_compra_no_existe",
        usuario_id,
        datos_contexto: { paquete, paymentId, external_reference: ref },
        error_mensaje: `Usuario no encontrado: ${usuario_id}`,
      });
      return NextResponse.json({ ok: true });
    }

    // Calcular nuevo valor
    const actual = (usuario as any)[pkg.col] || 0;
    const nuevo  = pkg.ilimitado ? 99999 : actual + pkg.cantidad;

    // Acreditar BIT + recalcular insignia de logro
    const acumuladoActual = (usuario as any).bits_totales_acumulados || 0;
    const nuevoAcumulado  = acumuladoActual + (pkg.ilimitado ? 99999 : pkg.cantidad);
    const NIVELES_LOGRO: [string, number][] = [["diamante",20000000],["platino",10000000],["oro",5000000],["plata",1000000],["bronce",100000],["ninguna",0]];
    const insignia = NIVELES_LOGRO.find(([, min]) => nuevoAcumulado >= min)?.[0] || "ninguna";
    const { error: upCompraErr } = await supabase.from("usuarios").update({
      [pkg.col]: nuevo,
      bits_totales_acumulados: nuevoAcumulado,
      insignia_logro: insignia,
    }).eq("id", usuario_id);
    if (upCompraErr) await logFallo({
      severidad: "critico",
      contexto: "webhook-mp",
      operacion: "update_usuario_compra",
      usuario_id,
      datos_contexto: { paquete, paymentId, col: pkg.col, nuevo, nuevoAcumulado, error: upCompraErr },
      error_mensaje: upCompraErr.message,
    });

    // Registrar pago para idempotencia
    const { error: pagoInsertErr } = await supabase.from("pagos_mp").insert({
      payment_id:   String(paymentId),
      usuario_id,
      paquete,
      monto:        pago.transaction_amount,
      estado:       "approved",
      bits_col:     pkg.col,
      bits_cant:    pkg.cantidad,
    });
    if (pagoInsertErr) await logFallo({
      severidad: "critico",
      contexto: "webhook-mp",
      operacion: "insert_pagos_mp",
      usuario_id,
      datos_contexto: {
        usuario_id_destino: usuario_id,
        payment_id: String(paymentId),
        paquete,
        monto: pago.transaction_amount,
        estado: "approved",
        bits_col: pkg.col,
        bits_cant: pkg.cantidad,
        paymentId,
        error: pagoInsertErr,
      },
      error_mensaje: pagoInsertErr.message,
    });

    // Notificación in-app
    const mensajeComprador = `✅ Pago aprobado — Se acreditaron ${pkg.cantidad >= 99999 ? "BIT Ilimitados" : pkg.cantidad + " BIT"} en tu cuenta`;
    const { error: notifCompradorErr } = await supabase.from("notificaciones").insert({
      usuario_id,
      tipo:    "sistema",
      mensaje: mensajeComprador,
      leida:   false,
    });
    if (notifCompradorErr) await logFallo({
      severidad: "advertencia",
      contexto: "webhook-mp",
      operacion: "insert_notif_comprador",
      usuario_id,
      datos_contexto: { usuario_id_destino: usuario_id, mensaje: mensajeComprador, paquete, paymentId, cantidad: pkg.cantidad, error: notifCompradorErr },
      error_mensaje: notifCompradorErr.message,
    });

    // ── Comisión en cascada ilimitada ──
    let tieneCascada = false;
    try {
      const { data: refUser } = await supabase.from("usuarios").select("nombre_usuario,nombre,referido_por").eq("id", usuario_id).single();
      const nombreRef = refUser?.nombre_usuario || refUser?.nombre || "un referido";
      tieneCascada = !!refUser?.referido_por;
      let currentId = usuario_id;
      let comisionBase = pkg.cantidad;
      const visitados = new Set<string>();

      while (comisionBase > 0) {
        const { data: current } = await supabase
          .from("usuarios")
          .select("referido_por")
          .eq("id", currentId)
          .single();

        if (!current?.referido_por || visitados.has(current.referido_por)) break;
        visitados.add(current.referido_por);

        const { data: promotor } = await supabase
          .from("usuarios")
          .select("bits_promo, bits_promotor_total, codigo")
          .eq("id", current.referido_por)
          .single();

        if (!promotor) break;

        // Si el promotor es socio comercial activo, usar su porcentaje personalizado
        const { data: socio } = await supabase
          .from("socios_comerciales")
          .select("porcentaje")
          .eq("usuario_id", current.referido_por)
          .eq("activo", true)
          .maybeSingle();

        const porcentaje = socio ? (socio.porcentaje / 100) : 0.20;
        const comision = Math.floor(comisionBase * porcentaje);

        // Si la comisión redondea a 0 pero la base sigue siendo positiva, no cortamos:
        // pasamos al siguiente eslabón con la base intacta (eslabón "transparente").
        if (comision <= 0) {
          if (comisionBase <= 0) break;
          currentId = current.referido_por;
          continue;
        }

        const { error: upCascadaErr } = await supabase.from("usuarios").update({
          bits_promo: (promotor.bits_promo || 0) + comision,
          bits_promotor_total: (promotor.bits_promotor_total || 0) + comision,
        }).eq("id", current.referido_por);
        if (upCascadaErr) await logFallo({
          severidad: "critico",
          contexto: "webhook-mp",
          operacion: "update_cascada_promo",
          usuario_id: current.referido_por,
          datos_contexto: { comision, nivel: visitados.size, referido_origen: usuario_id, paymentId, error: upCascadaErr },
          error_mensaje: upCascadaErr.message,
        });

        // Actualizar acumulado del socio si aplica
        if (socio) {
          const { data: socioData } = await supabase.from("socios_comerciales")
            .select("bits_promotor_acumulado")
            .eq("usuario_id", current.referido_por)
            .eq("activo", true)
            .single();
          if (socioData) {
            const { error: upSocioErr } = await supabase.from("socios_comerciales")
              .update({ bits_promotor_acumulado: (socioData.bits_promotor_acumulado || 0) + comision })
              .eq("usuario_id", current.referido_por)
              .eq("activo", true);
            if (upSocioErr) await logFallo({
              severidad: "critico",
              contexto: "webhook-mp",
              operacion: "update_socio_acumulado",
              usuario_id: current.referido_por,
              datos_contexto: { comision, acumulado_prev: socioData.bits_promotor_acumulado || 0, paymentId, error: upSocioErr },
              error_mensaje: upSocioErr.message,
            });
          }
        }

        const nivel = visitados.size;
        const pctLabel = socio ? `${socio.porcentaje}% socio` : "20%";
        const notifMensaje = `⭐ Recibiste ${comision.toLocaleString()} BIT Promo de comisión (${pctLabel}) por tu referido ${nombreRef}${nivel > 1 ? ` (nivel ${nivel})` : ""}`;
        const { error: notifCascadaErr } = await supabase.from("notificaciones").insert({
          usuario_id: current.referido_por,
          tipo: "sistema",
          mensaje: notifMensaje,
          leida: false,
        });
        if (notifCascadaErr) await logFallo({
          severidad: "advertencia",
          contexto: "webhook-mp",
          operacion: "insert_notif_cascada",
          usuario_id: current.referido_por,
          datos_contexto: { usuario_id_destino: current.referido_por, mensaje: notifMensaje, comision, nivel, pctLabel, paymentId, error: notifCascadaErr },
          error_mensaje: notifCascadaErr.message,
        });

        const logMotivo = `Comisión nivel ${nivel} (${pctLabel}) — referido ${usuario_id} compró ${pkg.cantidad} BIT (paquete: ${paquete})`;
        const { error: logCascadaErr } = await supabase.from("log_bits_internos").insert({
          usuario_id: current.referido_por,
          cantidad: comision,
          motivo: logMotivo,
          asignado_por: usuario_id,
        });
        if (logCascadaErr) await logFallo({
          severidad: "critico",
          contexto: "webhook-mp",
          operacion: "insert_log_cascada",
          usuario_id: current.referido_por,
          datos_contexto: { usuario_id_destino: current.referido_por, motivo: logMotivo, comision, nivel, pctLabel, referido_origen: usuario_id, paymentId, error: logCascadaErr },
          error_mensaje: logCascadaErr.message,
        });

        comisionBase = comision;
        currentId = current.referido_por;
      }
    } catch (e: any) {
      await logFallo({
        severidad: "critico",
        contexto: "webhook-mp",
        operacion: "catch_cascada",
        usuario_id,
        datos_contexto: { paymentId, paquete, error: String(e) },
        error_mensaje: e?.message || String(e),
      });
    }

    // Acreditar socios comerciales solo si el comprador NO tiene cadena de referidos
    if (!tieneCascada) {
      try {
        const { acreditarSocios } = await import("@/lib/socios");
        await acreditarSocios(usuario_id, pkg.cantidad);
      } catch (_) {}
    }

    return NextResponse.json({ ok: true });

  } catch (err: any) {
    await logFallo({
      severidad: "critico",
      contexto: "webhook-mp",
      operacion: "catch_endpoint",
      datos_contexto: { error: String(err) },
      error_mensaje: err?.message || String(err),
    });
    return NextResponse.json({ ok: true }); // Siempre 200 para MP
  }
}

// MP también hace GET para verificar el endpoint
export async function GET() {
  return NextResponse.json({ ok: true });
}
