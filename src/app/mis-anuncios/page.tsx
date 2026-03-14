"use client";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import PopupCompra, { MetodoPago } from "@/components/PopupCompra";
const LINK_PLATAFORMAS = [
  { nombre:"YouTube",   emoji:"▶️",  color:"#ff0000" },
  { nombre:"Instagram", emoji:"📸",  color:"#e1306c" },
  { nombre:"Facebook",  emoji:"👥",  color:"#1877f2" },
  { nombre:"TikTok",    emoji:"🎵",  color:"#010101" },
  { nombre:"Web",       emoji:"🌐",  color:"#3a7bd5" },
];

type Anuncio = {
  id: string;
  titulo: string;
  descripcion: string | null;
  precio: number | null;
  moneda: string | null;
  imagenes: string[] | null;
  links: string[] | null;
  adjuntos: string[] | null;
  link_habilitado: boolean | null;
  adjunto_habilitado: boolean | null;
  bits_conexion: number | null;
  estado: string;
  vistas: number | null;
  conexiones: number | null;
  created_at: string;
  flash: boolean | null;
  permuto: boolean | null;
};

export default function MisAnuncios() {
  const router = useRouter();
  const [anuncios,  setAnuncios]  = useState<Anuncio[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [perfil,    setPerfil]    = useState<any>(null);
  const [session,   setSession]   = useState<any>(null);

  const [popupPlan,   setPopupPlan]   = useState(false);
  const [popupBits,   setPopupBits]   = useState(false);
  const [popupBitsCx, setPopupBitsCx] = useState<string | null>(null);
  const [popupLink,   setPopupLink]   = useState<string | null>(null);
  const [popupAdj,    setPopupAdj]    = useState<string | null>(null);
  const [popupFlash,  setPopupFlash]  = useState<string | null>(null);

  const [editando,    setEditando]    = useState<Anuncio | null>(null);
  const [editForm,    setEditForm]    = useState({ titulo: "", descripcion: "", precio: "", moneda: "ARS", permuto: false });
  const [editImgs,    setEditImgs]    = useState<string[]>([]);
  const [subiendoImg, setSubiendoImg] = useState(false);
  const [guardando,   setGuardando]   = useState(false);
  const imgInputRef = useRef<HTMLInputElement>(null);

  const [editLinks,     setEditLinks]     = useState<Record<string, string[]>>({});
  const [nuevoLink,     setNuevoLink]     = useState<Record<string, string>>({});
  const [guardandoLink, setGuardandoLink] = useState<string | null>(null);

  const [subiendoAdj, setSubiendoAdj] = useState<string | null>(null);
  const adjInputRefs  = useRef<Record<string, HTMLInputElement | null>>({});

  const bitsNexo  = perfil?.bits       ?? 0;
  const bitsPromo = perfil?.bits_promo ?? 0;
  const bitsFree  = perfil?.bits_free  ?? 0;

  useEffect(() => { cargar(); }, []);

  const cargar = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.push("/login"); return; }
    setSession(session);
    const { data: p } = await supabase.from("usuarios").select("*").eq("id", session.user.id).single();
    if (p) setPerfil(p);
    const { data: lista } = await supabase
      .from("anuncios").select("*").eq("usuario_id", session.user.id)
      .order("created_at", { ascending: false });
    if (lista) {
      setAnuncios(lista as Anuncio[]);
      const m: Record<string, string[]> = {};
      (lista as Anuncio[]).forEach(a => { m[a.id] = a.links ?? []; });
      setEditLinks(m);
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

  const abrirEdicion = (a: Anuncio) => {
    setEditando(a);
    setEditForm({
      titulo:      a.titulo,
      descripcion: a.descripcion ?? "",
      precio:      a.precio != null ? String(a.precio) : "",
      moneda:      a.moneda ?? "ARS",
      permuto:     a.permuto ?? false,
    });
    setEditImgs(a.imagenes ?? []);
  };

  const subirImagen = async (file: File) => {
    if (!editando) return;
    if (editImgs.length >= 8) return;
    setSubiendoImg(true);
    const ext  = file.name.split(".").pop() ?? "jpg";
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

  const eliminarImagen = (idx: number) =>
    setEditImgs(prev => prev.filter((_, i) => i !== idx));

  const guardarEdicion = async () => {
    if (!editando) return;
    setGuardando(true);
    const patch = {
      titulo:      editForm.titulo,
      descripcion: editForm.descripcion || null,
      precio:      editForm.precio !== "" ? parseFloat(editForm.precio) : null,
      moneda:      editForm.moneda,
      imagenes:    editImgs,
      permuto:     editForm.permuto,
    };
    await supabase.from("anuncios").update(patch).eq("id", editando.id);
    setAnuncios(prev => prev.map(a =>
      a.id === editando.id ? ({ ...a, ...patch } as Anuncio) : a
    ));
    setGuardando(false);
    setEditando(null);
  };

  const agregarLink = (id: string) => {
    let url = nuevoLink[id]?.trim() ?? "";
    if (!url) return;
    if (!url.startsWith("http")) url = "https://" + url;
    try { new URL(url); } catch { alert("URL inválida"); return; }
    setEditLinks(prev => ({ ...prev, [id]: [...(prev[id] ?? []), url] }));
    setNuevoLink(prev => ({ ...prev, [id]: "" }));
  };

  const quitarLink = (id: string, idx: number) =>
    setEditLinks(prev => ({ ...prev, [id]: (prev[id] ?? []).filter((_, i) => i !== idx) }));

  const guardarLinks = async (id: string) => {
    setGuardandoLink(id);
    const links = editLinks[id] ?? [];
    await supabase.from("anuncios").update({ links }).eq("id", id);
    setAnuncios(prev => prev.map(a => a.id === id ? ({ ...a, links } as Anuncio) : a));
    setGuardandoLink(null);
  };

  const subirAdjunto = async (id: string, file: File) => {
    setSubiendoAdj(id);
    const path = `adjuntos/${id}/${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from("anuncios").upload(path, file, { upsert: false });
    if (!error) {
      const { data: u } = supabase.storage.from("anuncios").getPublicUrl(path);
      const anuncio  = anuncios.find(a => a.id === id);
      const adjuntos = [...(anuncio?.adjuntos ?? []), u.publicUrl];
      await supabase.from("anuncios").update({ adjuntos }).eq("id", id);
      setAnuncios(prev => prev.map(a => a.id === id ? ({ ...a, adjuntos } as Anuncio) : a));
    } else {
      alert("Error al subir: " + error.message);
    }
    setSubiendoAdj(null);
  };

  const quitarAdjunto = async (anuncioId: string, idx: number) => {
    const anuncio  = anuncios.find(a => a.id === anuncioId);
    if (!anuncio) return;
    const adjuntos = (anuncio.adjuntos ?? []).filter((_, i) => i !== idx);
    await supabase.from("anuncios").update({ adjuntos }).eq("id", anuncioId);
    setAnuncios(prev => prev.map(a => a.id === anuncioId ? ({ ...a, adjuntos } as Anuncio) : a));
  };

  const esEmpresa   = perfil?.plan === "nexoempresa";
  const slotsMax    = esEmpresa ? 50 : 3;
  const slots       = anuncios.length;
  const slotsLibres = Math.max(0, slotsMax - slots);
  const puedeCrear  = slotsLibres > 0;

  const fmt = (p: number | null, m: string | null) =>
    p == null ? "Consultar" : `${m === "USD" ? "U$D" : "$"} ${p.toLocaleString("es-AR")}`;

  const iconoAdj = (url: string) =>
    url.includes(".pdf") ? "📄" : url.includes(".xls") ? "📊" : "📎";

  const nombreAdj = (url: string) => {
    try {
      const part = url.split("/").pop() ?? url;
      return decodeURIComponent(part.split("_").slice(1).join("_") || part);
    } catch { return url.split("/").pop() ?? url; }
  };

  if (loading) return (
    <main style={{ paddingTop:"95px", paddingBottom:"130px", background:"#f4f4f2", minHeight:"100vh", fontFamily:"'Nunito',sans-serif" }}>
      <Header />
      <div style={{ textAlign:"center", padding:"60px", color:"#9a9a9a", fontWeight:700 }}>Cargando...</div>
      <BottomNav />
    </main>
  );

  return (
    <main style={{ paddingTop:"95px", paddingBottom:"130px", background:"#f4f4f2", minHeight:"100vh", fontFamily:"'Nunito',sans-serif" }}>
      <Header />

      {/* HEADER — sin botón publicar */}
      <div style={{ background:"linear-gradient(135deg,#1a2a3a,#243b55)", padding:"16px" }}>
        <div style={{ marginBottom:"10px" }}>
          <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"22px", color:"#fff", letterSpacing:"1px" }}>
            📋 Mis Anuncios
          </div>
          <div style={{ fontSize:"12px", color:"#8a9aaa", fontWeight:600, marginTop:"2px" }}>
            {slots} publicados · {slotsLibres} slots disponibles
          </div>
        </div>
        <div style={{ background:"rgba(255,255,255,0.06)", borderRadius:"10px", padding:"10px 14px",
                       display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ fontSize:"12px", fontWeight:700, color:"#d4a017" }}>
            Plan {esEmpresa ? "Empresa" : "Free"} · {slotsMax} slots
          </div>
          <div style={{ display:"flex", gap:"4px" }}>
            {Array.from({ length: Math.min(slotsMax, 10) }).map((_, i) => (
              <div key={i} style={{ width:"16px", height:"8px", borderRadius:"4px",
                                     background: i < slots ? "#d4a017" : "rgba(255,255,255,0.2)" }} />
            ))}
          </div>
          <div style={{ fontSize:"11px", fontWeight:700, color: slotsLibres > 0 ? "#27ae60" : "#e74c3c" }}>
            {slotsLibres > 0 ? `${slotsLibres} libre${slotsLibres > 1 ? "s" : ""}` : "Lleno"}
          </div>
        </div>
      </div>

      <div style={{ padding:"12px 16px", display:"flex", flexDirection:"column", gap:"14px" }}>

        {/* Slots libres — solo si hay espacio */}
        {Array.from({ length: slotsLibres }).map((_, i) => (
          <button key={`sl${i}`} onClick={() => router.push("/publicar")}
            style={{ background:"#fff", borderRadius:"16px", padding:"20px", border:"2px dashed #d4a017",
                     display:"flex", alignItems:"center", gap:"16px", cursor:"pointer", width:"100%" }}>
            <div style={{ width:"60px", height:"60px", borderRadius:"12px", background:"rgba(212,160,23,0.08)",
                           display:"flex", alignItems:"center", justifyContent:"center", fontSize:"28px", flexShrink:0 }}>
              ➕
            </div>
            <div style={{ textAlign:"left" }}>
              <div style={{ fontWeight:900, fontSize:"14px", color:"#1a2a3a" }}>Slot disponible</div>
              <div style={{ fontSize:"12px", color:"#9a9a9a", fontWeight:600, marginTop:"2px" }}>
                Tocá para crear un Nexo
              </div>
            </div>
          </button>
        ))}

        {/* Lista de anuncios */}
        {anuncios.map(a => {
          const imgs   = a.imagenes  ?? [];
          const adjs   = a.adjuntos  ?? [];
          const activo = a.estado === "activo";
          return (
            <div key={a.id} style={{ background:"#fff", borderRadius:"16px", overflow:"hidden",
                                      boxShadow:"0 2px 10px rgba(0,0,0,0.06)", border:"2px solid #e8e8e6" }}>

              {/* Cabecera */}
              <div style={{ display:"flex", alignItems:"center", gap:"12px", padding:"14px" }}>
                <div style={{ width:"64px", height:"64px", borderRadius:"12px", background:"#f4f4f2",
                               overflow:"hidden", flexShrink:0, position:"relative" }}>
                  {imgs[0]
                    ? <img src={imgs[0]} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                    : <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center",
                                     justifyContent:"center", fontSize:"28px" }}>📦</div>
                  }
                  {imgs.length > 1 && (
                    <div style={{ position:"absolute", bottom:"2px", right:"2px", background:"rgba(0,0,0,0.65)",
                                   color:"#fff", fontSize:"9px", fontWeight:800,
                                   padding:"1px 5px", borderRadius:"6px" }}>
                      +{imgs.length - 1}
                    </div>
                  )}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:900, fontSize:"14px", color:"#1a2a3a",
                                 overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                    {a.titulo}
                  </div>
                  <div style={{ fontSize:"16px", fontWeight:900, color:"#d4a017", marginTop:"2px" }}>
                    {fmt(a.precio, a.moneda)}
                  </div>
                  <div style={{ display:"flex", gap:"8px", marginTop:"4px" }}>
                    <span style={{ fontSize:"10px", color:"#9a9a9a" }}>👁️ {a.vistas ?? 0}</span>
                    <span style={{ fontSize:"10px", color:"#9a9a9a" }}>🔗 {a.conexiones ?? 0}</span>
                  </div>
                </div>
                <span style={{ fontSize:"10px", fontWeight:800, padding:"3px 10px", borderRadius:"20px",
                                background: activo ? "#e8f8ee" : "#f4f4f2",
                                color:      activo ? "#27ae60" : "#9a9a9a" }}>
                  {activo ? "✓ Activo" : "⏸ Pausado"}
                </span>
              </div>

              {/* Acciones */}
              <div style={{ display:"flex", gap:"8px", padding:"0 14px 12px" }}>
                <button onClick={() => router.push(`/anuncios/${a.id}`)} style={Btn("#f4f4f2","#1a2a3a","none")}>
                  👁️ Ver
                </button>
                <button onClick={() => abrirEdicion(a)} style={Btn("rgba(212,160,23,0.1)","#d4a017","1px solid rgba(212,160,23,0.3)")}>
                  ✏️ Editar
                </button>
                <button onClick={() => toggleEstado(a)}
                  style={Btn(
                    activo ? "rgba(231,76,60,0.08)" : "rgba(39,174,96,0.08)",
                    activo ? "#e74c3c" : "#27ae60",
                    activo ? "1px solid rgba(231,76,60,0.3)" : "1px solid rgba(39,174,96,0.3)"
                  )}>
                  {activo ? "⏸ Pausar" : "▶️ Activar"}
                </button>
                <button onClick={() => eliminarAnuncio(a.id)}
                  style={{ background:"rgba(231,76,60,0.08)", border:"1px solid rgba(231,76,60,0.2)",
                           borderRadius:"10px", padding:"9px 12px", fontSize:"14px",
                           color:"#e74c3c", cursor:"pointer" }}>
                  🗑️
                </button>
              </div>

              {/* Extras */}
              <div style={{ borderTop:"1px solid #f0f0f0", padding:"12px 14px",
                             display:"flex", flexDirection:"column", gap:"14px" }}>

                {/* Links multimedia */}
                <div>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"8px" }}>
                    <div style={{ fontSize:"12px", fontWeight:900, color:"#1a2a3a" }}>🔗 Links multimedia</div>
                    {!a.link_habilitado
                      ? <button onClick={() => setPopupLink(a.id)} style={BtnComprar}>💰 Habilitar — $500</button>
                      : <span style={BadgeVerde}>✓ Habilitado</span>
                    }
                  </div>
                  {!a.link_habilitado && (
                    <div style={{ background:"#f8f8f8", borderRadius:"10px", padding:"10px 12px" }}>
                      <div style={{ fontSize:"11px", color:"#9a9a9a", fontWeight:600, marginBottom:"8px" }}>
                        YouTube · Instagram · Facebook · Mercado Libre · cualquier URL
                      </div>
                      <div style={{ display:"flex", gap:"8px" }}>
                        {LINK_PLATAFORMAS.map(p => (
                          <span key={p.nombre} title={p.nombre} style={{ fontSize:"20px" }}>{p.emoji}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {a.link_habilitado && (
                    <div>
                      {(editLinks[a.id] ?? []).map((link, i) => (
                        <div key={i} style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"6px",
                                              background:"#f8f8f8", borderRadius:"10px", padding:"8px 12px" }}>
                          <span style={{ fontSize:"16px" }}>
                            {link.includes("youtube") || link.includes("youtu.be") ? "▶️"
                             : link.includes("instagram") ? "📸"
                             : link.includes("facebook")  ? "👤"
                             : link.includes("mercadolibre") ? "🛍️" : "🔗"}
                          </span>
                          <span style={{ flex:1, fontSize:"12px", fontWeight:600, color:"#555",
                                          overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                            {link}
                          </span>
                          <button onClick={() => quitarLink(a.id, i)}
                            style={{ background:"none", border:"none", fontSize:"14px",
                                     cursor:"pointer", color:"#e74c3c" }}>✕</button>
                        </div>
                      ))}
                      <div style={{ display:"flex", gap:"6px", marginBottom:"8px" }}>
                        <input type="url" placeholder="https://youtube.com/..."
                          value={nuevoLink[a.id] ?? ""}
                          onChange={e => setNuevoLink(p => ({ ...p, [a.id]: e.target.value }))}
                          onKeyDown={e => e.key === "Enter" && agregarLink(a.id)}
                          style={{ flex:1, border:"2px solid #e8e8e6", borderRadius:"10px",
                                    padding:"9px 12px", fontSize:"13px", fontFamily:"'Nunito',sans-serif",
                                    color:"#2c2c2e", outline:"none" }} />
                        <button onClick={() => agregarLink(a.id)}
                          style={{ background:"#1a2a3a", border:"none", borderRadius:"10px",
                                    padding:"9px 14px", fontSize:"16px", cursor:"pointer", color:"#d4a017" }}>
                          ＋
                        </button>
                      </div>
                      <button onClick={() => guardarLinks(a.id)} disabled={guardandoLink === a.id}
                        style={{ width:"100%", background:"linear-gradient(135deg,#1a2a3a,#243b55)",
                                 border:"none", borderRadius:"10px", padding:"10px",
                                 fontSize:"13px", fontWeight:800, color:"#d4a017",
                                 cursor:"pointer", fontFamily:"'Nunito',sans-serif",
                                 opacity: guardandoLink === a.id ? 0.7 : 1 }}>
                        {guardandoLink === a.id ? "Guardando..." : "💾 Guardar links"}
                      </button>
                    </div>
                  )}
                </div>

                {/* Adjuntos */}
                <div>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"8px" }}>
                    <div style={{ fontSize:"12px", fontWeight:900, color:"#1a2a3a" }}>📎 Archivos adjuntos</div>
                    {!a.adjunto_habilitado
                      ? <button onClick={() => setPopupAdj(a.id)}
                          style={{ ...BtnComprar, background:"#1a2a3a", color:"#d4a017", boxShadow:"none" }}>
                          💰 Habilitar — $500
                        </button>
                      : <span style={BadgeVerde}>✓ Habilitado</span>
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
                      {adjs.map((adj, i) => (
                        <div key={i} style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"6px",
                                              background:"#f8f8f8", borderRadius:"10px", padding:"8px 12px" }}>
                          <span style={{ fontSize:"18px" }}>{iconoAdj(adj)}</span>
                          <a href={adj} target="_blank" rel="noopener noreferrer"
                            style={{ flex:1, fontSize:"12px", fontWeight:600, color:"#1a2a3a",
                                      textDecoration:"none", overflow:"hidden",
                                      textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                            {nombreAdj(adj)}
                          </a>
                          <button onClick={() => quitarAdjunto(a.id, i)}
                            style={{ background:"none", border:"none", fontSize:"14px",
                                     cursor:"pointer", color:"#e74c3c" }}>✕</button>
                        </div>
                      ))}
                      {adjs.length < 5 ? (
                        <>
                          <input type="file"
                            accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.webp"
                            style={{ display:"none" }}
                            ref={el => { adjInputRefs.current[a.id] = el; }}
                            onChange={async e => {
                              const file = e.target.files?.[0];
                              if (file) await subirAdjunto(a.id, file);
                              e.target.value = "";
                            }} />
                          <button
                            onClick={() => adjInputRefs.current[a.id]?.click()}
                            disabled={subiendoAdj === a.id}
                            style={{ width:"100%", background:"rgba(41,128,185,0.06)",
                                     border:"2px dashed rgba(41,128,185,0.4)", borderRadius:"10px",
                                     padding:"12px", fontSize:"13px", fontWeight:800, color:"#2980b9",
                                     cursor:"pointer", fontFamily:"'Nunito',sans-serif",
                                     opacity: subiendoAdj === a.id ? 0.7 : 1 }}>
                            {subiendoAdj === a.id ? "⏳ Subiendo..." : "⬆️ Subir archivo · PDF, Excel, imagen"}
                          </button>
                          <div style={{ fontSize:"10px", color:"#9a9a9a", textAlign:"center", marginTop:"4px" }}>
                            {adjs.length}/5 archivos
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

                {/* BIT CONEXIÓN */}
                <div style={{ background:"rgba(58,123,213,0.06)", border:"2px solid rgba(58,123,213,0.2)",
                               borderRadius:"12px", padding:"12px 14px" }}>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"6px" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
                      <span style={{ fontSize:"18px" }}>🔗</span>
                      <div>
                        <div style={{ fontSize:"12px", fontWeight:900, color:"#1a2a3a" }}>BIT Conexión</div>
                        <div style={{ fontSize:"10px", color:"#9a9a9a", fontWeight:600 }}>
                          Saldo para recibir conexiones en este anuncio
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign:"right" }}>
                      <div style={{ fontSize:"22px", fontWeight:900,
                                     color: (a.bits_conexion ?? 0) > 0 ? "#3a7bd5" : "#e74c3c",
                                     fontFamily:"'Bebas Neue',sans-serif", letterSpacing:"1px" }}>
                        {a.bits_conexion ?? 0}
                      </div>
                      <div style={{ fontSize:"9px", color:"#9a9a9a", fontWeight:700 }}>BIT disponibles</div>
                    </div>
                  </div>
                  {(a.bits_conexion ?? 0) === 0 && (
                    <div style={{ background:"rgba(231,76,60,0.08)", borderRadius:"8px",
                                   padding:"6px 10px", marginBottom:"8px",
                                   fontSize:"11px", fontWeight:700, color:"#e74c3c" }}>
                      ⚠️ Sin saldo — este anuncio no recibe conexiones automáticas
                    </div>
                  )}
                  <button onClick={() => setPopupBitsCx(a.id)}
                    style={{ width:"100%", background:"linear-gradient(135deg,#3a7bd5,#2962b0)",
                             border:"none", borderRadius:"10px", padding:"10px",
                             fontSize:"13px", fontWeight:900, color:"#fff",
                             cursor:"pointer", fontFamily:"'Nunito',sans-serif" }}>
                    ⚡ Cargar BIT Conexión
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {/* Estado vacío */}
        {anuncios.length === 0 && (
          <div style={{ textAlign:"center", padding:"60px 20px" }}>
            <div style={{ fontSize:"48px", marginBottom:"16px" }}>📋</div>
            <div style={{ fontSize:"16px", fontWeight:800, color:"#1a2a3a", marginBottom:"16px" }}>
              No publicaste anuncios aún
            </div>
            <div style={{ fontSize:"13px", color:"#9a9a9a", fontWeight:600 }}>
              Usá el botón ＋ del menú para crear tu primer Nexo
            </div>
          </div>
        )}

        {/* BOTÓN CREAR OTRO ANUNCIO — siempre visible al final */}
        {!esEmpresa && (
          <button onClick={() => setPopupPlan(true)}
            style={{ background:"#fff", borderRadius:"16px", padding:"20px", border:"2px dashed rgba(212,160,23,0.5)",
                     display:"flex", alignItems:"center", gap:"16px", cursor:"pointer", width:"100%",
                     boxShadow:"0 2px 10px rgba(0,0,0,0.06)" }}>
            <div style={{ width:"60px", height:"60px", borderRadius:"12px",
                           background: puedeCrear ? "rgba(212,160,23,0.08)" : "rgba(192,57,43,0.08)",
                           display:"flex", alignItems:"center", justifyContent:"center", fontSize:"28px", flexShrink:0 }}>
              {puedeCrear ? "➕" : "🔒"}
            </div>
            <div style={{ textAlign:"left" }}>
              <div style={{ fontWeight:900, fontSize:"14px", color:"#1a2a3a" }}>
                {puedeCrear ? "Crear otro anuncio" : "Crear otro anuncio"}
              </div>
              <div style={{ fontSize:"12px", fontWeight:600, marginTop:"2px",
                             color: puedeCrear ? "#9a9a9a" : "#c0392b" }}>
                {puedeCrear ? "Slot disponible" : "Límite alcanzado · 500 BIT o convertí en Empresa"}
              </div>
            </div>
            <span style={{ marginLeft:"auto", fontSize:"18px", color:"#d4a017", flexShrink:0 }}>›</span>
          </button>
        )}
      </div>

      {/* MODAL EDICIÓN */}
      {editando && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", zIndex:400,
                       display:"flex", alignItems:"flex-end" }}
             onClick={() => setEditando(null)}>
          <div style={{ background:"#fff", borderRadius:"24px 24px 0 0", padding:"24px 20px 40px",
                         width:"100%", maxHeight:"92vh", overflowY:"auto",
                         fontFamily:"'Nunito',sans-serif" }}
               onClick={e => e.stopPropagation()}>

            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"20px" }}>
              <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"22px",
                             color:"#1a2a3a", letterSpacing:"1px" }}>
                ✏️ Editar anuncio
              </div>
              <button onClick={() => setEditando(null)}
                style={{ background:"#f4f4f2", border:"none", borderRadius:"50%",
                         width:"34px", height:"34px", fontSize:"16px", cursor:"pointer" }}>
                ✕
              </button>
            </div>

            <div style={{ display:"flex", flexDirection:"column", gap:"14px", marginBottom:"20px" }}>
              <div>
                <label style={LS}>Título *</label>
                <input type="text" value={editForm.titulo} style={IS}
                  onChange={e => setEditForm({ ...editForm, titulo: e.target.value })} />
              </div>
              <div>
                <label style={LS}>Descripción</label>
                <textarea value={editForm.descripcion} rows={4} style={{ ...IS, resize:"vertical" }}
                  onChange={e => setEditForm({ ...editForm, descripcion: e.target.value })} />
              </div>
              <div style={{ display:"flex", gap:"10px" }}>
                <div style={{ flex:1 }}>
                  <label style={LS}>Precio</label>
                  <input type="number" value={editForm.precio} style={IS}
                    onChange={e => setEditForm({ ...editForm, precio: e.target.value })} />
                </div>
                <div style={{ width:"90px" }}>
                  <label style={LS}>Moneda</label>
                  <select value={editForm.moneda} style={{ ...IS, padding:"11px 10px" }}
                    onChange={e => setEditForm({ ...editForm, moneda: e.target.value })}>
                    <option value="ARS">ARS $</option>
                    <option value="USD">USD U$D</option>
                  </select>
                </div>
              </div>

              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
                             background:"rgba(142,68,173,0.06)", border:"2px solid rgba(142,68,173,0.2)",
                             borderRadius:"12px", padding:"12px 14px" }}>
                <div>
                  <div style={{ fontSize:"13px", fontWeight:900, color:"#1a2a3a" }}>🔄 Acepta permuta</div>
                  <div style={{ fontSize:"11px", color:"#9a9a9a", fontWeight:600 }}>
                    El anuncio aparecerá en el filtro de permutas
                  </div>
                </div>
                <button
                  onClick={() => setEditForm(f => ({ ...f, permuto: !f.permuto }))}
                  style={{ width:"50px", height:"28px", borderRadius:"14px", border:"none",
                    background: editForm.permuto ? "#8e44ad" : "#e0e0e0",
                    position:"relative", cursor:"pointer", flexShrink:0, transition:"background .2s" }}>
                  <div style={{ width:"22px", height:"22px", borderRadius:"50%", background:"#fff",
                    position:"absolute", top:"3px", left: editForm.permuto ? "25px" : "3px",
                    transition:"left .2s", boxShadow:"0 1px 3px rgba(0,0,0,0.25)" }} />
                </button>
              </div>
            </div>

            <div style={{ marginBottom:"20px" }}>
              <label style={{ ...LS, marginBottom:"10px", display:"block" }}>
                📷 Imágenes ({editImgs.length}/8) · La primera es la portada
              </label>
              {editImgs.length > 0 && (
                <div style={{ display:"flex", gap:"8px", overflowX:"auto",
                               scrollbarWidth:"none", paddingBottom:"8px", marginBottom:"10px" }}>
                  {editImgs.map((img, i) => (
                    <div key={i} style={{ position:"relative", flexShrink:0 }}>
                      <img src={img} alt="" style={{ width:"80px", height:"80px", objectFit:"cover",
                                                      borderRadius:"10px",
                                                      border:`2px solid ${i === 0 ? "#d4a017" : "#e8e8e6"}` }} />
                      {i === 0 && (
                        <span style={{ position:"absolute", bottom:"2px", left:"2px", background:"#d4a017",
                                        color:"#1a2a3a", fontSize:"8px", fontWeight:900,
                                        padding:"1px 5px", borderRadius:"6px" }}>★</span>
                      )}
                      <button onClick={() => eliminarImagen(i)}
                        style={{ position:"absolute", top:"-6px", right:"-6px", background:"#e74c3c",
                                  border:"2px solid #fff", borderRadius:"50%", width:"20px", height:"20px",
                                  fontSize:"10px", color:"#fff", cursor:"pointer", fontWeight:900,
                                  display:"flex", alignItems:"center", justifyContent:"center" }}>
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <input type="file" accept="image/*" multiple style={{ display:"none" }} ref={imgInputRef}
                onChange={async e => {
                  const files = Array.from(e.target.files ?? []);
                  for (const f of files.slice(0, 8 - editImgs.length)) {
                    await subirImagen(f);
                  }
                  e.target.value = "";
                }} />
              {editImgs.length < 8 && (
                <button onClick={() => imgInputRef.current?.click()} disabled={subiendoImg}
                  style={{ width:"100%", background:"rgba(212,160,23,0.06)",
                           border:"2px dashed rgba(212,160,23,0.5)", borderRadius:"12px",
                           padding:"14px", fontSize:"13px", fontWeight:800, color:"#d4a017",
                           cursor:"pointer", fontFamily:"'Nunito',sans-serif",
                           opacity: subiendoImg ? 0.7 : 1 }}>
                  {subiendoImg ? "⏳ Subiendo imagen..." : "⬆️ Agregar imágenes · JPG, PNG, WebP"}
                </button>
              )}
            </div>

            <button onClick={guardarEdicion} disabled={guardando}
              style={{ width:"100%", background:"linear-gradient(135deg,#d4a017,#f0c040)",
                       border:"none", borderRadius:"14px", padding:"16px",
                       fontSize:"15px", fontWeight:900, color:"#1a2a3a",
                       cursor:"pointer", fontFamily:"'Nunito',sans-serif",
                       boxShadow:"0 4px 0 #a07810", opacity: guardando ? 0.7 : 1 }}>
              {guardando ? "Guardando..." : "💾 Guardar cambios"}
            </button>
          </div>
        </div>
      )}

      {/* POPUPS */}
      {popupBits && (
        <PopupCompra titulo="⚡ Cargar BIT" emoji="⚡" costo="$500 / $1.000 / $3.000"
          descripcion="BIT generales para usar en la plataforma"
          bits={{ free: bitsFree, nexo: bitsNexo, promo: bitsPromo }}
          onClose={() => setPopupBits(false)}
          onPagar={async () => { setPopupBits(false); alert("Próximamente"); }} />
      )}
      {/* POPUP CREAR ANUNCIO / UPGRADE */}
      {popupPlan && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", zIndex:500,
                       display:"flex", alignItems:"flex-end" }} onClick={() => setPopupPlan(false)}>
          <div style={{ background:"#fff", borderRadius:"24px 24px 0 0", padding:"24px 20px 44px",
                         width:"100%", fontFamily:"'Nunito',sans-serif" }} onClick={e => e.stopPropagation()}>
            <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"22px", color:"#1a2a3a",
                           letterSpacing:"1px", marginBottom:"6px" }}>
              ➕ Crear otro anuncio
            </div>
            <div style={{ fontSize:"13px", color:"#9a9a9a", fontWeight:600, marginBottom:"20px" }}>
              Ya usaste tus 3 slots gratuitos. Elegí una opción:
            </div>

            {/* OPCIÓN 1 — 1 anuncio extra */}
            <button onClick={async () => {
              const bitsTotal = Math.max(0,bitsNexo) + Math.max(0,bitsFree) + Math.max(0,bitsPromo);
              if (bitsTotal < 500) { alert("Necesitás 500 BIT para agregar un anuncio extra. Cargá BIT en la tienda."); return; }
              // Descontar 500 BIT y aumentar slotsMax
              const campoDescontar = bitsNexo >= 500 ? "bits" : bitsFree >= 500 ? "bits_free" : "bits_promo";
              const valorActual    = campoDescontar === "bits" ? bitsNexo : campoDescontar === "bits_free" ? bitsFree : bitsPromo;
              await supabase.from("usuarios").update({
                [campoDescontar]: valorActual - 500,
                slots_extra: (perfil?.slots_extra || 0) + 1,
              }).eq("id", session?.user?.id);
              setPerfil((p:any) => ({ ...p, [campoDescontar]: valorActual - 500, slots_extra: (p?.slots_extra||0)+1 }));
              setPopupPlan(false);
              router.push("/publicar");
            }}
              style={{ width:"100%", background:"linear-gradient(135deg,#1a2a3a,#243b55)", border:"2px solid rgba(212,160,23,0.3)",
                       borderRadius:"16px", padding:"18px 20px", marginBottom:"12px", cursor:"pointer",
                       display:"flex", alignItems:"center", justifyContent:"space-between",
                       fontFamily:"'Nunito',sans-serif", textAlign:"left" }}>
              <div>
                <div style={{ fontSize:"15px", fontWeight:900, color:"#fff", marginBottom:"4px" }}>
                  📣 1 Anuncio extra
                </div>
                <div style={{ fontSize:"12px", color:"#8a9aaa", fontWeight:600 }}>
                  Se descuenta de tu saldo BIT disponible
                </div>
              </div>
              <div style={{ textAlign:"right", flexShrink:0 }}>
                <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"28px", color:"#d4a017" }}>500</div>
                <div style={{ fontSize:"10px", color:"#8a9aaa", fontWeight:700 }}>BIT</div>
              </div>
            </button>

            {/* OPCIÓN 2 — Nexo Empresa */}
            <button onClick={async () => {
              const bitsTotal = Math.max(0,bitsNexo) + Math.max(0,bitsFree) + Math.max(0,bitsPromo);
              if (bitsTotal < 10000) { alert("Necesitás 10.000 BIT para convertirte en Nexo Empresa. Cargá BIT en la tienda."); return; }
              const campoDescontar = bitsNexo >= 10000 ? "bits" : bitsFree >= 10000 ? "bits_free" : "bits_promo";
              const valorActual    = campoDescontar === "bits" ? bitsNexo : campoDescontar === "bits_free" ? bitsFree : bitsPromo;
              await supabase.from("usuarios").update({
                [campoDescontar]: valorActual - 10000,
                plan: "nexoempresa",
              }).eq("id", session?.user?.id);
              setPerfil((p:any) => ({ ...p, [campoDescontar]: valorActual - 10000, plan: "nexoempresa" }));
              setPopupPlan(false);
              alert("🏢 ¡Felicitaciones! Ya sos Nexo Empresa con 50 slots de anuncios.");
            }}
              style={{ width:"100%", background:"linear-gradient(135deg,#2c1a1a,#4a2020)", border:"2px solid rgba(192,57,43,0.4)",
                       borderRadius:"16px", padding:"18px 20px", cursor:"pointer",
                       display:"flex", alignItems:"center", justifyContent:"space-between",
                       fontFamily:"'Nunito',sans-serif", textAlign:"left", position:"relative", overflow:"hidden" }}>
              <span style={{ position:"absolute", top:0, right:0, background:"#c0392b", color:"#fff",
                              fontSize:"9px", fontWeight:900, padding:"4px 12px",
                              borderRadius:"0 14px 0 12px", letterSpacing:"0.5px" }}>
                EMPRESA
              </span>
              <div>
                <div style={{ fontSize:"15px", fontWeight:900, color:"#fff", marginBottom:"4px" }}>
                  🏢 Nexo Empresa · 50 anuncios
                </div>
                <div style={{ fontSize:"12px", color:"#e88a8a", fontWeight:600 }}>
                  Perfil comercial completo con 50 slots
                </div>
              </div>
              <div style={{ textAlign:"right", flexShrink:0 }}>
                <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"28px", color:"#e74c3c" }}>10.000</div>
                <div style={{ fontSize:"10px", color:"#e88a8a", fontWeight:700 }}>BIT</div>
              </div>
            </button>

            <button onClick={() => setPopupPlan(false)}
              style={{ width:"100%", background:"none", border:"none", padding:"14px",
                       fontSize:"13px", fontWeight:700, color:"#9a9a9a", cursor:"pointer",
                       fontFamily:"'Nunito',sans-serif", marginTop:"4px" }}>
              Cancelar
            </button>
          </div>
        </div>
      )}
      {popupLink && (
        <PopupCompra titulo="Habilitar Link Multimedia" emoji="🔗" costo="500 BIT / $500"
          descripcion="YouTube · Instagram · Facebook · cualquier URL"
          bits={{ free: bitsFree, nexo: bitsNexo, promo: bitsPromo }}
          onClose={() => setPopupLink(null)}
          onPagar={async (metodo: MetodoPago) => {
            const id = popupLink;
            if (metodo === "bit_free" || metodo === "bit_nexo") {
              await supabase.from("anuncios").update({ link_habilitado: true }).eq("id", id);
              setAnuncios(prev => prev.map(a => a.id === id ? ({ ...a, link_habilitado: true } as Anuncio) : a));
            } else { alert("Próximamente"); }
            setPopupLink(null);
          }} />
      )}
      {popupAdj && (
        <PopupCompra titulo="Habilitar Adjuntos" emoji="📎" costo="500 BIT / $500"
          descripcion="PDF, catálogo, ficha técnica · hasta 5 archivos"
          bits={{ free: bitsFree, nexo: bitsNexo, promo: bitsPromo }}
          onClose={() => setPopupAdj(null)}
          onPagar={async (metodo: MetodoPago) => {
            const id = popupAdj;
            if (metodo === "bit_free" || metodo === "bit_nexo") {
              await supabase.from("anuncios").update({ adjunto_habilitado: true }).eq("id", id);
              setAnuncios(prev => prev.map(a => a.id === id ? ({ ...a, adjunto_habilitado: true } as Anuncio) : a));
            } else { alert("Próximamente"); }
            setPopupAdj(null);
          }} />
      )}
      {popupBitsCx && (
        <PopupCompra titulo="Cargar BIT Conexión" emoji="🔗" costo="500 BIT / $500"
          descripcion="Cada buscador que vea tus datos consume 1 BIT"
          bits={{ free: bitsFree, nexo: bitsNexo, promo: bitsPromo }}
          onClose={() => setPopupBitsCx(null)}
          onPagar={async (metodo: MetodoPago) => {
            const id = popupBitsCx;
            const anuncio = anuncios.find(a => a.id === id);
            const actual  = anuncio?.bits_conexion ?? 0;
            const paquete = 500;
            if (metodo === "bit_free") {
              await supabase.from("anuncios").update({ bits_conexion: actual + paquete }).eq("id", id);
              await supabase.from("usuarios").update({ bits_free: bitsFree - paquete }).eq("id", session?.user?.id);
              setAnuncios(prev => prev.map(a => a.id === id ? { ...a, bits_conexion: actual + paquete } : a));
            } else if (metodo === "bit_nexo") {
              await supabase.from("anuncios").update({ bits_conexion: actual + paquete }).eq("id", id);
              await supabase.from("usuarios").update({ bits: bitsNexo - paquete }).eq("id", session?.user?.id);
              setAnuncios(prev => prev.map(a => a.id === id ? { ...a, bits_conexion: actual + paquete } : a));
            } else { alert("Próximamente"); }
            setPopupBitsCx(null);
          }} />
      )}
      {popupFlash && (
        <PopupCompra titulo="Promo Flash" emoji="⚡" costo="$500 / $2.000 / $5.000 / $10.000"
          descripcion="Destacá en barrio · ciudad · provincia · país"
          bits={{ free: bitsFree, nexo: bitsNexo, promo: bitsPromo }}
          onClose={() => setPopupFlash(null)}
          onPagar={async () => { setPopupFlash(null); alert("Próximamente"); }} />
      )}

      <BottomNav />
    </main>
  );
}

const Btn = (bg: string, color: string, border: string): React.CSSProperties => ({
  flex: 1, background: bg, border, borderRadius:"10px", padding:"9px",
  fontSize:"12px", fontWeight:800, color, cursor:"pointer", fontFamily:"'Nunito',sans-serif",
});
const BtnComprar: React.CSSProperties = {
  background:"linear-gradient(135deg,#f0c040,#d4a017)", border:"none", borderRadius:"8px",
  padding:"5px 12px", fontSize:"11px", fontWeight:900, color:"#1a2a3a",
  cursor:"pointer", fontFamily:"'Nunito',sans-serif", boxShadow:"0 2px 0 #a07810",
};
const BadgeVerde: React.CSSProperties = {
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
