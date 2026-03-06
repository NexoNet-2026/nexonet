"use client";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Login() {
  const [usuario, setUsuario] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = () => {
    if (!usuario || !contrasena) {
      setError("Completá todos los campos");
      return;
    }
    // lógica de login futura
    router.push("/");
  };

  return (
    <main style={{ paddingTop: "60px", paddingBottom: "64px", background: "#f4f4f2", minHeight: "100vh", fontFamily: "'Nunito', sans-serif" }}>
      <Header />

      {/* HERO */}
      <div style={{
        background: "linear-gradient(135deg, #1a2a3a 0%, #243b55 100%)",
        padding: "32px 16px",
        textAlign: "center",
      }}>
        <div style={{ fontSize: "13px", fontWeight: 700, color: "#d4a017", letterSpacing: "2px", textTransform: "uppercase", marginBottom: "4px" }}>
          Bienvenido
        </div>
        <div style={{ fontSize: "12px", color: "#7a8fa0", fontWeight: 600 }}>
          Iniciá sesión para continuar
        </div>
      </div>

      {/* FORMULARIO */}
      <div style={{ padding: "24px 16px" }}>
        <div style={{
          background: "#fff",
          borderRadius: "20px",
          padding: "28px 20px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
          maxWidth: "480px",
          margin: "0 auto",
        }}>

          {/* NOMBRE USUARIO */}
          <div style={{ marginBottom: "16px" }}>
            <label style={labelStyle}>Nombre de usuario</label>
            <input
              type="text"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              placeholder="Tu usuario"
              style={inputStyle}
            />
          </div>

          {/* CONTRASEÑA */}
          <div style={{ marginBottom: "24px" }}>
            <label style={labelStyle}>Contraseña</label>
            <input
              type="password"
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              placeholder="Tu contraseña"
              style={inputStyle}
            />
          </div>

          {/* ERROR */}
          {error && (
            <div style={{ color: "#e53e3e", fontSize: "13px", fontWeight: 700, marginBottom: "16px", textAlign: "center" }}>
              ⚠️ {error}
            </div>
          )}

          {/* BOTÓN INICIAR */}
          <button onClick={handleLogin} style={{
            width: "100%",
            background: "linear-gradient(135deg, #1a2a3a, #243b55)",
            color: "#fff",
            border: "none",
            borderRadius: "12px",
            padding: "16px",
            fontSize: "15px",
            fontWeight: 800,
            fontFamily: "'Nunito', sans-serif",
            cursor: "pointer",
            letterSpacing: "1px",
            textTransform: "uppercase",
            marginBottom: "16px",
          }}>
            Iniciar Sesión
          </button>

          {/* DIVIDER */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
            <div style={{ flex: 1, height: "1px", background: "#e8e8e6" }} />
            <span style={{ fontSize: "12px", color: "#9a9a9a", fontWeight: 600 }}>¿No tenés cuenta?</span>
            <div style={{ flex: 1, height: "1px", background: "#e8e8e6" }} />
          </div>

          {/* BOTÓN REGISTRO */}
          <button onClick={() => router.push("/registro")} style={{
            width: "100%",
            background: "#fff",
            color: "#1a2a3a",
            border: "2px solid #1a2a3a",
            borderRadius: "12px",
            padding: "14px",
            fontSize: "14px",
            fontWeight: 800,
            fontFamily: "'Nunito', sans-serif",
            cursor: "pointer",
            letterSpacing: "0.5px",
          }}>
            Registrarse
          </button>
        </div>

        {/* BANNER PROMOTOR */}
        <div onClick={() => router.push("/registro")} style={{
          background: "linear-gradient(90deg, #b8860b, #d4a017, #f0c040)",
          borderRadius: "14px",
          padding: "14px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          cursor: "pointer",
          maxWidth: "480px",
          margin: "20px auto 0",
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

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "12px",
  fontWeight: 800,
  color: "#2c2c2e",
  textTransform: "uppercase",
  letterSpacing: "1px",
  marginBottom: "8px",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  border: "2px solid #e8e8e6",
  borderRadius: "10px",
  padding: "13px 14px",
  fontSize: "14px",
  fontFamily: "'Nunito', sans-serif",
  color: "#2c2c2e",
  outline: "none",
  boxSizing: "border-box",
  transition: "border-color .2s",
};
