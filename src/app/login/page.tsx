"use client";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Completá todos los campos");
      return;
    }
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError("Email o contraseña incorrectos");
      setLoading(false);
      return;
    }

    router.push("/");
  };

  return (
    <main style={{ paddingTop: "90px", paddingBottom: "130px", background: "#f4f4f2", minHeight: "100vh", fontFamily: "'Nunito', sans-serif" }}>
      <Header />

      <div style={{ padding: "24px 16px", maxWidth: "400px", margin: "0 auto" }}>

        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "32px", color: "#1a2a3a", letterSpacing: "2px" }}>
            Ingresá a NexoNet
          </div>
          <div style={{ fontSize: "14px", color: "#9a9a9a", fontWeight: 600 }}>
            Conectando Oportunidades
          </div>
        </div>

        <div style={{ background: "#fff", borderRadius: "20px", padding: "24px", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}>

          {error && (
            <div style={{ background: "#fff0f0", border: "1px solid #ffcccc", borderRadius: "10px", padding: "12px", marginBottom: "16px", fontSize: "13px", color: "#cc0000", fontWeight: 700 }}>
              ⚠️ {error}
            </div>
          )}

          <div style={{ marginBottom: "16px" }}>
            <label style={labelStyle}>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@email.com" style={inputStyle} />
          </div>

          <div style={{ marginBottom: "24px" }}>
            <label style={labelStyle}>Contraseña</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" style={inputStyle} onKeyDown={(e) => e.key === "Enter" && handleLogin()} />
          </div>

          <button onClick={handleLogin} disabled={loading} style={{
            width: "100%",
            background: loading ? "#ccc" : "linear-gradient(135deg, #d4a017, #f0c040)",
            color: "#1a2a3a", border: "none", borderRadius: "12px", padding: "16px",
            fontSize: "15px", fontWeight: 800, fontFamily: "'Nunito', sans-serif",
            cursor: loading ? "not-allowed" : "pointer",
            letterSpacing: "1px", textTransform: "uppercase",
          }}>
            {loading ? "Ingresando..." : "Iniciar Sesión"}
          </button>
        </div>

        <div style={{ textAlign: "center", marginTop: "20px" }}>
          <span style={{ fontSize: "14px", color: "#666", fontWeight: 600 }}>¿No tenés cuenta? </span>
          <a href="/registro" style={{ fontSize: "14px", color: "#d4a017", fontWeight: 800, textDecoration: "none" }}>
            Registrate gratis →
          </a>
        </div>

      </div>
      <BottomNav />
    </main>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: "11px", fontWeight: 800, color: "#666",
  textTransform: "uppercase", letterSpacing: "1px", marginBottom: "6px",
};

const inputStyle: React.CSSProperties = {
  width: "100%", border: "2px solid #e8e8e6", borderRadius: "10px",
  padding: "12px 14px", fontSize: "14px", fontFamily: "'Nunito', sans-serif",
  color: "#2c2c2e", outline: "none", boxSizing: "border-box",
};
