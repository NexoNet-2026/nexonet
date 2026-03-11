"use client";
import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/lib/supabase";

type Config = {
  ver_miembros_detalle: boolean;
  pestanas_publicas: string[];
  miembros_pueden_invitar: boolean;
  canon_gratis_por_defecto: boolean;
};
type Grupo = {
  id:number; nombre:string; descripcion:string; imagen:string;
  tipo:"abierto"|"cerrado"; miembros_count:number;
  categoria_nombre:string; subcategoria_nombre:string;
  reglas:string; links:string[]; whatsapp_link:string;
  creador_id:string; config:Config;
  especial_titulo:string; especial_contenido:string; especial_imagenes:string[];
};
type Miembro = { id:number; usuario_id:string; rol:string; estado:string; canon_gratis:boolean; bits_grupo:boolean; bits_grupo_hasta:string|null; nombre_usuario:string; };
type Mensaje  = { id:number; usuario_id:string; texto:string; created_at:string; nombre_usuario:string; };
type Publi    = { id:number; usuario_id:string; titulo:string; descripcion:string; imagenes:string[]; precio:number; moneda:string; tipo:string; created_at:string; nombre_usuario:string; };
type Usuario  = { id:string; nombre_usuario:string; };

const TABS_BASE = [
  { id:"info",     label:"📋 Info"     },
  { id:"chat",     label:"💬 Chat"     },
  { id:"miembros", label:"👥 Miembros" },
  { id:"anuncios", label:"📢 Anuncios" },
  { id:"especial", label:"⭐ Especial"  },
  { id:"reglas",   label:"📌 Reglas"   },
  { id:"links",    label:"🔗 Links"    },
  { id:"publico",  label:"🌐 Público"  },
  { id:"moderador",label:"🛡️ Moderador"},
];
const TABS_REQUIEREN_BIT = ["chat","anuncios"];
const TABS_SOLO_MOD      = ["moderador"];

export default function GrupoDetalle() {
  const { id } = useParams<{ id:string }>();
  const router  = useRouter();
  const gId     = parseInt(id);

  const [tab,       setTab]       = useState("info");
  const [grupo,     setGrupo]     = useState<Grupo|null>(null);
  const [miembros,  setMiembros]  = useState<Miembro[]>([]);
  const [mensajes,  setMensajes]  = useState<Mensaje[]>([]);
  const [publis,    setPublis]    = useState<Publi[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [session,   setSession]   = useState<any>(null);
  const [miMembro,  setMiMembro]  = useState<Miembro|null>(null);
  const [nuevoMsg,  setNuevoMsg]  = useState("");
  const [enviando,  setEnviando]  = useState(false);
  const [popupBit,  setPopupBit]  = useState(false);
  const [popupPub,  setPopupPub]  = useState(false);
  const [nuevaPub,  setNuevaPub]  = useState({ titulo:"", descripcion:"", precio:"", moneda:"ARS", tipo:"interna" });
  // Invitaciones
  const [busqInv,   setBusqInv]   = useState("");
  const [resInv,    setResInv]    = useState<Usuario[]>([]);
  const [buscando,  setBuscando]  = useState(false);
  const [canonGratisInv, setCanonGratisInv] = useState(true);
  const [msgInv,    setMsgInv]    = useState("¡Te invito a unirte a nuestro grupo!");
  // Config editable (mod)
  const [configEdit, setConfigEdit] = useState<Config|null>(null);
  const [guardandoCfg, setGuardandoCfg] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(()=>{
    supabase.auth.getSession().then(({data:{session:s}})=>{ setSession(s); });

    Promise.all([
      supabase.from("grupos").select(`
        id,nombre,descripcion,imagen,tipo,miembros_count,reglas,links,
        whatsapp_link,creador_id,config,especial_titulo,especial_contenido,especial_imagenes,
        grupo_categorias(nombre),grupo_subcategorias(nombre)
      `).eq("id",gId).single(),
      supabase.from("grupo_miembros")
        .select("id,usuario_id,rol,estado,canon_gratis,bits_grupo,bits_grupo_hasta,usuarios(nombre_usuario)")
        .eq("grupo_id",gId).eq("estado","activo"),
      supabase.from("grupo_publicaciones")
        .select("id,usuario_id,titulo,descripcion,imagenes,precio,moneda,tipo,created_at,usuarios(nombre_usuario)")
        .eq("grupo_id",gId).order("created_at",{ascending:false}),
    ]).then(([{data:gData},{data:mData},{data:pData}])=>{
      if(gData){
        const g:Grupo = {
          ...gData,
          categoria_nombre:    (gData as any).grupo_categorias?.nombre  || "",
          subcategoria_nombre: (gData as any).grupo_subcategorias?.nombre || "",
          config: gData.config || { ver_miembros_detalle:false, pestanas_publicas:["info","publico"], miembros_pueden_invitar:false, canon_gratis_por_defecto:true },
        };
        setGrupo(g);
        setConfigEdit({...g.config});
        setCanonGratisInv(g.config.canon_gratis_por_defecto);
      }
      if(mData) setMiembros(mData.map((m:any)=>({...m,nombre_usuario:m.usuarios?.nombre_usuario||"Usuario"})));
      if(pData) setPublis(pData.map((p:any)=>({...p,nombre_usuario:p.usuarios?.nombre_usuario||"Usuario"})));
      setLoading(false);
    });
  },[gId]);

  useEffect(()=>{
    if(!session||miembros.length===0) return;
    setMiMembro(miembros.find(x=>x.usuario_id===session.user.id)||null);
  },[session,miembros]);

  useEffect(()=>{
    if(tab!=="chat") return;
    supabase.from("grupo_mensajes")
      .select("id,usuario_id,texto,created_at,usuarios(nombre_usuario)")
      .eq("grupo_id",gId).order("created_at",{ascending:true}).limit(100)
      .then(({data})=>{ if(data) setMensajes(data.map((m:any)=>({...m,nombre_usuario:m.usuarios?.nombre_usuario||"Usuario"}))); });

    const canal = supabase.channel(`chat-g-${gId}`)
      .on("postgres_changes",{event:"INSERT",schema:"public",table:"grupo_mensajes",filter:`grupo_id=eq.${gId}`},
        async(payload)=>{
          const {data:u}=await supabase.from("usuarios").select("nombre_usuario").eq("id",payload.new.usuario_id).single();
          setMensajes(prev=>[...prev,{...payload.new as any,nombre_usuario:u?.nombre_usuario||"Usuario"}]);
        }
      ).subscribe();
    return()=>{ supabase.removeChannel(canal); };
  },[tab,gId]);

  useEffect(()=>{ if(chatRef.current) chatRef.current.scrollTop=chatRef.current.scrollHeight; },[mensajes]);

  const esMod = miMembro?.rol==="creador"||miMembro?.rol==="moderador";
  const esMiembro = !!miMembro;
  const tieneBit  = miMembro?.bits_grupo===true&&(!miMembro.bits_grupo_hasta||new Date(miMembro.bits_grupo_hasta)>new Date());
  const config    = grupo?.config || { ver_miembros_detalle:false, pestanas_publicas:["info","publico"], miembros_pueden_invitar:false, canon_gratis_por_defecto:true };

  const tabVisible = (t:string) => {
    if(TABS_SOLO_MOD.includes(t)) return esMod;
    if(!esMiembro) return config.pestanas_publicas.includes(t);
    return true;
  };
  const tabBloqueado = (t:string) => {
    if(!esMiembro) return !config.pestanas_publicas.includes(t);
    if(TABS_REQUIEREN_BIT.includes(t) && !tieneBit) return true;
    return false;
  };

  const handleTab = (t:string)=>{
    if(tabBloqueado(t)){ if(TABS_REQUIEREN_BIT.includes(t)) setPopupBit(true); return; }
    setTab(t);
  };

  const unirse = async()=>{
    if(!session){ router.push("/login"); return; }
    if(!grupo) return;
    const estado = grupo.tipo==="cerrado"?"pendiente":"activo";
    const {error} = await supabase.from("grupo_miembros").insert({ grupo_id:gId, usuario_id:session.user.id, rol:"miembro", estado, canon_gratis:false });
    if(!error){
      const nuevo:Miembro={id:0,usuario_id:session.user.id,rol:"miembro",estado,canon_gratis:false,bits_grupo:false,bits_grupo_hasta:null,nombre_usuario:"Vos"};
      setMiMembro(nuevo); setMiembros(p=>[...p,nuevo]);
      if(grupo.tipo==="cerrado") alert("Solicitud enviada. El moderador debe aprobarte.");
    }
  };

  const enviarMensaje = async()=>{
    if(!nuevoMsg.trim()||!session||enviando) return;
    setEnviando(true);
    await supabase.from("grupo_mensajes").insert({ grupo_id:gId, usuario_id:session.user.id, texto:nuevoMsg.trim() });
    setNuevoMsg(""); setEnviando(false);
  };

  const publicar = async()=>{
    if(!nuevaPub.titulo.trim()||!session) return;
    const {error}=await supabase.from("grupo_publicaciones").insert({ grupo_id:gId, usuario_id:session.user.id, titulo:nuevaPub.titulo, descripcion:nuevaPub.descripcion, precio:parseFloat(nuevaPub.precio)||0, moneda:nuevaPub.moneda, tipo:nuevaPub.tipo });
    if(!error){
      setPublis(p=>[{id:Date.now(),usuario_id:session.user.id,titulo:nuevaPub.titulo,descripcion:nuevaPub.descripcion,imagenes:[],precio:parseFloat(nuevaPub.precio)||0,moneda:nuevaPub.moneda,tipo:nuevaPub.tipo,created_at:new Date().toISOString(),nombre_usuario:"Vos"},...p]);
      setNuevaPub({titulo:"",descripcion:"",precio:"",moneda:"ARS",tipo:"interna"}); setPopupPub(false);
    }
  };

  // Buscar usuarios para invitar
  const buscarUsuario = async()=>{
    if(!busqInv.trim()) return;
    setBuscando(true);
    const {data}=await supabase.from("usuarios").select("id,nombre_usuario")
      .ilike("nombre_usuario",`%${busqInv}%`).limit(8);
    const ids = new Set(miembros.map(m=>m.usuario_id));
    setResInv((data||[]).filter((u:any)=>!ids.has(u.id)));
    setBuscando(false);
  };

  const invitar = async(usuario:Usuario)=>{
    if(!session||!grupo) return;
    const {error}=await supabase.from("grupo_invitaciones").insert({
      grupo_id:gId, invitador_id:session.user.id, invitado_id:usuario.id,
      canon_gratis:canonGratisInv, mensaje:msgInv, estado:"pendiente",
    });
    if(!error){ alert(`Invitación enviada a ${usuario.nombre_usuario} ${canonGratisInv?"(sin cargo)":"(pagará $500)"}`); setResInv([]); setBusqInv(""); }
    else if(error.code==="23505") alert("Ya existe una invitación pendiente para este usuario.");
  };

  const aprobarMiembro = async(m:Miembro)=>{
    await supabase.from("grupo_miembros").update({estado:"activo"}).eq("id",m.id);
    setMiembros(p=>p.map(x=>x.id===m.id?{...x,estado:"activo"}:x));
  };

  const cambiarRol = async(m:Miembro,rol:string)=>{
    await supabase.from("grupo_miembros").update({rol}).eq("id",m.id);
    setMiembros(p=>p.map(x=>x.id===m.id?{...x,rol}:x));
  };

  const guardarConfig = async()=>{
    if(!configEdit) return;
    setGuardandoCfg(true);
    await supabase.from("grupos").update({config:configEdit}).eq("id",gId);
    setGrupo(g=>g?{...g,config:configEdit}:g);
    setGuardandoCfg(false);
    alert("Configuración guardada ✅");
  };

  const fmt = (p:number,m:string)=>!p?"Consultar":`${m==="USD"?"U$D":"$"} ${p.toLocaleString("es-AR")}`;
  const fmtF = (d:string)=>new Date(d).toLocaleDateString("es-AR",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"});

  if(loading) return(<main style={{paddingTop:"95px",fontFamily:"'Nunito',sans-serif"}}><Header/><div style={{textAlign:"center",padding:"60px",color:"#9a9a9a",fontWeight:700}}>Cargando grupo...</div><BottomNav/></main>);
  if(!grupo)  return(<main style={{paddingTop:"95px",fontFamily:"'Nunito',sans-serif"}}><Header/><div style={{textAlign:"center",padding:"60px"}}><div style={{fontSize:"40px"}}>❌</div><div style={{fontWeight:800,color:"#1a2a3a",marginTop:"12px"}}>Grupo no encontrado</div><button onClick={()=>router.push("/grupos")} style={{marginTop:"16px",background:"#d4a017",border:"none",borderRadius:"12px",padding:"12px 24px",fontSize:"13px",fontWeight:800,color:"#1a2a3a",cursor:"pointer",fontFamily:"'Nunito',sans-serif"}}>← Volver</button></div><BottomNav/></main>);

  const pendientes = miembros.filter(m=>m.estado==="pendiente");

  return(
    <main style={{paddingTop:"95px",paddingBottom:"130px",background:"#f4f4f2",minHeight:"100vh",fontFamily:"'Nunito',sans-serif"}}>
      <Header/>

      {/* Cabecera */}
      <div style={{background:"linear-gradient(135deg,#1a2a3a,#243b55)"}}>
        <div style={{width:"100%",height:"140px",overflow:"hidden",position:"relative"}}>
          {grupo.imagen?<img src={grupo.imagen} alt={grupo.nombre} style={{width:"100%",height:"100%",objectFit:"cover",opacity:0.45}}/>
          :<div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"60px",opacity:0.25}}>👥</div>}
          <div style={{position:"absolute",inset:0,background:"linear-gradient(to bottom,transparent 20%,rgba(26,42,58,0.96))"}}/>
          <div style={{position:"absolute",bottom:"12px",left:"16px",right:"16px"}}>
            <div style={{fontSize:"20px",fontWeight:900,color:"#fff",lineHeight:1.2,marginBottom:"4px"}}>{grupo.nombre}</div>
            <div style={{display:"flex",gap:"6px",flexWrap:"wrap"}}>
              <span style={{background:grupo.tipo==="cerrado"?"rgba(230,57,70,0.8)":"rgba(0,168,132,0.8)",borderRadius:"20px",padding:"2px 10px",fontSize:"10px",fontWeight:800,color:"#fff"}}>{grupo.tipo==="cerrado"?"🔒 Cerrado":"🔓 Abierto"}</span>
              {grupo.categoria_nombre&&<span style={{background:"rgba(212,160,23,0.8)",borderRadius:"20px",padding:"2px 10px",fontSize:"10px",fontWeight:800,color:"#1a2a3a"}}>{grupo.categoria_nombre}</span>}
              {grupo.whatsapp_link&&<span style={{background:"rgba(37,211,102,0.85)",borderRadius:"20px",padding:"2px 10px",fontSize:"10px",fontWeight:800,color:"#fff"}}>📱 WA</span>}
            </div>
          </div>
        </div>
        <div style={{padding:"10px 16px 14px",display:"flex",gap:"8px"}}>
          {!esMiembro?(
            <button onClick={unirse} style={{flex:1,background:"linear-gradient(135deg,#f0c040,#d4a017)",border:"none",borderRadius:"12px",padding:"11px",fontSize:"13px",fontWeight:900,color:"#1a2a3a",cursor:"pointer",fontFamily:"'Nunito',sans-serif",boxShadow:"0 3px 0 #a07810"}}>
              {grupo.tipo==="cerrado"?"🔒 Solicitar acceso":"✅ Unirse al grupo"}
            </button>
          ):(
            <div style={{flex:1,background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:"12px",padding:"10px",fontSize:"12px",fontWeight:700,color:"#d4a017",textAlign:"center"}}>
              ✅ Sos miembro {miMembro?.rol==="creador"?" · 👑 Creador":miMembro?.rol==="moderador"?" · 🛡️ Mod":""}{tieneBit?" · 🏆 BIT activo":""}
            </div>
          )}
          {grupo.whatsapp_link&&<a href={grupo.whatsapp_link} target="_blank" rel="noreferrer" style={{background:"#25d366",border:"none",borderRadius:"12px",padding:"11px 16px",fontSize:"18px",cursor:"pointer",textDecoration:"none",display:"flex",alignItems:"center"}}>📱</a>}
        </div>
      </div>

      {/* Tabs */}
      <div style={{background:"#fff",borderBottom:"2px solid #f0f0f0",overflowX:"auto",scrollbarWidth:"none",display:"flex"}}>
        {TABS_BASE.filter(t=>tabVisible(t.id)).map(t=>{
          const bloq = tabBloqueado(t.id);
          return(
            <button key={t.id} onClick={()=>handleTab(t.id)} style={{flexShrink:0,padding:"12px 14px",border:"none",background:"none",fontSize:"12px",fontWeight:tab===t.id?900:600,color:tab===t.id?"#d4a017":bloq?"#ccc":"#2c2c2e",borderBottom:tab===t.id?"3px solid #d4a017":"3px solid transparent",cursor:"pointer",fontFamily:"'Nunito',sans-serif",whiteSpace:"nowrap"}}>
              {t.label}{bloq?" 🔒":""}
              {t.id==="moderador"&&pendientes.length>0&&<span style={{background:"#e63946",color:"#fff",fontSize:"9px",fontWeight:900,padding:"1px 5px",borderRadius:"10px",marginLeft:"4px"}}>{pendientes.length}</span>}
            </button>
          );
        })}
      </div>

      {/* Contenido */}
      <div style={{padding:"16px"}}>

        {/* ── INFO ── */}
        {tab==="info"&&(
          <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
            {grupo.descripcion&&<Card titulo="📋 Descripción"><div style={{fontSize:"14px",fontWeight:600,color:"#2c2c2e",lineHeight:1.6}}>{grupo.descripcion}</div></Card>}
            <Card titulo="📊 Datos">
              {[{l:"Tipo",v:grupo.tipo==="cerrado"?"🔒 Cerrado":"🔓 Abierto"},{l:"Miembros",v:`${grupo.miembros_count}`},{l:"Categoría",v:grupo.categoria_nombre||"—"},{l:"Subcategoría",v:grupo.subcategoria_nombre||"—"}]
                .map((r,i,a)=><div key={i} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:i<a.length-1?"1px solid #f5f5f5":"none"}}><span style={{fontSize:"13px",fontWeight:700,color:"#9a9a9a"}}>{r.l}</span><span style={{fontSize:"13px",fontWeight:800,color:"#1a2a3a"}}>{r.v}</span></div>)}
            </Card>
            {!tieneBit&&esMiembro&&<PromocionBit onComprar={()=>setPopupBit(true)}/>}
          </div>
        )}

        {/* ── CHAT ── */}
        {tab==="chat"&&(
          <div style={{display:"flex",flexDirection:"column",height:"calc(100vh - 380px)",minHeight:"300px"}}>
            <div ref={chatRef} style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column",gap:"8px",paddingBottom:"8px"}}>
              {mensajes.length===0&&<div style={{textAlign:"center",padding:"40px",color:"#9a9a9a",fontSize:"13px",fontWeight:600}}>Sin mensajes aún.</div>}
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
            <div style={{display:"flex",gap:"8px",padding:"10px 0 0"}}>
              <input type="text" value={nuevoMsg} onChange={e=>setNuevoMsg(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&enviarMensaje()}
                placeholder="Escribí un mensaje..." maxLength={500}
                style={{flex:1,border:"2px solid #e8e8e8",borderRadius:"12px",padding:"11px 14px",fontSize:"13px",fontFamily:"'Nunito',sans-serif",outline:"none",color:"#1a2a3a"}}
              />
              <button onClick={enviarMensaje} disabled={!nuevoMsg.trim()||enviando} style={{background:nuevoMsg.trim()?"linear-gradient(135deg,#d4a017,#f0c040)":"#f0f0f0",border:"none",borderRadius:"12px",padding:"0 18px",fontSize:"20px",cursor:nuevoMsg.trim()?"pointer":"not-allowed",boxShadow:nuevoMsg.trim()?"0 3px 0 #a07810":"none"}}>
                {enviando?"⏳":"📤"}
              </button>
            </div>
          </div>
        )}

        {/* ── MIEMBROS ── */}
        {tab==="miembros"&&(
          <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
            {miembros.filter(m=>m.estado==="activo").sort((a,b)=>a.rol==="creador"?-1:b.rol==="creador"?1:a.rol==="moderador"?-1:b.rol==="moderador"?1:0)
              .map((m,i)=>(
                <div key={i} style={{background:"#fff",borderRadius:"14px",padding:"14px 16px",boxShadow:"0 2px 6px rgba(0,0,0,0.06)",display:"flex",alignItems:"center",gap:"12px"}}>
                  <div style={{width:"40px",height:"40px",borderRadius:"50%",background:"linear-gradient(135deg,#1a2a3a,#243b55)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"18px",flexShrink:0}}>
                    {m.rol==="creador"?"👑":m.rol==="moderador"?"🛡️":"👤"}
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:"14px",fontWeight:800,color:"#1a2a3a"}}>{m.nombre_usuario}</div>
                    {config.ver_miembros_detalle&&<div style={{fontSize:"11px",color:"#9a9a9a",fontWeight:600,textTransform:"capitalize"}}>{m.rol}{m.bits_grupo?" · 🏆":""}{m.canon_gratis?" · gratis":""}</div>}
                  </div>
                  {(m.rol==="creador"||m.rol==="moderador")&&<span style={{background:"rgba(212,160,23,0.15)",border:"1px solid rgba(212,160,23,0.4)",borderRadius:"20px",padding:"2px 10px",fontSize:"10px",fontWeight:800,color:"#a07810"}}>{m.rol==="creador"?"👑 Creador":"🛡️ Mod"}</span>}
                </div>
              ))
            }
            {miembros.filter(m=>m.estado==="activo").length===0&&<div style={{textAlign:"center",padding:"40px",color:"#9a9a9a"}}>Sin miembros activos</div>}
          </div>
        )}

        {/* ── ANUNCIOS INTERNOS ── */}
        {tab==="anuncios"&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"12px"}}>
              <span style={{fontSize:"14px",fontWeight:800,color:"#1a2a3a"}}>Publicaciones internas</span>
              {esMiembro&&<button onClick={()=>{setNuevaPub(p=>({...p,tipo:"interna"}));setPopupPub(true);}} style={{background:"linear-gradient(135deg,#f0c040,#d4a017)",border:"none",borderRadius:"10px",padding:"7px 14px",fontSize:"12px",fontWeight:900,color:"#1a2a3a",cursor:"pointer",fontFamily:"'Nunito',sans-serif"}}>➕ Publicar</button>}
            </div>
            <ListaPublis publis={publis.filter(p=>p.tipo==="interna")} fmt={fmt} fmtF={fmtF}/>
          </div>
        )}

        {/* ── ESPECIAL (genérico configurable) ── */}
        {tab==="especial"&&(
          <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
            <Card titulo={`⭐ ${grupo.especial_titulo||"Especial"}`}>
              {grupo.especial_contenido?(
                <div style={{fontSize:"14px",fontWeight:600,color:"#2c2c2e",lineHeight:1.7,whiteSpace:"pre-line"}}>{grupo.especial_contenido}</div>
              ):(
                <div style={{textAlign:"center",padding:"20px",color:"#9a9a9a",fontSize:"13px"}}>
                  {esMod?"Esta pestaña está vacía. Podés editarla desde Moderador → Contenido especial.":"Contenido especial próximamente."}
                </div>
              )}
            </Card>
            {grupo.especial_imagenes?.length>0&&(
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px"}}>
                {grupo.especial_imagenes.map((img,i)=>(
                  <img key={i} src={img} alt="" style={{width:"100%",borderRadius:"12px",objectFit:"cover",aspectRatio:"1"}}/>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── REGLAS ── */}
        {tab==="reglas"&&(
          <Card titulo="📌 Reglas del grupo">
            {grupo.reglas?<div style={{fontSize:"14px",fontWeight:600,color:"#2c2c2e",lineHeight:1.7,whiteSpace:"pre-line"}}>{grupo.reglas}</div>
            :<div style={{textAlign:"center",padding:"30px",color:"#9a9a9a",fontSize:"13px"}}>Sin reglas definidas.</div>}
          </Card>
        )}

        {/* ── LINKS ── */}
        {tab==="links"&&(
          <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
            {(!grupo.links||grupo.links.length===0)
              ?<div style={{textAlign:"center",padding:"40px",color:"#9a9a9a",fontSize:"13px"}}>No hay links.</div>
              :grupo.links.map((link,i)=>(
                <a key={i} href={link} target="_blank" rel="noreferrer" style={{background:"#fff",borderRadius:"14px",padding:"14px 16px",boxShadow:"0 2px 6px rgba(0,0,0,0.06)",textDecoration:"none",display:"flex",alignItems:"center",gap:"10px"}}>
                  <span style={{fontSize:"20px"}}>🔗</span>
                  <span style={{fontSize:"13px",fontWeight:700,color:"#3a7bd5",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{link}</span>
                </a>
              ))
            }
          </div>
        )}

        {/* ── PÚBLICO ── */}
        {tab==="publico"&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"8px"}}>
              <span style={{fontSize:"14px",fontWeight:800,color:"#1a2a3a"}}>🌐 Público para todos</span>
              {esMiembro&&<button onClick={()=>{setNuevaPub(p=>({...p,tipo:"publica"}));setPopupPub(true);}} style={{background:"linear-gradient(135deg,#f0c040,#d4a017)",border:"none",borderRadius:"10px",padding:"7px 14px",fontSize:"12px",fontWeight:900,color:"#1a2a3a",cursor:"pointer",fontFamily:"'Nunito',sans-serif"}}>➕ Publicar</button>}
            </div>
            <div style={{fontSize:"12px",color:"#9a9a9a",fontWeight:600,marginBottom:"12px"}}>Cualquier miembro puede publicar. Visible para todos los usuarios de NexoNet.</div>
            <ListaPublis publis={publis.filter(p=>p.tipo==="publica")} fmt={fmt} fmtF={fmtF}/>
          </div>
        )}

        {/* ── MODERADOR ── */}
        {tab==="moderador"&&esMod&&(
          <div style={{display:"flex",flexDirection:"column",gap:"16px"}}>

            {/* Solicitudes pendientes */}
            {pendientes.length>0&&(
              <Card titulo={`🔔 Solicitudes pendientes (${pendientes.length})`}>
                {pendientes.map((m,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"center",gap:"10px",padding:"10px 0",borderBottom:i<pendientes.length-1?"1px solid #f5f5f5":"none"}}>
                    <div style={{flex:1,fontSize:"14px",fontWeight:800,color:"#1a2a3a"}}>{m.nombre_usuario}</div>
                    <button onClick={()=>aprobarMiembro(m)} style={{background:"linear-gradient(135deg,#f0c040,#d4a017)",border:"none",borderRadius:"8px",padding:"6px 14px",fontSize:"12px",fontWeight:900,color:"#1a2a3a",cursor:"pointer",fontFamily:"'Nunito',sans-serif"}}>
                      ✅ Aprobar
                    </button>
                  </div>
                ))}
              </Card>
            )}

            {/* Invitar miembros */}
            <Card titulo="📨 Invitar miembros">
              <div style={{marginBottom:"10px"}}>
                <div style={{fontSize:"11px",fontWeight:800,color:"#9a9a9a",textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:"6px"}}>¿El invitado paga el BIT Grupo ($500)?</div>
                <div style={{display:"flex",gap:"8px"}}>
                  {[{v:true,l:"🆓 Gratis (lo paga el grupo)"},{v:false,l:"💰 Lo paga el invitado"}].map(o=>(
                    <button key={String(o.v)} onClick={()=>setCanonGratisInv(o.v)} style={{flex:1,background:canonGratisInv===o.v?"#d4a017":"#f4f4f2",border:`2px solid ${canonGratisInv===o.v?"#d4a017":"#e8e8e6"}`,borderRadius:"10px",padding:"8px",fontSize:"11px",fontWeight:800,color:canonGratisInv===o.v?"#1a2a3a":"#2c2c2e",cursor:"pointer",fontFamily:"'Nunito',sans-serif"}}>
                      {o.l}
                    </button>
                  ))}
                </div>
              </div>
              <textarea value={msgInv} onChange={e=>setMsgInv(e.target.value)} rows={2} maxLength={200} placeholder="Mensaje de invitación..."
                style={{width:"100%",border:"2px solid #e8e8e8",borderRadius:"10px",padding:"9px 12px",fontSize:"12px",fontFamily:"'Nunito',sans-serif",outline:"none",color:"#1a2a3a",resize:"none",boxSizing:"border-box",marginBottom:"10px"}}
              />
              <div style={{display:"flex",gap:"8px",marginBottom:"8px"}}>
                <input type="text" value={busqInv} onChange={e=>setBusqInv(e.target.value)} placeholder="Buscar usuario por nombre..." onKeyDown={e=>e.key==="Enter"&&buscarUsuario()}
                  style={{flex:1,border:"2px solid #e8e8e8",borderRadius:"10px",padding:"9px 12px",fontSize:"13px",fontFamily:"'Nunito',sans-serif",outline:"none",color:"#1a2a3a"}}
                />
                <button onClick={buscarUsuario} disabled={buscando} style={{background:"linear-gradient(135deg,#f0c040,#d4a017)",border:"none",borderRadius:"10px",padding:"0 16px",fontSize:"13px",fontWeight:900,color:"#1a2a3a",cursor:"pointer",fontFamily:"'Nunito',sans-serif"}}>
                  {buscando?"⏳":"🔍"}
                </button>
              </div>
              {resInv.length>0&&(
                <div style={{display:"flex",flexDirection:"column",gap:"6px"}}>
                  {resInv.map(u=>(
                    <div key={u.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:"#f9f9f9",borderRadius:"10px",padding:"10px 12px"}}>
                      <span style={{fontSize:"13px",fontWeight:800,color:"#1a2a3a"}}>👤 {u.nombre_usuario}</span>
                      <button onClick={()=>invitar(u)} style={{background:"linear-gradient(135deg,#f0c040,#d4a017)",border:"none",borderRadius:"8px",padding:"5px 12px",fontSize:"11px",fontWeight:900,color:"#1a2a3a",cursor:"pointer",fontFamily:"'Nunito',sans-serif"}}>
                        📨 Invitar
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Roles de miembros */}
            <Card titulo="🛡️ Gestionar roles">
              {miembros.filter(m=>m.estado==="activo"&&m.usuario_id!==grupo.creador_id).map((m,i,a)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:"10px",padding:"8px 0",borderBottom:i<a.length-1?"1px solid #f5f5f5":"none"}}>
                  <div style={{flex:1,fontSize:"13px",fontWeight:800,color:"#1a2a3a"}}>{m.nombre_usuario}</div>
                  <select value={m.rol} onChange={e=>cambiarRol(m,e.target.value)} style={{border:"2px solid #e8e8e8",borderRadius:"8px",padding:"5px 8px",fontSize:"12px",fontFamily:"'Nunito',sans-serif",outline:"none",color:"#1a2a3a",background:"#fff"}}>
                    <option value="miembro">👤 Miembro</option>
                    <option value="moderador">🛡️ Moderador</option>
                  </select>
                </div>
              ))}
              {miembros.filter(m=>m.estado==="activo"&&m.usuario_id!==grupo.creador_id).length===0&&<div style={{padding:"10px 0",color:"#9a9a9a",fontSize:"13px"}}>Sin otros miembros activos.</div>}
            </Card>

            {/* Configuración de permisos */}
            {configEdit&&(
              <Card titulo="⚙️ Permisos y visibilidad">
                <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
                  {/* Toggle ver detalle miembros */}
                  <ToggleOpc label="Ver detalle de cada miembro" sub="Rol, BIT activo, etc." val={configEdit.ver_miembros_detalle} onChange={v=>setConfigEdit(c=>c?{...c,ver_miembros_detalle:v}:c)}/>
                  <ToggleOpc label="Los miembros pueden invitar" sub="No solo el moderador" val={configEdit.miembros_pueden_invitar} onChange={v=>setConfigEdit(c=>c?{...c,miembros_pueden_invitar:v}:c)}/>
                  <ToggleOpc label="BIT Grupo gratis por defecto" sub="Al invitar, el invitado no paga" val={configEdit.canon_gratis_por_defecto} onChange={v=>setConfigEdit(c=>c?{...c,canon_gratis_por_defecto:v}:c)}/>
                  {/* Pestañas públicas */}
                  <div>
                    <div style={{fontSize:"12px",fontWeight:800,color:"#1a2a3a",marginBottom:"8px"}}>Pestañas visibles para NO miembros</div>
                    <div style={{display:"flex",flexWrap:"wrap",gap:"6px"}}>
                      {TABS_BASE.filter(t=>!TABS_SOLO_MOD.includes(t.id)&&!TABS_REQUIEREN_BIT.includes(t.id)).map(t=>{
                        const activo=configEdit.pestanas_publicas.includes(t.id);
                        return(
                          <button key={t.id} onClick={()=>{
                            setConfigEdit(c=>c?{...c,pestanas_publicas:activo?c.pestanas_publicas.filter(x=>x!==t.id):[...c.pestanas_publicas,t.id]}:c);
                          }} style={{background:activo?"#1a2a3a":"#f4f4f2",border:`2px solid ${activo?"#1a2a3a":"#e8e8e6"}`,borderRadius:"20px",padding:"5px 12px",fontSize:"11px",fontWeight:800,color:activo?"#d4a017":"#2c2c2e",cursor:"pointer",fontFamily:"'Nunito',sans-serif"}}>
                            {t.label}{activo?" ✓":""}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  {/* Contenido especial */}
                  <div>
                    <div style={{fontSize:"12px",fontWeight:800,color:"#1a2a3a",marginBottom:"6px"}}>⭐ Título de la pestaña especial</div>
                    <input type="text" defaultValue={grupo.especial_titulo||""} maxLength={40} placeholder="Ej: Carta del mes, Fixture, Horarios..."
                      onBlur={async e=>{ await supabase.from("grupos").update({especial_titulo:e.target.value}).eq("id",gId); }}
                      style={{width:"100%",border:"2px solid #e8e8e8",borderRadius:"10px",padding:"9px 12px",fontSize:"13px",fontFamily:"'Nunito',sans-serif",outline:"none",color:"#1a2a3a",boxSizing:"border-box",marginBottom:"6px"}}
                    />
                    <div style={{fontSize:"12px",fontWeight:800,color:"#1a2a3a",marginBottom:"6px"}}>Contenido</div>
                    <textarea defaultValue={grupo.especial_contenido||""} rows={5} maxLength={2000} placeholder="Escribí el contenido de esta pestaña..."
                      onBlur={async e=>{ await supabase.from("grupos").update({especial_contenido:e.target.value}).eq("id",gId); }}
                      style={{width:"100%",border:"2px solid #e8e8e8",borderRadius:"10px",padding:"9px 12px",fontSize:"13px",fontFamily:"'Nunito',sans-serif",outline:"none",color:"#1a2a3a",resize:"none",boxSizing:"border-box"}}
                    />
                  </div>
                  <button onClick={guardarConfig} disabled={guardandoCfg} style={{background:"linear-gradient(135deg,#f0c040,#d4a017)",border:"none",borderRadius:"12px",padding:"12px",fontSize:"14px",fontWeight:900,color:"#1a2a3a",cursor:"pointer",fontFamily:"'Nunito',sans-serif",boxShadow:"0 3px 0 #a07810"}}>
                    {guardandoCfg?"Guardando...":"💾 Guardar configuración"}
                  </button>
                </div>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* Popup BIT */}
      {popupBit&&(
        <div style={{position:"fixed",inset:0,zIndex:200,background:"rgba(0,0,0,0.65)",display:"flex",alignItems:"flex-end",padding:"16px"}}>
          <div style={{width:"100%",background:"#fff",borderRadius:"20px 20px 16px 16px",padding:"24px 20px 20px",boxShadow:"0 -8px 40px rgba(0,0,0,0.3)"}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:"16px"}}>
              <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"22px",color:"#1a2a3a",letterSpacing:"1px"}}>🏆 BIT Grupo</div>
              <button onClick={()=>setPopupBit(false)} style={{background:"#f0f0f0",border:"none",borderRadius:"50%",width:"32px",height:"32px",fontSize:"16px",cursor:"pointer"}}>✕</button>
            </div>
            <div style={{background:"linear-gradient(135deg,#1a2a3a,#243b55)",borderRadius:"16px",padding:"20px",textAlign:"center",marginBottom:"16px"}}>
              <div style={{fontSize:"36px",marginBottom:"8px"}}>💬</div>
              <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"24px",color:"#f0c040",letterSpacing:"1px",marginBottom:"6px"}}>$500 / 30 días</div>
              <div style={{fontSize:"13px",color:"#8a9aaa",fontWeight:600,lineHeight:1.5}}>Accedé al chat interno y anuncios exclusivos de este grupo.</div>
            </div>
            <button onClick={()=>{setPopupBit(false);router.push("/comprar?cat=extras");}} style={{width:"100%",background:"linear-gradient(135deg,#f0c040,#d4a017)",border:"none",borderRadius:"12px",padding:"14px",fontSize:"15px",fontWeight:900,color:"#1a2a3a",cursor:"pointer",fontFamily:"'Nunito',sans-serif",boxShadow:"0 4px 0 #a07810",marginBottom:"10px"}}>
              ⚡ Activar BIT Grupo
            </button>
            <button onClick={()=>setPopupBit(false)} style={{width:"100%",background:"none",border:"none",padding:"10px",fontSize:"13px",fontWeight:700,color:"#9a9a9a",cursor:"pointer",fontFamily:"'Nunito',sans-serif"}}>Cancelar</button>
          </div>
        </div>
      )}

      {/* Popup publicar */}
      {popupPub&&(
        <div style={{position:"fixed",inset:0,zIndex:200,background:"rgba(0,0,0,0.65)",display:"flex",alignItems:"flex-end",padding:"16px"}}>
          <div style={{width:"100%",background:"#fff",borderRadius:"20px 20px 16px 16px",padding:"24px 20px 20px",boxShadow:"0 -8px 40px rgba(0,0,0,0.3)"}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:"16px"}}>
              <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"20px",color:"#1a2a3a",letterSpacing:"1px"}}>{nuevaPub.tipo==="publica"?"🌐 Publicación pública":"📢 Publicación interna"}</div>
              <button onClick={()=>setPopupPub(false)} style={{background:"#f0f0f0",border:"none",borderRadius:"50%",width:"32px",height:"32px",fontSize:"16px",cursor:"pointer"}}>✕</button>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:"10px",marginBottom:"16px"}}>
              <input value={nuevaPub.titulo} onChange={e=>setNuevaPub(p=>({...p,titulo:e.target.value}))} placeholder="Título *" maxLength={120}
                style={{border:"2px solid #e8e8e8",borderRadius:"12px",padding:"11px 14px",fontSize:"14px",fontFamily:"'Nunito',sans-serif",outline:"none",color:"#1a2a3a"}}
              />
              <textarea value={nuevaPub.descripcion} onChange={e=>setNuevaPub(p=>({...p,descripcion:e.target.value}))} placeholder="Descripción" rows={3} maxLength={500}
                style={{border:"2px solid #e8e8e8",borderRadius:"12px",padding:"11px 14px",fontSize:"13px",fontFamily:"'Nunito',sans-serif",outline:"none",color:"#1a2a3a",resize:"none"}}
              />
              <div style={{display:"flex",gap:"8px"}}>
                <input value={nuevaPub.precio} onChange={e=>setNuevaPub(p=>({...p,precio:e.target.value}))} placeholder="Precio (opcional)" type="number"
                  style={{flex:1,border:"2px solid #e8e8e8",borderRadius:"12px",padding:"11px 14px",fontSize:"13px",fontFamily:"'Nunito',sans-serif",outline:"none",color:"#1a2a3a"}}
                />
                <select value={nuevaPub.moneda} onChange={e=>setNuevaPub(p=>({...p,moneda:e.target.value}))}
                  style={{border:"2px solid #e8e8e8",borderRadius:"12px",padding:"11px 12px",fontSize:"13px",fontFamily:"'Nunito',sans-serif",outline:"none",color:"#1a2a3a",background:"#fff"}}>
                  <option value="ARS">ARS</option><option value="USD">USD</option>
                </select>
              </div>
            </div>
            <button onClick={publicar} disabled={!nuevaPub.titulo.trim()}
              style={{width:"100%",background:nuevaPub.titulo.trim()?"linear-gradient(135deg,#f0c040,#d4a017)":"#f0f0f0",border:"none",borderRadius:"12px",padding:"14px",fontSize:"15px",fontWeight:900,color:nuevaPub.titulo.trim()?"#1a2a3a":"#bbb",cursor:nuevaPub.titulo.trim()?"pointer":"not-allowed",fontFamily:"'Nunito',sans-serif",boxShadow:nuevaPub.titulo.trim()?"0 4px 0 #a07810":"none"}}>
              📢 Publicar
            </button>
          </div>
        </div>
      )}

      <BottomNav/>
    </main>
  );
}

// ── Componentes auxiliares ──────────────────────────────────────────────────
function Card({ titulo, children }:{ titulo:string; children:React.ReactNode }) {
  return(
    <div style={{background:"#fff",borderRadius:"14px",padding:"16px",boxShadow:"0 2px 8px rgba(0,0,0,0.06)"}}>
      <div style={{fontSize:"12px",fontWeight:800,color:"#9a9a9a",textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:"12px"}}>{titulo}</div>
      {children}
    </div>
  );
}

function ToggleOpc({ label, sub, val, onChange }:{ label:string; sub:string; val:boolean; onChange:(v:boolean)=>void }) {
  return(
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"6px 0"}}>
      <div>
        <div style={{fontSize:"13px",fontWeight:800,color:"#1a2a3a"}}>{label}</div>
        <div style={{fontSize:"11px",color:"#9a9a9a",fontWeight:600}}>{sub}</div>
      </div>
      <button onClick={()=>onChange(!val)} style={{width:"44px",height:"24px",borderRadius:"12px",border:"none",background:val?"#d4a017":"#e0e0e0",position:"relative",cursor:"pointer",transition:"background .2s",flexShrink:0}}>
        <div style={{width:"18px",height:"18px",borderRadius:"50%",background:"#fff",position:"absolute",top:"3px",left:val?"23px":"3px",transition:"left .2s",boxShadow:"0 1px 3px rgba(0,0,0,0.2)"}}/>
      </button>
    </div>
  );
}

function PromocionBit({ onComprar }:{ onComprar:()=>void }) {
  return(
    <div style={{background:"linear-gradient(135deg,#1a2a3a,#243b55)",borderRadius:"14px",padding:"16px",textAlign:"center"}}>
      <div style={{fontSize:"24px",marginBottom:"8px"}}>🏆</div>
      <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"20px",color:"#f0c040",letterSpacing:"1px",marginBottom:"6px"}}>BIT Grupo — $500/30 días</div>
      <div style={{fontSize:"12px",color:"#8a9aaa",fontWeight:600,marginBottom:"14px"}}>Chat interno y anuncios exclusivos del grupo</div>
      <button onClick={onComprar} style={{background:"linear-gradient(135deg,#f0c040,#d4a017)",border:"none",borderRadius:"12px",padding:"11px 24px",fontSize:"13px",fontWeight:900,color:"#1a2a3a",cursor:"pointer",fontFamily:"'Nunito',sans-serif",boxShadow:"0 3px 0 #a07810"}}>
        ⚡ Activar BIT Grupo
      </button>
    </div>
  );
}

function ListaPublis({ publis, fmt, fmtF }:{ publis:Publi[]; fmt:(p:number,m:string)=>string; fmtF:(d:string)=>string }) {
  if(publis.length===0) return <div style={{textAlign:"center",padding:"40px",color:"#9a9a9a",fontSize:"13px"}}>Sin publicaciones aún.</div>;
  return(
    <div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
      {publis.map(p=>(
        <div key={p.id} style={{background:"#fff",borderRadius:"14px",padding:"14px 16px",boxShadow:"0 2px 6px rgba(0,0,0,0.06)"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"6px"}}>
            <div style={{fontSize:"11px",fontWeight:800,color:"#d4a017"}}>{p.nombre_usuario}</div>
            <div style={{fontSize:"10px",color:"#bbb",fontWeight:600}}>{fmtF(p.created_at)}</div>
          </div>
          <div style={{fontSize:"14px",fontWeight:800,color:"#1a2a3a",marginBottom:"4px"}}>{p.titulo}</div>
          {p.descripcion&&<div style={{fontSize:"13px",fontWeight:600,color:"#555",lineHeight:1.5,marginBottom:"6px"}}>{p.descripcion}</div>}
          {p.precio>0&&<div style={{fontSize:"16px",fontWeight:900,color:"#d4a017"}}>{fmt(p.precio,p.moneda)}</div>}
        </div>
      ))}
    </div>
  );
}
