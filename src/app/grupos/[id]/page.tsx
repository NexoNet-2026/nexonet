"use client";
import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/lib/supabase";
import PopupAccesoGrupo from "@/components/PopupAccesoGrupo";

// ── Tipos ─────────────────────────────────────────────────────────────────────
type Config = {
  ver_miembros_detalle: boolean;
  pestanas_publicas: string[];
  miembros_pueden_invitar: boolean;
  canon_gratis_por_defecto: boolean;
  residentes_campos_publicos?: string[];
};
type Grupo = {
  id:number; nombre:string; descripcion:string; imagen:string; ciudad:string; provincia:string;
  tipo:"abierto"|"cerrado"; miembros_count:number; categoria_nombre:string; subcategoria_nombre:string;
  reglas:string; links:string[]; whatsapp_link:string; creador_id:string; config:Config;
  especial_titulo:string; especial_contenido:string; especial_imagenes:string[];
};
type Miembro    = { id:number; usuario_id:string; rol:string; estado:string; canon_gratis:boolean; bits_grupo:boolean; bits_grupo_hasta:string|null; nombre_usuario:string; };
type Mensaje    = { id:number; usuario_id:string; texto:string; created_at:string; nombre_usuario:string; };
type Publi      = { id:number; usuario_id:string; titulo:string; descripcion:string; imagenes:string[]; precio:number; moneda:string; tipo:string; created_at:string; nombre_usuario:string; };
type Residente  = { id:number; nombre:string; unidad:string; piso:string; telefono:string; email:string; vehiculo:string; personas:number; estado_cuota:string; notas:string; usuario_id:string|null; };
type Servicio   = { id:number; titulo:string; descripcion:string; tipo:string; archivo_url:string; items:any[]; };
type Proveedor  = { id:number; nombre:string; rubro:string; telefono:string; email:string; notas:string; estado:string; };
type Evento     = { id:number; titulo:string; descripcion:string; fecha:string; lugar:string; imagen:string; };
type Plano      = { id:number; titulo:string; imagen_url:string; descripcion:string; };
type PromoFlash = { id:number; titulo:string; descripcion:string; precio:number; moneda:string; imagenes:string[]; ciudad:string; };
type Usuario    = { id:string; nombre_usuario:string; };

const SUBCATS_CONSORCIO = ["Edificios","Barrios Privados","Condominios"];
const TABS_SOLO_MOD     = ["panel_admin"];
const TABS_BIT          = ["chat","anuncios"];

const TABS_GENERIC = [
  {id:"info",       label:"📋 Info"},
  {id:"chat",       label:"💬 Chat"},
  {id:"miembros",   label:"👥 Miembros"},
  {id:"anuncios",   label:"📢 Anuncios"},
  {id:"especial",   label:"⭐ Especial"},
  {id:"reglas",     label:"📌 Reglas"},
  {id:"links",      label:"🔗 Links"},
  {id:"publico",    label:"🌐 Público"},
  {id:"moderador",  label:"🛡️ Mod"},
];
const TABS_CONSORCIO_BASE = [
  {id:"residentes", label:"👥 Residentes"},
  {id:"servicios",  label:"🔧 Servicios"},
  {id:"proveedores",label:"🏪 Proveedores"},
  {id:"eventos",    label:"📅 Eventos"},
  {id:"chat",       label:"💬 Chat"},
  {id:"promos",     label:"⚡ Promos"},
  {id:"panel_usuario", label:"⚙️ Mi panel"},
  {id:"panel_admin",   label:"🛡️ Admin"},
];
const TABS_EXTRA: Record<string,{id:string;label:string}[]> = {
  "Barrios Privados": [{id:"mapa",  label:"🗺️ Mapa"}],
  "Condominios":      [{id:"plano", label:"📐 Plano"}],
};

// ── COMPONENTES PEQUEÑOS ──────────────────────────────────────────────────────
function Card({titulo,children,accion}:{titulo:string;children:React.ReactNode;accion?:React.ReactNode}) {
  return(
    <div style={{background:"#fff",borderRadius:"14px",padding:"16px",boxShadow:"0 2px 8px rgba(0,0,0,0.06)",marginBottom:"12px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"12px"}}>
        <div style={{fontSize:"12px",fontWeight:800,color:"#9a9a9a",textTransform:"uppercase",letterSpacing:"0.5px"}}>{titulo}</div>
        {accion}
      </div>
      {children}
    </div>
  );
}
function Tog({label,sub,val,onChange}:{label:string;sub:string;val:boolean;onChange:(v:boolean)=>void}) {
  return(
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"7px 0",borderBottom:"1px solid #f5f5f5"}}>
      <div><div style={{fontSize:"13px",fontWeight:800,color:"#1a2a3a"}}>{label}</div><div style={{fontSize:"11px",color:"#9a9a9a",fontWeight:600}}>{sub}</div></div>
      <button onClick={()=>onChange(!val)} style={{width:"44px",height:"24px",borderRadius:"12px",border:"none",background:val?"#d4a017":"#e0e0e0",position:"relative",cursor:"pointer",flexShrink:0}}>
        <div style={{width:"18px",height:"18px",borderRadius:"50%",background:"#fff",position:"absolute",top:"3px",left:val?"23px":"3px",transition:"left .2s",boxShadow:"0 1px 3px rgba(0,0,0,0.2)"}}/>
      </button>
    </div>
  );
}
function Btn({children,onClick,disabled,full,small,outline}:{children:React.ReactNode;onClick?:()=>void;disabled?:boolean;full?:boolean;small?:boolean;outline?:boolean}) {
  return(
    <button onClick={onClick} disabled={disabled} style={{
      width:full?"100%":undefined,background:outline?"transparent":disabled?"#f0f0f0":"linear-gradient(135deg,#f0c040,#d4a017)",
      border:outline?"2px solid #d4a017":"none",borderRadius:"12px",padding:small?"7px 14px":"12px 20px",
      fontSize:small?"12px":"14px",fontWeight:900,color:outline?"#d4a017":disabled?"#bbb":"#1a2a3a",
      cursor:disabled?"not-allowed":"pointer",fontFamily:"'Nunito',sans-serif",
      boxShadow:(!disabled&&!outline)?"0 3px 0 #a07810":"none",
    }}>{children}</button>
  );
}
const cuotaColor = (e:string) => e==="al_dia"?"#00a884":e==="debe"?"#e63946":"#9a9a9a";
const cuotaLabel = (e:string) => e==="al_dia"?"✅ Al día":e==="debe"?"⚠️ Debe":"🔵 Exento";
const fmtF = (d:string) => new Date(d).toLocaleDateString("es-AR",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"});
const fmtFecha = (d:string) => new Date(d).toLocaleDateString("es-AR",{weekday:"short",day:"2-digit",month:"long",hour:"2-digit",minute:"2-digit"});
const fmt = (p:number,m:string) => !p?"Consultar":`${m==="USD"?"U$D":"$"} ${p.toLocaleString("es-AR")}`;

// ── PÁGINA PRINCIPAL ──────────────────────────────────────────────────────────
export default function GrupoDetalle() {
  const { id } = useParams<{id:string}>();
  const router  = useRouter();
  const gId     = parseInt(id);

  const [tab,        setTab]        = useState("info");
  const [grupo,      setGrupo]      = useState<Grupo|null>(null);
  const [miembros,   setMiembros]   = useState<Miembro[]>([]);
  const [mensajes,   setMensajes]   = useState<Mensaje[]>([]);
  const [publis,     setPublis]     = useState<Publi[]>([]);
  const [residentes, setResidentes] = useState<Residente[]>([]);
  const [servicios,  setServicios]  = useState<Servicio[]>([]);
  const [proveedores,setProveedores]= useState<Proveedor[]>([]);
  const [eventos,    setEventos]    = useState<Evento[]>([]);
  const [planos,     setPlanos]     = useState<Plano[]>([]);
  const [promos,     setPromos]     = useState<PromoFlash[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [session,    setSession]    = useState<any>(null);
  const [miMembro,   setMiMembro]   = useState<Miembro|null>(null);
  const [nuevoMsg,   setNuevoMsg]   = useState("");
  const [enviando,   setEnviando]   = useState(false);
  const [popupBit,   setPopupBit]   = useState(false);
  const [popupPub,   setPopupPub]   = useState(false);
  const [nuevaPub,   setNuevaPub]   = useState({titulo:"",descripcion:"",precio:"",moneda:"ARS",tipo:"interna"});
  const [busqInv,    setBusqInv]    = useState("");
  const [resInv,     setResInv]     = useState<Usuario[]>([]);
  const [buscando,   setBuscando]   = useState(false);
  const [canonGratis,setCanonGratis]= useState(true);
  const [msgInv,     setMsgInv]     = useState("¡Te invito a unirte!");
  const [configEdit, setConfigEdit] = useState<Config|null>(null);
  const [guardando,  setGuardando]  = useState(false);
  // Formularios consorcio
  const [popupRes,   setPopupRes]   = useState(false);
  const [popupSvc,   setPopupSvc]   = useState(false);
  const [popupProv,  setPopupProv]  = useState(false);
  const [popupEvt,   setPopupEvt]   = useState(false);
  const [nuevoRes,   setNuevoRes]   = useState({nombre:"",unidad:"",piso:"",telefono:"",email:"",vehiculo:"",personas:"1",estado_cuota:"al_dia",notas:""});
  const [nuevoSvc,   setNuevoSvc]   = useState({titulo:"",descripcion:"",tipo:"listado"});
  const [nuevoProv,  setNuevoProv]  = useState({nombre:"",rubro:"",telefono:"",email:"",notas:"",estado:"habilitado"});
  const [nuevoEvt,   setNuevoEvt]   = useState({titulo:"",descripcion:"",fecha:"",lugar:""});
  const chatRef = useRef<HTMLDivElement>(null);

  // ── Carga inicial ────────────────────────────────────────────────────────────
  useEffect(()=>{
    supabase.auth.getSession().then(({data:{session:s}})=>setSession(s));
    Promise.all([
      supabase.from("grupos").select(`id,nombre,descripcion,imagen,ciudad,provincia,tipo,miembros_count,reglas,links,whatsapp_link,creador_id,config,especial_titulo,especial_contenido,especial_imagenes,grupo_categorias(nombre),grupo_subcategorias(nombre)`).eq("id",gId).single(),
      supabase.from("grupo_miembros").select("id,usuario_id,rol,estado,canon_gratis,bits_grupo,bits_grupo_hasta,usuarios(nombre_usuario)").eq("grupo_id",gId),
      supabase.from("grupo_publicaciones").select("id,usuario_id,titulo,descripcion,imagenes,precio,moneda,tipo,created_at,usuarios(nombre_usuario)").eq("grupo_id",gId).order("created_at",{ascending:false}),
    ]).then(([{data:gData},{data:mData},{data:pData}])=>{
      if(gData){
        const g:Grupo={...gData,categoria_nombre:(gData as any).grupo_categorias?.nombre||"",subcategoria_nombre:(gData as any).grupo_subcategorias?.nombre||"",config:gData.config||{ver_miembros_detalle:false,pestanas_publicas:["info","publico"],miembros_pueden_invitar:false,canon_gratis_por_defecto:true}};
        setGrupo(g); setConfigEdit({...g.config}); setCanonGratis(g.config.canon_gratis_por_defecto);
        // Si es consorcio, cargar datos específicos
        if(SUBCATS_CONSORCIO.includes((gData as any).grupo_subcategorias?.nombre||"")) cargarConsorcio(gData.ciudad);
      }
      if(mData) setMiembros(mData.map((m:any)=>({...m,nombre_usuario:m.usuarios?.nombre_usuario||"Usuario"})));
      if(pData) setPublis(pData.map((p:any)=>({...p,nombre_usuario:p.usuarios?.nombre_usuario||"Usuario"})));
      setLoading(false);
    });
  },[gId]);

  const cargarConsorcio = async(ciudad:string)=>{
    const [r,s,p,e,pl] = await Promise.all([
      supabase.from("grupo_residentes").select("*").eq("grupo_id",gId).order("unidad"),
      supabase.from("grupo_servicios").select("*").eq("grupo_id",gId).order("orden"),
      supabase.from("grupo_proveedores").select("*").eq("grupo_id",gId).order("nombre"),
      supabase.from("grupo_eventos").select("*").eq("grupo_id",gId).order("fecha"),
      supabase.from("grupo_planos").select("*").eq("grupo_id",gId),
    ]);
    if(r.data) setResidentes(r.data);
    if(s.data) setServicios(s.data);
    if(p.data) setProveedores(p.data);
    if(e.data) setEventos(e.data);
    if(pl.data) setPlanos(pl.data);
    // Promos flash por ciudad
    if(ciudad){
      const {data:prData}=await supabase.from("anuncios").select("id,titulo,descripcion,precio,moneda,imagenes,ciudad").eq("flash",true).eq("ciudad",ciudad).eq("estado","activo").order("created_at",{ascending:false}).limit(20);
      if(prData) setPromos(prData);
    }
  };

  useEffect(()=>{
    if(!session||miembros.length===0) return;
    setMiMembro(miembros.find(x=>x.usuario_id===session.user.id)||null);
  },[session,miembros]);

  // ── Chat realtime ─────────────────────────────────────────────────────────
  useEffect(()=>{
    if(tab!=="chat") return;
    supabase.from("grupo_mensajes").select("id,usuario_id,texto,created_at,usuarios(nombre_usuario)").eq("grupo_id",gId).order("created_at",{ascending:true}).limit(100)
      .then(({data})=>{ if(data) setMensajes(data.map((m:any)=>({...m,nombre_usuario:m.usuarios?.nombre_usuario||"Usuario"}))); });
    const canal=supabase.channel(`chat-g-${gId}`)
      .on("postgres_changes",{event:"INSERT",schema:"public",table:"grupo_mensajes",filter:`grupo_id=eq.${gId}`},
        async(payload)=>{
          const {data:u}=await supabase.from("usuarios").select("nombre_usuario").eq("id",payload.new.usuario_id).single();
          setMensajes(p=>[...p,{...payload.new as any,nombre_usuario:u?.nombre_usuario||"Usuario"}]);
        }).subscribe();
    return()=>{ supabase.removeChannel(canal); };
  },[tab,gId]);
  useEffect(()=>{ if(chatRef.current) chatRef.current.scrollTop=chatRef.current.scrollHeight; },[mensajes]);

  // ── Lógica ───────────────────────────────────────────────────────────────
  const esConsorcio = grupo ? SUBCATS_CONSORCIO.includes(grupo.subcategoria_nombre) : false;
  const esMod       = miMembro?.rol==="creador"||miMembro?.rol==="moderador";
  const esMiembro   = !!miMembro;
  const tieneBit    = miMembro?.bits_grupo===true&&(!miMembro.bits_grupo_hasta||new Date(miMembro.bits_grupo_hasta)>new Date());
  const config      = grupo?.config||{ver_miembros_detalle:false,pestanas_publicas:["info","publico"],miembros_pueden_invitar:false,canon_gratis_por_defecto:true};

  const tabsDisponibles = () => {
    if(!grupo) return [];
    if(esConsorcio){
      const base = [...TABS_CONSORCIO_BASE];
      const extra = TABS_EXTRA[grupo.subcategoria_nombre]||[];
      const todos = [...base,...extra];
      return todos.filter(t=> t.id==="panel_admin" ? esMod : true);
    }
    return TABS_GENERIC.filter(t=> t.id==="moderador" ? esMod : true);
  };

  const tabBloqueado = (t:string) => {
    if(!esMiembro&&!["info","publico","promos"].includes(t)) return true;
    if(TABS_BIT.includes(t)&&!tieneBit) return true;
    return false;
  };

  const handleTab = (t:string)=>{
    if(tabBloqueado(t)){ if(TABS_BIT.includes(t)) setPopupBit(true); return; }
    setTab(t);
  };

  const enviarMensaje = async()=>{
    if(!nuevoMsg.trim()||!session||enviando) return;
    setEnviando(true);
    await supabase.from("grupo_mensajes").insert({grupo_id:gId,usuario_id:session.user.id,texto:nuevoMsg.trim()});
    setNuevoMsg(""); setEnviando(false);
  };

  const publicar = async()=>{
    if(!nuevaPub.titulo.trim()||!session) return;
    const {data}=await supabase.from("grupo_publicaciones").insert({grupo_id:gId,usuario_id:session.user.id,...nuevaPub,precio:parseFloat(nuevaPub.precio)||0}).select().single();
    if(data){ setPublis(p=>[{...data,nombre_usuario:"Vos"},...p]); setNuevaPub({titulo:"",descripcion:"",precio:"",moneda:"ARS",tipo:"interna"}); setPopupPub(false); }
  };

  const buscarUsuario=async()=>{
    if(!busqInv.trim()) return; setBuscando(true);
    const {data}=await supabase.from("usuarios").select("id,nombre_usuario").ilike("nombre_usuario",`%${busqInv}%`).limit(8);
    const ids=new Set(miembros.map(m=>m.usuario_id));
    setResInv((data||[]).filter((u:any)=>!ids.has(u.id))); setBuscando(false);
  };
  const invitar=async(u:Usuario)=>{
    if(!session) return;
    const {error}=await supabase.from("grupo_invitaciones").insert({grupo_id:gId,invitador_id:session.user.id,invitado_id:u.id,canon_gratis:canonGratis,mensaje:msgInv,estado:"pendiente"});
    if(!error){ alert(`✅ Invitación enviada a ${u.nombre_usuario}`); setResInv([]); setBusqInv(""); }
    else if(error.code==="23505") alert("Ya existe una invitación pendiente.");
  };
  const aprobar=(m:Miembro)=>{ supabase.from("grupo_miembros").update({estado:"activo"}).eq("id",m.id).then(()=>setMiembros(p=>p.map(x=>x.id===m.id?{...x,estado:"activo"}:x))); };
  const cambiarRol=(m:Miembro,rol:string)=>{ supabase.from("grupo_miembros").update({rol}).eq("id",m.id).then(()=>setMiembros(p=>p.map(x=>x.id===m.id?{...x,rol}:x))); };
  const guardarConfig=async()=>{ if(!configEdit) return; setGuardando(true); await supabase.from("grupos").update({config:configEdit}).eq("id",gId); setGrupo(g=>g?{...g,config:configEdit}:g); setGuardando(false); alert("Configuración guardada ✅"); };

  // Consorcio: guardar
  const guardarResidente=async()=>{
    const {data}=await supabase.from("grupo_residentes").insert({grupo_id:gId,...nuevoRes,personas:parseInt(nuevoRes.personas)||1}).select().single();
    if(data){ setResidentes(p=>[...p,data]); setNuevoRes({nombre:"",unidad:"",piso:"",telefono:"",email:"",vehiculo:"",personas:"1",estado_cuota:"al_dia",notas:""}); setPopupRes(false); }
  };
  const guardarServicio=async()=>{
    const {data}=await supabase.from("grupo_servicios").insert({grupo_id:gId,...nuevoSvc,items:[]}).select().single();
    if(data){ setServicios(p=>[...p,data]); setNuevoSvc({titulo:"",descripcion:"",tipo:"listado"}); setPopupSvc(false); }
  };
  const guardarProveedor=async()=>{
    const {data}=await supabase.from("grupo_proveedores").insert({grupo_id:gId,...nuevoProv}).select().single();
    if(data){ setProveedores(p=>[...p,data]); setNuevoProv({nombre:"",rubro:"",telefono:"",email:"",notas:"",estado:"habilitado"}); setPopupProv(false); }
  };
  const guardarEvento=async()=>{
    const {data}=await supabase.from("grupo_eventos").insert({grupo_id:gId,...nuevoEvt}).select().single();
    if(data){ setEventos(p=>[...p,data]); setNuevoEvt({titulo:"",descripcion:"",fecha:"",lugar:""}); setPopupEvt(false); }
  };
  const toggleEstadoProveedor=async(prov:Proveedor)=>{
    const nuevoEstado=prov.estado==="habilitado"?"no_habilitado":"habilitado";
    await supabase.from("grupo_proveedores").update({estado:nuevoEstado}).eq("id",prov.id);
    setProveedores(p=>p.map(x=>x.id===prov.id?{...x,estado:nuevoEstado}:x));
  };
  const actualizarCuota=async(res:Residente,estado:string)=>{
    await supabase.from("grupo_residentes").update({estado_cuota:estado}).eq("id",res.id);
    setResidentes(p=>p.map(x=>x.id===res.id?{...x,estado_cuota:estado}:x));
  };
  const unirse=()=>{
    if(!session){ router.push("/login"); return; }
    setPopupAcceso(true);
  };
  const [popupAcceso, setPopupAcceso] = useState(false);

  const camposPublicos = config.residentes_campos_publicos||["nombre","unidad","estado_cuota"];

  if(loading) return(<main style={{paddingTop:"95px",fontFamily:"'Nunito',sans-serif"}}><Header/><div style={{textAlign:"center",padding:"60px",color:"#9a9a9a",fontWeight:700}}>Cargando...</div><BottomNav/></main>);
  if(!grupo)  return(<main style={{paddingTop:"95px",fontFamily:"'Nunito',sans-serif"}}><Header/><div style={{textAlign:"center",padding:"60px"}}><div style={{fontSize:"40px"}}>❌</div><div style={{fontWeight:800,color:"#1a2a3a",marginTop:"12px"}}>Grupo no encontrado</div></div><BottomNav/></main>);

  const pendientes=miembros.filter(m=>m.estado==="pendiente");

  return(
    <main style={{paddingTop:"95px",paddingBottom:"130px",background:"#f4f4f2",minHeight:"100vh",fontFamily:"'Nunito',sans-serif"}}>
      <Header/>

      {/* ── CABECERA ── */}
      <div style={{background:"linear-gradient(135deg,#1a2a3a,#243b55)"}}>
        <div style={{width:"100%",height:"130px",overflow:"hidden",position:"relative"}}>
          {grupo.imagen?<img src={grupo.imagen} alt={grupo.nombre} style={{width:"100%",height:"100%",objectFit:"cover",opacity:0.4}}/>
          :<div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"55px",opacity:0.2}}>👥</div>}
          <div style={{position:"absolute",inset:0,background:"linear-gradient(to bottom,transparent 20%,rgba(26,42,58,0.97))"}}/>
          <div style={{position:"absolute",bottom:"12px",left:"16px",right:"16px"}}>
            <div style={{fontSize:"19px",fontWeight:900,color:"#fff",lineHeight:1.2,marginBottom:"4px"}}>{grupo.nombre}</div>
            <div style={{display:"flex",gap:"5px",flexWrap:"wrap"}}>
              <span style={{background:grupo.tipo==="cerrado"?"rgba(230,57,70,0.8)":"rgba(0,168,132,0.8)",borderRadius:"20px",padding:"2px 9px",fontSize:"10px",fontWeight:800,color:"#fff"}}>{grupo.tipo==="cerrado"?"🔒":"🔓"} {grupo.tipo}</span>
              {grupo.subcategoria_nombre&&<span style={{background:"rgba(212,160,23,0.85)",borderRadius:"20px",padding:"2px 9px",fontSize:"10px",fontWeight:800,color:"#1a2a3a"}}>{grupo.subcategoria_nombre}</span>}
              {grupo.ciudad&&<span style={{background:"rgba(255,255,255,0.15)",borderRadius:"20px",padding:"2px 9px",fontSize:"10px",fontWeight:700,color:"#ddd"}}>📍 {grupo.ciudad}</span>}
            </div>
          </div>
        </div>
        <div style={{padding:"10px 16px 14px",display:"flex",gap:"8px"}}>
          {!esMiembro
            ?<button onClick={unirse} style={{flex:1,background:"linear-gradient(135deg,#f0c040,#d4a017)",border:"none",borderRadius:"12px",padding:"11px",fontSize:"13px",fontWeight:900,color:"#1a2a3a",cursor:"pointer",fontFamily:"'Nunito',sans-serif",boxShadow:"0 3px 0 #a07810"}}>
               {grupo.tipo==="cerrado"?"🔒 Solicitar acceso":"✅ Unirse al grupo"}
             </button>
            :<div style={{flex:1,background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:"12px",padding:"10px",fontSize:"12px",fontWeight:700,color:"#d4a017",textAlign:"center"}}>
               ✅ Miembro{miMembro?.rol==="creador"?" · 👑 Creador":miMembro?.rol==="moderador"?" · 🛡️ Mod":""}{tieneBit?" · 🏆 BIT":""}</div>}
          {grupo.whatsapp_link&&<a href={grupo.whatsapp_link} target="_blank" rel="noreferrer" style={{background:"#25d366",border:"none",borderRadius:"12px",padding:"0 16px",fontSize:"20px",cursor:"pointer",textDecoration:"none",display:"flex",alignItems:"center"}}>📱</a>}
        </div>
      </div>

      {/* ── TABS ── */}
      <div style={{background:"#fff",borderBottom:"2px solid #f0f0f0",overflowX:"auto",scrollbarWidth:"none",display:"flex"}}>
        {tabsDisponibles().map(t=>{
          const bloq=tabBloqueado(t.id);
          return(
            <button key={t.id} onClick={()=>handleTab(t.id)} style={{flexShrink:0,padding:"11px 13px",border:"none",background:"none",fontSize:"11px",fontWeight:tab===t.id?900:600,color:tab===t.id?"#d4a017":bloq?"#ccc":"#2c2c2e",borderBottom:tab===t.id?"3px solid #d4a017":"3px solid transparent",cursor:"pointer",fontFamily:"'Nunito',sans-serif",whiteSpace:"nowrap"}}>
              {t.label}{bloq?" 🔒":""}{t.id==="panel_admin"&&pendientes.length>0?<span style={{background:"#e63946",color:"#fff",fontSize:"9px",fontWeight:900,padding:"1px 5px",borderRadius:"10px",marginLeft:"4px"}}>{pendientes.length}</span>:""}
            </button>
          );
        })}
      </div>

      {/* ── CONTENIDO ── */}
      <div style={{padding:"16px"}}>

        {/* INFO (genérico y consorcio) */}
        {tab==="info"&&(
          <div>
            {grupo.descripcion&&<Card titulo="📋 Descripción"><div style={{fontSize:"14px",color:"#2c2c2e",fontWeight:600,lineHeight:1.6}}>{grupo.descripcion}</div></Card>}
            <Card titulo="📊 Datos">
              {[{l:"Tipo",v:grupo.subcategoria_nombre||grupo.categoria_nombre||"—"},{l:"Miembros",v:`${grupo.miembros_count}`},{l:"Acceso",v:grupo.tipo==="cerrado"?"🔒 Cerrado":"🔓 Abierto"},{l:"Ciudad",v:grupo.ciudad||"—"}]
                .map((r,i,a)=><div key={i} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:i<a.length-1?"1px solid #f5f5f5":"none"}}><span style={{fontSize:"13px",fontWeight:700,color:"#9a9a9a"}}>{r.l}</span><span style={{fontSize:"13px",fontWeight:800,color:"#1a2a3a"}}>{r.v}</span></div>)}
            </Card>
            {!tieneBit&&esMiembro&&(
              <div style={{background:"linear-gradient(135deg,#1a2a3a,#243b55)",borderRadius:"14px",padding:"16px",textAlign:"center"}}>
                <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"20px",color:"#f0c040",letterSpacing:"1px",marginBottom:"6px"}}>🏆 BIT Grupo — $500/30d</div>
                <div style={{fontSize:"12px",color:"#8a9aaa",fontWeight:600,marginBottom:"12px"}}>Chat interno y anuncios exclusivos</div>
                <Btn onClick={()=>setPopupBit(true)}>⚡ Activar BIT</Btn>
              </div>
            )}
          </div>
        )}

        {/* ── TABS CONSORCIO ── */}

        {/* RESIDENTES */}
        {tab==="residentes"&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"12px"}}>
              <div><span style={{fontSize:"15px",fontWeight:900,color:"#1a2a3a"}}>👥 Residentes</span><span style={{fontSize:"12px",color:"#9a9a9a",fontWeight:700,marginLeft:"8px"}}>{residentes.length} unidades</span></div>
              {esMod&&<Btn small onClick={()=>setPopupRes(true)}>➕ Agregar</Btn>}
            </div>
            {/* Resumen cuotas */}
            {esMod&&(
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"8px",marginBottom:"12px"}}>
                {[{l:"Al día",v:residentes.filter(r=>r.estado_cuota==="al_dia").length,c:"#00a884"},{l:"Deben",v:residentes.filter(r=>r.estado_cuota==="debe").length,c:"#e63946"},{l:"Exentos",v:residentes.filter(r=>r.estado_cuota==="exento").length,c:"#9a9a9a"}]
                  .map((s,i)=><div key={i} style={{background:"#fff",borderRadius:"12px",padding:"12px",textAlign:"center",boxShadow:"0 2px 6px rgba(0,0,0,0.06)"}}><div style={{fontSize:"20px",fontWeight:900,color:s.c}}>{s.v}</div><div style={{fontSize:"11px",fontWeight:700,color:"#9a9a9a"}}>{s.l}</div></div>)}
              </div>
            )}
            {residentes.length===0?<div style={{textAlign:"center",padding:"40px",color:"#9a9a9a",fontSize:"13px"}}>Sin residentes cargados aún.</div>:
              residentes.map((r,i)=>{
                const camposVis = esMod?["nombre","unidad","piso","telefono","email","vehiculo","personas","estado_cuota","notas"]:camposPublicos;
                return(
                  <div key={i} style={{background:"#fff",borderRadius:"14px",padding:"14px 16px",boxShadow:"0 2px 6px rgba(0,0,0,0.06)",marginBottom:"8px"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"8px"}}>
                      <div>
                        {camposVis.includes("nombre")&&<div style={{fontSize:"15px",fontWeight:900,color:"#1a2a3a"}}>{r.nombre}</div>}
                        {camposVis.includes("unidad")&&<div style={{fontSize:"12px",fontWeight:700,color:"#9a9a9a"}}>Unidad {r.unidad}{r.piso?` · Piso ${r.piso}`:""}</div>}
                      </div>
                      {camposVis.includes("estado_cuota")&&(
                        esMod?(
                          <select value={r.estado_cuota} onChange={e=>actualizarCuota(r,e.target.value)} style={{border:`2px solid ${cuotaColor(r.estado_cuota)}`,borderRadius:"8px",padding:"4px 8px",fontSize:"11px",fontWeight:800,color:cuotaColor(r.estado_cuota),background:"#fff",fontFamily:"'Nunito',sans-serif",cursor:"pointer",outline:"none"}}>
                            <option value="al_dia">✅ Al día</option>
                            <option value="debe">⚠️ Debe</option>
                            <option value="exento">🔵 Exento</option>
                          </select>
                        ):<span style={{background:`${cuotaColor(r.estado_cuota)}20`,border:`1px solid ${cuotaColor(r.estado_cuota)}`,borderRadius:"20px",padding:"3px 10px",fontSize:"11px",fontWeight:800,color:cuotaColor(r.estado_cuota)}}>{cuotaLabel(r.estado_cuota)}</span>
                      )}
                    </div>
                    <div style={{display:"flex",flexWrap:"wrap",gap:"6px"}}>
                      {camposVis.includes("telefono")&&r.telefono&&<span style={{fontSize:"11px",fontWeight:600,color:"#555"}}>📞 {r.telefono}</span>}
                      {camposVis.includes("email")&&r.email&&<span style={{fontSize:"11px",fontWeight:600,color:"#555"}}>✉️ {r.email}</span>}
                      {camposVis.includes("vehiculo")&&r.vehiculo&&<span style={{fontSize:"11px",fontWeight:600,color:"#555"}}>🚗 {r.vehiculo}</span>}
                      {camposVis.includes("personas")&&r.personas&&<span style={{fontSize:"11px",fontWeight:600,color:"#555"}}>👤×{r.personas}</span>}
                    </div>
                    {esMod&&r.notas&&<div style={{marginTop:"6px",fontSize:"12px",color:"#9a9a9a",fontWeight:600,fontStyle:"italic"}}>📝 {r.notas}</div>}
                  </div>
                );
              })
            }
          </div>
        )}

        {/* SERVICIOS */}
        {tab==="servicios"&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"12px"}}>
              <span style={{fontSize:"15px",fontWeight:900,color:"#1a2a3a"}}>🔧 Servicios</span>
              {esMod&&<Btn small onClick={()=>setPopupSvc(true)}>➕ Agregar</Btn>}
            </div>
            {servicios.length===0?<div style={{textAlign:"center",padding:"40px",color:"#9a9a9a",fontSize:"13px"}}>Sin servicios cargados aún.</div>:
              servicios.map((s,i)=>(
                <Card key={i} titulo={`${s.tipo==="pdf"?"📄":s.tipo==="checklist"?"✅":"📋"} ${s.tipo.toUpperCase()}`}>
                  <div style={{fontSize:"15px",fontWeight:800,color:"#1a2a3a",marginBottom:s.descripcion?"6px":"0"}}>{s.titulo}</div>
                  {s.descripcion&&<div style={{fontSize:"13px",color:"#555",fontWeight:600,lineHeight:1.5,marginBottom:"8px"}}>{s.descripcion}</div>}
                  {s.archivo_url&&<a href={s.archivo_url} target="_blank" rel="noreferrer" style={{display:"inline-block",background:"#f0f0f0",borderRadius:"8px",padding:"7px 14px",fontSize:"12px",fontWeight:800,color:"#1a2a3a",textDecoration:"none",marginBottom:"8px"}}>📄 Abrir archivo</a>}
                  {s.tipo==="checklist"&&s.items?.map((item:any,j:number)=>(
                    <div key={j} style={{display:"flex",alignItems:"center",gap:"8px",padding:"5px 0",borderBottom:"1px solid #f5f5f5"}}>
                      <span style={{fontSize:"16px"}}>{item.checked?"✅":"⬜"}</span>
                      <span style={{fontSize:"13px",fontWeight:600,color:"#2c2c2e",textDecoration:item.checked?"line-through":"none"}}>{item.texto}</span>
                    </div>
                  ))}
                  {s.tipo==="listado"&&s.items?.map((item:any,j:number)=>(
                    <div key={j} style={{padding:"5px 0",borderBottom:"1px solid #f5f5f5",fontSize:"13px",fontWeight:600,color:"#2c2c2e"}}>• {item.texto}</div>
                  ))}
                </Card>
              ))
            }
          </div>
        )}

        {/* PROVEEDORES */}
        {tab==="proveedores"&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"12px"}}>
              <span style={{fontSize:"15px",fontWeight:900,color:"#1a2a3a"}}>🏪 Proveedores</span>
              {esMod&&<Btn small onClick={()=>setPopupProv(true)}>➕ Agregar</Btn>}
            </div>
            {proveedores.length===0?<div style={{textAlign:"center",padding:"40px",color:"#9a9a9a",fontSize:"13px"}}>Sin proveedores cargados aún.</div>:
              proveedores.map((p,i)=>(
                <div key={i} style={{background:"#fff",borderRadius:"14px",padding:"14px 16px",boxShadow:"0 2px 6px rgba(0,0,0,0.06)",marginBottom:"8px",display:"flex",alignItems:"center",gap:"12px",borderLeft:`4px solid ${p.estado==="habilitado"?"#00a884":"#e63946"}`}}>
                  <div style={{flex:1}}>
                    <div style={{fontSize:"14px",fontWeight:900,color:"#1a2a3a"}}>{p.nombre}</div>
                    {p.rubro&&<div style={{fontSize:"11px",color:"#9a9a9a",fontWeight:700,marginBottom:"4px"}}>{p.rubro}</div>}
                    <div style={{display:"flex",gap:"10px",flexWrap:"wrap"}}>
                      {p.telefono&&<span style={{fontSize:"11px",fontWeight:600,color:"#555"}}>📞 {p.telefono}</span>}
                      {p.email&&<span style={{fontSize:"11px",fontWeight:600,color:"#555"}}>✉️ {p.email}</span>}
                    </div>
                    {p.notas&&<div style={{fontSize:"11px",color:"#9a9a9a",marginTop:"4px",fontStyle:"italic"}}>{p.notas}</div>}
                  </div>
                  {esMod
                    ?<button onClick={()=>toggleEstadoProveedor(p)} style={{background:p.estado==="habilitado"?"rgba(0,168,132,0.1)":"rgba(230,57,70,0.1)",border:`2px solid ${p.estado==="habilitado"?"#00a884":"#e63946"}`,borderRadius:"10px",padding:"7px 12px",fontSize:"11px",fontWeight:900,color:p.estado==="habilitado"?"#00a884":"#e63946",cursor:"pointer",fontFamily:"'Nunito',sans-serif",flexShrink:0}}>
                       {p.estado==="habilitado"?"✅ Hab.":"❌ No hab."}
                     </button>
                    :<span style={{background:p.estado==="habilitado"?"rgba(0,168,132,0.1)":"rgba(230,57,70,0.1)",border:`1px solid ${p.estado==="habilitado"?"#00a884":"#e63946"}`,borderRadius:"10px",padding:"5px 10px",fontSize:"11px",fontWeight:800,color:p.estado==="habilitado"?"#00a884":"#e63946",flexShrink:0}}>
                       {p.estado==="habilitado"?"✅":"❌"}
                     </span>
                  }
                </div>
              ))
            }
          </div>
        )}

        {/* EVENTOS */}
        {tab==="eventos"&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"12px"}}>
              <span style={{fontSize:"15px",fontWeight:900,color:"#1a2a3a"}}>📅 Eventos</span>
              {esMod&&<Btn small onClick={()=>setPopupEvt(true)}>➕ Agregar</Btn>}
            </div>
            {eventos.length===0?<div style={{textAlign:"center",padding:"40px",color:"#9a9a9a",fontSize:"13px"}}>Sin eventos próximos.</div>:
              eventos.map((e,i)=>(
                <div key={i} style={{background:"#fff",borderRadius:"14px",overflow:"hidden",boxShadow:"0 2px 8px rgba(0,0,0,0.07)",marginBottom:"10px"}}>
                  {e.imagen&&<img src={e.imagen} alt={e.titulo} style={{width:"100%",height:"120px",objectFit:"cover"}}/>}
                  <div style={{padding:"14px 16px"}}>
                    <div style={{fontSize:"15px",fontWeight:900,color:"#1a2a3a",marginBottom:"6px"}}>{e.titulo}</div>
                    {e.fecha&&<div style={{fontSize:"12px",fontWeight:700,color:"#d4a017",marginBottom:"4px"}}>📅 {fmtFecha(e.fecha)}</div>}
                    {e.lugar&&<div style={{fontSize:"12px",fontWeight:600,color:"#9a9a9a",marginBottom:"6px"}}>📍 {e.lugar}</div>}
                    {e.descripcion&&<div style={{fontSize:"13px",color:"#555",fontWeight:600,lineHeight:1.5}}>{e.descripcion}</div>}
                  </div>
                </div>
              ))
            }
          </div>
        )}

        {/* PROMOS FLASH */}
        {tab==="promos"&&(
          <div>
            <div style={{marginBottom:"12px"}}>
              <div style={{fontSize:"15px",fontWeight:900,color:"#1a2a3a"}}>⚡ Promos Flash</div>
              <div style={{fontSize:"12px",color:"#9a9a9a",fontWeight:600,marginTop:"2px"}}>Anuncios flash de NexoNet en {grupo.ciudad||"tu ciudad"}</div>
            </div>
            {promos.length===0?<div style={{textAlign:"center",padding:"40px",color:"#9a9a9a",fontSize:"13px"}}>Sin promos flash activas en {grupo.ciudad||"tu ciudad"}.</div>:
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px"}}>
                {promos.map((p,i)=>(
                  <a key={i} href={`/anuncios/${p.id}`} style={{textDecoration:"none"}}>
                    <div style={{background:"#fff",borderRadius:"14px",overflow:"hidden",boxShadow:"0 2px 8px rgba(0,0,0,0.07)"}}>
                      <div style={{height:"90px",background:"linear-gradient(135deg,#1a2a3a,#243b55)",overflow:"hidden",position:"relative"}}>
                        {p.imagenes?.[0]?<img src={p.imagenes[0]} alt={p.titulo} style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100%",fontSize:"28px",opacity:0.3}}>⚡</div>}
                        <div style={{position:"absolute",top:"6px",right:"6px",background:"rgba(240,192,64,0.9)",borderRadius:"20px",padding:"2px 7px",fontSize:"9px",fontWeight:900,color:"#1a2a3a"}}>⚡ FLASH</div>
                      </div>
                      <div style={{padding:"9px 10px 11px"}}>
                        <div style={{fontSize:"12px",fontWeight:800,color:"#1a2a3a",overflow:"hidden",whiteSpace:"nowrap",textOverflow:"ellipsis",marginBottom:"3px"}}>{p.titulo}</div>
                        {p.precio>0&&<div style={{fontSize:"13px",fontWeight:900,color:"#d4a017"}}>{fmt(p.precio,p.moneda)}</div>}
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            }
          </div>
        )}

        {/* MAPA (barrios privados) */}
        {tab==="mapa"&&(
          <div>
            <div style={{fontSize:"15px",fontWeight:900,color:"#1a2a3a",marginBottom:"12px"}}>🗺️ Mapa del barrio</div>
            {planos.length===0
              ?<div style={{textAlign:"center",padding:"40px",color:"#9a9a9a",fontSize:"13px"}}>{esMod?"No hay mapa cargado aún. Subí una imagen desde el Panel Admin.":"El mapa aún no fue cargado por el administrador."}</div>
              :planos.map((pl,i)=>(
                <div key={i} style={{marginBottom:"12px"}}>
                  <div style={{fontSize:"13px",fontWeight:800,color:"#1a2a3a",marginBottom:"6px"}}>{pl.titulo}</div>
                  <img src={pl.imagen_url} alt={pl.titulo} style={{width:"100%",borderRadius:"14px",boxShadow:"0 4px 12px rgba(0,0,0,0.12)"}}/>
                  {pl.descripcion&&<div style={{fontSize:"12px",color:"#9a9a9a",marginTop:"6px",fontWeight:600}}>{pl.descripcion}</div>}
                </div>
              ))
            }
          </div>
        )}

        {/* PLANO (condominios) */}
        {tab==="plano"&&(
          <div>
            <div style={{fontSize:"15px",fontWeight:900,color:"#1a2a3a",marginBottom:"12px"}}>📐 Plano del condominio</div>
            {planos.length===0
              ?<div style={{textAlign:"center",padding:"40px",color:"#9a9a9a",fontSize:"13px"}}>{esMod?"No hay plano cargado. Subí una imagen desde el Panel Admin.":"El plano aún no fue cargado por el administrador."}</div>
              :planos.map((pl,i)=>(
                <div key={i} style={{marginBottom:"12px"}}>
                  <div style={{fontSize:"13px",fontWeight:800,color:"#1a2a3a",marginBottom:"6px"}}>{pl.titulo}</div>
                  <img src={pl.imagen_url} alt={pl.titulo} style={{width:"100%",borderRadius:"14px",boxShadow:"0 4px 12px rgba(0,0,0,0.12)"}}/>
                  {pl.descripcion&&<div style={{fontSize:"12px",color:"#9a9a9a",marginTop:"6px",fontWeight:600}}>{pl.descripcion}</div>}
                </div>
              ))
            }
          </div>
        )}

        {/* PANEL USUARIO */}
        {tab==="panel_usuario"&&(
          <div>
            <div style={{fontSize:"15px",fontWeight:900,color:"#1a2a3a",marginBottom:"12px"}}>⚙️ Mi panel</div>
            {session?(()=>{
              const miRes=residentes.find(r=>r.usuario_id===session.user.id);
              if(!miRes) return <div style={{textAlign:"center",padding:"40px",color:"#9a9a9a",fontSize:"13px"}}>No encontramos tu unidad vinculada. Contactá al administrador.</div>;
              return(
                <Card titulo="Mi unidad">
                  {[{l:"Nombre",v:miRes.nombre},{l:"Unidad",v:miRes.unidad},{l:"Piso",v:miRes.piso||"—"},{l:"Estado cuota",v:cuotaLabel(miRes.estado_cuota)},{l:"Personas",v:`${miRes.personas}`},{l:"Vehículo",v:miRes.vehiculo||"—"}]
                    .map((r,i,a)=><div key={i} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:i<a.length-1?"1px solid #f5f5f5":"none"}}><span style={{fontSize:"13px",fontWeight:700,color:"#9a9a9a"}}>{r.l}</span><span style={{fontSize:"13px",fontWeight:800,color:"#1a2a3a"}}>{r.v}</span></div>)}
                </Card>
              );
            })():<div style={{textAlign:"center",padding:"40px",color:"#9a9a9a"}}>Iniciá sesión para ver tu panel.</div>}
          </div>
        )}

        {/* PANEL ADMIN (consorcio) */}
        {tab==="panel_admin"&&esMod&&(
          <div style={{display:"flex",flexDirection:"column",gap:"14px"}}>

            {/* Solicitudes */}
            {pendientes.length>0&&(
              <Card titulo={`🔔 Solicitudes (${pendientes.length})`}>
                {pendientes.map((m,i,a)=>(
                  <div key={i} style={{display:"flex",alignItems:"center",gap:"10px",padding:"10px 0",borderBottom:i<a.length-1?"1px solid #f5f5f5":"none"}}>
                    <div style={{flex:1,fontSize:"14px",fontWeight:800,color:"#1a2a3a"}}>{m.nombre_usuario}</div>
                    <Btn small onClick={()=>aprobar(m)}>✅ Aprobar</Btn>
                  </div>
                ))}
              </Card>
            )}

            {/* Invitar */}
            <Card titulo="📨 Invitar miembros">
              <div style={{marginBottom:"10px"}}>
                <div style={{fontSize:"11px",fontWeight:800,color:"#9a9a9a",textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:"6px"}}>¿Quién paga el BIT Grupo?</div>
                <div style={{display:"flex",gap:"8px"}}>
                  {[{v:true,l:"🆓 El grupo paga"},{v:false,l:"💰 El invitado"}].map(o=>(
                    <button key={String(o.v)} onClick={()=>setCanonGratis(o.v)} style={{flex:1,background:canonGratis===o.v?"#d4a017":"#f4f4f2",border:`2px solid ${canonGratis===o.v?"#d4a017":"#e8e8e6"}`,borderRadius:"10px",padding:"8px",fontSize:"11px",fontWeight:800,color:canonGratis===o.v?"#1a2a3a":"#2c2c2e",cursor:"pointer",fontFamily:"'Nunito',sans-serif"}}>
                      {o.l}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{display:"flex",gap:"8px",marginBottom:"8px"}}>
                <input type="text" value={busqInv} onChange={e=>setBusqInv(e.target.value)} placeholder="Buscar usuario..." onKeyDown={e=>e.key==="Enter"&&buscarUsuario()}
                  style={{flex:1,border:"2px solid #e8e8e8",borderRadius:"10px",padding:"9px 12px",fontSize:"13px",fontFamily:"'Nunito',sans-serif",outline:"none",color:"#1a2a3a"}}/>
                <Btn small onClick={buscarUsuario}>{buscando?"⏳":"🔍"}</Btn>
              </div>
              {resInv.map(u=>(
                <div key={u.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:"#f9f9f9",borderRadius:"10px",padding:"10px 12px",marginBottom:"6px"}}>
                  <span style={{fontSize:"13px",fontWeight:800,color:"#1a2a3a"}}>👤 {u.nombre_usuario}</span>
                  <Btn small onClick={()=>invitar(u)}>📨 Invitar</Btn>
                </div>
              ))}
            </Card>

            {/* Configuración campos públicos residentes */}
            {configEdit&&(
              <Card titulo="⚙️ Campos visibles para residentes">
                <div style={{fontSize:"12px",color:"#9a9a9a",fontWeight:600,marginBottom:"10px"}}>Elegí qué datos de cada residente pueden ver los miembros</div>
                {["nombre","unidad","piso","telefono","email","vehiculo","personas","estado_cuota"].map(campo=>{
                  const activo=(configEdit.residentes_campos_publicos||["nombre","unidad","estado_cuota"]).includes(campo);
                  const labels:Record<string,string>={nombre:"Nombre",unidad:"Unidad",piso:"Piso",telefono:"Teléfono",email:"Email",vehiculo:"Vehículo/Patente",personas:"Personas en unidad",estado_cuota:"Estado de cuota"};
                  return(
                    <Tog key={campo} label={labels[campo]} sub="" val={activo} onChange={v=>{
                      const actual=configEdit.residentes_campos_publicos||["nombre","unidad","estado_cuota"];
                      setConfigEdit(c=>c?{...c,residentes_campos_publicos:v?[...actual,campo]:actual.filter(x=>x!==campo)}:c);
                    }}/>
                  );
                })}
                <div style={{marginTop:"14px"}}><Btn full onClick={guardarConfig} disabled={guardando}>{guardando?"Guardando...":"💾 Guardar"}</Btn></div>
              </Card>
            )}

            {/* Roles */}
            <Card titulo="🛡️ Roles">
              {miembros.filter(m=>m.estado==="activo"&&m.usuario_id!==grupo.creador_id).map((m,i,a)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:"10px",padding:"8px 0",borderBottom:i<a.length-1?"1px solid #f5f5f5":"none"}}>
                  <div style={{flex:1,fontSize:"13px",fontWeight:800,color:"#1a2a3a"}}>{m.nombre_usuario}</div>
                  <select value={m.rol} onChange={e=>cambiarRol(m,e.target.value)} style={{border:"2px solid #e8e8e8",borderRadius:"8px",padding:"5px 8px",fontSize:"12px",fontFamily:"'Nunito',sans-serif",outline:"none",color:"#1a2a3a",background:"#fff"}}>
                    <option value="miembro">👤 Miembro</option>
                    <option value="moderador">🛡️ Moderador</option>
                  </select>
                </div>
              ))}
            </Card>
          </div>
        )}

        {/* ── TABS GENÉRICOS ── */}

        {tab==="chat"&&(
          <div style={{display:"flex",flexDirection:"column",height:"calc(100vh - 380px)",minHeight:"300px"}}>
            <div ref={chatRef} style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column",gap:"8px",paddingBottom:"8px"}}>
              {mensajes.length===0&&<div style={{textAlign:"center",padding:"40px",color:"#9a9a9a",fontSize:"13px"}}>Sin mensajes aún.</div>}
              {mensajes.map(m=>{
                const es=session?.user.id===m.usuario_id;
                return(
                  <div key={m.id} style={{display:"flex",flexDirection:"column",alignItems:es?"flex-end":"flex-start"}}>
                    {!es&&<div style={{fontSize:"10px",fontWeight:800,color:"#d4a017",marginBottom:"2px",marginLeft:"12px"}}>{m.nombre_usuario}</div>}
                    <div style={{maxWidth:"75%",background:es?"linear-gradient(135deg,#d4a017,#f0c040)":"#fff",borderRadius:es?"16px 4px 16px 16px":"4px 16px 16px 16px",padding:"10px 14px",boxShadow:"0 2px 6px rgba(0,0,0,0.08)"}}>
                      <div style={{fontSize:"13px",fontWeight:600,color:es?"#1a2a3a":"#2c2c2e"}}>{m.texto}</div>
                      <div style={{fontSize:"9px",color:es?"rgba(26,42,58,0.6)":"#bbb",fontWeight:600,marginTop:"4px",textAlign:"right"}}>{fmtF(m.created_at)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{display:"flex",gap:"8px",paddingTop:"10px"}}>
              <input type="text" value={nuevoMsg} onChange={e=>setNuevoMsg(e.target.value)} onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&enviarMensaje()} placeholder="Escribí un mensaje..." maxLength={500}
                style={{flex:1,border:"2px solid #e8e8e8",borderRadius:"12px",padding:"11px 14px",fontSize:"13px",fontFamily:"'Nunito',sans-serif",outline:"none",color:"#1a2a3a"}}/>
              <button onClick={enviarMensaje} disabled={!nuevoMsg.trim()||enviando} style={{background:nuevoMsg.trim()?"linear-gradient(135deg,#d4a017,#f0c040)":"#f0f0f0",border:"none",borderRadius:"12px",padding:"0 18px",fontSize:"20px",cursor:nuevoMsg.trim()?"pointer":"not-allowed"}}>
                {enviando?"⏳":"📤"}
              </button>
            </div>
          </div>
        )}

        {tab==="miembros"&&(
          <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
            {miembros.filter(m=>m.estado==="activo").sort((a,b)=>a.rol==="creador"?-1:b.rol==="creador"?1:a.rol==="moderador"?-1:1).map((m,i)=>(
              <div key={i} style={{background:"#fff",borderRadius:"14px",padding:"14px 16px",boxShadow:"0 2px 6px rgba(0,0,0,0.06)",display:"flex",alignItems:"center",gap:"12px"}}>
                <div style={{width:"40px",height:"40px",borderRadius:"50%",background:"linear-gradient(135deg,#1a2a3a,#243b55)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"18px",flexShrink:0}}>
                  {m.rol==="creador"?"👑":m.rol==="moderador"?"🛡️":"👤"}
                </div>
                <div style={{flex:1}}>
                  <div style={{fontSize:"14px",fontWeight:800,color:"#1a2a3a"}}>{m.nombre_usuario}</div>
                  {config.ver_miembros_detalle&&<div style={{fontSize:"11px",color:"#9a9a9a",fontWeight:600,textTransform:"capitalize"}}>{m.rol}{m.bits_grupo?" · 🏆":""}</div>}
                </div>
                {(m.rol==="creador"||m.rol==="moderador")&&<span style={{background:"rgba(212,160,23,0.12)",border:"1px solid rgba(212,160,23,0.4)",borderRadius:"20px",padding:"2px 10px",fontSize:"10px",fontWeight:800,color:"#a07810"}}>{m.rol==="creador"?"👑 Creador":"🛡️ Mod"}</span>}
              </div>
            ))}
          </div>
        )}

        {tab==="anuncios"&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"12px"}}>
              <span style={{fontSize:"14px",fontWeight:800,color:"#1a2a3a"}}>📢 Publicaciones internas</span>
              {esMiembro&&<Btn small onClick={()=>{setNuevaPub(p=>({...p,tipo:"interna"}));setPopupPub(true);}}>➕</Btn>}
            </div>
            <ListaPublis publis={publis.filter(p=>p.tipo==="interna")} fmt={fmt} fmtF={fmtF}/>
          </div>
        )}

        {tab==="especial"&&(
          <Card titulo={`⭐ ${grupo.especial_titulo||"Especial"}`}>
            {grupo.especial_contenido?<div style={{fontSize:"14px",fontWeight:600,color:"#2c2c2e",lineHeight:1.7,whiteSpace:"pre-line"}}>{grupo.especial_contenido}</div>
            :<div style={{textAlign:"center",padding:"20px",color:"#9a9a9a",fontSize:"13px"}}>Contenido especial próximamente.</div>}
          </Card>
        )}
        {tab==="reglas"&&<Card titulo="📌 Reglas">{grupo.reglas?<div style={{fontSize:"14px",fontWeight:600,color:"#2c2c2e",lineHeight:1.7,whiteSpace:"pre-line"}}>{grupo.reglas}</div>:<div style={{padding:"20px",textAlign:"center",color:"#9a9a9a",fontSize:"13px"}}>Sin reglas definidas.</div>}</Card>}
        {tab==="links"&&(
          <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
            {(!grupo.links||grupo.links.length===0)?<div style={{textAlign:"center",padding:"40px",color:"#9a9a9a",fontSize:"13px"}}>No hay links.</div>
            :grupo.links.map((link,i)=><a key={i} href={link} target="_blank" rel="noreferrer" style={{background:"#fff",borderRadius:"14px",padding:"14px 16px",boxShadow:"0 2px 6px rgba(0,0,0,0.06)",textDecoration:"none",display:"flex",alignItems:"center",gap:"10px"}}><span>🔗</span><span style={{fontSize:"13px",fontWeight:700,color:"#3a7bd5",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{link}</span></a>)}
          </div>
        )}
        {tab==="publico"&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"8px"}}>
              <span style={{fontSize:"14px",fontWeight:800,color:"#1a2a3a"}}>🌐 Público</span>
              {esMiembro&&<Btn small onClick={()=>{setNuevaPub(p=>({...p,tipo:"publica"}));setPopupPub(true);}}>➕</Btn>}
            </div>
            <ListaPublis publis={publis.filter(p=>p.tipo==="publica")} fmt={fmt} fmtF={fmtF}/>
          </div>
        )}
        {tab==="moderador"&&esMod&&(
          <div style={{display:"flex",flexDirection:"column",gap:"14px"}}>
            {pendientes.length>0&&<Card titulo={`🔔 Solicitudes (${pendientes.length})`}>{pendientes.map((m,i,a)=><div key={i} style={{display:"flex",alignItems:"center",gap:"10px",padding:"10px 0",borderBottom:i<a.length-1?"1px solid #f5f5f5":"none"}}><div style={{flex:1,fontSize:"14px",fontWeight:800,color:"#1a2a3a"}}>{m.nombre_usuario}</div><Btn small onClick={()=>aprobar(m)}>✅ Aprobar</Btn></div>)}</Card>}
            <Card titulo="📨 Invitar">
              <div style={{display:"flex",gap:"8px",marginBottom:"8px"}}>
                <input type="text" value={busqInv} onChange={e=>setBusqInv(e.target.value)} placeholder="Buscar usuario..." onKeyDown={e=>e.key==="Enter"&&buscarUsuario()} style={{flex:1,border:"2px solid #e8e8e8",borderRadius:"10px",padding:"9px 12px",fontSize:"13px",fontFamily:"'Nunito',sans-serif",outline:"none",color:"#1a2a3a"}}/>
                <Btn small onClick={buscarUsuario}>{buscando?"⏳":"🔍"}</Btn>
              </div>
              {resInv.map(u=><div key={u.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:"#f9f9f9",borderRadius:"10px",padding:"10px 12px",marginBottom:"6px"}}><span style={{fontSize:"13px",fontWeight:800,color:"#1a2a3a"}}>👤 {u.nombre_usuario}</span><Btn small onClick={()=>invitar(u)}>📨 Invitar</Btn></div>)}
            </Card>
          </div>
        )}
      </div>

      {/* ── POPUPS ── */}

      {/* BIT */}
      {popupBit&&<Popup onClose={()=>setPopupBit(false)} titulo="🏆 BIT Grupo">
        <div style={{background:"linear-gradient(135deg,#1a2a3a,#243b55)",borderRadius:"14px",padding:"20px",textAlign:"center",marginBottom:"14px"}}>
          <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"22px",color:"#f0c040",letterSpacing:"1px",marginBottom:"6px"}}>$500 / 30 días</div>
          <div style={{fontSize:"13px",color:"#8a9aaa",fontWeight:600}}>Chat interno y anuncios exclusivos</div>
        </div>
        <Btn full onClick={()=>{setPopupBit(false);router.push("/comprar?cat=extras");}}>⚡ Activar BIT Grupo</Btn>
      </Popup>}

      {/* Publicar */}
      {popupPub&&<Popup onClose={()=>setPopupPub(false)} titulo={nuevaPub.tipo==="publica"?"🌐 Publicación pública":"📢 Publicación interna"}>
        <div style={{display:"flex",flexDirection:"column",gap:"10px",marginBottom:"14px"}}>
          <input value={nuevaPub.titulo} onChange={e=>setNuevaPub(p=>({...p,titulo:e.target.value}))} placeholder="Título *" maxLength={120} style={inputStyle}/>
          <textarea value={nuevaPub.descripcion} onChange={e=>setNuevaPub(p=>({...p,descripcion:e.target.value}))} placeholder="Descripción" rows={3} maxLength={500} style={{...inputStyle,resize:"none"}}/>
          <div style={{display:"flex",gap:"8px"}}>
            <input value={nuevaPub.precio} onChange={e=>setNuevaPub(p=>({...p,precio:e.target.value}))} placeholder="Precio (opcional)" type="number" style={{...inputStyle,flex:1}}/>
            <select value={nuevaPub.moneda} onChange={e=>setNuevaPub(p=>({...p,moneda:e.target.value}))} style={{...inputStyle,width:"80px"}}><option value="ARS">ARS</option><option value="USD">USD</option></select>
          </div>
        </div>
        <Btn full onClick={publicar} disabled={!nuevaPub.titulo.trim()}>📢 Publicar</Btn>
      </Popup>}

      {/* Nuevo residente */}
      {popupRes&&<Popup onClose={()=>setPopupRes(false)} titulo="👥 Nuevo residente">
        <div style={{display:"flex",flexDirection:"column",gap:"8px",marginBottom:"14px"}}>
          <input value={nuevoRes.nombre}    onChange={e=>setNuevoRes(p=>({...p,nombre:e.target.value}))}    placeholder="Nombre completo *" style={inputStyle}/>
          <div style={{display:"flex",gap:"8px"}}>
            <input value={nuevoRes.unidad}  onChange={e=>setNuevoRes(p=>({...p,unidad:e.target.value}))}  placeholder="Unidad (ej: 4B)" style={{...inputStyle,flex:1}}/>
            <input value={nuevoRes.piso}    onChange={e=>setNuevoRes(p=>({...p,piso:e.target.value}))}    placeholder="Piso" style={{...inputStyle,width:"70px"}}/>
          </div>
          <input value={nuevoRes.telefono}  onChange={e=>setNuevoRes(p=>({...p,telefono:e.target.value}))}  placeholder="Teléfono" style={inputStyle}/>
          <input value={nuevoRes.email}     onChange={e=>setNuevoRes(p=>({...p,email:e.target.value}))}     placeholder="Email" style={inputStyle}/>
          <input value={nuevoRes.vehiculo}  onChange={e=>setNuevoRes(p=>({...p,vehiculo:e.target.value}))}  placeholder="Vehículo / patente" style={inputStyle}/>
          <div style={{display:"flex",gap:"8px"}}>
            <input value={nuevoRes.personas} onChange={e=>setNuevoRes(p=>({...p,personas:e.target.value}))} placeholder="Personas" type="number" min="1" style={{...inputStyle,flex:1}}/>
            <select value={nuevoRes.estado_cuota} onChange={e=>setNuevoRes(p=>({...p,estado_cuota:e.target.value}))} style={{...inputStyle,flex:1}}>
              <option value="al_dia">✅ Al día</option>
              <option value="debe">⚠️ Debe</option>
              <option value="exento">🔵 Exento</option>
            </select>
          </div>
          <textarea value={nuevoRes.notas} onChange={e=>setNuevoRes(p=>({...p,notas:e.target.value}))} placeholder="Notas (internas)" rows={2} style={{...inputStyle,resize:"none"}}/>
        </div>
        <Btn full onClick={guardarResidente} disabled={!nuevoRes.nombre.trim()}>💾 Guardar</Btn>
      </Popup>}

      {/* Nuevo servicio */}
      {popupSvc&&<Popup onClose={()=>setPopupSvc(false)} titulo="🔧 Nuevo servicio">
        <div style={{display:"flex",flexDirection:"column",gap:"8px",marginBottom:"14px"}}>
          <input value={nuevoSvc.titulo} onChange={e=>setNuevoSvc(p=>({...p,titulo:e.target.value}))} placeholder="Título *" style={inputStyle}/>
          <textarea value={nuevoSvc.descripcion} onChange={e=>setNuevoSvc(p=>({...p,descripcion:e.target.value}))} placeholder="Descripción" rows={2} style={{...inputStyle,resize:"none"}}/>
          <select value={nuevoSvc.tipo} onChange={e=>setNuevoSvc(p=>({...p,tipo:e.target.value}))} style={inputStyle}>
            <option value="listado">📋 Listado</option>
            <option value="checklist">✅ Checklist</option>
            <option value="pdf">📄 PDF</option>
          </select>
        </div>
        <Btn full onClick={guardarServicio} disabled={!nuevoSvc.titulo.trim()}>💾 Guardar</Btn>
      </Popup>}

      {/* Nuevo proveedor */}
      {popupProv&&<Popup onClose={()=>setPopupProv(false)} titulo="🏪 Nuevo proveedor">
        <div style={{display:"flex",flexDirection:"column",gap:"8px",marginBottom:"14px"}}>
          <input value={nuevoProv.nombre}   onChange={e=>setNuevoProv(p=>({...p,nombre:e.target.value}))}   placeholder="Nombre *" style={inputStyle}/>
          <input value={nuevoProv.rubro}    onChange={e=>setNuevoProv(p=>({...p,rubro:e.target.value}))}    placeholder="Rubro (ej: Plomería)" style={inputStyle}/>
          <input value={nuevoProv.telefono} onChange={e=>setNuevoProv(p=>({...p,telefono:e.target.value}))} placeholder="Teléfono" style={inputStyle}/>
          <input value={nuevoProv.email}    onChange={e=>setNuevoProv(p=>({...p,email:e.target.value}))}    placeholder="Email" style={inputStyle}/>
          <textarea value={nuevoProv.notas} onChange={e=>setNuevoProv(p=>({...p,notas:e.target.value}))} placeholder="Notas" rows={2} style={{...inputStyle,resize:"none"}}/>
          <select value={nuevoProv.estado}  onChange={e=>setNuevoProv(p=>({...p,estado:e.target.value}))} style={inputStyle}>
            <option value="habilitado">✅ Habilitado</option>
            <option value="no_habilitado">❌ No habilitado</option>
          </select>
        </div>
        <Btn full onClick={guardarProveedor} disabled={!nuevoProv.nombre.trim()}>💾 Guardar</Btn>
      </Popup>}

      {/* Nuevo evento */}
      {popupEvt&&<Popup onClose={()=>setPopupEvt(false)} titulo="📅 Nuevo evento">
        <div style={{display:"flex",flexDirection:"column",gap:"8px",marginBottom:"14px"}}>
          <input value={nuevoEvt.titulo}      onChange={e=>setNuevoEvt(p=>({...p,titulo:e.target.value}))}      placeholder="Título *" style={inputStyle}/>
          <textarea value={nuevoEvt.descripcion} onChange={e=>setNuevoEvt(p=>({...p,descripcion:e.target.value}))} placeholder="Descripción" rows={2} style={{...inputStyle,resize:"none"}}/>
          <input value={nuevoEvt.fecha}       onChange={e=>setNuevoEvt(p=>({...p,fecha:e.target.value}))}       type="datetime-local" style={inputStyle}/>
          <input value={nuevoEvt.lugar}       onChange={e=>setNuevoEvt(p=>({...p,lugar:e.target.value}))}       placeholder="Lugar" style={inputStyle}/>
        </div>
        <Btn full onClick={guardarEvento} disabled={!nuevoEvt.titulo.trim()}>💾 Guardar</Btn>
      </Popup>}

      {popupAcceso && session && grupo && (
        <PopupAccesoGrupo
          grupo={grupo}
          userId={session.user.id}
          onClose={()=>setPopupAcceso(false)}
          onExito={()=>{
            setPopupAcceso(false);
            const nuevo:Miembro={id:0,usuario_id:session.user.id,rol:"miembro",estado:grupo.tipo==="cerrado"?"pendiente":"activo",canon_gratis:false,bits_grupo:false,bits_grupo_hasta:null,nombre_usuario:"Vos"};
            setMiMembro(nuevo);
            setMiembros(p=>[...p,nuevo]);
          }}
        />
      )}
      <BottomNav/>
    </main>
  );
}

// ── Aux ───────────────────────────────────────────────────────────────────────
function Popup({titulo,onClose,children}:{titulo:string;onClose:()=>void;children:React.ReactNode}) {
  return(
    <div style={{position:"fixed",inset:0,zIndex:200,background:"rgba(0,0,0,0.65)",display:"flex",alignItems:"flex-end",padding:"16px"}}>
      <div style={{width:"100%",background:"#fff",borderRadius:"20px 20px 16px 16px",padding:"24px 20px 20px",boxShadow:"0 -8px 40px rgba(0,0,0,0.3)",maxHeight:"90vh",overflowY:"auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:"16px"}}>
          <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"20px",color:"#1a2a3a",letterSpacing:"1px"}}>{titulo}</div>
          <button onClick={onClose} style={{background:"#f0f0f0",border:"none",borderRadius:"50%",width:"32px",height:"32px",fontSize:"16px",cursor:"pointer"}}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}
function ListaPublis({publis,fmt,fmtF}:{publis:Publi[];fmt:(p:number,m:string)=>string;fmtF:(d:string)=>string}) {
  if(publis.length===0) return <div style={{textAlign:"center",padding:"40px",color:"#9a9a9a",fontSize:"13px"}}>Sin publicaciones aún.</div>;
  return(<div style={{display:"flex",flexDirection:"column",gap:"10px"}}>{publis.map(p=><div key={p.id} style={{background:"#fff",borderRadius:"14px",padding:"14px 16px",boxShadow:"0 2px 6px rgba(0,0,0,0.06)"}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:"6px"}}><div style={{fontSize:"11px",fontWeight:800,color:"#d4a017"}}>{p.nombre_usuario}</div><div style={{fontSize:"10px",color:"#bbb",fontWeight:600}}>{fmtF(p.created_at)}</div></div><div style={{fontSize:"14px",fontWeight:800,color:"#1a2a3a",marginBottom:"4px"}}>{p.titulo}</div>{p.descripcion&&<div style={{fontSize:"13px",fontWeight:600,color:"#555",lineHeight:1.5,marginBottom:"6px"}}>{p.descripcion}</div>}{p.precio>0&&<div style={{fontSize:"16px",fontWeight:900,color:"#d4a017"}}>{fmt(p.precio,p.moneda)}</div>}</div>)}</div>);
}
const inputStyle:React.CSSProperties={border:"2px solid #e8e8e8",borderRadius:"12px",padding:"11px 14px",fontSize:"14px",fontFamily:"'Nunito',sans-serif",outline:"none",color:"#1a2a3a",width:"100%",boxSizing:"border-box",background:"#fff"};
