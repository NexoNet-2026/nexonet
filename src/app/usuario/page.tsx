"use client";
import React from "react";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import PopupCompra, { MetodoPago } from "@/components/PopupCompra";
import InsigniaLogro from "@/app/_components/InsigniaLogro";
import InsigniaReputacion from "@/app/_components/InsigniaReputacion";

type Seccion = "cuenta" | "chat" | "datos" | "estadisticas" | "promotor" | "grupos" | "busquedas" | "anuncios" | "empresa" | "servicios" | "trabajo";

const DIAS_SEMANA = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const FERIADOS_ARG: Record<string, string> = {
  "01/01": "Año Nuevo",          "24/03": "Día de la Memoria",
  "02/04": "Día de Malvinas",    "01/05": "Día del Trabajador",
  "25/05": "Revolución de Mayo", "17/06": "Paso a la Inmortalidad de Güemes",
  "09/07": "Independencia",      "17/08": "San Martín",
  "12/10": "Diversidad Cultural","20/11": "Soberanía Nacional",
  "08/12": "Inmaculada",         "25/12": "Navidad",
};

const INSIGNIAS = [
  { min: 0,     max: 99,       nombre: "Nuevo",    emoji: "🌱", color: "#6a8aaa" },
  { min: 100,   max: 499,      nombre: "Bronce",   emoji: "🥉", color: "#cd7f32" },
  { min: 500,   max: 999,      nombre: "Plata",    emoji: "🥈", color: "#a0a0a0" },
  { min: 1000,  max: 4999,     nombre: "Oro",      emoji: "🥇", color: "#d4a017" },
  { min: 5000,  max: 9999,     nombre: "Platino",  emoji: "💎", color: "#8e44ad" },
  { min: 10000, max: Infinity, nombre: "Diamante", emoji: "👑", color: "#e74c3c" },
];

type Horario = { desde: string; hasta: string; activo: boolean };
type Vis = Record<string, boolean>;

export default function Usuario() {
  const router = useRouter();
  const [seccion, setSeccion] = useState<Seccion>("cuenta");
  const [perfil, setPerfil]   = useState<any>(null);
  const [guardando, setGuardando] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [subiendoAvatar, setSubiendoAvatar] = useState(false);
  const [totalAnuncios, setTotalAnuncios] = useState(0);
  const [anunciosActivos, setAnunciosActivos] = useState(0);
  const [gruposCreados, setGruposCreados] = useState(0);
  const [popupEmpresa, setPopupEmpresa] = useState(false);
  const [popupBits, setPopupBits] = useState(false);
  const [busquedas, setBusquedas] = useState<any[]>([]);
  const [formBusq, setFormBusq]   = useState<any>(null);
  const [subrubros, setSubrubros] = useState<any[]>([]);
  const [bitsBusq,  setBitsBusq]  = useState(0);
  const [chats,         setChats]         = useState<any[]>([]);
  const [misGruposData, setMisGruposData] = useState<any[]>([]);
  const [misNexos,      setMisNexos]      = useState<any[]>([]);
  const [noLeidos,      setNoLeidos]      = useState(0);
  const [promoDescargas, setPromoDescargas] = useState<any[]>([]);

  // Contactar NexoNet
  const [popupContacto,  setPopupContacto]  = useState(false);
  const [contactoTipo,   setContactoTipo]   = useState<string|null>(null);
  const [contactoTexto,  setContactoTexto]  = useState("");
  const [enviandoContacto, setEnviandoContacto] = useState(false);

  // Darme de baja
  const [popupBaja,   setPopupBaja]   = useState(false);
  const [notaBaja,    setNotaBaja]    = useState("");
  const [confirmBaja, setConfirmBaja] = useState(false);

  // Insignias de reputación
  const [repContadores, setRepContadores] = useState<Record<string,number>>({});

  const [personal, setPersonal] = useState({
    nombre_usuario: "", nombre: "", apellido: "",
    whatsapp: "", provincia: "", ciudad: "", barrio: "", direccion: "",
    lat: "", lng: "",
  });
  const [visP, setVisP] = useState<Vis>({
    nombre_usuario: true, nombre_apellido: true, whatsapp: false,
    provincia: true, ciudad: true, barrio: false, direccion: false,
  });
  const [emp, setEmp] = useState({
    nombre_empresa: "", telefono: "", whatsapp_empresa: "",
    provincia_empresa: "", ciudad_empresa: "", barrio_empresa: "",
    direccion_empresa: "", lat_empresa: "", lng_empresa: "",
  });
  const [visE, setVisE] = useState<Vis>({
    nombre_empresa: true, telefono: false, whatsapp_empresa: false,
    provincia_empresa: true, ciudad_empresa: true,
    barrio_empresa: false, direccion_empresa: false,
  });
  const [horarios, setHorarios] = useState<Record<string, Horario>>({
    Lunes:     { desde:"09:00", hasta:"18:00", activo:true  },
    Martes:    { desde:"09:00", hasta:"18:00", activo:true  },
    Miércoles: { desde:"09:00", hasta:"18:00", activo:true  },
    Jueves:    { desde:"09:00", hasta:"18:00", activo:true  },
    Viernes:   { desde:"09:00", hasta:"18:00", activo:true  },
    Sábado:    { desde:"09:00", hasta:"13:00", activo:false },
    Domingo:   { desde:"09:00", hasta:"13:00", activo:false },
  });
  const [feriados, setFeriados] = useState<Record<string, Horario>>(() =>
    Object.fromEntries(Object.keys(FERIADOS_ARG).map(f => [f, { activo:false, desde:"10:00", hasta:"16:00" }]))
  );

  const esEmpresa = perfil?.plan === "nexoempresa";

  useEffect(() => {
    const cargar = async () => {
      const { data:{ session } } = await supabase.auth.getSession();
      if (!session) { router.push("/login"); return; }

      const { data } = await supabase.from("usuarios").select("*").eq("id", session.user.id).single();
      if (data) {
        setPerfil(data);
        setAvatarUrl(data.avatar_url || null);
        setPersonal({ nombre_usuario:data.nombre_usuario||"", nombre:data.nombre||"", apellido:data.apellido||"", whatsapp:data.whatsapp||"", provincia:data.provincia||"", ciudad:data.ciudad||"", barrio:data.barrio||"", direccion:data.direccion||"", lat:data.lat||"", lng:data.lng||"" });
        if (data.vis_personal) setVisP(data.vis_personal);
        setEmp({ nombre_empresa:data.nombre_empresa||"", telefono:data.telefono||"", whatsapp_empresa:data.whatsapp_empresa||"", provincia_empresa:data.provincia_empresa||"", ciudad_empresa:data.ciudad_empresa||"", barrio_empresa:data.barrio_empresa||"", direccion_empresa:data.direccion_empresa||"", lat_empresa:data.lat_empresa||"", lng_empresa:data.lng_empresa||"" });
        if (data.vis_empresa) setVisE(data.vis_empresa);
        if (data.horarios)    setHorarios(data.horarios);
        if (data.feriados)    setFeriados(data.feriados);
      }

      const { count: total }  = await supabase.from("anuncios").select("*",{count:"exact",head:true}).eq("usuario_id", session.user.id);
      const { count: activos } = await supabase.from("anuncios").select("*",{count:"exact",head:true}).eq("usuario_id", session.user.id).eq("estado","activo");
      const { count: grupos }  = await supabase.from("nexos").select("*",{count:"exact",head:true}).eq("usuario_id", session.user.id).eq("tipo","grupo");
      setTotalAnuncios(total || 0);
      setAnunciosActivos(activos || 0);
      setGruposCreados(grupos || 0);

      // Cargar nexos del usuario (empresa, servicio, trabajo)
      const { data: nxData } = await supabase.from("nexos")
        .select("id,titulo,tipo,ciudad,provincia,avatar_url,estado,trial_hasta,siguiente_pago")
        .eq("usuario_id", session.user.id)
        .order("created_at", { ascending: false });
      if (nxData) setMisNexos(nxData);

      // Cargar insignias de reputación recibidas
      const { data: repData } = await supabase
        .from("insignias_reputacion")
        .select("tipo")
        .eq("receptor_id", session.user.id);
      if (repData) {
        const cont: Record<string,number> = {};
        repData.forEach((r: any) => { cont[r.tipo] = (cont[r.tipo] || 0) + 1; });
        setRepContadores(cont);
      }

      // BIT Promo por descargas
      const { data: pdData } = await supabase.from("bits_promo_descargas")
        .select("*").eq("usuario_id", session.user.id).order("created_at", { ascending: false }).limit(10);
      if (pdData) setPromoDescargas(pdData);

      const { data: msgs } = await supabase
        .from("mensajes")
        .select("id,texto,emisor_id,receptor_id,anuncio_id,leido,created_at")
        .or(`emisor_id.eq.${session.user.id},receptor_id.eq.${session.user.id}`)
        .order("created_at", { ascending: false });

      if (msgs) {
        const convMap = new Map<string, any>();
        for (const m of msgs) {
          const otroId = m.emisor_id === session.user.id ? m.receptor_id : m.emisor_id;
          const key = `${m.anuncio_id}-${otroId}`;
          if (!convMap.has(key)) convMap.set(key, { ...m, otro_id: otroId });
        }
        const convs = Array.from(convMap.values());
        const otroIds = [...new Set(convs.map(c => c.otro_id))];
        const anuncioIds = [...new Set(convs.map(c => c.anuncio_id))];
        const { data: usuarios } = await supabase.from("usuarios").select("id,nombre_usuario,codigo,plan").in("id", otroIds);
        const { data: anuncios } = await supabase.from("anuncios").select("id,titulo").in("id", anuncioIds);
        const convsFinal = convs.map(c => ({
          ...c,
          otro: usuarios?.find((u:any) => u.id === c.otro_id),
          anuncio: anuncios?.find((a:any) => a.id === c.anuncio_id),
        }));
        setChats(convsFinal);
        setNoLeidos(convsFinal.filter(c => !c.leido && c.receptor_id === session.user.id).length);
      }

      const { data: bData } = await supabase.from("busquedas_automaticas").select("*").eq("usuario_id", session.user.id).order("created_at", { ascending: false });
      if (bData) setBusquedas(bData);

      const { data: srData } = await supabase.from("subrubros").select("id, nombre, rubros(nombre)").order("nombre");
      if (srData) setSubrubros(srData);

      if (data) setBitsBusq(
        Math.max(0, data.bits||0) + Math.max(0, data.bits_free||0) + Math.max(0, data.bits_promo||0)
      );

      // Grupos: cargar desde nexo_miembros (tipo grupo) + nexos creados
      const { data: mgData } = await supabase
        .from("nexo_miembros")
        .select("rol, estado, nexo_id")
        .eq("usuario_id", session.user.id)
        .in("estado", ["activo","pendiente"]);

      const miembroNexoIds = (mgData||[]).map((m:any) => m.nexo_id).filter(Boolean);
      const { data: gruposNexos } = miembroNexoIds.length > 0
        ? await supabase.from("nexos").select("id,titulo,avatar_url,ciudad,tipo,estado").in("id", miembroNexoIds).eq("tipo","grupo")
        : { data: [] };

      const { data: creadosData } = await supabase
        .from("nexos")
        .select("id,titulo,avatar_url,ciudad,tipo,estado")
        .eq("usuario_id", session.user.id).eq("tipo","grupo");

      const miembroIds = new Set((gruposNexos||[]).map((g:any) => g.id));
      const creadosExtra = (creadosData||[]).filter((g:any) => !miembroIds.has(g.id));

      const fromMiembros = (gruposNexos||[]).map((g:any) => {
        const mm = (mgData||[]).find((m:any) => m.nexo_id === g.id);
        return { ...g, nombre: g.titulo, imagen: g.avatar_url, mi_rol: mm?.rol || "miembro", mi_estado: mm?.estado || "activo", categoria_nombre: "", categoria_emoji: "👥", subcategoria_nombre: "" };
      });
      const fromCreados = creadosExtra.map((g:any) => ({
        ...g, nombre: g.titulo, imagen: g.avatar_url, mi_rol: "creador", mi_estado: "activo", categoria_nombre: "", categoria_emoji: "👥", subcategoria_nombre: "",
      }));
      setMisGruposData([...fromMiembros, ...fromCreados]);
    };
    cargar();
  }, []);

  const subirAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !perfil) return;
    if (file.size > 2 * 1024 * 1024) { alert("La imagen no puede superar 2MB"); return; }
    setSubiendoAvatar(true);
    const ext  = file.name.split(".").pop();
    const path = `${perfil.id}/avatar.${ext}`;
    const { error: upErr } = await supabase.storage.from("avatares").upload(path, file, { upsert: true });
    if (upErr) { alert("Error al subir imagen"); setSubiendoAvatar(false); return; }
    const { data: urlData } = supabase.storage.from("avatares").getPublicUrl(path);
    const url = `${urlData.publicUrl}?t=${Date.now()}`;
    await supabase.from("usuarios").update({ avatar_url: url }).eq("id", perfil.id);
    setAvatarUrl(url);
    setPerfil((p: any) => ({ ...p, avatar_url: url }));
    setSubiendoAvatar(false);
  };

  const [gpsLoad, setGpsLoad] = useState(false);
  const [gpsOk, setGpsOk] = useState(false);
  const geolocPersonal = () => {
    if (!navigator.geolocation) return alert("GPS no disponible");
    setGpsLoad(true);
    navigator.geolocation.getCurrentPosition(async pos => {
      const {latitude:lat, longitude:lng} = pos.coords;
      try {
        const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=es`);
        const d = await r.json();
        setPersonal(p => ({ ...p, ciudad:d.address?.city||d.address?.town||d.address?.village||p.ciudad, provincia:d.address?.state||p.provincia }));
        setGpsOk(true);
      } catch { alert("Error al obtener dirección"); }
      setGpsLoad(false);
    }, () => { alert("No se pudo acceder al GPS"); setGpsLoad(false); });
  };

  const geolocEmpresa = () => {
    if (!navigator.geolocation) return alert("GPS no disponible");
    navigator.geolocation.getCurrentPosition(async pos => {
      const {latitude:lat, longitude:lng} = pos.coords;
      try {
        const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
        const d = await r.json();
        setEmp(e => ({ ...e, lat_empresa:String(lat), lng_empresa:String(lng), ciudad_empresa:d.address?.city||d.address?.town||d.address?.village||e.ciudad_empresa, provincia_empresa:d.address?.state||e.provincia_empresa, barrio_empresa:d.address?.suburb||d.address?.neighbourhood||e.barrio_empresa, direccion_empresa:(`${d.address?.road||""} ${d.address?.house_number||""}`).trim()||e.direccion_empresa }));
        alert("✅ Ubicación empresa detectada");
      } catch { alert("Error al obtener dirección"); }
    }, () => alert("No se pudo acceder al GPS"));
  };

  const guardar = async () => {
    const { data:{ session } } = await supabase.auth.getSession();
    if (!session) return;
    if (!personal.nombre_usuario?.trim()) {
      alert("El nombre de usuario no puede estar vacío");
      return;
    }
    setGuardando(true);
    const { error } = await supabase.from("usuarios").update({
      nombre_usuario: personal.nombre_usuario,
      nombre: personal.nombre,
      apellido: personal.apellido,
      whatsapp: personal.whatsapp,
      provincia: personal.provincia,
      ciudad: personal.ciudad,
      barrio: personal.barrio || null,
      direccion: personal.direccion || null,
      lat: personal.lat || null,
      lng: personal.lng || null,
      vis_personal: visP,
    }).eq("id", session.user.id);
    setGuardando(false);
    if (error) {
      alert("Error al guardar: " + error.message);
    } else {
      setPerfil((p: any) => ({ ...p, ...personal, vis_personal:visP }));
      alert("¡Cambios guardados!");
    }
  };

  const cerrarSesion = async () => { await supabase.auth.signOut(); router.push("/"); };

  const enviarContacto = async () => {
    if (!contactoTipo || !contactoTexto.trim() || !perfil) return;
    setEnviandoContacto(true);
    const { error } = await supabase.from("contactos_nexonet").insert({
      usuario_id: perfil.id, tipo: contactoTipo, mensaje: contactoTexto.trim(),
    });
    if (error) {
      alert("Error al guardar: " + error.message);
      setEnviandoContacto(false);
      return;
    }
    await supabase.from("notificaciones").insert({
      usuario_id: perfil.id, tipo: "sistema",
      mensaje: `✅ Tu ${contactoTipo} fue recibida. Te responderemos pronto.`, leida: false,
    });
    setEnviandoContacto(false);
    setPopupContacto(false); setContactoTipo(null); setContactoTexto("");
    alert("✅ Enviado correctamente. Te responderemos pronto.");
  };

  const solicitarBaja = async () => {
    if (!perfil) return;
    setConfirmBaja(true);
    await supabase.from("usuarios").update({
      estado_cuenta: "baja_solicitada", nota_baja: notaBaja || null,
    }).eq("id", perfil.id);
    await supabase.from("notificaciones").insert({
      usuario_id: "ab56253d-b92e-4b73-a19a-3cd0cd95c458", tipo: "sistema",
      mensaje: `🚨 Baja solicitada por ${perfil.nombre_usuario} (${perfil.codigo})${notaBaja ? ": " + notaBaja.slice(0, 80) : ""}`, leida: false,
    });
    await supabase.from("notificaciones").insert({
      usuario_id: perfil.id, tipo: "sistema",
      mensaje: "Tu solicitud de baja fue recibida. Nos pondremos en contacto.", leida: false,
    });
    setConfirmBaja(false); setPopupBaja(false); setNotaBaja("");
    alert("Tu solicitud de baja fue enviada. Nos pondremos en contacto.");
  };

  const toggleP = (k:string) => setVisP(v=>({...v,[k]:!v[k]}));
  const toggleE = (k:string) => setVisE(v=>({...v,[k]:!v[k]}));

  const bitsNexonet   = Math.max(0, perfil?.bits         || 0);
  const bitsPromotor  = Math.max(0, perfil?.bits_promo   || 0);
  const bitsFree      = Math.max(0, perfil?.bits_free    || 0);
  const bitsGastados  = perfil?.bits_gastados        || 0;
  const promoGastados = perfil?.bits_promo_gastados  || 0;
  const freeGastados  = perfil?.bits_free_gastados   || 0;
  const gastAnuncios  = perfil?.bits_gastados_anuncios  || 0;
  const gastConexion  = perfil?.bits_gastados_conexion  || 0;
  const gastLink      = perfil?.bits_gastados_link      || 0;
  const gastBusquedas = perfil?.bits_gastados_busquedas || 0;
  const gastGrupo     = perfil?.bits_gastados_grupo     || 0;
  const gastAdjuntos  = perfil?.bits_gastados_adjuntos  || 0;
  const promoGanados  = perfil?.bits_promo_ganados   || 0;
  const promoReembolso= perfil?.bits_promo_reembolso || 0;
  const totalConsum   = bitsGastados + promoGastados + freeGastados;
  const estrellas     = bitsGastados + (perfil?.bits_promo_total || 0);
  const totalVistas   = perfil?.total_vistas         || 0;
  const totalConex    = perfil?.total_conexiones     || 0;
  const gruposUnidos  = perfil?.grupos_unidos        || 0;

  const bitsAcumulados = perfil?.bits_totales_acumulados || 0;
  const insigniaActual = INSIGNIAS.find(i => bitsAcumulados >= i.min && bitsAcumulados <= i.max) || INSIGNIAS[0];
  const idxActual      = INSIGNIAS.findIndex(i => i === insigniaActual);
  const insigniaSig    = INSIGNIAS[idxActual + 1];
  const progreso       = insigniaSig
    ? Math.min(100, ((bitsAcumulados - insigniaActual.min) / (insigniaSig.min - insigniaActual.min)) * 100)
    : 100;

  // Helper para secciones de nexos
  const renderSeccionNexos = (tipo: string, color: string, emoji: string, label: string, labelCrear: string) => {
    const items = misNexos.filter(n => n.tipo === tipo);
    return (
      <div style={{ display:"flex", flexDirection:"column", gap:"12px" }}>
        <div style={{ fontSize:"13px", fontWeight:900, color:"#1a2a3a", textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:"4px" }}>
          {emoji} Mis {label} ({items.length})
        </div>
        {items.length === 0 ? (
          <div style={{ background:"#fff", borderRadius:"16px", padding:"40px 20px", textAlign:"center", boxShadow:"0 2px 8px rgba(0,0,0,0.06)" }}>
            <div style={{ fontSize:"40px", marginBottom:"12px" }}>{emoji}</div>
            <div style={{ fontSize:"15px", fontWeight:800, color:"#1a2a3a", marginBottom:"20px" }}>No tenés {label} creados</div>
            <button onClick={()=>router.push(`/nexo/crear/${tipo}`)}
              style={{ background:`linear-gradient(135deg,${color}cc,${color})`, border:"none", borderRadius:"12px", padding:"12px 24px", fontSize:"13px", fontWeight:900, color:"#fff", cursor:"pointer", fontFamily:"'Nunito',sans-serif" }}>
              ➕ {labelCrear}
            </button>
          </div>
        ) : (
          items.map(n => (
            <div key={n.id} onClick={()=>router.push(`/nexo/${n.id}`)}
              style={{ background:"#fff", borderRadius:"16px", overflow:"hidden", boxShadow:"0 2px 8px rgba(0,0,0,0.06)", cursor:"pointer", display:"flex", alignItems:"stretch", border:`2px solid ${color}20` }}>
              <div style={{ width:"72px", flexShrink:0, background:`linear-gradient(135deg,${color}33,${color}11)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"28px", overflow:"hidden" }}>
                {n.avatar_url ? <img src={n.avatar_url} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }}/> : <span>{emoji}</span>}
              </div>
              <div style={{ flex:1, padding:"12px 14px" }}>
                <div style={{ fontSize:"14px", fontWeight:900, color:"#1a2a3a", marginBottom:"4px" }}>{n.titulo}</div>
                <div style={{ display:"flex", gap:"8px", alignItems:"center", flexWrap:"wrap" }}>
                  {n.ciudad && <span style={{ fontSize:"11px", color:"#9a9a9a", fontWeight:600 }}>📍 {n.ciudad}</span>}
                  <span style={{ fontSize:"10px", fontWeight:800, padding:"2px 8px", borderRadius:"20px", background: n.estado==="activo" ? "#e8f8ee" : "#f4f4f2", color: n.estado==="activo" ? "#27ae60" : "#9a9a9a" }}>
                    {n.estado === "activo" ? "✓ Activo" : "⏸ Pausado"}
                  </span>
                  {tipo==="empresa" && n.siguiente_pago && (() => {
                    const dias = Math.ceil((new Date(n.siguiente_pago).getTime() - Date.now()) / (1000*60*60*24));
                    const esTrial = n.trial_hasta && new Date(n.trial_hasta) >= new Date();
                    if (dias <= 0) return <span style={{ fontSize:"10px", fontWeight:800, padding:"2px 8px", borderRadius:"20px", background:"#fde8e8", color:"#e74c3c" }}>⚠️ Vencido</span>;
                    if (dias <= 5) return <span style={{ fontSize:"10px", fontWeight:800, padding:"2px 8px", borderRadius:"20px", background:"#fef3e0", color:"#e67e22" }}>⏰ {dias}d</span>;
                    return <span style={{ fontSize:"10px", fontWeight:800, padding:"2px 8px", borderRadius:"20px", background:"#e8f0fe", color:"#3a7bd5" }}>{esTrial?"🎉 Trial":"📅"} {dias}d</span>;
                  })()}
                </div>
              </div>
              <div style={{ display:"flex", alignItems:"center", paddingRight:"12px", color:`${color}80`, fontSize:"20px" }}>›</div>
            </div>
          ))
        )}
        <button onClick={()=>router.push(`/nexo/crear/${tipo}`)}
          style={{ background:"rgba(212,160,23,0.08)", border:"2px dashed rgba(212,160,23,0.4)", borderRadius:"16px", padding:"16px", fontSize:"13px", fontWeight:800, color:"#d4a017", cursor:"pointer", fontFamily:"'Nunito',sans-serif", display:"flex", alignItems:"center", justifyContent:"center", gap:"8px" }}>
          ➕ {labelCrear}
        </button>
      </div>
    );
  };

  return (
    <main style={{ paddingTop:"95px", paddingBottom:"130px", background:"#f4f4f2", minHeight:"100vh", fontFamily:"'Nunito', sans-serif" }}>
      <Header />

      <div style={{ background:"linear-gradient(135deg, #1a2a3a 0%, #243b55 100%)", padding:"16px 16px 0" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"14px", marginBottom:"10px" }}>
          <div style={{ position:"relative", flexShrink:0 }}>
            <div style={{ width:"56px", height:"56px", borderRadius:"50%", background:"linear-gradient(135deg, #d4a017, #f0c040)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"26px", boxShadow:"0 4px 16px rgba(212,160,23,0.4)", overflow:"hidden" }}>
              {avatarUrl
                ? <img src={avatarUrl} alt="avatar" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                : <span>{esEmpresa ? "🏢" : "👤"}</span>
              }
            </div>
            <label style={{ position:"absolute", bottom:"-2px", right:"-2px", width:"22px", height:"22px", borderRadius:"50%", background:"#d4a017", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", boxShadow:"0 2px 6px rgba(0,0,0,0.3)", border:"2px solid #1a2a3a" }}>
              <span style={{ fontSize:"11px" }}>{subiendoAvatar ? "⏳" : "📷"}</span>
              <input type="file" accept="image/*" onChange={subirAvatar} style={{ display:"none" }} disabled={subiendoAvatar} />
            </label>
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:"22px", color:"#fff", letterSpacing:"1px", lineHeight:1.1 }}>
              {perfil?.nombre_usuario||"---"}
            </div>
            <div style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:"14px", color:"#d4a017", letterSpacing:"2px", lineHeight:1.2 }}>
              {perfil?.codigo||"---"}
            </div>
            <div style={{ marginTop:"4px", display:"flex", gap:"4px", flexWrap:"wrap", alignItems:"center" }}>
              <span style={{ background:insigniaActual.color, borderRadius:"20px", padding:"3px 10px", fontSize:"10px", fontWeight:900, color:"#fff", letterSpacing:"0.5px" }}>
                {insigniaActual.emoji} {insigniaActual.nombre.toUpperCase()}
              </span>
              <InsigniaLogro nivel={perfil?.insignia_logro} size="xs" />
            </div>
          </div>
          <button onClick={cerrarSesion} style={{ background:"rgba(255,80,80,0.15)", border:"1px solid rgba(255,80,80,0.4)", borderRadius:"10px", padding:"6px 12px", color:"#ff6b6b", fontSize:"12px", fontWeight:800, cursor:"pointer", fontFamily:"'Nunito', sans-serif", flexShrink:0 }}>
            🚪 Salir
          </button>
        </div>

        <div style={{ display:"flex", overflowX:"auto", scrollbarWidth:"none", WebkitOverflowScrolling:"touch" }}>
          {([
            ["cuenta",       "💳", "Cuenta",     "#d4a017"],
            ["anuncios",     "📋", "Anuncios",   "#d4a017"],
            ["empresa",      "🏢", "Empresa",    "#c0392b"],
            ["servicios",    "🛠️", "Servicios",  "#27ae60"],
            ["trabajo",      "💼", "Trabajo",    "#8e44ad"],
            ["promotor",     "⭐", "Promotor",   "#d4a017"],
            ["grupos",       "👥", "Grupos",     "#d4a017"],
            ["datos",        "👤", "Datos",      "#d4a017"],
            ["chat",         "💬", "Chat",       "#d4a017"],
            ["busquedas",    "🔍", "Búsquedas",  "#16a085"],
            ["estadisticas", "📊", "Stats",      "#d4a017"],
          ] as [Seccion,string,string,string][]).map(([id,e,l,color]) => (
            <button key={id} onClick={()=> id === "anuncios" ? router.push("/mis-anuncios") : setSeccion(id)}
              style={{ flexShrink:0, minWidth:"60px", background:"none", border:"none",
                       borderBottom: seccion===id ? `3px solid ${color}` : "3px solid transparent",
                       padding:"10px 6px", cursor:"pointer", display:"flex", flexDirection:"column",
                       alignItems:"center", gap:"2px", position:"relative" }}>
              <span style={{ fontSize:"16px" }}>{e}</span>
              {id==="chat" && noLeidos>0 && (
                <span style={{ position:"absolute", top:"6px", right:"calc(50% - 16px)",
                               background:"#e74c3c", color:"#fff", borderRadius:"20px",
                               fontSize:"9px", fontWeight:900, padding:"1px 5px",
                               minWidth:"16px", textAlign:"center" }}>{noLeidos}</span>
              )}
              <span style={{ fontSize:"9px", fontWeight:800, color:seccion===id ? color : "#8a9aaa",
                             textTransform:"uppercase", letterSpacing:"0.5px", whiteSpace:"nowrap" }}>{l}</span>
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding:"16px", maxWidth:"480px", margin:"0 auto" }}>

        {seccion !== "cuenta" && (
          <button onClick={() => setSeccion("cuenta")}
            style={{ background:"rgba(26,42,58,0.08)", border:"1px solid rgba(26,42,58,0.15)", borderRadius:"10px", padding:"6px 14px", fontSize:"12px", fontWeight:800, color:"#1a2a3a", cursor:"pointer", fontFamily:"'Nunito',sans-serif", marginBottom:"12px" }}>
            ← Volver
          </button>
        )}

        {/* ═══ CUENTA ═══ */}
        {seccion === "cuenta" && (
          <div style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
            <div style={{ background:"linear-gradient(135deg,#1a2a3a,#243b55)", borderRadius:"18px", padding:"20px", boxShadow:"0 6px 24px rgba(0,0,0,0.18)" }}>
              <div style={{ fontSize:"11px", fontWeight:800, color:"#8a9aaa", textTransform:"uppercase", letterSpacing:"1px", marginBottom:"14px" }}>💳 Tu saldo BIT</div>
              <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"56px", color:"#f0c040", letterSpacing:"2px", lineHeight:1, marginBottom:"4px" }}>
                {(bitsNexonet+bitsPromotor+bitsFree).toLocaleString()}
                <span style={{ fontSize:"22px", color:"#d4a017", marginLeft:"8px" }}>BIT</span>
              </div>
              <div style={{ fontSize:"11px", color:"#8a9aaa", fontWeight:600, marginBottom:"16px" }}>disponibles para usar en todo</div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"8px", marginBottom:"16px" }}>
                <SaldoPill label="Nexo"  valor={bitsNexonet}  color="#d4a017" />
                <SaldoPill label="Free"  valor={bitsFree}     color="#2980b9" />
                <SaldoPill label="Promo" valor={bitsPromotor} color="#27ae60" />
              </div>
              <button onClick={()=>router.push("/tienda")}
                style={{ width:"100%", background:"linear-gradient(135deg,#f0c040,#d4a017)", border:"none", borderRadius:"12px", padding:"14px", fontSize:"15px", fontWeight:900, color:"#1a2a3a", cursor:"pointer", fontFamily:"'Nunito',sans-serif", boxShadow:"0 4px 0 #a07810", letterSpacing:"0.5px" }}>
                💰 Cargar BIT
              </button>
            </div>

            <div style={{ background:"#fff", borderRadius:"16px", padding:"18px", boxShadow:"0 2px 10px rgba(0,0,0,0.06)" }}>
              <div style={{ fontSize:"11px", fontWeight:800, color:"#9a9a9a", textTransform:"uppercase", letterSpacing:"1px", marginBottom:"4px" }}>📊 Cómo usaste tus BIT</div>
              <div style={{ fontSize:"11px", color:"#bbb", fontWeight:600, marginBottom:"16px" }}>Total consumido: <strong style={{ color:"#1a2a3a" }}>{totalConsum.toLocaleString()} BIT</strong></div>
              {[
                { emoji:"📋", label:"Anuncios",       valor:gastAnuncios,  color:"#d4a017" },
                { emoji:"🔗", label:"Conexiones",     valor:gastConexion,  color:"#3a7bd5" },
                { emoji:"🔍", label:"Búsquedas auto", valor:gastBusquedas, color:"#16a085" },
                { emoji:"👥", label:"Grupos",          valor:gastGrupo,     color:"#8e44ad" },
                { emoji:"🔗", label:"Links",           valor:gastLink,      color:"#e67e22" },
                { emoji:"📎", label:"Adjuntos",        valor:gastAdjuntos,  color:"#e74c3c" },
              ].filter(f => f.valor > 0 || totalConsum === 0).map((f, i, arr) => {
                const pct = totalConsum > 0 ? Math.round((f.valor / totalConsum) * 100) : 0;
                return (
                  <div key={f.label} style={{ marginBottom: i < arr.length-1 ? "12px" : "0" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"5px" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
                        <span style={{ fontSize:"14px" }}>{f.emoji}</span>
                        <span style={{ fontSize:"13px", fontWeight:800, color:"#1a2a3a" }}>{f.label}</span>
                      </div>
                      <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
                        <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"16px", color:f.color }}>{f.valor.toLocaleString()}</span>
                        <span style={{ fontSize:"10px", color:"#bbb", fontWeight:600, minWidth:"28px", textAlign:"right" }}>{pct}%</span>
                      </div>
                    </div>
                    <div style={{ height:"6px", background:"#f0f0f0", borderRadius:"3px", overflow:"hidden" }}>
                      <div style={{ height:"100%", width:`${pct}%`, background:f.color, borderRadius:"3px", transition:"width .4s" }} />
                    </div>
                  </div>
                );
              })}
              {totalConsum === 0 && (
                <div style={{ textAlign:"center", padding:"16px", color:"#bbb", fontSize:"13px", fontWeight:600 }}>Todavía no consumiste BIT</div>
              )}
            </div>

            <div style={{ background:"#fff", borderRadius:"16px", padding:"16px", boxShadow:"0 2px 12px rgba(0,0,0,0.06)" }}>
              <div style={{ fontSize:"11px", fontWeight:800, color:"#9a9a9a", textTransform:"uppercase", letterSpacing:"1px", marginBottom:"14px" }}>💳 Formas de pago</div>
              {[
                { nombre:"MercadoPago",         emoji:"🔵", desc:"Transferencia, QR, Dinero en cuenta", activo:true  },
                { nombre:"Tarjeta de crédito",  emoji:"💳", desc:"Visa, Mastercard, Naranja",          activo:true  },
                { nombre:"Tarjeta de débito",   emoji:"🟢", desc:"Visa Débito, Maestro",               activo:true  },
                { nombre:"Efectivo (Rapipago)", emoji:"💵", desc:"Pagos en puntos de cobro",           activo:false },
              ].map(fp => (
                <div key={fp.nombre} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 0", borderBottom:"1px solid #f0f0f0", opacity:fp.activo?1:0.45 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
                    <span style={{ fontSize:"24px" }}>{fp.emoji}</span>
                    <div>
                      <div style={{ fontSize:"13px", fontWeight:800, color:"#1a2a3a" }}>{fp.nombre}</div>
                      <div style={{ fontSize:"10px", color:"#9a9a9a", fontWeight:600 }}>{fp.desc}</div>
                    </div>
                  </div>
                  <span style={{ fontSize:"10px", fontWeight:800, padding:"3px 10px", borderRadius:"20px", background:fp.activo?"#e8f8ee":"#f0f0f0", color:fp.activo?"#27ae60":"#9a9a9a" }}>
                    {fp.activo?"Disponible":"Próximamente"}
                  </span>
                </div>
              ))}
            </div>

            {bitsPromotor > 0 && (
              <div style={{ background:"linear-gradient(135deg,#1a3a2a,#1e4a30)", borderRadius:"16px", padding:"16px", border:"1px solid rgba(39,174,96,0.3)" }}>
                <div style={{ fontSize:"12px", fontWeight:800, color:"#27ae60", marginBottom:"6px" }}>💚 BIT Promotor reembolsables</div>
                <div style={{ fontSize:"12px", color:"#8abba0", fontWeight:600, marginBottom:"14px" }}>Tenés {bitsPromotor.toLocaleString()} BIT Promotor. {bitsPromotor >= 100000 ? "Ya podés solicitar el reembolso en pesos." : `Te faltan ${(100000 - bitsPromotor).toLocaleString()} BIT para poder reembolsar.`}</div>
                <button onClick={()=>router.push("/promotor")} style={{ width:"100%", background:"linear-gradient(135deg,#27ae60,#1e8449)", border:"none", borderRadius:"10px", padding:"12px", fontSize:"13px", fontWeight:900, color:"#fff", cursor:"pointer", fontFamily:"'Nunito',sans-serif", boxShadow:"0 4px 0 #155a2e" }}>
                  ⭐ Ir a mi página de Promotor
                </button>
              </div>
            )}

            {/* Legal + Darme de baja */}
            <div style={{ display:"flex", justifyContent:"center", gap:"16px", paddingTop:"16px" }}>
              <button onClick={()=>router.push("/legal")} style={{ background:"none", border:"none", cursor:"pointer", fontFamily:"'Nunito',sans-serif", fontSize:"12px", fontWeight:600, color:"#3a7bd5" }}>
                ⚖️ Legal
              </button>
              <button onClick={()=>setPopupBaja(true)} style={{ background:"none", border:"none", cursor:"pointer", fontFamily:"'Nunito',sans-serif", fontSize:"12px", fontWeight:600, color:"#cc6666" }}>
                Solicitar baja de cuenta
              </button>
            </div>
          </div>
        )}

        {/* ═══ EMPRESA ═══ */}
        {seccion === "empresa" && renderSeccionNexos("empresa", "#c0392b", "🏢", "empresas", "Crear empresa")}

        {/* ═══ SERVICIOS ═══ */}
        {seccion === "servicios" && renderSeccionNexos("servicio", "#27ae60", "🛠️", "servicios", "Ofrecer servicio")}

        {/* ═══ TRABAJO ═══ */}
        {seccion === "trabajo" && renderSeccionNexos("trabajo", "#8e44ad", "💼", "búsquedas de trabajo", "Buscar trabajo")}

        {/* ═══ CHAT ═══ */}
        {seccion === "chat" && (
          <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
            <button onClick={()=>setPopupContacto(true)}
              style={{ background:"linear-gradient(135deg,#1a2a3a,#243b55)", border:"2px solid rgba(212,160,23,0.4)", borderRadius:"16px", padding:"16px", cursor:"pointer", display:"flex", alignItems:"center", gap:"14px", fontFamily:"'Nunito',sans-serif" }}>
              <div style={{ width:"44px", height:"44px", borderRadius:"50%", background:"rgba(212,160,23,0.2)", border:"2px solid #d4a017", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"22px", flexShrink:0 }}>📩</div>
              <div style={{ textAlign:"left" }}>
                <div style={{ fontSize:"14px", fontWeight:900, color:"#d4a017" }}>Contactar a NexoNet</div>
                <div style={{ fontSize:"11px", fontWeight:600, color:"#8a9aaa" }}>Sugerencias, reclamos o denuncias</div>
              </div>
              <span style={{ marginLeft:"auto", fontSize:"18px", color:"#d4a017", flexShrink:0 }}>›</span>
            </button>
            {chats.length === 0 ? (
              <div style={{ textAlign:"center", padding:"60px 20px", color:"#9a9a9a" }}>
                <div style={{ fontSize:"48px", marginBottom:"16px" }}>💬</div>
                <div style={{ fontSize:"16px", fontWeight:800, color:"#1a2a3a", marginBottom:"8px" }}>Aún no tenés conversaciones</div>
                <div style={{ fontSize:"13px", fontWeight:600, lineHeight:1.6 }}>Cuando te conectes con un anuncio o alguien se conecte con el tuyo, las conversaciones aparecerán acá.</div>
              </div>
            ) : (
              chats.map((c, i) => {
                const esMio = c.emisor_id === perfil?.id;
                const noLeido = !c.leido && !esMio;
                return (
                  <button key={i} onClick={()=>router.push(`/chat/${c.anuncio_id}/${c.otro_id}`)}
                    style={{ display:"flex", alignItems:"center", gap:"12px", background:"#fff", borderRadius:"16px", padding:"14px", border:noLeido?"2px solid #d4a017":"2px solid transparent", boxShadow:"0 2px 8px rgba(0,0,0,0.06)", cursor:"pointer", width:"100%", textAlign:"left" }}>
                    <div style={{ width:"48px", height:"48px", borderRadius:"50%", background:"linear-gradient(135deg,#d4a017,#f0c040)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"22px", flexShrink:0, position:"relative" }}>
                      {c.otro?.plan==="nexoempresa"?"🏢":"👤"}
                      {noLeido && <span style={{ position:"absolute", top:0, right:0, width:"12px", height:"12px", background:"#e74c3c", borderRadius:"50%", border:"2px solid #fff" }} />}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"3px" }}>
                        <div style={{ fontWeight:900, fontSize:"14px", color:"#1a2a3a" }}>{c.otro?.nombre_usuario||"Usuario"}</div>
                        <div style={{ fontSize:"11px", color:"#bbb", fontWeight:600, flexShrink:0 }}>
                          {new Date(c.created_at).toLocaleDateString("es-AR",{day:"numeric",month:"short"})}
                        </div>
                      </div>
                      <div style={{ fontSize:"11px", color:"#d4a017", fontWeight:700, marginBottom:"4px", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                        📋 {c.anuncio?.titulo||"Anuncio"}
                      </div>
                      <div style={{ fontSize:"13px", color:noLeido?"#1a2a3a":"#9a9a9a", fontWeight:noLeido?700:600, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                        {esMio && <span style={{ color:"#bbb" }}>Vos: </span>}{c.texto}
                      </div>
                    </div>
                    <span style={{ fontSize:"18px", color:"#d4a017", flexShrink:0 }}>›</span>
                  </button>
                );
              })
            )}
          </div>
        )}

        {/* ═══ DATOS ═══ */}
        {seccion === "datos" && (
          <div style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
            <div style={C}>
              <ST>👤 Datos personales</ST>
              <Campo label="Nombre de usuario" valor={personal.nombre_usuario} onChange={v=>setPersonal(p=>({...p,nombre_usuario:v}))} visible={visP.nombre_usuario} onToggle={()=>toggleP("nombre_usuario")} />
              <Campo label="Nombre" valor={personal.nombre} onChange={v=>setPersonal(p=>({...p,nombre:v}))} visible={visP.nombre_apellido} onToggle={()=>toggleP("nombre_apellido")} placeholder="Tu nombre" />
              <Campo label="Apellido" valor={personal.apellido} onChange={v=>setPersonal(p=>({...p,apellido:v}))} visible={visP.nombre_apellido} onToggle={()=>toggleP("nombre_apellido")} placeholder="Tu apellido" />
              <div style={{ fontSize:"12px", color:"#9a9a9a", fontWeight:600, padding:"8px 0 4px" }}>📧 {perfil?.email}</div>
              <Campo label="WhatsApp" valor={personal.whatsapp} onChange={v=>setPersonal(p=>({...p,whatsapp:v}))} visible={visP.whatsapp} onToggle={()=>toggleP("whatsapp")} placeholder="Ej: 3492123456" icono="📱" />
              {personal.whatsapp && (
                <div onClick={async () => {
                  const nuevo = !perfil?.notif_whatsapp;
                  await supabase.from("usuarios").update({ notif_whatsapp: nuevo }).eq("id", perfil.id);
                  setPerfil((p: any) => ({ ...p, notif_whatsapp: nuevo }));
                }} style={{ display:"flex", alignItems:"center", gap:"12px", padding:"12px 14px", background: perfil?.notif_whatsapp ? "rgba(37,211,102,0.08)" : "#f9f9f9", borderRadius:"12px", border: perfil?.notif_whatsapp ? "2px solid #25d366" : "2px solid #e8e8e6", cursor:"pointer", marginTop:"4px" }}>
                  <div style={{ width:"44px", height:"26px", borderRadius:"13px", background: perfil?.notif_whatsapp ? "#25d366" : "#d0d0d0", position:"relative", flexShrink:0, transition:"background .2s" }}>
                    <div style={{ position:"absolute", top:"3px", left: perfil?.notif_whatsapp ? "21px" : "3px", width:"20px", height:"20px", borderRadius:"50%", background:"#fff", boxShadow:"0 1px 4px rgba(0,0,0,0.2)", transition:"left .2s" }} />
                  </div>
                  <div>
                    <div style={{ fontSize:"13px", fontWeight:800, color: perfil?.notif_whatsapp ? "#1a7a4a" : "#1a2a3a" }}>📱 Notificaciones por WhatsApp</div>
                    <div style={{ fontSize:"11px", color:"#9a9a9a", fontWeight:600 }}>Recibí un WA cuando aparezca un anuncio que buscás</div>
                  </div>
                </div>
              )}
              <Campo label="Provincia" valor={personal.provincia} onChange={v=>setPersonal(p=>({...p,provincia:v}))} visible={visP.provincia} onToggle={()=>toggleP("provincia")} placeholder="Ej: Santa Fe" icono="🗺️" />
              <Campo label="Ciudad" valor={personal.ciudad} onChange={v=>setPersonal(p=>({...p,ciudad:v}))} visible={visP.ciudad} onToggle={()=>toggleP("ciudad")} placeholder="Ej: Rosario" icono="🏙️" />
              <button onClick={geolocPersonal} disabled={gpsLoad}
                style={{ display:"flex", alignItems:"center", gap:"8px", background:"rgba(58,123,213,0.08)", border:"2px solid rgba(58,123,213,0.25)", borderRadius:"12px", padding:"10px 14px", cursor:gpsLoad?"wait":"pointer", fontFamily:"'Nunito',sans-serif", fontSize:"13px", fontWeight:800, color:"#3a7bd5", width:"100%", marginTop:"4px", opacity:gpsLoad?0.6:1 }}>
                {gpsLoad ? "⏳ Buscando..." : "📍 Usar mi ubicación"}
              </button>
              {gpsOk && <div style={{ fontSize:"11px", fontWeight:700, color:"#27ae60", marginTop:"4px" }}>✅ Ubicación detectada</div>}
            </div>

            <div style={{ background:"rgba(58,123,213,0.06)", border:"2px solid rgba(58,123,213,0.2)", borderRadius:"14px", padding:"14px 16px", display:"flex", gap:"12px", alignItems:"center" }}>
              <span style={{ fontSize:"24px" }}>🏢</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:"13px", fontWeight:800, color:"#1a2a3a" }}>Datos de tu empresa o grupo</div>
                <div style={{ fontSize:"11px", color:"#9a9a9a", fontWeight:600 }}>Se editan desde el panel admin de cada empresa/grupo</div>
              </div>
            </div>

            <button onClick={guardar} disabled={guardando} style={{ ...BTN, opacity:guardando?0.7:1 }}>
              {guardando ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        )}

        {/* ═══ ESTADÍSTICAS ═══ */}
        {seccion === "estadisticas" && (
          <div style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
            <BitCard titulo="BIT NexoNet" color="#d4a017" disponibles={bitsNexonet} consumidos={bitsGastados} descripcion="BIT de conexión para anuncios y funciones de la plataforma" />
            <BitCard titulo="BIT NexoPromotor" color="#27ae60" disponibles={bitsPromotor} consumidos={promoGastados} descripcion="BIT obtenidos como promotor — 1.000 BIT por cada referido registrado" />
            <BitCard titulo="BIT NexoFree" color="#2980b9" disponibles={bitsFree} consumidos={freeGastados} descripcion="BIT de respaldo garantizado — aval legal ante eventualidades" free />
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"10px" }}>
              {[
                { n:totalVistas.toLocaleString(),    l:"Visitas",          e:"👁️" },
                { n:totalConex.toLocaleString(),      l:"Conexiones",       e:"🔗" },
                { n:String(anunciosActivos),           l:"Activos",          e:"✅" },
                { n:String(totalAnuncios),             l:"Total publicados", e:"📋" },
                { n:String(gruposUnidos),              l:"Grupos unidos",    e:"👥" },
                { n:String(gruposCreados),             l:"Grupos creados",   e:"🏗️" },
              ].map(s => (
                <div key={s.l} style={{ background:"#fff", borderRadius:"14px", padding:"14px 8px", textAlign:"center", boxShadow:"0 2px 8px rgba(0,0,0,0.06)" }}>
                  <div style={{ fontSize:"22px", marginBottom:"4px" }}>{s.e}</div>
                  <div style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:"22px", color:"#d4a017" }}>{s.n}</div>
                  <div style={{ fontSize:"9px", fontWeight:700, color:"#666", textTransform:"uppercase", letterSpacing:"0.5px", lineHeight:1.3 }}>{s.l}</div>
                </div>
              ))}
            </div>
            {/* INSIGNIAS DE REPUTACIÓN (dadas por otros usuarios) */}
            {Object.values(repContadores).reduce((a: number, b: number) => a + b, 0) > 0 && (
              <div style={{ ...C, background:"linear-gradient(135deg,rgba(39,174,96,0.08),rgba(39,174,96,0.02))", border:"2px solid rgba(39,174,96,0.25)" }}>
                <div style={{ fontSize:"11px", fontWeight:800, color:"#9a9a9a", textTransform:"uppercase", letterSpacing:"1px", marginBottom:"10px" }}>🏅 Insignias de reputación</div>
                <InsigniaReputacion contadores={repContadores} size="md" />
                <div style={{ fontSize:"10px", color:"#9a9a9a", fontWeight:600, marginTop:"8px" }}>
                  {Object.values(repContadores).reduce((a: number, b: number) => a + b, 0)} insignia{Object.values(repContadores).reduce((a: number, b: number) => a + b, 0) !== 1 ? "s" : ""} recibida{Object.values(repContadores).reduce((a: number, b: number) => a + b, 0) !== 1 ? "s" : ""}
                </div>
              </div>
            )}

            <div style={{ ...C, background:`linear-gradient(135deg, ${insigniaActual.color}15, ${insigniaActual.color}05)`, border:`2px solid ${insigniaActual.color}30` }}>
              <div style={{ fontSize:"11px", fontWeight:800, color:"#9a9a9a", textTransform:"uppercase", letterSpacing:"1px", marginBottom:"14px" }}>⭐ Insignia de logro</div>
              <div style={{ display:"flex", alignItems:"center", gap:"16px", marginBottom:"14px" }}>
                <div style={{ width:"64px", height:"64px", borderRadius:"50%", background:`${insigniaActual.color}20`, border:`3px solid ${insigniaActual.color}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"32px", flexShrink:0 }}>
                  {insigniaActual.emoji}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:"24px", color:insigniaActual.color, letterSpacing:"1px" }}>{insigniaActual.nombre}</div>
                  <div style={{ fontSize:"11px", fontWeight:700, color:"#9a9a9a" }}>{bitsAcumulados.toLocaleString()} BIT acumulados</div>
                  {insigniaSig && <div style={{ fontSize:"10px", color:"#9a9a9a", marginTop:"2px" }}>Próxima: <span style={{ color:insigniaSig.color, fontWeight:800 }}>{insigniaSig.emoji} {insigniaSig.nombre}</span> en {(insigniaSig.min - bitsAcumulados).toLocaleString()} BIT</div>}
                </div>
              </div>
              {insigniaSig && (
                <>
                  <div style={{ height:"8px", background:"#f0f0f0", borderRadius:"4px", overflow:"hidden", marginBottom:"4px" }}>
                    <div style={{ height:"100%", width:`${progreso}%`, background:`linear-gradient(90deg, ${insigniaActual.color}, ${insigniaSig.color})`, borderRadius:"4px", transition:"width .4s" }} />
                  </div>
                  <div style={{ display:"flex", justifyContent:"space-between", fontSize:"10px", fontWeight:700, color:"#9a9a9a", marginBottom:"14px" }}>
                    <span>{insigniaActual.nombre}</span><span>{Math.round(progreso)}%</span><span>{insigniaSig.nombre}</span>
                  </div>
                </>
              )}
              <div style={{ display:"flex", gap:"4px", justifyContent:"space-between" }}>
                {INSIGNIAS.filter(ins => ins.min > 0).map(ins => {
                  const ok = bitsAcumulados >= ins.min;
                  return (
                    <div key={ins.nombre} style={{ flex:1, textAlign:"center", opacity:ok?1:0.25 }}>
                      <div style={{ fontSize:"18px" }}>{ins.emoji}</div>
                      <div style={{ fontSize:"8px", fontWeight:700, color:ok?ins.color:"#9a9a9a", textTransform:"uppercase", lineHeight:1.2, marginTop:"2px" }}>{ins.nombre}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* BIT PROMO POR DESCARGAS */}
            {promoDescargas.length > 0 && (
              <div style={{ ...C, background:"linear-gradient(135deg,rgba(22,160,133,0.08),rgba(22,160,133,0.02))", border:"2px solid rgba(22,160,133,0.25)" }}>
                <div style={{ fontSize:"11px", fontWeight:800, color:"#9a9a9a", textTransform:"uppercase", letterSpacing:"1px", marginBottom:"10px" }}>💰 BIT Promo por descargas</div>
                <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"28px", color:"#16a085", marginBottom:"12px" }}>
                  {promoDescargas.reduce((a:number, d:any) => a + (d.bits_recibidos||0), 0).toLocaleString()} BIT
                </div>
                {promoDescargas.map((d:any) => (
                  <div key={d.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 0", borderBottom:"1px solid rgba(22,160,133,0.15)", fontSize:"12px" }}>
                    <div style={{ color:"#1a2a3a", fontWeight:700 }}>+{d.bits_recibidos} BIT</div>
                    <div style={{ color:"#9a9a9a", fontWeight:600 }}>{new Date(d.created_at).toLocaleDateString("es-AR")}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══ PROMOTOR ═══ */}
        {seccion === "promotor" && (
          <div style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
            <div style={{ background:"linear-gradient(135deg,#1a2a3a,#243b55)", borderRadius:"16px", padding:"24px 20px", textAlign:"center" }}>
              <div style={{ fontSize:"40px", marginBottom:"8px" }}>⭐</div>
              <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"28px", color:"#d4a017", letterSpacing:"2px", marginBottom:"4px" }}>Nexo Promotor</div>
              <div style={{ fontSize:"13px", color:"#8a9aaa", fontWeight:600, marginBottom:"20px" }}>Ganá 1000 BIT por cada usuario que se registre con tu código</div>
              <div style={{ background:"rgba(212,160,23,0.15)", borderRadius:"12px", padding:"16px", marginBottom:"8px" }}>
                <div style={{ fontSize:"12px", color:"#8a9aaa", fontWeight:600, marginBottom:"4px" }}>Tu código de promotor</div>
                <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"28px", color:"#d4a017", letterSpacing:"4px" }}>{perfil?.codigo||"---"}</div>
              </div>
              <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"36px", color:"#f0c040", marginBottom:"4px" }}>
                {(perfil?.bits_promotor||0).toLocaleString()} BIT
              </div>
              <div style={{ fontSize:"12px", color:"#8a9aaa", fontWeight:600, marginBottom:"20px" }}>saldo BIT promotor acumulado</div>
              <button onClick={()=>router.push("/promotor")} style={BTN}>⭐ Ver página de Promotor</button>
            </div>
          </div>
        )}

        {/* ═══ BÚSQUEDAS AUTOMÁTICAS ═══ */}
        {seccion === "busquedas" && (
          <div style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
            <div style={{ background:"linear-gradient(135deg,#0d3d30,#16a085)", borderRadius:"16px", padding:"18px 20px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <div>
                <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"20px", color:"#fff", letterSpacing:"1px" }}>🔍 BIT Búsquedas Automáticas</div>
                <div style={{ fontSize:"11px", color:"rgba(255,255,255,0.6)", fontWeight:600, marginTop:"2px" }}>Tus BIT disponibles para usar en la plataforma</div>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"36px", color: bitsBusq > 0 ? "#7effd4" : "#ff8a80", letterSpacing:"1px" }}>{bitsBusq}</div>
                <div style={{ fontSize:"9px", color:"rgba(255,255,255,0.5)", fontWeight:700 }}>BIT totales</div>
              </div>
            </div>

            {busquedas.length === 0 ? (
              <div style={{ background:"#fff", borderRadius:"16px", padding:"40px 20px", textAlign:"center", boxShadow:"0 2px 8px rgba(0,0,0,0.06)" }}>
                <div style={{ fontSize:"40px", marginBottom:"12px" }}>🔍</div>
                <div style={{ fontSize:"15px", fontWeight:800, color:"#1a2a3a", marginBottom:"6px" }}>No tenés búsquedas configuradas</div>
                <div style={{ fontSize:"12px", color:"#9a9a9a", fontWeight:600, marginBottom:"20px", lineHeight:1.6 }}>Configurá qué estás buscando y te notificamos automáticamente cuando aparezca un anuncio que matchee</div>
              </div>
            ) : (
              busquedas.map((b:any) => (
                <div key={b.id} style={{ background:"#fff", borderRadius:"16px", padding:"16px", boxShadow:"0 2px 8px rgba(0,0,0,0.06)", borderLeft: b.activo ? "4px solid #16a085" : "4px solid #ccc" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"10px" }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:"14px", fontWeight:900, color:"#1a2a3a", marginBottom:"4px" }}>{b.titulo || "Sin título"}</div>
                      <div style={{ display:"flex", flexWrap:"wrap", gap:"6px" }}>
                        {b.ciudad && <span style={{ background:"#f0f8f4", color:"#16a085", borderRadius:"8px", padding:"2px 8px", fontSize:"10px", fontWeight:700 }}>📍 {b.ciudad}</span>}
                        {b.precio_min && <span style={{ background:"#fff8e0", color:"#d4a017", borderRadius:"8px", padding:"2px 8px", fontSize:"10px", fontWeight:700 }}>desde ${b.precio_min.toLocaleString()}</span>}
                        {b.precio_max && <span style={{ background:"#fff8e0", color:"#d4a017", borderRadius:"8px", padding:"2px 8px", fontSize:"10px", fontWeight:700 }}>hasta ${b.precio_max.toLocaleString()}</span>}
                        {b.keywords && <span style={{ background:"#f0f0ff", color:"#8e44ad", borderRadius:"8px", padding:"2px 8px", fontSize:"10px", fontWeight:700 }}>🔤 {b.keywords}</span>}
                      </div>
                    </div>
                    <div style={{ display:"flex", gap:"6px", flexShrink:0, marginLeft:"10px" }}>
                      <button onClick={() => setFormBusq(b)} style={{ background:"rgba(212,160,23,0.1)", border:"1px solid rgba(212,160,23,0.3)", borderRadius:"8px", padding:"6px 10px", fontSize:"12px", fontWeight:800, color:"#d4a017", cursor:"pointer", fontFamily:"'Nunito',sans-serif" }}>✏️</button>
                      <button onClick={async () => { await supabase.from("busquedas_automaticas").update({ activo: !b.activo }).eq("id", b.id); setBusquedas(prev => prev.map(x => x.id===b.id ? {...x, activo:!b.activo} : x)); }} style={{ background: b.activo ? "rgba(231,76,60,0.1)" : "rgba(39,174,96,0.1)", border: b.activo ? "1px solid rgba(231,76,60,0.3)" : "1px solid rgba(39,174,96,0.3)", borderRadius:"8px", padding:"6px 10px", fontSize:"12px", fontWeight:800, color: b.activo ? "#e74c3c" : "#27ae60", cursor:"pointer", fontFamily:"'Nunito',sans-serif" }}>{b.activo ? "⏸" : "▶️"}</button>
                      <button onClick={async () => { if (!confirm("¿Eliminás esta búsqueda?")) return; await supabase.from("busquedas_automaticas").delete().eq("id", b.id); setBusquedas(prev => prev.filter(x => x.id !== b.id)); }} style={{ background:"rgba(231,76,60,0.08)", border:"1px solid rgba(231,76,60,0.2)", borderRadius:"8px", padding:"6px 10px", fontSize:"12px", color:"#e74c3c", cursor:"pointer" }}>🗑️</button>
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:"12px", fontSize:"11px", color:"#9a9a9a", fontWeight:600 }}>
                    <span>{b.activo ? "✅ Activa" : "⏸ Pausada"}</span>
                    <span>🔔 {b.notificaciones_recibidas || 0} notificaciones</span>
                  </div>
                </div>
              ))
            )}

            <button onClick={() => setFormBusq({ titulo:"", subrubro_id:"", precio_min:"", precio_max:"", moneda:"ARS", ciudad:"", provincia:"", keywords:"" })} style={{ background:"rgba(22,160,133,0.08)", border:"2px dashed rgba(22,160,133,0.4)", borderRadius:"16px", padding:"16px", fontSize:"13px", fontWeight:800, color:"#16a085", cursor:"pointer", fontFamily:"'Nunito',sans-serif", display:"flex", alignItems:"center", justifyContent:"center", gap:"8px" }}>
              ➕ Nueva búsqueda automática
            </button>

            {formBusq !== null && (
              <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.65)", zIndex:400, display:"flex", alignItems:"flex-end" }} onClick={() => setFormBusq(null)}>
                <div style={{ background:"#fff", borderRadius:"24px 24px 0 0", padding:"24px 20px 40px", width:"100%", maxHeight:"90vh", overflowY:"auto", fontFamily:"'Nunito',sans-serif" }} onClick={e => e.stopPropagation()}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"20px" }}>
                    <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"20px", color:"#1a2a3a", letterSpacing:"1px" }}>{formBusq.id ? "✏️ Editar búsqueda" : "🔍 Nueva búsqueda automática"}</div>
                    <button onClick={() => setFormBusq(null)} style={{ background:"#f4f4f2", border:"none", borderRadius:"50%", width:"32px", height:"32px", fontSize:"16px", cursor:"pointer" }}>✕</button>
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
                    <div><label style={LS}>Nombre de la búsqueda</label><input type="text" value={formBusq.titulo||""} placeholder="Ej: Auto familiar hasta $20M" onChange={e => setFormBusq((f:any) => ({...f, titulo:e.target.value}))} style={IS} /></div>
                    <div><label style={LS}>Categoría / Subrubro</label><select value={formBusq.subrubro_id||""} onChange={e => setFormBusq((f:any) => ({...f, subrubro_id:e.target.value}))} style={{...IS, padding:"11px 14px"}}><option value="">— Cualquier categoría —</option>{subrubros.map((s:any) => (<option key={s.id} value={s.id}>{(s.rubros as any)?.nombre} → {s.nombre}</option>))}</select></div>
                    <div><label style={LS}>Palabras clave</label><input type="text" value={formBusq.keywords||""} placeholder="Ej: toyota corolla diesel" onChange={e => setFormBusq((f:any) => ({...f, keywords:e.target.value}))} style={IS} /></div>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px" }}>
                      <div><label style={LS}>Precio mínimo</label><input type="number" value={formBusq.precio_min||""} placeholder="Sin límite" onChange={e => setFormBusq((f:any) => ({...f, precio_min:e.target.value}))} style={IS} /></div>
                      <div><label style={LS}>Precio máximo</label><input type="number" value={formBusq.precio_max||""} placeholder="Sin límite" onChange={e => setFormBusq((f:any) => ({...f, precio_max:e.target.value}))} style={IS} /></div>
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px" }}>
                      <div><label style={LS}>Ciudad</label><input type="text" value={formBusq.ciudad||""} placeholder="Ej: Rosario" onChange={e => setFormBusq((f:any) => ({...f, ciudad:e.target.value}))} style={IS} /></div>
                      <div><label style={LS}>Provincia</label><input type="text" value={formBusq.provincia||""} placeholder="Ej: Santa Fe" onChange={e => setFormBusq((f:any) => ({...f, provincia:e.target.value}))} style={IS} /></div>
                    </div>
                    <div><label style={LS}>Moneda</label><select value={formBusq.moneda||"ARS"} onChange={e => setFormBusq((f:any) => ({...f, moneda:e.target.value}))} style={{...IS, padding:"11px 14px"}}><option value="ARS">ARS $</option><option value="USD">USD U$D</option><option value="">Cualquiera</option></select></div>
                    <button onClick={async () => {
                      const { data:{ session } } = await supabase.auth.getSession();
                      if (!session) return;
                      const payload = { usuario_id: session.user.id, titulo: formBusq.titulo || null, subrubro_id: formBusq.subrubro_id ? parseInt(formBusq.subrubro_id) : null, precio_min: formBusq.precio_min ? parseFloat(formBusq.precio_min) : null, precio_max: formBusq.precio_max ? parseFloat(formBusq.precio_max) : null, moneda: formBusq.moneda || null, ciudad: formBusq.ciudad || null, provincia: formBusq.provincia || null, keywords: formBusq.keywords || null, activo: true };
                      if (formBusq.id) {
                        const { error } = await supabase.from("busquedas_automaticas").update(payload).eq("id", formBusq.id);
                        if (error) { console.error("Error actualizando búsqueda:", error); alert("Error al actualizar la búsqueda: " + error.message); return; }
                        setBusquedas(prev => prev.map(x => x.id===formBusq.id ? {...x,...payload} : x));
                      } else {
                        const { data:nb, error } = await supabase.from("busquedas_automaticas").insert(payload).select().single();
                        if (error) { console.error("Error guardando búsqueda:", error); alert("Error al guardar la búsqueda: " + error.message); return; }
                        if (nb) setBusquedas(prev => [nb, ...prev]);
                      }
                      setFormBusq(null);
                    }} style={{ background:"linear-gradient(135deg,#16a085,#1abc9c)", border:"none", borderRadius:"14px", padding:"16px", fontSize:"15px", fontWeight:900, color:"#fff", cursor:"pointer", fontFamily:"'Nunito',sans-serif", boxShadow:"0 4px 0 #0e6b59" }}>
                      {formBusq.id ? "💾 Guardar cambios" : "✅ Crear búsqueda"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══ GRUPOS ═══ */}
        {seccion === "grupos" && (
          <div style={{ display:"flex", flexDirection:"column", gap:"12px" }}>
            <div style={{ fontSize:"13px", fontWeight:900, color:"#1a2a3a", textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:"4px" }}>👥 Mis grupos ({misGruposData.length})</div>
            {misGruposData.length === 0 ? (
              <div style={{ background:"#fff", borderRadius:"16px", padding:"40px 20px", textAlign:"center", boxShadow:"0 2px 8px rgba(0,0,0,0.06)" }}>
                <div style={{ fontSize:"40px", marginBottom:"12px" }}>👥</div>
                <div style={{ fontSize:"15px", fontWeight:800, color:"#1a2a3a", marginBottom:"6px" }}>No estás en ningún grupo</div>
                <div style={{ fontSize:"13px", color:"#9a9a9a", fontWeight:600, marginBottom:"20px" }}>Unite a grupos o creá el tuyo</div>
                <button onClick={()=>router.push("/buscar?tipo=grupos")} style={{ background:"linear-gradient(135deg,#f0c040,#d4a017)", border:"none", borderRadius:"12px", padding:"12px 24px", fontSize:"13px", fontWeight:900, color:"#1a2a3a", cursor:"pointer", fontFamily:"'Nunito',sans-serif", boxShadow:"0 3px 0 #a07810" }}>🔍 Explorar grupos</button>
              </div>
            ) : (
              misGruposData.map((g:any) => (
                <div key={g.id} onClick={()=>router.push(`/grupos/${g.id}`)} style={{ background:"#fff", borderRadius:"16px", overflow:"hidden", boxShadow:"0 2px 8px rgba(0,0,0,0.06)", cursor:"pointer", display:"flex", alignItems:"stretch" }}>
                  <div style={{ width:"80px", flexShrink:0, background:"linear-gradient(135deg,#1a2a3a,#243b55)", display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden", position:"relative" }}>
                    {g.imagen ? <img src={g.imagen} alt={g.nombre} style={{ width:"100%", height:"100%", objectFit:"cover" }}/> : <span style={{ fontSize:"28px", opacity:0.4 }}>{g.categoria_emoji}</span>}
                    <div style={{ position:"absolute", bottom:"4px", left:0, right:0, textAlign:"center" }}>
                      <span style={{ background:g.mi_rol==="creador"?"rgba(212,160,23,0.95)":g.mi_rol==="moderador"?"rgba(100,149,237,0.9)":"rgba(0,168,132,0.85)", borderRadius:"20px", padding:"1px 6px", fontSize:"8px", fontWeight:900, color:g.mi_rol==="creador"?"#1a2a3a":"#fff" }}>
                        {g.mi_rol==="creador"?"👑 Creador":g.mi_rol==="moderador"?"🛡️ Mod":"✅ Miembro"}
                      </span>
                    </div>
                  </div>
                  <div style={{ flex:1, padding:"12px 14px", display:"flex", flexDirection:"column", justifyContent:"space-between" }}>
                    <div>
                      <div style={{ fontSize:"10px", fontWeight:700, color:"#9a9a9a", textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:"2px" }}>{g.categoria_emoji} {g.subcategoria_nombre || g.categoria_nombre}</div>
                      <div style={{ fontSize:"14px", fontWeight:900, color:"#1a2a3a", marginBottom:"4px", overflow:"hidden", whiteSpace:"nowrap", textOverflow:"ellipsis" }}>{g.nombre}</div>
                    </div>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                      <span style={{ fontSize:"11px", color:"#9a9a9a", fontWeight:600 }}>👥 {g.miembros_count} miembro{g.miembros_count!==1?"s":""}</span>
                      <div style={{ display:"flex", gap:"6px", alignItems:"center" }}>
                        {g.mi_estado === "pendiente" && <span style={{ background:"rgba(230,57,70,0.1)", border:"1px solid rgba(230,57,70,0.3)", borderRadius:"20px", padding:"2px 8px", fontSize:"9px", fontWeight:800, color:"#e63946" }}>⏳ Pendiente</span>}
                        <span style={{ fontSize:"13px", color:"#d4a017", fontWeight:900 }}>→</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
            <button onClick={()=>router.push("/nexo/crear/grupo")} style={{ background:"rgba(212,160,23,0.08)", border:"2px dashed rgba(212,160,23,0.4)", borderRadius:"16px", padding:"16px", fontSize:"13px", fontWeight:800, color:"#d4a017", cursor:"pointer", fontFamily:"'Nunito',sans-serif", display:"flex", alignItems:"center", justifyContent:"center", gap:"8px" }}>
              ➕ Crear nuevo grupo
            </button>
          </div>
        )}
      </div>

      {popupEmpresa && (
        <PopupCompra titulo="BIT Anuncios — Ampliar plan" emoji="📋" costo="$1.000 / $3.000 / $10.000" descripcion="Ampliá la cantidad de anuncios publicados" bits={{ free: bitsFree, nexo: bitsNexonet, promo: bitsPromotor }} onClose={() => setPopupEmpresa(false)} onPagar={async (metodo: MetodoPago) => { setPopupEmpresa(false); alert("Próximamente — contactanos para ampliar tu plan"); }} />
      )}

      {/* MODAL CONTACTAR NEXONET */}
      {popupContacto && (
        <div style={{ position:"fixed", inset:0, zIndex:500, background:"rgba(0,0,0,0.65)", display:"flex", alignItems:"flex-end" }} onClick={()=>{setPopupContacto(false);setContactoTipo(null);setContactoTexto("");}}>
          <div style={{ width:"100%", background:"#fff", borderRadius:"24px 24px 0 0", padding:"28px 20px 44px", fontFamily:"'Nunito',sans-serif" }} onClick={e=>e.stopPropagation()}>
            <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"22px", color:"#1a2a3a", letterSpacing:"1px", marginBottom:"6px" }}>📩 Contactar a NexoNet</div>
            {!contactoTipo ? (
              <div style={{ display:"flex", flexDirection:"column", gap:"10px", marginTop:"16px" }}>
                {[
                  { tipo:"sugerencia", emoji:"💡", label:"Sugerencia", desc:"Tengo una idea para mejorar", color:"#3a7bd5" },
                  { tipo:"reclamo",    emoji:"⚠️",  label:"Reclamo",    desc:"Algo no funciona bien",      color:"#e67e22" },
                  { tipo:"denuncia",   emoji:"🚨", label:"Denuncia",   desc:"Quiero reportar un problema", color:"#e74c3c" },
                ].map(op=>(
                  <button key={op.tipo} onClick={()=>setContactoTipo(op.tipo)}
                    style={{ display:"flex", alignItems:"center", gap:"14px", background:`${op.color}08`, border:`2px solid ${op.color}30`, borderRadius:"14px", padding:"16px", cursor:"pointer", fontFamily:"'Nunito',sans-serif", textAlign:"left" }}>
                    <span style={{ fontSize:"28px" }}>{op.emoji}</span>
                    <div>
                      <div style={{ fontSize:"14px", fontWeight:900, color:"#1a2a3a" }}>{op.label}</div>
                      <div style={{ fontSize:"12px", fontWeight:600, color:"#9a9a9a" }}>{op.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div style={{ marginTop:"16px" }}>
                <div style={{ fontSize:"13px", fontWeight:800, color:"#1a2a3a", marginBottom:"10px" }}>
                  {contactoTipo === "sugerencia" ? "💡 Sugerencia" : contactoTipo === "reclamo" ? "⚠️ Reclamo" : "🚨 Denuncia"}
                </div>
                <textarea value={contactoTexto} onChange={e=>setContactoTexto(e.target.value)} placeholder="Escribí tu mensaje..."
                  style={{ width:"100%", border:"2px solid #e8e8e6", borderRadius:"12px", padding:"12px 14px", fontSize:"14px", fontFamily:"'Nunito',sans-serif", minHeight:"100px", resize:"vertical", outline:"none", boxSizing:"border-box" }} />
                <div style={{ display:"flex", gap:"8px", marginTop:"14px" }}>
                  <button onClick={()=>{setContactoTipo(null);setContactoTexto("");}}
                    style={{ flex:1, background:"#f4f4f2", border:"none", borderRadius:"12px", padding:"13px", fontSize:"13px", fontWeight:800, color:"#666", cursor:"pointer", fontFamily:"'Nunito',sans-serif" }}>
                    ← Volver
                  </button>
                  <button onClick={enviarContacto} disabled={!contactoTexto.trim()||enviandoContacto}
                    style={{ flex:2, background:contactoTexto.trim()?"linear-gradient(135deg,#d4a017,#f0c040)":"#e8e8e6", border:"none", borderRadius:"12px", padding:"13px", fontSize:"13px", fontWeight:900, color:contactoTexto.trim()?"#1a2a3a":"#bbb", cursor:contactoTexto.trim()?"pointer":"default", fontFamily:"'Nunito',sans-serif", boxShadow:contactoTexto.trim()?"0 3px 0 #a07810":"none" }}>
                    {enviandoContacto ? "Enviando..." : "📨 Enviar"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL BAJA */}
      {popupBaja && (
        <div style={{ position:"fixed", inset:0, zIndex:500, background:"rgba(0,0,0,0.65)", display:"flex", alignItems:"flex-end" }} onClick={()=>{setPopupBaja(false);setNotaBaja("");}}>
          <div style={{ width:"100%", background:"#fff", borderRadius:"24px 24px 0 0", padding:"28px 20px 44px", fontFamily:"'Nunito',sans-serif" }} onClick={e=>e.stopPropagation()}>
            <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"22px", color:"#e74c3c", letterSpacing:"1px", marginBottom:"6px" }}>🚨 Solicitar baja</div>
            <div style={{ background:"rgba(231,76,60,0.08)", border:"2px solid rgba(231,76,60,0.2)", borderRadius:"12px", padding:"14px", marginBottom:"16px" }}>
              <div style={{ fontSize:"13px", fontWeight:700, color:"#e74c3c", lineHeight:1.6 }}>
                Al solicitar la baja se perderán todos tus datos, BIT acumulados, anuncios y conexiones. Esta acción no se puede deshacer una vez procesada.
              </div>
            </div>
            <div style={{ fontSize:"11px", fontWeight:800, color:"#666", textTransform:"uppercase", letterSpacing:"1px", marginBottom:"6px" }}>¿Por qué te vas? (opcional)</div>
            <textarea value={notaBaja} onChange={e=>setNotaBaja(e.target.value)} placeholder="Contanos el motivo..."
              style={{ width:"100%", border:"2px solid #e8e8e6", borderRadius:"12px", padding:"12px 14px", fontSize:"13px", fontFamily:"'Nunito',sans-serif", minHeight:"70px", resize:"vertical", outline:"none", boxSizing:"border-box", marginBottom:"16px" }} />
            <button onClick={solicitarBaja} disabled={confirmBaja}
              style={{ width:"100%", background:"linear-gradient(135deg,#c0392b,#e74c3c)", border:"none", borderRadius:"12px", padding:"14px", fontSize:"14px", fontWeight:900, color:"#fff", cursor:"pointer", fontFamily:"'Nunito',sans-serif", boxShadow:"0 3px 0 #8a2a1f", marginBottom:"10px" }}>
              {confirmBaja ? "Procesando..." : "Confirmar baja"}
            </button>
            <button onClick={()=>{setPopupBaja(false);setNotaBaja("");}}
              style={{ width:"100%", background:"none", border:"none", padding:"10px", fontSize:"13px", fontWeight:700, color:"#9a9a9a", cursor:"pointer", fontFamily:"'Nunito',sans-serif" }}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      <BottomNav />
    </main>
  );
}

function SaldoPill({ label, valor, color }: { label:string; valor:number; color:string }) {
  return (
    <div style={{ flex:1, background:`${color}18`, borderRadius:"10px", padding:"8px 6px", border:`1px solid ${color}30`, textAlign:"center" }}>
      <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"18px", color, letterSpacing:"1px" }}>{valor.toLocaleString()}</div>
      <div style={{ fontSize:"9px", fontWeight:800, color:"rgba(255,255,255,0.5)", textTransform:"uppercase", letterSpacing:"0.5px" }}>{label}</div>
    </div>
  );
}

function BitCard({ titulo, color, disponibles, consumidos, descripcion, reembolsable, free }:{ titulo:string; color:string; disponibles:number; consumidos:number; descripcion:string; reembolsable?:boolean; free?:boolean; }) {
  const total = disponibles + consumidos;
  const pct   = total > 0 ? Math.min(100, (disponibles / total) * 100) : 0;
  return (
    <div style={{ ...C, border:`2px solid ${color}25` }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"10px" }}>
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"4px" }}>
            <div style={{ fontSize:"11px", fontWeight:800, color, textTransform:"uppercase", letterSpacing:"1px" }}>{titulo}</div>
            {reembolsable && <div style={{ background:`rgba(39,174,96,0.15)`, border:`1px solid rgba(39,174,96,0.4)`, borderRadius:"20px", padding:"2px 8px", fontSize:"9px", fontWeight:900, color:"#27ae60" }}>♻️ REEMBOLSABLE</div>}
            {free && <div style={{ background:`rgba(41,128,185,0.15)`, border:`1px solid rgba(41,128,185,0.4)`, borderRadius:"20px", padding:"2px 8px", fontSize:"9px", fontWeight:900, color:"#2980b9" }}>🛡️ RESPALDO</div>}
          </div>
          <div style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:"48px", color, lineHeight:1 }}>{disponibles.toLocaleString()}</div>
          <div style={{ fontSize:"11px", fontWeight:700, color:"#9a9a9a" }}>disponibles</div>
        </div>
        <div style={{ textAlign:"right" }}>
          <div style={{ fontSize:"11px", fontWeight:800, color:"#9a9a9a", textTransform:"uppercase", letterSpacing:"1px" }}>Consumidos</div>
          <div style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:"32px", color:"#1a2a3a" }}>{consumidos.toLocaleString()}</div>
          <div style={{ fontSize:"10px", color:"#9a9a9a", fontWeight:600 }}>Total: {total.toLocaleString()}</div>
        </div>
      </div>
      <div style={{ height:"8px", background:"#f0f0f0", borderRadius:"4px", overflow:"hidden", marginBottom:"8px" }}>
        <div style={{ height:"100%", width:`${pct}%`, background:`linear-gradient(90deg, ${color}cc, ${color})`, borderRadius:"4px", transition:"width .4s" }} />
      </div>
      <div style={{ fontSize:"11px", fontWeight:600, color:"#9a9a9a", lineHeight:1.5 }}>{descripcion}</div>
    </div>
  );
}

function ST({ children, color="#1a2a3a" }:{ children:React.ReactNode; color?:string }) {
  return <div style={{ fontSize:"13px", fontWeight:900, color, textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:"16px" }}>{children}</div>;
}
function GPS({ onClick, ok, label, color="#27ae60" }:{ onClick:()=>void; ok:boolean; label:string; color?:string }) {
  return <button onClick={onClick} style={{ width:"100%", background:`${color}12`, border:`2px solid ${color}40`, borderRadius:"10px", padding:"10px 14px", fontSize:"13px", fontWeight:800, color, cursor:"pointer", fontFamily:"'Nunito', sans-serif", textAlign:"left", marginBottom:"14px", display:"flex", alignItems:"center", gap:"6px" }}>📍 {label}{ok&&<span style={{ fontSize:"10px", color:"#27ae60", fontWeight:700 }}>✓ detectada</span>}</button>;
}
function Campo({ label, valor, onChange, visible, onToggle, placeholder, icono, highlight }:{ label:string; valor:string; onChange:(v:string)=>void; visible:boolean; onToggle:()=>void; placeholder?:string; icono?:string; highlight?:boolean; }) {
  return (
    <div style={{ marginBottom:"14px" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"6px" }}>
        <label style={{ fontSize:"11px", fontWeight:800, color:highlight?"#c0392b":"#666", textTransform:"uppercase", letterSpacing:"1px" }}>{icono&&`${icono} `}{label}</label>
        <button onClick={onToggle} style={{ background:visible?"rgba(212,160,23,0.15)":"#f4f4f2", border:`1px solid ${visible?"#d4a017":"#e8e8e6"}`, borderRadius:"6px", padding:"2px 8px", fontSize:"10px", fontWeight:800, color:visible?"#d4a017":"#9a9a9a", cursor:"pointer", fontFamily:"'Nunito', sans-serif" }}>{visible?"👁️ Se ve":"🙈 Oculto"}</button>
      </div>
      <input type="text" value={valor} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={{ width:"100%", border:`2px solid ${highlight?"rgba(192,57,43,0.25)":"#e8e8e6"}`, borderRadius:"10px", padding:"11px 14px", fontSize:"14px", fontFamily:"'Nunito', sans-serif", color:"#2c2c2e", outline:"none", boxSizing:"border-box", background:highlight?"rgba(192,57,43,0.02)":"#fff" }} />
    </div>
  );
}
function FilaHorario({ label, activo, desde, hasta, onToggle, onDesde, onHasta, esFeriado }:{ label:string; activo:boolean; desde:string; hasta:string; onToggle:()=>void; onDesde:(v:string)=>void; onHasta:(v:string)=>void; esFeriado?:boolean; }) {
  const color = esFeriado ? "#c0392b" : "#d4a017";
  return (
    <div style={{ display:"flex", alignItems:"center", gap:"8px", flexWrap:"wrap" }}>
      <button onClick={onToggle} style={{ width:"28px", height:"28px", borderRadius:"8px", flexShrink:0, background:activo?color:"#f4f4f2", border:`2px solid ${activo?color:"#e8e8e6"}`, cursor:"pointer", fontSize:"13px", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:900 }}>{activo?"✓":""}</button>
      <span style={{ fontSize:"12px", fontWeight:700, color:activo?"#1a2a3a":"#9a9a9a", flex:1, minWidth:"130px" }}>{label}</span>
      {activo ? (
        <div style={{ display:"flex", alignItems:"center", gap:"4px" }}>
          <input type="time" value={desde} onChange={e=>onDesde(e.target.value)} style={{ border:"2px solid #e8e8e6", borderRadius:"8px", padding:"4px 6px", fontSize:"12px", fontFamily:"'Nunito', sans-serif", outline:"none", color:"#1a2a3a" }} />
          <span style={{ fontSize:"11px", color:"#9a9a9a" }}>a</span>
          <input type="time" value={hasta} onChange={e=>onHasta(e.target.value)} style={{ border:"2px solid #e8e8e6", borderRadius:"8px", padding:"4px 6px", fontSize:"12px", fontFamily:"'Nunito', sans-serif", outline:"none", color:"#1a2a3a" }} />
        </div>
      ) : <span style={{ fontSize:"11px", color:"#9a9a9a", fontWeight:600 }}>{esFeriado?"Cerrado":"No disponible"}</span>}
    </div>
  );
}

const LS:React.CSSProperties = { display:"block", fontSize:"11px", fontWeight:800, color:"#666", textTransform:"uppercase" as const, letterSpacing:"1px", marginBottom:"6px" };
const IS:React.CSSProperties = { width:"100%", border:"2px solid #e8e8e6", borderRadius:"10px", padding:"11px 14px", fontSize:"14px", fontFamily:"'Nunito',sans-serif", color:"#2c2c2e", outline:"none", boxSizing:"border-box" as const };
const C:React.CSSProperties  = { background:"#fff", borderRadius:"16px", padding:"20px", boxShadow:"0 2px 10px rgba(0,0,0,0.06)" };
const BTN:React.CSSProperties = { width:"100%", background:"linear-gradient(135deg, #d4a017, #f0c040)", color:"#1a2a3a", border:"none", borderRadius:"12px", padding:"16px", fontSize:"15px", fontWeight:800, fontFamily:"'Nunito', sans-serif", cursor:"pointer", letterSpacing:"1px", textTransform:"uppercase" };
const THS = (c:string):React.CSSProperties => ({ fontSize:"12px", fontWeight:900, color:c, textTransform:"uppercase", letterSpacing:"1px", marginBottom:"12px" });
