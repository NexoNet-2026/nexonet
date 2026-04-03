"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AuthConfirm() {
  const router = useRouter();
  const [estado, setEstado] = useState<"cargando"|"ok"|"error">("cargando");

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes("error=")) {
      setEstado("error");
      return;
    }
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setEstado("ok");
        setTimeout(() => router.push("/"), 3000);
      } else {
        supabase.auth.onAuthStateChange((event, session) => {
          if (event === "SIGNED_IN" && session) {
            setEstado("ok");
            setTimeout(() => router.push("/"), 3000);
          }
        });
        setTimeout(() => {
          supabase.auth.getSession().then(({ data: { session } }) => {
            if (!session) setEstado("error");
          });
        }, 2000);
      }
    });
  }, []);

  return (
    <main style={{minHeight:"100vh",background:"#f4f4f2",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Nunito',sans-serif",padding:"24px"}}>
      <div style={{background:"#fff",borderRadius:"20px",padding:"40px 32px",maxWidth:"380px",width:"100%",textAlign:"center",boxShadow:"0 4px 20px rgba(0,0,0,0.08)"}}>
        {estado==="cargando" && (<>
          <div style={{fontSize:"48px",marginBottom:"16px"}}>⏳</div>
          <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"22px",color:"#1a2a3a",letterSpacing:"1px"}}>Verificando tu cuenta...</div>
        </>)}
        {estado==="ok" && (<>
          <div style={{fontSize:"48px",marginBottom:"16px"}}>🎉</div>
          <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"22px",color:"#27ae60",letterSpacing:"1px",marginBottom:"12px"}}>¡Email confirmado!</div>
          <div style={{fontSize:"14px",color:"#666",fontWeight:600,marginBottom:"24px"}}>Tu cuenta está activa. Redirigiendo...</div>
          <div style={{background:"rgba(212,160,23,0.1)",border:"2px solid rgba(212,160,23,0.3)",borderRadius:"12px",padding:"14px",marginBottom:"20px"}}>
            <div style={{fontSize:"16px",fontWeight:900,color:"#d4a017"}}>🎁 3.000 BIT Free acreditados</div>
          </div>
          <button onClick={()=>router.push("/")} style={{width:"100%",background:"linear-gradient(135deg,#d4a017,#f0c040)",color:"#1a2a3a",border:"none",borderRadius:"12px",padding:"14px",fontSize:"15px",fontWeight:900,cursor:"pointer",fontFamily:"'Nunito',sans-serif"}}>
            Ir a NexoNet →
          </button>
        </>)}
        {estado==="error" && (<>
          <div style={{fontSize:"48px",marginBottom:"16px"}}>❌</div>
          <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"22px",color:"#e74c3c",letterSpacing:"1px",marginBottom:"12px"}}>Link inválido o expirado</div>
          <div style={{fontSize:"14px",color:"#666",fontWeight:600,marginBottom:"24px"}}>El link de confirmación no es válido o ya fue usado.</div>
          <button onClick={()=>router.push("/registro")} style={{width:"100%",background:"linear-gradient(135deg,#d4a017,#f0c040)",color:"#1a2a3a",border:"none",borderRadius:"12px",padding:"14px",fontSize:"15px",fontWeight:900,cursor:"pointer",fontFamily:"'Nunito',sans-serif"}}>
            Volver al registro →
          </button>
        </>)}
      </div>
    </main>
  );
}
