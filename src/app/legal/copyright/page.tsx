"use client";
import { useState } from "react";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/lib/supabase";

export default function CopyrightClaimPage() {
  const [form, setForm] = useState({ name: "", email: "", description: "", url: "" });
  const [enviado, setEnviado] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const enviar = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.description.trim()) { alert("Completar nombre, email y descripción"); return; }
    setEnviando(true);
    const { error } = await supabase.from("copyright_claims").insert({
      claimant_name: form.name, claimant_email: form.email,
      description: form.description, content_url: form.url || null,
    });
    if (error) { alert("Error: " + error.message); setEnviando(false); return; }
    setEnviado(true);
    setEnviando(false);
  };

  const IS: React.CSSProperties = { width: "100%", border: "2px solid #e8e8e6", borderRadius: "12px", padding: "12px 14px", fontSize: "14px", fontFamily: "'Nunito',sans-serif", color: "#2c2c2e", outline: "none", boxSizing: "border-box", marginBottom: "14px" };

  return (
    <main style={{ paddingTop: "95px", paddingBottom: "130px", background: "#f4f4f2", minHeight: "100vh", fontFamily: "'Nunito',sans-serif" }}>
      <Header />
      <div style={{ padding: "16px", maxWidth: "500px", margin: "0 auto" }}>
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "28px", color: "#1a2a3a", letterSpacing: "1px", marginBottom: "8px" }}>
          ⚖️ Reclamo de Copyright
        </div>
        <div style={{ fontSize: "13px", color: "#9a9a9a", fontWeight: 600, lineHeight: 1.6, marginBottom: "20px" }}>
          Si considerás que algún contenido publicado en NexoNet infringe tus derechos de autor, completá este formulario.
        </div>

        {enviado ? (
          <div style={{ background: "#fff", borderRadius: "16px", padding: "40px 24px", textAlign: "center", boxShadow: "0 2px 10px rgba(0,0,0,0.06)" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>✅</div>
            <div style={{ fontSize: "18px", fontWeight: 900, color: "#27ae60", marginBottom: "8px" }}>Reclamo recibido</div>
            <div style={{ fontSize: "14px", color: "#9a9a9a", fontWeight: 600, lineHeight: 1.6 }}>
              Responderemos en un plazo de 72 horas hábiles. Recibirás una respuesta al email proporcionado.
            </div>
          </div>
        ) : (
          <div style={{ background: "#fff", borderRadius: "16px", padding: "20px", boxShadow: "0 2px 10px rgba(0,0,0,0.06)" }}>
            <label style={{ fontSize: "11px", fontWeight: 800, color: "#666", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "6px", display: "block" }}>Nombre completo *</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Tu nombre completo" style={IS} />

            <label style={{ fontSize: "11px", fontWeight: 800, color: "#666", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "6px", display: "block" }}>Email *</label>
            <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="tu@email.com" style={IS} />

            <label style={{ fontSize: "11px", fontWeight: 800, color: "#666", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "6px", display: "block" }}>URL del contenido (opcional)</label>
            <input value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} placeholder="https://nexonet.app/nexo/..." style={IS} />

            <label style={{ fontSize: "11px", fontWeight: 800, color: "#666", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "6px", display: "block" }}>Descripción del reclamo *</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Describí qué contenido infringe tus derechos y qué derechos tenés sobre el mismo..."
              rows={5} style={{ ...IS, resize: "vertical" }} />

            <button onClick={enviar} disabled={enviando || !form.name.trim() || !form.email.trim() || !form.description.trim()}
              style={{ width: "100%", background: "linear-gradient(135deg,#8e44ad,#6c3483)", border: "none", borderRadius: "14px", padding: "16px", fontSize: "15px", fontWeight: 900, color: "#fff", cursor: "pointer", fontFamily: "'Nunito',sans-serif", opacity: enviando ? 0.6 : 1 }}>
              {enviando ? "⏳ Enviando..." : "📨 Enviar reclamo"}
            </button>
          </div>
        )}
      </div>
      <BottomNav />
    </main>
  );
}
