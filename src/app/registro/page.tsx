"use client";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Paso = "formulario" | "verificacion" | "codigo";

export default function Registro() {
  const [paso, setPaso] = useState<Paso>("formulario");
  const [metodo, setMetodo] = useState<"email" | "whatsapp" | null>(null);
  const [codigo, setCodigo] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    usuario: "",
    whatsapp: "",
    email: "",
    contrasena: "",
    confirmar: "",
  });
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFormulario = () => {
    if (!form.usuario || !form.whatsapp || !form.email || !form.contrasena || !form.confirmar) {
      setError("Completá todos los campos"); return;
    }
    if (form.contrasena !== form.confirmar) {
      setError("Las contraseñas no coinciden"); return;
    }
    setError("");
    setPaso("verificacion");
  };

  const handleMetodo = (m: "email" | "whatsapp") => {
    setMetodo(m);
    setPaso("codigo");
    // aquí irá la llamada al backend para enviar el código
  };

  const handleCodigo = () => {
    if (codigo.length < 4) {
      setError("Ingresá el código completo"); return;
    }
    // aquí irá la validación del código con el backend
    router.push("/login");
  };

  return (
    <main style={{ paddingTop: "60px", paddingBottom: "100px", background: "#f4f4f2", minHeight: "100vh", fontFamily: "'Nunito', sans-serif" }}>
      <Header />

      {/* HERO */}
      <div style={{ background: "linear-gradient(135deg, #1a2a3a 0%, #243b55 100%)", padding: "32px 16px", textAlign: "center" }}>
        <div style={{ fontSize: "13px", fontWeight: 700, color: "#d4a017", letterSpacing: "2px", textTransform: "uppercase", marginBottom: "4px" }}>
          {paso === "formulario" && "Crear cuenta"}
          {paso === "verificacion" && "Verificar identidad"}
          {paso === "codigo" && "Ingresá el código"}
        </div>
        <div style={{ fontSize: "12px", color: "#7a8fa0", fontWeight: 600 }}>
          {paso === "formulario" && "Unite a la comunidad NexoNet"}
          {paso === "verificacion" && "¿Cómo querés recibir tu código?"}
          {paso === "codigo" && `Código enviado por ${metodo === "email" ? "Email" : "WhatsApp"}`}
        </div>
      </div>

      <div style={{ padding: "24px 16px" }}>
        <div style={{ background: "#fff", borderRadius: "20px", padding: "28px 20px", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", maxWidth: "480px", margin: "0 auto" }}>

          {/* ── PASO 1: FORMULARIO ── */}
          {paso === "formulario" && (
            <>
              <PasoIndicador actual={1} />
              <div style={{ marginBottom: "16px" }}>
                <label style={labelStyle}>Nombre de usuario</label>
                <input name="usuario" type="text" value={form.usuario} onChange={handleChange} placeholder="Tu usuario público" style={inputStyle} />
              </div>
              <div style={{ marginBottom: "16px" }}>
                <label style={labelStyle}>WhatsApp</label>
                <input name="whatsapp" type="tel" value={form.whatsapp} onChange={handleChange} placeholder="Ej: 3492123456" style={inputStyle} />
              </div>
              <div style={{ marginBottom: "16px" }}>
                <label style={labelStyle}>Email</label>
                <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="tu@email.com" style={inputStyle} />
              </div>
              <div style={{ marginBottom: "16px" }}>
                <label style={labelStyle}>Contraseña</label>
                <input name="contrasena" type="password" value={form.contrasena} onChange={handleChange} placeholder="Mínimo 6 caracteres" style={inputStyle} />
              </div>
              <div style={{ marginBottom: "24px" }}>
                <label style={labelStyle}>Confirmar contraseña</label>
                <input name="confirmar" type="password" value={form.confirmar} onChange={handleChange} placeholder="Repetí tu contraseña" style={inputStyle} />
              </div>
              {error && <MensajeError texto={error} />}
              <button onClick={handleFormulario} style={btnPrincipalStyle}>Continuar →</button>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", margin: "16px 0" }}>
                <div style={{ flex: 1, height: "1px", background: "#e8e8e6" }} />
                <span style={{ fontSize: "12px", color: "#9a9a9a", fontWeight: 600 }}>¿Ya tenés cuenta?</span>
                <div style={{ flex: 1, height: "1px", background: "#e8e8e6" }} />
              </div>
              <button onClick={() => router.push("/login")} style={btnSecundarioStyle}>Iniciar Sesión</button>
            </>
          )}

          {/* ── PASO 2: ELEGIR MÉTODO ── */}
          {paso === "verificacion" && (
            <>
              <PasoIndicador actual={2} />
              <p style={{ fontSize: "14px", color: "#666", textAlign: "center", marginBottom: "24px", fontWeight: 600 }}>
                Te enviaremos un código de 6 dígitos para confirmar tu cuenta
              </p>
              <button onClick={() => handleMetodo("whatsapp")} style={{
                width: "100%", display: "flex", alignItems: "center", gap: "14px",
                background: "#f0faf0", border: "2px solid #25d366", borderRadius: "14px",
                padding: "18px 20px", cursor: "pointer", marginBottom: "14px",
              }}>
                <span style={{ fontSize: "28px" }}>💬</span>
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontWeight: 800, fontSize: "15px", color: "#1a2a3a" }}>WhatsApp</div>
                  <div style={{ fontSize: "12px", color: "#666", fontWeight: 600 }}>Enviar a +54 {form.whatsapp}</div>
                </div>
              </button>
              <button onClick={() => handleMetodo("email")} style={{
                width: "100%", display: "flex", alignItems: "center", gap: "14px",
                background: "#f0f4ff", border: "2px solid #4a6fa5", borderRadius: "14px",
                padding: "18px 20px", cursor: "pointer", marginBottom: "24px",
              }}>
                <span style={{ fontSize: "28px" }}>📧</span>
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontWeight: 800, fontSize: "15px", color: "#1a2a3a" }}>Email</div>
                  <div style={{ fontSize: "12px", color: "#666", fontWeight: 600 }}>Enviar a {form.email}</div>
                </div>
              </button>
              <button onClick={() => setPaso("formulario")} style={btnSecundarioStyle}>← Volver</button>
            </>
          )}

          {/* ── PASO 3: INGRESAR CÓDIGO ── */}
          {paso === "codigo" && (
            <>
              <PasoIndicador actual={3} />
              <p style={{ fontSize: "14px", color: "#666", textAlign: "center", marginBottom: "8px", fontWeight: 600 }}>
                Ingresá el código de 6 dígitos enviado por {metodo === "whatsapp" ? "💬 WhatsApp" : "📧 Email"}
              </p>
              <p style={{ fontSize: "12px", color: "#9a9a9a", textAlign: "center", marginBottom: "24px" }}>
                {metodo === "whatsapp" ? `+54 ${form.whatsapp}` : form.email}
              </p>
              <input
                type="number"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                placeholder="000000"
                style={{ ...inputStyle, textAlign: "center", fontSize: "28px", fontWeight: 800, letterSpacing: "8px", marginBottom: "24px" }}
              />
              {error && <MensajeError texto={error} />}
              <button onClick={handleCodigo} style={btnPrincipalStyle}>Confirmar registro</button>
              <button onClick={() => setPaso("verificacion")} style={{ ...btnSecundarioStyle, marginTop: "12px" }}>← Cambiar método</button>
              <p style={{ textAlign: "center", fontSize: "12px", color: "#9a9a9a", marginTop: "16px", cursor: "pointer", fontWeight: 600 }}>
                ¿No recibiste el código? Reenviar
              </p>
            </>
          )}

        </div>

        {/* BANNER PROMOTOR */}
        <div style={{
          background: "linear-gradient(90deg, #b8860b, #d4a017, #f0c040)",
          borderRadius: "14px", padding: "14px 20px",
          display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
          cursor: "pointer", maxWidth: "480px", margin: "20px auto 0",
        }}>
          <span style={{ fontWeight: 800, fontSize: "13px", color: "#1a2a3a" }}>⭐ Nexo Promotor —</span>
          <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "20px", color: "#1a2a3a" }}>30%</span>
          <span style={{ fontWeight: 800, fontSize: "13px", color: "#1a2a3a" }}>de ganancia →</span>
        </div>
      </div>

      <BottomNav />
    </main>
  );
}

function PasoIndicador({ actual }: { actual: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "24px", gap: "8px" }}>
      {[1, 2, 3].map((n) => (
        <div key={n} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{
            width: "28px", height: "28px", borderRadius: "50%",
            background: n <= actual ? "#d4a017" : "#e8e8e6",
            color: n <= actual ? "#1a2a3a" : "#9a9a9a",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "12px", fontWeight: 800,
          }}>{n}</div>
          {n < 3 && <div style={{ width: "32px", height: "2px", background: n < actual ? "#d4a017" : "#e8e8e6" }} />}
        </div>
      ))}
    </div>
  );
}

function MensajeError({ texto }: { texto: string }) {
  return (
    <div style={{ color: "#e53e3e", fontSize: "13px", fontWeight: 700, marginBottom: "16px", textAlign: "center" }}>
      ⚠️ {texto}
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: "12px", fontWeight: 800, color: "#2c2c2e",
  textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px",
};

const inputStyle: React.CSSProperties = {
  width: "100%", border: "2px solid #e8e8e6", borderRadius: "10px",
  padding: "13px 14px", fontSize: "14px", fontFamily: "'Nunito', sans-serif",
  color: "#2c2c2e", outline: "none", boxSizing: "border-box",
};

const btnPrincipalStyle: React.CSSProperties = {
  width: "100%", background: "linear-gradient(135deg, #d4a017, #f0c040)",
  color: "#1a2a3a", border: "none", borderRadius: "12px", padding: "16px",
  fontSize: "15px", fontWeight: 800, fontFamily: "'Nunito', sans-serif",
  cursor: "pointer", letterSpacing: "1px", textTransform: "uppercase",
};

const btnSecundarioStyle: React.CSSProperties = {
  width: "100%", background: "#fff", color: "#1a2a3a",
  border: "2px solid #1a2a3a", borderRadius: "12px", padding: "14px",
  fontSize: "14px", fontWeight: 800, fontFamily: "'Nunito', sans-serif",
  cursor: "pointer", letterSpacing: "0.5px",
};
