import { Resend } from "resend";
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export async function enviarEmail(to: string, subject: string, html: string) {
  if (!resend) {
    console.log("Email no enviado — RESEND_API_KEY no configurada");
    return;
  }
  try {
    await resend.emails.send({
      from: "NexoNet Argentina <notificaciones@nexonet.ar>",
      to,
      subject,
      html,
    });
  } catch (e) {
    console.error("Error enviando email:", e);
  }
}

export function emailVencimiento(nombre: string, tipo: string, titulo: string, dias: number, renovar_url: string) {
  const urgencia = dias === 0 ? "🔴 VENCIÓ HOY" : dias === 1 ? "🟠 Vence mañana" : `🟡 Vence en ${dias} días`;
  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f4f4f2;padding:20px;border-radius:16px">
      <div style="background:#1a2a3a;padding:20px;border-radius:12px;text-align:center;margin-bottom:20px">
        <h1 style="color:#d4a017;margin:0;font-size:28px">NEXONET</h1>
        <p style="color:#9a9a9a;margin:4px 0 0">Argentina</p>
      </div>
      <div style="background:#fff;padding:24px;border-radius:12px;margin-bottom:16px">
        <h2 style="color:#1a2a3a;margin:0 0 12px">${urgencia}</h2>
        <p style="color:#444;font-size:16px">Hola <strong>${nombre}</strong>,</p>
        <p style="color:#444">Tu <strong>${tipo}</strong> "<strong>${titulo}</strong>" ${dias === 0 ? "venció hoy" : `vence en ${dias} día${dias > 1 ? "s" : ""}`}.</p>
        ${dias === 0 ? '<p style="color:#e74c3c;font-weight:bold">Si no renovás, será suspendido automáticamente.</p>' : ""}
        <a href="${renovar_url}" style="display:inline-block;background:#d4a017;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin-top:12px">
          Renovar ahora →
        </a>
      </div>
      <p style="color:#9a9a9a;font-size:12px;text-align:center">NexoNet Argentina — nexonet.vercel.app</p>
    </div>
  `;
}
