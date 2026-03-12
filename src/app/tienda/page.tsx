"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/lib/supabase";

type Paquete = {
  id: string; titulo: string; subtitulo: string; precio: number;
  emoji: string; color: string; badge?: string; bits: number | "∞";
};

const SECCIONES = [
  {
    titulo: "💛 BIT Nexo",
    desc: "Para conectarte con anuncios y vendedores",
    color: "#d4a017",
    paquetes: [
      { id:"bit_nexo_500",       titulo:"500 BIT Nexo",       subtitulo:"Ideal para empezar",      precio:500,   emoji:"💛", color:"#d4a017", bits:500    },
      { id:"bit_nexo_1000",      titulo:"1.000 BIT Nexo",     subtitulo:"El más popular",          precio:1000,  emoji:"💛", color:"#d4a017", bits:1000,  badge:"⭐ Popular" },
      { id:"bit_nexo_5000",      titulo:"5.000 BIT Nexo",     subtitulo:"Mejor precio por BIT",   precio:5000,  emoji:"💛", color:"#d4a017", bits:5000,  badge:"🔥 Oferta"  },
      { id:"bit_nexo_ilimitado", titulo:"Ilimitado 30 días",  subtitulo:"Sin límites por un mes",  precio:10000, emoji:"♾️", color:"#d4a017", bits:"∞",   badge:"👑 Pro"     },
    ] as Paquete[],
  },
  {
    titulo: "📋 BIT Anuncio",
    desc: "Para publicar tus productos y servicios",
    color: "#3a7bd5",
    paquetes: [
      { id:"bit_anuncio_3",      titulo:"3 BIT Anuncio",      subtitulo:"Publicá 3 anuncios",      precio:1000,  emoji:"📋", color:"#3a7bd5", bits:3   },
      { id:"bit_anuncio_10",     titulo:"10 BIT Anuncio",     subtitulo:"Publicá 10 anuncios",     precio:3000,  emoji:"📋", color:"#3a7bd5", bits:10, badge:"⭐ Popular" },
      { id:"bit_anuncio_emp_50", titulo:"50 BIT Empresa",     subtitulo:"Para comercios y empresas",precio:10000,emoji:"🏢", color:"#8e44ad", bits:50, badge:"🏢 Empresa" },
    ] as Paquete[],
  },
  {
    titulo: "🔗 BIT Conexión",
    desc: "Para ver datos de contacto de vendedores",
    color: "#27ae60",
    paquetes: [
      { id:"bit_conexion_1000",      titulo:"1.000 BIT Conexión",    subtitulo:"Para buscadores activos", precio:1000,  emoji:"🔗", color:"#27ae60", bits:1000  },
      { id:"bit_conexion_5000",      titulo:"5.000 BIT Conexión",    subtitulo:"Mejor precio por BIT",    precio:5000,  emoji:"🔗", color:"#27ae60", bits:5000, badge:"🔥 Oferta" },
      { id:"bit_conexion_ilimitado", titulo:"Ilimitado 30 días",     subtitulo:"Conexiones sin límite",   precio:10000, emoji:"♾️", color:"#27ae60", bits:"∞",  badge:"👑 Pro"    },
    ] as Paquete[],
  },
  {
    titulo: "🤖 BIT Búsqueda IA",
    desc: "Para búsquedas automáticas con inteligencia artificial",
    color: "#1abc9c",
    paquetes: [
      { id:"bit_ia_1000",      titulo:"1.000 BIT IA",       subtitulo:"Búsquedas inteligentes",   precio:1000,  emoji:"🤖", color:"#1abc9c", bits:1000  },
      { id:"bit_ia_5000",      titulo:"5.000 BIT IA",       subtitulo:"Mejor precio por BIT",     precio:5000,  emoji:"🤖", color:"#1abc9c", bits:5000, badge:"🔥 Oferta" },
      { id:"bit_ia_ilimitado", titulo:"Ilimitado 30 días",  subtitulo:"IA sin límites por un mes",precio:10000, emoji:"♾️", color:"#1abc9c", bits:"∞",  badge:"👑 Pro"    },
    ] as Paquete[],
  },
  {
    titulo: "🛠️ BIT Herramientas",
    desc: "Links, adjuntos y grupos",
    color: "#8e44ad",
    paquetes: [
      { id:"bit_grupo",   titulo:"BIT Grupo",            subtitulo:"Crear y unirte a grupos",   precio:500, emoji:"🏘️", color:"#8e44ad", bits:500 },
      { id:"bit_link",    titulo:"BIT Link Multimedia",  subtitulo:"Agregar links a anuncios",  precio:500, emoji:"🔗", color:"#e67e22", bits:500 },
      { id:"bit_adjunto", titulo:"BIT Adjunto",          subtitulo:"Adjuntar archivos a anuncios",precio:500,emoji:"📎", color:"#e67e22", bits:500 },
    ] as Paquete[],
  },
];

export default function TiendaBIT() {
  const router = useRouter();
  const [session,   setSession]   = useState<any>(null);
  const [loading,   setLoading]   = useState<string|null>(null);
  const [error,     setError]     = useState<string|null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (!s) { router.push("/login"); return; }
      setSession(s);
    });
  }, []);

  const comprar = async (paquete: Paquete) => {
    if (!session) { router.push("/login"); return; }
    setLoading(paquete.id);
    setError(null);
    try {
      const res = await fetch("/api/mp/crear-preferencia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paquete: paquete.id,
          usuario_id: session.user.id,
          email: session.user.email,
        }),
      });
      const data = await res.json();
      if (data.init_point) {
        window.location.href = data.init_point;
      } else {
        setError("Error al generar el pago. Intentá de nuevo.");
      }
    } catch {
      setError("Error de conexión. Intentá de nuevo.");
    }
    setLoading(null);
  };

  return (
    <main style={{ paddingTop:"95px", paddingBottom:"130px", background:"#f4f4f2", minHeight:"100vh", fontFamily:"'Nunito',sans-serif" }}>
      <Header />

      {/* HERO */}
      <div style={{ background:"linear-gradient(135deg,#1a2a3a,#243b55)", padding:"20px 16px 24px" }}>
        <div style={{ fontSize:"10px", fontWeight:700, color:"#d4a017", letterSpacing:"2px", textTransform:"uppercase", marginBottom:"4px" }}>NexoNet</div>
        <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"28px", color:"#fff", letterSpacing:"1px", marginBottom:"6px" }}>💰 Tienda de BIT</div>
        <div style={{ fontSize:"13px", color:"#8a9aaa", fontWeight:600 }}>Pagá con MercadoPago · Acreditación inmediata</div>
        <div style={{ display:"flex", gap:"6px", marginTop:"12px", flexWrap:"wrap" }}>
          {["✅ Pago seguro","⚡ Acreditación inmediata","🔒 SSL"].map(b => (
            <span key={b} style={{ background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.15)", borderRadius:"20px", padding:"4px 10px", fontSize:"11px", fontWeight:700, color:"#fff" }}>{b}</span>
          ))}
        </div>
      </div>

      {error && (
        <div style={{ margin:"12px 16px", background:"rgba(231,76,60,0.1)", border:"1px solid rgba(231,76,60,0.3)", borderRadius:"12px", padding:"12px 14px", fontSize:"13px", fontWeight:700, color:"#e74c3c" }}>
          ⚠️ {error}
        </div>
      )}

      <div style={{ padding:"16px" }}>
        {SECCIONES.map(sec => (
          <div key={sec.titulo} style={{ marginBottom:"24px" }}>
            {/* Header sección */}
            <div style={{ marginBottom:"12px" }}>
              <div style={{ fontSize:"16px", fontWeight:900, color:"#1a2a3a" }}>{sec.titulo}</div>
              <div style={{ fontSize:"12px", color:"#9a9a9a", fontWeight:600 }}>{sec.desc}</div>
            </div>

            {/* Cards */}
            <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
              {sec.paquetes.map(pkg => (
                <div key={pkg.id} style={{
                  background:"#fff", borderRadius:"16px", padding:"16px",
                  boxShadow:"0 2px 10px rgba(0,0,0,0.07)",
                  border:`2px solid ${loading===pkg.id ? pkg.color : "#f0f0f0"}`,
                  display:"flex", alignItems:"center", gap:"14px",
                  transition:"border-color .2s",
                }}>
                  {/* Emoji / BIT count */}
                  <div style={{ width:"52px", height:"52px", borderRadius:"14px", background:`${pkg.color}18`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, flexDirection:"column" }}>
                    <span style={{ fontSize:"22px" }}>{pkg.emoji}</span>
                    <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"11px", color:pkg.color, letterSpacing:"0.5px" }}>{typeof pkg.bits === "number" ? pkg.bits.toLocaleString() : pkg.bits}</span>
                  </div>

                  {/* Info */}
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:"6px", flexWrap:"wrap" }}>
                      <span style={{ fontSize:"14px", fontWeight:900, color:"#1a2a3a" }}>{pkg.titulo}</span>
                      {pkg.badge && <span style={{ background: pkg.color, color:"#fff", borderRadius:"20px", padding:"2px 8px", fontSize:"9px", fontWeight:900 }}>{pkg.badge}</span>}
                    </div>
                    <div style={{ fontSize:"11px", color:"#9a9a9a", fontWeight:600 }}>{pkg.subtitulo}</div>
                    <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"22px", color:pkg.color, letterSpacing:"0.5px", marginTop:"2px" }}>
                      ${pkg.precio.toLocaleString("es-AR")}
                    </div>
                  </div>

                  {/* Botón MP */}
                  <button onClick={() => comprar(pkg)} disabled={!!loading}
                    style={{
                      background: loading===pkg.id ? "#e0e0e0" : "linear-gradient(135deg,#009ee3,#0077c8)",
                      border:"none", borderRadius:"12px", padding:"10px 14px",
                      fontSize:"12px", fontWeight:900, color:"#fff",
                      cursor: loading ? "not-allowed" : "pointer",
                      fontFamily:"'Nunito',sans-serif",
                      display:"flex", flexDirection:"column", alignItems:"center", gap:"2px",
                      minWidth:"72px", flexShrink:0,
                      boxShadow: loading===pkg.id ? "none" : "0 3px 0 #005a9e",
                    }}>
                    {loading===pkg.id ? (
                      <>⏳<span style={{ fontSize:"9px" }}>Cargando</span></>
                    ) : (
                      <><span style={{ fontSize:"16px" }}>💳</span><span style={{ fontSize:"9px" }}>Comprar</span></>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Info seguridad */}
        <div style={{ background:"#fff", borderRadius:"16px", padding:"16px", boxShadow:"0 2px 8px rgba(0,0,0,0.05)", textAlign:"center" }}>
          <div style={{ fontSize:"24px", marginBottom:"8px" }}>🔒</div>
          <div style={{ fontSize:"13px", fontWeight:800, color:"#1a2a3a", marginBottom:"4px" }}>Pago 100% seguro con MercadoPago</div>
          <div style={{ fontSize:"11px", color:"#9a9a9a", fontWeight:600, lineHeight:1.6 }}>
            Tus datos están protegidos. NexoNet no almacena información de tu tarjeta.<br/>
            Los BIT se acreditan automáticamente al confirmar el pago.
          </div>
        </div>
      </div>

      <BottomNav />
    </main>
  );
}
