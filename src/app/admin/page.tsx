"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const ADMIN_UUID = "ab56253d-b92e-4b73-a19a-3cd0cd95c458";

type Tab = "dashboard"|"usuarios"|"anuncios"|"grupos"|"mensajes"|"promotores"|"pagos"|"alarmas"|"config";

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

  // Config: categorías de grupos
  const [grupoCats,    setGrupoCats]    = useState<any[]>([]);
  const [grupoSubcats, setGrupoSubcats] = useState<any[]>([]);

  // Config: expansión
  const [expandRubro,   setExpandRubro]   = useState<number|null>(null);
  const [expandGrupoCat,setExpandGrupoCat]= useState<number|null>(null);

  // Modales Config
  const [modalRubro,       setModalRubro]       = useState<any>(null); // null=cerrado, {}=nuevo, {id,...}=editar
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
    await supabase.from("usuarios").update({[bitTipo]:actual+cant}).eq("id",modalBit.id);
    setUsuarios(prev=>prev.map(x=>x.id===modalBit.id?{...x,[bitTipo]:actual+cant}:x));
    if (bitNota) await supabase.from("notificaciones").insert({usuario_id:modalBit.id,tipo:"sistema",mensaje:`💰 Admin acreditó ${cant} ${bitTipo.toUpperCase()} — ${bitNota}`,leida:false});
    setModalBit(null); setBitCant(""); setBitNota("");
    showToast(`✅ ${cant} ${bitTipo} acreditados`);
  };
  const resetPassword = async () => {
    if (!modalPassword || !nuevaPass.trim()) return;
    if (nuevaPass.length < 6) { showToast("❌ Mínimo 6 caracteres"); return; }
    // Enviar email de reset al usuario
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
    {id:"config",   e:"⚙️",l:"Config"},
  ];

  // ── Sección de item editable para rubro/subrubro/cat/subcat ──
  const ItemRow = ({label, onEdit, onDelete, onUp, onDown, badge, extra}:{label:string;onEdit:()=>void;onDelete:()=>void;onUp?:()=>void;onDown?:()=>void;badge?:React.ReactNode;extra?:React.ReactNode}) => (
    <div style={{display:"flex",alignItems:"center",gap:"6px",padding:"6px 0",borderBottom:"1px solid #f4f4f2"}}>
      <div style={{flex:1,fontSize:"13px",fontWeight:700,color:"#1a2a3a",display:"flex",alignItems:"center",gap:"6px"}}>
        {label} {badge}
      </div>
      {extra}
      {onUp  && <button onClick={onUp}   style={{...S.btn("#9a9a9a",true),padding:"4px 8px"}}>↑</button>}
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
            <div style={S.card}>
              <input style={S.input} placeholder="🔍 Buscar por nombre, email o código..." value={busqUser} onChange={e=>setBusqUser(e.target.value)} />
              <div style={{display:"flex",gap:"6px",marginTop:"10px",flexWrap:"wrap"}}>
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
                <div key={m.id} style={S.row}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:"12px",fontWeight:800,color:"#1a2a3a"}}>{m.emisor?.nombre_usuario||"Sistema"} → {m.receptor?.nombre_usuario||"?"}</div>
                    <div style={{fontSize:"11px",color:"#9a9a9a",fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{m.mensaje||m.texto||"..."}</div>
                  </div>
                  <div style={{fontSize:"10px",color:"#bbb",flexShrink:0}}>{new Date(m.created_at).toLocaleDateString("es-AR")}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ══ PROMOTORES ══════════════════════════════════════════════════════ */}
        {!loading && tab==="promotores" && (
          <>
            <div style={S.card}>
              <div style={S.sect}>💳 Liquidaciones pendientes</div>
              {liqs.filter((l:any)=>l.estado==="pendiente").length===0 && <div style={{fontSize:"13px",color:"#9a9a9a",fontWeight:600}}>No hay liquidaciones pendientes.</div>}
              {liqs.filter((l:any)=>l.estado==="pendiente").map((l:any)=>(
                <div key={l.id} style={S.row}>
                  <div style={{flex:1}}>
                    <div style={{fontSize:"13px",fontWeight:800}}>{l.usuarios?.nombre_usuario} ({l.usuarios?.codigo})</div>
                    <div style={{fontSize:"11px",color:"#9a9a9a",fontWeight:600}}>{l.usuarios?.email}</div>
                  </div>
                  <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"18px",color:"#27ae60"}}>${l.monto?.toLocaleString("es-AR")}</div>
                  <div style={{display:"flex",gap:"6px"}}>
                    <button onClick={async()=>{await supabase.from("liquidaciones_promotor").update({estado:"aprobada"}).eq("id",l.id);setLiqs(p=>p.map(x=>x.id===l.id?{...x,estado:"aprobada"}:x));showToast("✅ Aprobada");}} style={S.btn("#27ae60")}>✅</button>
                    <button onClick={async()=>{await supabase.from("liquidaciones_promotor").update({estado:"rechazada"}).eq("id",l.id);setLiqs(p=>p.map(x=>x.id===l.id?{...x,estado:"rechazada"}:x));showToast("Rechazada");}} style={S.btn("#e74c3c")}>✕</button>
                  </div>
                </div>
              ))}
            </div>
            <div style={S.card}>
              <div style={S.sect}>🏆 Ranking promotores</div>
              {usuarios.filter(u=>u.es_promotor).sort((a:any,b:any)=>(b.bits_promotor||0)-(a.bits_promotor||0)).slice(0,10).map((u:any,i:number)=>(
                <div key={u.id} style={S.row}>
                  <span style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"22px",color:"#d4a017",width:"30px"}}>{i+1}</span>
                  <div style={{flex:1}}>
                    <div style={{fontSize:"13px",fontWeight:800}}>{u.nombre_usuario}</div>
                    <div style={{fontSize:"11px",color:"#9a9a9a",fontWeight:600}}>{u.codigo}</div>
                  </div>
                  <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"18px",color:"#d4a017"}}>{(u.bits_promotor||0).toLocaleString()} BIT</div>
                </div>
              ))}
            </div>
            <div style={S.card}>
              <div style={S.sect}>💰 Últimas comisiones</div>
              {comisiones.slice(0,20).map((c:any)=>(
                <div key={c.id} style={S.row}>
                  <div style={{flex:1}}>
                    <div style={{fontSize:"12px",fontWeight:800}}>{c.promotor?.nombre_usuario} ← {c.origen?.nombre_usuario}</div>
                    <div style={{fontSize:"11px",color:"#9a9a9a",fontWeight:600}}>{c.concepto}</div>
                  </div>
                  <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"16px",color:"#27ae60"}}>+{c.monto} BIT</div>
                </div>
              ))}
            </div>
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
            {/* ── RUBROS Y SUBRUBROS ── */}
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
                        <ItemRow key={s.id}
                          label={s.nombre}
                          onEdit={()=>setModalSubrubro({...s,rubro_id:r.id})}
                          onDelete={()=>eliminarSubrubro(s.id,r.id)}
                        />
                      ))}
                      {(r.subrubros||[]).length===0 && <div style={{fontSize:"12px",color:"#bbb",fontWeight:600,padding:"8px 0"}}>Sin subrubros todavía</div>}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* ── CATEGORÍAS DE GRUPOS ── */}
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
                        <ItemRow key={s.id}
                          label={s.nombre}
                          badge={!s.activo?<span style={S.badge("#fff","#e74c3c")}>OFF</span>:undefined}
                          onEdit={()=>setModalGrupoSubcat({...s})}
                          onDelete={()=>eliminarGrupoSubcat(s.id)}
                        />
                      ))}
                      {grupoSubcats.filter(s=>s.categoria_id===c.id).length===0 && <div style={{fontSize:"12px",color:"#bbb",fontWeight:600,padding:"8px 0"}}>Sin subcategorías todavía</div>}
                    </div>
                  )}
                </div>
              ))}
            </div>

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
      {/* ══ MODAL RESET CONTRASEÑA ══════════════════════════════════════════════ */}
      {modalPassword && (
        <Modal titulo={`🔑 Restablecer contraseña`} onClose={()=>setModalPassword(null)}>
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
