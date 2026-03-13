"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/lib/supabase";

type Tab = "inicio" | "mensajes" | "adjuntos" | "links" | "miembros";

export default function GrupoPage() {
  const router  = useRouter();
  const params  = useParams();
  const id      = params?.id as string;

  const [grupo,    setGrupo]    = useState<any>(null);
  const [perfil,   setPerfil]   = useState<any>(null);
  const [miembro,  setMiembro]  = useState<any>(null);
  const [tab,      setTab]      = useState<Tab>("inicio");
  const [mensajes, setMensajes] = useState<any[]>([]);
  const [adjuntos, setAdjuntos] = useState<any[]>([]);
  const [links,    setLinks]    = useState<any[]>([]);
  const [miembros, setMiembros] = useState<any[]>([]);
  const [texto,    setTexto]    = useState("");
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [visor,    setVisor]    = useState<any>(null);
  const bottomRef  = useRef<HTMLDivElement>(null);
  const tabBarRef  = useRef<HTMLDivElement>(null);

  const esAdmin = miembro?.rol === "creador" || miembro?.rol === "moderador";

  useEffect(() => {
    const cargar = async () => {
      const { data:{ session } } = await supabase.auth.getSession();
      if (!session) { router.push("/login"); return; }

      const { data: u } = await supabase.from("usuarios").select("*").eq("id", session.user.id).single();
      setPerfil(u);

      const { data: g } = await supabase.from("grupos")
        .select("*, grupo_categorias(nombre,emoji), grupo_subcategorias(nombre), usuarios!grupos_creador_id_fkey(nombre_usuario,codigo)")
        .eq("id", id).single();
      setGrupo(g);

      const { data: m } = await supabase.from("grupo_miembros")
        .select("*").eq("grupo_id", id).eq("usuario_id", session.user.id).single();
      setMiembro(m);

      const [{ data: msgs }, { data: mbs }] = await Promise.all([
        supabase.from("grupo_mensajes").select("*, usuarios(nombre_usuario,codigo,avatar_url,plan)")
          .eq("grupo_id", id).order("created_at", { ascending: true }).limit(100),
        supabase.from("grupo_miembros")
          .select("*, usuarios(id,nombre_usuario,codigo,avatar_url,plan,bits_promotor_total)")
          .eq("grupo_id", id).eq("estado","activo").order("created_at"),
      ]);

      setMensajes(msgs || []);
      setMiembros(mbs || []);

      // Extraer adjuntos y links de mensajes
      const adjs = (msgs||[]).filter((m:any) => m.adjunto_url).map((m:any) => ({
        id: m.id, url: m.adjunto_url, tipo: m.adjunto_tipo || detectarTipo(m.adjunto_url),
        nombre: m.adjunto_nombre || m.adjunto_url?.split("/").pop(), autor: m.usuarios?.nombre_usuario, fecha: m.created_at,
      }));
      const lnks = (msgs||[]).filter((m:any) => m.link_url).map((m:any) => ({
        id: m.id, url: m.link_url, titulo: m.link_titulo || m.link_url,
        descripcion: m.link_descripcion, imagen: m.link_imagen,
        autor: m.usuarios?.nombre_usuario, fecha: m.created_at,
      }));
      setAdjuntos(adjs);
      setLinks(lnks);
      setCargando(false);
    };
    cargar();
  }, [id]);

  useEffect(() => {
    if (tab === "mensajes") setTimeout(() => bottomRef.current?.scrollIntoView({ behavior:"smooth" }), 100);
  }, [tab, mensajes.length]);

  const detectarTipo = (url: string) => {
    if (!url) return "archivo";
    const ext = url.split(".").pop()?.toLowerCase();
    if (["mp4","webm","mov"].includes(ext||"")) return "video";
    if (["jpg","jpeg","png","gif","webp"].includes(ext||"")) return "imagen";
    if (ext === "pdf") return "pdf";
    if (["doc","docx"].includes(ext||"")) return "word";
    return "archivo";
  };

  const enviarMensaje = async () => {
    if (!texto.trim() || !perfil || enviando) return;
    setEnviando(true);
    const { data: nuevo } = await supabase.from("grupo_mensajes").insert({
      grupo_id: id, usuario_id: perfil.id, texto: texto.trim(),
    }).select("*, usuarios(nombre_usuario,codigo,avatar_url,plan)").single();
    if (nuevo) setMensajes(prev => [...prev, nuevo]);
    setTexto("");
    setEnviando(false);
  };

  if (cargando) return <main style={{ paddingTop:"80px", textAlign:"center", color:"#9a9a9a", fontFamily:"'Nunito',sans-serif" }}>Cargando grupo...</main>;

  const TABS: { key: Tab; label: string; emoji: string }[] = [
    { key:"inicio",    label:"Inicio",   emoji:"🏠" },
    { key:"mensajes",  label:"Chat",     emoji:"💬" },
    { key:"adjuntos",  label:"Archivos", emoji:"📎" },
    { key:"links",     label:"Links",    emoji:"🔗" },
    { key:"miembros",  label:"Miembros", emoji:"👥" },
  ];

  const imgFondo = grupo?.imagen_fondo || grupo?.imagen || null;

  return (
    <main style={{ paddingTop:"0", paddingBottom:"90px", background:"#f4f4f2", minHeight:"100vh", fontFamily:"'Nunito',sans-serif" }}>
      <Header />

      {/* HERO CON FONDO */}
      <div style={{ position:"relative", minHeight:"200px", background: imgFondo ? `url(${imgFondo}) center/cover no-repeat` : "linear-gradient(135deg,#1a2a3a,#243b55)", paddingTop:"80px" }}>
        {imgFondo && <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.55)" }} />}
        <div style={{ position:"relative", zIndex:1, padding:"16px 16px 20px" }}>
          <div style={{ display:"flex", alignItems:"flex-end", gap:"14px" }}>
            <div style={{ width:"72px", height:"72px", borderRadius:"18px", overflow:"hidden", flexShrink:0, border:"3px solid rgba(255,255,255,0.3)", background:"#1a2a3a", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"32px" }}>
              {grupo?.imagen
                ? <img src={grupo.imagen} alt={grupo.nombre} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                : <span>{grupo?.grupo_categorias?.emoji||"👥"}</span>
              }
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:"11px", fontWeight:700, color:"rgba(255,255,255,0.6)", marginBottom:"3px", textTransform:"uppercase", letterSpacing:"1px" }}>
                {grupo?.grupo_categorias?.emoji} {grupo?.grupo_categorias?.nombre}
                {grupo?.grupo_subcategorias?.nombre && ` · ${grupo.grupo_subcategorias.nombre}`}
              </div>
              <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"28px", color:"#fff", letterSpacing:"1px", lineHeight:1.1 }}>{grupo?.nombre}</div>
              <div style={{ fontSize:"12px", color:"rgba(255,255,255,0.7)", fontWeight:600, marginTop:"4px" }}>
                👥 {grupo?.miembros_count||miembros.length} miembro{(grupo?.miembros_count||miembros.length)!==1?"s":""} · {grupo?.tipo==="privado"?"🔒 Privado":"🌐 Público"}
              </div>
            </div>
            {esAdmin && (
              <button onClick={()=>router.push(`/grupos/${id}/admin`)}
                style={{ background:"rgba(212,160,23,0.9)", border:"none", borderRadius:"12px", padding:"10px 14px", fontSize:"13px", fontWeight:900, color:"#1a2a3a", cursor:"pointer", fontFamily:"'Nunito',sans-serif", flexShrink:0, boxShadow:"0 2px 8px rgba(0,0,0,0.3)" }}>
                ⚙️ Admin
              </button>
            )}
          </div>
        </div>
      </div>

      {/* TAB BAR SLIDER */}
      <div ref={tabBarRef} style={{ position:"sticky", top:"60px", zIndex:100, background:"#1a2a3a", boxShadow:"0 2px 12px rgba(0,0,0,0.25)" }}>
        <div style={{ display:"flex", overflowX:"auto", scrollbarWidth:"none", WebkitOverflowScrolling:"touch" }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              style={{ flex:"0 0 auto", minWidth:"80px", background:"none", border:"none", cursor:"pointer",
                       padding:"0 4px", display:"flex", flexDirection:"column", alignItems:"center",
                       borderBottom: tab===t.key ? "3px solid #d4a017" : "3px solid transparent",
                       transition:"border-color .2s" }}>
              <div style={{ padding:"10px 8px 6px", display:"flex", flexDirection:"column", alignItems:"center", gap:"3px" }}>
                <span style={{ fontSize:"18px" }}>{t.emoji}</span>
                <span style={{ fontSize:"10px", fontWeight:800, color: tab===t.key ? "#d4a017" : "rgba(255,255,255,0.5)", textTransform:"uppercase", letterSpacing:"0.5px", whiteSpace:"nowrap" }}>{t.label}</span>
              </div>
              {tab===t.key && <div style={{ height:"3px", width:"100%", background:"linear-gradient(90deg,#d4a017,#f0c040)", borderRadius:"3px 3px 0 0" }} />}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: tab==="mensajes" ? "0" : "16px", maxWidth:"600px", margin:"0 auto" }}>

        {/* ── INICIO ── */}
        {tab === "inicio" && (
          <div style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
            {grupo?.descripcion && (
              <div style={{ background:"#fff", borderRadius:"16px", padding:"18px" }}>
                <div style={{ fontSize:"11px", fontWeight:800, color:"#9a9a9a", textTransform:"uppercase", letterSpacing:"1px", marginBottom:"8px" }}>Acerca del grupo</div>
                <div style={{ fontSize:"14px", color:"#2c2c2e", fontWeight:600, lineHeight:1.6 }}>{grupo.descripcion}</div>
              </div>
            )}

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"10px" }}>
              {[
                { n: miembros.length,   e:"👥", l:"Miembros" },
                { n: mensajes.length,   e:"💬", l:"Mensajes" },
                { n: adjuntos.length,   e:"📎", l:"Archivos" },
              ].map(s => (
                <div key={s.l} style={{ background:"#fff", borderRadius:"14px", padding:"16px 8px", textAlign:"center", boxShadow:"0 2px 8px rgba(0,0,0,0.06)" }}>
                  <div style={{ fontSize:"22px", marginBottom:"4px" }}>{s.e}</div>
                  <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"26px", color:"#d4a017" }}>{s.n}</div>
                  <div style={{ fontSize:"10px", fontWeight:700, color:"#9a9a9a", textTransform:"uppercase" }}>{s.l}</div>
                </div>
              ))}
            </div>

            {grupo?.reglas && (
              <div style={{ background:"#fff", borderRadius:"16px", padding:"18px" }}>
                <div style={{ fontSize:"11px", fontWeight:800, color:"#9a9a9a", textTransform:"uppercase", letterSpacing:"1px", marginBottom:"8px" }}>📋 Reglas del grupo</div>
                <div style={{ fontSize:"13px", color:"#2c2c2e", fontWeight:600, lineHeight:1.7, whiteSpace:"pre-wrap" }}>{grupo.reglas}</div>
              </div>
            )}

            <div style={{ background:"#fff", borderRadius:"16px", padding:"16px" }}>
              <div style={{ fontSize:"11px", fontWeight:800, color:"#9a9a9a", textTransform:"uppercase", letterSpacing:"1px", marginBottom:"12px" }}>👑 Creado por</div>
              <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
                <div style={{ width:"40px", height:"40px", borderRadius:"50%", background:"linear-gradient(135deg,#d4a017,#f0c040)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"18px" }}>👤</div>
                <div>
                  <div style={{ fontSize:"14px", fontWeight:900, color:"#1a2a3a" }}>{(grupo?.usuarios as any)?.nombre_usuario||"---"}</div>
                  <div style={{ fontSize:"11px", color:"#9a9a9a", fontWeight:600 }}>{(grupo?.usuarios as any)?.codigo}</div>
                </div>
              </div>
            </div>

            <button onClick={()=>setTab("mensajes")}
              style={{ background:"linear-gradient(135deg,#1a2a3a,#243b55)", border:"none", borderRadius:"16px", padding:"18px", display:"flex", alignItems:"center", justifyContent:"center", gap:"12px", cursor:"pointer", fontFamily:"'Nunito',sans-serif" }}>
              <span style={{ fontSize:"24px" }}>💬</span>
              <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"18px", color:"#fff", letterSpacing:"1px" }}>Ir al chat del grupo</span>
              <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"20px", color:"#d4a017" }}>→</span>
            </button>
          </div>
        )}

        {/* ── MENSAJES ── */}
        {tab === "mensajes" && (
          <div style={{ display:"flex", flexDirection:"column", height:"calc(100vh - 230px)" }}>
            <div style={{ flex:1, overflowY:"auto", padding:"12px 14px", display:"flex", flexDirection:"column", gap:"8px" }}>
              {mensajes.length === 0 && (
                <div style={{ textAlign:"center", padding:"40px", color:"#9a9a9a" }}>
                  <div style={{ fontSize:"40px", marginBottom:"12px" }}>💬</div>
                  <div style={{ fontWeight:800, color:"#1a2a3a" }}>Sin mensajes todavía</div>
                  <div style={{ fontSize:"12px", marginTop:"4px", fontWeight:600 }}>Sé el primero en escribir</div>
                </div>
              )}
              {mensajes.map((m:any) => {
                const esMio = m.usuario_id === perfil?.id;
                return (
                  <div key={m.id} style={{ display:"flex", flexDirection:esMio?"row-reverse":"row", alignItems:"flex-end", gap:"8px" }}>
                    {!esMio && (
                      <div style={{ width:"32px", height:"32px", borderRadius:"50%", background:"linear-gradient(135deg,#1a2a3a,#243b55)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"14px", flexShrink:0, overflow:"hidden" }}>
                        {m.usuarios?.avatar_url ? <img src={m.usuarios.avatar_url} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} /> : (m.usuarios?.plan==="nexoempresa"?"🏢":"👤")}
                      </div>
                    )}
                    <div style={{ maxWidth:"72%", display:"flex", flexDirection:"column", alignItems:esMio?"flex-end":"flex-start" }}>
                      {!esMio && <div style={{ fontSize:"10px", fontWeight:800, color:"#d4a017", marginBottom:"2px", marginLeft:"4px" }}>{m.usuarios?.nombre_usuario}</div>}
                      <div style={{ background: esMio ? "linear-gradient(135deg,#d4a017,#f0c040)" : "#fff", borderRadius: esMio ? "16px 4px 16px 16px" : "4px 16px 16px 16px", padding:"10px 14px", boxShadow:"0 2px 8px rgba(0,0,0,0.08)" }}>
                        {m.adjunto_url && <AdjuntoMiniatura url={m.adjunto_url} tipo={detectarTipo(m.adjunto_url)} onClick={()=>setVisor(m)} />}
                        {m.texto && <div style={{ fontSize:"14px", fontWeight:600, color: esMio?"#1a2a3a":"#2c2c2e", lineHeight:1.5 }}>{m.texto}</div>}
                        {m.link_url && (
                          <a href={m.link_url} target="_blank" rel="noopener noreferrer"
                            style={{ display:"block", marginTop:"6px", background:"rgba(0,0,0,0.06)", borderRadius:"10px", padding:"8px 10px", fontSize:"12px", color: esMio?"#1a2a3a":"#3a7bd5", fontWeight:700, textDecoration:"none", wordBreak:"break-all" }}>
                            🔗 {m.link_url}
                          </a>
                        )}
                      </div>
                      <div style={{ fontSize:"10px", color:"#bbb", fontWeight:600, marginTop:"3px", marginLeft:"4px", marginRight:"4px" }}>
                        {new Date(m.created_at).toLocaleTimeString("es-AR",{hour:"2-digit",minute:"2-digit"})}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>
            {miembro && miembro.estado==="activo" && !miembro.silenciado ? (
              <div style={{ padding:"10px 14px", background:"#fff", borderTop:"1px solid #e8e8e6", display:"flex", gap:"8px", alignItems:"flex-end" }}>
                <textarea value={texto} onChange={e=>setTexto(e.target.value)}
                  onKeyDown={e=>{ if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();enviarMensaje();} }}
                  placeholder="Escribí un mensaje..." rows={1}
                  style={{ flex:1, border:"2px solid #e8e8e6", borderRadius:"14px", padding:"11px 14px", fontSize:"14px", fontFamily:"'Nunito',sans-serif", outline:"none", resize:"none", maxHeight:"100px", overflowY:"auto" }} />
                <button onClick={enviarMensaje} disabled={enviando||!texto.trim()}
                  style={{ width:"44px", height:"44px", borderRadius:"50%", background: texto.trim() ? "linear-gradient(135deg,#d4a017,#f0c040)" : "#f4f4f2", border:"none", cursor:texto.trim()?"pointer":"default", fontSize:"20px", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, boxShadow:texto.trim()?"0 2px 8px rgba(212,160,23,0.4)":"none" }}>
                  {enviando?"⏳":"➤"}
                </button>
              </div>
            ) : (
              <div style={{ padding:"14px", background:"#fff8e0", textAlign:"center", fontSize:"13px", fontWeight:700, color:"#d4a017", borderTop:"1px solid #f0e0b0" }}>
                {miembro?.silenciado ? "🔇 Estás silenciado en este grupo" : "🔒 Necesitás unirte para escribir"}
              </div>
            )}
          </div>
        )}

        {/* ── ADJUNTOS ── */}
        {tab === "adjuntos" && (
          <div>
            {adjuntos.length === 0 ? (
              <EmptyState emoji="📎" texto="Sin archivos todavía" sub="Los archivos compartidos en el chat aparecerán acá" />
            ) : (
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px" }}>
                {adjuntos.map((a:any) => (
                  <TarjetaAdjunto key={a.id} adjunto={a} onClick={()=>setVisor(a)} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── LINKS ── */}
        {tab === "links" && (
          <div style={{ display:"flex", flexDirection:"column", gap:"12px" }}>
            {links.length === 0 ? (
              <EmptyState emoji="🔗" texto="Sin links todavía" sub="Los links compartidos en el chat aparecerán acá" />
            ) : links.map((l:any) => (
              <TarjetaLink key={l.id} link={l} />
            ))}
          </div>
        )}

        {/* ── MIEMBROS ── */}
        {tab === "miembros" && (
          <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
            <div style={{ fontSize:"11px", fontWeight:800, color:"#9a9a9a", textTransform:"uppercase", letterSpacing:"1px", marginBottom:"4px" }}>
              {miembros.length} miembro{miembros.length!==1?"s":""}
            </div>
            {miembros.map((m:any) => (
              <div key={m.id} style={{ background:"#fff", borderRadius:"14px", padding:"14px 16px", display:"flex", alignItems:"center", gap:"12px" }}>
                <div style={{ width:"44px", height:"44px", borderRadius:"50%", background:"linear-gradient(135deg,#1a2a3a,#243b55)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"20px", overflow:"hidden", flexShrink:0 }}>
                  {m.usuarios?.avatar_url ? <img src={m.usuarios.avatar_url} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} /> : (m.usuarios?.plan==="nexoempresa"?"🏢":"👤")}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:"14px", fontWeight:900, color:"#1a2a3a" }}>{m.usuarios?.nombre_usuario||"---"}</div>
                  <div style={{ fontSize:"11px", color:"#9a9a9a", fontWeight:600 }}>{m.usuarios?.codigo}</div>
                </div>
                <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:"4px" }}>
                  <RolBadge rol={m.rol} />
                  {m.silenciado && <span style={{ fontSize:"10px", color:"#e74c3c", fontWeight:800 }}>🔇 Silenciado</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* VISOR ADJUNTO */}
      {visor && (
        <div style={{ position:"fixed", inset:0, zIndex:600, background:"rgba(0,0,0,0.92)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}
          onClick={()=>setVisor(null)}>
          <button onClick={()=>setVisor(null)} style={{ position:"absolute", top:"16px", right:"16px", background:"rgba(255,255,255,0.15)", border:"none", borderRadius:"50%", width:"44px", height:"44px", fontSize:"20px", color:"#fff", cursor:"pointer" }}>✕</button>
          <div style={{ maxWidth:"90vw", maxHeight:"80vh", display:"flex", flexDirection:"column", alignItems:"center", gap:"12px" }} onClick={e=>e.stopPropagation()}>
            {(() => {
              const url  = visor.url || visor.adjunto_url;
              const tipo = visor.tipo || detectarTipo(url);
              if (tipo==="video") return <video src={url} controls autoPlay style={{ maxWidth:"90vw", maxHeight:"70vh", borderRadius:"12px" }} />;
              if (tipo==="imagen") return <img src={url} alt="" style={{ maxWidth:"90vw", maxHeight:"70vh", borderRadius:"12px", objectFit:"contain" }} />;
              if (tipo==="pdf") return <iframe src={url} style={{ width:"85vw", height:"75vh", borderRadius:"12px", border:"none" }} />;
              return (
                <div style={{ background:"rgba(255,255,255,0.1)", borderRadius:"16px", padding:"32px", textAlign:"center" }}>
                  <div style={{ fontSize:"64px", marginBottom:"16px" }}>📄</div>
                  <div style={{ fontSize:"14px", fontWeight:700, color:"#fff", marginBottom:"16px" }}>{visor.nombre||"Archivo"}</div>
                  <a href={url} target="_blank" rel="noopener noreferrer" style={{ background:"linear-gradient(135deg,#d4a017,#f0c040)", borderRadius:"12px", padding:"12px 24px", fontSize:"14px", fontWeight:900, color:"#1a2a3a", textDecoration:"none" }}>📥 Descargar</a>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      <BottomNav />
    </main>
  );
}

function detectarTipo(url: string) {
  if (!url) return "archivo";
  const ext = url.split(".").pop()?.toLowerCase().split("?")[0];
  if (["mp4","webm","mov","avi"].includes(ext||"")) return "video";
  if (["jpg","jpeg","png","gif","webp"].includes(ext||"")) return "imagen";
  if (ext === "pdf") return "pdf";
  if (["doc","docx"].includes(ext||"")) return "word";
  return "archivo";
}

function AdjuntoMiniatura({ url, tipo, onClick }: { url:string; tipo:string; onClick:()=>void }) {
  return (
    <div onClick={onClick} style={{ marginBottom:"6px", cursor:"pointer", borderRadius:"10px", overflow:"hidden", background:"rgba(0,0,0,0.1)", maxWidth:"200px" }}>
      {tipo==="imagen" && <img src={url} alt="" style={{ width:"100%", maxHeight:"160px", objectFit:"cover", display:"block" }} />}
      {tipo==="video" && <div style={{ position:"relative" }}><video src={url} style={{ width:"100%", maxHeight:"120px", objectFit:"cover", display:"block" }} /><div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(0,0,0,0.4)", fontSize:"32px" }}>▶️</div></div>}
      {(tipo==="pdf"||tipo==="word"||tipo==="archivo") && <div style={{ padding:"10px 12px", display:"flex", alignItems:"center", gap:"8px" }}><span style={{ fontSize:"20px" }}>{tipo==="pdf"?"📕":tipo==="word"?"📝":"📎"}</span><span style={{ fontSize:"11px", fontWeight:700, color:"#fff", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{url.split("/").pop()?.split("?")[0]}</span></div>}
    </div>
  );
}

function TarjetaAdjunto({ adjunto, onClick }: { adjunto:any; onClick:()=>void }) {
  const tipo = adjunto.tipo || detectarTipo(adjunto.url);
  const iconos: Record<string,string> = { video:"🎬", imagen:"🖼️", pdf:"📕", word:"📝", archivo:"📎" };
  return (
    <div onClick={onClick} style={{ background:"#fff", borderRadius:"16px", overflow:"hidden", boxShadow:"0 2px 10px rgba(0,0,0,0.08)", cursor:"pointer" }}>
      <div style={{ height:"110px", background:"linear-gradient(135deg,#1a2a3a,#243b55)", display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden", position:"relative" }}>
        {tipo==="imagen" && <img src={adjunto.url} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />}
        {tipo==="video" && <><video src={adjunto.url} style={{ width:"100%", height:"100%", objectFit:"cover" }} /><div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.4)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"36px" }}>▶️</div></>}
        {(tipo==="pdf"||tipo==="word"||tipo==="archivo") && <span style={{ fontSize:"48px", opacity:0.6 }}>{iconos[tipo]}</span>}
        <div style={{ position:"absolute", top:"8px", left:"8px", background:`rgba(${tipo==="video"?"231,76,60":tipo==="pdf"?"192,57,43":tipo==="imagen"?"39,174,96":"58,123,213"},0.9)`, borderRadius:"8px", padding:"3px 8px", fontSize:"10px", fontWeight:900, color:"#fff", textTransform:"uppercase" }}>{tipo}</div>
      </div>
      <div style={{ padding:"10px 12px" }}>
        <div style={{ fontSize:"12px", fontWeight:800, color:"#1a2a3a", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", marginBottom:"2px" }}>{adjunto.nombre||"Archivo"}</div>
        <div style={{ fontSize:"10px", color:"#9a9a9a", fontWeight:600 }}>por {adjunto.autor} · {new Date(adjunto.fecha).toLocaleDateString("es-AR")}</div>
      </div>
    </div>
  );
}

function TarjetaLink({ link }: { link:any }) {
  return (
    <a href={link.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration:"none" }}>
      <div style={{ background:"#fff", borderRadius:"16px", overflow:"hidden", boxShadow:"0 2px 10px rgba(0,0,0,0.07)", display:"flex", gap:"0" }}>
        <div style={{ width:"80px", minHeight:"80px", background:"linear-gradient(135deg,#1a2a3a,#243b55)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"28px", flexShrink:0, overflow:"hidden" }}>
          {link.imagen ? <img src={link.imagen} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} /> : "🔗"}
        </div>
        <div style={{ flex:1, padding:"12px 14px", minWidth:0 }}>
          <div style={{ fontSize:"13px", fontWeight:900, color:"#1a2a3a", marginBottom:"3px", overflow:"hidden", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical" as any }}>{link.titulo||link.url}</div>
          {link.descripcion && <div style={{ fontSize:"11px", color:"#9a9a9a", fontWeight:600, marginBottom:"4px", overflow:"hidden", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical" as any }}>{link.descripcion}</div>}
          <div style={{ fontSize:"10px", color:"#3a7bd5", fontWeight:700, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{link.url}</div>
          <div style={{ fontSize:"10px", color:"#bbb", fontWeight:600, marginTop:"3px" }}>por {link.autor} · {new Date(link.fecha).toLocaleDateString("es-AR")}</div>
        </div>
      </div>
    </a>
  );
}

function RolBadge({ rol }: { rol:string }) {
  const map: Record<string,{c:string;bg:string;label:string}> = {
    creador:   { c:"#1a2a3a", bg:"#d4a017", label:"👑 Creador" },
    moderador: { c:"#fff",    bg:"#3a7bd5", label:"🛡️ Mod" },
    miembro:   { c:"#27ae60", bg:"rgba(39,174,96,0.12)", label:"✅ Miembro" },
  };
  const s = map[rol] || map.miembro;
  return <span style={{ background:s.bg, color:s.c, borderRadius:"20px", padding:"3px 10px", fontSize:"10px", fontWeight:900 }}>{s.label}</span>;
}

function EmptyState({ emoji, texto, sub }: { emoji:string; texto:string; sub:string }) {
  return (
    <div style={{ textAlign:"center", padding:"50px 20px", background:"#fff", borderRadius:"16px" }}>
      <div style={{ fontSize:"48px", marginBottom:"12px" }}>{emoji}</div>
      <div style={{ fontSize:"16px", fontWeight:900, color:"#1a2a3a", marginBottom:"6px" }}>{texto}</div>
      <div style={{ fontSize:"13px", color:"#9a9a9a", fontWeight:600 }}>{sub}</div>
    </div>
  );
}
