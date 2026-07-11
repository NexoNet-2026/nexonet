"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";

type TipoCompra = "" | "paquete_anuncios" | "anuncio_destacado" | "suscripcion_nexo" | "conexion_paga" | "otra";

export default function ArrepentimientoPage() {
  const router = useRouter();

  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [cuitDni, setCuitDni] = useState("");
  const [tipoCompra, setTipoCompra] = useState<TipoCompra>("");
  const [tipoCompraOtro, setTipoCompraOtro] = useState("");
  const [fechaCompra, setFechaCompra] = useState("");
  const [monto, setMonto] = useState("");
  const [idTransaccion, setIdTransaccion] = useState("");
  const [motivo, setMotivo] = useState("");
  const [buenaFe, setBuenaFe] = useState(false);

  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [codigoGenerado, setCodigoGenerado] = useState("");
  const [error, setError] = useState("");

  const enviar = async () => {
    setError("");

    if (!nombre.trim() || !email.trim() || !telefono.trim() || !cuitDni.trim() || !tipoCompra || !fechaCompra) {
      setError("Completá todos los campos obligatorios (*)");
      return;
    }
    if (tipoCompra === "otra" && !tipoCompraOtro.trim()) {
      setError("Especificá el tipo de compra");
      return;
    }
    if (!buenaFe) {
      setError("Debés aceptar la declaración de buena fe");
      return;
    }

    setEnviando(true);
    try {
      const res = await fetch("/api/legal/arrepentimiento", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre_completo: nombre.trim(),
          email: email.trim(),
          telefono: telefono.trim(),
          cuit_dni: cuitDni.trim(),
          tipo_compra: tipoCompra,
          tipo_compra_otro: tipoCompra === "otra" ? tipoCompraOtro.trim() : null,
          fecha_compra: fechaCompra,
          monto: monto ? parseFloat(monto) : null,
          id_transaccion_mp: idTransaccion.trim() || null,
          motivo: motivo.trim() || null,
          acepta_buena_fe: buenaFe,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error al enviar la solicitud");
        setEnviando(false);
        return;
      }

      setCodigoGenerado(data.codigo);
      setEnviado(true);
      setEnviando(false);
    } catch (e) {
      setError("Error de conexión, intentá de nuevo");
      setEnviando(false);
    }
  };

  const IS: React.CSSProperties = {
    width: "100%",
    border: "2px solid #e8e8e6",
    borderRadius: "12px",
    padding: "12px 14px",
    fontSize: "14px",
    fontFamily: "'Nunito',sans-serif",
    color: "#2c2c2e",
    outline: "none",
    boxSizing: "border-box",
    marginBottom: "14px",
  };

  const LBL: React.CSSProperties = {
    display: "block",
    fontSize: "12px",
    fontWeight: 800,
    color: "#1a2a3a",
    marginBottom: "6px",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  };

  return (
    <main style={{ paddingTop: "95px", paddingBottom: "130px", background: "#f4f4f2", minHeight: "100vh", fontFamily: "'Nunito',sans-serif" }}>
      <Header />
      <div style={{ padding: "16px", maxWidth: "560px", margin: "0 auto" }}>
        <button onClick={() => router.back()} style={{background:"rgba(26,42,58,0.08)",border:"1px solid rgba(26,42,58,0.2)",borderRadius:"10px",padding:"7px 13px",color:"#1a2a3a",fontSize:"13px",fontWeight:700,cursor:"pointer",fontFamily:"'Nunito',sans-serif",marginBottom:"14px"}}>← Volver</button>
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "28px", color: "#1a2a3a", letterSpacing: "1px", marginBottom: "8px" }}>
          🔄 Botón de Arrepentimiento
        </div>
        <div style={{ fontSize: "12px", color: "#9a9a9a", fontWeight: 600, marginBottom: "12px" }}>Última actualización: Julio 2026</div>
        <div style={{ fontSize: "13px", color: "#9a9a9a", fontWeight: 600, lineHeight: 1.6, marginBottom: "20px" }}>
          Si te arrepentiste de una compra realizada en NexoNet (paquete de anuncios, destacado, suscripción, etc.) y querés solicitar la devolución, complettá el siguiente formulario.
          <br /><br />
          Tenés derecho a revocar tu compra dentro de los <strong>10 días corridos</strong> desde la confirmación del pago, según el Art. 34 de la Ley 24.240 de Defensa del Consumidor.
        </div>

        {enviado ? (
          <div style={{ background: "#fff", borderRadius: "16px", padding: "32px 24px", textAlign: "center", boxShadow: "0 2px 10px rgba(0,0,0,0.06)" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>✅</div>
            <div style={{ fontSize: "18px", fontWeight: 900, color: "#27ae60", marginBottom: "12px" }}>
              Solicitud recibida
            </div>
            <div style={{ fontSize: "13px", color: "#9a9a9a", fontWeight: 600, lineHeight: 1.6, marginBottom: "16px" }}>
              Tu código de identificación es:
            </div>
            <div style={{
              background: "#f4f4f2",
              border: "2px dashed #d4a017",
              borderRadius: "12px",
              padding: "16px",
              margin: "0 auto 20px auto",
              maxWidth: "280px",
              fontFamily: "monospace",
              fontSize: "20px",
              color: "#1a2a3a",
              fontWeight: 900,
              letterSpacing: "1px",
            }}>
              {codigoGenerado}
            </div>
            <div style={{ fontSize: "13px", color: "#9a9a9a", fontWeight: 600, lineHeight: 1.6 }}>
              Te enviamos también este código por email a <strong>{email}</strong>.<br />
              Procesaremos tu solicitud dentro de las próximas 24 horas hábiles.
            </div>
          </div>
        ) : (
          <div style={{ background: "#fff", borderRadius: "16px", padding: "20px", boxShadow: "0 2px 10px rgba(0,0,0,0.06)" }}>
            <label style={LBL}>Nombre completo *</label>
            <input style={IS} type="text" maxLength={100} value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Tu nombre y apellido" />

            <label style={LBL}>Email asociado a tu cuenta *</label>
            <input style={IS} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@email.com" />

            <label style={LBL}>Teléfono / WhatsApp *</label>
            <input style={IS} type="tel" value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="Ej: 3492123456" />

            <label style={LBL}>CUIT / DNI *</label>
            <input style={IS} type="text" value={cuitDni} onChange={(e) => setCuitDni(e.target.value)} placeholder="Sin guiones ni puntos" />

            <label style={LBL}>Tipo de compra que querés revocar *</label>
            <select style={IS} value={tipoCompra} onChange={(e) => setTipoCompra(e.target.value as TipoCompra)}>
              <option value="">Seleccioná una opción...</option>
              <option value="paquete_anuncios">Paquete de anuncios</option>
              <option value="anuncio_destacado">Anuncio destacado</option>
              <option value="suscripcion_nexo">Suscripción de nexo / grupo</option>
              <option value="conexion_paga">Conexión paga oferta-demanda</option>
              <option value="otra">Otra (especificar)</option>
            </select>

            {tipoCompra === "otra" && (
              <>
                <label style={LBL}>Especificá la compra *</label>
                <input style={IS} type="text" value={tipoCompraOtro} onChange={(e) => setTipoCompraOtro(e.target.value)} placeholder="Describí brevemente" />
              </>
            )}

            <label style={LBL}>Fecha aproximada de la compra *</label>
            <input style={IS} type="date" value={fechaCompra} onChange={(e) => setFechaCompra(e.target.value)} />

            <label style={LBL}>Monto aproximado (opcional)</label>
            <input style={IS} type="number" step="0.01" value={monto} onChange={(e) => setMonto(e.target.value)} placeholder="Ej: 1500" />

            <label style={LBL}>ID de transacción de MercadoPago (opcional)</label>
            <input style={IS} type="text" value={idTransaccion} onChange={(e) => setIdTransaccion(e.target.value)} placeholder="Ayuda al procesamiento" />

            <label style={LBL}>Motivo de la revocación (opcional)</label>
            <textarea
              style={{ ...IS, minHeight: "80px", resize: "vertical", fontFamily: "'Nunito',sans-serif" }}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Si querés contarnos por qué..."
            />

            <label style={{ display: "flex", alignItems: "flex-start", gap: "10px", padding: "12px", background: "#f4f4f2", borderRadius: "10px", cursor: "pointer", marginBottom: "16px" }}>
              <input
                type="checkbox"
                checked={buenaFe}
                onChange={(e) => setBuenaFe(e.target.checked)}
                style={{ marginTop: "3px", flexShrink: 0 }}
              />
              <span style={{ fontSize: "13px", color: "#444", lineHeight: 1.5 }}>
                Declaro que la compra que solicito revocar fue realizada por mi cuenta, dentro del plazo legal de 10 días corridos, y que la información proporcionada es verdadera.
              </span>
            </label>

            {error && (
              <div style={{ background: "rgba(231,76,60,0.12)", border: "1px solid rgba(231,76,60,0.4)", borderRadius: "10px", padding: "10px 14px", marginBottom: "14px", fontSize: "13px", color: "#c0392b", fontWeight: 700 }}>
                ⚠️ {error}
              </div>
            )}

            <button
              onClick={enviar}
              disabled={enviando}
              style={{
                width: "100%",
                background: enviando ? "#ccc" : "#d4a017",
                color: "#fff",
                border: "none",
                borderRadius: "12px",
                padding: "14px",
                fontSize: "15px",
                fontWeight: 900,
                cursor: enviando ? "not-allowed" : "pointer",
                fontFamily: "'Nunito',sans-serif",
                letterSpacing: "0.5px",
              }}
            >
              {enviando ? "Enviando..." : "Enviar solicitud →"}
            </button>
          </div>
        )}
      </div>
      <BottomNav />
    </main>
  );
}
