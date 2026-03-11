"use client";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import PopupCompra from "@/components/PopupCompra";
import PopupPago, { LINK_PLATAFORMAS } from "@/components/PopupPago";

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

export default function MisAnuncios() {
  const router = useRouter();
  const [anuncios,  setAnuncios]  = useState<Anuncio[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [perfil,    setPerfil]    = useState<any>(null);
  const [session,   setSession]   = useState<any>(null);

  // Popups de compra
  const [popupPlan,  setPopupPlan]  = useState(false);
  const [popupLink,  setPopupLink]  = useState<string|null>(null);
  const [popupAdj,   setPopupAdj]   = useState<string|null>(null);
  const [popupFlash, setPopupFlash] = useState<string|null>(null);

  // Modal edición completa
  const [editando,    setEditando]    = useState<Anuncio|null>(null);
  const [editForm,    setEditForm]    = useState({ titulo:"", descripcion:"", precio:"", moneda:"ARS" });
  const [editImgs,    setEditImgs]    = useState<string[]>([]);
  const [subiendoImg, setSubiendoImg] = useState(false);
  const [guardando,   setGuardando]   = useState(false);
  const imgInputRef = useRef<HTMLInputElement>(null);

  // Gestión links inline
  const [editLinks,      setEditLinks]      = useState<{ [id:string]: string[] }>({});
  const [nuevoLink,      setNuevoLink]      = useState<{ [id:string]: string }>({});
  const [guardandoLink,  setGuardandoLink]  = useState<string|null>(null);

  // Gestión adjuntos inline
  const [subiendoAdj, setSubiendoAdj] = useState<string|null>(null);
  const adjInputRefs = useRef<{[id:string]: HTMLInputElement|null}>({});

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
      .from("anuncios").select("*").eq("usuario_id", session.user.id)
      .order("created_at", { ascending: false });
    if (a) {
      setAnuncios(a);
      const linksMap: { [id:string]: string[] } = {};
      a.forEach((an: Anuncio) => { linksMap[an.id] = an.links || []; });
      setEditLinks(linksMap);
    }
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

  // ── Edición ──
  const abrirEdicion = (a: Anuncio) => {
    setEditando(a);
    setEditForm({ titulo:a.titulo, descripcion:a.descripcion||"", precio:a.precio?.toString()||"", moneda:a.moneda||"ARS" });
    setEditImgs(a.imagenes || []);
  };

  const subirImagen = async (file: File) => {
    if (!editando || !session) return;
    if (editImgs.length >= 8) return;
    setSubiendoImg(true);
    const ext = file.name.split(".").pop() || "jpg";
    const path = `anuncios/${editando.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("anuncios").upload(path, file, { upsert: true });
    if (!error) {
      const { data: u } = supabase.storage.from("anuncios").getPublicUrl(path);
      setEditImgs(prev => [...prev, u.publicUrl]);
    } else {
      alert("Error al subir: " + error.message);
    }
    setSubiendoImg(false);
  };

  const eliminarImagen = (idx: number) => setEditImgs(prev => prev.filter((_,i) => i !== idx));

  const guardarEdicion = async () => {
    if (!editando) return;
    setGuardando(true);
    const updates = {
      titulo:      editForm.titulo,
      descripcion: editForm.descripcion,
      precio:      editForm.precio ? parseFloat(editForm.precio) : null,
      moneda:      editForm.moneda,
      imagenes:    editImgs,
    };
    await supabase.from("anuncios").update(updates).eq("id", editando.id);
    setAnuncios(prev => prev.map(a => a.id === editando.id ? { ...a, ...updates } : a));
    setGuardando(false);
    setEditando(null);
  };

  // ── Links inline ──
  const agregarLink = (id: string) => {
    let url = nuevoLink[id]?.trim();
    if (!url) return;
    if (!url.startsWith("http")) url = "https://" + url;
    try { new URL(url); } catch { alert("URL inválida"); return; }
    setEditLinks(prev => ({ ...prev, [id]: [...(prev[id]||[]), url] }));
    setNuevoLink(prev => ({ ...prev, [id]: "" }));
  };

  const quitarLink = (id: string, idx: number) =>
    setEditLinks(prev => ({ ...prev, [id]: (prev[id]||[]).filter((_,i) => i !== idx) }));

  const guardarLinks = async (id: string) => {
    setGuardandoLink(id);
    const links = editLinks[id] || [];
    await supabase.from("anuncios").update({ links }).eq("id", id);
    setAnuncios(prev => prev.map(a => a.id === id ? { ...a, links } : a));
    setGuardandoLink(null);
  };

  // ── Adjuntos inline ──
  const subirAdjunto = async (id: string, file: File) => {
    setSubiendoAdj(id);
    const path = `adjuntos/${id}/${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from("anuncios").upload(path, file, { upsert: false });
    if (!error) {
      const { data: u } = supabase.storage.from("anuncios").getPublicUrl(path);
      const anuncio = anuncios.find(a => a.id === id);
      const adjuntos = [...(anuncio?.adjuntos || []), u.publicUrl];
      await supabase.from("anuncios").update({ adjuntos }).eq("id", id);
      setAnuncios(prev => prev.map(a => a.id === id ? { ...a, adjuntos } : a));
    } else {
      alert("Error al subir: " + error.message);
    }
    setSubiendoAdj(null);
  };

  const quitarAdjunto = async (anuncioId: string, idx: number) => {
    const anuncio = anuncios.find(a => a.id === anuncioId);
    if (!anuncio) return;
    const adjuntos = (anuncio.adjuntos || []).filter((_,i) => i !== idx);
    await supabase.from("anuncios").update({ adjuntos }).eq("id", anuncioId);
    setAnuncios(prev => prev.map(a => a.id === anuncioId ? { ...a, adjuntos } : a));
  };

  const slotsMax   = perfil?.plan === "nexoempresa" ? 50 : 3;
  const slots      = anuncios.length;
  const slotsLibres = Math.max(0, slotsMax - slots);
  const fmt = (p?: number, m?: string) =>
    !p ? "Consultar" : `${m === "USD" ? "U$D" : "$"} ${p.toLocaleString("es-AR")}`;
  const iconoAdj = (url: string) =>
    url.includes(".pdf") ? "📄" : url.includes(".xls") ? "📊" : "📎";

  if (loading) return (
    <main style={{ paddingTop:"95px", paddingBottom:"130px", background:"#f4f4f2", minHeight:"100vh", fontFamily:"'Nunito',sans-serif" }}>
      <Header /><div style={{ textAlign:"center", padding:"60px", color:"#9a9a9a", fontWeight:700 }}>Cargando...</div><BottomNav />
    </main>
  );

  return (
    <main style={{ paddingTop:"95px", paddingBottom:"130px", background:"#f4f4f2", minHeight:"100vh", fontFamily:"'Nunito',sans-serif" }}>
      <Header />

      {/* ── HEADER ── */}
      <div style={{ background:"linear-gradient(135deg,#1a2a3a,#243b55)", padding:"16px" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"10px" }}>
          <div>
            <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"22px", color:"#fff", letterSpacing:"1px" }}>📋 Mis Anuncios</div>
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
        <div style={{ background:"rgba(255,255,255,0.06)", borderRadius:"10px", padding:"10px 14px",
                       display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ fontSize:"12px", fontWeight:700, color:"#d4a017" }}>
            Plan {perfil?.plan === "nexoempresa" ? "Empresa" : "Free"} · {slotsMax} slots
          </div>
          <div style={{ display:"flex", gap:"4px" }}>
            {Array.from({ length: Math.min(slotsMax, 10) }).map((_, i) => (
              <div key={i} style={{ width:"16px", height:"8px", borderRadius:"4px",
                                     background: i < slots ? "#d4a017" : "rgba(255,255,255,0.2)" }} />
            ))}
          </div>
          <button onClick={() => setPopupPlan(true)}
            style={{ background:"rgba(212,160,23,0.2)", border:"1px solid rgba(212,160,23,0.4)",
                     borderRadius:"8px", padding:"4px 10px", fontSize:"11px", fontWeight:800,
                     color:"#d4a017", cursor:"pointer", fontFamily:"'Nunito',sans-serif" }}>
            AMPLIAR
          </button>
        </div>
      </div>

      <div style={{ padding:"12px 16px", display:"flex", flexDirection:"column", gap:"14px" }}>

        {/* Slots libres */}
        {Array.from({ length: slotsLibres }).map((_, i) => (
          <button key={`sl${i}`} onClick={() => router.push("/publicar")}
            style={{ background:"#fff", borderRadius:"16px", padding:"20px", border:"2px dashed #d4a017",
                     display:"flex", alignItems:"center", gap:"16px", cursor:"pointer", width:"100%" }}>
            <div style={{ width:"60px", height:"60px", borderRadius:"12px", background:"rgba(212,160,23,0.08)",
                           display:"flex", alignItems:"center", justifyContent:"center", fontSize:"28px", flexShrink:0 }}>+</div>
            <div style={{ textAlign:"left" }}>
              <div style={{ fontWeight:900, fontSize:"14px", color:"#1a2a3a" }}>Publicar anuncio</div>
              <div style={{ fontSize:"12px", color:"#9a9a9a", fontWeight:600, marginTop:"2px" }}>Slot disponible — tocá para publicar</div>
            </div>
          </button>
        ))}

        {/* Anuncios */}
        {anuncios.map(a => (
          <div key={a.id} style={{ background:"#fff", borderRadius:"16px", overflow:"hidden",
                                    boxShadow:"0 2px 10px rgba(0,0,0,0.06)", border:"2px solid #e8e8e6" }}>

            {/* Header anuncio */}
            <div style={{ display:"flex", alignItems:"center", gap:"12px", padding:"14px" }}>
              <div style={{ width:"64px", height:"64px", borderRadius:"12px", background:"#f4f4f2",
                             overflow:"hidden", flexShrink:0, position:"relative" }}>
                {a.imagenes?.[0]
                  ? <img src={a.imagenes[0]} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                  : <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"28px" }}>📦</div>
                }
                {(a.imagenes||[]).length > 1 && (
                  <div style={{ position:"absolute", bottom:"2px", right:"2px", background:"rgba(0,0,0,0.65)",
                                 color:"#fff", fontSize:"9px", fontWeight:800, padding:"1px 5px", borderRadius:"6px" }}>
                    +{(a.imagenes||[]).length - 1}
                  </div>
                )}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontWeight:900, fontSize:"14px", color:"#1a2a3a", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                  {a.titulo}
                </div>
                <div style={{ fontSize:"16px", fontWeight:900, color:"#d4a017", marginTop:"2px" }}>{fmt(a.precio, a.moneda)}</div>
                <div style={{ display:"flex", gap:"8px", marginTop:"4px" }}>
                  <span style={{ fontSize:"10px", color:"#9a9a9a" }}>👁️ {a.vistas||0}</span>
                  <span style={{ fontSize:"10px", color:"#9a9a9a" }}>🔗 {a.conexiones||0}</span>
                </div>
              </div>
              <span style={{ fontSize:"10px", fontWeight:800, padding:"3px 10px", borderRadius:"20px",
                              background:a.estado==="activo"?"#e8f8ee":"#f4f4f2",
                              color:a.estado==="activo"?"#27ae60":"#9a9a9a" }}>
                {a.estado==="activo" ? "✓ Activo" : "⏸ Pausado"}
              </span>
            </div>

            {/* Botones acción */}
            <div style={{ display:"flex", gap:"8px", padding:"0 14px 12px" }}>
              <button onClick={() => router.push(`/anuncios/${a.id}`)} style={B("#f4f4f2","#1a2a3a","none")}>👁️ Ver</button>
              <button onClick={() => abrirEdicion(a)} style={B("rgba(212,160,23,0.1)","#d4a017","1px solid rgba(212,160,23,0.3)")}>✏️ Editar</button>
              <button onClick={() => toggleEstado(a)}
                style={B(a.estado==="activo"?"rgba(231,76,60,0.08)":"rgba(39,174,96,0.08)",
                          a.estado==="activo"?"#e74c3c":"#27ae60",
                          a.estado==="activo"?"1px solid rgba(231,76,60,0.3)":"1px solid rgba(39,174,96,0.3)")}>
                {a.estado==="activo" ? "⏸ Pausar" : "▶️ Activar"}
              </button>
              <button onClick={() => eliminarAnuncio(a.id)}
                style={{ background:"rgba(231,76,60,0.08)", border:"1px solid rgba(231,76,60,0.2)",
                         borderRadius:"10px", padding:"9px 12px", fontSize:"14px", color:"#e74c3c", cursor:"pointer" }}>
                🗑️
              </button>
            </div>

            {/* Extras */}
            <div style={{ borderTop:"1px solid #f0f0f0", padding:"12px 14px", display:"flex", flexDirection:"column", gap:"14px" }}>

              {/* LINKS */}
              <div>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"8px" }}>
                  <div style={{ fontSize:"12px", fontWeight:900, color:"#1a2a3a" }}>🔗 Links multimedia</div>
                  {!a.link_habilitado
                    ? <button onClick={() => setPopupLink(a.id)} style={btnComprar}>💰 Habilitar — $500</button>
                    : <span style={badgeVerde}>✓ Habilitado</span>
                  }
                </div>

                {!a.link_habilitado && (
                  <div style={{ background:"#f8f8f8", borderRadius:"10px", padding:"10px 12px" }}>
                    <div style={{ fontSize:"11px", color:"#9a9a9a", fontWeight:600, marginBottom:"8px" }}>
                      YouTube · Instagram · Facebook · Mercado Libre · cualquier URL
                    </div>
                    <div style={{ display:"flex", gap:"8px" }}>
                      {LINK_PLATAFORMAS.map(p => <span key={p.nombre} title={p.nombre} style={{ fontSize:"20px" }}>{p.emoji}</span>)}
                    </div>
                  </div>
                )}

                {a.link_habilitado && (
                  <div>
                    {(editLinks[a.id]||[]).map((link, i) => (
                      <div key={i} style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"6px",
                                            background:"#f8f8f8", borderRadius:"10px", padding:"8px 12px" }}>
                        <span style={{ fontSize:"16px" }}>
                          {link.includes("youtube")||link.includes("youtu.be") ? "▶️"
                           : link.includes("instagram") ? "📸" : link.includes("facebook") ? "👤"
                           : link.includes("mercadolibre") ? "🛍️" : "🔗"}
                        </span>
                        <span style={{ flex:1, fontSize:"12px", fontWeight:600, color:"#555",
                                        overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                          {link}
                        </span>
                        <button onClick={() => quitarLink(a.id, i)}
                          style={{ background:"none", border:"none", fontSize:"14px", cursor:"pointer", color:"#e74c3c" }}>✕</button>
                      </div>
                    ))}
                    <div style={{ display:"flex", gap:"6px", marginBottom:"8px" }}>
                      <input type="url" placeholder="https://youtube.com/..." value={nuevoLink[a.id]||""}
                        onChange={e => setNuevoLink(p => ({ ...p, [a.id]: e.target.value }))}
                        onKeyDown={e => e.key==="Enter" && agregarLink(a.id)}
                        style={{ flex:1, border:"2px solid #e8e8e6", borderRadius:"10px", padding:"9px 12px",
                                  fontSize:"13px", fontFamily:"'Nunito',sans-serif", color:"#2c2c2e", outline:"none" }} />
                      <button onClick={() => agregarLink(a.id)}
                        style={{ background:"#1a2a3a", border:"none", borderRadius:"10px",
                                  padding:"9px 14px", fontSize:"16px", cursor:"pointer", color:"#d4a017" }}>＋</button>
                    </div>
                    <button onClick={() => guardarLinks(a.id)} disabled={guardandoLink===a.id}
                      style={{ width:"100%", background:"linear-gradient(135deg,#1a2a3a,#243b55)", border:"none",
                               borderRadius:"10px", padding:"10px", fontSize:"13px", fontWeight:800, color:"#d4a017",
                               cursor:"pointer", fontFamily:"'Nunito',sans-serif", opacity:guardandoLink===a.id?0.7:1 }}>
                      {guardandoLink===a.id ? "Guardando..." : "💾 Guardar links"}
                    </button>
                  </div>
                )}
              </div>

              {/* ADJUNTOS */}
              <div>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"8px" }}>
                  <div style={{ fontSize:"12px", fontWeight:900, color:"#1a2a3a" }}>📎 Archivos adjuntos</div>
                  {!a.adjunto_habilitado
                    ? <button onClick={() => setPopupAdj(a.id)} style={{ ...btnComprar, background:"#1a2a3a", color:"#d4a017" }}>💰 Habilitar — $500</button>
                    : <span style={badgeVerde}>✓ Habilitado</span>
                  }
                </div>

                {!a.adjunto_habilitado && (
                  <div style={{ background:"#f8f8f8", borderRadius:"10px", padding:"10px 12px",
                                 fontSize:"11px", color:"#9a9a9a", fontWeight:600 }}>
                    PDF, catálogo, ficha técnica, Excel · hasta 5 archivos
                  </div>
                )}

                {a.adjunto_habilitado && (
                  <div>
                    {(a.adjuntos||[]).map((adj, i) => (
                      <div key={i} style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"6px",
                                            background:"#f8f8f8", borderRadius:"10px", padding:"8px 12px" }}>
                        <span style={{ fontSize:"18px" }}>{iconoAdj(adj)}</span>
                        <a href={adj} target="_blank" rel="noopener noreferrer"
                          style={{ flex:1, fontSize:"12px", fontWeight:600, color:"#1a2a3a", textDecoration:"none",
                                    overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                          {decodeURIComponent(adj.split("/").pop()?.split("_").slice(1).join("_") || adj)}
                        </a>
                        <button onClick={() => quitarAdjunto(a.id, i)}
                          style={{ background:"none", border:"none", fontSize:"14px", cursor:"pointer", color:"#e74c3c" }}>✕</button>
                      </div>
                    ))}
                    {(a.adjuntos||[]).length < 5 ? (
                      <>
                        <input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.webp"
                          style={{ display:"none" }}
                          ref={el => { adjInputRefs.current[a.id] = el; }}
                          onChange={async e => {
                            const file = e.target.files?.[0];
                            if (file) await subirAdjunto(a.id, file);
                            e.target.value = "";
                          }} />
                        <button onClick={() => adjInputRefs.current[a.id]?.click()} disabled={subiendoAdj===a.id}
                          style={{ width:"100%", background:"rgba(41,128,185,0.06)", border:"2px dashed rgba(41,128,185,0.4)",
                                   borderRadius:"10px", padding:"12px", fontSize:"13px", fontWeight:800,
                                   color:"#2980b9", cursor:"pointer", fontFamily:"'Nunito',sans-serif",
                                   opacity:subiendoAdj===a.id?0.7:1 }}>
                          {subiendoAdj===a.id ? "⏳ Subiendo..." : "⬆️ Subir archivo · PDF, Excel, imagen"}
                        </button>
                        <div style={{ fontSize:"10px", color:"#9a9a9a", textAlign:"center", marginTop:"4px" }}>
                          {(a.adjuntos||[]).length}/5 archivos
                        </div>
                      </>
                    ) : (
                      <div style={{ fontSize:"11px", color:"#9a9a9a", fontWeight:700, textAlign:"center",
                                     background:"#f8f8f8", borderRadius:"10px", padding:"10px" }}>
                        Límite de 5 archivos alcanzado
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* PROMO FLASH */}
              <button onClick={() => setPopupFlash(a.id)}
                style={{ width:"100%", background:"rgba(26,42,58,0.05)", border:"2px solid rgba(26,42,58,0.12)",
                         borderRadius:"10px", padding:"10px", display:"flex", alignItems:"center",
                         justifyContent:"space-between", cursor:"pointer", fontFamily:"'Nunito',sans-serif" }}>
                <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
                  <span style={{ fontSize:"18px" }}>⚡</span>
                  <div style={{ textAlign:"left" }}>
                    <div style={{ fontSize:"12px", fontWeight:900, color:"#1a2a3a" }}>Promo Flash</div>
                    <div style={{ fontSize:"10px", color:"#9a9a9a", fontWeight:600 }}>Destacá en barrio / ciudad / provincia / país</div>
                  </div>
                </div>
                <span style={{ fontSize:"11px", fontWeight:800, color:"#d4a017" }}>desde $500 →</span>
              </button>
            </div>
          </div>
        ))}

        {/* Estado vacío */}
        {anuncios.length === 0 && slotsLibres === 0 && (
          <div style={{ textAlign:"center", padding:"60px 20px" }}>
            <div style={{ fontSize:"48px", marginBottom:"16px" }}>📋</div>
            <div style={{ fontSize:"16px", fontWeight:800, color:"#1a2a3a", marginBottom:"16px" }}>No publicaste anuncios aún</div>
            <button onClick={() => router.push("/publicar")}
              style={{ background:"linear-gradient(135deg,#d4a017,#f0c040)", border:"none", borderRadius:"12px",
                       padding:"14px 28px", fontSize:"14px", fontWeight:900, color:"#1a2a3a",
                       cursor:"pointer", fontFamily:"'Nunito',sans-serif" }}>
              ➕ Publicar mi primer anuncio
            </button>
          </div>
        )}

        {/* Ampliar plan */}
        <div style={{ background:"#fff", borderRadius:"16px", padding:"16px", boxShadow:"0 2px 10px rgba(0,0,0,0.06)" }}>
          <div style={{ fontSize:"11px", fontWeight:800, color:"#9a9a9a", textTransform:"uppercase",
                         letterSpacing:"1px", marginBottom:"12px" }}>AMPLIAR PLAN</div>
          {[
            { label:"BIT Anuncios × 3",  precio:"$1.000", badge:null,             color:"#d4a017" },
            { label:"BIT Anuncios × 10", precio:"$3.000", badge:"AHORRÁS $1.000", color:"#27ae60" },
            { label:"Empresa × 50",      precio:"$10.000",badge:"EMPRESA",         color:"#c0392b" },
          ].map((p, i) => (
            <button key={i} onClick={() => setPopupPlan(true)}
              style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
                       background:`${p.color}08`, border:`2px solid ${p.color}25`,
                       borderRadius:"12px", padding:"12px 14px", cursor:"pointer",
                       fontFamily:"'Nunito',sans-serif", width:"100%", textAlign:"left",
                       marginBottom:"8px", position:"relative" }}>
              {p.badge && (
                <span style={{ position:"absolute", top:"-8px", right:"12px", background:p.color,
                                color:"#fff", fontSize:"9px", fontWeight:900, padding:"2px 8px",
                                borderRadius:"20px" }}>{p.badge}</span>
              )}
              <div style={{ fontSize:"14px", fontWeight:900, color:"#1a2a3a" }}>{p.label}</div>
              <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"22px", color:p.color }}>{p.precio}</div>
            </button>
          ))}
        </div>

      </div>

      {/* ══════════════════════════════════════════
          MODAL EDICIÓN COMPLETA
      ══════════════════════════════════════════ */}
      {editando && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", zIndex:400,
                       display:"flex", alignItems:"flex-end" }}
             onClick={() => setEditando(null)}>
          <div style={{ background:"#fff", borderRadius:"24px 24px 0 0", padding:"24px 20px 40px",
                         width:"100%", maxHeight:"92vh", overflowY:"auto", fontFamily:"'Nunito',sans-serif" }}
               onClick={e => e.stopPropagation()}>

            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"20px" }}>
              <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"22px", color:"#1a2a3a", letterSpacing:"1px" }}>
                ✏️ Editar anuncio
              </div>
              <button onClick={() => setEditando(null)}
                style={{ background:"#f4f4f2", border:"none", borderRadius:"50%", width:"34px", height:"34px", fontSize:"16px", cursor:"pointer" }}>✕</button>
            </div>

            {/* Campos de texto */}
            <div style={{ display:"flex", flexDirection:"column", gap:"14px", marginBottom:"20px" }}>
              <div>
                <label style={LS}>Título *</label>
                <input type="text" value={editForm.titulo}
                  onChange={e => setEditForm({...editForm, titulo:e.target.value})} style={IS} />
              </div>
              <div>
                <label style={LS}>Descripción</label>
                <textarea value={editForm.descripcion}
                  onChange={e => setEditForm({...editForm, descripcion:e.target.value})}
                  rows={4} style={{...IS, resize:"vertical"}} />
              </div>
              <div style={{ display:"flex", gap:"10px" }}>
                <div style={{ flex:1 }}>
                  <label style={LS}>Precio</label>
                  <input type="number" value={editForm.precio}
                    onChange={e => setEditForm({...editForm, precio:e.target.value})} style={IS} />
                </div>
                <div style={{ width:"90px" }}>
                  <label style={LS}>Moneda</label>
                  <select value={editForm.moneda}
                    onChange={e => setEditForm({...editForm, moneda:e.target.value})}
                    style={{...IS, padding:"11px 10px"}}>
                    <option value="ARS">ARS $</option>
                    <option value="USD">USD U$D</option>
                  </select>
                </div>
              </div>
            </div>

            {/* ── IMÁGENES ── */}
            <div style={{ marginBottom:"20px" }}>
              <label style={{ ...LS, marginBottom:"10px", display:"block" }}>
                📷 Imágenes ({editImgs.length} / 8) · La primera es la portada
              </label>

              {/* Galería */}
              {editImgs.length > 0 && (
                <div style={{ display:"flex", gap:"8px", overflowX:"auto", paddingBottom:"8px",
                               scrollbarWidth:"none", marginBottom:"10px" }}>
                  {editImgs.map((img, i) => (
                    <div key={i} style={{ position:"relative", flexShrink:0 }}>
                      <img src={img} alt="" style={{ width:"80px", height:"80px", objectFit:"cover",
                                                      borderRadius:"10px", border:`2px solid ${i===0?"#d4a017":"#e8e8e6"}` }} />
                      {i === 0 && (
                        <span style={{ position:"absolute", bottom:"2px", left:"2px", background:"#d4a017",
                                        color:"#1a2a3a", fontSize:"8px", fontWeight:900,
                                        padding:"1px 5px", borderRadius:"6px" }}>★</span>
                      )}
                      <button onClick={() => eliminarImagen(i)}
                        style={{ position:"absolute", top:"-6px", right:"-6px", background:"#e74c3c",
                                  border:"2px solid #fff", borderRadius:"50%", width:"20px", height:"20px",
                                  fontSize:"10px", color:"#fff", cursor:"pointer", fontWeight:900,
                                  display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>
                    </div>
                  ))}
                </div>
              )}

              <input type="file" accept="image/*" multiple style={{ display:"none" }} ref={imgInputRef}
                onChange={async e => {
                  for (const file of Array.from(e.target.files||[]).slice(0, 8-editImgs.length)) {
                    await subirImagen(file);
                  }
                  e.target.value = "";
                }} />

              {editImgs.length < 8 && (
                <button onClick={() => imgInputRef.current?.click()} disabled={subiendoImg}
                  style={{ width:"100%", background:"rgba(212,160,23,0.06)",
                           border:"2px dashed rgba(212,160,23,0.5)", borderRadius:"12px",
                           padding:"14px", fontSize:"13px", fontWeight:800, color:"#d4a017",
                           cursor:"pointer", fontFamily:"'Nunito',sans-serif",
                           opacity:subiendoImg?0.7:1 }}>
                  {subiendoImg ? "⏳ Subiendo imagen..." : "⬆️ Agregar imágenes · JPG, PNG, WebP"}
                </button>
              )}
            </div>

            {/* Guardar */}
            <button onClick={guardarEdicion} disabled={guardando}
              style={{ width:"100%", background:"linear-gradient(135deg,#d4a017,#f0c040)", border:"none",
                       borderRadius:"14px", padding:"16px", fontSize:"15px", fontWeight:900,
                       color:"#1a2a3a", cursor:"pointer", fontFamily:"'Nunito',sans-serif",
                       boxShadow:"0 4px 0 #a07810", opacity:guardando?0.7:1 }}>
              {guardando ? "Guardando..." : "💾 Guardar cambios"}
            </button>
          </div>
        </div>
      )}

      {/* ══ POPUPS ══ */}
      {popupPlan && (
        <PopupCompra tipo="anuncio" tituloAccion="BIT Anuncios — Ampliar plan"
          bitsDisponibles={{ nexo:bitsNexo, promo:bitsPromo, free:bitsFree }}
          onClose={() => setPopupPlan(false)} />
      )}

      {popupLink && (
        <PopupPago titulo="Link Multimedia" emoji="🔗"
          producto={{ id:"link", emoji:"🔗", titulo:"Link Multimedia", desc:"Links ilimitados · una vez habilitado", precio:500, bitCost:500 }}
          bitsDisponibles={{ nexo:bitsNexo, promo:bitsPromo, free:bitsFree }}
          onClose={() => setPopupLink(null)}
          onExito={async (metodo) => {
            const id = popupLink;
            if (metodo.startsWith("bit_")) {
              await supabase.from("anuncios").update({ link_habilitado:true }).eq("id", id);
              setAnuncios(prev => prev.map(a => a.id===id ? {...a, link_habilitado:true} : a));
            } else {
              alert("✅ Habilitá por transferencia. Te contactamos en 24hs.");
            }
            setPopupLink(null);
          }}>
          <div style={{ display:"flex", flexDirection:"column", gap:"8px", marginBottom:"4px" }}>
            {LINK_PLATAFORMAS.map(p => (
              <div key={p.nombre} style={{ display:"flex", alignItems:"center", gap:"10px",
                                            background:"#f8f8f8", borderRadius:"10px", padding:"10px 12px" }}>
                <div style={{ width:"34px", height:"34px", borderRadius:"8px", background:`${p.color}15`,
                               display:"flex", alignItems:"center", justifyContent:"center",
                               fontSize:"18px", flexShrink:0 }}>{p.emoji}</div>
                <div>
                  <div style={{ fontSize:"13px", fontWeight:900, color:"#1a2a3a" }}>{p.nombre}</div>
                  <div style={{ fontSize:"11px", color:"#9a9a9a", fontWeight:600 }}>{p.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </PopupPago>
      )}

      {popupAdj && (
        <PopupPago titulo="Agregar Adjunto" emoji="📎"
          producto={{ id:"adjunto", emoji:"📎", titulo:"Adjunto en anuncio", desc:"PDF, catálogo, ficha técnica · 30 días", precio:500, bitCost:500 }}
          bitsDisponibles={{ nexo:bitsNexo, promo:bitsPromo, free:bitsFree }}
          onClose={() => setPopupAdj(null)}
          onExito={async (metodo) => {
            const id = popupAdj;
            if (metodo.startsWith("bit_")) {
              await supabase.from("anuncios").update({ adjunto_habilitado:true }).eq("id", id);
              setAnuncios(prev => prev.map(a => a.id===id ? {...a, adjunto_habilitado:true} : a));
            } else {
              alert("✅ Habilitá por transferencia. Te contactamos en 24hs.");
            }
            setPopupAdj(null);
          }} />
      )}

      {popupFlash && (
        <PopupCompra tipo="flash" tituloAccion="Promo Flash"
          bitsDisponibles={{ nexo:bitsNexo, promo:bitsPromo, free:bitsFree }}
          onClose={() => setPopupFlash(null)} />
      )}

      <BottomNav />
    </main>
  );
}

// Helpers estilos
const B = (bg:string, color:string, border:string): React.CSSProperties => ({
  flex:1, background:bg, border, borderRadius:"10px", padding:"9px",
  fontSize:"12px", fontWeight:800, color, cursor:"pointer", fontFamily:"'Nunito',sans-serif",
});
const btnComprar: React.CSSProperties = {
  background:"linear-gradient(135deg,#f0c040,#d4a017)", border:"none", borderRadius:"8px",
  padding:"5px 12px", fontSize:"11px", fontWeight:900, color:"#1a2a3a",
  cursor:"pointer", fontFamily:"'Nunito',sans-serif", boxShadow:"0 2px 0 #a07810",
};
const badgeVerde: React.CSSProperties = {
  fontSize:"10px", fontWeight:800, color:"#27ae60", background:"#e8f8ee",
  padding:"3px 10px", borderRadius:"20px",
};
const LS: React.CSSProperties = {
  display:"block", fontSize:"11px", fontWeight:800, color:"#666",
  textTransform:"uppercase", letterSpacing:"1px", marginBottom:"6px",
};
const IS: React.CSSProperties = {
  width:"100%", border:"2px solid #e8e8e6", borderRadius:"10px",
  padding:"11px 14px", fontSize:"14px", fontFamily:"'Nunito',sans-serif",
  color:"#2c2c2e", outline:"none", boxSizing:"border-box",
};
