"use client";
import React from "react";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
// v2
import PopupCompra, { MetodoPago } from "@/components/PopupCompra";

type Seccion = "cuenta" | "chat" | "datos" | "estadisticas" | "promotor" | "grupos" | "busquedas";

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
  { min: 0,     max: 99,       nombre: "Nexo Nuevo",     emoji: "🌱", color: "#6a8aaa" },
  { min: 100,   max: 499,      nombre: "Nexo Activo",    emoji: "⚡", color: "#27ae60" },
  { min: 500,   max: 1499,     nombre: "Nexo Conectado", emoji: "🔗", color: "#2980b9" },
  { min: 1500,  max: 4999,     nombre: "Nexo Pro",       emoji: "🏆", color: "#d4a017" },
  { min: 5000,  max: 14999,    nombre: "Nexo Élite",     emoji: "💎", color: "#8e44ad" },
  { min: 15000, max: Infinity, nombre: "Nexo Leyenda",   emoji: "🌟", color: "#c0392b" },
];

type Horario = { desde: string; hasta: string; activo: boolean };
type Vis = Record<string, boolean>;

export default function Usuario() {
  const router = useRouter();
  const [seccion, setSeccion] = useState<Seccion>("cuenta");
  const [perfil, setPerfil]   = useState<any>(null);
  const [guardando, setGuardando] = useState(false);
  const [totalAnuncios, setTotalAnuncios] = useState(0);
  const [anunciosActivos, setAnunciosActivos] = useState(0);
  const [gruposCreados, setGruposCreados] = useState(0);
  const [popupEmpresa, setPopupEmpresa] = useState(false);
  // ── NUEVO: popup cargar BIT ──
  const [popupBits, setPopupBits] = useState(false);
  const [busquedas, setBusquedas] = useState<any[]>([]);
  const [formBusq, setFormBusq]   = useState<any>(null); // null = cerrado, {} = nuevo, {id,...} = editar
  const [subrubros, setSubrubros] = useState<any[]>([]);
  const [bitsBusq,  setBitsBusq]  = useState(0);
  const [chats,         setChats]         = useState<any[]>([]);
  const [misGruposData, setMisGruposData] = useState<any[]>([]);
  const [noLeidos,      setNoLeidos]      = useState(0);

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
        setPersonal({ nombre_usuario:data.nombre_usuario||"", nombre:data.nombre||"", apellido:data.apellido||"", whatsapp:data.whatsapp||"", provincia:data.provincia||"", ciudad:data.ciudad||"", barrio:data.barrio||"", direccion:data.direccion||"", lat:data.lat||"", lng:data.lng||"" });
        if (data.vis_personal) setVisP(data.vis_personal);
        setEmp({ nombre_empresa:data.nombre_empresa||"", telefono:data.telefono||"", whatsapp_empresa:data.whatsapp_empresa||"", provincia_empresa:data.provincia_empresa||"", ciudad_empresa:data.ciudad_empresa||"", barrio_empresa:data.barrio_empresa||"", direccion_empresa:data.direccion_empresa||"", lat_empresa:data.lat_empresa||"", lng_empresa:data.lng_empresa||"" });
        if (data.vis_empresa) setVisE(data.vis_empresa);
        if (data.horarios)    setHorarios(data.horarios);
        if (data.feriados)    setFeriados(data.feriados);
      }

      const { count: total }  = await supabase.from("anuncios").select("*",{count:"exact",head:true}).eq("usuario_id", session.user.id);
      const { count: activos } = await supabase.from("anuncios").select("*",{count:"exact",head:true}).eq("usuario_id", session.user.id).eq("estado","activo");
      const { count: grupos }  = await supabase.from("grupos").select("*",{count:"exact",head:true}).eq("creador_id", session.user.id);
      setTotalAnuncios(total || 0);
      setAnunciosActivos(activos || 0);
      setGruposCreados(grupos || 0);

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

      // Búsquedas automáticas
      const { data: bData } = await supabase
        .from("busquedas_automaticas")
        .select("*")
        .eq("usuario_id", session.user.id)
        .order("created_at", { ascending: false });
      if (bData) setBusquedas(bData);

      // Subrubros para el form
      const { data: srData } = await supabase
        .from("subrubros")
        .select("id, nombre, rubros(nombre)")
        .order("nombre");
      if (srData) setSubrubros(srData);

      // bits_busquedas del usuario
      if (data) setBitsBusq(data.bits_busquedas || 0);

      // Mis grupos
      const { data: mgData } = await supabase
        .from("grupo_miembros")
        .select("rol, estado, grupo_id, grupos(id,nombre,imagen,tipo,miembros_count,categoria_id,grupo_categorias(nombre,emoji),grupo_subcategorias(nombre))")
        .eq("usuario_id", session.user.id)
        .in("estado", ["activo","pendiente"]);
      if (mgData) setMisGruposData(mgData.map((m:any)=>({
        ...m.grupos,
        mi_rol:    m.rol,
        mi_estado: m.estado,
        categoria_nombre:    m.grupos?.grupo_categorias?.nombre || "",
        categoria_emoji:     m.grupos?.grupo_categorias?.emoji  || "👥",
        subcategoria_nombre: m.grupos?.grupo_subcategorias?.nombre || "",
      })));
    };
    cargar();
  }, []);

  const geolocPersonal = () => {
    if (!navigator.geolocation) return alert("GPS no disponible");
    navigator.geolocation.getCurrentPosition(async pos => {
      const {latitude:lat, longitude:lng} = pos.coords;
      try {
        const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
        const d = await r.json();
        setPersonal(p => ({ ...p, lat:String(lat), lng:String(lng), ciudad:d.address?.city||d.address?.town||d.address?.village||p.ciudad, provincia:d.address?.state||p.provincia, barrio:d.address?.suburb||d.address?.neighbourhood||p.barrio, direccion:(`${d.address?.road||""} ${d.address?.house_number||""}`).trim()||p.direccion }));
        alert("✅ Ubicación personal detectada");
      } catch { alert("Error al obtener dirección"); }
    }, () => alert("No se pudo acceder al GPS"));
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
    setGuardando(true);
    await supabase.from("usuarios").update({
      nombre_usuario:personal.nombre_usuario, nombre:personal.nombre, apellido:personal.apellido,
      whatsapp:personal.whatsapp, provincia:personal.provincia, ciudad:personal.ciudad,
      barrio:personal.barrio, direccion:personal.direccion,
      lat:personal.lat||null, lng:personal.lng||null, vis_personal:visP,
      nombre_empresa:emp.nombre_empresa, telefono:emp.telefono, whatsapp_empresa:emp.whatsapp_empresa,
      provincia_empresa:emp.provincia_empresa, ciudad_empresa:emp.ciudad_empresa,
      barrio_empresa:emp.barrio_empresa, direccion_empresa:emp.direccion_empresa,
      lat_empresa:emp.lat_empresa||null, lng_empresa:emp.lng_empresa||null, vis_empresa:visE,
      horarios, feriados,
    }).eq("id", session.user.id);
    setGuardando(false);
    alert("¡Cambios guardados!");
  };

  const cerrarSesion = async () => { await supabase.auth.signOut(); router.push("/"); };
  const toggleP = (k:string) => setVisP(v=>({...v,[k]:!v[k]}));
  const toggleE = (k:string) => setVisE(v=>({...v,[k]:!v[k]}));

  const bitsNexonet   = perfil?.bits                 || 0;
  const bitsPromotor  = perfil?.bits_promo           || 0;
  const bitsFree      = perfil?.bits_free            || 0;
  const bitsBusquedas = perfil?.bits_busquedas       || 0;
  const bitsGrupo     = perfil?.bits_grupo           || 0;
  const bitsGastados  = perfil?.bits_gastados        || 0;
  const promoGastados = perfil?.bits_promo_gastados  || 0;
  const freeGastados  = perfil?.bits_free_gastados   || 0;
  // Desglose NexoNet
  const gastAnuncios  = perfil?.bits_gastados_anuncios  || 0;
  const gastConexion  = perfil?.bits_gastados_conexion  || 0;
  const gastLink      = perfil?.bits_gastados_link      || 0;
  const gastFlash     = perfil?.bits_gastados_flash     || 0;
  const gastBusquedas = perfil?.bits_gastados_busquedas || 0;
  const gastGrupo     = perfil?.bits_gastados_grupo     || 0;
  // Desglose Promotor
  const promoGanados  = perfil?.bits_promo_ganados   || 0;
  const promoReembolso= perfil?.bits_promo_reembolso || 0;
  const totalConsum   = bitsGastados + promoGastados + freeGastados;
  const estrellas     = bitsGastados + (perfil?.bits_promo_total || 0);
  const totalVistas   = perfil?.total_vistas         || 0;
  const totalConex    = perfil?.total_conexiones     || 0;
  const gruposUnidos  = perfil?.grupos_unidos        || 0;

  const insigniaActual = INSIGNIAS.find(i => totalConsum >= i.min && totalConsum <= i.max) || INSIGNIAS[0];
  const idxActual      = INSIGNIAS.findIndex(i => i === insigniaActual);
  const insigniaSig    = INSIGNIAS[idxActual + 1];
  const progreso       = insigniaSig
    ? Math.min(100, ((totalConsum - insigniaActual.min) / (insigniaSig.min - insigniaActual.min)) * 100)
    : 100;

  return (
    <main style={{ paddingTop:"95px", paddingBottom:"130px", background:"#f4f4f2", minHeight:"100vh", fontFamily:"'Nunito', sans-serif" }}>
      <Header />

      <div style={{ background:"linear-gradient(135deg, #1a2a3a 0%, #243b55 100%)", padding:"16px 16px 0" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"14px", marginBottom:"10px" }}>
          <div style={{ width:"56px", height:"56px", borderRadius:"50%", background:"linear-gradient(135deg, #d4a017, #f0c040)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"26px", boxShadow:"0 4px 16px rgba(212,160,23,0.4)", flexShrink:0 }}>
            {esEmpresa ? "🏢" : "👤"}
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:"22px", color:"#fff", letterSpacing:"1px", lineHeight:1.1 }}>
              {perfil?.nombre_usuario||"---"}
            </div>
            <div style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:"14px", color:"#d4a017", letterSpacing:"2px", lineHeight:1.2 }}>
              {perfil?.codigo||"---"}
            </div>
            <div style={{ marginTop:"4px" }}>
              <span style={{ background:insigniaActual.color, borderRadius:"20px", padding:"3px 10px", fontSize:"10px", fontWeight:900, color:"#fff", letterSpacing:"0.5px" }}>
                {insigniaActual.emoji} {insigniaActual.nombre.toUpperCase()}
              </span>
            </div>
          </div>
          <button onClick={cerrarSesion} style={{ background:"rgba(255,80,80,0.15)", border:"1px solid rgba(255,80,80,0.4)", borderRadius:"10px", padding:"6px 12px", color:"#ff6b6b", fontSize:"12px", fontWeight:800, cursor:"pointer", fontFamily:"'Nunito', sans-serif", flexShrink:0 }}>
            🚪 Salir
          </button>
        </div>

        <div style={{ display:"flex", overflowX:"auto", scrollbarWidth:"none", WebkitOverflowScrolling:"touch" }}>
          {([
            ["cuenta",    "💳", "Cuenta",    "#d4a017"],
            ["chat",      "💬", "Chat",       "#d4a017"],
            ["datos",     "👤", "Datos",      "#d4a017"],
            ["estadisticas","📊","Stats",     "#d4a017"],
            ["promotor",  "⭐", "Promotor",   "#d4a017"],
            ["grupos",    "👥", "Grupos",     "#d4a017"],
            ["busquedas", "🔍", "Búsquedas","#16a085"],
          ] as [Seccion,string,string,string][]).map(([id,e,l,color]) => (
            <button key={id} onClick={()=>setSeccion(id)}
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
          <button onClick={()=>router.push("/mis-anuncios")}
            style={{ flexShrink:0, minWidth:"60px", background:"none", border:"none",
                     borderBottom:"3px solid transparent", padding:"10px 6px", cursor:"pointer",
                     display:"flex", flexDirection:"column", alignItems:"center", gap:"2px" }}>
            <span style={{ fontSize:"16px" }}>📋</span>
            <span style={{ fontSize:"9px", fontWeight:800, color:"#8a9aaa",
                           textTransform:"uppercase", letterSpacing:"0.5px" }}>Anuncios</span>
          </button>
        </div>
      </div>

      <div style={{ padding:"16px", maxWidth:"480px", margin:"0 auto" }}>

        {/* ═══ CUENTA ═══ */}
        {seccion === "cuenta" && (
          <div style={{ display:"flex", flexDirection:"column", gap:"14px" }}>

            <div style={{ background:"linear-gradient(135deg,#1a2a3a,#243b55)", borderRadius:"18px", padding:"20px", boxShadow:"0 6px 24px rgba(0,0,0,0.18)" }}>
              <div style={{ fontSize:"11px", fontWeight:800, color:"#8a9aaa", textTransform:"uppercase", letterSpacing:"1px", marginBottom:"16px" }}>💳 Estado de Cuenta</div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px", marginBottom:"16px" }}>
                <div style={{ background:"rgba(212,160,23,0.15)", borderRadius:"14px", padding:"16px", border:"1px solid rgba(212,160,23,0.3)" }}>
                  <div style={{ fontSize:"10px", fontWeight:800, color:"#d4a017", textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:"6px" }}>BIT Disponibles</div>
                  <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"38px", color:"#f0c040", lineHeight:1 }}>{(bitsNexonet+bitsPromotor+bitsFree).toLocaleString()}</div>
                  <div style={{ fontSize:"10px", color:"#8a9aaa", fontWeight:600, marginTop:"4px" }}>para usar ahora</div>
                </div>
                <div style={{ background:"rgba(255,255,255,0.05)", borderRadius:"14px", padding:"16px", border:"1px solid rgba(255,255,255,0.08)" }}>
                  <div style={{ fontSize:"10px", fontWeight:800, color:"#8a9aaa", textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:"6px" }}>BIT Consumidos</div>
                  <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"38px", color:"#fff", lineHeight:1 }}>{totalConsum.toLocaleString()}</div>
                  <div style={{ fontSize:"10px", color:"#8a9aaa", fontWeight:600, marginTop:"4px" }}>historial total</div>
                </div>
              </div>
              {/* ── BOTÓN CARGAR BIT → abre popup ── */}
              <button onClick={()=>setPopupBits(true)} style={{ width:"100%", background:"linear-gradient(135deg,#f0c040,#d4a017)", border:"none", borderRadius:"12px", padding:"14px", fontSize:"15px", fontWeight:900, color:"#1a2a3a", cursor:"pointer", fontFamily:"'Nunito',sans-serif", boxShadow:"0 4px 0 #a07810", letterSpacing:"0.5px" }}>
                🔍 BIT Búsquedas Automáticas
              </button>
            </div>

            <DesglosePanel
              bitsNexonet={bitsNexonet} bitsGastados={bitsGastados}
              gastAnuncios={gastAnuncios} gastConexion={gastConexion}
              gastLink={gastLink} gastFlash={gastFlash}
              bitsPromotor={bitsPromotor} promoGastados={promoGastados}
              promoGanados={promoGanados} promoReembolso={promoReembolso}
              bitsFree={bitsFree} freeGastados={freeGastados}
              bitsBusquedas={bitsBusquedas} gastBusquedas={gastBusquedas}
              bitsGrupo={bitsGrupo} gastGrupo={gastGrupo}
            />

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

            <div style={{ background:"#fff", borderRadius:"16px", padding:"16px", boxShadow:"0 2px 12px rgba(0,0,0,0.06)" }}>
              <div style={{ fontSize:"11px", fontWeight:800, color:"#9a9a9a", textTransform:"uppercase", letterSpacing:"1px", marginBottom:"14px" }}>📄 Últimos movimientos</div>
              {totalConsum === 0 && (bitsNexonet+bitsPromotor+bitsFree) === 0 ? (
                <div style={{ textAlign:"center", padding:"20px", color:"#bbb", fontSize:"13px", fontWeight:600 }}>Aún no tenés movimientos</div>
              ) : (
                <div style={{ display:"flex", flexDirection:"column", gap:"2px" }}>
                  {bitsNexonet > 0 && (
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 0", borderBottom:"1px solid #f8f8f8" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
                        <div style={{ width:"32px", height:"32px", borderRadius:"50%", background:"#fff8e0", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"16px" }}>⚡</div>
                        <div>
                          <div style={{ fontSize:"12px", fontWeight:800, color:"#1a2a3a" }}>Carga de BIT NexoNet</div>
                          <div style={{ fontSize:"10px", color:"#9a9a9a" }}>Saldo disponible</div>
                        </div>
                      </div>
                      <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"18px", color:"#27ae60" }}>+{bitsNexonet.toLocaleString()}</div>
                    </div>
                  )}
                  {bitsPromotor > 0 && (
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 0", borderBottom:"1px solid #f8f8f8" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
                        <div style={{ width:"32px", height:"32px", borderRadius:"50%", background:"#e8f8ee", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"16px" }}>⭐</div>
                        <div>
                          <div style={{ fontSize:"12px", fontWeight:800, color:"#1a2a3a" }}>BIT NexoPromotor acumulados</div>
                          <div style={{ fontSize:"10px", color:"#9a9a9a" }}>Por referidos</div>
                        </div>
                      </div>
                      <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"18px", color:"#27ae60" }}>+{bitsPromotor.toLocaleString()}</div>
                    </div>
                  )}
                  {totalConsum > 0 && (
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 0" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
                        <div style={{ width:"32px", height:"32px", borderRadius:"50%", background:"#fff0f0", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"16px" }}>🔗</div>
                        <div>
                          <div style={{ fontSize:"12px", fontWeight:800, color:"#1a2a3a" }}>Conexiones realizadas</div>
                          <div style={{ fontSize:"10px", color:"#9a9a9a" }}>Total histórico</div>
                        </div>
                      </div>
                      <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"18px", color:"#e74c3c" }}>-{totalConsum.toLocaleString()}</div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {bitsPromotor > 0 && (
              <div style={{ background:"linear-gradient(135deg,#1a3a2a,#1e4a30)", borderRadius:"16px", padding:"16px", border:"1px solid rgba(39,174,96,0.3)" }}>
                <div style={{ fontSize:"12px", fontWeight:800, color:"#27ae60", marginBottom:"6px" }}>💚 BIT NexoPromotor reembolsables</div>
                <div style={{ fontSize:"12px", color:"#8abba0", fontWeight:600, marginBottom:"14px" }}>Podés solicitar el reembolso de tus {bitsPromotor.toLocaleString()} BIT Promo contra factura A o C.</div>
                <button style={{ width:"100%", background:"linear-gradient(135deg,#27ae60,#1e8449)", border:"none", borderRadius:"10px", padding:"12px", fontSize:"13px", fontWeight:900, color:"#fff", cursor:"pointer", fontFamily:"'Nunito',sans-serif", boxShadow:"0 4px 0 #155a2e" }}>
                  Solicitar reembolso
                </button>
              </div>
            )}

          </div>
        )}

        {/* ═══ CHAT ═══ */}
        {seccion === "chat" && (
          <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
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
              <Campo label="Nombre y apellido" valor={`${personal.nombre}${personal.apellido?" "+personal.apellido:""}`} onChange={v=>{const pts=v.split(" ");setPersonal(p=>({...p,nombre:pts[0]||"",apellido:pts.slice(1).join(" ")}))}} visible={visP.nombre_apellido} onToggle={()=>toggleP("nombre_apellido")} placeholder="Nombre Apellido" />
              <Campo label="WhatsApp" valor={personal.whatsapp} onChange={v=>setPersonal(p=>({...p,whatsapp:v}))} visible={visP.whatsapp} onToggle={()=>toggleP("whatsapp")} placeholder="Ej: 3492123456" icono="📱" />
              <GPS onClick={geolocPersonal} ok={!!personal.lat} label="Geolocalizar mi ubicación" />
              <Campo label="Provincia" valor={personal.provincia} onChange={v=>setPersonal(p=>({...p,provincia:v}))} visible={visP.provincia} onToggle={()=>toggleP("provincia")} placeholder="Ej: Santa Fe" icono="🗺️" />
              <Campo label="Ciudad" valor={personal.ciudad} onChange={v=>setPersonal(p=>({...p,ciudad:v}))} visible={visP.ciudad} onToggle={()=>toggleP("ciudad")} placeholder="Ej: Rosario" icono="🏙️" />
              <Campo label="Barrio" valor={personal.barrio} onChange={v=>setPersonal(p=>({...p,barrio:v}))} visible={visP.barrio} onToggle={()=>toggleP("barrio")} placeholder="Ej: Centro" icono="🏘️" />
              <Campo label="Dirección" valor={personal.direccion} onChange={v=>setPersonal(p=>({...p,direccion:v}))} visible={visP.direccion} onToggle={()=>toggleP("direccion")} placeholder="Calle y número" icono="🏠" />
            </div>

            {esEmpresa ? (
              <div style={{ ...C, border:"2px solid rgba(192,57,43,0.25)" }}>
                <ST color="#c0392b">🏢 Datos de la empresa</ST>
                <Campo label="Nombre de la empresa" valor={emp.nombre_empresa} onChange={v=>setEmp(e=>({...e,nombre_empresa:v}))} visible={visE.nombre_empresa} onToggle={()=>toggleE("nombre_empresa")} placeholder="Nombre comercial" highlight />
                <Campo label="Teléfono fijo" valor={emp.telefono} onChange={v=>setEmp(e=>({...e,telefono:v}))} visible={visE.telefono} onToggle={()=>toggleE("telefono")} placeholder="Ej: 0341-4123456" icono="☎️" />
                <Campo label="WhatsApp empresa" valor={emp.whatsapp_empresa} onChange={v=>setEmp(e=>({...e,whatsapp_empresa:v}))} visible={visE.whatsapp_empresa} onToggle={()=>toggleE("whatsapp_empresa")} placeholder="Ej: 3412345678" icono="📱" />
                <GPS onClick={geolocEmpresa} ok={!!emp.lat_empresa} label="Geolocalizar ubicación comercial" color="#c0392b" />
                <Campo label="Provincia" valor={emp.provincia_empresa} onChange={v=>setEmp(e=>({...e,provincia_empresa:v}))} visible={visE.provincia_empresa} onToggle={()=>toggleE("provincia_empresa")} placeholder="Ej: Santa Fe" icono="🗺️" />
                <Campo label="Ciudad" valor={emp.ciudad_empresa} onChange={v=>setEmp(e=>({...e,ciudad_empresa:v}))} visible={visE.ciudad_empresa} onToggle={()=>toggleE("ciudad_empresa")} placeholder="Ej: Rosario" icono="🏙️" />
                <Campo label="Barrio" valor={emp.barrio_empresa} onChange={v=>setEmp(e=>({...e,barrio_empresa:v}))} visible={visE.barrio_empresa} onToggle={()=>toggleE("barrio_empresa")} placeholder="Ej: Palermo" icono="🏘️" />
                <Campo label="Dirección comercial" valor={emp.direccion_empresa} onChange={v=>setEmp(e=>({...e,direccion_empresa:v}))} visible={visE.direccion_empresa} onToggle={()=>toggleE("direccion_empresa")} placeholder="Calle y número" icono="🏪" highlight />
                <div style={{ borderTop:"1px solid #f0e8e8", paddingTop:"16px", marginTop:"6px" }}>
                  <div style={THS("#c0392b")}>🕐 Horarios de atención</div>
                  <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
                    {DIAS_SEMANA.map(dia => (
                      <FilaHorario key={dia} label={dia} activo={horarios[dia].activo} desde={horarios[dia].desde} hasta={horarios[dia].hasta}
                        onToggle={()=>setHorarios(h=>({...h,[dia]:{...h[dia],activo:!h[dia].activo}}))}
                        onDesde={v=>setHorarios(h=>({...h,[dia]:{...h[dia],desde:v}}))}
                        onHasta={v=>setHorarios(h=>({...h,[dia]:{...h[dia],hasta:v}}))} />
                    ))}
                  </div>
                </div>
                <div style={{ borderTop:"1px solid #f0e8e8", paddingTop:"16px", marginTop:"14px" }}>
                  <div style={THS("#c0392b")}>📅 Feriados nacionales</div>
                  <div style={{ fontSize:"11px", color:"#9a9a9a", fontWeight:600, marginBottom:"12px" }}>Activá los feriados en que abrís</div>
                  <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
                    {Object.entries(FERIADOS_ARG).map(([fecha, nombre]) => {
                      const [dd,mm] = fecha.split("/");
                      const M = ["","Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
                      return (
                        <FilaHorario key={fecha} label={`${dd} ${M[parseInt(mm)]} — ${nombre}`}
                          activo={feriados[fecha]?.activo||false} desde={feriados[fecha]?.desde||"10:00"} hasta={feriados[fecha]?.hasta||"16:00"}
                          onToggle={()=>setFeriados(f=>({...f,[fecha]:{...f[fecha],activo:!f[fecha]?.activo}}))}
                          onDesde={v=>setFeriados(f=>({...f,[fecha]:{...f[fecha],desde:v}}))}
                          onHasta={v=>setFeriados(f=>({...f,[fecha]:{...f[fecha],hasta:v}}))}
                          esFeriado />
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ background:"linear-gradient(135deg, #2c1a1a, #4a2020)", borderRadius:"16px", padding:"20px", textAlign:"center" }}>
                <div style={{ fontSize:"32px", marginBottom:"8px" }}>🏢</div>
                <div style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:"20px", color:"#f0a040", letterSpacing:"1px", marginBottom:"4px" }}>Perfil de empresa</div>
                <div style={{ fontSize:"12px", color:"#e88a8a", fontWeight:600, marginBottom:"16px" }}>Activá tu perfil empresarial con BIT Empresa × 50</div>
                <button onClick={()=>setPopupEmpresa(true)} style={{ background:"linear-gradient(135deg, #c0392b, #e74c3c)", border:"none", borderRadius:"12px", padding:"12px 24px", fontSize:"13px", fontWeight:900, color:"#fff", cursor:"pointer", fontFamily:"'Nunito', sans-serif", letterSpacing:"0.5px" }}>
                  🏢 Comprar Anuncios BIT EMPRESA
                </button>
              </div>
            )}

            <button onClick={guardar} disabled={guardando} style={{ ...BTN, opacity:guardando?0.7:1 }}>
              {guardando ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        )}

        {/* ═══ ESTADÍSTICAS ═══ */}
        {seccion === "estadisticas" && (
          <div style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
            <BitCard titulo="BIT NexoNet" color="#d4a017" disponibles={bitsNexonet} consumidos={bitsGastados} descripcion="BIT de conexión para anuncios y funciones de la plataforma" />
            <BitCard titulo="BIT NexoPromotor" color="#27ae60" disponibles={bitsPromotor} consumidos={promoGastados} descripcion="BIT obtenidos como promotor — reembolsables ante solicitud" reembolsable />
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

            <div style={{ ...C, background:`linear-gradient(135deg, ${insigniaActual.color}15, ${insigniaActual.color}05)`, border:`2px solid ${insigniaActual.color}30` }}>
              <div style={{ fontSize:"11px", fontWeight:800, color:"#9a9a9a", textTransform:"uppercase", letterSpacing:"1px", marginBottom:"14px" }}>🏅 Insignia de reputación</div>
              <div style={{ display:"flex", alignItems:"center", gap:"16px", marginBottom:"14px" }}>
                <div style={{ width:"64px", height:"64px", borderRadius:"50%", background:`${insigniaActual.color}20`, border:`3px solid ${insigniaActual.color}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"32px", flexShrink:0 }}>
                  {insigniaActual.emoji}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:"24px", color:insigniaActual.color, letterSpacing:"1px" }}>{insigniaActual.nombre}</div>
                  <div style={{ fontSize:"11px", fontWeight:700, color:"#9a9a9a" }}>{totalConsum.toLocaleString()} BIT consumidos en total</div>
                  {insigniaSig && <div style={{ fontSize:"10px", color:"#9a9a9a", marginTop:"2px" }}>Próxima: <span style={{ color:insigniaSig.color, fontWeight:800 }}>{insigniaSig.emoji} {insigniaSig.nombre}</span> en {(insigniaSig.min - totalConsum).toLocaleString()} BIT</div>}
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
                {INSIGNIAS.map(ins => {
                  const ok = totalConsum >= ins.min;
                  return (
                    <div key={ins.nombre} style={{ flex:1, textAlign:"center", opacity:ok?1:0.25 }}>
                      <div style={{ fontSize:"18px" }}>{ins.emoji}</div>
                      <div style={{ fontSize:"8px", fontWeight:700, color:ok?ins.color:"#9a9a9a", textTransform:"uppercase", lineHeight:1.2, marginTop:"2px" }}>{ins.nombre.split(" ")[1]||ins.nombre}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={C}>
              <div style={{ fontSize:"11px", fontWeight:800, color:"#9a9a9a", textTransform:"uppercase", letterSpacing:"1px", marginBottom:"14px" }}>⭐ Estrellas ganadas</div>
              <div style={{ display:"flex", alignItems:"center", gap:"16px", marginBottom:"12px" }}>
                <div style={{ width:"64px", height:"64px", borderRadius:"50%", background:"rgba(212,160,23,0.15)", border:"3px solid #d4a017", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"32px", flexShrink:0 }}>⭐</div>
                <div>
                  <div style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:"42px", color:"#d4a017", lineHeight:1 }}>{estrellas.toLocaleString()}</div>
                  <div style={{ fontSize:"11px", fontWeight:700, color:"#9a9a9a" }}>estrellas totales</div>
                </div>
              </div>
              <div style={{ background:"#f9f7f0", borderRadius:"10px", padding:"10px 14px", fontSize:"11px", fontWeight:700, color:"#888", lineHeight:1.7 }}>
                Las estrellas se acumulan por cada BIT NexoNet consumido y por los BIT NexoPromotor ganados · Reflejan tu actividad y reputación en la plataforma
              </div>
            </div>
          </div>
        )}

        {/* ═══ PROMOTOR ═══ */}
        {seccion === "promotor" && (
          <div style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
            <div style={{ background:"linear-gradient(135deg, #1a2a3a, #243b55)", borderRadius:"16px", padding:"24px 20px", textAlign:"center" }}>
              <div style={{ fontSize:"40px", marginBottom:"8px" }}>⭐</div>
              <div style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:"28px", color:"#d4a017", letterSpacing:"2px", marginBottom:"4px" }}>Nexo Promotor</div>
              <div style={{ fontSize:"13px", color:"#8a9aaa", fontWeight:600, marginBottom:"20px" }}>Ganá el 30% por cada referido que se registre</div>
              <div style={{ background:"rgba(212,160,23,0.15)", borderRadius:"12px", padding:"16px", marginBottom:"16px" }}>
                <div style={{ fontSize:"12px", color:"#8a9aaa", fontWeight:600, marginBottom:"4px" }}>Tu código de promotor</div>
                <div style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:"28px", color:"#d4a017", letterSpacing:"4px" }}>{perfil?.codigo||"---"}</div>
              </div>
              <button style={BTN}>Compartir mi código</button>
            </div>
            <div style={C}>
              <ST>📊 Mis referidos</ST>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"10px" }}>
                {[{n:"0",l:"Referidos"},{n:"$0",l:"Ganado"},{n:"0",l:"Este mes"}].map(s=>(
                  <div key={s.l} style={{ textAlign:"center" }}>
                    <div style={{ fontSize:"22px", fontWeight:900, color:"#d4a017" }}>{s.n}</div>
                    <div style={{ fontSize:"11px", fontWeight:700, color:"#666", textTransform:"uppercase" }}>{s.l}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ═══ BÚSQUEDAS AUTOMÁTICAS ═══ */}
        {seccion === "busquedas" && (
          <div style={{ display:"flex", flexDirection:"column", gap:"14px" }}>

            {/* Saldo BIT Búsquedas */}
            <div style={{ background:"linear-gradient(135deg,#0d3d30,#16a085)", borderRadius:"16px",
                           padding:"18px 20px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <div>
                <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"20px", color:"#fff", letterSpacing:"1px" }}>
                  🔍 BIT Búsquedas Automáticas
                </div>
                <div style={{ fontSize:"11px", color:"rgba(255,255,255,0.6)", fontWeight:600, marginTop:"2px" }}>
                  Cada match automático consume 1 BIT tuyo + 1 del anuncio
                </div>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"36px",
                               color: bitsBusq > 0 ? "#7effd4" : "#ff8a80", letterSpacing:"1px" }}>
                  {bitsBusq}
                </div>
                <div style={{ fontSize:"9px", color:"rgba(255,255,255,0.5)", fontWeight:700 }}>disponibles</div>
              </div>
            </div>

            {/* Lista de búsquedas */}
            {busquedas.length === 0 ? (
              <div style={{ background:"#fff", borderRadius:"16px", padding:"40px 20px", textAlign:"center",
                             boxShadow:"0 2px 8px rgba(0,0,0,0.06)" }}>
                <div style={{ fontSize:"40px", marginBottom:"12px" }}>🔍</div>
                <div style={{ fontSize:"15px", fontWeight:800, color:"#1a2a3a", marginBottom:"6px" }}>
                  No tenés búsquedas configuradas
                </div>
                <div style={{ fontSize:"12px", color:"#9a9a9a", fontWeight:600, marginBottom:"20px", lineHeight:1.6 }}>
                  Configurá qué estás buscando y te notificamos automáticamente cuando aparezca un anuncio que matchee
                </div>
              </div>
            ) : (
              busquedas.map((b:any) => (
                <div key={b.id} style={{ background:"#fff", borderRadius:"16px", padding:"16px",
                                          boxShadow:"0 2px 8px rgba(0,0,0,0.06)",
                                          borderLeft: b.activo ? "4px solid #16a085" : "4px solid #ccc" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"10px" }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:"14px", fontWeight:900, color:"#1a2a3a", marginBottom:"4px" }}>
                        {b.titulo || "Sin título"}
                      </div>
                      <div style={{ display:"flex", flexWrap:"wrap", gap:"6px" }}>
                        {b.ciudad && <span style={{ background:"#f0f8f4", color:"#16a085", borderRadius:"8px", padding:"2px 8px", fontSize:"10px", fontWeight:700 }}>📍 {b.ciudad}</span>}
                        {b.precio_min && <span style={{ background:"#fff8e0", color:"#d4a017", borderRadius:"8px", padding:"2px 8px", fontSize:"10px", fontWeight:700 }}>desde ${b.precio_min.toLocaleString()}</span>}
                        {b.precio_max && <span style={{ background:"#fff8e0", color:"#d4a017", borderRadius:"8px", padding:"2px 8px", fontSize:"10px", fontWeight:700 }}>hasta ${b.precio_max.toLocaleString()}</span>}
                        {b.keywords && <span style={{ background:"#f0f0ff", color:"#8e44ad", borderRadius:"8px", padding:"2px 8px", fontSize:"10px", fontWeight:700 }}>🔤 {b.keywords}</span>}
                      </div>
                    </div>
                    <div style={{ display:"flex", gap:"6px", flexShrink:0, marginLeft:"10px" }}>
                      <button onClick={() => setFormBusq(b)}
                        style={{ background:"rgba(212,160,23,0.1)", border:"1px solid rgba(212,160,23,0.3)",
                                 borderRadius:"8px", padding:"6px 10px", fontSize:"12px", fontWeight:800,
                                 color:"#d4a017", cursor:"pointer", fontFamily:"'Nunito',sans-serif" }}>✏️</button>
                      <button onClick={async () => {
                          await supabase.from("busquedas_automaticas").update({ activo: !b.activo }).eq("id", b.id);
                          setBusquedas(prev => prev.map(x => x.id===b.id ? {...x, activo:!b.activo} : x));
                        }}
                        style={{ background: b.activo ? "rgba(231,76,60,0.1)" : "rgba(39,174,96,0.1)",
                                 border: b.activo ? "1px solid rgba(231,76,60,0.3)" : "1px solid rgba(39,174,96,0.3)",
                                 borderRadius:"8px", padding:"6px 10px", fontSize:"12px", fontWeight:800,
                                 color: b.activo ? "#e74c3c" : "#27ae60",
                                 cursor:"pointer", fontFamily:"'Nunito',sans-serif" }}>
                        {b.activo ? "⏸" : "▶️"}
                      </button>
                      <button onClick={async () => {
                          if (!confirm("¿Eliminás esta búsqueda?")) return;
                          await supabase.from("busquedas_automaticas").delete().eq("id", b.id);
                          setBusquedas(prev => prev.filter(x => x.id !== b.id));
                        }}
                        style={{ background:"rgba(231,76,60,0.08)", border:"1px solid rgba(231,76,60,0.2)",
                                 borderRadius:"8px", padding:"6px 10px", fontSize:"12px",
                                 color:"#e74c3c", cursor:"pointer" }}>🗑️</button>
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:"12px", fontSize:"11px", color:"#9a9a9a", fontWeight:600 }}>
                    <span>{b.activo ? "✅ Activa" : "⏸ Pausada"}</span>
                    <span>🔔 {b.notificaciones_recibidas || 0} notificaciones</span>
                  </div>
                </div>
              ))
            )}

            {/* Botón nueva búsqueda */}
            <button onClick={() => setFormBusq({ titulo:"", subrubro_id:"", precio_min:"", precio_max:"", moneda:"ARS", ciudad:"", provincia:"", keywords:"" })}
              style={{ background:"rgba(22,160,133,0.08)", border:"2px dashed rgba(22,160,133,0.4)",
                       borderRadius:"16px", padding:"16px", fontSize:"13px", fontWeight:800,
                       color:"#16a085", cursor:"pointer", fontFamily:"'Nunito',sans-serif",
                       display:"flex", alignItems:"center", justifyContent:"center", gap:"8px" }}>
              ➕ Nueva búsqueda automática
            </button>

            {/* FORM nueva / editar búsqueda */}
            {formBusq !== null && (
              <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.65)", zIndex:400,
                             display:"flex", alignItems:"flex-end" }}
                   onClick={() => setFormBusq(null)}>
                <div style={{ background:"#fff", borderRadius:"24px 24px 0 0", padding:"24px 20px 40px",
                               width:"100%", maxHeight:"90vh", overflowY:"auto",
                               fontFamily:"'Nunito',sans-serif" }}
                     onClick={e => e.stopPropagation()}>

                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"20px" }}>
                    <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"20px", color:"#1a2a3a", letterSpacing:"1px" }}>
                      {formBusq.id ? "✏️ Editar búsqueda" : "🔍 Nueva búsqueda automática"}
                    </div>
                    <button onClick={() => setFormBusq(null)}
                      style={{ background:"#f4f4f2", border:"none", borderRadius:"50%", width:"32px",
                               height:"32px", fontSize:"16px", cursor:"pointer" }}>✕</button>
                  </div>

                  <div style={{ display:"flex", flexDirection:"column", gap:"14px" }}>

                    <div>
                      <label style={LS}>Nombre de la búsqueda</label>
                      <input type="text" value={formBusq.titulo||""} placeholder="Ej: Auto familiar hasta $20M"
                        onChange={e => setFormBusq((f:any) => ({...f, titulo:e.target.value}))}
                        style={IS} />
                    </div>

                    <div>
                      <label style={LS}>Categoría / Subrubro</label>
                      <select value={formBusq.subrubro_id||""}
                        onChange={e => setFormBusq((f:any) => ({...f, subrubro_id:e.target.value}))}
                        style={{...IS, padding:"11px 14px"}}>
                        <option value="">— Cualquier categoría —</option>
                        {subrubros.map((s:any) => (
                          <option key={s.id} value={s.id}>
                            {(s.rubros as any)?.nombre} → {s.nombre}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={LS}>Palabras clave</label>
                      <input type="text" value={formBusq.keywords||""} placeholder="Ej: toyota corolla diesel"
                        onChange={e => setFormBusq((f:any) => ({...f, keywords:e.target.value}))}
                        style={IS} />
                      <div style={{ fontSize:"10px", color:"#9a9a9a", fontWeight:600, marginTop:"4px" }}>
                        Separadas por espacios. El sistema busca en título y descripción.
                      </div>
                    </div>

                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px" }}>
                      <div>
                        <label style={LS}>Precio mínimo</label>
                        <input type="number" value={formBusq.precio_min||""} placeholder="Sin límite"
                          onChange={e => setFormBusq((f:any) => ({...f, precio_min:e.target.value}))}
                          style={IS} />
                      </div>
                      <div>
                        <label style={LS}>Precio máximo</label>
                        <input type="number" value={formBusq.precio_max||""} placeholder="Sin límite"
                          onChange={e => setFormBusq((f:any) => ({...f, precio_max:e.target.value}))}
                          style={IS} />
                      </div>
                    </div>

                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px" }}>
                      <div>
                        <label style={LS}>Ciudad</label>
                        <input type="text" value={formBusq.ciudad||""} placeholder="Ej: Rosario"
                          onChange={e => setFormBusq((f:any) => ({...f, ciudad:e.target.value}))}
                          style={IS} />
                      </div>
                      <div>
                        <label style={LS}>Provincia</label>
                        <input type="text" value={formBusq.provincia||""} placeholder="Ej: Santa Fe"
                          onChange={e => setFormBusq((f:any) => ({...f, provincia:e.target.value}))}
                          style={IS} />
                      </div>
                    </div>

                    <div>
                      <label style={LS}>Moneda</label>
                      <select value={formBusq.moneda||"ARS"}
                        onChange={e => setFormBusq((f:any) => ({...f, moneda:e.target.value}))}
                        style={{...IS, padding:"11px 14px"}}>
                        <option value="ARS">ARS $</option>
                        <option value="USD">USD U$D</option>
                        <option value="">Cualquiera</option>
                      </select>
                    </div>

                    {/* Info costo */}
                    <div style={{ background:"rgba(22,160,133,0.06)", border:"1px solid rgba(22,160,133,0.2)",
                                   borderRadius:"12px", padding:"12px 14px",
                                   fontSize:"12px", fontWeight:600, color:"#555", lineHeight:1.6 }}>
                      🔔 Cada vez que el sistema encuentre un anuncio que matchee con esta búsqueda,
                      recibirás una notificación y se consumirá <strong style={{color:"#16a085"}}>1 BIT</strong> de
                      tu saldo de Búsquedas Automáticas.
                    </div>

                    <button onClick={async () => {
                        const { data:{ session } } = await supabase.auth.getSession();
                        if (!session) return;
                        const payload = {
                          usuario_id:  session.user.id,
                          titulo:      formBusq.titulo || null,
                          subrubro_id: formBusq.subrubro_id ? parseInt(formBusq.subrubro_id) : null,
                          precio_min:  formBusq.precio_min ? parseFloat(formBusq.precio_min) : null,
                          precio_max:  formBusq.precio_max ? parseFloat(formBusq.precio_max) : null,
                          moneda:      formBusq.moneda || null,
                          ciudad:      formBusq.ciudad || null,
                          provincia:   formBusq.provincia || null,
                          keywords:    formBusq.keywords || null,
                          activo:      true,
                        };
                        if (formBusq.id) {
                          await supabase.from("busquedas_automaticas").update(payload).eq("id", formBusq.id);
                          setBusquedas(prev => prev.map(x => x.id===formBusq.id ? {...x,...payload} : x));
                        } else {
                          const { data:nb } = await supabase.from("busquedas_automaticas").insert(payload).select().single();
                          if (nb) setBusquedas(prev => [nb, ...prev]);
                        }
                        setFormBusq(null);
                      }}
                      style={{ background:"linear-gradient(135deg,#16a085,#1abc9c)", border:"none",
                               borderRadius:"14px", padding:"16px", fontSize:"15px", fontWeight:900,
                               color:"#fff", cursor:"pointer", fontFamily:"'Nunito',sans-serif",
                               boxShadow:"0 4px 0 #0e6b59" }}>
                      {formBusq.id ? "💾 Guardar cambios" : "✅ Crear búsqueda"}
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

        {seccion === "grupos" && (
          <div style={{ display:"flex", flexDirection:"column", gap:"12px" }}>
            <div style={{ fontSize:"13px", fontWeight:900, color:"#1a2a3a", textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:"4px" }}>
              👥 Mis grupos ({misGruposData.length})
            </div>
            {misGruposData.length === 0 ? (
              <div style={{ background:"#fff", borderRadius:"16px", padding:"40px 20px", textAlign:"center", boxShadow:"0 2px 8px rgba(0,0,0,0.06)" }}>
                <div style={{ fontSize:"40px", marginBottom:"12px" }}>👥</div>
                <div style={{ fontSize:"15px", fontWeight:800, color:"#1a2a3a", marginBottom:"6px" }}>No estás en ningún grupo</div>
                <div style={{ fontSize:"13px", color:"#9a9a9a", fontWeight:600, marginBottom:"20px" }}>Unite a grupos o creá el tuyo</div>
                <button onClick={()=>router.push("/grupos")} style={{ background:"linear-gradient(135deg,#f0c040,#d4a017)", border:"none", borderRadius:"12px", padding:"12px 24px", fontSize:"13px", fontWeight:900, color:"#1a2a3a", cursor:"pointer", fontFamily:"'Nunito',sans-serif", boxShadow:"0 3px 0 #a07810" }}>
                  🔍 Explorar grupos
                </button>
              </div>
            ) : (
              misGruposData.map((g:any) => (
                <div key={g.id} onClick={()=>router.push(`/grupos/${g.id}`)}
                  style={{ background:"#fff", borderRadius:"16px", overflow:"hidden", boxShadow:"0 2px 8px rgba(0,0,0,0.06)", cursor:"pointer", display:"flex", alignItems:"stretch" }}>
                  <div style={{ width:"80px", flexShrink:0, background:"linear-gradient(135deg,#1a2a3a,#243b55)", display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden", position:"relative" }}>
                    {g.imagen
                      ? <img src={g.imagen} alt={g.nombre} style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
                      : <span style={{ fontSize:"28px", opacity:0.4 }}>{g.categoria_emoji}</span>}
                    <div style={{ position:"absolute", bottom:"4px", left:0, right:0, textAlign:"center" }}>
                      <span style={{ background:g.mi_rol==="creador"?"rgba(212,160,23,0.95)":g.mi_rol==="moderador"?"rgba(100,149,237,0.9)":"rgba(0,168,132,0.85)", borderRadius:"20px", padding:"1px 6px", fontSize:"8px", fontWeight:900, color:g.mi_rol==="creador"?"#1a2a3a":"#fff" }}>
                        {g.mi_rol==="creador"?"👑 Creador":g.mi_rol==="moderador"?"🛡️ Mod":"✅ Miembro"}
                      </span>
                    </div>
                  </div>
                  <div style={{ flex:1, padding:"12px 14px", display:"flex", flexDirection:"column", justifyContent:"space-between" }}>
                    <div>
                      <div style={{ fontSize:"10px", fontWeight:700, color:"#9a9a9a", textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:"2px" }}>
                        {g.categoria_emoji} {g.subcategoria_nombre || g.categoria_nombre}
                      </div>
                      <div style={{ fontSize:"14px", fontWeight:900, color:"#1a2a3a", marginBottom:"4px", overflow:"hidden", whiteSpace:"nowrap", textOverflow:"ellipsis" }}>{g.nombre}</div>
                    </div>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                      <span style={{ fontSize:"11px", color:"#9a9a9a", fontWeight:600 }}>👥 {g.miembros_count} miembro{g.miembros_count!==1?"s":""}</span>
                      <div style={{ display:"flex", gap:"6px", alignItems:"center" }}>
                        {g.mi_estado === "pendiente" && (
                          <span style={{ background:"rgba(230,57,70,0.1)", border:"1px solid rgba(230,57,70,0.3)", borderRadius:"20px", padding:"2px 8px", fontSize:"9px", fontWeight:800, color:"#e63946" }}>⏳ Pendiente</span>
                        )}
                        <span style={{ fontSize:"13px", color:"#d4a017", fontWeight:900 }}>→</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
            <button onClick={()=>router.push("/grupos/crear")} style={{ background:"rgba(212,160,23,0.08)", border:"2px dashed rgba(212,160,23,0.4)", borderRadius:"16px", padding:"16px", fontSize:"13px", fontWeight:800, color:"#d4a017", cursor:"pointer", fontFamily:"'Nunito',sans-serif", display:"flex", alignItems:"center", justifyContent:"center", gap:"8px" }}>
              ➕ Crear nuevo grupo
            </button>
          </div>
        )}
      </div>

      {/* ══ POPUP COMPRAR BIT EMPRESA ══ */}
      {popupEmpresa && (
        <PopupCompra
          titulo="BIT Anuncios — Ampliar plan"
          emoji="📋"
          costo="$1.000 / $3.000 / $10.000"
          descripcion="Ampliá la cantidad de anuncios publicados"
          bits={{ free: bitsFree, nexo: bitsNexonet, promo: bitsPromotor }}
          onClose={() => setPopupEmpresa(false)}
          onPagar={async (metodo: MetodoPago) => {
            setPopupEmpresa(false);
            alert("Próximamente — contactanos para ampliar tu plan");
          }}
        />
      )}

      {/* ══ POPUP CARGAR BIT ══ */}
      {popupBits && (
        <PopupCompra
          titulo="BIT Búsquedas Automáticas"
          emoji="🔍"
          costo="500 BIT / $500"
          descripcion="Recibí notificaciones automáticas cuando aparezca lo que buscás"
          bits={{ free: bitsFree, nexo: bitsNexonet, promo: bitsPromotor }}
          onClose={() => setPopupBits(false)}
          onPagar={async (metodo: MetodoPago) => {
            const paquete = 500;
            if (metodo === "bit_free") {
              await supabase.from("usuarios").update({ bits_free: bitsFree - paquete, bits_busquedas: bitsBusquedas + paquete }).eq("id", perfil.id);
              setPerfil((p: any) => ({ ...p, bits_free: bitsFree - paquete, bits_busquedas: bitsBusquedas + paquete }));
            } else if (metodo === "bit_nexo") {
              await supabase.from("usuarios").update({ bits: bitsNexonet - paquete, bits_busquedas: bitsBusquedas + paquete }).eq("id", perfil.id);
              setPerfil((p: any) => ({ ...p, bits: bitsNexonet - paquete, bits_busquedas: bitsBusquedas + paquete }));
            } else {
              alert("Próximamente — método de pago externo");
            }
            setPopupBits(false);
          }}
        />
      )}

      <BottomNav />
    </main>
  );
}

function DesglosePanel({
  bitsNexonet, bitsGastados, gastAnuncios, gastConexion, gastLink, gastFlash,
  bitsPromotor, promoGastados, promoGanados, promoReembolso,
  bitsFree, freeGastados, bitsBusquedas, gastBusquedas, bitsGrupo, gastGrupo,
}:{
  bitsNexonet:number; bitsGastados:number; gastAnuncios:number; gastConexion:number;
  gastLink:number; gastFlash:number; bitsPromotor:number; promoGastados:number;
  promoGanados:number; promoReembolso:number; bitsFree:number; freeGastados:number;
  bitsBusquedas:number; gastBusquedas:number; bitsGrupo:number; gastGrupo:number;
}) {
  const [exp, setExp] = React.useState<string|null>(null);
  const toggle = (k:string) => setExp(e => e===k ? null : k);

  const filas = [
    {
      key:"nexo", emoji:"💛", color:"#d4a017", label:"BIT NexoNet",
      desc:"Comprados", disp:bitsNexonet, cons:bitsGastados,
      detalle:[
        { l:"Anuncios consumidos",        v:gastAnuncios,  c:"#d4a017" },
        { l:"Conexión consumidos",        v:gastConexion,  c:"#3a7bd5" },
        { l:"Links consumidos",           v:gastLink,      c:"#8e44ad" },
        { l:"Promo Flash consumidos",     v:gastFlash,     c:"#e67e22" },
        { l:"Total disponible",           v:bitsNexonet,   c:"#27ae60" },
      ]
    },
    {
      key:"promo", emoji:"💚", color:"#27ae60", label:"BIT NexoPromotor",
      desc:"Por referidos", disp:bitsPromotor, cons:promoGastados, badge:"Reembolsable",
      detalle:[
        { l:"BIT ganados (total histórico)", v:promoGanados,   c:"#27ae60" },
        { l:"BIT consumidos",                v:promoGastados,  c:"#e74c3c" },
        { l:"BIT disponible para reembolso", v:promoReembolso, c:"#27ae60" },
        { l:"BIT disponible",                v:bitsPromotor,   c:"#27ae60" },
      ]
    },
    {
      key:"free", emoji:"💙", color:"#2980b9", label:"BIT NexoFree",
      desc:"Asignados — Respaldo garantizado", disp:bitsFree, cons:freeGastados,
      detalle:[
        { l:"BIT activos disponibles", v:bitsFree,     c:"#2980b9" },
        { l:"BIT consumidos",          v:freeGastados, c:"#e74c3c" },
      ]
    },
    {
      key:"busq", emoji:"🔍", color:"#16a085", label:"BIT Búsquedas Automáticas",
      desc:"Para recibir matches automáticos", disp:bitsBusquedas, cons:gastBusquedas,
      detalle:[
        { l:"BIT disponibles",  v:bitsBusquedas, c:"#16a085" },
        { l:"BIT consumidos",   v:gastBusquedas, c:"#e74c3c" },
      ]
    },
    {
      key:"grupo", emoji:"👥", color:"#8e44ad", label:"BIT Grupo",
      desc:"Para ingresar o invitar a grupos · $500 BIT c/u", disp:bitsGrupo, cons:gastGrupo,
      detalle:[
        { l:"BIT disponibles",  v:bitsGrupo, c:"#8e44ad" },
        { l:"BIT consumidos",   v:gastGrupo, c:"#e74c3c" },
      ]
    },
  ];

  return (
    <div style={{ background:"#fff", borderRadius:"16px", padding:"16px", boxShadow:"0 2px 12px rgba(0,0,0,0.06)" }}>
      <div style={{ fontSize:"11px", fontWeight:800, color:"#9a9a9a", textTransform:"uppercase", letterSpacing:"1px", marginBottom:"14px" }}>📦 Desglose de BIT</div>
      {filas.map((b, idx) => (
        <div key={b.key}>
          <button onClick={()=>toggle(b.key)}
            style={{ width:"100%", background:"none", border:"none", padding:"10px 0",
                     borderBottom: exp===b.key ? "none" : idx < filas.length-1 ? "1px solid #f0f0f0" : "none",
                     cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"space-between",
                     fontFamily:"'Nunito',sans-serif" }}>
            <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
              <div style={{ width:"36px", height:"36px", borderRadius:"10px", background:`${b.color}18`,
                             display:"flex", alignItems:"center", justifyContent:"center", fontSize:"18px",
                             flexShrink:0 }}>{b.emoji}</div>
              <div style={{ textAlign:"left" }}>
                <div style={{ display:"flex", alignItems:"center", gap:"6px" }}>
                  <div style={{ fontSize:"13px", fontWeight:800, color:"#1a2a3a" }}>{b.label}</div>
                  {b.badge && <span style={{ background:"#e8f8ee", color:"#27ae60", borderRadius:"6px", padding:"1px 6px", fontSize:"9px", fontWeight:800 }}>{b.badge}</span>}
                </div>
                <div style={{ fontSize:"10px", color:"#9a9a9a", fontWeight:600 }}>{b.desc}</div>
              </div>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"20px", color:b.color }}>{b.disp.toLocaleString()}</div>
                <div style={{ fontSize:"10px", color:"#bbb", fontWeight:600 }}>{b.cons.toLocaleString()} usados</div>
              </div>
              <span style={{ fontSize:"16px", color:"#d4a017", transition:"transform .2s",
                             transform: exp===b.key ? "rotate(180deg)" : "rotate(0deg)",
                             display:"inline-block" }}>▾</span>
            </div>
          </button>

          {exp === b.key && (
            <div style={{ background:`${b.color}08`, borderRadius:"12px", padding:"12px 14px",
                           marginBottom:"8px", borderLeft:`3px solid ${b.color}40` }}>
              {b.detalle.map(d => (
                <div key={d.l} style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
                                         padding:"6px 0", borderBottom:"1px solid rgba(0,0,0,0.04)" }}>
                  <span style={{ fontSize:"12px", fontWeight:700, color:"#555" }}>{d.l}</span>
                  <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"18px", color:d.c,
                                  letterSpacing:"1px" }}>{d.v.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function BitCard({ titulo, color, disponibles, consumidos, descripcion, reembolsable, free }:{
  titulo:string; color:string; disponibles:number; consumidos:number;
  descripcion:string; reembolsable?:boolean; free?:boolean;
}) {
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
      {reembolsable && (
        <button style={{ marginTop:"10px", width:"100%", background:`rgba(39,174,96,0.1)`, border:`1px solid rgba(39,174,96,0.3)`, borderRadius:"10px", padding:"10px", fontSize:"12px", fontWeight:800, color:"#27ae60", cursor:"pointer", fontFamily:"'Nunito', sans-serif" }}>
          ♻️ Solicitar reembolso de BIT NexoPromotor
        </button>
      )}
    </div>
  );
}

function ST({ children, color="#1a2a3a" }:{ children:React.ReactNode; color?:string }) {
  return <div style={{ fontSize:"13px", fontWeight:900, color, textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:"16px" }}>{children}</div>;
}
function GPS({ onClick, ok, label, color="#27ae60" }:{ onClick:()=>void; ok:boolean; label:string; color?:string }) {
  return (
    <button onClick={onClick} style={{ width:"100%", background:`${color}12`, border:`2px solid ${color}40`, borderRadius:"10px", padding:"10px 14px", fontSize:"13px", fontWeight:800, color, cursor:"pointer", fontFamily:"'Nunito', sans-serif", textAlign:"left", marginBottom:"14px", display:"flex", alignItems:"center", gap:"6px" }}>
      📍 {label}{ok&&<span style={{ fontSize:"10px", color:"#27ae60", fontWeight:700 }}>✓ detectada</span>}
    </button>
  );
}
function Campo({ label, valor, onChange, visible, onToggle, placeholder, icono, highlight }:{
  label:string; valor:string; onChange:(v:string)=>void;
  visible:boolean; onToggle:()=>void; placeholder?:string; icono?:string; highlight?:boolean;
}) {
  return (
    <div style={{ marginBottom:"14px" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"6px" }}>
        <label style={{ fontSize:"11px", fontWeight:800, color:highlight?"#c0392b":"#666", textTransform:"uppercase", letterSpacing:"1px" }}>{icono&&`${icono} `}{label}</label>
        <button onClick={onToggle} style={{ background:visible?"rgba(212,160,23,0.15)":"#f4f4f2", border:`1px solid ${visible?"#d4a017":"#e8e8e6"}`, borderRadius:"6px", padding:"2px 8px", fontSize:"10px", fontWeight:800, color:visible?"#d4a017":"#9a9a9a", cursor:"pointer", fontFamily:"'Nunito', sans-serif" }}>
          {visible?"👁️ Se ve":"🙈 Oculto"}
        </button>
      </div>
      <input type="text" value={valor} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
        style={{ width:"100%", border:`2px solid ${highlight?"rgba(192,57,43,0.25)":"#e8e8e6"}`, borderRadius:"10px", padding:"11px 14px", fontSize:"14px", fontFamily:"'Nunito', sans-serif", color:"#2c2c2e", outline:"none", boxSizing:"border-box", background:highlight?"rgba(192,57,43,0.02)":"#fff" }} />
    </div>
  );
}
function FilaHorario({ label, activo, desde, hasta, onToggle, onDesde, onHasta, esFeriado }:{
  label:string; activo:boolean; desde:string; hasta:string;
  onToggle:()=>void; onDesde:(v:string)=>void; onHasta:(v:string)=>void; esFeriado?:boolean;
}) {
  const color = esFeriado ? "#c0392b" : "#d4a017";
  return (
    <div style={{ display:"flex", alignItems:"center", gap:"8px", flexWrap:"wrap" }}>
      <button onClick={onToggle} style={{ width:"28px", height:"28px", borderRadius:"8px", flexShrink:0, background:activo?color:"#f4f4f2", border:`2px solid ${activo?color:"#e8e8e6"}`, cursor:"pointer", fontSize:"13px", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:900 }}>
        {activo?"✓":""}
      </button>
      <span style={{ fontSize:"12px", fontWeight:700, color:activo?"#1a2a3a":"#9a9a9a", flex:1, minWidth:"130px" }}>{label}</span>
      {activo ? (
        <div style={{ display:"flex", alignItems:"center", gap:"4px" }}>
          <input type="time" value={desde} onChange={e=>onDesde(e.target.value)} style={{ border:"2px solid #e8e8e6", borderRadius:"8px", padding:"4px 6px", fontSize:"12px", fontFamily:"'Nunito', sans-serif", outline:"none", color:"#1a2a3a" }} />
          <span style={{ fontSize:"11px", color:"#9a9a9a" }}>a</span>
          <input type="time" value={hasta} onChange={e=>onHasta(e.target.value)} style={{ border:"2px solid #e8e8e6", borderRadius:"8px", padding:"4px 6px", fontSize:"12px", fontFamily:"'Nunito', sans-serif", outline:"none", color:"#1a2a3a" }} />
        </div>
      ) : (
        <span style={{ fontSize:"11px", color:"#9a9a9a", fontWeight:600 }}>{esFeriado?"Cerrado":"No disponible"}</span>
      )}
    </div>
  );
}

const LS:React.CSSProperties = { display:"block", fontSize:"11px", fontWeight:800, color:"#666", textTransform:"uppercase" as const, letterSpacing:"1px", marginBottom:"6px" };
const IS:React.CSSProperties = { width:"100%", border:"2px solid #e8e8e6", borderRadius:"10px", padding:"11px 14px", fontSize:"14px", fontFamily:"'Nunito',sans-serif", color:"#2c2c2e", outline:"none", boxSizing:"border-box" as const };
const C:React.CSSProperties  = { background:"#fff", borderRadius:"16px", padding:"20px", boxShadow:"0 2px 10px rgba(0,0,0,0.06)" };
const BTN:React.CSSProperties = { width:"100%", background:"linear-gradient(135deg, #d4a017, #f0c040)", color:"#1a2a3a", border:"none", borderRadius:"12px", padding:"16px", fontSize:"15px", fontWeight:800, fontFamily:"'Nunito', sans-serif", cursor:"pointer", letterSpacing:"1px", textTransform:"uppercase" };
const THS = (c:string):React.CSSProperties => ({ fontSize:"12px", fontWeight:900, color:c, textTransform:"uppercase", letterSpacing:"1px", marginBottom:"12px" });
