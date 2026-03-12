"use client";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import PopupCompra, { MetodoPago } from "@/components/PopupCompra";

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
  const [popupCompra,   setPopupCompra]   = useState(false);
  const [session,       setSession]       = useState<any>(null);
  const [conectando,    setConectando]    = useState(false);
  const [popupVerDatos, setPopupVerDatos] = useState(false);
  const [popupPago,     setPopupPago]     = useState(false);
  // datosVisibles = true → ya pagó 1 BIT, puede ver datos Y conectar gratis
  const [datosVisibles, setDatosVisibles] = useState(false);
  const [misBits,       setMisBits]       = useState<any>(null);

  useEffect(() => { cargar(); }, [params.id]);

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
      const { data: u } = await supabase
        .from("usuarios")
        .select("nombre_usuario, codigo, plan, whatsapp, telefono, whatsapp_empresa, telefono_empresa, direccion, ciudad, provincia, barrio, direccion_empresa, ciudad_empresa, provincia_empresa, barrio_empresa, vis_personal, vis_empresa")
        .eq("id", data.usuario_id).single();
      if (u) setUsuario(u);
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user.id === data.usuario_id) setEsPropio(true);
    }
    await supabase.from("anuncios").update({ vistas: (data.vistas || 0) + 1 }).eq("id", params.id);

    const { data: { session } } = await supabase.auth.getSession();
    setSession(session);
    if (session?.user?.id) {
      const { data: ub } = await supabase
        .from("usuarios")
        .select("bits, bits_promo, bits_free, bits_gastados, bits_gastados_conexion")
        .eq("id", session.user.id).single();
      if (ub) setMisBits(ub);
    }
    setLoading(false);
  };

  const guardarEdicion = async () => {
    setGuardando(true);
    await supabase.from("anuncios").update({
      titulo:      editForm.titulo,
      descripcion: editForm.descripcion,
      precio:      editForm.precio ? parseFloat(editForm.precio) : null,
      moneda:      editForm.moneda,
    }).eq("id", anuncio.id);
    setAnuncio((prev: any) => ({ ...prev, ...editForm, precio: parseFloat(editForm.precio) }));
    setEditando(false);
    setGuardando(false);
  };

  // ── Conectar GRATIS (después de haber pagado Ver Datos) ──────────────────
  const ejecutarConectar = async () => {
    if (!session || !anuncio) return;
    setConectando(true);
    const { data: anuData } = await supabase
      .from("anuncios").select("id, usuario_id, conexiones").eq("id", anuncio.id).single();
    if (!anuData) { setConectando(false); return; }

    // Solo suma conexión, SIN descontar BIT (ya se descontó en Ver Datos)
    await supabase.from("anuncios").update({ conexiones: (anuData.conexiones || 0) + 1 }).eq("id", anuncio.id);
    await supabase.from("notificaciones").insert({
      usuario_id: anuData.usuario_id, emisor_id: session.user.id,
      anuncio_id: anuncio.id, tipo: "conexion",
      mensaje: "Hola, estoy interesado/a en tu anuncio. ¿Podemos hablar?",
    });
    await supabase.from("mensajes").insert({
      anuncio_id: anuncio.id, emisor_id: session.user.id,
      receptor_id: anuData.usuario_id,
      texto: "Hola, estoy interesado/a en tu anuncio. ¿Podemos hablar?",
    });
    setAnuncio((prev: any) => ({ ...prev, conexiones: (anuData.conexiones || 0) + 1 }));
    setConectando(false);
    router.push(`/chat/${anuncio.id}/${anuData.usuario_id}`);
  };

  // ── Ver datos: consume 1 BIT buscador + 1 BIT anuncio → habilita todo ────
  const ejecutarVerDatos = async () => {
    if (!session || !anuncio) return;
    const { data: ub } = await supabase
      .from("usuarios").select("bits, bits_promo, bits_free, bits_gastados_conexion")
      .eq("id", session.user.id).single();
    if (!ub) return;

    const totalBits = (ub.bits_free || 0) + (ub.bits_promo || 0) + (ub.bits || 0);
    if (totalBits <= 0) { setPopupVerDatos(false); setPopupPago(true); return; }

    // Descontar 1 BIT del buscador (FREE → Promo → Nexo)
    if ((ub.bits_free || 0) > 0) {
      await supabase.from("usuarios").update({ bits_free: (ub.bits_free || 0) - 1, bits_gastados_conexion: (ub.bits_gastados_conexion || 0) + 1 }).eq("id", session.user.id);
    } else if ((ub.bits_promo || 0) > 0) {
      await supabase.from("usuarios").update({ bits_promo: (ub.bits_promo || 0) - 1, bits_gastados_conexion: (ub.bits_gastados_conexion || 0) + 1 }).eq("id", session.user.id);
    } else {
      await supabase.from("usuarios").update({ bits: (ub.bits || 0) - 1, bits_gastados_conexion: (ub.bits_gastados_conexion || 0) + 1 }).eq("id", session.user.id);
    }

    // Descontar 1 BIT del anuncio (si tiene saldo)
    const { data: anuData } = await supabase.from("anuncios").select("bits_conexion, conexiones").eq("id", anuncio.id).single();
    if (anuData && (anuData.bits_conexion ?? 0) > 0) {
      const nuevoSaldo = (anuData.bits_conexion || 0) - 1;
      await supabase.from("anuncios").update({ bits_conexion: nuevoSaldo }).eq("id", anuncio.id);
      if (nuevoSaldo === 0) {
        await supabase.from("notificaciones").insert({
          usuario_id: anuncio.usuario_id, emisor_id: anuncio.usuario_id,
          anuncio_id: anuncio.id, tipo: "bits_agotados",
          mensaje: `⚠️ Tu anuncio "${anuncio.titulo}" agotó sus BIT Conexión.`,
        });
      }
      setAnuncio((prev: any) => ({ ...prev, bits_conexion: nuevoSaldo }));
    }

    setMisBits(ub);
    setDatosVisibles(true);
    setPopupVerDatos(false);
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
        <button onClick={() => router.push("/")} style={{ marginTop:"20px", background:"#d4a017", border:"none", borderRadius:"12px", padding:"12px 24px", fontWeight:800, cursor:"pointer", fontFamily:"'Nunito',sans-serif" }}>Volver</button>
      </div>
      <BottomNav />
    </main>
  );

  const fuente    = FUENTES[anuncio.fuente] || FUENTES.nexonet;
  const imagenes: string[] = anuncio.imagenes || [];
  const links:    string[] = (anuncio.links || []).filter((l: string) => l?.trim());
  const tieneUbicacion = anuncio.lat && anuncio.lng;
  const tieneBits      = (anuncio.bits_conexion ?? 0) > 0;
  const saldoBuscador  = (misBits?.bits_free || 0) + (misBits?.bits_promo || 0) + (misBits?.bits || 0);

  const badges = [
    anuncio.envio_gratis          && { label:"Envío gratis",    color:"#00a884", texto:"#fff" },
    anuncio.mas_vendido           && { label:"⭐ Más vendido",   color:"#e63946", texto:"#fff" },
    anuncio.tienda_oficial        && { label:"Tienda oficial",   color:"#1a2a3a", texto:"#d4a017" },
    anuncio.permuto               && { label:"🔄 Permuta",       color:"#8e44ad", texto:"#fff" },
    anuncio.presupuesto_sin_cargo && { label:"Presup. gratis",   color:"#6a0dad", texto:"#fff" },
    anuncio.descuento_porcentaje > 0 && { label:`${anuncio.descuento_porcentaje}% OFF`, color:"#e63946", texto:"#fff" },
  ].filter(Boolean) as { label:string; color:string; texto:string }[];

  return (
    <main style={{ paddingTop:"95px", paddingBottom:"130px", background:"#f4f4f2", minHeight:"100vh", fontFamily:"'Nunito',sans-serif" }}>
      <Header />

      {/* ── LINK EXPANDIDO ─────────────────────────────────────────────────── */}
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
                  <a href={links[linkExpandido]} target="_blank" rel="noopener noreferrer" style={{ background:"linear-gradient(135deg,#d4a017,#f0c040)", color:"#1a2a3a", borderRadius:"10px", padding:"12px 28px", fontSize:"14px", fontWeight:800, textDecoration:"none", display:"inline-block" }}>Abrir enlace →</a>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ── POPUP CONFIRMAR VER DATOS (1 BIT) ──────────────────────────────── */}
      {popupVerDatos && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.65)", zIndex:400, display:"flex", alignItems:"flex-end" }}
             onClick={() => setPopupVerDatos(false)}>
          <div style={{ background:"#fff", borderRadius:"24px 24px 0 0", padding:"28px 20px 40px", width:"100%", fontFamily:"'Nunito',sans-serif" }}
               onClick={e => e.stopPropagation()}>
            <div style={{ textAlign:"center", marginBottom:"24px" }}>
              <div style={{ fontSize:"48px", marginBottom:"10px" }}>🔍</div>
              <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"24px", color:"#1a2a3a", letterSpacing:"1px" }}>Ver datos de contacto</div>
              <div style={{ fontSize:"13px", color:"#9a9a9a", fontWeight:600, marginTop:"8px", lineHeight:1.7 }}>
                Accedés a WhatsApp, teléfono y dirección del vendedor.<br/>
                Esto consume <strong style={{ color:"#d4a017" }}>1 BIT</strong> de tu cuenta.<br/>
                <span style={{ color:"#27ae60", fontWeight:800 }}>✅ Después podrás Conectar gratis.</span>
              </div>
            </div>
            <div style={{ background:"rgba(212,160,23,0.08)", borderRadius:"14px", padding:"14px 16px", marginBottom:"16px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <div style={{ fontSize:"12px", fontWeight:700, color:"#666" }}>Tu saldo disponible</div>
              <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"22px", color:"#d4a017" }}>{saldoBuscador.toLocaleString()} BIT</div>
            </div>
            <button onClick={ejecutarVerDatos}
              style={{ width:"100%", background:"linear-gradient(135deg,#d4a017,#f0c040)", border:"none", borderRadius:"14px", padding:"16px", fontSize:"15px", fontWeight:900, color:"#1a2a3a", cursor:"pointer", fontFamily:"'Nunito',sans-serif", boxShadow:"0 4px 0 #a07810", marginBottom:"10px" }}>
              ✅ Confirmar — gastar 1 BIT
            </button>
            <button onClick={() => setPopupVerDatos(false)}
              style={{ width:"100%", background:"none", border:"2px solid #e8e8e6", borderRadius:"14px", padding:"14px", fontSize:"14px", fontWeight:700, color:"#9a9a9a", cursor:"pointer", fontFamily:"'Nunito',sans-serif" }}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* ── GALERÍA ────────────────────────────────────────────────────────── */}
      <div style={{ position:"relative", background:"#1a2a3a" }}>
        <div style={{ background:fuente.color, padding:"5px 16px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <span style={{ fontSize:"11px", fontWeight:900, color:fuente.texto, textTransform:"uppercase", letterSpacing:"1px" }}>{fuente.label}</span>
          {anuncio.flash && <span style={{ background:"#1a2a3a", color:"#d4a017", fontSize:"10px", fontWeight:900, padding:"2px 8px", borderRadius:"8px" }}>⚡ Flash</span>}
        </div>
        <div style={{ height:"280px", display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden" }}>
          {imagenes.length > 0
            ? <img src={imagenes[imgActiva]} alt={anuncio.titulo} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
            : <span style={{ fontSize:"80px" }}>📦</span>}
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

        {/* ── POPUP EDITAR ─────────────────────────────────────────────────── */}
        {editando && (
          <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", zIndex:500, display:"flex", alignItems:"flex-end", justifyContent:"center" }}>
            <div style={{ background:"#fff", borderRadius:"24px 24px 0 0", padding:"24px 20px 40px", width:"100%", maxWidth:"480px", maxHeight:"90vh", overflowY:"auto" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"20px" }}>
                <div style={{ fontSize:"16px", fontWeight:900, color:"#1a2a3a" }}>✏️ Editar anuncio</div>
                <button onClick={() => setEditando(false)} style={{ background:"#f4f4f2", border:"none", borderRadius:"50%", width:"32px", height:"32px", fontSize:"16px", cursor:"pointer" }}>✕</button>
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
                <div><label style={labelStyle}>Título *</label><input type="text" value={editForm.titulo} onChange={e => setEditForm({...editForm, titulo:e.target.value})} style={inputStyle} /></div>
                <div><label style={labelStyle}>Descripción</label><textarea value={editForm.descripcion} onChange={e => setEditForm({...editForm, descripcion:e.target.value})} rows={4} style={{...inputStyle, resize:"vertical"}} /></div>
                <div style={{ display:"flex", gap:"10px" }}>
                  <div style={{ flex:1 }}><label style={labelStyle}>Precio</label><input type="number" value={editForm.precio} onChange={e => setEditForm({...editForm, precio:e.target.value})} style={inputStyle} /></div>
                  <div style={{ width:"90px" }}><label style={labelStyle}>Moneda</label><select value={editForm.moneda} onChange={e => setEditForm({...editForm, moneda:e.target.value})} style={{...inputStyle, padding:"11px 10px"}}><option value="ARS">ARS $</option><option value="USD">USD U$D</option></select></div>
                </div>
                <button onClick={guardarEdicion} disabled={guardando} style={{ background:"linear-gradient(135deg,#d4a017,#f0c040)", border:"none", borderRadius:"12px", padding:"15px", fontSize:"15px", fontWeight:800, color:"#1a2a3a", cursor:"pointer", fontFamily:"'Nunito',sans-serif" }}>
                  {guardando ? "Guardando..." : "💾 Guardar cambios"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── INFO PRINCIPAL ─────────────────────────────────────────────────── */}
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

        {/* ── DESCRIPCIÓN ──────────────────────────────────────────────────── */}
        {anuncio.descripcion && (
          <div style={{ background:"#fff", borderRadius:"16px", padding:"20px", boxShadow:"0 2px 10px rgba(0,0,0,0.06)" }}>
            <h3 style={{ fontSize:"14px", fontWeight:900, color:"#1a2a3a", marginBottom:"10px", textTransform:"uppercase", letterSpacing:"1px" }}>Descripción</h3>
            <p style={{ fontSize:"14px", color:"#444", lineHeight:1.7, margin:0, whiteSpace:"pre-wrap" }}>{anuncio.descripcion}</p>
          </div>
        )}

        {/* ── LINKS MULTIMEDIA ─────────────────────────────────────────────── */}
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
                        <div style={{ flex:1, fontSize:"12px", color:"#555", fontWeight:600, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{link}</div>
                        <button onClick={() => setLinkExpandido(i)} style={{ background:"#1a2a3a", border:"none", borderRadius:"8px", padding:"6px 14px", fontSize:"12px", fontWeight:800, color:"#d4a017", cursor:"pointer", fontFamily:"'Nunito',sans-serif", flexShrink:0 }}>Ver →</button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── VENDEDOR ─────────────────────────────────────────────────────── */}
        {usuario && (
          <div style={{ background:"#fff", borderRadius:"16px", padding:"20px", boxShadow:"0 2px 10px rgba(0,0,0,0.06)" }}>
            <h3 style={{ fontSize:"14px", fontWeight:900, color:"#1a2a3a", marginBottom:"14px", textTransform:"uppercase", letterSpacing:"1px" }}>Vendedor</h3>
            <div style={{ display:"flex", alignItems:"center", gap:"12px" }}>
              <div style={{ width:"48px", height:"48px", borderRadius:"50%", background:"linear-gradient(135deg,#d4a017,#f0c040)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"22px", flexShrink:0 }}>
                {usuario.plan === "nexoempresa" ? "🏢" : "👤"}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:"15px", fontWeight:800, color:"#1a2a3a" }}>{usuario.nombre_usuario}</div>
                <div style={{ fontSize:"12px", color:"#d4a017", fontWeight:700 }}>{usuario.codigo}</div>
                {usuario.plan === "nexoempresa" && <div style={{ fontSize:"11px", color:"#c0392b", fontWeight:800, marginTop:"2px" }}>🏢 Empresa verificada</div>}
              </div>
            </div>
          </div>
        )}

        {/* ── PANEL DUEÑO — BIT Conexión ───────────────────────────────────── */}
        {esPropio && (
          <div style={{ background:"rgba(58,123,213,0.06)", border:"2px solid rgba(58,123,213,0.25)", borderRadius:"16px", padding:"16px" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"10px" }}>
              <div>
                <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"18px", color:"#1a2a3a", letterSpacing:"1px" }}>🔗 BIT Conexión de este anuncio</div>
                <div style={{ fontSize:"11px", color:"#9a9a9a", fontWeight:600, marginTop:"2px" }}>Cada "Ver datos" consume 1 BIT</div>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"32px", color: tieneBits ? "#3a7bd5" : "#e74c3c", letterSpacing:"1px" }}>{anuncio.bits_conexion ?? 0}</div>
                <div style={{ fontSize:"10px", color:"#9a9a9a", fontWeight:700 }}>disponibles</div>
              </div>
            </div>
            {!tieneBits && (
              <div style={{ background:"rgba(231,76,60,0.08)", borderRadius:"10px", padding:"10px 12px", fontSize:"12px", fontWeight:700, color:"#e74c3c", marginBottom:"10px" }}>
                ⚠️ Sin BIT — los buscadores no pueden ver tus datos de contacto
              </div>
            )}
            <button onClick={() => setPopupCompra(true)}
              style={{ width:"100%", background:"linear-gradient(135deg,#3a7bd5,#2962b0)", border:"none", borderRadius:"12px", padding:"13px", fontSize:"14px", fontWeight:900, color:"#fff", cursor:"pointer", fontFamily:"'Nunito',sans-serif" }}>
              ⚡ Cargar BIT Conexión
            </button>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* BLOQUE ACCIONES — solo para visitantes (no dueño)                 */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {!esPropio && (
          <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>

            {/* ── No logueado ─────────────────────────────────────────────── */}
            {!session && (
              <>
                <button onClick={() => router.push("/login")}
                  style={{ width:"100%", background:"linear-gradient(135deg,#d4a017,#f0c040)", border:"none", borderRadius:"14px", padding:"16px", fontSize:"15px", fontWeight:900, color:"#1a2a3a", cursor:"pointer", fontFamily:"'Nunito',sans-serif", boxShadow:"0 4px 0 #a07810" }}>
                  🔐 Iniciá sesión para ver datos y conectar
                </button>
                <button onClick={() => router.push("/login")}
                  style={{ width:"100%", background:"linear-gradient(135deg,#1a2a3a,#243b55)", border:"none", borderRadius:"14px", padding:"14px", fontSize:"14px", fontWeight:800, color:"#d4a017", cursor:"pointer", fontFamily:"'Nunito',sans-serif" }}>
                  💬 Chat interno — iniciá sesión
                </button>
              </>
            )}

            {/* ── Logueado, aún no pagó Ver Datos ────────────────────────── */}
            {session && !datosVisibles && (
              <>
                {/* Card datos bloqueados */}
                <div style={{ background:"#fff", borderRadius:"16px", padding:"16px", boxShadow:"0 2px 10px rgba(0,0,0,0.06)" }}>
                  <div style={{ fontSize:"11px", fontWeight:800, color:"#9a9a9a", textTransform:"uppercase", letterSpacing:"1px", marginBottom:"12px" }}>📋 Datos de contacto</div>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", background:"rgba(212,160,23,0.06)", borderRadius:"12px", padding:"12px 14px", marginBottom:"12px", border:"1px solid rgba(212,160,23,0.2)" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
                      <span style={{ fontSize:"28px" }}>🔒</span>
                      <div>
                        <div style={{ fontSize:"13px", fontWeight:900, color:"#1a2a3a" }}>Datos ocultos</div>
                        <div style={{ fontSize:"11px", color:"#9a9a9a", fontWeight:600 }}>WhatsApp · teléfono · dirección</div>
                      </div>
                    </div>
                    <div style={{ textAlign:"right" }}>
                      <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"22px", color:"#d4a017" }}>1 BIT</div>
                      <div style={{ fontSize:"9px", color:"#9a9a9a", fontWeight:700 }}>≈ $1</div>
                    </div>
                  </div>
                  <button onClick={() => setPopupVerDatos(true)}
                    style={{ width:"100%", background:"linear-gradient(135deg,#d4a017,#f0c040)", border:"none", borderRadius:"12px", padding:"15px", fontSize:"15px", fontWeight:900, color:"#1a2a3a", cursor:"pointer", fontFamily:"'Nunito',sans-serif", boxShadow:"0 4px 0 #a07810" }}>
                    👁️ Ver datos de contacto — 1 BIT
                  </button>
                  <div style={{ fontSize:"11px", color:"#27ae60", fontWeight:700, textAlign:"center", marginTop:"8px" }}>
                    ✅ Después podrás Conectar gratis
                  </div>
                </div>

                {/* Chat siempre gratis */}
                <button onClick={() => router.push(`/chat/${anuncio.id}/${anuncio.usuario_id}`)}
                  style={{ width:"100%", background:"linear-gradient(135deg,#1a2a3a,#243b55)", border:"none", borderRadius:"14px", padding:"15px", fontSize:"15px", fontWeight:900, color:"#d4a017", cursor:"pointer", fontFamily:"'Nunito',sans-serif", boxShadow:"0 4px 0 #0a1015", display:"flex", alignItems:"center", justifyContent:"center", gap:"10px" }}>
                  <span style={{ fontSize:"20px" }}>💬</span>
                  <span>Chat interno — gratis</span>
                </button>
              </>
            )}

            {/* ── Logueado y ya pagó: datos + Conectar gratis + Chat ─────── */}
            {session && datosVisibles && (
              <>
                {/* Datos visibles */}
                <div style={{ background:"#fff", borderRadius:"16px", padding:"16px", boxShadow:"0 2px 10px rgba(0,0,0,0.06)" }}>
                  <div style={{ fontSize:"11px", fontWeight:800, color:"#27ae60", textTransform:"uppercase", letterSpacing:"1px", marginBottom:"12px" }}>
                    ✅ Datos de contacto desbloqueados
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
                    {usuario?.vis_personal?.whatsapp !== false && usuario?.whatsapp && (
                      <a href={`https://wa.me/54${usuario.whatsapp}`} target="_blank" rel="noopener noreferrer"
                        style={{ display:"flex", alignItems:"center", gap:"12px", background:"rgba(39,174,96,0.08)", border:"2px solid rgba(39,174,96,0.25)", borderRadius:"12px", padding:"12px 14px", textDecoration:"none" }}>
                        <span style={{ fontSize:"24px" }}>💬</span>
                        <div><div style={{ fontSize:"11px", fontWeight:700, color:"#27ae60", textTransform:"uppercase" }}>WhatsApp</div><div style={{ fontSize:"14px", fontWeight:900, color:"#1a2a3a" }}>{usuario.whatsapp}</div></div>
                        <span style={{ marginLeft:"auto", fontSize:"18px", color:"#27ae60" }}>→</span>
                      </a>
                    )}
                    {usuario?.vis_empresa?.telefono !== false && usuario?.telefono && (
                      <a href={`tel:${usuario.telefono}`}
                        style={{ display:"flex", alignItems:"center", gap:"12px", background:"rgba(58,123,213,0.08)", border:"2px solid rgba(58,123,213,0.25)", borderRadius:"12px", padding:"12px 14px", textDecoration:"none" }}>
                        <span style={{ fontSize:"24px" }}>📞</span>
                        <div><div style={{ fontSize:"11px", fontWeight:700, color:"#3a7bd5", textTransform:"uppercase" }}>Teléfono</div><div style={{ fontSize:"14px", fontWeight:900, color:"#1a2a3a" }}>{usuario.telefono}</div></div>
                        <span style={{ marginLeft:"auto", fontSize:"18px", color:"#3a7bd5" }}>→</span>
                      </a>
                    )}
                    {usuario?.vis_empresa?.whatsapp_empresa !== false && usuario?.whatsapp_empresa && (
                      <a href={`https://wa.me/54${usuario.whatsapp_empresa}`} target="_blank" rel="noopener noreferrer"
                        style={{ display:"flex", alignItems:"center", gap:"12px", background:"rgba(39,174,96,0.08)", border:"2px solid rgba(39,174,96,0.25)", borderRadius:"12px", padding:"12px 14px", textDecoration:"none" }}>
                        <span style={{ fontSize:"24px" }}>🏢</span>
                        <div><div style={{ fontSize:"11px", fontWeight:700, color:"#27ae60", textTransform:"uppercase" }}>WhatsApp Empresa</div><div style={{ fontSize:"14px", fontWeight:900, color:"#1a2a3a" }}>{usuario.whatsapp_empresa}</div></div>
                        <span style={{ marginLeft:"auto", fontSize:"18px", color:"#27ae60" }}>→</span>
                      </a>
                    )}
                    {usuario?.vis_personal?.direccion !== false && usuario?.direccion && (
                      <div style={{ display:"flex", alignItems:"center", gap:"12px", background:"rgba(212,160,23,0.08)", border:"2px solid rgba(212,160,23,0.25)", borderRadius:"12px", padding:"12px 14px" }}>
                        <span style={{ fontSize:"24px" }}>📍</span>
                        <div><div style={{ fontSize:"11px", fontWeight:700, color:"#d4a017", textTransform:"uppercase" }}>Dirección</div><div style={{ fontSize:"13px", fontWeight:700, color:"#1a2a3a" }}>{[usuario.direccion, usuario.barrio, usuario.ciudad, usuario.provincia].filter(Boolean).join(", ")}</div></div>
                      </div>
                    )}
                    {!usuario?.whatsapp && !usuario?.telefono && !usuario?.whatsapp_empresa && !usuario?.direccion && (
                      <div style={{ textAlign:"center", padding:"16px", color:"#9a9a9a", fontSize:"13px", fontWeight:600 }}>El vendedor no cargó datos de contacto visibles aún.</div>
                    )}
                  </div>
                </div>

                {/* Conectar GRATIS */}
                <button onClick={ejecutarConectar} disabled={conectando}
                  style={{ width:"100%", background:"linear-gradient(135deg,#27ae60,#1e8449)", border:"none", borderRadius:"14px", padding:"16px", fontSize:"15px", fontWeight:900, color:"#fff", cursor:"pointer", fontFamily:"'Nunito',sans-serif", boxShadow:"0 4px 0 #155a2e", display:"flex", alignItems:"center", justifyContent:"center", gap:"10px", opacity:conectando?0.7:1 }}>
                  <span style={{ fontSize:"20px" }}>🔗</span>
                  <span>{conectando ? "Conectando..." : "Conectar — gratis"}</span>
                </button>

                {/* Chat siempre gratis */}
                <button onClick={() => router.push(`/chat/${anuncio.id}/${anuncio.usuario_id}`)}
                  style={{ width:"100%", background:"linear-gradient(135deg,#1a2a3a,#243b55)", border:"none", borderRadius:"14px", padding:"14px", fontSize:"14px", fontWeight:800, color:"#d4a017", cursor:"pointer", fontFamily:"'Nunito',sans-serif", boxShadow:"0 4px 0 #0a1015", display:"flex", alignItems:"center", justifyContent:"center", gap:"10px" }}>
                  <span style={{ fontSize:"18px" }}>💬</span>
                  <span>Chat interno — gratis</span>
                </button>
              </>
            )}

            {/* Ver en mapa */}
            {tieneUbicacion && (
              <button onClick={() => router.push(`/mapa?lat=${anuncio.lat}&lng=${anuncio.lng}&id=${anuncio.id}`)}
                style={{ width:"100%", background:"rgba(26,42,58,0.05)", border:"2px solid rgba(26,42,58,0.15)", borderRadius:"12px", padding:"13px", fontSize:"13px", fontWeight:800, color:"#1a2a3a", cursor:"pointer", fontFamily:"'Nunito',sans-serif" }}>
                🗺️ Ver en mapa
              </button>
            )}
          </div>
        )}

        {/* ── BOTÓN DUEÑO ──────────────────────────────────────────────────── */}
        {esPropio && (
          <button onClick={() => router.push("/mis-anuncios")}
            style={{ width:"100%", background:"linear-gradient(135deg,#1a2a3a,#243b55)", color:"#d4a017", border:"none", borderRadius:"12px", padding:"14px", fontSize:"14px", fontWeight:800, cursor:"pointer", fontFamily:"'Nunito',sans-serif", boxShadow:"0 4px 0 #0a1015" }}>
            📋 Ir a Mis Anuncios
          </button>
        )}
      </div>

      {/* POPUP dueño carga BIT */}
      {popupPago && (
        <PopupCompra
          titulo="Ver datos de contacto"
          emoji="🔍"
          costo="1 BIT"
          descripcion="Accedé a WhatsApp, teléfono y dirección del vendedor"
          bits={{ free: misBits?.bits_free || 0, nexo: misBits?.bits || 0, promo: misBits?.bits_promo || 0 }}
          onClose={() => setPopupPago(false)}
          onPagar={async (metodo) => {
            setPopupPago(false);
            if (metodo === "bit_free" || metodo === "bit_nexo") {
              await ejecutarVerDatos();
            } else {
              alert("Próximamente — método de pago externo");
            }
          }}
        />
      )}

      {popupCompra && (
        <PopupCompra
          titulo="Cargar BIT Conexión"
          emoji="🔗"
          costo="500 BIT / $500"
          descripcion="Recargá BIT para que tu anuncio reciba conexiones"
          bits={{ free: misBits?.bits_free || 0, nexo: misBits?.bits || 0, promo: misBits?.bits_promo || 0 }}
          onClose={() => setPopupCompra(false)}
          onPagar={async (metodo) => {
            setPopupCompra(false);
            if (metodo === "bit_free" || metodo === "bit_nexo") {
              router.push("/mis-anuncios");
            } else {
              alert("Próximamente — método de pago externo");
            }
          }}
        />
      )}

      <BottomNav />
    </main>
  );
}

const labelStyle: React.CSSProperties = { display:"block", fontSize:"11px", fontWeight:800, color:"#666", textTransform:"uppercase", letterSpacing:"1px", marginBottom:"6px" };
const inputStyle: React.CSSProperties = { width:"100%", border:"2px solid #e8e8e6", borderRadius:"10px", padding:"11px 14px", fontSize:"14px", fontFamily:"'Nunito',sans-serif", color:"#2c2c2e", outline:"none", boxSizing:"border-box" };
