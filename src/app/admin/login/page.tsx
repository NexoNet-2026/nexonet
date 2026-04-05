"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const ADMIN_UUID = "f9b23e04-c591-44bf-9efb-51966c30a083";

export default function AdminLogin() {
  const router = useRouter();
  const [email,    setEmail]    = useState("");
  const [pass,     setPass]     = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleLogin = async () => {
    if (!email || !pass) { setError("Completá los campos"); return; }
    setLoading(true); setError("");
    const { data, error: authErr } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (authErr || !data.user) { setError("Credenciales incorrectas"); setLoading(false); return; }
    const { data: u } = await supabase.from("usuarios").select("es_admin_sistema").eq("id", data.user.id).single();
    if (!u?.es_admin_sistema) {
      await supabase.auth.signOut();
      setError("Acceso denegado");
      setLoading(false);
      return;
    }
    router.push("/admin");
  };

  return (
    <main style={{ minHeight:"100vh", background:"linear-gradient(135deg,#0d1a26,#1a2a3a)", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Nunito',sans-serif", padding:"20px" }}>
      <div style={{ width:"100%", maxWidth:"360px" }}>
        <div style={{ textAlign:"center", marginBottom:"32px" }}>
          <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"42px", letterSpacing:"2px" }}>
            <span style={{ color:"#c8c8c8" }}>Nexo</span><span style={{ color:"#d4a017" }}>Net</span>
          </div>
          <div style={{ fontSize:"12px", fontWeight:800, color:"#8a9aaa", letterSpacing:"4px", textTransform:"uppercase" }}>Panel Administrador</div>
        </div>

        <div style={{ background:"rgba(255,255,255,0.05)", borderRadius:"20px", padding:"28px", border:"1px solid rgba(255,255,255,0.08)", backdropFilter:"blur(10px)" }}>
          <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"22px", color:"#d4a017", letterSpacing:"2px", marginBottom:"20px", textAlign:"center" }}>🔐 Acceso Restringido</div>

          {error && (
            <div style={{ background:"rgba(231,76,60,0.15)", border:"1px solid rgba(231,76,60,0.4)", borderRadius:"10px", padding:"10px 14px", marginBottom:"16px", fontSize:"13px", color:"#ff8a80", fontWeight:700 }}>
              ⚠️ {error}
            </div>
          )}

          <div style={{ marginBottom:"14px" }}>
            <label style={{ display:"block", fontSize:"11px", fontWeight:800, color:"#8a9aaa", textTransform:"uppercase", letterSpacing:"1px", marginBottom:"6px" }}>Email</label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&handleLogin()}
              placeholder="admin@nexonet.ar"
              style={{ width:"100%", background:"rgba(255,255,255,0.08)", border:"2px solid rgba(255,255,255,0.1)", borderRadius:"10px", padding:"12px 14px", fontSize:"14px", fontFamily:"'Nunito',sans-serif", color:"#fff", outline:"none", boxSizing:"border-box" }} />
          </div>

          <div style={{ marginBottom:"20px" }}>
            <label style={{ display:"block", fontSize:"11px", fontWeight:800, color:"#8a9aaa", textTransform:"uppercase", letterSpacing:"1px", marginBottom:"6px" }}>Contraseña</label>
            <div style={{ position:"relative" }}>
              <input type={showPass?"text":"password"} value={pass} onChange={e=>setPass(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&handleLogin()}
                placeholder="••••••••"
                style={{ width:"100%", background:"rgba(255,255,255,0.08)", border:"2px solid rgba(255,255,255,0.1)", borderRadius:"10px", padding:"12px 44px 12px 14px", fontSize:"14px", fontFamily:"'Nunito',sans-serif", color:"#fff", outline:"none", boxSizing:"border-box" }} />
              <button onClick={()=>setShowPass(p=>!p)}
                style={{ position:"absolute", right:"12px", top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", fontSize:"18px", color:"#8a9aaa", padding:"0", lineHeight:1 }}>
                {showPass ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          <button onClick={handleLogin} disabled={loading}
            style={{ width:"100%", background:loading?"#666":"linear-gradient(135deg,#d4a017,#f0c040)", border:"none", borderRadius:"12px", padding:"14px", fontSize:"15px", fontWeight:900, color:"#1a2a3a", cursor:loading?"not-allowed":"pointer", fontFamily:"'Nunito',sans-serif", boxShadow:loading?"none":"0 4px 0 #a07810", letterSpacing:"0.5px" }}>
            {loading ? "Verificando..." : "Ingresar →"}
          </button>
        </div>
      </div>
    </main>
  );
}
