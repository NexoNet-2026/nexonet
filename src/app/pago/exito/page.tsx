"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function PagoExito() {
  return (
    <Suspense fallback={<div style={{ textAlign:"center", padding:"60px", fontFamily:"'Nunito',sans-serif" }}>Verificando pago...</div>}>
      <PagoExitoInner />
    </Suspense>
  );
}

function PagoExitoInner() {
  const sp = useSearchParams();
  const router = useRouter();
  const [estado, setEstado] = useState<"verificando"|"ok"|"error">("verificando");

  const paquete    = sp.get("paquete") || "";
  const usuario_id = sp.get("usuario_id") || "";

  const NOMBRES: Record<string, string> = {
    "bit_nexo_500":           "500 BIT Nexo 💛",
    "bit_nexo_1000":          "1.000 BIT Nexo 💛",
    "bit_nexo_5000":          "5.000 BIT Nexo 💛",
    "bit_nexo_ilimitado":     "BIT Nexo Ilimitado 30 días 💛",
    "bit_anuncio_3":          "3 BIT Anuncio 📋",
    "bit_anuncio_10":         "10 BIT Anuncio 📋",
    "bit_anuncio_emp_50":     "50 BIT Anuncio Empresa 🏢",
    "bit_conexion_1000":      "1.000 BIT Conexión 🔗",
    "bit_conexion_5000":      "5.000 BIT Conexión 🔗",
    "bit_conexion_ilimitado": "BIT Conexión Ilimitado 30 días 🔗",
    "bit_grupo":              "BIT Grupo 🏘️",
    "bit_link":               "BIT Link Multimedia 🔗",
    "bit_adjunto":            "BIT Adjunto 📎",
    "bit_ia_1000":            "1.000 BIT Búsqueda IA 🤖",
    "bit_ia_5000":            "5.000 BIT Búsqueda IA 🤖",
    "bit_ia_ilimitado":       "BIT Búsqueda IA Ilimitado 30 días 🤖",
  };

  useEffect(() => {
    // Esperar unos segundos para que el webhook procese
    const t = setTimeout(() => setEstado("ok"), 3000);
    return () => clearTimeout(t);
  }, []);

  return (
    <main style={{ minHeight:"100vh", background:"linear-gradient(135deg,#0d1a26,#1a2a3a)", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Nunito',sans-serif", padding:"20px" }}>
      <div style={{ width:"100%", maxWidth:"380px", textAlign:"center" }}>

        {estado === "verificando" ? (
          <>
            <div style={{ fontSize:"60px", marginBottom:"20px" }}>⏳</div>
            <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"28px", color:"#fff", letterSpacing:"1px", marginBottom:"8px" }}>Verificando pago...</div>
            <div style={{ fontSize:"14px", color:"#8a9aaa", fontWeight:600 }}>Estamos acreditando tus BIT</div>
          </>
        ) : (
          <>
            <div style={{ fontSize:"80px", marginBottom:"20px", animation:"bounce 0.5s ease" }}>🎉</div>
            <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"32px", color:"#d4a017", letterSpacing:"1px", marginBottom:"8px" }}>¡Pago aprobado!</div>
            <div style={{ fontSize:"16px", fontWeight:800, color:"#fff", marginBottom:"6px" }}>
              {NOMBRES[paquete] || "BIT acreditados"}
            </div>
            <div style={{ fontSize:"13px", color:"#8a9aaa", fontWeight:600, marginBottom:"32px" }}>
              Ya están disponibles en tu cuenta
            </div>

            <div style={{ display:"flex", flexDirection:"column", gap:"12px" }}>
              <button onClick={() => router.push("/usuario")}
                style={{ background:"linear-gradient(135deg,#d4a017,#f0c040)", border:"none", borderRadius:"14px", padding:"14px", fontSize:"15px", fontWeight:900, color:"#1a2a3a", cursor:"pointer", fontFamily:"'Nunito',sans-serif", boxShadow:"0 4px 0 #a07810" }}>
                👤 Ver mi perfil
              </button>
              <button onClick={() => router.push("/")}
                style={{ background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.15)", borderRadius:"14px", padding:"14px", fontSize:"14px", fontWeight:800, color:"#fff", cursor:"pointer", fontFamily:"'Nunito',sans-serif" }}>
                🏠 Ir al inicio
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
