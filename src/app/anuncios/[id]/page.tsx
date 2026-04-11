"use client";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import PopupCompra, { MetodoPago } from "@/components/PopupCompra";
import InsigniaLogro from "@/app/_components/InsigniaLogro";
import InsigniaReputacion from "@/app/_components/InsigniaReputacion";
import BotonDarInsignia from "@/app/_components/BotonDarInsignia";

const MENSAJES_PRESET = [
  "Hola, estoy interesado/a en tu anuncio. ¿Podemos hablar?",
  "Hola, vi tu publicación y me gustaría más información.",
  "Buen día, ¿el anuncio sigue disponible?",
  "Hola, ¿cuál es el precio final? Estoy listo/a para cerrar.",
];

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
  const [anuncio,        setAnuncio]        = useState<any>(null);
  const [usuario,        setUsuario]        = useState<any>(null);
  const [esPropio,       setEsPropio]       = useState(false);
  const [loading,        setLoading]        = useState(true);
  const [imgActiva,      setImgActiva]      = useState(0);
  const [linkExpandido,  setLinkExpandido]  = useState<number | null>(null);
  const [editando,       setEditando]       = useState(false);
  const [editForm,       setEditForm]       = useState({ titulo: "", descripcion: "", precio: "", moneda: "ARS" });
  const [guardando,      setGuardando]      = useState(false);
  const [popupCompra,    setPopupCompra]    = useState(false);
  const [session,        setSession]        = useState<any>(null);
  const [conectando,     setConectando]     = useState(false);
  const [misBits,        setMisBits]        = useState<any>(null);
  const [cargandoBit,    setCargandoBit]    = useState(false);

  const [popupMensaje,    setPopupMensaje]    = useState(false);
  const [buscadores,      setBuscadores]      = useState<any[]>([]);
  const [visitantes,      setVisitantes]      = useState<any[]>([]);
  const [selBuscadores,   setSelBuscadores]   = useState<Set<string>>(new Set());
  const [popupBuscadores, setPopupBuscadores] = useState(false);
  const [msgBuscadores,   setMsgBuscadores]   = useState("");
  const [enviandoMsg,     setEnviandoMsg]     = useState(false);
  const [mensajeConexion, setMensajeConexion] = useState(MENSAJES_PRESET[0]);
  const [ownerInsignia,   setOwnerInsignia]   = useState<string>("ninguna");
  const [repContadores,   setRepContadores]   = useState<Record<string,number>>({});

  useEffect(() => { cargar(); }, [params.id]);

  const volver = () => { router.back(); };
  const cargar = async () => {
    const { data, error } = await supabase.from("anuncios").select("*").eq("id", params.id).single();
    if (error || !data) { setLoading(false); return; }
    setAnuncio(data);
    setEditForm({ titulo: data.titulo || "", descripcion: data.descripcion || "", precio: data.precio?.toString() || "", moneda: data.moneda || "ARS" });

    if (data.subrubro_id) {
      const { data: sub } = await supabase.from("subrubros").select("nombre, rubros(nombre)").eq("id", data.subrubro_id).single();
      if (sub) setAnuncio((prev: any) => ({ ...prev, subrubro_nombre: sub.nombre, rubro_nombre: (sub.rubros as any)?.nombre || "" }));
    }

    const { data: { session: sess } } = await supabase.auth.getSession();
    setSession(sess);

    if (data.usuario_id) {
      const { data: u } = await supabase
        .from("usuarios")
        .select("nombre_usuario, nombre, apellido, codigo, plan, whatsapp, telefono, whatsapp_empresa, direccion, ciudad, provincia, barrio, direccion_empresa, ciudad_empresa, provincia_empresa, barrio_empresa, vis_personal, vis_empresa, insignia_logro")
        .eq("id", data.usuario_id).single();
      if (u) { setUsuario(u); setOwnerInsignia(u.insignia_logro || "ninguna"); } else { console.error("Usuario null para id:", data.usuario_id); }
      if (sess?.user.id === data.usuario_id) setEsPropio(true);

      // Fetch reputation badges for this user
      const { data: repData } = await supabase
        .from("insignias_reputacion")
        .select("tipo")
        .eq("receptor_id", data.usuario_id);
      if (repData) {
        const cont: Record<string,number> = {};
        repData.forEach((r: any) => { cont[r.tipo] = (cont[r.tipo] || 0) + 1; });
        setRepContadores(cont);
      }
    }

    // Registrar visita (1 por usuario por día) + incrementar contador
    if (sess?.user?.id) {
      const hoy = new Date().toISOString().slice(0, 10);
      const { data: yaVisito } = await supabase.from("anuncio_visitas")
        .select("id").eq("anuncio_id", params.id).eq("visitante_id", sess.user.id).eq("fecha", hoy).maybeSingle();
      if (!yaVisito) {
        await supabase.from("anuncio_visitas").insert({ anuncio_id: params.id, visitante_id: sess.user.id, fecha: hoy });
        await supabase.from("anuncios").update({ vistas: (data.vistas || 0) + 1 }).eq("id", params.id);
      }
    } else {
      await supabase.from("anuncios").update({ vistas: (data.vistas || 0) + 1 }).eq("id", params.id);
    }

    if (sess?.user?.id) {
      const { data: ub } = await supabase
        .from("usuarios")
        .select("bits, bits_promo, bits_free, bits_gastados, bits_gastados_conexion")
        .eq("id", sess.user.id).single();
      if (ub) setMisBits(ub);
    }
    // Cargar visitantes del anuncio
    if (sess?.user?.id === data.usuario_id) {
      const { data: visData } = await supabase
        .from("anuncio_visitas")
        .select("visitante_id, fecha")
        .eq("anuncio_id", params.id)
        .order("fecha", { ascending: false });
      if (visData && visData.length > 0) {
        const uids = [...new Set(visData.map((v:any) => v.visitante_id))].filter(Boolean);
        if (uids.length > 0) {
          const { data: uData } = await supabase
            .from("usuarios")
            .select("id, nombre_usuario, codigo, ciudad, provincia")
            .in("id", uids);
          if (uData) {
            const merged = uids
              .filter(uid => uid !== data.usuario_id)
              .map(uid => ({
              ...uData.find((u:any) => u.id === uid),
              ultima_visita: visData.find((v:any) => v.visitante_id === uid)?.fecha,
            })).filter((v:any) => v.nombre_usuario);
            setVisitantes(merged);
          }
        }
      }
    }

    // Cargar buscadores que encontraron este anuncio
    if (sess?.user?.id === data.usuario_id) {
      const { data: matchData } = await supabase
        .from("busqueda_matches")
        .select("usuario_id, created_at")
        .eq("anuncio_id", params.id)
        .order("created_at", { ascending: false });
      if (matchData && matchData.length > 0) {
        const uids = [...new Set(matchData.map((m:any) => m.usuario_id))];
        const { data: uData } = await supabase
          .from("usuarios")
          .select("id, nombre_usuario, codigo, ciudad, provincia")
          .in("id", uids);
        if (uData) {
          const merged = uids.map(uid => ({
            ...uData.find((u:any) => u.id === uid),
            ultima_busqueda: matchData.find((m:any) => m.usuario_id === uid)?.created_at,
          }));
          setBuscadores(merged);
        }
      }
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

  const cargarBitConexion = async (metodo: MetodoPago) => {
    if (!session?.user?.id || !anuncio?.id) return;
    setCargandoBit(true);

    const paquete = 500;
    const actualBits = anuncio.bits_conexion ?? 0;

    try {
      if (metodo === "bit_free") {
        const saldo = misBits?.bits_free ?? 0;
        if (saldo < paquete) { alert(`No tenés suficientes BIT FREE. Tenés ${saldo}, necesitás ${paquete}.`); setCargandoBit(false); return; }

        const { error: e1 } = await supabase.from("anuncios")
          .update({ bits_conexion: actualBits + paquete })
          .eq("id", anuncio.id);
        if (e1) { alert("Error al actualizar anuncio: " + e1.message); setCargandoBit(false); return; }

        const { error: e2 } = await supabase.from("usuarios")
          .update({ bits_free: saldo - paquete })
          .eq("id", session.user.id);
        if (e2) { alert("Error al descontar BIT: " + e2.message); setCargandoBit(false); return; }

        setAnuncio((prev: any) => ({ ...prev, bits_conexion: actualBits + paquete }));
        setMisBits((prev: any) => ({ ...prev, bits_free: saldo - paquete }));

      } else if (metodo === "bit_nexo") {
        const saldo = misBits?.bits ?? 0;
        if (saldo < paquete) { alert(`No tenés suficientes BIT Nexo. Tenés ${saldo}, necesitás ${paquete}.`); setCargandoBit(false); return; }

        const { error: e1 } = await supabase.from("anuncios")
          .update({ bits_conexion: actualBits + paquete })
          .eq("id", anuncio.id);
        if (e1) { alert("Error al actualizar anuncio: " + e1.message); setCargandoBit(false); return; }

        const { error: e2 } = await supabase.from("usuarios")
          .update({ bits: saldo - paquete })
          .eq("id", session.user.id);
        if (e2) { alert("Error al descontar BIT: " + e2.message); setCargandoBit(false); return; }

        setAnuncio((prev: any) => ({ ...prev, bits_conexion: actualBits + paquete }));
        setMisBits((prev: any) => ({ ...prev, bits: saldo - paquete }));

      } else {
        alert("Próximamente — pago con tarjeta/transferencia");
        setCargandoBit(false);
        return;
      }

      setPopupCompra(false);
    } catch (err: any) {
      alert("Error inesperado: " + err?.message);
    }
    setCargandoBit(false);
  };

  const ejecutarConectar = async () => {
    if (!session || !anuncio) return;
    setConectando(true);
    setPopupMensaje(false);

    const { data: anuData } = await supabase
      .from("anuncios")
      .select("id, usuario_id, conexiones, bits_conexion")
      .eq("id", anuncio.id)
      .single();
    if (!anuData) { setConectando(false); return; }

    const bitsDisponibles = anuData.bits_conexion || 0;
    if (bitsDisponibles <= 0) {
      alert("Este anuncio no tiene BIT Conexión disponibles. El vendedor debe recargar.");
      setConectando(false);
      return;
    }

    const nuevosBits = bitsDisponibles - 1;
    await supabase.from("anuncios").update({
      conexiones:    (anuData.conexiones || 0) + 1,
      bits_conexion: nuevosBits,
    }).eq("id", anuncio.id);

    await supabase.from("notificaciones").insert({
      usuario_id:  anuData.usuario_id,
      emisor_id:   session.user.id,
      anuncio_id:  anuncio.id,
      tipo:        "conexion",
      mensaje:     mensajeConexion,
      leida:       false,
    });

    await supabase.from("mensajes").insert({
      anuncio_id:  anuncio.id,
      emisor_id:   session.user.id,
      receptor_id: anuData.usuario_id,
      texto:       mensajeConexion,
    });

    setAnuncio((prev: any) => ({
      ...prev,
      conexiones:    (anuData.conexiones || 0) + 1,
      bits_conexion: nuevosBits,
    }));

    if (nuevosBits <= 5 && nuevosBits > 0) {
      await supabase.from("notificaciones").insert({
        usuario_id: anuData.usuario_id,
        tipo:       "sistema",
        mensaje:    `⚠️ Tu anuncio "${anuncio.titulo}" tiene solo ${nuevosBits} BIT Conexión restantes. ¡Recargá para seguir recibiendo conexiones!`,
        leida:      false,
      });
    }
    if (nuevosBits === 0) {
      await supabase.from("notificaciones").insert({
        usuario_id: anuData.usuario_id,
        tipo:       "sistema",
        mensaje:    `🔴 Tu anuncio "${anuncio.titulo}" se quedó sin BIT Conexión. Los buscadores ya no podrán conectarse hasta que recargues.`,
        leida:      false,
      });
    }

    setConectando(false);

    router.push(`/chat/${anuncio.id}/${anuData.usuario_id}`);
  };

  const enviarABuscadores = async () => {
    if (!msgBuscadores.trim() || selBuscadores.size === 0 || !session) return;
    const bitsNecesarios = selBuscadores.size;
    const bitsAnuncio = anuncio.bits_conexion ?? 0;
    if (bitsAnuncio < bitsNecesarios) {
      alert(`⚠️ Necesitás ${bitsNecesarios} BIT Conexión para enviar a ${bitsNecesarios} usuario${bitsNecesarios !== 1 ? "s" : ""}. Tu anuncio tiene ${bitsAnuncio} BIT.`);
      return;
    }
    setEnviandoMsg(true);
    // Descontar 1 BIT del anuncio por cada mensaje enviado (costo emisor)
    await supabase.from("anuncios").update({ bits_conexion: bitsAnuncio - bitsNecesarios }).eq("id", anuncio.id);
    setAnuncio((prev:any) => ({ ...prev, bits_conexion: bitsAnuncio - bitsNecesarios }));

    for (const uid of selBuscadores) {
      // Descontar 1 BIT al receptor
      const { data: receptor } = await supabase.from("usuarios")
        .select("bits, bits_free, bits_promo").eq("id", uid).single();
      if (receptor) {
        const totalReceptor = (receptor.bits||0) + (receptor.bits_free||0) + (receptor.bits_promo||0);
        if (totalReceptor >= 1) {
          if ((receptor.bits_promo||0) >= 1) {
            await supabase.from("usuarios").update({ bits_promo: receptor.bits_promo - 1 }).eq("id", uid);
          } else if ((receptor.bits||0) >= 1) {
            await supabase.from("usuarios").update({ bits: receptor.bits - 1 }).eq("id", uid);
          } else {
            await supabase.from("usuarios").update({ bits_free: receptor.bits_free - 1 }).eq("id", uid);
          }
        }
      }

      await supabase.from("mensajes").insert({
        anuncio_id:  anuncio.id,
        emisor_id:   session.user.id,
        receptor_id: uid,
        texto:       msgBuscadores,
      });
      await supabase.from("notificaciones").insert({
        usuario_id: uid,
        emisor_id:  session.user.id,
        tipo:       "conexion",
        mensaje:    `💬 El vendedor de "${anuncio.titulo}" te escribió`,
        anuncio_id: anuncio.id,
        leida:      false,
      });
    }
    setEnviandoMsg(false);
    setPopupBuscadores(false);
    setMsgBuscadores("");
    setSelBuscadores(new Set());
    alert(`✅ Mensaje enviado a ${selBuscadores.size} usuario${selBuscadores.size !== 1 ? "s" : ""}`);
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

  const fuente         = FUENTES[anuncio.fuente] || FUENTES.nexonet;
  const rawImagenes: string[] = anuncio.imagenes || [];
  const imagenes: string[]    = rawImagenes.length > 0 ? rawImagenes : [anuncio.avatar_url, anuncio.banner_url].filter(Boolean);
  const links: string[]       = (anuncio.links || []).filter((l: string) => l?.trim());
  const tieneUbicacion        = anuncio.lat && anuncio.lng;
  const tieneBits             = (anuncio.bits_conexion ?? 0) > 0;

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
                  <a href={links[linkExpandido]} target="_blank" rel="noopener noreferrer" style={{ background:"linear-gradient(135deg,#d4a017,#f0c040)", color:"#1a2a3a", borderRadius:"10px", padding:"12px 28px", fontSize:"14px", fontWeight:800, textDecoration:"none", display:"inline-block" }}>Abrir enlace →</a>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* POPUP ELEGIR MENSAJE */}
      {popupMensaje && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", zIndex:800, display:"flex", alignItems:"flex-end", justifyContent:"center" }}>
          <div style={{ background:"#fff", borderRadius:"24px 24px 0 0", padding:"24px 20px 40px", width:"100%", maxWidth:"480px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"16px" }}>
              <div style={{ fontSize:"16px", fontWeight:900, color:"#1a2a3a" }}>💬 Elegí tu mensaje</div>
              <button onClick={() => setPopupMensaje(false)} style={{ background:"#f4f4f2", border:"none", borderRadius:"50%", width:"32px", height:"32px", fontSize:"16px", cursor:"pointer" }}>✕</button>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:"8px", marginBottom:"16px" }}>
              {MENSAJES_PRESET.map((m, i) => (
                <div key={i} onClick={() => setMensajeConexion(m)}
                  style={{ padding:"12px 14px", borderRadius:"12px", border:`2px solid ${mensajeConexion===m?"#27ae60":"#e8e8e6"}`, background:mensajeConexion===m?"rgba(39,174,96,0.06)":"#fff", cursor:"pointer", fontSize:"13px", fontWeight:700, color:"#1a2a3a" }}>
                  {m}
                </div>
              ))}
            </div>
            <button onClick={ejecutarConectar} disabled={conectando}
              style={{ width:"100%", background:"linear-gradient(135deg,#27ae60,#1e8449)", border:"none", borderRadius:"14px", padding:"16px", fontSize:"15px", fontWeight:900, color:"#fff", cursor:"pointer", fontFamily:"'Nunito',sans-serif", opacity:conectando?0.7:1 }}>
              {conectando ? "Conectando..." : "🔗 Conectar ahora"}
            </button>
          </div>
        </div>
      )}

      {/* GALERÍA */}
      <div style={{ position:"relative", background:"#1a2a3a" }}>
        <div style={{ background:fuente.color, padding:"5px 16px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <span style={{ fontSize:"11px", fontWeight:900, color:fuente.texto, textTransform:"uppercase", letterSpacing:"1px" }}>{fuente.label}</span>
        </div>
        <div style={{ maxHeight:"420px", display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden", background:"#000" }}>
          {imagenes.length > 0
            ? <img src={imagenes[imgActiva]} alt={anuncio.titulo} style={{ width:"100%", height:"auto", maxHeight:"420px", objectFit:"contain" }} />
            : <span style={{ fontSize:"80px" }}>📦</span>}
        </div>
        <button onClick={volver} style={{ position:"absolute", top:"44px", left:"12px", background:"rgba(212,160,23,0.9)", border:"none", borderRadius:"20px", padding:"6px 14px", color:"#1a2a3a", fontSize:"13px", fontWeight:800, cursor:"pointer", display:"flex", alignItems:"center", gap:"4px", fontFamily:"'Nunito',sans-serif" }}>← Volver</button>
                <button onClick={async () => {
                  const url = `${window.location.origin}/anuncios/${anuncio.id}`;
                  if (navigator.share) {
                    await navigator.share({ title: anuncio.titulo, text: `Mirá este anuncio en NexoNet: ${anuncio.titulo}`, url });
                  } else {
                    await navigator.clipboard.writeText(url);
                    alert("✅ Link copiado");
                  }
                }} style={{ position:"absolute", top:"44px", right: esPropio ? "90px" : "12px", background:"rgba(58,123,213,0.85)", border:"none", borderRadius:"20px", padding:"6px 14px", color:"#fff", fontSize:"13px", fontWeight:800, cursor:"pointer", display:"flex", alignItems:"center", gap:"4px", fontFamily:"'Nunito',sans-serif" }}>
                  📤 Compartir
                </button>
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

        {/* VENDEDOR */}
        {usuario && (
          <div style={{ background:"#fff", borderRadius:"16px", padding:"20px", boxShadow:"0 2px 10px rgba(0,0,0,0.06)" }}>
            <h3 style={{ fontSize:"14px", fontWeight:900, color:"#1a2a3a", marginBottom:"14px", textTransform:"uppercase", letterSpacing:"1px" }}>Vendedor</h3>
            <div style={{ display:"flex", alignItems:"center", gap:"12px" }}>
              <div style={{ width:"48px", height:"48px", borderRadius:"50%", background:"linear-gradient(135deg,#d4a017,#f0c040)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"22px", flexShrink:0 }}>
                {usuario.plan === "nexoempresa" ? "🏢" : "👤"}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ display:"flex", alignItems:"center", gap:"8px", flexWrap:"wrap" }}>
                  <span onClick={() => router.push(`/perfil/${anuncio.usuario_id}`)} style={{ fontSize:"15px", fontWeight:800, color:"#1a2a3a", cursor:"pointer", textDecoration:"underline", textDecorationColor:"rgba(212,160,23,0.4)" }}>{usuario.nombre_usuario}</span>
                  <InsigniaLogro nivel={ownerInsignia} size="xs" />
                </div>
                <div style={{ fontSize:"12px", color:"#d4a017", fontWeight:700 }}>{usuario.codigo}</div>
                {usuario.plan === "nexoempresa" && <div style={{ fontSize:"11px", color:"#c0392b", fontWeight:800, marginTop:"2px" }}>🏢 Empresa verificada</div>}
                {(usuario.ciudad || usuario.provincia) && <div style={{ fontSize:"12px", color:"#9a9a9a", fontWeight:600, marginTop:"2px" }}>📍 {[usuario.ciudad, usuario.provincia].filter(Boolean).join(", ")}</div>}
                <InsigniaReputacion contadores={repContadores} size="xs" />
              </div>
            </div>
            {!esPropio && session && anuncio && (
              <div style={{ marginTop:"12px", display:"flex", justifyContent:"flex-end" }}>
                <BotonDarInsignia receptorId={anuncio.usuario_id} anuncioId={anuncio.id} sessionUserId={session.user.id} />
              </div>
            )}
          </div>
        )}

        {/* PANEL DUEÑO — configuración conexiones */}
        {esPropio && (
          <div style={{ background:"rgba(58,123,213,0.06)", border:"2px solid rgba(58,123,213,0.25)", borderRadius:"16px", padding:"16px" }}>
            <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"18px", color:"#1a2a3a", letterSpacing:"1px", marginBottom:"8px" }}>⚙️ Configuración de conexiones</div>
            <div style={{ fontSize:"12px", color:"#9a9a9a", fontWeight:600, marginBottom:"14px" }}>Límite máximo de conexiones que puede recibir este anuncio</div>
            <div style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom:"14px" }}>
              <input
                type="number"
                min={1}
                defaultValue={anuncio.limite_conexiones ?? 500}
                onBlur={async (e) => {
                  const val = parseInt(e.target.value);
                  if (!isNaN(val) && val > 0) {
                    await supabase.from("anuncios").update({ limite_conexiones: val }).eq("id", anuncio.id);
                    setAnuncio((prev: any) => ({ ...prev, limite_conexiones: val }));
                  }
                }}
                style={{ width:"100px", border:"2px solid rgba(58,123,213,0.4)", borderRadius:"10px", padding:"8px 12px", fontSize:"16px", fontWeight:800, color:"#1a2a3a", fontFamily:"'Nunito',sans-serif", outline:"none", textAlign:"center" }}
              />
              <div>
                <div style={{ fontSize:"13px", fontWeight:800, color:"#1a2a3a" }}>BIT máximos de conexión</div>
                <div style={{ fontSize:"11px", color:"#9a9a9a", fontWeight:600 }}>Recibidas: {anuncio.conexiones_recibidas ?? 0} / {anuncio.limite_conexiones ?? 500}</div>
              </div>
            </div>
            <div style={{ background:"rgba(58,123,213,0.08)", borderRadius:"10px", padding:"10px 12px", fontSize:"12px", fontWeight:600, color:"#3a7bd5", marginBottom:"14px" }}>
              💡 Cada conexión descuenta 1 BIT tuyo y 1 BIT del que se conecta. Al llegar al límite, el anuncio deja de recibir conexiones.
            </div>

            {/* VISITANTES */}
            {visitantes.length > 0 && (
              <div style={{ borderTop:"1px solid rgba(58,123,213,0.2)", paddingTop:"12px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"10px" }}>
                  <div style={{ fontSize:"12px", fontWeight:900, color:"#1a2a3a" }}>👁️ Quienes vieron este anuncio ({visitantes.length})</div>
                  {selBuscadores.size > 0 && (
                    <button onClick={() => setPopupBuscadores(true)}
                      style={{ background:"linear-gradient(135deg,#8e44ad,#9b59b6)", border:"none", borderRadius:"8px", padding:"5px 12px", fontSize:"11px", fontWeight:800, color:"#fff", cursor:"pointer", fontFamily:"'Nunito',sans-serif" }}>
                      💬 Escribirles ({selBuscadores.size})
                    </button>
                  )}
                </div>
                {visitantes.map((v:any) => (
                  <div key={v.id} style={{ display:"flex", alignItems:"center", gap:"8px", padding:"6px 0", borderBottom:"1px solid rgba(58,123,213,0.1)" }}>
                    <div style={{ width:"32px", height:"32px", borderRadius:"50%", background:"linear-gradient(135deg,#8e44ad,#9b59b6)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"14px", flexShrink:0 }}>👤</div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:"12px", fontWeight:800, color:"#1a2a3a" }}>{v.nombre_usuario}</div>
                      <div style={{ fontSize:"10px", color:"#9a9a9a", fontWeight:600 }}>{v.codigo}{v.ciudad ? ` · ${v.ciudad}` : ""}</div>
                    </div>
                    <button onClick={() => { setSelBuscadores(new Set([v.id])); setPopupBuscadores(true); }}
                      style={{ background:"rgba(142,68,173,0.1)", border:"1px solid rgba(142,68,173,0.3)", borderRadius:"8px", padding:"4px 8px", fontSize:"11px", fontWeight:800, color:"#8e44ad", cursor:"pointer", fontFamily:"'Nunito',sans-serif", flexShrink:0 }}>
                      💬
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ACCIONES VISITANTE */}
        {!esPropio && (
          <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
            {!session && (
              <button onClick={() => router.push("/login")} style={{ width:"100%", background:"linear-gradient(135deg,#d4a017,#f0c040)", border:"none", borderRadius:"14px", padding:"16px", fontSize:"15px", fontWeight:900, color:"#1a2a3a", cursor:"pointer", fontFamily:"'Nunito',sans-serif", boxShadow:"0 4px 0 #a07810" }}>
                🔐 Iniciá sesión para conectar
              </button>
            )}

            {session && (() => {
              const tipoContacto = anuncio.config?.tipo_contacto || "datos";
              const soloChatInterno = tipoContacto === "chat";
              return (
                <>
                  {!soloChatInterno && usuario && (
                    <div style={{ background:"#fff", borderRadius:"16px", padding:"16px", boxShadow:"0 2px 10px rgba(0,0,0,0.06)" }}>
                      <div style={{ fontSize:"11px", fontWeight:800, color:"#1a2a3a", textTransform:"uppercase" as const, letterSpacing:"1px", marginBottom:"12px" }}>📋 Datos de contacto</div>
                      <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
                        <DatoContacto emoji="👤" label="Vendedor" valor={usuario.nombre_usuario} color="#d4a017" />
                        {usuario.vis_personal?.nombre_apellido && (usuario.nombre || usuario.apellido) && (
                          <DatoContacto emoji="🪪" label="Nombre" valor={[usuario.nombre, usuario.apellido].filter(Boolean).join(" ")} color="#d4a017" />
                        )}
                        {usuario.telefono && (
                          <DatoContacto emoji="📞" label="Teléfono" valor={usuario.telefono} color="#3a7bd5" />
                        )}
                        {usuario.vis_personal?.provincia && usuario.provincia && (
                          <DatoContacto emoji="🗺️" label="Provincia" valor={usuario.provincia} color="#8e44ad" />
                        )}
                        {usuario.vis_personal?.ciudad && usuario.ciudad && (
                          <DatoContacto emoji="🏙️" label="Ciudad" valor={usuario.ciudad} color="#8e44ad" />
                        )}
                        {usuario.vis_personal?.barrio && usuario.barrio && (
                          <DatoContacto emoji="🏘️" label="Barrio" valor={usuario.barrio} color="#8e44ad" />
                        )}
                        {usuario.vis_personal?.direccion && usuario.direccion && (
                          <DatoContacto emoji="📍" label="Dirección" valor={usuario.direccion} color="#8e44ad" />
                        )}
                      </div>
                    </div>
                  )}
                  {soloChatInterno && (
                    <div style={{ background:"rgba(58,123,213,0.06)", border:"2px solid rgba(58,123,213,0.2)", borderRadius:"14px", padding:"14px 16px", display:"flex", gap:"12px", alignItems:"center" }}>
                      <span style={{ fontSize:"24px" }}>💬</span>
                      <div>
                        <div style={{ fontSize:"13px", fontWeight:900, color:"#1a2a3a" }}>Este vendedor prefiere el chat interno</div>
                        <div style={{ fontSize:"11px", color:"#9a9a9a", fontWeight:600, marginTop:"2px" }}>Escribile por el chat y él te responderá</div>
                      </div>
                    </div>
                  )}
                  {!soloChatInterno && (() => {
                    const limiteAlcanzado = (anuncio.conexiones_recibidas ?? 0) >= (anuncio.limite_conexiones ?? 500);
                    return (
                      <button onClick={async () => {
                        if (limiteAlcanzado) { alert("Este anuncio alcanzó su límite de conexiones."); return; }
                        if (!session?.user?.id) { router.push("/login"); return; }
                        setConectando(true);
                        // Verificar y descontar BIT del que se conecta (escalonado: free -> nexo -> promo)
                        const { data: miData } = await supabase.from("usuarios").select("bits,bits_free,bits_promo").eq("id", session.user.id).single();
                        if (!miData) { setConectando(false); return; }
                        const totalMio = (miData.bits_free||0) + (miData.bits||0) + (miData.bits_promo||0);
                        if (totalMio < 1) { alert("Necesitás al menos 1 BIT para conectarte."); setConectando(false); return; }
                        // Descontar 1 BIT escalonado al receptor (yo)
                        let nf = miData.bits_free||0, nn = miData.bits||0, np = miData.bits_promo||0;
                        if (nf >= 1) nf -= 1;
                        else if (nn >= 1) nn -= 1;
                        else np -= 1;
                        await supabase.from("usuarios").update({ bits_free: nf, bits: nn, bits_promo: np }).eq("id", session.user.id);
                        // Descontar 1 BIT escalonado al dueño del anuncio
                        const { data: duData } = await supabase.from("usuarios").select("bits,bits_free,bits_promo").eq("id", anuncio.usuario_id).single();
                        if (duData) {
                          let df = duData.bits_free||0, dn = duData.bits||0, dp = duData.bits_promo||0;
                          if (df >= 1) df -= 1;
                          else if (dn >= 1) dn -= 1;
                          else if (dp >= 1) dp -= 1;
                          await supabase.from("usuarios").update({ bits_free: df, bits: dn, bits_promo: dp }).eq("id", anuncio.usuario_id);
                        }
                        // Incrementar conexiones
                        await supabase.from("anuncios").update({
                          conexiones: (anuncio.conexiones || 0) + 1,
                          conexiones_recibidas: (anuncio.conexiones_recibidas || 0) + 1,
                        }).eq("id", anuncio.id);
                        // Notificación al dueño
                        await supabase.from("notificaciones").insert({
                          usuario_id: anuncio.usuario_id, emisor_id: session.user.id,
                          anuncio_id: anuncio.id, tipo: "conexion", mensaje: mensajeConexion, leida: false,
                        });
                        // Mensaje interno
                        await supabase.from("mensajes").insert({
                          anuncio_id: anuncio.id, emisor_id: session.user.id,
                          receptor_id: anuncio.usuario_id, texto: mensajeConexion,
                        });
                        setConectando(false);
                        router.push(`/chat/${anuncio.usuario_id}?anuncio=${anuncio.id}`);
                      }} disabled={conectando || limiteAlcanzado}
                        style={{ width:"100%", background: limiteAlcanzado ? "#e8e8e6" : "linear-gradient(135deg,#27ae60,#1e8449)", border:"none", borderRadius:"14px", padding:"16px", fontSize:"15px", fontWeight:900, color: limiteAlcanzado ? "#9a9a9a" : "#fff", cursor: limiteAlcanzado ? "not-allowed" : "pointer", fontFamily:"'Nunito',sans-serif", boxShadow: limiteAlcanzado ? "none" : "0 4px 0 #155a2e", display:"flex", alignItems:"center", justifyContent:"center", gap:"10px", opacity:conectando?0.7:1 }}>
                        <span style={{ fontSize:"20px" }}>🔗</span>
                        <span>{conectando ? "Conectando..." : limiteAlcanzado ? "Límite de conexiones alcanzado" : "Conectar — 1 BIT"}</span>
                      </button>
                    );
                  })()}
                </>
              );
            })()}

            {tieneUbicacion && (
              <button onClick={() => router.push(`/mapa?lat=${anuncio.lat}&lng=${anuncio.lng}&id=${anuncio.id}`)} style={{ width:"100%", background:"rgba(26,42,58,0.05)", border:"2px solid rgba(26,42,58,0.15)", borderRadius:"12px", padding:"13px", fontSize:"13px", fontWeight:800, color:"#1a2a3a", cursor:"pointer", fontFamily:"'Nunito',sans-serif" }}>
                🗺️ Ver en mapa
              </button>
            )}
          </div>
        )}

        {esPropio && (
          <button onClick={() => router.push("/mis-anuncios")} style={{ width:"100%", background:"linear-gradient(135deg,#1a2a3a,#243b55)", color:"#d4a017", border:"none", borderRadius:"12px", padding:"14px", fontSize:"14px", fontWeight:800, cursor:"pointer", fontFamily:"'Nunito',sans-serif", boxShadow:"0 4px 0 #0a1015" }}>
            📋 Ir a Mis Anuncios
          </button>
        )}
      </div>

      {/* POPUP COMPRA BIT CONEXIÓN */}
      {popupCompra && (
        <PopupCompra
          titulo="Cargar BIT Conexión"
          emoji="🔗"
          costo="500 BIT"
          descripcion="Recargá BIT para que tu anuncio reciba conexiones"
          bits={{ free: misBits?.bits_free || 0, nexo: misBits?.bits || 0, promo: misBits?.bits_promo || 0 }}
          onClose={() => setPopupCompra(false)}
          onPagar={cargarBitConexion}
        />
      )}

      {/* POPUP MENSAJE A BUSCADORES */}
      {popupBuscadores && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.65)", zIndex:800, display:"flex", alignItems:"flex-end", justifyContent:"center" }}>
          <div style={{ background:"#fff", borderRadius:"24px 24px 0 0", padding:"24px 20px 40px", width:"100%", maxWidth:"480px", fontFamily:"'Nunito',sans-serif" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"16px" }}>
              <div style={{ fontSize:"16px", fontWeight:900, color:"#1a2a3a" }}>💬 Escribirles a {selBuscadores.size} interesado{selBuscadores.size !== 1 ? "s" : ""}</div>
              <button onClick={() => setPopupBuscadores(false)} style={{ background:"#f4f4f2", border:"none", borderRadius:"50%", width:"32px", height:"32px", fontSize:"16px", cursor:"pointer" }}>✕</button>
            </div>
            <textarea value={msgBuscadores} onChange={e => setMsgBuscadores(e.target.value)}
              placeholder="Ej: Hola, vi que estás buscando algo similar. ¿Seguís interesado?"
              style={{ width:"100%", border:"2px solid #e8e8e6", borderRadius:"12px", padding:"12px 14px", fontSize:"14px", fontFamily:"'Nunito',sans-serif", minHeight:"100px", resize:"vertical", outline:"none", boxSizing:"border-box" as const }} />
            <button onClick={enviarABuscadores} disabled={!msgBuscadores.trim() || enviandoMsg}
              style={{ width:"100%", marginTop:"14px", background:msgBuscadores.trim() ? "linear-gradient(135deg,#16a085,#1abc9c)" : "#e8e8e6", border:"none", borderRadius:"14px", padding:"16px", fontSize:"15px", fontWeight:900, color:msgBuscadores.trim() ? "#fff" : "#bbb", cursor:msgBuscadores.trim() ? "pointer" : "default", fontFamily:"'Nunito',sans-serif", boxShadow:msgBuscadores.trim() ? "0 4px 0 #0e6b59" : "none" }}>
              {enviandoMsg ? "Enviando..." : `📨 Enviar mensaje`}
            </button>
          </div>
        </div>
      )}

      <BottomNav />
    </main>
  );
}

function DatoContacto({ emoji, label, valor, color }: { emoji:string; label:string; valor:string; color:string }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:"12px", background:`${color}08`, border:`2px solid ${color}25`, borderRadius:"12px", padding:"12px 14px" }}>
      <span style={{ fontSize:"22px" }}>{emoji}</span>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:"11px", fontWeight:700, color, textTransform:"uppercase" as const, letterSpacing:"1px" }}>{label}</div>
        <div style={{ fontSize:"14px", fontWeight:900, color:"#1a2a3a" }}>{valor}</div>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = { display:"block", fontSize:"11px", fontWeight:800, color:"#666", textTransform:"uppercase", letterSpacing:"1px", marginBottom:"6px" };
const inputStyle: React.CSSProperties = { width:"100%", border:"2px solid #e8e8e6", borderRadius:"10px", padding:"11px 14px", fontSize:"14px", fontFamily:"'Nunito',sans-serif", color:"#2c2c2e", outline:"none", boxSizing:"border-box" };
