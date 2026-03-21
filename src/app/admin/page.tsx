"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const ADMIN_UUID = "ab56253d-b92e-4b73-a19a-3cd0cd95c458";

type Tab = "dashboard"|"usuarios"|"anuncios"|"grupos"|"mensajes"|"promotores"|"pagos"|"alarmas"|"config"|"contactos";
type ConfigSub = "anuncios"|"empresas"|"servicios"|"trabajo"|"grupos"|"filtros_ia";

const S = {
  card:  { background:"#fff", borderRadius:"16px", padding:"20px", boxShadow:"0 2px 12px rgba(0,0,0,0.07)", marginBottom:"14px" } as React.CSSProperties,
  input: { width:"100%", border:"2px solid #e8e8e6", borderRadius:"10px", padding:"10px 14px", fontSize:"13px", fontFamily:"'Nunito',sans-serif", color:"#2c2c2e", outline:"none", boxSizing:"border-box" as const },
  btn:   (c="#d4a017",light=false) => ({ background:light?`${c}18`:`linear-gradient(135deg,${c},${c}cc)`, border:light?`1px solid ${c}44`:"none", borderRadius:"10px", padding:"7px 14px", fontSize:"12px", fontWeight:900, color:light?c:"#fff", cursor:"pointer", fontFamily:"'Nunito',sans-serif", whiteSpace:"nowrap" as const } as React.CSSProperties),
  label: { fontSize:"11px", fontWeight:800, color:"#666", textTransform:"uppercase" as const, letterSpacing:"1px", marginBottom:"5px", display:"block" },
  badge: (c:string,bg:string) => ({ background:bg, color:c, borderRadius:"20px", padding:"2px 9px", fontSize:"10px", fontWeight:900, whiteSpace:"nowrap" as const } as React.CSSProperties),
  row:   { display:"flex", alignItems:"center", gap:"8px", padding:"10px 0", borderBottom:"1px solid #f0f0f0" } as React.CSSProperties,
  sect:  { fontSize:"11px", fontWeight:800, color:"#9a9a9a", textTransform:"uppercase" as const, letterSpacing:"1px", marginBottom:"12px" },
};

const StatBox = ({n,l,e,c="#d4a017"}:{n:string;l:string;e:string;c?:string}) => (
  <div style={{background:"#fff",borderRadius:"14px",padding:"14px 10px",textAlign:"center",boxShadow:"0 2px 8px rgba(0,0,0,0.06)"}}>
    <div style={{fontSize:"20px",marginBottom:"2px"}}>{e}</div>
    <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"26px",color:c,lineHeight:1}}>{n}</div>
    <div style={{fontSize:"9px",fontWeight:700,color:"#9a9a9a",textTransform:"uppercase",letterSpacing:"0.5px",marginTop:"2px"}}>{l}</div>
  </div>
);

const Modal = ({titulo,onClose,children}:{titulo:string;onClose:()=>void;children:React.ReactNode}) => (
  <div style={{position:"fixed",inset:0,zIndex:900,background:"rgba(0,0,0,0.6)",display:"flex",alignItems:"center",justifyContent:"center",padding:"16px"}} onClick={onClose}>
    <div style={{background:"#fff",borderRadius:"20px",padding:"24px",width:"100%",maxWidth:"420px",maxHeight:"90vh",overflowY:"auto",fontFamily:"'Nunito',sans-serif"}} onClick={e=>e.stopPropagation()}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"18px"}}>
        <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"22px",color:"#1a2a3a",letterSpacing:"1px"}}>{titulo}</div>
        <button onClick={onClose} style={{background:"#f0f0f0",border:"none",borderRadius:"50%",width:"32px",height:"32px",fontSize:"16px",cursor:"pointer"}}>✕</button>
      </div>
      {children}
    </div>
  </div>
);

export default function AdminPanel() {
  const router = useRouter();
  const [authed,  setAuthed]  = useState(false);
  const [tab,     setTab]     = useState<Tab>("dashboard");
  const [loading, setLoading] = useState(true);
  const [toast,   setToast]   = useState("");

  const [stats,      setStats]      = useState<any>({});
  const [usuarios,   setUsuarios]   = useState<any[]>([]);
  const [anuncios,   setAnuncios]   = useState<any[]>([]);
  const [grupos,     setGrupos]     = useState<any[]>([]);
  const [mensajes,   setMensajes]   = useState<any[]>([]);
  const [liqs,       setLiqs]       = useState<any[]>([]);
  const [comisiones, setComisiones] = useState<any[]>([]);
  const [rubros,     setRubros]     = useState<any[]>([]);
  const [pagos,      setPagos]      = useState<any[]>([]);
  const [alarmas,    setAlarmas]    = useState<any>({});

  const [grupoCats,    setGrupoCats]    = useState<any[]>([]);
  const [grupoSubcats, setGrupoSubcats] = useState<any[]>([]);

  const [expandRubro,    setExpandRubro]    = useState<number|null>(null);
  const [expandGrupoCat, setExpandGrupoCat] = useState<number|null>(null);

  const [modalRubro,       setModalRubro]       = useState<any>(null);
  const [modalSubrubro,    setModalSubrubro]     = useState<any>(null);
  const [modalGrupoCat,    setModalGrupoCat]     = useState<any>(null);
  const [modalGrupoSubcat, setModalGrupoSubcat]  = useState<any>(null);

  const [busqUser,    setBusqUser]    = useState("");
  const [busqAnuncio, setBusqAnuncio] = useState("");
  const [filtroUser,  setFiltroUser]  = useState("todos");

  const [modalUsuario,  setModalUsuario]  = useState<any>(null);
  const [modalAnuncio,  setModalAnuncio]  = useState<any>(null);
  const [modalMensaje,  setModalMensaje]  = useState<any>(null);
  const [modalBit,      setModalBit]      = useState<any>(null);
  const [modalPassword, setModalPassword] = useState<any>(null);
  const [nuevaPass,     setNuevaPass]     = useState("");
  const [showPass,      setShowPass]      = useState(false);
  const [modalNuevoAn,  setModalNuevoAn]  = useState(false);
  const [modalNuevoGr,  setModalNuevoGr]  = useState(false);

  const [bitTipo, setBitTipo] = useState("bits");
  const [bitCant, setBitCant] = useState("");
  const [bitNota, setBitNota] = useState("");

  const [msgDest,  setMsgDest]  = useState("");
  const [msgTexto, setMsgTexto] = useState("");
  const [msgTipo,  setMsgTipo]  = useState("sistema");

  const [nuevaAn, setNuevaAn] = useState<any>({ titulo:"", descripcion:"", precio:"", provincia:"", ciudad:"", tipo:"conexion", flash:false, permuto:false });
  const [nuevoGr, setNuevoGr] = useState({ nombre:"", descripcion:"", categoria_id:"" });

  // Filtros IA
  const [filtrosIA, setFiltrosIA] = useState<any[]>([]);
  const [filtroSubSel, setFiltroSubSel] = useState<number|null>(null);
  const [modalFiltro, setModalFiltro] = useState<any>(null);

  // Config subtab + entity rubros for empresa/servicio/trabajo
  const [configSub, setConfigSub] = useState<ConfigSub>("anuncios");
  const [entRubros, setEntRubros] = useState<any[]>([]);
  const [expandEntRubro, setExpandEntRubro] = useState<number|null>(null);
  const [modalEntRubro, setModalEntRubro] = useState<any>(null);
  const [modalEntSub, setModalEntSub] = useState<any>(null);
  const [entFiltros, setEntFiltros] = useState<any[]>([]);
  const [entFiltroSubSel, setEntFiltroSubSel] = useState<number|null>(null);
  const [modalEntFiltro, setModalEntFiltro] = useState<any>(null);

  // Crear usuario
  const [modalCrearUser, setModalCrearUser] = useState(false);
  const [nuevoUser, setNuevoUser] = useState({ email:"", password:"", nombre_usuario:"", nombre:"" });

  // Dashboard stats extra
  const [visitStats, setVisitStats] = useState<any>({ hoy:0, semana:0, mes:0, anio:0 });
  const [registrosMes, setRegistrosMes] = useState<{mes:string;cant:number}[]>([]);
  const [dineroStats, setDineroStats] = useState<any>({ total:0, esteMes:0 });

  // Respuesta admin en mensajes
  const [respAdmin, setRespAdmin] = useState<{msg:any;texto:string}|null>(null);

  // Contactos NexoNet
  const [contactos, setContactos] = useState<any[]>([]);
  const [respContacto, setRespContacto] = useState<{c:any;texto:string}|null>(null);

  const showToast = (msg:string) => { setToast(msg); setTimeout(()=>setToast(""),3000); };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session || session.user.id !== ADMIN_UUID) { router.push("/admin/login"); return; }
      setAuthed(true);
      cargarTodo();
    });
  }, []);

  const cargarTodo = useCallback(async () => {
    setLoading(true);
    const [
      {data:usrs},{data:anuns},{data:grps},{data:msgs},{data:lqs},{data:coms},
      {data:rubs},{data:pgs},{data:gcats},{data:gsubcats},
      {count:cu},{count:ca},{count:cg},{count:cm},
    ] = await Promise.all([
      supabase.from("usuarios").select("*").order("created_at",{ascending:false}).limit(300),
      supabase.from("anuncios").select("*,usuarios(nombre_usuario,codigo,email)").order("created_at",{ascending:false}).limit(300),
      supabase.from("grupos").select("*,usuarios(nombre_usuario)").order("created_at",{ascending:false}).limit(100),
      supabase.from("mensajes").select("*,emisor:emisor_id(nombre_usuario),receptor:receptor_id(nombre_usuario)").order("created_at",{ascending:false}).limit(200),
      supabase.from("liquidaciones_promotor").select("*,usuarios(nombre_usuario,codigo,email)").order("created_at",{ascending:false}),
      supabase.from("comisiones_promotor").select("*,promotor:promotor_id(nombre_usuario,codigo),origen:origen_id(nombre_usuario,codigo)").order("created_at",{ascending:false}).limit(100),
      supabase.from("rubros").select("*,subrubros(id,nombre,orden)").order("orden",{ascending:true}),
      supabase.from("pagos_mp").select("*,usuarios(nombre_usuario,codigo,email)").order("created_at",{ascending:false}).limit(200),
      supabase.from("grupo_categorias").select("*").order("orden",{ascending:true}),
      supabase.from("grupo_subcategorias").select("*").order("nombre"),
      supabase.from("usuarios").select("*",{count:"exact",head:true}),
      supabase.from("anuncios").select("*",{count:"exact",head:true}),
      supabase.from("grupos").select("*",{count:"exact",head:true}),
      supabase.from("mensajes").select("*",{count:"exact",head:true}),
    ]);

    setUsuarios(usrs||[]);
    setAnuncios(anuns||[]);
    setGrupos(grps||[]);
    setMensajes(msgs||[]);
    setLiqs(lqs||[]);
    setComisiones(coms||[]);
    setRubros(rubs||[]);
    setPagos(pgs||[]);
    setGrupoCats(gcats||[]);
    setGrupoSubcats(gsubcats||[]);

    const totalBits  = (usrs||[]).reduce((a:number,u:any)=>(a+(u.bits||0)+(u.bits_free||0)),0);
    const totalPagos = (pgs||[]).reduce((a:number,p:any)=>a+(p.monto||0),0);
    setStats({ usuarios:cu||0, anuncios:ca||0, grupos:cg||0, mensajes:cm||0, bits:totalBits, pagos:totalPagos });

    const {data:cfg} = await supabase.from("config").select("*").eq("clave","alarmas").single();
    if (cfg) setAlarmas(JSON.parse(cfg.valor||"{}"));

    // Contactos NexoNet
    const {data:contData} = await supabase.from("contactos_nexonet")
      .select("*,usuarios(nombre_usuario,codigo,email)")
      .order("created_at",{ascending:false}).limit(100);
    setContactos(contData||[]);

    // Visitas stats
    const hoy = new Date().toISOString().slice(0,10);
    const hace7 = new Date(Date.now()-7*24*60*60*1000).toISOString().slice(0,10);
    const hace30 = new Date(Date.now()-30*24*60*60*1000).toISOString().slice(0,10);
    const hace365 = new Date(Date.now()-365*24*60*60*1000).toISOString().slice(0,10);
    const [
      {count:vHoy1},{count:vSem1},{count:vMes1},{count:vAnio1},
      {count:vHoy2},{count:vSem2},{count:vMes2},{count:vAnio2},
    ] = await Promise.all([
      supabase.from("anuncio_visitas").select("*",{count:"exact",head:true}).gte("fecha",hoy),
      supabase.from("anuncio_visitas").select("*",{count:"exact",head:true}).gte("fecha",hace7),
      supabase.from("anuncio_visitas").select("*",{count:"exact",head:true}).gte("fecha",hace30),
      supabase.from("anuncio_visitas").select("*",{count:"exact",head:true}).gte("fecha",hace365),
      supabase.from("nexo_visitas").select("*",{count:"exact",head:true}).gte("fecha",hoy),
      supabase.from("nexo_visitas").select("*",{count:"exact",head:true}).gte("fecha",hace7),
      supabase.from("nexo_visitas").select("*",{count:"exact",head:true}).gte("fecha",hace30),
      supabase.from("nexo_visitas").select("*",{count:"exact",head:true}).gte("fecha",hace365),
    ]);
    setVisitStats({ hoy:(vHoy1||0)+(vHoy2||0), semana:(vSem1||0)+(vSem2||0), mes:(vMes1||0)+(vMes2||0), anio:(vAnio1||0)+(vAnio2||0) });

    // Registros por mes (últimos 12)
    const meses: {mes:string;cant:number}[] = [];
    for (let i=11;i>=0;i--) {
      const d = new Date(); d.setMonth(d.getMonth()-i);
      const desde = new Date(d.getFullYear(),d.getMonth(),1).toISOString();
      const hasta = new Date(d.getFullYear(),d.getMonth()+1,0,23,59,59).toISOString();
      const cant = (usrs||[]).filter((u:any)=>u.created_at>=desde&&u.created_at<=hasta).length;
      meses.push({ mes:`${d.getMonth()+1}/${String(d.getFullYear()).slice(2)}`, cant });
    }
    setRegistrosMes(meses);

    // Dinero
    const mesActual = new Date().toISOString().slice(0,7);
    const totalDinero = (pgs||[]).reduce((a:number,p:any)=>a+(p.monto||0),0);
    const esteMesDinero = (pgs||[]).filter((p:any)=>(p.created_at||"").startsWith(mesActual)).reduce((a:number,p:any)=>a+(p.monto||0),0);
    setDineroStats({ total:totalDinero, esteMes:esteMesDinero });

    setLoading(false);
  }, []);

  // ── Usuarios ──
  const bloquearUsuario = async (u:any) => {
    const nuevo = !u.bloqueado;
    await supabase.from("usuarios").update({bloqueado:nuevo}).eq("id",u.id);
    setUsuarios(prev=>prev.map(x=>x.id===u.id?{...x,bloqueado:nuevo}:x));
    showToast(nuevo?"Usuario bloqueado":"Usuario desbloqueado");
  };
  const eliminarUsuario = async (u:any) => {
    if (!confirm(`¿Eliminar a ${u.nombre_usuario}?`)) return;
    await supabase.from("usuarios").delete().eq("id",u.id);
    setUsuarios(prev=>prev.filter(x=>x.id!==u.id));
    showToast("Usuario eliminado");
  };
  const asignarBit = async () => {
    if (!modalBit||!bitCant) return;
    const cant = parseInt(bitCant);
    if (isNaN(cant)) return;
    const actual = modalBit[bitTipo]||0;
    // Recalcular insignia de logro
    const acumulado = (modalBit.bits_totales_acumulados||0) + cant;
    const NIVELES_LOGRO: [string,number][] = [["diamante",10000],["platino",5000],["oro",1000],["plata",500],["bronce",100],["ninguna",0]];
    const insignia = NIVELES_LOGRO.find(([,min]) => acumulado >= min)?.[0] || "ninguna";
    await supabase.from("usuarios").update({[bitTipo]:actual+cant, bits_totales_acumulados:acumulado, insignia_logro:insignia}).eq("id",modalBit.id);
    setUsuarios(prev=>prev.map(x=>x.id===modalBit.id?{...x,[bitTipo]:actual+cant,bits_totales_acumulados:acumulado,insignia_logro:insignia}:x));
    if (bitNota) await supabase.from("notificaciones").insert({usuario_id:modalBit.id,tipo:"sistema",mensaje:`💰 Admin acreditó ${cant} ${bitTipo.toUpperCase()} — ${bitNota}`,leida:false});
    setModalBit(null); setBitCant(""); setBitNota("");
    showToast(`✅ ${cant} ${bitTipo} acreditados`);
    await cargarTodo();
  };
  const resetPassword = async () => {
    if (!modalPassword || !nuevaPass.trim()) return;
    if (nuevaPass.length < 6) { showToast("❌ Mínimo 6 caracteres"); return; }
    const { error } = await supabase.auth.resetPasswordForEmail(modalPassword.email, {
      redirectTo: `${window.location.origin}/nueva-contrasena`,
    });
    if (error) {
      showToast("❌ Error: " + error.message);
    } else {
      showToast(`✅ Email de reset enviado a ${modalPassword.email}`);
      setModalPassword(null);
      setNuevaPass("");
    }
  };

  // ── Mensajes ──  ← FUNCIÓN RESTAURADA
  const enviarMensaje = async () => {
    if (!msgTexto.trim()) return;
    if (msgDest==="todos") {
      const inserts = usuarios.map(u=>({usuario_id:u.id,tipo:msgTipo,mensaje:msgTexto,leida:false}));
      await supabase.from("notificaciones").insert(inserts);
      showToast(`✅ Enviado a ${usuarios.length} usuarios`);
    } else if (msgDest) {
      await supabase.from("notificaciones").insert({usuario_id:msgDest,tipo:msgTipo,mensaje:msgTexto,leida:false});
      showToast("✅ Mensaje enviado");
    }
    setMsgTexto(""); setMsgDest(""); setModalMensaje(null);
  };

  // ── Anuncios ──
  const bloquearAnuncio = async (a:any) => {
    const nuevo = a.estado==="bloqueado"?"activo":"bloqueado";
    await supabase.from("anuncios").update({estado:nuevo}).eq("id",a.id);
    setAnuncios(prev=>prev.map(x=>x.id===a.id?{...x,estado:nuevo}:x));
    showToast(nuevo==="bloqueado"?"Anuncio bloqueado":"Anuncio activado");
  };
  const eliminarAnuncio = async (a:any) => {
    if (!confirm(`¿Eliminar "${a.titulo}"?`)) return;
    await supabase.from("anuncios").delete().eq("id",a.id);
    setAnuncios(prev=>prev.filter(x=>x.id!==a.id));
    showToast("Anuncio eliminado");
  };
  const guardarAnuncio = async (a:any) => {
    await supabase.from("anuncios").update({titulo:a.titulo,descripcion:a.descripcion,precio:parseFloat(a.precio)||0,link:a.link,estado:a.estado}).eq("id",a.id);
    setAnuncios(prev=>prev.map(x=>x.id===a.id?{...x,...a}:x));
    setModalAnuncio(null);
    showToast("✅ Anuncio guardado");
  };
  const publicarAnuncio = async () => {
    if (!nuevaAn.titulo) return;
    const {data,error} = await supabase.from("anuncios").insert({...nuevaAn,precio:parseFloat(nuevaAn.precio)||0,usuario_id:ADMIN_UUID,estado:"activo"}).select().single();
    if (!error&&data) { setAnuncios(prev=>[data,...prev]); setNuevaAn({titulo:"",descripcion:"",precio:"",provincia:"",ciudad:"",tipo:"conexion",flash:false,permuto:false}); setModalNuevoAn(false); showToast("✅ Anuncio publicado"); }
  };

  // ── Grupos ──
  const toggleGrupo = async (g:any) => {
    const nuevo = !g.activo;
    await supabase.from("grupos").update({activo:nuevo}).eq("id",g.id);
    setGrupos(prev=>prev.map(x=>x.id===g.id?{...x,activo:nuevo}:x));
    showToast(nuevo?"Grupo activado":"Grupo desactivado");
  };
  const crearGrupo = async () => {
    if (!nuevoGr.nombre) return;
    const {data,error} = await supabase.from("grupos").insert({nombre:nuevoGr.nombre,descripcion:nuevoGr.descripcion,creador_id:ADMIN_UUID,activo:true}).select().single();
    if (!error&&data) { setGrupos(prev=>[data,...prev]); setNuevoGr({nombre:"",descripcion:"",categoria_id:""}); setModalNuevoGr(false); showToast("✅ Grupo creado"); }
  };

  // ── Config: Rubros ──
  const guardarRubro = async (r:any) => {
    if (!r.nombre) return;
    if (r.id) {
      await supabase.from("rubros").update({nombre:r.nombre,emoji:r.emoji||"",orden:parseInt(r.orden)||0}).eq("id",r.id);
      setRubros(prev=>prev.map(x=>x.id===r.id?{...x,...r}:x));
      showToast("✅ Rubro actualizado");
    } else {
      const {data} = await supabase.from("rubros").insert({nombre:r.nombre,emoji:r.emoji||"",orden:parseInt(r.orden)||rubros.length}).select().single();
      if (data) setRubros(prev=>[...prev,{...data,subrubros:[]}]);
      showToast("✅ Rubro creado");
    }
    setModalRubro(null);
  };
  const eliminarRubro = async (id:number) => {
    if (!confirm("¿Eliminar este rubro y todos sus subrubros?")) return;
    await supabase.from("rubros").delete().eq("id",id);
    setRubros(prev=>prev.filter(x=>x.id!==id));
    showToast("Rubro eliminado");
  };
  const moverRubro = async (r:any, dir:"up"|"down") => {
    const idx = rubros.findIndex(x=>x.id===r.id);
    const swap = dir==="up" ? rubros[idx-1] : rubros[idx+1];
    if (!swap) return;
    await Promise.all([
      supabase.from("rubros").update({orden:swap.orden}).eq("id",r.id),
      supabase.from("rubros").update({orden:r.orden}).eq("id",swap.id),
    ]);
    const nuevos = [...rubros];
    [nuevos[idx], nuevos[dir==="up"?idx-1:idx+1]] = [nuevos[dir==="up"?idx-1:idx+1], nuevos[idx]];
    setRubros(nuevos);
  };

  // ── Config: Subrubros ──
  const guardarSubrubro = async (s:any) => {
    if (!s.nombre||!s.rubro_id) return;
    if (s.id) {
      await supabase.from("subrubros").update({nombre:s.nombre,orden:parseInt(s.orden)||0}).eq("id",s.id);
      setRubros(prev=>prev.map(r=>r.id===s.rubro_id?{...r,subrubros:(r.subrubros||[]).map((x:any)=>x.id===s.id?{...x,...s}:x)}:r));
      showToast("✅ Subrubro actualizado");
    } else {
      const {data} = await supabase.from("subrubros").insert({nombre:s.nombre,rubro_id:s.rubro_id,orden:parseInt(s.orden)||0}).select().single();
      if (data) setRubros(prev=>prev.map(r=>r.id===s.rubro_id?{...r,subrubros:[...(r.subrubros||[]),data]}:r));
      showToast("✅ Subrubro creado");
    }
    setModalSubrubro(null);
  };
  const eliminarSubrubro = async (id:number, rubro_id:number) => {
    if (!confirm("¿Eliminar este subrubro?")) return;
    await supabase.from("subrubros").delete().eq("id",id);
    setRubros(prev=>prev.map(r=>r.id===rubro_id?{...r,subrubros:(r.subrubros||[]).filter((x:any)=>x.id!==id)}:r));
    showToast("Subrubro eliminado");
  };

  // ── Config: Categorías de grupos ──
  const guardarGrupoCat = async (c:any) => {
    if (!c.nombre) return;
    if (c.id) {
      await supabase.from("grupo_categorias").update({nombre:c.nombre,emoji:c.emoji||"",descripcion:c.descripcion||"",orden:parseInt(c.orden)||0,activo:c.activo!==false}).eq("id",c.id);
      setGrupoCats(prev=>prev.map(x=>x.id===c.id?{...x,...c}:x));
      showToast("✅ Categoría actualizada");
    } else {
      const {data} = await supabase.from("grupo_categorias").insert({nombre:c.nombre,emoji:c.emoji||"",descripcion:c.descripcion||"",orden:parseInt(c.orden)||grupoCats.length,activo:true}).select().single();
      if (data) setGrupoCats(prev=>[...prev,data]);
      showToast("✅ Categoría creada");
    }
    setModalGrupoCat(null);
  };
  const eliminarGrupoCat = async (id:number) => {
    if (!confirm("¿Eliminar esta categoría y sus subcategorías?")) return;
    await supabase.from("grupo_categorias").delete().eq("id",id);
    setGrupoCats(prev=>prev.filter(x=>x.id!==id));
    setGrupoSubcats(prev=>prev.filter(x=>x.categoria_id!==id));
    showToast("Categoría eliminada");
  };
  const moverGrupoCat = async (c:any, dir:"up"|"down") => {
    const idx = grupoCats.findIndex(x=>x.id===c.id);
    const swap = dir==="up" ? grupoCats[idx-1] : grupoCats[idx+1];
    if (!swap) return;
    await Promise.all([
      supabase.from("grupo_categorias").update({orden:swap.orden}).eq("id",c.id),
      supabase.from("grupo_categorias").update({orden:c.orden}).eq("id",swap.id),
    ]);
    const nuevos = [...grupoCats];
    [nuevos[idx], nuevos[dir==="up"?idx-1:idx+1]] = [nuevos[dir==="up"?idx-1:idx+1], nuevos[idx]];
    setGrupoCats(nuevos);
  };
  const toggleGrupoCatActivo = async (c:any) => {
    const nuevo = !c.activo;
    await supabase.from("grupo_categorias").update({activo:nuevo}).eq("id",c.id);
    setGrupoCats(prev=>prev.map(x=>x.id===c.id?{...x,activo:nuevo}:x));
    showToast(nuevo?"Categoría activada":"Categoría desactivada");
  };

  // ── Config: Subcategorías de grupos ──
  const guardarGrupoSubcat = async (s:any) => {
    if (!s.nombre||!s.categoria_id) return;
    if (s.id) {
      await supabase.from("grupo_subcategorias").update({nombre:s.nombre,descripcion:s.descripcion||"",activo:s.activo!==false}).eq("id",s.id);
      setGrupoSubcats(prev=>prev.map(x=>x.id===s.id?{...x,...s}:x));
      showToast("✅ Subcategoría actualizada");
    } else {
      const {data} = await supabase.from("grupo_subcategorias").insert({nombre:s.nombre,descripcion:s.descripcion||"",categoria_id:parseInt(s.categoria_id),activo:true}).select().single();
      if (data) setGrupoSubcats(prev=>[...prev,data]);
      showToast("✅ Subcategoría creada");
    }
    setModalGrupoSubcat(null);
  };
  const eliminarGrupoSubcat = async (id:number) => {
    if (!confirm("¿Eliminar esta subcategoría?")) return;
    await supabase.from("grupo_subcategorias").delete().eq("id",id);
    setGrupoSubcats(prev=>prev.filter(x=>x.id!==id));
    showToast("Subcategoría eliminada");
  };

  // ── Crear usuario ──
  const crearUsuario = async () => {
    if (!nuevoUser.email||!nuevoUser.password||!nuevoUser.nombre_usuario) { showToast("Completá email, contraseña y nombre de usuario"); return; }
    if (nuevoUser.password.length<6) { showToast("Contraseña mínimo 6 caracteres"); return; }
    const { data, error } = await supabase.auth.signUp({ email:nuevoUser.email, password:nuevoUser.password });
    if (error||!data.user) { showToast("Error: "+(error?.message||"No se pudo crear")); return; }
    const { data:cod } = await supabase.rpc("generar_codigo_usuario");
    await supabase.from("usuarios").insert({ id:data.user.id, email:nuevoUser.email, nombre_usuario:nuevoUser.nombre_usuario, nombre:nuevoUser.nombre||null, codigo:cod, bits_free:3000, bits_free_fecha:new Date().toISOString() });
    showToast("✅ Usuario creado");
    setModalCrearUser(false); setNuevoUser({email:"",password:"",nombre_usuario:"",nombre:""});
    await cargarTodo();
  };

  // ── Responder mensaje como admin ──
  const responderComoAdmin = async () => {
    if (!respAdmin||!respAdmin.texto.trim()) return;
    const m = respAdmin.msg;
    const destId = m.emisor_id === ADMIN_UUID ? m.receptor_id : m.emisor_id;
    await supabase.from("mensajes").insert({ emisor_id:ADMIN_UUID, receptor_id:destId, anuncio_id:m.anuncio_id||null, texto:respAdmin.texto, leido:false });
    await supabase.from("notificaciones").insert({ usuario_id:destId, tipo:"sistema", mensaje:`💬 Admin te envió un mensaje: ${respAdmin.texto.slice(0,50)}...`, leida:false });
    showToast("✅ Respuesta enviada");
    setRespAdmin(null);
    await cargarTodo();
  };

  // ── Responder contacto ──
  const responderContacto = async () => {
    if (!respContacto||!respContacto.texto.trim()) return;
    await supabase.from("contactos_nexonet").update({ respuesta:respContacto.texto, estado:"respondido" }).eq("id",respContacto.c.id);
    await supabase.from("notificaciones").insert({ usuario_id:respContacto.c.usuario_id, tipo:"sistema", mensaje:`📩 Respuesta de NexoNet a tu ${respContacto.c.tipo}: ${respContacto.texto.slice(0,80)}...`, leida:false });
    setContactos(prev=>prev.map(x=>x.id===respContacto.c.id?{...x,respuesta:respContacto.texto,estado:"respondido"}:x));
    setRespContacto(null);
    showToast("✅ Respuesta enviada");
  };

  // ── Aprobar sugerencia (credita 50 BIT al usuario) ──
  const aprobarSugerencia = async (contacto: any) => {
    const uid = contacto.usuario_id;
    const { data: u } = await supabase.from("usuarios").select("bits_free,bits_totales_acumulados").eq("id",uid).single();
    if (!u) return;
    const nuevoFree = (u.bits_free||0) + 50;
    const acumulado = (u.bits_totales_acumulados||0) + 50;
    const NIVELES_LOGRO: [string,number][] = [["diamante",10000],["platino",5000],["oro",1000],["plata",500],["bronce",100],["ninguna",0]];
    const insignia = NIVELES_LOGRO.find(([,min]) => acumulado >= min)?.[0] || "ninguna";
    await supabase.from("usuarios").update({ bits_free:nuevoFree, bits_totales_acumulados:acumulado, insignia_logro:insignia }).eq("id",uid);
    await supabase.from("contactos_nexonet").update({ aprobado:true }).eq("id",contacto.id);
    await supabase.from("notificaciones").insert({ usuario_id:uid, tipo:"sistema", mensaje:"🎉 ¡Tu sugerencia fue aprobada! Recibiste 50 BIT Free como agradecimiento.", leida:false });
    setContactos(prev=>prev.map(x=>x.id===contacto.id?{...x,aprobado:true}:x));
    showToast("✅ Sugerencia aprobada — 50 BIT Free acreditados");
  };

  // ── Filtros IA ──
  const cargarFiltros = async (subId:number) => {
    setFiltroSubSel(subId);
    const {data} = await supabase.from("subrubro_filtros").select("*").eq("subrubro_id",subId).order("orden");
    setFiltrosIA(data||[]);
  };
  const guardarFiltro = async (f:any) => {
    if (!f.nombre||!filtroSubSel) return;
    const payload = { subrubro_id:filtroSubSel, nombre:f.nombre, tipo:f.tipo||"rango", opciones:f.opciones?JSON.parse(f.opciones):null, orden:parseInt(f.orden)||0 };
    if (f.id) {
      await supabase.from("subrubro_filtros").update(payload).eq("id",f.id);
    } else {
      await supabase.from("subrubro_filtros").insert(payload);
    }
    setModalFiltro(null);
    showToast("✅ Filtro guardado");
    await cargarFiltros(filtroSubSel);
  };
  const eliminarFiltro = async (id:number) => {
    if (!confirm("¿Eliminar este filtro?")) return;
    await supabase.from("subrubro_filtros").delete().eq("id",id);
    if (filtroSubSel) await cargarFiltros(filtroSubSel);
    showToast("Filtro eliminado");
  };

  // ── Entity rubros (empresa/servicio/trabajo) ──
  const ENT_TABLES: Record<string, {rubros:string;subrubros:string;filtros:string}> = {
    empresas:  {rubros:"empresa_rubros",  subrubros:"empresa_subrubros",  filtros:"empresa_filtros"},
    servicios: {rubros:"servicio_rubros", subrubros:"servicio_subrubros", filtros:"servicio_filtros"},
    trabajo:   {rubros:"trabajo_rubros",  subrubros:"trabajo_subrubros",  filtros:"trabajo_filtros"},
  };
  const cargarEntRubros = async (tipo: string) => {
    const t = ENT_TABLES[tipo]; if (!t) return;
    const {data} = await supabase.from(t.rubros).select(`*,subrubros:${t.subrubros}(id,nombre,orden,sliders_sugeridos)`).order("orden",{ascending:true});
    setEntRubros(data||[]);
    setExpandEntRubro(null); setEntFiltroSubSel(null); setEntFiltros([]);
  };
  const guardarEntRubro = async (r:any, tipo:string) => {
    const t = ENT_TABLES[tipo]; if (!t||!r.nombre) return;
    if (r.id) {
      await supabase.from(t.rubros).update({nombre:r.nombre,orden:parseInt(r.orden)||0}).eq("id",r.id);
      setEntRubros(prev=>prev.map(x=>x.id===r.id?{...x,...r}:x));
      showToast("✅ Rubro actualizado");
    } else {
      const {data} = await supabase.from(t.rubros).insert({nombre:r.nombre,orden:parseInt(r.orden)||entRubros.length}).select().single();
      if (data) setEntRubros(prev=>[...prev,{...data,subrubros:[]}]);
      showToast("✅ Rubro creado");
    }
    setModalEntRubro(null);
  };
  const eliminarEntRubro = async (id:number, tipo:string) => {
    const t = ENT_TABLES[tipo]; if (!t) return;
    if (!confirm("¿Eliminar este rubro y todos sus subrubros?")) return;
    await supabase.from(t.rubros).delete().eq("id",id);
    setEntRubros(prev=>prev.filter(x=>x.id!==id));
    showToast("Rubro eliminado");
  };
  const moverEntRubro = async (r:any, dir:"up"|"down", tipo:string) => {
    const t = ENT_TABLES[tipo]; if (!t) return;
    const idx = entRubros.findIndex(x=>x.id===r.id);
    const swap = dir==="up" ? entRubros[idx-1] : entRubros[idx+1];
    if (!swap) return;
    await Promise.all([
      supabase.from(t.rubros).update({orden:swap.orden}).eq("id",r.id),
      supabase.from(t.rubros).update({orden:r.orden}).eq("id",swap.id),
    ]);
    const nuevos = [...entRubros];
    [nuevos[idx], nuevos[dir==="up"?idx-1:idx+1]] = [nuevos[dir==="up"?idx-1:idx+1], nuevos[idx]];
    setEntRubros(nuevos);
  };
  const guardarEntSub = async (s:any, tipo:string) => {
    const t = ENT_TABLES[tipo]; if (!t||!s.nombre||!s.rubro_id) return;
    if (s.id) {
      const upd: any = {nombre:s.nombre,orden:parseInt(s.orden)||0};
      if (s.sliders_sugeridos !== undefined) upd.sliders_sugeridos = s.sliders_sugeridos ? JSON.parse(s.sliders_sugeridos) : null;
      await supabase.from(t.subrubros).update(upd).eq("id",s.id);
      setEntRubros(prev=>prev.map(r=>r.id===s.rubro_id?{...r,subrubros:(r.subrubros||[]).map((x:any)=>x.id===s.id?{...x,...s,sliders_sugeridos:upd.sliders_sugeridos??x.sliders_sugeridos}:x)}:r));
      showToast("✅ Subrubro actualizado");
    } else {
      const ins: any = {nombre:s.nombre,rubro_id:s.rubro_id,orden:parseInt(s.orden)||0};
      if (s.sliders_sugeridos) ins.sliders_sugeridos = JSON.parse(s.sliders_sugeridos);
      const {data} = await supabase.from(t.subrubros).insert(ins).select().single();
      if (data) setEntRubros(prev=>prev.map(r=>r.id===s.rubro_id?{...r,subrubros:[...(r.subrubros||[]),data]}:r));
      showToast("✅ Subrubro creado");
    }
    setModalEntSub(null);
  };
  const eliminarEntSub = async (id:number, rubro_id:number, tipo:string) => {
    const t = ENT_TABLES[tipo]; if (!t) return;
    if (!confirm("¿Eliminar este subrubro?")) return;
    await supabase.from(t.subrubros).delete().eq("id",id);
    setEntRubros(prev=>prev.map(r=>r.id===rubro_id?{...r,subrubros:(r.subrubros||[]).filter((x:any)=>x.id!==id)}:r));
    showToast("Subrubro eliminado");
  };
  const cargarEntFiltros = async (subId:number, tipo:string) => {
    const t = ENT_TABLES[tipo]; if (!t) return;
    setEntFiltroSubSel(subId);
    const {data} = await supabase.from(t.filtros).select("*").eq("subrubro_id",subId).order("orden");
    setEntFiltros(data||[]);
  };
  const guardarEntFiltro = async (f:any, tipo:string) => {
    const t = ENT_TABLES[tipo]; if (!t||!f.nombre||!entFiltroSubSel) return;
    const payload = { subrubro_id:entFiltroSubSel, nombre:f.nombre, tipo:f.tipo||"rango", opciones:f.opciones?JSON.parse(f.opciones):null, orden:parseInt(f.orden)||0 };
    if (f.id) { await supabase.from(t.filtros).update(payload).eq("id",f.id); }
    else { await supabase.from(t.filtros).insert(payload); }
    setModalEntFiltro(null);
    showToast("✅ Filtro guardado");
    await cargarEntFiltros(entFiltroSubSel, tipo);
  };
  const eliminarEntFiltro = async (id:number, tipo:string) => {
    const t = ENT_TABLES[tipo]; if (!t) return;
    if (!confirm("¿Eliminar este filtro?")) return;
    await supabase.from(t.filtros).delete().eq("id",id);
    if (entFiltroSubSel) await cargarEntFiltros(entFiltroSubSel, tipo);
    showToast("Filtro eliminado");
  };

  // ── Alarmas ──
  const guardarAlarmas = async (nuevas:any) => {
    setAlarmas(nuevas);
    await supabase.from("config").upsert({clave:"alarmas",valor:JSON.stringify(nuevas)},{onConflict:"clave"});
    showToast("✅ Alarmas guardadas");
  };

  const usuariosFiltrados = usuarios.filter(u=>{
    const q = busqUser.toLowerCase();
    const ok = !q || (u.nombre_usuario||"").toLowerCase().includes(q) || (u.email||"").toLowerCase().includes(q) || (u.codigo||"").toLowerCase().includes(q);
    if (filtroUser==="bloqueados") return ok && u.bloqueado;
    if (filtroUser==="promotores") return ok && u.es_promotor;
    if (filtroUser==="sin_bits")   return ok && !(u.bits||0) && !(u.bits_free||0);
    return ok;
  });
  const anunciosFiltrados = anuncios.filter(a=>{
    const q = busqAnuncio.toLowerCase();
    return !q || (a.titulo||"").toLowerCase().includes(q) || (a.usuarios?.nombre_usuario||"").toLowerCase().includes(q);
  });

  if (!authed) return null;

  const TABS:{id:Tab;e:string;l:string}[] = [
    {id:"dashboard",e:"📊",l:"Panel"},
    {id:"usuarios", e:"👥",l:"Usuarios"},
    {id:"anuncios", e:"📋",l:"Anuncios"},
    {id:"grupos",   e:"🏘️",l:"Grupos"},
    {id:"mensajes", e:"💬",l:"Mensajes"},
    {id:"promotores",e:"⭐",l:"Promotores"},
    {id:"pagos",    e:"💰",l:"Pagos"},
    {id:"alarmas",  e:"🔔",l:"Alarmas"},
    {id:"contactos",e:"📩",l:"Contactos"},
    {id:"config",   e:"⚙️",l:"Config"},
  ];

  const ItemRow = ({label,onEdit,onDelete,onUp,onDown,badge,extra}:{label:string;onEdit:()=>void;onDelete:()=>void;onUp?:()=>void;onDown?:()=>void;badge?:React.ReactNode;extra?:React.ReactNode}) => (
    <div style={{display:"flex",alignItems:"center",gap:"6px",padding:"6px 0",borderBottom:"1px solid #f4f4f2"}}>
      <div style={{flex:1,fontSize:"13px",fontWeight:700,color:"#1a2a3a",display:"flex",alignItems:"center",gap:"6px"}}>
        {label} {badge}
      </div>
      {extra}
      {onUp   && <button onClick={onUp}   style={{...S.btn("#9a9a9a",true),padding:"4px 8px"}}>↑</button>}
      {onDown && <button onClick={onDown} style={{...S.btn("#9a9a9a",true),padding:"4px 8px"}}>↓</button>}
      <button onClick={onEdit}   style={{...S.btn("#3a7bd5",true),padding:"4px 8px"}}>✏️</button>
      <button onClick={onDelete} style={{...S.btn("#e74c3c",true),padding:"4px 8px"}}>🗑️</button>
    </div>
  );

  return (
    <main style={{minHeight:"100vh",background:"#f4f4f2",fontFamily:"'Nunito',sans-serif",paddingBottom:"40px"}}>

      {toast && (
        <div style={{position:"fixed",top:"16px",left:"50%",transform:"translateX(-50%)",background:"#1a2a3a",color:"#fff",borderRadius:"12px",padding:"10px 20px",fontSize:"13px",fontWeight:800,zIndex:9999,boxShadow:"0 4px 20px rgba(0,0,0,0.3)"}}>
          {toast}
        </div>
      )}

      <div style={{background:"linear-gradient(135deg,#1a2a3a,#243b55)",padding:"20px 16px 0",position:"sticky",top:0,zIndex:100}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"14px"}}>
          <div>
            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"24px",color:"#d4a017",letterSpacing:"2px"}}>NEXONET ADMIN</div>
            <div style={{fontSize:"11px",fontWeight:700,color:"#8a9aaa"}}>Panel de administración</div>
          </div>
          <div style={{display:"flex",gap:"8px"}}>
            <button onClick={cargarTodo} style={S.btn("#3a7bd5",true)}>🔄</button>
            <button onClick={()=>router.push("/")} style={S.btn("#d4a017",true)}>🏠</button>
          </div>
        </div>
        <div style={{display:"flex",gap:"0",overflowX:"auto",borderTop:"1px solid rgba(255,255,255,0.1)"}}>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)}
              style={{flexShrink:0,background:"none",border:"none",borderBottom:tab===t.id?"3px solid #d4a017":"3px solid transparent",padding:"10px 12px",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:"2px"}}>
              <span style={{fontSize:"18px"}}>{t.e}</span>
              <span style={{fontSize:"9px",fontWeight:800,color:tab===t.id?"#d4a017":"#8a9aaa",textTransform:"uppercase",letterSpacing:"0.5px",whiteSpace:"nowrap"}}>{t.l}</span>
            </button>
          ))}
        </div>
      </div>

      <div style={{padding:"16px"}}>
        {loading && <div style={{textAlign:"center",padding:"40px",fontSize:"14px",color:"#9a9a9a",fontWeight:700}}>Cargando...</div>}

        {/* ══ DASHBOARD ═══════════════════════════════════════════════════════ */}
        {!loading && tab==="dashboard" && (
          <>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"10px",marginBottom:"14px"}}>
              <StatBox n={String(stats.usuarios||0)} l="Usuarios" e="👥" />
              <StatBox n={String(stats.anuncios||0)} l="Anuncios" e="📋" c="#3a7bd5" />
              <StatBox n={String(stats.grupos||0)}   l="Grupos"   e="🏘️" c="#27ae60" />
              <StatBox n={String(stats.mensajes||0)} l="Mensajes" e="💬" c="#8e44ad" />
              <StatBox n={`$${((stats.pagos||0)/1000).toFixed(0)}K`} l="Recaudado" e="💰" c="#e67e22" />
              <StatBox n={String(stats.bits||0)}     l="BIT circulando" e="🪙" c="#d4a017" />
            </div>

            <div style={S.card}>
              <div style={S.sect}>👁️ Visitas (anuncios + nexos)</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"8px"}}>
                <div style={{background:"#f4f4f2",borderRadius:"10px",padding:"10px",textAlign:"center"}}>
                  <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"22px",color:"#d4a017"}}>{visitStats.hoy}</div>
                  <div style={{fontSize:"9px",fontWeight:700,color:"#9a9a9a",textTransform:"uppercase"}}>Hoy</div>
                </div>
                <div style={{background:"#f4f4f2",borderRadius:"10px",padding:"10px",textAlign:"center"}}>
                  <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"22px",color:"#3a7bd5"}}>{visitStats.semana}</div>
                  <div style={{fontSize:"9px",fontWeight:700,color:"#9a9a9a",textTransform:"uppercase"}}>7 días</div>
                </div>
                <div style={{background:"#f4f4f2",borderRadius:"10px",padding:"10px",textAlign:"center"}}>
                  <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"22px",color:"#27ae60"}}>{visitStats.mes}</div>
                  <div style={{fontSize:"9px",fontWeight:700,color:"#9a9a9a",textTransform:"uppercase"}}>30 días</div>
                </div>
                <div style={{background:"#f4f4f2",borderRadius:"10px",padding:"10px",textAlign:"center"}}>
                  <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"22px",color:"#8e44ad"}}>{visitStats.anio}</div>
                  <div style={{fontSize:"9px",fontWeight:700,color:"#9a9a9a",textTransform:"uppercase"}}>12 meses</div>
                </div>
              </div>
            </div>

            <div style={S.card}>
              <div style={S.sect}>💰 Dinero (Mercado Pago)</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px"}}>
                <div style={{background:"rgba(39,174,96,0.08)",borderRadius:"10px",padding:"14px",textAlign:"center"}}>
                  <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"26px",color:"#27ae60"}}>${dineroStats.esteMes.toLocaleString("es-AR")}</div>
                  <div style={{fontSize:"10px",fontWeight:700,color:"#9a9a9a",textTransform:"uppercase"}}>Este mes</div>
                </div>
                <div style={{background:"rgba(212,160,23,0.08)",borderRadius:"10px",padding:"14px",textAlign:"center"}}>
                  <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"26px",color:"#d4a017"}}>${dineroStats.total.toLocaleString("es-AR")}</div>
                  <div style={{fontSize:"10px",fontWeight:700,color:"#9a9a9a",textTransform:"uppercase"}}>Acumulado histórico</div>
                </div>
              </div>
            </div>

            <div style={S.card}>
              <div style={S.sect}>📈 Registros por mes (últimos 12)</div>
              <div style={{display:"flex",alignItems:"flex-end",gap:"4px",height:"120px"}}>
                {registrosMes.map((m,i)=>{
                  const max = Math.max(...registrosMes.map(x=>x.cant),1);
                  const h = Math.max((m.cant/max)*100,4);
                  return (
                    <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:"2px"}}>
                      <div style={{fontSize:"10px",fontWeight:800,color:"#1a2a3a"}}>{m.cant||""}</div>
                      <div style={{width:"100%",height:`${h}px`,background:"linear-gradient(180deg,#d4a017,#f0c040)",borderRadius:"4px 4px 0 0"}} />
                      <div style={{fontSize:"8px",fontWeight:700,color:"#9a9a9a",whiteSpace:"nowrap"}}>{m.mes}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={S.card}>
              <div style={S.sect}>💰 Últimos pagos</div>
              {pagos.slice(0,5).map(p=>(
                <div key={p.id} style={S.row}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:"13px",fontWeight:800,color:"#1a2a3a"}}>{p.usuarios?.nombre_usuario||"—"}</div>
                    <div style={{fontSize:"11px",color:"#9a9a9a",fontWeight:600}}>{p.paquete}</div>
                  </div>
                  <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"18px",color:"#27ae60"}}>${p.monto?.toLocaleString("es-AR")}</div>
                </div>
              ))}
            </div>
            <div style={S.card}>
              <div style={S.sect}>👥 Últimos registros</div>
              {usuarios.slice(0,8).map(u=>(
                <div key={u.id} style={S.row}>
                  <div style={{width:"36px",height:"36px",borderRadius:"50%",background:"linear-gradient(135deg,#1a2a3a,#3a7bd5)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"16px",flexShrink:0,overflow:"hidden"}}>
                    {u.avatar_url?<img src={u.avatar_url} style={{width:"100%",height:"100%",borderRadius:"50%",objectFit:"cover"}} alt="av"/>:"👤"}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:"13px",fontWeight:800,color:"#1a2a3a",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{u.nombre_usuario||u.email}</div>
                    <div style={{fontSize:"11px",color:"#9a9a9a",fontWeight:600}}>{u.codigo} · {new Date(u.created_at).toLocaleDateString("es-AR")}</div>
                  </div>
                  {u.es_promotor && <span style={S.badge("#fff","#d4a017")}>PROMOTOR</span>}
                </div>
              ))}
            </div>
          </>
        )}

        {/* ══ USUARIOS ════════════════════════════════════════════════════════ */}
        {!loading && tab==="usuarios" && (
          <>
            {usuarios.filter(u=>u.estado_cuenta==="baja_solicitada").length > 0 && (
              <div style={{...S.card,borderLeft:"4px solid #e74c3c",marginBottom:"14px"}}>
                <div style={S.sect}>🚨 Bajas solicitadas</div>
                {usuarios.filter(u=>u.estado_cuenta==="baja_solicitada").map(u=>(
                  <div key={u.id} style={{...S.row,gap:"10px"}}>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:"13px",fontWeight:900,color:"#e74c3c"}}>{u.nombre_usuario} ({u.codigo})</div>
                      <div style={{fontSize:"11px",color:"#9a9a9a",fontWeight:600}}>{u.email}</div>
                      {u.nota_baja && <div style={{fontSize:"11px",color:"#666",fontWeight:600,fontStyle:"italic",marginTop:"2px"}}>"{u.nota_baja}"</div>}
                    </div>
                    <button onClick={async()=>{
                      await supabase.from("usuarios").update({estado_cuenta:null,nota_baja:null}).eq("id",u.id);
                      setUsuarios(prev=>prev.map(x=>x.id===u.id?{...x,estado_cuenta:null,nota_baja:null}:x));
                      showToast("Baja cancelada");
                    }} style={S.btn("#27ae60",true)}>✅ Cancelar baja</button>
                    <button onClick={async()=>{
                      if (!confirm(`¿Eliminar definitivamente a ${u.nombre_usuario}?`)) return;
                      await supabase.from("usuarios").delete().eq("id",u.id);
                      setUsuarios(prev=>prev.filter(x=>x.id!==u.id));
                      showToast("Usuario eliminado");
                    }} style={S.btn("#e74c3c",true)}>🗑️ Eliminar</button>
                  </div>
                ))}
              </div>
            )}
            <div style={{display:"flex",gap:"8px",marginBottom:"14px"}}>
              <input style={{...S.input,flex:1}} placeholder="🔍 Buscar por nombre, email o código..." value={busqUser} onChange={e=>setBusqUser(e.target.value)} />
              <button onClick={()=>setModalCrearUser(true)} style={S.btn("#27ae60")}>+ Crear</button>
            </div>
            <div style={S.card}>
              <div style={{display:"flex",gap:"6px",flexWrap:"wrap"}}>
                {["todos","promotores","bloqueados","sin_bits"].map(f=>(
                  <button key={f} onClick={()=>setFiltroUser(f)} style={S.btn(filtroUser===f?"#d4a017":"#9a9a9a",filtroUser!==f)}>
                    {f==="todos"?"Todos":f==="promotores"?"⭐ Promotores":f==="bloqueados"?"🔒 Bloqueados":"💸 Sin BIT"}
                  </button>
                ))}
                <div style={{marginLeft:"auto",fontSize:"12px",fontWeight:700,color:"#9a9a9a",alignSelf:"center"}}>{usuariosFiltrados.length} resultados</div>
              </div>
            </div>
            {usuariosFiltrados.map(u=>(
              <div key={u.id} style={{...S.card,opacity:u.bloqueado?0.7:1,borderLeft:`4px solid ${u.bloqueado?"#e74c3c":u.es_promotor?"#d4a017":"#e8e8e6"}`}}>
                <div style={{display:"flex",alignItems:"flex-start",gap:"12px"}}>
                  <div style={{width:"44px",height:"44px",borderRadius:"50%",background:"linear-gradient(135deg,#1a2a3a,#3a7bd5)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"18px",flexShrink:0,overflow:"hidden"}}>
                    {u.avatar_url?<img src={u.avatar_url} style={{width:"100%",height:"100%",objectFit:"cover"}} alt=""/>:"👤"}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:"flex",alignItems:"center",gap:"6px",flexWrap:"wrap"}}>
                      <span style={{fontSize:"14px",fontWeight:900,color:"#1a2a3a"}}>{u.nombre_usuario||"Sin nombre"}</span>
                      <span style={{fontSize:"10px",fontWeight:700,color:"#9a9a9a"}}>{u.codigo}</span>
                      {u.es_promotor && <span style={S.badge("#fff","#d4a017")}>⭐ PROMOTOR</span>}
                      {u.bloqueado   && <span style={S.badge("#fff","#e74c3c")}>🔒 BLOQUEADO</span>}
                    </div>
                    <div style={{fontSize:"12px",color:"#9a9a9a",fontWeight:600,marginTop:"2px"}}>{u.email}</div>
                    <div style={{display:"flex",gap:"6px",flexWrap:"wrap",marginTop:"6px"}}>
                      {[["bits","💛",u.bits||0],["bits_free","💙",u.bits_free||0],["bits_conexion","🔗",u.bits_conexion||0],["bits_busquedas","🤖",u.bits_busquedas||0]].map(([k,e,v]:any)=>(
                        v>0&&<span key={k} style={{fontSize:"10px",fontWeight:700,color:"#555",background:"#f4f4f2",borderRadius:"8px",padding:"2px 7px"}}>{e} {v.toLocaleString()}</span>
                      ))}
                    </div>
                  </div>
                </div>
                <div style={{display:"flex",gap:"6px",marginTop:"12px",flexWrap:"wrap"}}>
                  <button onClick={()=>{setModalBit(u);setBitTipo("bits");setBitCant("");setBitNota("");}} style={S.btn("#d4a017",true)}>💰 BIT</button>
                  <button onClick={()=>{setModalMensaje(u);setMsgDest(u.id);setMsgTexto("");}} style={S.btn("#3a7bd5",true)}>💬 Msg</button>
                  <button onClick={()=>setModalUsuario(u)} style={S.btn("#8e44ad",true)}>👁️ Ver</button>
                  <button onClick={()=>bloquearUsuario(u)} style={S.btn(u.bloqueado?"#27ae60":"#e67e22",true)}>{u.bloqueado?"🔓":"🔒"}</button>
                  <button onClick={()=>eliminarUsuario(u)} style={S.btn("#e74c3c",true)}>🗑️</button>
                </div>
              </div>
            ))}
          </>
        )}

        {/* ══ ANUNCIOS ════════════════════════════════════════════════════════ */}
        {!loading && tab==="anuncios" && (
          <>
            <div style={{display:"flex",gap:"8px",marginBottom:"14px"}}>
              <input style={{...S.input,flex:1}} placeholder="🔍 Buscar anuncio..." value={busqAnuncio} onChange={e=>setBusqAnuncio(e.target.value)} />
              <button onClick={()=>setModalNuevoAn(true)} style={S.btn("#27ae60")}>+ Publicar</button>
            </div>
            {anunciosFiltrados.map(a=>(
              <div key={a.id} style={{...S.card,borderLeft:`4px solid ${a.estado==="bloqueado"?"#e74c3c":a.flash?"#d4a017":"#e8e8e6"}`}}>
                <div style={{display:"flex",alignItems:"flex-start",gap:"10px"}}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:"flex",gap:"6px",flexWrap:"wrap",alignItems:"center"}}>
                      <span style={{fontSize:"14px",fontWeight:900,color:"#1a2a3a"}}>{a.titulo}</span>
                      {a.flash && <span style={S.badge("#fff","#d4a017")}>⚡ FLASH</span>}
                      {a.permuto && <span style={S.badge("#fff","#8e44ad")}>🔄</span>}
                      {a.estado==="bloqueado" && <span style={S.badge("#fff","#e74c3c")}>🔒</span>}
                    </div>
                    <div style={{fontSize:"12px",color:"#9a9a9a",fontWeight:600,marginTop:"2px"}}>{a.usuarios?.nombre_usuario} · {a.ciudad||""}{a.ciudad&&a.provincia?", ":""}{a.provincia||""}</div>
                    <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"20px",color:"#3a7bd5",marginTop:"2px"}}>${parseFloat(a.precio||0).toLocaleString("es-AR")}</div>
                  </div>
                </div>
                <div style={{display:"flex",gap:"6px",marginTop:"10px",flexWrap:"wrap"}}>
                  <button onClick={()=>setModalAnuncio({...a})} style={S.btn("#3a7bd5",true)}>✏️ Editar</button>
                  <button onClick={()=>bloquearAnuncio(a)} style={S.btn(a.estado==="bloqueado"?"#27ae60":"#e67e22",true)}>{a.estado==="bloqueado"?"✅":"🔒"}</button>
                  <button onClick={()=>eliminarAnuncio(a)} style={S.btn("#e74c3c",true)}>🗑️</button>
                  <button onClick={()=>router.push(`/anuncios/${a.id}`)} style={S.btn("#9a9a9a",true)}>👁️</button>
                </div>
              </div>
            ))}
          </>
        )}

        {/* ══ GRUPOS ══════════════════════════════════════════════════════════ */}
        {!loading && tab==="grupos" && (
          <>
            <button onClick={()=>setModalNuevoGr(true)} style={{...S.btn("#27ae60"),marginBottom:"14px",display:"block"}}>+ Crear grupo</button>
            {grupos.map(g=>(
              <div key={g.id} style={{...S.card,borderLeft:`4px solid ${g.activo?"#27ae60":"#e74c3c"}`}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                  <div>
                    <div style={{fontSize:"14px",fontWeight:900,color:"#1a2a3a"}}>{g.nombre}</div>
                    <div style={{fontSize:"12px",color:"#9a9a9a",fontWeight:600}}>{g.usuarios?.nombre_usuario} · {g.descripcion||"Sin descripción"}</div>
                    <div style={{fontSize:"11px",color:"#9a9a9a",marginTop:"4px"}}>👥 {g.miembros||0} miembros</div>
                  </div>
                  <button onClick={()=>toggleGrupo(g)} style={S.btn(g.activo?"#e74c3c":"#27ae60",true)}>{g.activo?"Desactivar":"Activar"}</button>
                </div>
              </div>
            ))}
          </>
        )}

        {/* ══ MENSAJES ════════════════════════════════════════════════════════ */}
        {!loading && tab==="mensajes" && (
          <>
            <div style={S.card}>
              <div style={S.sect}>📣 Enviar notificación</div>
              <label style={S.label}>Destinatario</label>
              <select style={{...S.input,marginBottom:"10px"}} value={msgDest} onChange={e=>setMsgDest(e.target.value)}>
                <option value="">Seleccionar usuario...</option>
                <option value="todos">📣 Todos los usuarios</option>
                {usuarios.map(u=><option key={u.id} value={u.id}>{u.nombre_usuario} ({u.codigo})</option>)}
              </select>
              <label style={S.label}>Tipo</label>
              <select style={{...S.input,marginBottom:"10px"}} value={msgTipo} onChange={e=>setMsgTipo(e.target.value)}>
                <option value="sistema">⚙️ Sistema</option>
                <option value="promocion">🎁 Promoción</option>
                <option value="alerta">⚠️ Alerta</option>
              </select>
              <label style={S.label}>Mensaje</label>
              <textarea style={{...S.input,minHeight:"80px",resize:"vertical",marginBottom:"10px"}} placeholder="Escribí el mensaje..." value={msgTexto} onChange={e=>setMsgTexto(e.target.value)} />
              <button onClick={enviarMensaje} style={S.btn("#3a7bd5")} disabled={!msgTexto||!msgDest}>📨 Enviar{msgDest==="todos"?` a todos (${usuarios.length})`:""}</button>
            </div>
            <div style={S.card}>
              <div style={S.sect}>💬 Conversaciones recientes</div>
              {mensajes.slice(0,30).map(m=>(
                <div key={m.id} style={{...S.row,flexWrap:"wrap"}}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:"12px",fontWeight:800,color:"#1a2a3a"}}>{m.emisor?.nombre_usuario||"Sistema"} → {m.receptor?.nombre_usuario||"?"}</div>
                    <div style={{fontSize:"11px",color:"#9a9a9a",fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{m.mensaje||m.texto||"..."}</div>
                  </div>
                  <div style={{display:"flex",gap:"6px",alignItems:"center",flexShrink:0}}>
                    <div style={{fontSize:"10px",color:"#bbb"}}>{new Date(m.created_at).toLocaleDateString("es-AR")}</div>
                    <button onClick={()=>setRespAdmin({msg:m,texto:""})} style={{...S.btn("#3a7bd5",true),padding:"3px 8px",fontSize:"10px"}}>💬 Responder</button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ══ PROMOTORES ══════════════════════════════════════════════════════ */}
        {!loading && tab==="promotores" && (
          <>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px",marginBottom:"14px"}}>
              <StatBox n={String(usuarios.filter(u=>u.es_promotor).length)} l="Promotores activos" e="⭐" c="#d4a017" />
              <StatBox n={usuarios.filter(u=>u.es_promotor).reduce((a:number,u:any)=>a+(u.bits_promotor_total||0),0).toLocaleString()} l="BIT totales generados" e="🪙" c="#27ae60" />
            </div>
            <div style={S.card}>
              <div style={S.sect}>⭐ Promotores activos</div>
              {usuarios.filter(u=>u.es_promotor).sort((a:any,b:any)=>(b.bits_promotor_total||0)-(a.bits_promotor_total||0)).map((u:any,i:number)=>{
                const referidos = usuarios.filter(x=>x.referido_por===u.id).length;
                return (
                  <div key={u.id} style={{...S.row,gap:"10px"}}>
                    <span style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"22px",color:i===0?"#d4a017":"#9a9a9a",width:"28px",textAlign:"center"}}>{i+1}</span>
                    <div style={{width:"36px",height:"36px",borderRadius:"50%",background:"linear-gradient(135deg,#1a2a3a,#d4a017)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"14px",flexShrink:0,overflow:"hidden"}}>
                      {u.avatar_url?<img src={u.avatar_url} style={{width:"100%",height:"100%",objectFit:"cover"}} alt=""/>:"⭐"}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:"13px",fontWeight:900,color:"#1a2a3a"}}>{u.nombre_usuario}</div>
                      <div style={{fontSize:"11px",color:"#9a9a9a",fontWeight:600}}>{u.codigo} · {u.email}</div>
                      <div style={{display:"flex",gap:"8px",marginTop:"3px"}}>
                        <span style={{fontSize:"10px",fontWeight:700,color:"#3a7bd5",background:"rgba(58,123,213,0.08)",borderRadius:"8px",padding:"2px 7px"}}>👥 {referidos} referidos</span>
                        <span style={{fontSize:"10px",fontWeight:700,color:"#d4a017",background:"rgba(212,160,23,0.08)",borderRadius:"8px",padding:"2px 7px"}}>🪙 {(u.bits_promotor||0).toLocaleString()} BIT actual</span>
                      </div>
                    </div>
                    <div style={{textAlign:"right",flexShrink:0}}>
                      <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"20px",color:"#27ae60"}}>{(u.bits_promotor_total||0).toLocaleString()}</div>
                      <div style={{fontSize:"9px",fontWeight:700,color:"#9a9a9a",textTransform:"uppercase"}}>BIT total</div>
                    </div>
                  </div>
                );
              })}
              {usuarios.filter(u=>u.es_promotor).length===0 && <div style={{fontSize:"13px",color:"#9a9a9a",fontWeight:600}}>No hay promotores activos todavía.</div>}
            </div>
          </>
        )}

        {/* ══ CONTACTOS ════════════════════════════════════════════════════════ */}
        {!loading && tab==="contactos" && (
          <>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"10px",marginBottom:"14px"}}>
              <StatBox n={String(contactos.filter(c=>c.estado==="pendiente").length)} l="Pendientes" e="⏳" c="#e67e22" />
              <StatBox n={String(contactos.filter(c=>c.estado==="respondido").length)} l="Respondidos" e="✅" c="#27ae60" />
              <StatBox n={String(contactos.length)} l="Total" e="📩" c="#3a7bd5" />
            </div>
            {contactos.length===0 && <div style={{...S.card,textAlign:"center",color:"#9a9a9a",fontWeight:600}}>No hay contactos todavía.</div>}
            {contactos.map(c=>(
              <div key={c.id} style={{...S.card,borderLeft:`4px solid ${c.tipo==="denuncia"?"#e74c3c":c.tipo==="reclamo"?"#e67e22":"#3a7bd5"}`}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"8px"}}>
                  <div>
                    <div style={{display:"flex",gap:"6px",alignItems:"center",marginBottom:"2px"}}>
                      <span style={{fontSize:"14px"}}>{c.tipo==="sugerencia"?"💡":c.tipo==="reclamo"?"⚠️":"🚨"}</span>
                      <span style={{fontSize:"13px",fontWeight:900,color:"#1a2a3a",textTransform:"capitalize"}}>{c.tipo}</span>
                      <span style={S.badge("#fff",c.estado==="respondido"?"#27ae60":"#e67e22")}>{c.estado}</span>
                    </div>
                    <div style={{fontSize:"12px",color:"#9a9a9a",fontWeight:600}}>{c.usuarios?.nombre_usuario} ({c.usuarios?.codigo}) · {new Date(c.created_at).toLocaleDateString("es-AR")}</div>
                  </div>
                </div>
                <div style={{fontSize:"13px",fontWeight:600,color:"#1a2a3a",lineHeight:1.5,marginBottom:"8px",background:"#f9f9f7",borderRadius:"10px",padding:"10px 12px"}}>{c.mensaje}</div>
                {c.respuesta && (
                  <div style={{fontSize:"12px",fontWeight:600,color:"#27ae60",background:"rgba(39,174,96,0.06)",borderRadius:"10px",padding:"8px 12px",marginBottom:"8px"}}>
                    <strong>Respuesta:</strong> {c.respuesta}
                  </div>
                )}
                <div style={{display:"flex",gap:"8px",flexWrap:"wrap"}}>
                  {c.estado!=="respondido" && (
                    <button onClick={()=>setRespContacto({c,texto:""})} style={S.btn("#3a7bd5",true)}>💬 Responder</button>
                  )}
                  {c.tipo==="sugerencia" && !c.aprobado && (
                    <button onClick={()=>aprobarSugerencia(c)} style={S.btn("#27ae60",true)}>✅ Aprobar (+50 BIT)</button>
                  )}
                  {c.aprobado && (
                    <span style={S.badge("#fff","#27ae60")}>✅ Aprobada</span>
                  )}
                </div>
              </div>
            ))}
          </>
        )}

        {/* ══ PAGOS ════════════════════════════════════════════════════════════ */}
        {!loading && tab==="pagos" && (
          <>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px",marginBottom:"14px"}}>
              <StatBox n={`$${((pagos.reduce((a,p)=>a+(p.monto||0),0))/1000).toFixed(1)}K`} l="Total recaudado" e="💰" c="#27ae60" />
              <StatBox n={String(pagos.length)} l="Transacciones" e="💳" c="#3a7bd5" />
            </div>
            <div style={S.card}>
              <div style={S.sect}>💳 Historial de pagos</div>
              {pagos.map(p=>(
                <div key={p.id} style={S.row}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:"13px",fontWeight:800,color:"#1a2a3a"}}>{p.usuarios?.nombre_usuario||"—"} <span style={{fontWeight:600,color:"#9a9a9a",fontSize:"11px"}}>({p.usuarios?.codigo})</span></div>
                    <div style={{fontSize:"11px",color:"#9a9a9a",fontWeight:600}}>{p.paquete} · {new Date(p.created_at).toLocaleDateString("es-AR")}</div>
                  </div>
                  <div style={{textAlign:"right",flexShrink:0}}>
                    <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"18px",color:"#27ae60"}}>${p.monto?.toLocaleString("es-AR")}</div>
                    <span style={S.badge("#fff",p.estado==="approved"?"#27ae60":"#e67e22")}>{p.estado}</span>
                  </div>
                </div>
              ))}
              {pagos.length===0&&<div style={{fontSize:"13px",color:"#9a9a9a",fontWeight:600}}>No hay pagos registrados todavía.</div>}
            </div>
          </>
        )}

        {/* ══ ALARMAS ══════════════════════════════════════════════════════════ */}
        {!loading && tab==="alarmas" && (
          <>
            <div style={S.card}>
              <div style={S.sect}>📱 Notificaciones WhatsApp al admin</div>
              {[
                {k:"nuevo_usuario",  l:"👤 Nuevo usuario registrado",      d:"Cuando alguien se registra"},
                {k:"compra_bit",     l:"💰 Compra de BIT con MercadoPago", d:"Cuando se aprueba un pago"},
                {k:"nuevo_anuncio",  l:"📋 Nuevo anuncio publicado",        d:"Cada vez que se publica un anuncio"},
                {k:"nueva_conexion", l:"🔗 Nueva conexión entre usuarios",  d:"Cuando alguien ve datos de contacto"},
                {k:"nuevo_promotor", l:"⭐ Nuevo promotor registrado",      d:"Cuando alguien activa su cuenta promotor"},
                {k:"liq_pendiente",  l:"💳 Liquidación pendiente",          d:"Cuando un promotor solicita liquidación"},
                {k:"nuevo_grupo",    l:"🏘️ Nuevo grupo creado",            d:"Cuando se crea un grupo"},
              ].map(item=>(
                <div key={item.k} style={{display:"flex",alignItems:"center",gap:"12px",padding:"12px 0",borderBottom:"1px solid #f0f0f0"}}>
                  <div style={{flex:1}}>
                    <div style={{fontSize:"13px",fontWeight:800,color:"#1a2a3a"}}>{item.l}</div>
                    <div style={{fontSize:"11px",color:"#9a9a9a",fontWeight:600}}>{item.d}</div>
                  </div>
                  <div onClick={()=>guardarAlarmas({...alarmas,[item.k]:!alarmas[item.k]})}
                    style={{width:"48px",height:"26px",borderRadius:"13px",background:alarmas[item.k]?"#27ae60":"#e0e0e0",cursor:"pointer",position:"relative",transition:"background .2s",flexShrink:0}}>
                    <div style={{position:"absolute",top:"3px",left:alarmas[item.k]?"24px":"3px",width:"20px",height:"20px",borderRadius:"50%",background:"#fff",boxShadow:"0 1px 4px rgba(0,0,0,0.2)",transition:"left .2s"}} />
                  </div>
                </div>
              ))}
              <div style={{marginTop:"16px"}}>
                <label style={S.label}>Tu número de WhatsApp</label>
                <input style={S.input} placeholder="+54 9 341 000 0000" value={alarmas.admin_wa||""} onChange={e=>setAlarmas({...alarmas,admin_wa:e.target.value})} />
                <button onClick={()=>guardarAlarmas(alarmas)} style={{...S.btn("#27ae60"),marginTop:"10px"}}>💾 Guardar número</button>
              </div>
            </div>
          </>
        )}

        {/* ══ CONFIG ═══════════════════════════════════════════════════════════ */}
        {!loading && tab==="config" && (
          <>
            {/* SUBTABS */}
            <div style={{display:"flex",gap:"6px",flexWrap:"wrap",marginBottom:"14px"}}>
              {([
                ["anuncios","📋","Anuncios"],["empresas","🏢","Empresas"],["servicios","🛠️","Servicios"],
                ["trabajo","💼","Trabajo"],["grupos","🏘️","Grupos"],["filtros_ia","🤖","Filtros IA"],
              ] as [ConfigSub,string,string][]).map(([id,e,l])=>(
                <button key={id} onClick={()=>{setConfigSub(id);if(["empresas","servicios","trabajo"].includes(id))cargarEntRubros(id);}}
                  style={{...S.btn(configSub===id?"#d4a017":"#9a9a9a",configSub!==id),padding:"6px 14px",fontSize:"12px"}}>
                  {e} {l}
                </button>
              ))}
            </div>

            {/* ── ANUNCIOS rubros ── */}
            {configSub==="anuncios" && (
              <div style={S.card}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"12px"}}>
                  <div style={S.sect}>📁 Rubros de Anuncios</div>
                  <button onClick={()=>setModalRubro({nombre:"",emoji:"",orden:rubros.length})} style={S.btn("#27ae60")}>+ Nuevo rubro</button>
                </div>
                {rubros.map((r:any, idx:number)=>(
                  <div key={r.id} style={{marginBottom:"8px",border:"1px solid #f0f0f0",borderRadius:"12px",overflow:"hidden"}}>
                    <div style={{display:"flex",alignItems:"center",gap:"6px",padding:"10px 12px",background:expandRubro===r.id?"#f9f9f7":"#fff",cursor:"pointer"}} onClick={()=>setExpandRubro(expandRubro===r.id?null:r.id)}>
                      <span style={{fontSize:"18px"}}>{r.emoji||"📁"}</span>
                      <span style={{flex:1,fontSize:"14px",fontWeight:800,color:"#1a2a3a"}}>{r.nombre}</span>
                      <span style={{fontSize:"11px",color:"#9a9a9a",fontWeight:600}}>{(r.subrubros||[]).length} sub</span>
                      <button onClick={e=>{e.stopPropagation();moverRubro(r,"up");}} disabled={idx===0} style={{...S.btn("#9a9a9a",true),padding:"3px 8px",opacity:idx===0?0.3:1}}>↑</button>
                      <button onClick={e=>{e.stopPropagation();moverRubro(r,"down");}} disabled={idx===rubros.length-1} style={{...S.btn("#9a9a9a",true),padding:"3px 8px",opacity:idx===rubros.length-1?0.3:1}}>↓</button>
                      <button onClick={e=>{e.stopPropagation();setModalRubro({...r});}} style={{...S.btn("#3a7bd5",true),padding:"3px 8px"}}>✏️</button>
                      <button onClick={e=>{e.stopPropagation();eliminarRubro(r.id);}} style={{...S.btn("#e74c3c",true),padding:"3px 8px"}}>🗑️</button>
                      <span style={{fontSize:"16px",color:"#9a9a9a"}}>{expandRubro===r.id?"▲":"▼"}</span>
                    </div>
                    {expandRubro===r.id && (
                      <div style={{padding:"8px 12px 12px",background:"#f9f9f7",borderTop:"1px solid #f0f0f0"}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"8px"}}>
                          <span style={{fontSize:"11px",fontWeight:800,color:"#9a9a9a",textTransform:"uppercase",letterSpacing:"0.5px"}}>Subrubros</span>
                          <button onClick={()=>setModalSubrubro({nombre:"",rubro_id:r.id,orden:0})} style={{...S.btn("#27ae60",true),padding:"3px 10px",fontSize:"11px"}}>+ Agregar</button>
                        </div>
                        {(r.subrubros||[]).sort((a:any,b:any)=>(a.orden||0)-(b.orden||0)).map((s:any)=>(
                          <ItemRow key={s.id} label={s.nombre} onEdit={()=>setModalSubrubro({...s,rubro_id:r.id})} onDelete={()=>eliminarSubrubro(s.id,r.id)} />
                        ))}
                        {(r.subrubros||[]).length===0 && <div style={{fontSize:"12px",color:"#bbb",fontWeight:600,padding:"8px 0"}}>Sin subrubros todavía</div>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* ── EMPRESAS / SERVICIOS / TRABAJO rubros (genérico) ── */}
            {(configSub==="empresas"||configSub==="servicios"||configSub==="trabajo") && (
              <>
                <div style={S.card}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"12px"}}>
                    <div style={S.sect}>📁 Rubros de {configSub==="empresas"?"Empresas":configSub==="servicios"?"Servicios":"Trabajo"}</div>
                    <button onClick={()=>setModalEntRubro({nombre:"",orden:entRubros.length,_tipo:configSub})} style={S.btn("#27ae60")}>+ Nuevo rubro</button>
                  </div>
                  {entRubros.map((r:any, idx:number)=>(
                    <div key={r.id} style={{marginBottom:"8px",border:"1px solid #f0f0f0",borderRadius:"12px",overflow:"hidden"}}>
                      <div style={{display:"flex",alignItems:"center",gap:"6px",padding:"10px 12px",background:expandEntRubro===r.id?"#f9f9f7":"#fff",cursor:"pointer"}} onClick={()=>setExpandEntRubro(expandEntRubro===r.id?null:r.id)}>
                        <span style={{fontSize:"18px"}}>📁</span>
                        <span style={{flex:1,fontSize:"14px",fontWeight:800,color:"#1a2a3a"}}>{r.nombre}</span>
                        <span style={{fontSize:"11px",color:"#9a9a9a",fontWeight:600}}>{(r.subrubros||[]).length} sub</span>
                        <button onClick={e=>{e.stopPropagation();moverEntRubro(r,"up",configSub);}} disabled={idx===0} style={{...S.btn("#9a9a9a",true),padding:"3px 8px",opacity:idx===0?0.3:1}}>↑</button>
                        <button onClick={e=>{e.stopPropagation();moverEntRubro(r,"down",configSub);}} disabled={idx===entRubros.length-1} style={{...S.btn("#9a9a9a",true),padding:"3px 8px",opacity:idx===entRubros.length-1?0.3:1}}>↓</button>
                        <button onClick={e=>{e.stopPropagation();setModalEntRubro({...r,_tipo:configSub});}} style={{...S.btn("#3a7bd5",true),padding:"3px 8px"}}>✏️</button>
                        <button onClick={e=>{e.stopPropagation();eliminarEntRubro(r.id,configSub);}} style={{...S.btn("#e74c3c",true),padding:"3px 8px"}}>🗑️</button>
                        <span style={{fontSize:"16px",color:"#9a9a9a"}}>{expandEntRubro===r.id?"▲":"▼"}</span>
                      </div>
                      {expandEntRubro===r.id && (
                        <div style={{padding:"8px 12px 12px",background:"#f9f9f7",borderTop:"1px solid #f0f0f0"}}>
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"8px"}}>
                            <span style={{fontSize:"11px",fontWeight:800,color:"#9a9a9a",textTransform:"uppercase",letterSpacing:"0.5px"}}>Subrubros</span>
                            <button onClick={()=>setModalEntSub({nombre:"",rubro_id:r.id,orden:0,sliders_sugeridos:"",_tipo:configSub})} style={{...S.btn("#27ae60",true),padding:"3px 10px",fontSize:"11px"}}>+ Agregar</button>
                          </div>
                          {(r.subrubros||[]).sort((a:any,b:any)=>(a.orden||0)-(b.orden||0)).map((s:any)=>(
                            <div key={s.id} style={{display:"flex",alignItems:"center",gap:"6px",padding:"6px 0",borderBottom:"1px solid #f4f4f2"}}>
                              <div style={{flex:1,fontSize:"13px",fontWeight:700,color:"#1a2a3a"}}>{s.nombre}</div>
                              <button onClick={()=>cargarEntFiltros(s.id,configSub)} style={{...S.btn(entFiltroSubSel===s.id?"#d4a017":"#9a9a9a",true),padding:"3px 8px",fontSize:"10px"}}>🔧 Filtros</button>
                              <button onClick={()=>setModalEntSub({...s,rubro_id:r.id,sliders_sugeridos:s.sliders_sugeridos?JSON.stringify(s.sliders_sugeridos):"",_tipo:configSub})} style={{...S.btn("#3a7bd5",true),padding:"3px 8px"}}>✏️</button>
                              <button onClick={()=>eliminarEntSub(s.id,r.id,configSub)} style={{...S.btn("#e74c3c",true),padding:"3px 8px"}}>🗑️</button>
                            </div>
                          ))}
                          {(r.subrubros||[]).length===0 && <div style={{fontSize:"12px",color:"#bbb",fontWeight:600,padding:"8px 0"}}>Sin subrubros todavía</div>}
                        </div>
                      )}
                    </div>
                  ))}
                  {entRubros.length===0 && <div style={{fontSize:"13px",color:"#9a9a9a",fontWeight:600}}>Sin rubros todavía. Creá el primero.</div>}
                </div>
                {/* Filtros del subrubro seleccionado */}
                {entFiltroSubSel && (
                  <div style={S.card}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"12px"}}>
                      <div style={S.sect}>🔧 Filtros del subrubro</div>
                      <button onClick={()=>setModalEntFiltro({nombre:"",tipo:configSub==="empresas"?"rango":"lista",opciones:"",orden:entFiltros.length,_tipo:configSub})} style={S.btn("#27ae60")}>+ Agregar filtro</button>
                    </div>
                    {entFiltros.length===0 && <div style={{fontSize:"13px",color:"#9a9a9a",fontWeight:600}}>Sin filtros todavía.</div>}
                    {entFiltros.map((f:any)=>(
                      <div key={f.id} style={{display:"flex",alignItems:"center",gap:"8px",padding:"8px 0",borderBottom:"1px solid #f4f4f2"}}>
                        <div style={{flex:1}}>
                          <div style={{fontSize:"13px",fontWeight:800,color:"#1a2a3a"}}>{f.nombre}</div>
                          <div style={{fontSize:"11px",color:"#9a9a9a",fontWeight:600}}>
                            Tipo: <strong>{f.tipo}</strong>
                            {f.opciones && ` · ${JSON.stringify(f.opciones)}`}
                          </div>
                        </div>
                        <button onClick={()=>setModalEntFiltro({...f,opciones:f.opciones?JSON.stringify(f.opciones):"",_tipo:configSub})} style={{...S.btn("#3a7bd5",true),padding:"4px 8px"}}>✏️</button>
                        <button onClick={()=>eliminarEntFiltro(f.id,configSub)} style={{...S.btn("#e74c3c",true),padding:"4px 8px"}}>🗑️</button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* ── GRUPOS categorías ── */}
            {configSub==="grupos" && (
              <div style={S.card}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"12px"}}>
                  <div style={S.sect}>🏘️ Categorías de Grupos</div>
                  <button onClick={()=>setModalGrupoCat({nombre:"",emoji:"",descripcion:"",orden:grupoCats.length})} style={S.btn("#27ae60")}>+ Nueva categoría</button>
                </div>
                {grupoCats.map((c:any, idx:number)=>(
                  <div key={c.id} style={{marginBottom:"8px",border:"1px solid #f0f0f0",borderRadius:"12px",overflow:"hidden",opacity:c.activo?1:0.6}}>
                    <div style={{display:"flex",alignItems:"center",gap:"6px",padding:"10px 12px",background:expandGrupoCat===c.id?"#f9f9f7":"#fff",cursor:"pointer"}} onClick={()=>setExpandGrupoCat(expandGrupoCat===c.id?null:c.id)}>
                      <span style={{fontSize:"18px"}}>{c.emoji||"🏘️"}</span>
                      <span style={{flex:1,fontSize:"14px",fontWeight:800,color:"#1a2a3a"}}>{c.nombre}</span>
                      <span style={{fontSize:"11px",color:"#9a9a9a",fontWeight:600}}>{grupoSubcats.filter(s=>s.categoria_id===c.id).length} sub</span>
                      {!c.activo && <span style={S.badge("#fff","#e74c3c")}>OFF</span>}
                      <div onClick={e=>{e.stopPropagation();toggleGrupoCatActivo(c);}} style={{width:"36px",height:"20px",borderRadius:"10px",background:c.activo?"#27ae60":"#e0e0e0",cursor:"pointer",position:"relative",flexShrink:0}}>
                        <div style={{position:"absolute",top:"2px",left:c.activo?"18px":"2px",width:"16px",height:"16px",borderRadius:"50%",background:"#fff",transition:"left .2s"}} />
                      </div>
                      <button onClick={e=>{e.stopPropagation();moverGrupoCat(c,"up");}} disabled={idx===0} style={{...S.btn("#9a9a9a",true),padding:"3px 8px",opacity:idx===0?0.3:1}}>↑</button>
                      <button onClick={e=>{e.stopPropagation();moverGrupoCat(c,"down");}} disabled={idx===grupoCats.length-1} style={{...S.btn("#9a9a9a",true),padding:"3px 8px",opacity:idx===grupoCats.length-1?0.3:1}}>↓</button>
                      <button onClick={e=>{e.stopPropagation();setModalGrupoCat({...c});}} style={{...S.btn("#3a7bd5",true),padding:"3px 8px"}}>✏️</button>
                      <button onClick={e=>{e.stopPropagation();eliminarGrupoCat(c.id);}} style={{...S.btn("#e74c3c",true),padding:"3px 8px"}}>🗑️</button>
                      <span style={{fontSize:"16px",color:"#9a9a9a"}}>{expandGrupoCat===c.id?"▲":"▼"}</span>
                    </div>
                    {expandGrupoCat===c.id && (
                      <div style={{padding:"8px 12px 12px",background:"#f9f9f7",borderTop:"1px solid #f0f0f0"}}>
                        {c.descripcion && <div style={{fontSize:"12px",color:"#9a9a9a",fontWeight:600,marginBottom:"8px"}}>{c.descripcion}</div>}
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"8px"}}>
                          <span style={{fontSize:"11px",fontWeight:800,color:"#9a9a9a",textTransform:"uppercase",letterSpacing:"0.5px"}}>Subcategorías</span>
                          <button onClick={()=>setModalGrupoSubcat({nombre:"",descripcion:"",categoria_id:c.id})} style={{...S.btn("#27ae60",true),padding:"3px 10px",fontSize:"11px"}}>+ Agregar</button>
                        </div>
                        {grupoSubcats.filter(s=>s.categoria_id===c.id).map((s:any)=>(
                          <ItemRow key={s.id} label={s.nombre} badge={!s.activo?<span style={S.badge("#fff","#e74c3c")}>OFF</span>:undefined} onEdit={()=>setModalGrupoSubcat({...s})} onDelete={()=>eliminarGrupoSubcat(s.id)} />
                        ))}
                        {grupoSubcats.filter(s=>s.categoria_id===c.id).length===0 && <div style={{fontSize:"12px",color:"#bbb",fontWeight:600,padding:"8px 0"}}>Sin subcategorías todavía</div>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* ── FILTROS IA (búsquedas automáticas) ── */}
            {configSub==="filtros_ia" && (
              <>
                <div style={S.card}>
                  <div style={S.sect}>🤖 Filtros por subrubro (Anuncios)</div>
                  <div style={{fontSize:"12px",color:"#9a9a9a",fontWeight:600,marginBottom:"14px"}}>
                    Seleccioná un subrubro para ver y configurar sus filtros de búsqueda IA
                  </div>
                  {rubros.map((r:any)=>(
                    <div key={r.id} style={{marginBottom:"10px"}}>
                      <div style={{fontSize:"13px",fontWeight:900,color:"#1a2a3a",marginBottom:"6px"}}>{r.emoji||"📁"} {r.nombre}</div>
                      <div style={{display:"flex",gap:"6px",flexWrap:"wrap",marginBottom:"4px"}}>
                        {(r.subrubros||[]).map((s:any)=>(
                          <button key={s.id} onClick={()=>cargarFiltros(s.id)}
                            style={{...S.btn(filtroSubSel===s.id?"#d4a017":"#9a9a9a",filtroSubSel!==s.id),padding:"5px 12px",fontSize:"11px"}}>
                            {s.nombre}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                {filtroSubSel && (
                  <div style={S.card}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"12px"}}>
                      <div style={S.sect}>🔧 Filtros configurados</div>
                      <button onClick={()=>setModalFiltro({nombre:"",tipo:"rango",opciones:"",orden:filtrosIA.length})} style={S.btn("#27ae60")}>+ Agregar filtro</button>
                    </div>
                    {filtrosIA.length===0 && <div style={{fontSize:"13px",color:"#9a9a9a",fontWeight:600}}>Sin filtros todavía. Agregá uno.</div>}
                    {filtrosIA.map((f:any)=>(
                      <div key={f.id} style={{display:"flex",alignItems:"center",gap:"8px",padding:"8px 0",borderBottom:"1px solid #f4f4f2"}}>
                        <div style={{flex:1}}>
                          <div style={{fontSize:"13px",fontWeight:800,color:"#1a2a3a"}}>{f.nombre}</div>
                          <div style={{fontSize:"11px",color:"#9a9a9a",fontWeight:600}}>
                            Tipo: <strong>{f.tipo}</strong>
                            {f.opciones && ` · ${JSON.stringify(f.opciones)}`}
                          </div>
                        </div>
                        <button onClick={()=>setModalFiltro({...f,opciones:f.opciones?JSON.stringify(f.opciones):""})} style={{...S.btn("#3a7bd5",true),padding:"4px 8px"}}>✏️</button>
                        <button onClick={()=>eliminarFiltro(f.id)} style={{...S.btn("#e74c3c",true),padding:"4px 8px"}}>🗑️</button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Acciones del sistema — siempre visible */}
            <div style={S.card}>
              <div style={S.sect}>🔧 Acciones del sistema</div>
              <div style={{display:"flex",gap:"8px",flexWrap:"wrap"}}>
                <button onClick={cargarTodo}            style={S.btn("#3a7bd5")}>🔄 Refrescar datos</button>
                <button onClick={()=>router.push("/")} style={S.btn("#d4a017")}>🏠 Ir al sitio</button>
                <button onClick={async()=>{await supabase.auth.signOut();router.push("/admin/login");}} style={S.btn("#e74c3c")}>🚪 Cerrar sesión</button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ══ MODAL VER USUARIO ══════════════════════════════════════════════════ */}
      {modalUsuario && (
        <Modal titulo={`👤 ${modalUsuario.nombre_usuario}`} onClose={()=>setModalUsuario(null)}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px",marginBottom:"16px"}}>
            {[["Email",modalUsuario.email],["Código",modalUsuario.codigo],["WhatsApp",modalUsuario.whatsapp||"—"],["Provincia",modalUsuario.provincia||"—"],["Ciudad",modalUsuario.ciudad||"—"]].map(([l,v])=>(
              <div key={l}>
                <div style={{fontSize:"10px",fontWeight:800,color:"#9a9a9a",textTransform:"uppercase"}}>{l}</div>
                <div style={{fontSize:"13px",fontWeight:700,color:"#1a2a3a"}}>{v}</div>
              </div>
            ))}
          </div>
          <div style={S.sect}>💰 BIT disponibles</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"6px",marginBottom:"16px"}}>
            {[["BIT Nexo 💛","bits"],["BIT Free 💙","bits_free"],["BIT Conexión 🔗","bits_conexion"],["BIT Búsquedas 🤖","bits_busquedas"],["BIT Promotor ⭐","bits_promotor"]].map(([l,k])=>(
              <div key={k} style={{background:"#f4f4f2",borderRadius:"10px",padding:"8px 12px"}}>
                <div style={{fontSize:"10px",fontWeight:800,color:"#9a9a9a"}}>{l}</div>
                <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"20px",color:"#1a2a3a"}}>{(modalUsuario[k]||0).toLocaleString()}</div>
              </div>
            ))}
          </div>
          <div style={{display:"flex",gap:"8px",flexWrap:"wrap"}}>
            <button onClick={()=>{setModalUsuario(null);setModalBit(modalUsuario);setBitTipo("bits");setBitCant("");setBitNota("");}} style={S.btn("#d4a017")}>💰 Asignar BIT</button>
            <button onClick={()=>{setModalUsuario(null);setModalPassword(modalUsuario);setNuevaPass("");setShowPass(false);}} style={S.btn("#3a7bd5")}>🔑 Contraseña</button>
            <button onClick={()=>bloquearUsuario(modalUsuario)} style={S.btn(modalUsuario.bloqueado?"#27ae60":"#e67e22")}>{modalUsuario.bloqueado?"🔓 Desbloquear":"🔒 Bloquear"}</button>
          </div>
        </Modal>
      )}

      {/* ══ MODAL ASIGNAR BIT ══════════════════════════════════════════════════ */}
      {modalBit && (
        <Modal titulo={`💰 Asignar BIT a ${modalBit.nombre_usuario}`} onClose={()=>setModalBit(null)}>
          <label style={S.label}>Tipo de BIT</label>
          <select style={{...S.input,marginBottom:"12px"}} value={bitTipo} onChange={e=>setBitTipo(e.target.value)}>
            <option value="bits">💛 BIT Nexo</option>
            <option value="bits_free">💙 BIT Free</option>
            <option value="bits_conexion">🔗 BIT Conexión</option>
            <option value="bits_busquedas">🤖 BIT Búsquedas IA</option>
            <option value="bits_promotor">⭐ BIT Promotor</option>
            <option value="bits_grupo">🏘️ BIT Grupo</option>
          </select>
          <label style={S.label}>Cantidad (negativa para quitar)</label>
          <input style={{...S.input,marginBottom:"12px"}} type="number" placeholder="Ej: 500" value={bitCant} onChange={e=>setBitCant(e.target.value)} />
          <label style={S.label}>Nota para el usuario (opcional)</label>
          <input style={{...S.input,marginBottom:"16px"}} placeholder="Ej: Premio por participación" value={bitNota} onChange={e=>setBitNota(e.target.value)} />
          <div style={{fontSize:"12px",color:"#9a9a9a",fontWeight:600,marginBottom:"12px"}}>Saldo actual: <strong>{(modalBit[bitTipo]||0).toLocaleString()}</strong></div>
          <button onClick={asignarBit} style={S.btn("#d4a017")} disabled={!bitCant}>✅ Confirmar asignación</button>
        </Modal>
      )}

      {/* ══ MODAL EDITAR ANUNCIO ════════════════════════════════════════════════ */}
      {modalAnuncio && (
        <Modal titulo="✏️ Editar anuncio" onClose={()=>setModalAnuncio(null)}>
          <label style={S.label}>Título</label>
          <input style={{...S.input,marginBottom:"10px"}} value={modalAnuncio.titulo||""} onChange={e=>setModalAnuncio({...modalAnuncio,titulo:e.target.value})} />
          <label style={S.label}>Descripción</label>
          <textarea style={{...S.input,minHeight:"70px",resize:"vertical",marginBottom:"10px"}} value={modalAnuncio.descripcion||""} onChange={e=>setModalAnuncio({...modalAnuncio,descripcion:e.target.value})} />
          <label style={S.label}>Precio</label>
          <input style={{...S.input,marginBottom:"10px"}} type="number" value={modalAnuncio.precio||""} onChange={e=>setModalAnuncio({...modalAnuncio,precio:e.target.value})} />
          <label style={S.label}>Estado</label>
          <select style={{...S.input,marginBottom:"16px"}} value={modalAnuncio.estado||"activo"} onChange={e=>setModalAnuncio({...modalAnuncio,estado:e.target.value})}>
            <option value="activo">✅ Activo</option>
            <option value="bloqueado">🔒 Bloqueado</option>
            <option value="pausado">⏸️ Pausado</option>
          </select>
          <div style={{display:"flex",gap:"8px"}}>
            <button onClick={()=>guardarAnuncio(modalAnuncio)} style={S.btn("#27ae60")}>💾 Guardar</button>
            <button onClick={()=>router.push(`/anuncios/${modalAnuncio.id}`)} style={S.btn("#3a7bd5",true)}>👁️ Ver</button>
          </div>
        </Modal>
      )}

      {/* ══ MODAL PUBLICAR ANUNCIO ══════════════════════════════════════════════ */}
      {modalNuevoAn && (
        <Modal titulo="📋 Publicar anuncio" onClose={()=>setModalNuevoAn(false)}>
          <label style={S.label}>Título</label>
          <input style={{...S.input,marginBottom:"10px"}} placeholder="Título del anuncio" value={nuevaAn.titulo} onChange={e=>setNuevaAn({...nuevaAn,titulo:e.target.value})} />
          <label style={S.label}>Descripción</label>
          <textarea style={{...S.input,minHeight:"70px",resize:"vertical",marginBottom:"10px"}} value={nuevaAn.descripcion} onChange={e=>setNuevaAn({...nuevaAn,descripcion:e.target.value})} />
          <label style={S.label}>Precio</label>
          <input style={{...S.input,marginBottom:"10px"}} type="number" placeholder="0" value={nuevaAn.precio} onChange={e=>setNuevaAn({...nuevaAn,precio:e.target.value})} />
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px",marginBottom:"16px"}}>
            <div><label style={S.label}>Provincia</label><input style={S.input} value={nuevaAn.provincia} onChange={e=>setNuevaAn({...nuevaAn,provincia:e.target.value})} /></div>
            <div><label style={S.label}>Ciudad</label><input style={S.input} value={nuevaAn.ciudad} onChange={e=>setNuevaAn({...nuevaAn,ciudad:e.target.value})} /></div>
          </div>
          <div style={{display:"flex",gap:"12px",marginBottom:"16px"}}>
            <label style={{display:"flex",alignItems:"center",gap:"6px",fontSize:"13px",fontWeight:700,cursor:"pointer"}}>
              <input type="checkbox" checked={nuevaAn.flash} onChange={e=>setNuevaAn({...nuevaAn,flash:e.target.checked})} />⚡ Flash
            </label>
            <label style={{display:"flex",alignItems:"center",gap:"6px",fontSize:"13px",fontWeight:700,cursor:"pointer"}}>
              <input type="checkbox" checked={nuevaAn.permuto} onChange={e=>setNuevaAn({...nuevaAn,permuto:e.target.checked})} />🔄 Permuta
            </label>
          </div>
          <button onClick={publicarAnuncio} style={S.btn("#27ae60")} disabled={!nuevaAn.titulo}>📋 Publicar</button>
        </Modal>
      )}

      {/* ══ MODAL MENSAJE ════════════════════════════════════════════════════════ */}
      {modalMensaje && (
        <Modal titulo={`💬 Mensaje a ${modalMensaje.nombre_usuario}`} onClose={()=>setModalMensaje(null)}>
          <label style={S.label}>Tipo</label>
          <select style={{...S.input,marginBottom:"10px"}} value={msgTipo} onChange={e=>setMsgTipo(e.target.value)}>
            <option value="sistema">⚙️ Sistema</option>
            <option value="promocion">🎁 Promoción</option>
            <option value="alerta">⚠️ Alerta</option>
          </select>
          <label style={S.label}>Mensaje</label>
          <textarea style={{...S.input,minHeight:"90px",resize:"vertical",marginBottom:"16px"}} value={msgTexto} onChange={e=>setMsgTexto(e.target.value)} />
          <button onClick={enviarMensaje} style={S.btn("#3a7bd5")} disabled={!msgTexto}>📨 Enviar</button>
        </Modal>
      )}

      {/* ══ MODAL CREAR GRUPO ════════════════════════════════════════════════════ */}
      {modalNuevoGr && (
        <Modal titulo="🏘️ Crear grupo" onClose={()=>setModalNuevoGr(false)}>
          <label style={S.label}>Nombre</label>
          <input style={{...S.input,marginBottom:"10px"}} placeholder="Nombre del grupo" value={nuevoGr.nombre} onChange={e=>setNuevoGr({...nuevoGr,nombre:e.target.value})} />
          <label style={S.label}>Descripción</label>
          <textarea style={{...S.input,minHeight:"70px",resize:"vertical",marginBottom:"10px"}} value={nuevoGr.descripcion} onChange={e=>setNuevoGr({...nuevoGr,descripcion:e.target.value})} />
          <label style={S.label}>Categoría</label>
          <select style={{...S.input,marginBottom:"16px"}} value={nuevoGr.categoria_id} onChange={e=>setNuevoGr({...nuevoGr,categoria_id:e.target.value})}>
            <option value="">Sin categoría</option>
            {grupoCats.map(c=><option key={c.id} value={c.id}>{c.emoji} {c.nombre}</option>)}
          </select>
          <button onClick={crearGrupo} style={S.btn("#27ae60")} disabled={!nuevoGr.nombre}>🏘️ Crear grupo</button>
        </Modal>
      )}

      {/* ══ MODAL RUBRO ════════════════════════════════════════════════════════ */}
      {modalRubro && (
        <Modal titulo={modalRubro.id?"✏️ Editar rubro":"➕ Nuevo rubro"} onClose={()=>setModalRubro(null)}>
          <label style={S.label}>Nombre</label>
          <input style={{...S.input,marginBottom:"10px"}} placeholder="Ej: Vehículos" value={modalRubro.nombre||""} onChange={e=>setModalRubro({...modalRubro,nombre:e.target.value})} />
          <label style={S.label}>Emoji</label>
          <input style={{...S.input,marginBottom:"10px"}} placeholder="Ej: 🚗" value={modalRubro.emoji||""} onChange={e=>setModalRubro({...modalRubro,emoji:e.target.value})} />
          <label style={S.label}>Orden (número)</label>
          <input style={{...S.input,marginBottom:"16px"}} type="number" placeholder="0" value={modalRubro.orden||""} onChange={e=>setModalRubro({...modalRubro,orden:e.target.value})} />
          <button onClick={()=>guardarRubro(modalRubro)} style={S.btn("#27ae60")} disabled={!modalRubro.nombre}>💾 Guardar</button>
        </Modal>
      )}

      {/* ══ MODAL SUBRUBRO ═══════════════════════════════════════════════════════ */}
      {modalSubrubro && (
        <Modal titulo={modalSubrubro.id?"✏️ Editar subrubro":"➕ Nuevo subrubro"} onClose={()=>setModalSubrubro(null)}>
          <label style={S.label}>Nombre</label>
          <input style={{...S.input,marginBottom:"10px"}} placeholder="Ej: Autos" value={modalSubrubro.nombre||""} onChange={e=>setModalSubrubro({...modalSubrubro,nombre:e.target.value})} />
          <label style={S.label}>Orden (número)</label>
          <input style={{...S.input,marginBottom:"16px"}} type="number" placeholder="0" value={modalSubrubro.orden||""} onChange={e=>setModalSubrubro({...modalSubrubro,orden:e.target.value})} />
          <button onClick={()=>guardarSubrubro(modalSubrubro)} style={S.btn("#27ae60")} disabled={!modalSubrubro.nombre}>💾 Guardar</button>
        </Modal>
      )}

      {/* ══ MODAL CATEGORÍA GRUPO ════════════════════════════════════════════════ */}
      {modalGrupoCat && (
        <Modal titulo={modalGrupoCat.id?"✏️ Editar categoría":"➕ Nueva categoría de grupo"} onClose={()=>setModalGrupoCat(null)}>
          <label style={S.label}>Nombre</label>
          <input style={{...S.input,marginBottom:"10px"}} placeholder="Ej: Deportivos" value={modalGrupoCat.nombre||""} onChange={e=>setModalGrupoCat({...modalGrupoCat,nombre:e.target.value})} />
          <label style={S.label}>Emoji</label>
          <input style={{...S.input,marginBottom:"10px"}} placeholder="Ej: 🏅" value={modalGrupoCat.emoji||""} onChange={e=>setModalGrupoCat({...modalGrupoCat,emoji:e.target.value})} />
          <label style={S.label}>Descripción</label>
          <input style={{...S.input,marginBottom:"10px"}} placeholder="Descripción breve..." value={modalGrupoCat.descripcion||""} onChange={e=>setModalGrupoCat({...modalGrupoCat,descripcion:e.target.value})} />
          <label style={S.label}>Orden (número)</label>
          <input style={{...S.input,marginBottom:"10px"}} type="number" placeholder="0" value={modalGrupoCat.orden||""} onChange={e=>setModalGrupoCat({...modalGrupoCat,orden:e.target.value})} />
          <label style={{display:"flex",alignItems:"center",gap:"8px",fontSize:"13px",fontWeight:700,cursor:"pointer",marginBottom:"16px"}}>
            <input type="checkbox" checked={modalGrupoCat.activo!==false} onChange={e=>setModalGrupoCat({...modalGrupoCat,activo:e.target.checked})} />
            Categoría activa (visible en la app)
          </label>
          <button onClick={()=>guardarGrupoCat(modalGrupoCat)} style={S.btn("#27ae60")} disabled={!modalGrupoCat.nombre}>💾 Guardar</button>
        </Modal>
      )}

      {/* ══ MODAL SUBCATEGORÍA GRUPO ═════════════════════════════════════════════ */}
      {modalGrupoSubcat && (
        <Modal titulo={modalGrupoSubcat.id?"✏️ Editar subcategoría":"➕ Nueva subcategoría"} onClose={()=>setModalGrupoSubcat(null)}>
          <label style={S.label}>Nombre</label>
          <input style={{...S.input,marginBottom:"10px"}} placeholder="Ej: Pádel" value={modalGrupoSubcat.nombre||""} onChange={e=>setModalGrupoSubcat({...modalGrupoSubcat,nombre:e.target.value})} />
          <label style={S.label}>Descripción</label>
          <input style={{...S.input,marginBottom:"10px"}} placeholder="Descripción breve..." value={modalGrupoSubcat.descripcion||""} onChange={e=>setModalGrupoSubcat({...modalGrupoSubcat,descripcion:e.target.value})} />
          {!modalGrupoSubcat.id && (
            <>
              <label style={S.label}>Categoría</label>
              <select style={{...S.input,marginBottom:"10px"}} value={modalGrupoSubcat.categoria_id||""} onChange={e=>setModalGrupoSubcat({...modalGrupoSubcat,categoria_id:e.target.value})}>
                <option value="">Seleccionar...</option>
                {grupoCats.map(c=><option key={c.id} value={c.id}>{c.emoji} {c.nombre}</option>)}
              </select>
            </>
          )}
          <label style={{display:"flex",alignItems:"center",gap:"8px",fontSize:"13px",fontWeight:700,cursor:"pointer",marginBottom:"16px"}}>
            <input type="checkbox" checked={modalGrupoSubcat.activo!==false} onChange={e=>setModalGrupoSubcat({...modalGrupoSubcat,activo:e.target.checked})} />
            Subcategoría activa
          </label>
          <button onClick={()=>guardarGrupoSubcat(modalGrupoSubcat)} style={S.btn("#27ae60")} disabled={!modalGrupoSubcat.nombre}>💾 Guardar</button>
        </Modal>
      )}

      {/* ══ MODAL RESPONDER CONTACTO ════════════════════════════════════════════ */}
      {respContacto && (
        <Modal titulo={`📩 Responder ${respContacto.c.tipo}`} onClose={()=>setRespContacto(null)}>
          <div style={{background:"#f4f4f2",borderRadius:"10px",padding:"10px 14px",marginBottom:"14px"}}>
            <div style={{fontSize:"11px",fontWeight:700,color:"#9a9a9a",marginBottom:"4px"}}>{respContacto.c.usuarios?.nombre_usuario} — {respContacto.c.tipo}</div>
            <div style={{fontSize:"13px",fontWeight:600,color:"#1a2a3a"}}>{respContacto.c.mensaje}</div>
          </div>
          <label style={S.label}>Tu respuesta</label>
          <textarea style={{...S.input,minHeight:"90px",resize:"vertical",marginBottom:"16px"}} placeholder="Escribí tu respuesta..." value={respContacto.texto} onChange={e=>setRespContacto({...respContacto,texto:e.target.value})} />
          <button onClick={responderContacto} style={S.btn("#27ae60")} disabled={!respContacto.texto.trim()}>📨 Enviar respuesta</button>
        </Modal>
      )}

      {/* ══ MODAL CREAR USUARIO ═══════════════════════════════════════════════ */}
      {modalCrearUser && (
        <Modal titulo="👤 Crear usuario" onClose={()=>setModalCrearUser(false)}>
          <label style={S.label}>Email *</label>
          <input style={{...S.input,marginBottom:"10px"}} type="email" placeholder="email@ejemplo.com" value={nuevoUser.email} onChange={e=>setNuevoUser({...nuevoUser,email:e.target.value})} />
          <label style={S.label}>Contraseña * (mín. 6)</label>
          <input style={{...S.input,marginBottom:"10px"}} type="text" placeholder="••••••" value={nuevoUser.password} onChange={e=>setNuevoUser({...nuevoUser,password:e.target.value})} />
          <label style={S.label}>Nombre de usuario *</label>
          <input style={{...S.input,marginBottom:"10px"}} placeholder="nombre_usuario" value={nuevoUser.nombre_usuario} onChange={e=>setNuevoUser({...nuevoUser,nombre_usuario:e.target.value})} />
          <label style={S.label}>Nombre real (opcional)</label>
          <input style={{...S.input,marginBottom:"16px"}} placeholder="Juan Pérez" value={nuevoUser.nombre} onChange={e=>setNuevoUser({...nuevoUser,nombre:e.target.value})} />
          <button onClick={crearUsuario} style={S.btn("#27ae60")} disabled={!nuevoUser.email||!nuevoUser.password||!nuevoUser.nombre_usuario}>👤 Crear usuario</button>
        </Modal>
      )}

      {/* ══ MODAL RESPONDER COMO ADMIN ══════════════════════════════════════════ */}
      {respAdmin && (
        <Modal titulo={`💬 Responder a ${respAdmin.msg.emisor?.nombre_usuario||respAdmin.msg.receptor?.nombre_usuario||"usuario"}`} onClose={()=>setRespAdmin(null)}>
          <div style={{background:"#f4f4f2",borderRadius:"10px",padding:"10px 14px",marginBottom:"14px"}}>
            <div style={{fontSize:"11px",fontWeight:700,color:"#9a9a9a",marginBottom:"4px"}}>Mensaje original:</div>
            <div style={{fontSize:"13px",fontWeight:600,color:"#1a2a3a"}}>{respAdmin.msg.mensaje||respAdmin.msg.texto||"..."}</div>
          </div>
          <label style={S.label}>Tu respuesta</label>
          <textarea style={{...S.input,minHeight:"90px",resize:"vertical",marginBottom:"16px"}} placeholder="Escribí tu respuesta..." value={respAdmin.texto} onChange={e=>setRespAdmin({...respAdmin,texto:e.target.value})} />
          <button onClick={responderComoAdmin} style={S.btn("#3a7bd5")} disabled={!respAdmin.texto.trim()}>📨 Enviar respuesta</button>
        </Modal>
      )}

      {/* ══ MODAL FILTRO IA ════════════════════════════════════════════════════ */}
      {modalFiltro && (
        <Modal titulo={modalFiltro.id?"✏️ Editar filtro":"➕ Nuevo filtro"} onClose={()=>setModalFiltro(null)}>
          <label style={S.label}>Nombre del campo *</label>
          <input style={{...S.input,marginBottom:"10px"}} placeholder="Ej: Año, Precio, Km, Superficie..." value={modalFiltro.nombre||""} onChange={e=>setModalFiltro({...modalFiltro,nombre:e.target.value})} />
          <label style={S.label}>Tipo</label>
          <select style={{...S.input,marginBottom:"10px"}} value={modalFiltro.tipo||"rango"} onChange={e=>setModalFiltro({...modalFiltro,tipo:e.target.value})}>
            <option value="rango">📊 Rango (desde/hasta)</option>
            <option value="lista">📋 Lista (opciones fijas)</option>
          </select>
          {modalFiltro.tipo==="lista" && (
            <>
              <label style={S.label}>Opciones (JSON array)</label>
              <textarea style={{...S.input,minHeight:"60px",resize:"vertical",marginBottom:"10px"}} placeholder={'["Opción 1","Opción 2","Opción 3"]'} value={modalFiltro.opciones||""} onChange={e=>setModalFiltro({...modalFiltro,opciones:e.target.value})} />
            </>
          )}
          <label style={S.label}>Orden</label>
          <input style={{...S.input,marginBottom:"16px"}} type="number" placeholder="0" value={modalFiltro.orden||""} onChange={e=>setModalFiltro({...modalFiltro,orden:e.target.value})} />
          <button onClick={()=>guardarFiltro(modalFiltro)} style={S.btn("#27ae60")} disabled={!modalFiltro.nombre}>💾 Guardar filtro</button>
        </Modal>
      )}

      {/* ══ MODAL ENTITY RUBRO (empresa/servicio/trabajo) ═══════════════════════ */}
      {modalEntRubro && (
        <Modal titulo={modalEntRubro.id?"✏️ Editar rubro":"➕ Nuevo rubro"} onClose={()=>setModalEntRubro(null)}>
          <label style={S.label}>Nombre</label>
          <input style={{...S.input,marginBottom:"10px"}} placeholder="Ej: Gastronomía" value={modalEntRubro.nombre||""} onChange={e=>setModalEntRubro({...modalEntRubro,nombre:e.target.value})} />
          <label style={S.label}>Orden (número)</label>
          <input style={{...S.input,marginBottom:"16px"}} type="number" placeholder="0" value={modalEntRubro.orden||""} onChange={e=>setModalEntRubro({...modalEntRubro,orden:e.target.value})} />
          <button onClick={()=>guardarEntRubro(modalEntRubro,modalEntRubro._tipo)} style={S.btn("#27ae60")} disabled={!modalEntRubro.nombre}>💾 Guardar</button>
        </Modal>
      )}

      {/* ══ MODAL ENTITY SUBRUBRO ════════════════════════════════════════════════ */}
      {modalEntSub && (
        <Modal titulo={modalEntSub.id?"✏️ Editar subrubro":"➕ Nuevo subrubro"} onClose={()=>setModalEntSub(null)}>
          <label style={S.label}>Nombre</label>
          <input style={{...S.input,marginBottom:"10px"}} placeholder="Ej: Restaurante" value={modalEntSub.nombre||""} onChange={e=>setModalEntSub({...modalEntSub,nombre:e.target.value})} />
          <label style={S.label}>Orden (número)</label>
          <input style={{...S.input,marginBottom:"10px"}} type="number" placeholder="0" value={modalEntSub.orden||""} onChange={e=>setModalEntSub({...modalEntSub,orden:e.target.value})} />
          <label style={S.label}>Sliders sugeridos (JSON array, opcional)</label>
          <textarea style={{...S.input,minHeight:"50px",resize:"vertical",marginBottom:"16px"}} placeholder={'["galería","servicios","testimonios"]'} value={modalEntSub.sliders_sugeridos||""} onChange={e=>setModalEntSub({...modalEntSub,sliders_sugeridos:e.target.value})} />
          <button onClick={()=>guardarEntSub(modalEntSub,modalEntSub._tipo)} style={S.btn("#27ae60")} disabled={!modalEntSub.nombre}>💾 Guardar</button>
        </Modal>
      )}

      {/* ══ MODAL ENTITY FILTRO ══════════════════════════════════════════════════ */}
      {modalEntFiltro && (
        <Modal titulo={modalEntFiltro.id?"✏️ Editar filtro":"➕ Nuevo filtro"} onClose={()=>setModalEntFiltro(null)}>
          <label style={S.label}>Nombre del campo *</label>
          <input style={{...S.input,marginBottom:"10px"}} placeholder="Ej: Modalidad, Jornada, Precio..." value={modalEntFiltro.nombre||""} onChange={e=>setModalEntFiltro({...modalEntFiltro,nombre:e.target.value})} />
          <label style={S.label}>Tipo</label>
          <select style={{...S.input,marginBottom:"10px"}} value={modalEntFiltro.tipo||"rango"} onChange={e=>setModalEntFiltro({...modalEntFiltro,tipo:e.target.value})}>
            <option value="rango">📊 Rango (desde/hasta)</option>
            <option value="lista">📋 Lista (opciones fijas)</option>
          </select>
          {modalEntFiltro.tipo==="lista" && (
            <>
              <label style={S.label}>Opciones (JSON array)</label>
              <textarea style={{...S.input,minHeight:"60px",resize:"vertical",marginBottom:"10px"}} placeholder={'["Presencial","Remoto","Híbrido"]'} value={modalEntFiltro.opciones||""} onChange={e=>setModalEntFiltro({...modalEntFiltro,opciones:e.target.value})} />
            </>
          )}
          <label style={S.label}>Orden</label>
          <input style={{...S.input,marginBottom:"16px"}} type="number" placeholder="0" value={modalEntFiltro.orden||""} onChange={e=>setModalEntFiltro({...modalEntFiltro,orden:e.target.value})} />
          <button onClick={()=>guardarEntFiltro(modalEntFiltro,modalEntFiltro._tipo)} style={S.btn("#27ae60")} disabled={!modalEntFiltro.nombre}>💾 Guardar filtro</button>
        </Modal>
      )}

      {/* ══ MODAL RESET CONTRASEÑA ══════════════════════════════════════════════ */}
      {modalPassword && (
        <Modal titulo="🔑 Restablecer contraseña" onClose={()=>setModalPassword(null)}>
          <div style={{fontSize:"13px",color:"#9a9a9a",fontWeight:600,marginBottom:"16px"}}>
            Se enviará un email de restablecimiento a:<br/>
            <strong style={{color:"#1a2a3a"}}>{modalPassword.email}</strong>
          </div>
          <div style={{background:"rgba(58,123,213,0.06)",border:"2px solid rgba(58,123,213,0.2)",borderRadius:"12px",padding:"12px 14px",marginBottom:"16px",fontSize:"12px",color:"#3a7bd5",fontWeight:700}}>
            ℹ️ El usuario recibirá un link para crear su nueva contraseña
          </div>
          <button onClick={resetPassword} style={S.btn("#3a7bd5")}>
            📧 Enviar email de restablecimiento
          </button>
        </Modal>
      )}
    </main>
  );
}
