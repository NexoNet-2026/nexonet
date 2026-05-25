import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

// Genera codigo unico del tipo ARR-YYYYMMDD-XXXX
function generarCodigo(): string {
  const fecha = new Date();
  const yyyy = fecha.getFullYear();
  const mm = String(fecha.getMonth() + 1).padStart(2, "0");
  const dd = String(fecha.getDate()).padStart(2, "0");
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sin O,I,1,0 para evitar confusion
  let random = "";
  for (let i = 0; i < 4; i++) {
    random += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `ARR-${yyyy}${mm}${dd}-${random}`;
}

// HTML del email al usuario
function emailUsuario(nombre: string, codigo: string, tipoCompra: string): string {
  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f4f4f2;padding:20px;border-radius:16px">
      <div style="background:#1a2a3a;padding:20px;border-radius:12px;text-align:center;margin-bottom:20px">
        <h1 style="color:#d4a017;margin:0;font-size:28px">NEXONET</h1>
        <p style="color:#9a9a9a;margin:4px 0 0">Argentina</p>
      </div>
      <div style="background:#fff;padding:24px;border-radius:12px;margin-bottom:16px">
        <h2 style="color:#1a2a3a;margin:0 0 12px">✅ Solicitud de arrepentimiento recibida</h2>
        <p style="color:#444;font-size:16px">Hola <strong>${nombre}</strong>,</p>
        <p style="color:#444">
          Recibimos tu solicitud de revocación de compra (<strong>${tipoCompra}</strong>).
          Tu código de identificación es:
        </p>
        <div style="background:#f4f4f2;border:2px dashed #d4a017;border-radius:12px;padding:20px;text-align:center;margin:20px 0">
          <div style="font-family:monospace;font-size:24px;color:#1a2a3a;font-weight:bold;letter-spacing:2px">
            ${codigo}
          </div>
        </div>
        <p style="color:#444">
          Procesaremos tu solicitud dentro de las próximas <strong>24 horas hábiles</strong>.
          El reembolso, si corresponde según el Art. 34 de la Ley 24.240, se gestionará en un plazo máximo de 10 días corridos.
        </p>
        <p style="color:#444;margin-top:16px">
          Para consultas sobre tu solicitud, escribinos a
          <a href="mailto:arrepentimiento@nexonet.ar" style="color:#d4a017">arrepentimiento@nexonet.ar</a>
          mencionando tu código.
        </p>
      </div>
      <p style="color:#9a9a9a;font-size:12px;text-align:center">
        NexoNet Argentina — Botón de Arrepentimiento (Res. 424/2020)
      </p>
    </div>
  `;
}

// HTML del email al admin
function emailAdmin(datos: {
  codigo: string;
  nombre: string;
  email: string;
  telefono: string;
  cuit_dni: string;
  tipo_compra: string;
  tipo_compra_otro: string | null;
  fecha_compra: string;
  monto: number | null;
  id_transaccion_mp: string | null;
  motivo: string | null;
}): string {
  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f4f4f2;padding:20px;border-radius:16px">
      <div style="background:#1a2a3a;padding:20px;border-radius:12px;text-align:center;margin-bottom:20px">
        <h1 style="color:#d4a017;margin:0;font-size:24px">🔄 NUEVA SOLICITUD DE ARREPENTIMIENTO</h1>
      </div>
      <div style="background:#fff;padding:24px;border-radius:12px;margin-bottom:16px">
        <p style="color:#444;font-size:14px;margin:0 0 16px">
          <strong>Código:</strong> <code style="background:#f4f4f2;padding:4px 8px;border-radius:4px">${datos.codigo}</code>
        </p>
        <table style="width:100%;border-collapse:collapse;font-size:14px;color:#444">
          <tr><td style="padding:6px 0;font-weight:bold;width:40%">Nombre:</td><td>${datos.nombre}</td></tr>
          <tr><td style="padding:6px 0;font-weight:bold">Email:</td><td><a href="mailto:${datos.email}">${datos.email}</a></td></tr>
          <tr><td style="padding:6px 0;font-weight:bold">Teléfono:</td><td>${datos.telefono}</td></tr>
          <tr><td style="padding:6px 0;font-weight:bold">CUIT/DNI:</td><td>${datos.cuit_dni}</td></tr>
          <tr><td style="padding:6px 0;font-weight:bold">Tipo de compra:</td><td>${datos.tipo_compra}${datos.tipo_compra_otro ? ` (${datos.tipo_compra_otro})` : ""}</td></tr>
          <tr><td style="padding:6px 0;font-weight:bold">Fecha de compra:</td><td>${datos.fecha_compra}</td></tr>
          ${datos.monto !== null ? `<tr><td style="padding:6px 0;font-weight:bold">Monto:</td><td>$${datos.monto}</td></tr>` : ""}
          ${datos.id_transaccion_mp ? `<tr><td style="padding:6px 0;font-weight:bold">ID MercadoPago:</td><td><code>${datos.id_transaccion_mp}</code></td></tr>` : ""}
        </table>
        ${datos.motivo ? `
          <div style="margin-top:16px;padding:12px;background:#f4f4f2;border-radius:8px">
            <div style="font-weight:bold;margin-bottom:6px">Motivo:</div>
            <div style="color:#666;font-style:italic">${datos.motivo}</div>
          </div>
        ` : ""}
        <div style="margin-top:20px;padding:12px;background:#fff8e0;border-left:4px solid #d4a017;border-radius:4px;font-size:13px;color:#444">
          ⏰ Tenés 24 horas hábiles para responder al solicitante.
          Gestioná desde el panel admin: <a href="https://nexonet.ar/admin/arrepentimientos" style="color:#d4a017">/admin/arrepentimientos</a>
        </div>
      </div>
    </div>
  `;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      nombre_completo,
      email,
      telefono,
      cuit_dni,
      tipo_compra,
      tipo_compra_otro,
      fecha_compra,
      monto,
      id_transaccion_mp,
      motivo,
      acepta_buena_fe,
    } = body;

    // Validaciones
    if (!nombre_completo || !email || !telefono || !cuit_dni || !tipo_compra || !fecha_compra) {
      return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 });
    }
    if (!acepta_buena_fe) {
      return NextResponse.json({ error: "Debés aceptar la declaración de buena fe" }, { status: 400 });
    }
    const tiposValidos = ["paquete_anuncios", "anuncio_destacado", "suscripcion_nexo", "conexion_paga", "otra"];
    if (!tiposValidos.includes(tipo_compra)) {
      return NextResponse.json({ error: "Tipo de compra inválido" }, { status: 400 });
    }
    if (tipo_compra === "otra" && !tipo_compra_otro?.trim()) {
      return NextResponse.json({ error: "Especificá el tipo de compra" }, { status: 400 });
    }

    // Cliente Supabase con service role
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Generar codigo unico (con retry por si hay colision)
    let codigo = "";
    for (let intento = 0; intento < 5; intento++) {
      const candidato = generarCodigo();
      const { data: existente } = await supabase
        .from("solicitudes_arrepentimiento")
        .select("id")
        .eq("codigo", candidato)
        .maybeSingle();
      if (!existente) {
        codigo = candidato;
        break;
      }
    }
    if (!codigo) {
      return NextResponse.json({ error: "No se pudo generar código único, reintentá" }, { status: 500 });
    }

    // Insertar
    const { error: insertError } = await supabase
      .from("solicitudes_arrepentimiento")
      .insert({
        codigo,
        nombre_completo: nombre_completo.trim(),
        email: email.trim().toLowerCase(),
        telefono: telefono.trim(),
        cuit_dni: cuit_dni.trim(),
        tipo_compra,
        tipo_compra_otro: tipo_compra === "otra" ? (tipo_compra_otro?.trim() || null) : null,
        fecha_compra,
        monto: monto || null,
        id_transaccion_mp: id_transaccion_mp?.trim() || null,
        motivo: motivo?.trim() || null,
      });

    if (insertError) {
      console.error("Error insertando arrepentimiento:", insertError);
      return NextResponse.json({ error: "Error guardando solicitud" }, { status: 500 });
    }

    // Mandar emails (no bloquea la respuesta si fallan)
    if (resend) {
      const tipoLegible: Record<string, string> = {
        paquete_anuncios: "Paquete de anuncios",
        anuncio_destacado: "Anuncio destacado",
        suscripcion_nexo: "Suscripción de nexo",
        conexion_paga: "Conexión paga",
        otra: tipo_compra_otro || "Otra",
      };

      try {
        await resend.emails.send({
          from: "NexoNet Argentina <notificaciones@nexonet.ar>",
          to: email.trim().toLowerCase(),
          subject: `Solicitud de arrepentimiento ${codigo} recibida`,
          html: emailUsuario(nombre_completo.trim(), codigo, tipoLegible[tipo_compra]),
        });
      } catch (e) {
        console.error("Error mail usuario:", e);
      }

      try {
        await resend.emails.send({
          from: "NexoNet Argentina <notificaciones@nexonet.ar>",
          to: "nexonet.ar@gmail.com",
          subject: `🔄 Nueva solicitud ${codigo}`,
          html: emailAdmin({
            codigo,
            nombre: nombre_completo.trim(),
            email: email.trim().toLowerCase(),
            telefono: telefono.trim(),
            cuit_dni: cuit_dni.trim(),
            tipo_compra: tipoLegible[tipo_compra],
            tipo_compra_otro: tipo_compra === "otra" ? tipo_compra_otro || null : null,
            fecha_compra,
            monto: monto || null,
            id_transaccion_mp: id_transaccion_mp || null,
            motivo: motivo || null,
          }),
        });
      } catch (e) {
        console.error("Error mail admin:", e);
      }
    } else {
      console.log("RESEND_API_KEY no configurada — emails NO enviados");
    }

    return NextResponse.json({ success: true, codigo });
  } catch (e) {
    console.error("Error en /api/legal/arrepentimiento:", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
