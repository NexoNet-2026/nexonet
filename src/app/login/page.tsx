"use client";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function Login() {
  const router = useRouter();
  const [email,      setEmail]      = useState("");
  const [password,   setPassword]   = useState("");
  const [showPass,   setShowPass]   = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState("");
  const [modoRecup,  setModoRecup]  = useState(false);
  const [emailRecup, setEmailRecup] = useState("");
  const [enviado,    setEnviado]    = useState(false);

  const handleLogin = async () => {
    if (!email || !password) { setError("Completá todos los campos"); return; }
    setLoading(true); setError("");
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) {
      if (err.message.includes("Email not confirmed")) {
        setError("Confirmá tu email antes de ingresar. Revisá tu casilla de correo.");
      } else {
        setError("Email o contraseña incorrectos. Verificá tus datos.");
      }
      setLoading(false); return;
    }
    router.push("/");
  };

  const handleRecuperar = async () => {
    if (!emailRecup) { setError("Ingresá tu email"); return; }
    setLoading(true); setError("");
    const { error: err } = await supabase.auth.resetPasswordForEmail(emailRecup, {
      redirectTo: "https://nexonet.ar/nueva-contrasena",
    });
    if (err) { setError("Error al enviar el email: " + err.message); setLoading(false); return; }
    setEnviado(true); setLoading(false);
  };

  // ── MODO RECUPERACIÓN ──────────────────────────────────────────
  if (modoRecup) return (
    <main style={{ paddingTop:"90px", paddingBottom:"130px", background:"#f4f4f2", minHeight:"100vh", fontFamily:"'Nunito',sans-serif" }}>
      <Header />
      <div style={{ padding:"24px 16px", maxWidth:"400px", margin:"0 auto" }}>
        <div style={{ textAlign:"center", marginBottom:"28px" }}>
          <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"28px", color:"#1a2a3a", letterSpacing:"2px" }}>
            Recuperar contraseña
          </div>
          <div style={{ fontSize:"13px", color:"#9a9a9a", fontWeight:600 }}>
            Te enviamos un link por email
          </div>
        </div>
        <div style={{ background:"#fff", borderRadius:"20px", padding:"24px", boxShadow:"0 4px 20px rgba(0,0,0,0.08)" }}>
          {enviado ? (
            <div style={{ textAlign:"center", padding:"20px 0" }}>
              <div style={{ fontSize:"48px", marginBottom:"16px" }}>📧</div>
              <div style={{ fontSize:"16px", fontWeight:900, color:"#1a2a3a", marginBottom:"8px" }}>Email enviado</div>
              <div style={{ fontSize:"13px", color:"#9a9a9a", fontWeight:600, lineHeight:1.6, marginBottom:"20px" }}>
                Revisá tu casilla <strong>{emailRecup}</strong> y seguí el link para crear una nueva contraseña.
              </div>
              <button onClick={() => { setModoRecup(false); setEnviado(false); }}
                style={{ ...btnStyle }}>
                Volver al login
              </button>
            </div>
          ) : (<>
            {error && <div style={errorStyle}>⚠️ {error}</div>}
            <div style={{ marginBottom:"20px" }}>
              <label style={labelStyle}>Tu email</label>
              <input type="email" value={emailRecup} onChange={e=>setEmailRecup(e.target.value)}
                placeholder="tu@email.com" style={inputStyle}
                onKeyDown={e=>e.key==="Enter"&&handleRecuperar()} />
            </div>
            <button onClick={handleRecuperar} disabled={loading} style={btnStyle}>
              {loading ? "Enviando..." : "📧 Enviar link de recuperación"}
            </button>
            <button onClick={() => { setModoRecup(false); setError(""); }}
              style={{ width:"100%", background:"none", border:"none", padding:"12px", fontSize:"13px", fontWeight:700, color:"#9a9a9a", cursor:"pointer", fontFamily:"'Nunito',sans-serif", marginTop:"8px" }}>
              ← Volver al login
            </button>
          </>)}
        </div>
      </div>
      <BottomNav />
    </main>
  );

  // ── MODO LOGIN ─────────────────────────────────────────────────
  return (
    <main style={{ paddingTop:"90px", paddingBottom:"130px", background:"#f4f4f2", minHeight:"100vh", fontFamily:"'Nunito',sans-serif" }}>
      <Header />
      <div style={{ padding:"24px 16px", maxWidth:"400px", margin:"0 auto" }}>

        <div style={{ textAlign:"center", marginBottom:"28px" }}>
          <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"32px", color:"#1a2a3a", letterSpacing:"2px" }}>
            Ingresá a NexoNet
          </div>
          <div style={{ fontSize:"14px", color:"#9a9a9a", fontWeight:600 }}>
            Conectando Oportunidades
          </div>
        </div>

        <div style={{ background:"#fff", borderRadius:"20px", padding:"24px", boxShadow:"0 4px 20px rgba(0,0,0,0.08)" }}>

          {error && <div style={errorStyle}>⚠️ {error}</div>}

          <div style={{ marginBottom:"16px" }}>
            <label style={labelStyle}>Email</label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)}
              placeholder="tu@email.com" style={inputStyle} />
          </div>

          <div style={{ marginBottom:"8px" }}>
            <label style={labelStyle}>Contraseña</label>
            <div style={{ position:"relative" }}>
              <input type={showPass?"text":"password"} value={password}
                onChange={e=>setPassword(e.target.value)}
                placeholder="••••••••"
                style={{ ...inputStyle, paddingRight:"44px" }}
                onKeyDown={e=>e.key==="Enter"&&handleLogin()} />
              <button type="button" onClick={()=>setShowPass(v=>!v)}
                style={{ position:"absolute", right:"12px", top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", fontSize:"18px", color:"#9a9a9a", padding:0, lineHeight:1 }}>
                {showPass ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          {/* Olvidé mi contraseña */}
          <div style={{ textAlign:"right", marginBottom:"20px" }}>
            <button onClick={()=>{ setModoRecup(true); setError(""); setEmailRecup(email); }}
              style={{ background:"none", border:"none", fontSize:"12px", fontWeight:700, color:"#d4a017", cursor:"pointer", fontFamily:"'Nunito',sans-serif", textDecoration:"underline" }}>
              ¿Olvidaste tu contraseña?
            </button>
          </div>

          <button onClick={handleLogin} disabled={loading} style={btnStyle}>
            {loading ? "Ingresando..." : "Iniciar Sesión"}
          </button>
        </div>

        <div style={{ textAlign:"center", marginTop:"20px" }}>
          <span style={{ fontSize:"14px", color:"#666", fontWeight:600 }}>¿No tenés cuenta? </span>
          <a href="/registro" style={{ fontSize:"14px", color:"#d4a017", fontWeight:800, textDecoration:"none" }}>
            Registrate gratis →
          </a>
        </div>

      </div>
      <BottomNav />
    </main>
  );
}

const labelStyle: React.CSSProperties = {
  display:"block", fontSize:"11px", fontWeight:800, color:"#666",
  textTransform:"uppercase", letterSpacing:"1px", marginBottom:"6px",
};
const inputStyle: React.CSSProperties = {
  width:"100%", border:"2px solid #e8e8e6", borderRadius:"10px",
  padding:"12px 14px", fontSize:"14px", fontFamily:"'Nunito',sans-serif",
  color:"#2c2c2e", outline:"none", boxSizing:"border-box",
};
const btnStyle: React.CSSProperties = {
  width:"100%", background:"linear-gradient(135deg,#d4a017,#f0c040)",
  color:"#1a2a3a", border:"none", borderRadius:"12px", padding:"16px",
  fontSize:"15px", fontWeight:800, fontFamily:"'Nunito',sans-serif",
  cursor:"pointer", letterSpacing:"1px", textTransform:"uppercase",
  boxShadow:"0 4px 0 #a07810",
};
const errorStyle: React.CSSProperties = {
  background:"#fff0f0", border:"1px solid #ffcccc", borderRadius:"10px",
  padding:"12px", marginBottom:"16px", fontSize:"13px", color:"#cc0000", fontWeight:700,
};
