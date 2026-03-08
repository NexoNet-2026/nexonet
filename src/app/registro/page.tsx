"use client";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function Registro() {
  const router = useRouter();
  const [paso, setPaso] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    nombre_usuario: "",
    nombre: "",
    email: "",
    whatsapp: "",
    password: "",
    confirmar: "",
    codigo_promotor_ref: "",
  });

  const handleRegistro = async () => {
    if (!form.nombre_usuario || !form.email || !form.password) {
      setError("Completá los campos obligatorios");
      return;
    }
    if (form.password !== form.confirmar) {
      setError("Las contraseñas no coinciden");
      return;
    }
    if (form.password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    setLoading(true);
    setError("");

    // 1. Crear en Supabase Auth
    const { data, error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
    });

    if (authError) {
      setError(authError.message === "User already registered"
        ? "Este email ya está registrado"
        : "Error al registrarse: " + authError.message
      );
      setLoading(false);
      return;
    }

    if (!data.user) {
      setError("No se pudo crear el usuario. Intentá de nuevo.");
      setLoading(false);
      return;
    }

    // 2. Generar código y crear perfil
    const { data: codigoData, error: rpcError } = await supabase.rpc("generar_codigo_usuario");
    
    if (rpcError) {
      setError("Error generando código: " + rpcError.message);
      setLoading(false);
      return;
    }

    const { error: insertError } = await supabase.from("usuarios").insert({
      id: data.user.id,
      email: form.email,
      nombre: form.nombre || null,
      nombre_usuario: form.nombre_usuario,
      whatsapp: form.whatsapp || null,
      codigo: codigoData,
      codigo_promotor_ref: form.codigo_promotor_ref || null,
    });

    if (insertError) {
      setError("Error guardando perfil: " + insertError.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    setPaso(2);
  };

  return (
    <main style={{ paddingTop: "95px", paddingBottom: "130px", background: "#f4f4f2", minHeight: "100vh", fontFamily: "'Nunito', sans-serif" }}>
      <Header />
      <div style={{ padding: "24px 16px", maxWidth: "400px", margin: "0 auto" }}>

        {/* PASOS */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginBottom: "28px" }}>
          {[1, 2].map((p) => (
            <div key={p} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: paso >= p ? "linear-gradient(135deg, #d4a017, #f0c040)" : "#e8e8e6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: 900, color: paso >= p ? "#1a2a3a" : "#9a9a9a" }}>{p}</div>
              {p < 2 && <div style={{ width: "40px", height: "2px", background: paso > p ? "#d4a017" : "#e8e8e6", borderRadius: "2px" }} />}
            </div>
          ))}
        </div>

        {/* PASO 1 */}
        {paso === 1 && (
          <div style={{ background: "#fff", borderRadius: "20px", padding: "24px", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "24px", color: "#1a2a3a", letterSpacing: "2px", marginBottom: "20px" }}>Creá tu cuenta</div>

            {error && (
              <div style={{ background: "#fff0f0", border: "1px solid #ffcccc", borderRadius: "10px", padding: "12px", marginBottom: "16px", fontSize: "13px", color: "#cc0000", fontWeight: 700 }}>
                ⚠️ {error}
              </div>
            )}

            <Campo label="Nombre de usuario *" value={form.nombre_usuario} onChange={(v) => setForm({ ...form, nombre_usuario: v })} placeholder="El nombre que verán los demás" />
            <Campo label="Nombre real" value={form.nombre} onChange={(v) => setForm({ ...form, nombre: v })} placeholder="Tu nombre (opcional)" />
            <Campo label="Email *" value={form.email} onChange={(v) => setForm({ ...form, email: v })} placeholder="tu@email.com" type="email" />
            <Campo label="WhatsApp" value={form.whatsapp} onChange={(v) => setForm({ ...form, whatsapp: v })} placeholder="Ej: 3492123456" type="tel" />
            <Campo label="Contraseña *" value={form.password} onChange={(v) => setForm({ ...form, password: v })} placeholder="Mínimo 6 caracteres" type="password" />
            <Campo label="Confirmar contraseña *" value={form.confirmar} onChange={(v) => setForm({ ...form, confirmar: v })} placeholder="Repetí tu contraseña" type="password" />

            {/* CÓDIGO PROMOTOR */}
            <div style={{ marginBottom: "14px", background: "rgba(212,160,23,0.06)", border: "1px solid rgba(212,160,23,0.3)", borderRadius: "12px", padding: "12px" }}>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 800, color: "#d4a017", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "6px" }}>
                ⭐ Código de promotor (opcional)
              </label>
              <input
                type="text"
                value={form.codigo_promotor_ref}
                onChange={(e) => setForm({ ...form, codigo_promotor_ref: e.target.value.toUpperCase() })}
                placeholder="Ej: NXN-00001"
                style={{ width: "100%", border: "2px solid rgba(212,160,23,0.4)", borderRadius: "10px", padding: "10px 14px", fontSize: "14px", fontFamily: "'Nunito', sans-serif", color: "#2c2c2e", outline: "none", boxSizing: "border-box", background: "#fff" }}
              />
              <div style={{ fontSize: "11px", color: "#9a9a9a", fontWeight: 600, marginTop: "6px" }}>
                Si alguien te invitó, ingresá su código NXN-XXXXX
              </div>
            </div>

            <button onClick={handleRegistro} disabled={loading} style={{
              width: "100%", background: loading ? "#ccc" : "linear-gradient(135deg, #d4a017, #f0c040)",
              color: "#1a2a3a", border: "none", borderRadius: "12px", padding: "16px",
              fontSize: "15px", fontWeight: 800, fontFamily: "'Nunito', sans-serif",
              cursor: loading ? "not-allowed" : "pointer", letterSpacing: "1px", textTransform: "uppercase", marginTop: "8px",
            }}>
              {loading ? "Registrando..." : "Crear cuenta →"}
            </button>

            <div style={{ textAlign: "center", marginTop: "16px" }}>
              <span style={{ fontSize: "13px", color: "#666", fontWeight: 600 }}>¿Ya tenés cuenta? </span>
              <a href="/login" style={{ fontSize: "13px", color: "#d4a017", fontWeight: 800, textDecoration: "none" }}>Ingresá →</a>
            </div>
          </div>
        )}

        {/* PASO 2 — BIENVENIDA */}
        {paso === 2 && (
          <div style={{ background: "#fff", borderRadius: "20px", padding: "32px 24px", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", textAlign: "center" }}>
            <div style={{ fontSize: "60px", marginBottom: "16px" }}>🎉</div>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "26px", color: "#1a2a3a", letterSpacing: "2px", marginBottom: "12px" }}>¡Bienvenido!</div>
            <div style={{ fontSize: "14px", color: "#666", fontWeight: 600, lineHeight: 1.6, marginBottom: "8px" }}>
              Tu cuenta fue creada con éxito
            </div>
            <div style={{ fontSize: "15px", fontWeight: 800, color: "#1a2a3a", marginBottom: "20px" }}>{form.email}</div>
            <div style={{ background: "#f4f4f2", borderRadius: "12px", padding: "14px", marginBottom: "20px" }}>
              <div style={{ fontSize: "12px", color: "#9a9a9a", fontWeight: 600, marginBottom: "4px" }}>Tu nombre de usuario</div>
              <div style={{ fontSize: "18px", fontWeight: 900, color: "#1a2a3a" }}>{form.nombre_usuario}</div>
              <div style={{ fontSize: "11px", color: "#9a9a9a", fontWeight: 600, marginTop: "4px" }}>Tu código NXN se generó automáticamente</div>
            </div>
            <button onClick={() => router.push("/login")} style={{
              width: "100%", background: "linear-gradient(135deg, #d4a017, #f0c040)",
              color: "#1a2a3a", border: "none", borderRadius: "12px", padding: "16px",
              fontSize: "15px", fontWeight: 800, fontFamily: "'Nunito', sans-serif",
              cursor: "pointer", letterSpacing: "1px", textTransform: "uppercase",
            }}>
              Ir al login →
            </button>
          </div>
        )}

      </div>
      <BottomNav />
    </main>
  );
}

function Campo({ label, value, onChange, placeholder, type = "text" }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; }) {
  return (
    <div style={{ marginBottom: "14px" }}>
      <label style={{ display: "block", fontSize: "11px", fontWeight: 800, color: "#666", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "6px" }}>{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={{ width: "100%", border: "2px solid #e8e8e6", borderRadius: "10px", padding: "12px 14px", fontSize: "14px", fontFamily: "'Nunito', sans-serif", color: "#2c2c2e", outline: "none", boxSizing: "border-box" }} />
    </div>
  );
}
