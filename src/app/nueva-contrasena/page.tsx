"use client";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function NuevaContrasena() {
  return (
    <Suspense fallback={<div style={{paddingTop:"95px",textAlign:"center",color:"#9a9a9a",fontFamily:"'Nunito',sans-serif"}}>Cargando...</div>}>
      <NuevaContrasenaInner />
    </Suspense>
  );
}

function NuevaContrasenaInner() {
  const router = useRouter();
  const [password,   setPassword]   = useState("");
  const [confirmar,  setConfirmar]  = useState("");
  const [showPass,   setShowPass]   = useState(false);
  const [showPass2,  setShowPass2]  = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState("");
  const [listo,      setListo]      = useState(false);
  const [sesionOk,   setSesionOk]   = useState(false);

  useEffect(() => {
    // Supabase maneja el token del link automáticamente en la sesión
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setSesionOk(true);
      else setError("El link expiró o no es válido. Solicitá uno nuevo.");
    });
  }, []);

  const handleGuardar = async () => {
    if (!password || !confirmar) { setError("Completá los dos campos"); return; }
    if (password.length < 6) { setError("La contraseña debe tener al menos 6 caracteres"); return; }
    if (password !== confirmar) { setError("Las contraseñas no coinciden"); return; }

    setLoading(true); setError("");
    const { error: err } = await supabase.auth.updateUser({ password });
    if (err) { setError("Error al actualizar: " + err.message); setLoading(false); return; }
    setListo(true); setLoading(false);
    setTimeout(() => router.push("/"), 2500);
  };

  return (
    <main style={{ paddingTop:"95px", paddingBottom:"130px", background:"#f4f4f2", minHeight:"100vh", fontFamily:"'Nunito',sans-serif" }}>
      <Header />
      <div style={{ padding:"24px 16px", maxWidth:"400px", margin:"0 auto" }}>

        <div style={{ textAlign:"center", marginBottom:"28px" }}>
          <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"30px", color:"#1a2a3a", letterSpacing:"2px" }}>
            Nueva contraseña
          </div>
          <div style={{ fontSize:"13px", color:"#9a9a9a", fontWeight:600 }}>
            Elegí una contraseña segura
          </div>
        </div>

        <div style={{ background:"#fff", borderRadius:"20px", padding:"24px", boxShadow:"0 4px 20px rgba(0,0,0,0.08)" }}>

          {listo ? (
            <div style={{ textAlign:"center", padding:"20px 0" }}>
              <div style={{ fontSize:"56px", marginBottom:"16px" }}>✅</div>
              <div style={{ fontSize:"18px", fontWeight:900, color:"#1a2a3a", marginBottom:"8px" }}>
                ¡Contraseña actualizada!
              </div>
              <div style={{ fontSize:"13px", color:"#9a9a9a", fontWeight:600 }}>
                Redirigiendo al inicio...
              </div>
            </div>
          ) : (<>
            {error && (
              <div style={{ background:"#fff0f0", border:"1px solid #ffcccc", borderRadius:"10px", padding:"12px", marginBottom:"16px", fontSize:"13px", color:"#cc0000", fontWeight:700 }}>
                ⚠️ {error}
                {!sesionOk && (
                  <div style={{ marginTop:"10px" }}>
                    <a href="/login" style={{ color:"#d4a017", fontWeight:800, textDecoration:"none" }}>
                      → Ir al login y usar "¿Olvidaste tu contraseña?"
                    </a>
                  </div>
                )}
              </div>
            )}

            {sesionOk && (<>
              <div style={{ marginBottom:"16px" }}>
                <label style={LS}>Nueva contraseña</label>
                <div style={{ position:"relative" }}>
                  <input type={showPass?"text":"password"} value={password}
                    onChange={e=>setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    style={{ ...IS, paddingRight:"44px" }} />
                  <button type="button" onClick={()=>setShowPass(v=>!v)}
                    style={{ position:"absolute", right:"12px", top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", fontSize:"18px", color:"#9a9a9a", padding:0 }}>
                    {showPass?"🙈":"👁️"}
                  </button>
                </div>
              </div>

              <div style={{ marginBottom:"24px" }}>
                <label style={LS}>Confirmar contraseña</label>
                <div style={{ position:"relative" }}>
                  <input type={showPass2?"text":"password"} value={confirmar}
                    onChange={e=>setConfirmar(e.target.value)}
                    placeholder="Repetí la contraseña"
                    style={{ ...IS, paddingRight:"44px" }}
                    onKeyDown={e=>e.key==="Enter"&&handleGuardar()} />
                  <button type="button" onClick={()=>setShowPass2(v=>!v)}
                    style={{ position:"absolute", right:"12px", top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", fontSize:"18px", color:"#9a9a9a", padding:0 }}>
                    {showPass2?"🙈":"👁️"}
                  </button>
                </div>
              </div>

              <button onClick={handleGuardar} disabled={loading}
                style={{ width:"100%", background:loading?"#ccc":"linear-gradient(135deg,#d4a017,#f0c040)", color:"#1a2a3a", border:"none", borderRadius:"12px", padding:"16px", fontSize:"15px", fontWeight:800, fontFamily:"'Nunito',sans-serif", cursor:loading?"not-allowed":"pointer", letterSpacing:"1px", textTransform:"uppercase", boxShadow:loading?"none":"0 4px 0 #a07810" }}>
                {loading ? "Guardando..." : "✅ Guardar nueva contraseña"}
              </button>
            </>)}
          </>)}
        </div>
      </div>
      <BottomNav />
    </main>
  );
}

const LS: React.CSSProperties = { display:"block", fontSize:"11px", fontWeight:800, color:"#666", textTransform:"uppercase", letterSpacing:"1px", marginBottom:"6px" };
const IS: React.CSSProperties = { width:"100%", border:"2px solid #e8e8e6", borderRadius:"10px", padding:"12px 14px", fontSize:"14px", fontFamily:"'Nunito',sans-serif", color:"#2c2c2e", outline:"none", boxSizing:"border-box" };
