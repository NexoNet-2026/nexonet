"use client";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import PopupCompra from "@/components/PopupCompra";
import PopupPago, { LINK_PLATAFORMAS } from "@/components/PopupPago";

// ─── Tipos ────────────────────────────────────────────────────────────────────
type Anuncio = {
  id: string;
  titulo: string;
  descripcion?: string;
  precio?: number;
  moneda?: string;
  imagenes?: string[];
  links?: string[];
  adjuntos?: string[];
  link_habilitado?: boolean;
  adjunto_habilitado?: boolean;
  estado: string;
  vistas?: number;
  conexiones?: number;
  created_at: string;
  flash?: boolean;
};

const PLANES = [
  { id:"free",    slots:3,   label:"3 Anuncios FREE",  color:"#6a8aaa", incluye:"100 BIT Conexión" },
  { id:"basico",  slots:3,   label:"Plan ×3",           color:"#d4a017", incluye:"300 BIT Conexión" },
  { id:"normal",  slots:10,  label:"Plan ×10",          color:"#27ae60", incluye:"1.000 BIT Conexión" },
  { id:"empresa", slots:50,  label:"Plan Empresa ×50",  color:"#c0392b", incluye:"5.000 BIT Conexión" },
];

export default function MisAnuncios() {
  const router = useRouter();
  const [anuncios,  setAnuncios]  = useState<Anuncio[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [perfil,    setPerfil]    = useState<any>(null);
  const [session,   setSession]   = useState<any>(null);

  // ── Popups BIT carga ──
  const [popupPlan,    setPopupPlan]    = useState(false);  // Ampliar plan anuncios

  // ── Popups por anuncio ──
  const [popupLink,    setPopupLink]    = useState<string|null>(null);   // anuncio_id
  const [popupAdj,     setPopupAdj]     = useState<string|null>(null);   // anuncio_id
  const [popupFlash,   setPopupFlash]   = useState<string|null>(null);   // anuncio_id

  // ── BIT del usuario ──
  const bitsNexo  = perfil?.bits       || 0;
  const bitsPromo = perfil?.bits_promo || 0;
  const bitsFree  = perfil?.bits_free  || 0;

  useEffect(() => { cargar(); }, []);

  const cargar = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.push("/login"); return; }
    setSession(session);

    const { data: p } = await supabase.from("usuarios").select("*").eq("id", session.user.id).single();
    if (p) setPerfil(p);

    const { data: a } = await supabase
      .from("anuncios")
      .select("*")
      .eq("usuario_id", session.user.id)
      .order("created_at", { ascending: false });

    setAnuncios(a || []);
    setLoading(false);
  };

  const eliminarAnuncio = async (id: string) => {
    if (!confirm("¿Eliminar este anuncio?")) return;
    await supabase.from("anuncios").delete().eq("id", id);
    setAnuncios(prev => prev.filter(a => a.id !== id));
  };

  const toggleEstado = async (a: Anuncio) => {
    const nuevo = a.estado === "activo" ? "pausado" : "activo";
    await supabase.from("anuncios").update({ estado: nuevo }).eq("id", a.id);
    setAnuncios(prev => prev.map(x => x.id === a.id ? { ...x, estado: nuevo } : x));
  };

  // Detecta plan
  const plan = perfil?.plan;
  const planActual = plan === "nexoempresa" ? PLANES[3] : PLANES[0]; // simplificado
  const slots = anuncios.length;
  const slotsMax = planActual.slots;
  const slotsLibres = Math.max(0, slotsMax - slots);

  const fmt = (precio?: number, moneda?: string) =>
    !precio ? "Consultar" : `${moneda === "USD" ? "U$D" : "$"} ${precio.toLocaleString("es-AR")}`;

  if (loading) return (
    <main style={{ paddingTop:"95px", paddingBottom:"130px", background:"#f4f4f2", minHeight:"100vh", fontFamily:"'Nunito',sans-serif" }}>
      <Header /><div style={{ textAlign:"center", padding:"60px", color:"#9a9a9a", fontWeight:700 }}>Cargando...</div><BottomNav />
    </main>
  );

  return (
    <main style={{ paddingTop:"95px", paddingBottom:"130px", background:"#f4f4f2", minHeight:"100vh", fontFamily:"'Nunito',sans-serif" }}>
      <Header />

      {/* ── HEADER SECCIÓN ── */}
      <div style={{ background:"linear-gradient(135deg,#1a2a3a,#243b55)", padding:"16px" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"10px" }}>
          <div>
            <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"22px", color:"#fff", letterSpacing:"1px" }}>
              📋 Mis Anuncios
            </div>
            <div style={{ fontSize:"12px", color:"#8a9aaa", fontWeight:600, marginTop:"2px" }}>
              {slots} publicados · {slotsLibres} slots disponibles
            </div>
          </div>
          <button onClick={() => router.push("/publicar")}
            style={{ background:"linear-gradient(135deg,#f0c040,#d4a017)", border:"none", borderRadius:"12px",
                     padding:"10px 16px", fontSize:"13px", fontWeight:900, color:"#1a2a3a",
                     cursor:"pointer", fontFamily:"'Nunito',sans-serif", boxShadow:"0 3px 0 #a07810" }}>
            ＋ Publicar
          </button>
        </div>

        {/* Barra de slots */}
        <div style={{ background:"rgba(255,255,255,0.06)", borderRadius:"10px", padding:"10px 14px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ fontSize:"12px", fontWeight:700, color:"#d4a017" }}>
            {planActual.label}
          </div>
          <div style={{ display:"flex", gap:"4px" }}>
            {Array.from({ length: Math.min(slotsMax, 10) }).map((_, i) => (
              <div key={i} style={{ width:"16px", height:"8px", borderRadius:"4px", background: i < slots ? "#d4a017" : "rgba(255,255,255,0.2)" }} />
            ))}
            {slotsMax > 10 && <span style={{ fontSize:"10px", color:"#8a9aaa", marginLeft:"4px" }}>+{slotsMax-10}</span>}
          </div>
          <button onClick={() => setPopupPlan(true)}
            style={{ background:"rgba(212,160,23,0.2)", border:"1px solid rgba(212,160,23,0.4)", borderRadius:"8px",
                     padding:"4px 10px", fontSize:"11px", fontWeight:800, color:"#d4a017", cursor:"pointer",
                     fontFamily:"'Nunito',sans-serif" }}>
            AMPLIAR
          </button>
        </div>
      </div>

      <div style={{ padding:"12px 16px", display:"flex", flexDirection:"column", gap:"14px" }}>

        {/* ── SLOTS LIBRES ── */}
        {Array.from({ length: slotsLibres }).map((_, i) => (
          <button key={`slot-${i}`} onClick={() => router.push("/publicar")}
            style={{ background:"#fff", borderRadius:"16px", padding:"20px", border:"2px dashed #d4a017",
                     display:"flex", alignItems:"center", gap:"16px", cursor:"pointer", width:"100%" }}>
            <div style={{ width:"60px", height:"60px", borderRadius:"12px", background:"rgba(212,160,23,0.08)",
                           display:"flex", alignItems:"center", justifyContent:"center", fontSize:"28px", flexShrink:0 }}>
              +
            </div>
            <div style={{ textAlign:"left" }}>
              <div style={{ fontWeight:900, fontSize:"14px", color:"#1a2a3a" }}>Publicar anuncio</div>
              <div style={{ fontSize:"12px", color:"#9a9a9a", fontWeight:600, marginTop:"2px" }}>
                Slot disponible — tocá para publicar
              </div>
              <div style={{ fontSize:"11px", color:"#d4a017", fontWeight:700, marginTop:"4px" }}>
                🔗 {planActual.incluye} incluidos
              </div>
            </div>
          </button>
        ))}

        {/* ── ANUNCIOS EXISTENTES ── */}
        {anuncios.map(a => (
          <div key={a.id} style={{ background:"#fff", borderRadius:"16px", overflow:"hidden",
                                    boxShadow:"0 2px 10px rgba(0,0,0,0.06)", border:"2px solid #e8e8e6" }}>
            {/* Header del anuncio */}
            <div style={{ display:"flex", alignItems:"center", gap:"12px", padding:"14px" }}>
              <div style={{ width:"64px", height:"64px", borderRadius:"12px", background:"#f4f4f2",
                             overflow:"hidden", flexShrink:0, position:"relative" }}>
                {a.imagenes?.[0]
                  ? <img src={a.imagenes[0]} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                  : <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center",
                                   justifyContent:"center", fontSize:"28px" }}>📦</div>
                }
                {a.flash && (
                  <div style={{ position:"absolute", top:"3px", right:"3px", background:"#1a2a3a",
                                 color:"#d4a017", fontSize:"8px", fontWeight:900, padding:"2px 5px",
                                 borderRadius:"6px" }}>⚡</div>
                )}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontWeight:900, fontSize:"14px", color:"#1a2a3a", lineHeight:1.3,
                               overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                  {a.titulo}
                </div>
                <div style={{ fontSize:"16px", fontWeight:900, color:"#d4a017", marginTop:"2px" }}>
                  {fmt(a.precio, a.moneda)}
                </div>
                <div style={{ display:"flex", gap:"8px", marginTop:"4px" }}>
                  <span style={{ fontSize:"10px", color:"#9a9a9a" }}>👁️ {a.vistas||0}</span>
                  <span style={{ fontSize:"10px", color:"#9a9a9a" }}>🔗 {a.conexiones||0}</span>
                </div>
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:"6px", flexShrink:0, alignItems:"flex-end" }}>
                <span style={{ fontSize:"10px", fontWeight:800, padding:"3px 10px", borderRadius:"20px",
                                background: a.estado==="activo" ? "#e8f8ee" : "#f4f4f2",
                                color: a.estado==="activo" ? "#27ae60" : "#9a9a9a" }}>
                  {a.estado==="activo" ? "✓ Activo" : "⏸ Pausado"}
                </span>
              </div>
            </div>

            {/* Acciones principales */}
            <div style={{ display:"flex", gap:"8px", padding:"0 14px 12px" }}>
              <button onClick={() => router.push(`/anuncios/${a.id}`)}
                style={{ flex:1, background:"#f4f4f2", border:"none", borderRadius:"10px", padding:"9px",
                         fontSize:"12px", fontWeight:800, color:"#1a2a3a", cursor:"pointer",
                         fontFamily:"'Nunito',sans-serif" }}>
                👁️ Ver
              </button>
              <button onClick={() => router.push(`/anuncios/${a.id}?editar=1`)}
                style={{ flex:1, background:"rgba(212,160,23,0.1)", border:"1px solid rgba(212,160,23,0.3)",
                         borderRadius:"10px", padding:"9px", fontSize:"12px", fontWeight:800,
                         color:"#d4a017", cursor:"pointer", fontFamily:"'Nunito',sans-serif" }}>
                ✏️ Editar
              </button>
              <button onClick={() => toggleEstado(a)}
                style={{ flex:1, background: a.estado==="activo" ? "rgba(231,76,60,0.08)" : "rgba(39,174,96,0.08)",
                         border:`1px solid ${a.estado==="activo"?"rgba(231,76,60,0.3)":"rgba(39,174,96,0.3)"}`,
                         borderRadius:"10px", padding:"9px", fontSize:"12px", fontWeight:800,
                         color: a.estado==="activo" ? "#e74c3c" : "#27ae60",
                         cursor:"pointer", fontFamily:"'Nunito',sans-serif" }}>
                {a.estado==="activo" ? "⏸ Pausar" : "▶️ Activar"}
              </button>
              <button onClick={() => eliminarAnuncio(a.id)}
                style={{ background:"rgba(231,76,60,0.08)", border:"1px solid rgba(231,76,60,0.2)",
                         borderRadius:"10px", padding:"9px 12px", fontSize:"14px",
                         color:"#e74c3c", cursor:"pointer" }}>
                🗑️
              </button>
            </div>

            {/* ── EXTRAS ── */}
            <div style={{ borderTop:"1px solid #f0f0f0", padding:"12px 14px", display:"flex", flexDirection:"column", gap:"10px" }}>

              {/* Link Multimedia */}
              <div>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"8px" }}>
                  <div style={{ fontSize:"12px", fontWeight:900, color:"#1a2a3a" }}>🔗 Links multimedia</div>
                  {!a.link_habilitado ? (
                    <button onClick={() => setPopupLink(a.id)}
                      style={{ background:"linear-gradient(135deg,#f0c040,#d4a017)", border:"none",
                               borderRadius:"8px", padding:"5px 12px", fontSize:"11px", fontWeight:900,
                               color:"#1a2a3a", cursor:"pointer", fontFamily:"'Nunito',sans-serif",
                               boxShadow:"0 2px 0 #a07810" }}>
                      💰 Comprar para habilitar — $500
                    </button>
                  ) : (
                    <span style={{ fontSize:"10px", fontWeight:800, color:"#27ae60", background:"#e8f8ee",
                                    padding:"3px 10px", borderRadius:"20px" }}>✓ Habilitado</span>
                  )}
                </div>
                {!a.link_habilitado ? (
                  <div style={{ background:"#f8f8f8", borderRadius:"10px", padding:"10px 12px" }}>
                    <div style={{ fontSize:"11px", color:"#9a9a9a", fontWeight:600, marginBottom:"8px" }}>
                      Agregá links de YouTube, Instagram, Facebook, Mercado Libre y más
                    </div>
                    <div style={{ display:"flex", gap:"8px" }}>
                      {LINK_PLATAFORMAS.map(p => (
                        <span key={p.nombre} style={{ fontSize:"20px" }} title={p.nombre}>{p.emoji}</span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div style={{ display:"flex", gap:"6px", flexWrap:"wrap" }}>
                    {(a.links || []).length > 0 ? (
                      (a.links || []).map((l, i) => (
                        <a key={i} href={l} target="_blank" rel="noopener noreferrer"
                          style={{ background:"rgba(212,160,23,0.1)", border:"1px solid rgba(212,160,23,0.3)",
                                   borderRadius:"8px", padding:"4px 10px", fontSize:"11px", fontWeight:700,
                                   color:"#d4a017", textDecoration:"none", wordBreak:"break-all" }}>
                          🔗 {new URL(l).hostname}
                        </a>
                      ))
                    ) : (
                      <div style={{ fontSize:"11px", color:"#9a9a9a", fontWeight:600 }}>
                        Sin links agregados · <span style={{ color:"#d4a017", cursor:"pointer" }}>+ Agregar</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Archivos Adjuntos */}
              <div>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"8px" }}>
                  <div style={{ fontSize:"12px", fontWeight:900, color:"#1a2a3a" }}>📎 Archivos adjuntos</div>
                  {!a.adjunto_habilitado ? (
                    <button onClick={() => setPopupAdj(a.id)}
                      style={{ background:"#1a2a3a", border:"none", borderRadius:"8px",
                               padding:"5px 12px", fontSize:"11px", fontWeight:900,
                               color:"#d4a017", cursor:"pointer", fontFamily:"'Nunito',sans-serif" }}>
                      💰 Comprar $500
                    </button>
                  ) : (
                    <span style={{ fontSize:"10px", fontWeight:800, color:"#27ae60", background:"#e8f8ee",
                                    padding:"3px 10px", borderRadius:"20px" }}>✓ Habilitado</span>
                  )}
                </div>
                {!a.adjunto_habilitado && (
                  <div style={{ background:"#f8f8f8", borderRadius:"10px", padding:"10px 12px",
                                 fontSize:"11px", color:"#9a9a9a", fontWeight:600 }}>
                    Adjuntá PDFs, imágenes extra, planillas y más (hasta 5 archivos)
                  </div>
                )}
                {a.adjunto_habilitado && (
                  <div style={{ fontSize:"11px", color:"#9a9a9a", fontWeight:600 }}>
                    {(a.adjuntos||[]).length === 0
                      ? "Sin archivos · "
                      : `${(a.adjuntos||[]).length} archivos · `
                    }
                    <span style={{ color:"#d4a017", cursor:"pointer" }}>+ Subir archivo</span>
                  </div>
                )}
              </div>

              {/* Promo Flash */}
              <button onClick={() => setPopupFlash(a.id)}
                style={{ width:"100%", background:"rgba(26,42,58,0.05)", border:"2px solid rgba(26,42,58,0.12)",
                         borderRadius:"10px", padding:"10px", display:"flex", alignItems:"center",
                         justifyContent:"space-between", cursor:"pointer", fontFamily:"'Nunito',sans-serif" }}>
                <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
                  <span style={{ fontSize:"18px" }}>⚡</span>
                  <div style={{ textAlign:"left" }}>
                    <div style={{ fontSize:"12px", fontWeight:900, color:"#1a2a3a" }}>Promo Flash</div>
                    <div style={{ fontSize:"10px", color:"#9a9a9a", fontWeight:600 }}>Destacá por barrio/ciudad/provincia/país</div>
                  </div>
                </div>
                <span style={{ fontSize:"11px", fontWeight:800, color:"#d4a017" }}>desde $500 →</span>
              </button>
            </div>
          </div>
        ))}

        {/* Estado vacío */}
        {anuncios.length === 0 && slotsLibres === 0 && (
          <div style={{ textAlign:"center", padding:"60px 20px", color:"#9a9a9a" }}>
            <div style={{ fontSize:"48px", marginBottom:"16px" }}>📋</div>
            <div style={{ fontSize:"16px", fontWeight:800, color:"#1a2a3a", marginBottom:"8px" }}>
              No publicaste anuncios aún
            </div>
            <button onClick={() => router.push("/publicar")}
              style={{ background:"linear-gradient(135deg,#d4a017,#f0c040)", border:"none", borderRadius:"12px",
                       padding:"14px 28px", fontSize:"14px", fontWeight:900, color:"#1a2a3a",
                       cursor:"pointer", fontFamily:"'Nunito',sans-serif", boxShadow:"0 4px 0 #a07810" }}>
              ➕ Publicar mi primer anuncio
            </button>
          </div>
        )}

        {/* AMPLIAR PLAN — siempre visible al pie */}
        <div style={{ background:"#fff", borderRadius:"16px", padding:"16px", boxShadow:"0 2px 10px rgba(0,0,0,0.06)" }}>
          <div style={{ fontSize:"11px", fontWeight:800, color:"#9a9a9a", textTransform:"uppercase",
                         letterSpacing:"1px", marginBottom:"12px" }}>
            AMPLIAR PLAN
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
            {[
              { label:"NEXO NET",   subLabel:"BIT Anuncios × 3",  precio:"$1.000", badge:null,       color:"#d4a017" },
              { label:"NEXO NET",   subLabel:"BIT Anuncios × 10", precio:"$3.000", badge:"AHORRÁS $1.000", color:"#27ae60" },
              { label:"NEXO NET",   subLabel:"Empresa × 50",      precio:"$10.000",badge:"EMPRESA",   color:"#c0392b" },
            ].map((p, i) => (
              <button key={i} onClick={() => setPopupPlan(true)}
                style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
                         background:`${p.color}08`, border:`2px solid ${p.color}25`,
                         borderRadius:"12px", padding:"12px 14px", cursor:"pointer",
                         fontFamily:"'Nunito',sans-serif", width:"100%", textAlign:"left",
                         position:"relative" }}>
                {p.badge && (
                  <span style={{ position:"absolute", top:"-8px", right:"12px", background:"#27ae60",
                                  color:"#fff", fontSize:"9px", fontWeight:900, padding:"2px 8px",
                                  borderRadius:"20px" }}>{p.badge}</span>
                )}
                <div>
                  <div style={{ fontSize:"10px", fontWeight:800, color:p.color,
                                 textTransform:"uppercase", letterSpacing:"1px" }}>{p.label}</div>
                  <div style={{ fontSize:"14px", fontWeight:900, color:"#1a2a3a" }}>{p.subLabel}</div>
                </div>
                <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"22px", color:p.color }}>
                  {p.precio}
                </div>
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* ══ POPUP AMPLIAR PLAN ══ */}
      {popupPlan && (
        <PopupCompra
          tipo="anuncio"
          tituloAccion="BIT Anuncios — Ampliar plan"
          bitsDisponibles={{ nexo: bitsNexo, promo: bitsPromo, free: bitsFree }}
          onClose={() => setPopupPlan(false)}
        />
      )}

      {/* ══ POPUP LINK MULTIMEDIA ══ */}
      {popupLink && (
        <PopupPago
          titulo="Link Multimedia"
          emoji="🔗"
          producto={{ id:"link", emoji:"🔗", titulo:"Link Multimedia",
                      desc:"Links ilimitados una vez habilitado",
                      precio:500, bitCost:500 }}
          bitsDisponibles={{ nexo: bitsNexo, promo: bitsPromo, free: bitsFree }}
          onClose={() => setPopupLink(null)}
          onExito={async (metodo) => {
            if (metodo.startsWith("bit_")) {
              // Descontar BIT y habilitar
              await supabase.from("anuncios").update({ link_habilitado: true }).eq("id", popupLink);
              setAnuncios(prev => prev.map(a => a.id === popupLink ? { ...a, link_habilitado: true } : a));
            } else {
              // Transferencia: marcar pago pendiente
              alert("✅ Solicitá la habilitación por transferencia bancaria. Te contactamos en 24hs.");
            }
            setPopupLink(null);
          }}
        >
          {/* Lista de plataformas */}
          <div style={{ background:"#f8f8f8", borderRadius:"12px", padding:"14px 12px",
                         fontSize:"12px", fontWeight:600, color:"#555",
                         marginBottom:"4px", lineHeight:1.5 }}>
            Adjuntá links externos a tu anuncio para que los compradores vean más contenido:
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
            {LINK_PLATAFORMAS.map(p => (
              <div key={p.nombre} style={{ display:"flex", alignItems:"center", gap:"12px",
                                            background:"#f8f8f8", borderRadius:"12px",
                                            padding:"12px 14px" }}>
                <div style={{ width:"40px", height:"40px", borderRadius:"10px",
                               background:`${p.color}15`, display:"flex", alignItems:"center",
                               justifyContent:"center", fontSize:"22px", flexShrink:0 }}>
                  {p.emoji}
                </div>
                <div>
                  <div style={{ fontSize:"14px", fontWeight:900, color:"#1a2a3a" }}>{p.nombre}</div>
                  <div style={{ fontSize:"11px", color:"#9a9a9a", fontWeight:600 }}>{p.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </PopupPago>
      )}

      {/* ══ POPUP ADJUNTO ══ */}
      {popupAdj && (
        <PopupPago
          titulo="Agregar Adjunto al Anuncio"
          emoji="📎"
          producto={{ id:"adjunto", emoji:"📎", titulo:"Adjunto en anuncio",
                      desc:"PDF, catálogo o ficha técnica · 30 días",
                      precio:500, bitCost:500 }}
          bitsDisponibles={{ nexo: bitsNexo, promo: bitsPromo, free: bitsFree }}
          onClose={() => setPopupAdj(null)}
          onExito={async (metodo) => {
            if (metodo.startsWith("bit_")) {
              await supabase.from("anuncios").update({ adjunto_habilitado: true }).eq("id", popupAdj);
              setAnuncios(prev => prev.map(a => a.id === popupAdj ? { ...a, adjunto_habilitado: true } : a));
            } else {
              alert("✅ Solicitá la habilitación por transferencia bancaria. Te contactamos en 24hs.");
            }
            setPopupAdj(null);
          }}
        />
      )}

      {/* ══ POPUP PROMO FLASH ══ */}
      {popupFlash && (
        <PopupCompra
          tipo="flash"
          tituloAccion="Promo Flash"
          bitsDisponibles={{ nexo: bitsNexo, promo: bitsPromo, free: bitsFree }}
          onClose={() => setPopupFlash(null)}
        />
      )}

      <BottomNav />
    </main>
  );
}
