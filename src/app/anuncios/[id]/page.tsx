"use client";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const FUENTES: Record<string, { label: string; color: string; texto: string }> = {
  nexonet:       { label: "NexoNet",        color: "#d4a017", texto: "#1a2a3a" },
  mercadolibre:  { label: "Mercado Libre",  color: "#ffe600", texto: "#333" },
  rosariogarage: { label: "Rosario Garage", color: "#ff6b00", texto: "#fff" },
  olx:           { label: "OLX",            color: "#00a884", texto: "#fff" },
  otro:          { label: "Externo",        color: "#888",    texto: "#fff" },
};

function getLinkEmbed(url: string): { tipo: string; embedUrl: string | null } {
  const u = url.toLowerCase();
  if (u.includes("youtube.com/watch")) {
    const id = url.split("v=")[1]?.split("&")[0];
    return { tipo: "youtube", embedUrl: id ? `https://www.youtube.com/embed/${id}` : null };
  }
  if (u.includes("youtu.be/")) {
    const id = url.split("youtu.be/")[1]?.split("?")[0];
    return { tipo: "youtube", embedUrl: id ? `https://www.youtube.com/embed/${id}` : null };
  }
  if (u.includes("instagram.com")) return { tipo: "instagram", embedUrl: null };
  if (u.includes("facebook.com"))  return { tipo: "facebook",  embedUrl: null };
  if (u.includes("mercadolibre"))  return { tipo: "mercadolibre", embedUrl: null };
  if (u.includes("drive.google"))  return { tipo: "drive",     embedUrl: null };
  if (u.includes("dropbox"))       return { tipo: "dropbox",   embedUrl: null };
  return { tipo: "otro", embedUrl: null };
}

const LINK_ICONOS: Record<string, string> = {
  youtube: "▶️", instagram: "📸", facebook: "👤",
  mercadolibre: "🛍️", drive: "📂", dropbox: "📦", otro: "🔗",
};

export default function AnuncioDetalle() {
  const params  = useParams();
  const router  = useRouter();
  const [anuncio,       setAnuncio]       = useState<any>(null);
  const [usuario,       setUsuario]       = useState<any>(null);
  const [esPropio,      setEsPropio]      = useState(false);
  const [loading,       setLoading]       = useState(true);
  const [imgActiva,     setImgActiva]     = useState(0);
  const [linkExpandido, setLinkExpandido] = useState<number | null>(null);
  const [editando,      setEditando]      = useState(false);
  const [editForm,      setEditForm]      = useState({ titulo: "", descripcion: "", precio: "", moneda: "ARS" });
  const [guardando,     setGuardando]     = useState(false);

  useEffect(() => {
    cargar();
  }, [params.id]);

  const cargar = async () => {
    const { data, error } = await supabase.from("anuncios").select("*").eq("id", params.id).single();
    if (error || !data) { setLoading(false); return; }
    setAnuncio(data);
    setEditForm({ titulo: data.titulo || "", descripcion: data.descripcion || "", precio: data.precio?.toString() || "", moneda: data.moneda || "ARS" });

    if (data.subrubro_id) {
      const { data: sub } = await supabase.from("subrubros").select("nombre, rubros(nombre)").eq("id", data.subrubro_id).single();
      if (sub) setAnuncio((prev: any) => ({ ...prev, subrubro_nombre: sub.nombre, rubro_nombre: (sub.rubros as any)?.nombre || "" }));
    }
    if (data.usuario_id) {
      const { data: u } = await supabase.from("usuarios").select("nombre_usuario, whatsapp, codigo, plan").eq("id", data.usuario_id).single();
      if (u) setUsuario(u);
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user.id === data.usuario_id) setEsPropio(true);
    }
    await supabase.from("anuncios").update({ vistas: (data.vistas || 0) + 1 }).eq("id", params.id);
    setLoading(false);
  };

  const guardarEdicion = async () => {
    setGuardando(true);
    await supabase.from("anuncios").update({
      titulo: editForm.titulo,
      descripcion: editForm.descripcion,
      precio: editForm.precio ? parseFloat(editForm.precio) : null,
      moneda: editForm.moneda,
    }).eq("id", anuncio.id);
    setAnuncio((prev: any) => ({ ...prev, ...editForm, precio: parseFloat(editForm.precio) }));
    setEditando(false);
    setGuardando(false);
  };

  const fmt = (precio: number, moneda: string) =>
    !precio ? "Consultar" : `${moneda === "USD" ? "U$D" : "$"} ${precio.toLocaleString("es-AR")}`;

  const formatFecha = (f: string) =>
    new Date(f).toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" });

  if (loading) return (
    <main style={{ paddingTop:"95px", paddingBottom:"130px", background:"#f4f4f2", minHeight:"100vh", fontFamily:"'Nunito',sans-serif" }}>
      <Header /><div style={{ textAlign:"center", padding:"60px", color:"#9a9a9a", fontWeight:700 }}>Cargando...</div><BottomNav />
    </main>
  );

  if (!anuncio) return (
    <main style={{ paddingTop:"95px", paddingBottom:"130px", background:"#f4f4f2", minHeight:"100vh", fontFamily:"'Nunito',sans-serif" }}>
      <Header />
      <div style={{ textAlign:"center", padding:"60px 16px" }}>
        <div style={{ fontSize:"48px", marginBottom:"16px" }}>😕</div>
        <div style={{ fontSize:"18px", fontWeight:800, color:"#1a2a3a" }}>Anuncio no encontrado</div>
        <button onClick={() => router.push("/")} style={{ marginTop:"20px", background:"#d4a017", border:"none", borderRadius:"12px", padding:"12px 24px", fontWeight:800, cursor:"pointer", fontFamily:"'Nunito',sans-serif" }}>Volver al inicio</button>
      </div>
      <BottomNav />
    </main>
  );

  const fuente   = FUENTES[anuncio.fuente] || FUENTES.nexonet;
  const imagenes: string[] = anuncio.imagenes || [];
  const links:    string[] = (anuncio.links || []).filter((l: string) => l?.trim());
  const badges = [
    anuncio.envio_gratis          && { label:"Envío gratis",     color:"#00a884", texto:"#fff" },
    anuncio.mas_vendido           && { label:"⭐ Más vendido",    color:"#e63946", texto:"#fff" },
    anuncio.tienda_oficial        && { label:"Tienda oficial",    color:"#1a2a3a", texto:"#d4a017" },
    anuncio.conexion_habilitada   && { label:"🔗 Conexión",       color:"#3a7bd5", texto:"#fff" },
    anuncio.presupuesto_sin_cargo && { label:"Presup. gratis",    color:"#6a0dad", texto:"#fff" },
    anuncio.descuento_cantidad    && { label:"Desc. x cantidad",  color:"#2d6a4f", texto:"#fff" },
    anuncio.descuento_porcentaje > 0 && { label:`${anuncio.descuento_porcentaje}% OFF`, color:"#e63946", texto:"#fff" },
  ].filter(Boolean) as { label:string; color:string; texto:string }[];

  return (
    <main style={{ paddingTop:"95px", paddingBottom:"130px", background:"#f4f4f2", minHeight:"100vh", fontFamily:"'Nunito',sans-serif" }}>
      <Header />

      {/* LINK EXPANDIDO */}
      {linkExpandido !== null && links[linkExpandido] && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.9)", zIndex:999, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"20px" }}>
          <div style={{ width:"100%", maxWidth:"560px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"12px" }}>
              <div style={{ fontSize:"13px", fontWeight:700, color:"#fff", wordBreak:"break-all", flex:1, marginRight:"12px" }}>{links[linkExpandido]}</div>
              <button onClick={() => setLinkExpandido(null)} style={{ background:"rgba(255,255,255,0.15)", border:"none", borderRadius:"50%", width:"36px", height:"36px", color:"#fff", fontSize:"18px", cursor:"pointer", flexShrink:0 }}>✕</button>
            </div>
            {(() => {
              const { tipo, embedUrl } = getLinkEmbed(links[linkExpandido]);
              if (embedUrl) return <iframe src={embedUrl} style={{ width:"100%", aspectRatio:"16/9", borderRadius:"14px", border:"none" }} allowFullScreen />;
              return (
                <div style={{ background:"#fff", borderRadius:"14px", padding:"30px", textAlign:"center" }}>
                  <div style={{ fontSize:"48px", marginBottom:"12px" }}>{LINK_ICONOS[tipo]}</div>
                  <div style={{ fontSize:"15px", fontWeight:800, color:"#1a2a3a", marginBottom:"16px" }}>{links[linkExpandido]}</div>
                  <a href={links[linkExpandido]} target="_blank" rel="noopener noreferrer" style={{ background:"linear-gradient(135deg,#d4a017,#f0c040)", color:"#1a2a3a", borderRadius:"10px", padding:"12px 28px", fontSize:"14px", fontWeight:800, textDecoration:"none", display:"inline-block" }}>
                    Abrir enlace →
                  </a>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* GALERÍA */}
      <div style={{ position:"relative", background:"#1a2a3a" }}>
        <div style={{ background:fuente.color, padding:"5px 16px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <span style={{ fontSize:"11px", fontWeight:900, color:fuente.texto, textTransform:"uppercase", letterSpacing:"1px" }}>{fuente.label}</span>
          {anuncio.flash && <span style={{ background:"#1a2a3a", color:"#d4a017", fontSize:"10px", fontWeight:900, padding:"2px 8px", borderRadius:"8px" }}>⚡ Flash</span>}
        </div>
        <div style={{ height:"280px", display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden" }}>
          {imagenes.length > 0
            ? <img src={imagenes[imgActiva]} alt={anuncio.titulo} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
            : <span style={{ fontSize:"80px" }}>📦</span>
          }
        </div>
        <button onClick={() => router.back()} style={{ position:"absolute", top:"44px", left:"12px", background:"rgba(0,0,0,0.5)", border:"none", borderRadius:"50%", width:"36px", height:"36px", color:"#fff", fontSize:"18px", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>←</button>
        {esPropio && (
          <button onClick={() => setEditando(true)} style={{ position:"absolute", top:"44px", right:"12px", background:"rgba(212,160,23,0.85)", border:"none", borderRadius:"20px", padding:"6px 14px", fontSize:"12px", fontWeight:800, color:"#1a2a3a", cursor:"pointer", fontFamily:"'Nunito',sans-serif" }}>✏️ Editar</button>
        )}
        {imagenes.length > 1 && (
          <div style={{ display:"flex", gap:"6px", padding:"8px 12px", overflowX:"auto", scrollbarWidth:"none" }}>
            {imagenes.map((img, i) => (
              <div key={i} onClick={() => setImgActiva(i)} style={{ width:"52px", height:"52px", flexShrink:0, borderRadius:"8px", overflow:"hidden", border:`2px solid ${imgActiva===i?"#d4a017":"transparent"}`, cursor:"pointer" }}>
                <img src={img} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ padding:"16px", display:"flex", flexDirection:"column", gap:"12px" }}>

        {/* POPUP EDITAR */}
        {editando && (
          <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", zIndex:500, display:"flex", alignItems:"flex-end", justifyContent:"center" }}>
            <div style={{ background:"#fff", borderRadius:"24px 24px 0 0", padding:"24px 20px 40px", width:"100%", maxWidth:"480px", maxHeight:"90vh", overflowY:"auto" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"20px" }}>
                <div style={{ fontSize:"16px", fontWeight:900, color:"#1a2a3a" }}>✏️ Editar anuncio</div>
                <button onClick={() => setEditando(false)} style={{ background:"#f4f4f2", border:"none", borderRadius:"50%", width:"32px", height:"32px", fontSize:"16px", cursor:"pointer" }}>✕</button>
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
                <div>
                  <label style={labelStyle}>Título *</label>
                  <input type="text" value={editForm.titulo} onChange={e => setEditForm({...editForm, titulo:e.target.value})} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Descripción</label>
                  <textarea value={editForm.descripcion} onChange={e => setEditForm({...editForm, descripcion:e.target.value})} rows={4} style={{...inputStyle, resize:"vertical"}} />
                </div>
                <div style={{ display:"flex", gap:"10px" }}>
                  <div style={{ flex:1 }}>
                    <label style={labelStyle}>Precio</label>
                    <input type="number" value={editForm.precio} onChange={e => setEditForm({...editForm, precio:e.target.value})} style={inputStyle} />
                  </div>
                  <div style={{ width:"90px" }}>
                    <label style={labelStyle}>Moneda</label>
                    <select value={editForm.moneda} onChange={e => setEditForm({...editForm, moneda:e.target.value})} style={{...inputStyle, padding:"11px 10px"}}>
                      <option value="ARS">ARS $</option>
                      <option value="USD">USD U$D</option>
                    </select>
                  </div>
                </div>
                <button onClick={guardarEdicion} disabled={guardando} style={{ background:"linear-gradient(135deg,#d4a017,#f0c040)", border:"none", borderRadius:"12px", padding:"15px", fontSize:"15px", fontWeight:800, color:"#1a2a3a", cursor:"pointer", fontFamily:"'Nunito',sans-serif" }}>
                  {guardando ? "Guardando..." : "💾 Guardar cambios"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* INFO PRINCIPAL */}
        <div style={{ background:"#fff", borderRadius:"16px", padding:"20px", boxShadow:"0 2px 10px rgba(0,0,0,0.06)" }}>
          {(anuncio.rubro_nombre || anuncio.subrubro_nombre) && (
            <div style={{ fontSize:"11px", fontWeight:700, color:"#d4a017", textTransform:"uppercase", letterSpacing:"1px", marginBottom:"6px" }}>
              {anuncio.rubro_nombre}{anuncio.subrubro_nombre ? ` → ${anuncio.subrubro_nombre}` : ""}
            </div>
          )}
          <h1 style={{ fontSize:"20px", fontWeight:900, color:"#1a2a3a", margin:"0 0 12px 0", lineHeight:1.3 }}>{anuncio.titulo}</h1>
          <div style={{ fontSize:"28px", fontWeight:900, color:"#d4a017", marginBottom:"12px" }}>{fmt(anuncio.precio, anuncio.moneda)}</div>
          {badges.length > 0 && (
            <div style={{ display:"flex", flexWrap:"wrap", gap:"6px", marginBottom:"12px" }}>
              {badges.map((b,i) => <span key={i} style={{ background:b.color, color:b.texto, fontSize:"11px", fontWeight:800, padding:"4px 10px", borderRadius:"8px" }}>{b.label}</span>)}
            </div>
          )}
          <div style={{ display:"flex", gap:"16px", fontSize:"12px", color:"#9a9a9a", fontWeight:600, flexWrap:"wrap" }}>
            {anuncio.ciudad && <span>📍 {anuncio.ciudad}{anuncio.provincia ? `, ${anuncio.provincia}` : ""}</span>}
            {anuncio.barrio && <span>🏘️ {anuncio.barrio}</span>}
            <span>👁️ {anuncio.vistas || 0} vistas</span>
            <span>🔗 {anuncio.conexiones || 0} conexiones</span>
            <span>📅 {formatFecha(anuncio.created_at)}</span>
          </div>
        </div>

        {/* DESCRIPCIÓN */}
        {anuncio.descripcion && (
          <div style={{ background:"#fff", borderRadius:"16px", padding:"20px", boxShadow:"0 2px 10px rgba(0,0,0,0.06)" }}>
            <h3 style={{ fontSize:"14px", fontWeight:900, color:"#1a2a3a", marginBottom:"10px", textTransform:"uppercase", letterSpacing:"1px" }}>Descripción</h3>
            <p style={{ fontSize:"14px", color:"#444", lineHeight:1.7, margin:0, whiteSpace:"pre-wrap" }}>{anuncio.descripcion}</p>
          </div>
        )}

        {/* LINKS MULTIMEDIA */}
        {links.length > 0 && (
          <div style={{ background:"#fff", borderRadius:"16px", padding:"20px", boxShadow:"0 2px 10px rgba(0,0,0,0.06)" }}>
            <h3 style={{ fontSize:"14px", fontWeight:900, color:"#1a2a3a", marginBottom:"14px", textTransform:"uppercase", letterSpacing:"1px" }}>🔗 Links multimedia</h3>
            <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
              {links.map((link, i) => {
                const { tipo, embedUrl } = getLinkEmbed(link);
                return (
                  <div key={i}>
                    {embedUrl ? (
                      <div style={{ borderRadius:"12px", overflow:"hidden", border:"2px solid #e8e8e6", position:"relative" }}>
                        <iframe src={embedUrl} style={{ width:"100%", aspectRatio:"16/9", border:"none", display:"block" }} allowFullScreen />
                        <button onClick={() => setLinkExpandido(i)} style={{ position:"absolute", top:"8px", right:"8px", background:"rgba(0,0,0,0.6)", border:"none", borderRadius:"8px", padding:"4px 10px", fontSize:"11px", fontWeight:700, color:"#fff", cursor:"pointer" }}>⛶ Agrandar</button>
                      </div>
                    ) : (
                      <div style={{ display:"flex", alignItems:"center", gap:"12px", background:"#f4f4f2", borderRadius:"12px", padding:"12px 14px", border:"2px solid #e8e8e6" }}>
                        <span style={{ fontSize:"24px" }}>{LINK_ICONOS[tipo]}</span>
                        <div style={{ flex:1, fontSize:"12px", color:"#555", fontWeight:600, wordBreak:"break-all", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{link}</div>
                        <button onClick={() => setLinkExpandido(i)} style={{ background:"#1a2a3a", border:"none", borderRadius:"8px", padding:"6px 14px", fontSize:"12px", fontWeight:800, color:"#d4a017", cursor:"pointer", fontFamily:"'Nunito',sans-serif", flexShrink:0 }}>Ver →</button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* VENDEDOR */}
        {usuario && (
          <div style={{ background:"#fff", borderRadius:"16px", padding:"20px", boxShadow:"0 2px 10px rgba(0,0,0,0.06)" }}>
            <h3 style={{ fontSize:"14px", fontWeight:900, color:"#1a2a3a", marginBottom:"14px", textTransform:"uppercase", letterSpacing:"1px" }}>Vendedor</h3>
            <div style={{ display:"flex", alignItems:"center", gap:"12px" }}>
              <div style={{ width:"48px", height:"48px", borderRadius:"50%", background:"linear-gradient(135deg,#d4a017,#f0c040)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"22px", flexShrink:0 }}>👤</div>
              <div>
                <div style={{ fontSize:"15px", fontWeight:800, color:"#1a2a3a" }}>{usuario.nombre_usuario}</div>
                <div style={{ fontSize:"12px", color:"#d4a017", fontWeight:700 }}>{usuario.codigo}</div>
                {usuario.plan === "nexoempresa" && <div style={{ fontSize:"11px", color:"#c0392b", fontWeight:800, marginTop:"2px" }}>🏢 Empresa verificada</div>}
              </div>
            </div>
          </div>
        )}

        {/* BOTONES ACCIÓN */}
        <div style={{ display:"flex", gap:"10px" }}>
          {usuario?.whatsapp && (
            <a href={`https://wa.me/54${usuario.whatsapp}?text=Hola! Vi tu anuncio "${anuncio.titulo}" en NexoNet`}
              target="_blank" rel="noopener noreferrer"
              style={{ flex:1, background:"#25D366", color:"#fff", borderRadius:"12px", padding:"16px", fontSize:"14px", fontWeight:800, textAlign:"center", textDecoration:"none", display:"flex", alignItems:"center", justifyContent:"center", gap:"6px" }}>
              💬 WhatsApp
            </a>
          )}
          <button style={{ flex:1, background:"linear-gradient(135deg,#d4a017,#f0c040)", color:"#1a2a3a", border:"none", borderRadius:"12px", padding:"16px", fontSize:"14px", fontWeight:800, cursor:"pointer", fontFamily:"'Nunito',sans-serif" }}>
            🔗 Conectar
          </button>
        </div>
        {esPropio && (
          <div style={{ display:"flex", gap:"10px" }}>
            <button onClick={() => router.push("/usuario")} style={{ flex:1, background:"linear-gradient(135deg,#f0c040,#d4a017)", color:"#1a2a3a", border:"none", borderRadius:"12px", padding:"14px", fontSize:"14px", fontWeight:900, cursor:"pointer", fontFamily:"'Nunito',sans-serif", boxShadow:"0 4px 0 #a07810" }}>
              👤 Mi Perfil
            </button>
            <button onClick={() => router.push("/mis-anuncios")} style={{ flex:1, background:"linear-gradient(135deg,#1a2a3a,#243b55)", color:"#d4a017", border:"none", borderRadius:"12px", padding:"14px", fontSize:"14px", fontWeight:800, cursor:"pointer", fontFamily:"'Nunito',sans-serif", boxShadow:"0 4px 0 #0a1015" }}>
              📋 Mis anuncios
            </button>
          </div>
        )}
      </div>
      <BottomNav />
    </main>
  );
}

const labelStyle: React.CSSProperties = { display:"block", fontSize:"11px", fontWeight:800, color:"#666", textTransform:"uppercase", letterSpacing:"1px", marginBottom:"6px" };
const inputStyle: React.CSSProperties = { width:"100%", border:"2px solid #e8e8e6", borderRadius:"10px", padding:"11px 14px", fontSize:"14px", fontFamily:"'Nunito',sans-serif", color:"#2c2c2e", outline:"none", boxSizing:"border-box" };
