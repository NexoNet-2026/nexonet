"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import { supabase } from "@/lib/supabase";

const IS: React.CSSProperties = { width:"100%",border:"2px solid #e8e8e6",borderRadius:"12px",padding:"12px 14px",fontSize:"14px",fontFamily:"'Nunito',sans-serif",color:"#1a2a3a",outline:"none",boxSizing:"border-box",background:"#fff" };
const BTN = (bg:string,c="#fff") => ({background:bg,border:"none",borderRadius:"10px",padding:"8px 14px",fontSize:"12px",fontWeight:900 as const,color:c,cursor:"pointer",fontFamily:"'Nunito',sans-serif"});

export default function UsuariosInternosPage() {
  const router = useRouter();
  const [perfil, setPerfil] = useState<any>(null);
  const [bots, setBots] = useState<any[]>([]);
  const [stats, setStats] = useState<{totalBits:number;totalAnuncios:number;totalNexos:number}>({totalBits:0,totalAnuncios:0,totalNexos:0});
  const [loading, setLoading] = useState(true);

  // Modals
  const [showCrear, setShowCrear] = useState(false);
  const [showBits, setShowBits] = useState<any>(null);
  const [showEditar, setShowEditar] = useState<any>(null);
  const [credenciales, setCredenciales] = useState<{email:string;pass:string}|null>(null);

  // Formularios
  const [nuevo, setNuevo] = useState({nombre_usuario:"",nombre:"",email:"",ciudad:"",provincia:"",avatar_url:"",bits_free:"10000",descripcion:""});
  const [bitsCantidad, setBitsCantidad] = useState("");
  const [bitsMotivo, setBitsMotivo] = useState("");
  const [guardando, setGuardando] = useState(false);

  const cargar = async () => {
    const {data:{session}} = await supabase.auth.getSession();
    if (!session) { router.push("/admin/login"); return; }
    const {data:p} = await supabase.from("usuarios").select("*").eq("id",session.user.id).single();
    if (!p?.es_admin) { router.push("/"); return; }
    setPerfil(p);

    const {data:usuarios} = await supabase.from("usuarios").select("*").or("is_interno.eq.true,es_bot.eq.true").order("created_at",{ascending:false});
    const botIds = (usuarios||[]).map(u=>u.id);

    // Contar anuncios y nexos por bot
    let anunciosCounts: Record<string,number> = {};
    let nexosCounts: Record<string,number> = {};
    if (botIds.length > 0) {
      const {data:anuncios} = await supabase.from("anuncios").select("usuario_id").in("usuario_id",botIds);
      (anuncios||[]).forEach(a => { anunciosCounts[a.usuario_id] = (anunciosCounts[a.usuario_id]||0)+1; });
      const {data:nexos} = await supabase.from("nexos").select("usuario_id").in("usuario_id",botIds);
      (nexos||[]).forEach(n => { nexosCounts[n.usuario_id] = (nexosCounts[n.usuario_id]||0)+1; });
    }

    const enriquecidos = (usuarios||[]).map(u => ({
      ...u,
      _anuncios: anunciosCounts[u.id]||0,
      _nexos: nexosCounts[u.id]||0,
    }));
    setBots(enriquecidos);

    const totalBits = enriquecidos.reduce((s,u)=>s+(u.bits_free_asignados_total||0),0);
    const totalAnuncios = enriquecidos.reduce((s,u)=>s+u._anuncios,0);
    const totalNexos = enriquecidos.reduce((s,u)=>s+u._nexos,0);
    setStats({totalBits,totalAnuncios,totalNexos});
    setLoading(false);
  };

  useEffect(() => { cargar(); }, []);

  const crearBot = async () => {
    if (!nuevo.nombre_usuario||!nuevo.nombre) { alert("Completá nombre de usuario y nombre visible"); return; }
    setGuardando(true);
    const email = nuevo.email || `${nuevo.nombre_usuario.toLowerCase().replace(/[^a-z0-9]/g,"_")}@interno.nexonet.ar`;
    const pass = "NX" + Math.random().toString(36).slice(2,10) + "!";
    const bitsIniciales = parseInt(nuevo.bits_free) || 10000;

    const { data, error } = await supabase.auth.signUp({ email, password:pass });
    if (error||!data.user) { alert("Error: "+(error?.message||"No se pudo crear")); setGuardando(false); return; }

    const { data:cod } = await supabase.rpc("generar_codigo_usuario");
    await supabase.from("usuarios").insert({
      id:data.user.id, email, nombre_usuario:nuevo.nombre_usuario, nombre:nuevo.nombre,
      codigo:cod, bits_free:bitsIniciales, bits_free_fecha:new Date().toISOString(),
      bits_free_asignados_total:bitsIniciales,
      ciudad:nuevo.ciudad||null, provincia:nuevo.provincia||null,
      avatar_url:nuevo.avatar_url||null, is_interno:true, es_bot:true,
    });

    // Log
    await supabase.from("log_bits_internos").insert({
      usuario_id:data.user.id, cantidad:bitsIniciales,
      motivo:nuevo.descripcion||"Creación de usuario interno",
      asignado_por:perfil.id,
    });

    setCredenciales({email,pass});
    setGuardando(false);
    setShowCrear(false);
    setNuevo({nombre_usuario:"",nombre:"",email:"",ciudad:"",provincia:"",avatar_url:"",bits_free:"10000",descripcion:""});
    await cargar();
  };

  const asignarBits = async () => {
    const cant = parseInt(bitsCantidad);
    if (!cant||cant<=0||!showBits) { alert("Cantidad inválida"); return; }
    setGuardando(true);
    await supabase.from("usuarios").update({
      bits_free: (showBits.bits_free||0)+cant,
      bits_free_asignados_total: (showBits.bits_free_asignados_total||0)+cant,
    }).eq("id",showBits.id);
    await supabase.from("log_bits_internos").insert({
      usuario_id:showBits.id, cantidad:cant,
      motivo:bitsMotivo||"Asignación de BIT Free",
      asignado_por:perfil.id,
    });
    setGuardando(false);
    setShowBits(null); setBitsCantidad(""); setBitsMotivo("");
    await cargar();
  };

  const guardarEdicion = async () => {
    if (!showEditar) return;
    setGuardando(true);
    await supabase.from("usuarios").update({
      nombre_usuario:showEditar.nombre_usuario, nombre:showEditar.nombre,
      ciudad:showEditar.ciudad||null, provincia:showEditar.provincia||null,
      avatar_url:showEditar.avatar_url||null,
    }).eq("id",showEditar.id);
    setGuardando(false); setShowEditar(null);
    await cargar();
  };

  const eliminarBot = async (id:string,nombre:string) => {
    if (!confirm(`¿Eliminar bot "${nombre}"? Se borrarán todos sus anuncios y nexos.`)) return;
    await supabase.from("anuncios").delete().eq("usuario_id",id);
    await supabase.from("nexos").delete().eq("usuario_id",id);
    await supabase.from("usuarios").delete().eq("id",id);
    await cargar();
  };

  if (loading) return <main style={{paddingTop:"95px",minHeight:"100vh",background:"#f4f4f2",fontFamily:"'Nunito',sans-serif"}}><Header/><div style={{textAlign:"center",padding:"40px",color:"#9a9a9a",fontWeight:700}}>Cargando...</div></main>;

  return (
    <main style={{paddingTop:"95px",paddingBottom:"130px",background:"#f4f4f2",minHeight:"100vh",fontFamily:"'Nunito',sans-serif"}}>
      <Header/>
      <div style={{padding:"16px",maxWidth:"700px",margin:"0 auto"}}>
        <button onClick={()=>router.push("/admin")} style={{background:"rgba(26,42,58,0.08)",border:"1px solid rgba(26,42,58,0.2)",borderRadius:"10px",padding:"7px 13px",color:"#1a2a3a",fontSize:"13px",fontWeight:700,cursor:"pointer",fontFamily:"'Nunito',sans-serif",marginBottom:"14px"}}>← Panel admin</button>

        {/* Header */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"16px"}}>
          <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"24px",color:"#1a2a3a",letterSpacing:"1px"}}>🤖 Usuarios Internos</div>
          <button onClick={()=>setShowCrear(true)} style={BTN("linear-gradient(135deg,#8e44ad,#6c3483)")}>➕ Nuevo bot</button>
        </div>

        {/* Credenciales recién creadas */}
        {credenciales && (
          <div style={{background:"rgba(39,174,96,0.08)",border:"2px solid rgba(39,174,96,0.3)",borderRadius:"14px",padding:"16px",marginBottom:"16px"}}>
            <div style={{fontSize:"13px",fontWeight:900,color:"#27ae60",marginBottom:"8px"}}>✅ Usuario creado — Guardá estas credenciales</div>
            <div style={{fontSize:"13px",fontWeight:700,color:"#1a2a3a"}}>📧 Email: <strong>{credenciales.email}</strong></div>
            <div style={{fontSize:"13px",fontWeight:700,color:"#1a2a3a"}}>🔑 Contraseña: <strong>{credenciales.pass}</strong></div>
            <button onClick={()=>{navigator.clipboard.writeText(`${credenciales.email} / ${credenciales.pass}`);}} style={{...BTN("#3a7bd5"),marginTop:"8px",fontSize:"11px"}}>📋 Copiar</button>
            <button onClick={()=>setCredenciales(null)} style={{...BTN("rgba(0,0,0,0.1)","#666"),marginTop:"8px",marginLeft:"6px",fontSize:"11px"}}>✕ Cerrar</button>
          </div>
        )}

        {/* Resumen */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"8px",marginBottom:"16px"}}>
          <div style={{background:"#fff",borderRadius:"12px",padding:"12px",textAlign:"center",boxShadow:"0 2px 8px rgba(0,0,0,0.05)"}}>
            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"24px",color:"#8e44ad"}}>{bots.length}</div>
            <div style={{fontSize:"9px",fontWeight:800,color:"#9a9a9a",textTransform:"uppercase"}}>Bots</div>
          </div>
          <div style={{background:"#fff",borderRadius:"12px",padding:"12px",textAlign:"center",boxShadow:"0 2px 8px rgba(0,0,0,0.05)"}}>
            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"24px",color:"#d4a017"}}>{stats.totalBits.toLocaleString()}</div>
            <div style={{fontSize:"9px",fontWeight:800,color:"#9a9a9a",textTransform:"uppercase"}}>BIT asignados</div>
          </div>
          <div style={{background:"#fff",borderRadius:"12px",padding:"12px",textAlign:"center",boxShadow:"0 2px 8px rgba(0,0,0,0.05)"}}>
            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"24px",color:"#3a7bd5"}}>{stats.totalAnuncios}</div>
            <div style={{fontSize:"9px",fontWeight:800,color:"#9a9a9a",textTransform:"uppercase"}}>Anuncios</div>
          </div>
          <div style={{background:"#fff",borderRadius:"12px",padding:"12px",textAlign:"center",boxShadow:"0 2px 8px rgba(0,0,0,0.05)"}}>
            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"24px",color:"#27ae60"}}>{stats.totalAnuncios>0?Math.round(stats.totalBits/stats.totalAnuncios):0}</div>
            <div style={{fontSize:"9px",fontWeight:800,color:"#9a9a9a",textTransform:"uppercase"}}>BIT/anuncio</div>
          </div>
        </div>

        {/* Lista */}
        <div style={{background:"#fff",borderRadius:"16px",padding:"16px",boxShadow:"0 2px 10px rgba(0,0,0,0.06)"}}>
          {bots.length===0 && <div style={{textAlign:"center",color:"#9a9a9a",fontWeight:700,padding:"20px"}}>No hay usuarios internos todavía</div>}
          {bots.map(b=>(
            <div key={b.id} style={{display:"flex",alignItems:"center",gap:"12px",padding:"12px 0",borderBottom:"1px solid #f4f4f2"}}>
              <div style={{width:"40px",height:"40px",borderRadius:"50%",background:"linear-gradient(135deg,#8e44ad,#6c3483)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"18px",flexShrink:0,overflow:"hidden"}}>
                {b.avatar_url ? <img src={b.avatar_url} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/> : "🤖"}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:"14px",fontWeight:900,color:"#1a2a3a",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{b.nombre_usuario}</div>
                <div style={{fontSize:"11px",color:"#9a9a9a",fontWeight:600}}>{b.nombre} · {b.ciudad||"—"}, {b.provincia||"—"}</div>
                <div style={{display:"flex",gap:"8px",marginTop:"2px",flexWrap:"wrap"}}>
                  <span style={{fontSize:"10px",fontWeight:800,color:"#d4a017"}}>🪙 {(b.bits_free||0).toLocaleString()} BIT</span>
                  <span style={{fontSize:"10px",fontWeight:800,color:"#9a9a9a"}}>📊 Total: {(b.bits_free_asignados_total||0).toLocaleString()}</span>
                  <span style={{fontSize:"10px",fontWeight:800,color:"#3a7bd5"}}>📋 {b._anuncios} anuncios</span>
                  <span style={{fontSize:"10px",fontWeight:800,color:"#27ae60"}}>🏢 {b._nexos} nexos</span>
                </div>
              </div>
              <div style={{display:"flex",gap:"4px",flexShrink:0}}>
                <button onClick={()=>setShowEditar({...b})} style={{...BTN("rgba(58,123,213,0.1)","#3a7bd5"),padding:"5px 8px",fontSize:"11px"}}>✏️</button>
                <button onClick={()=>setShowBits(b)} style={{...BTN("rgba(212,160,23,0.1)","#d4a017"),padding:"5px 8px",fontSize:"11px"}}>💰</button>
                <button onClick={()=>eliminarBot(b.id,b.nombre_usuario)} style={{...BTN("rgba(231,76,60,0.1)","#e74c3c"),padding:"5px 8px",fontSize:"11px"}}>🗑️</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ══ MODAL CREAR ══ */}
      {showCrear && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:"16px"}} onClick={()=>setShowCrear(false)}>
          <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:"16px",padding:"24px",maxWidth:"450px",width:"100%",maxHeight:"80vh",overflow:"auto"}}>
            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"20px",color:"#1a2a3a",marginBottom:"16px"}}>🤖 Nuevo usuario interno</div>
            <div style={{fontSize:"10px",fontWeight:800,color:"#9a9a9a",textTransform:"uppercase",marginBottom:"4px"}}>Nombre de usuario *</div>
            <input style={{...IS,marginBottom:"10px"}} placeholder="mercadolibre_rosario" value={nuevo.nombre_usuario} onChange={e=>setNuevo({...nuevo,nombre_usuario:e.target.value})} />
            <div style={{fontSize:"10px",fontWeight:800,color:"#9a9a9a",textTransform:"uppercase",marginBottom:"4px"}}>Nombre visible *</div>
            <input style={{...IS,marginBottom:"10px"}} placeholder="MercadoLibre Rosario" value={nuevo.nombre} onChange={e=>setNuevo({...nuevo,nombre:e.target.value})} />
            <div style={{fontSize:"10px",fontWeight:800,color:"#9a9a9a",textTransform:"uppercase",marginBottom:"4px"}}>Email (auto si vacío)</div>
            <input style={{...IS,marginBottom:"10px"}} placeholder="auto@interno.nexonet.ar" value={nuevo.email} onChange={e=>setNuevo({...nuevo,email:e.target.value})} />
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px",marginBottom:"10px"}}>
              <div>
                <div style={{fontSize:"10px",fontWeight:800,color:"#9a9a9a",textTransform:"uppercase",marginBottom:"4px"}}>Ciudad</div>
                <input style={IS} placeholder="Rosario" value={nuevo.ciudad} onChange={e=>setNuevo({...nuevo,ciudad:e.target.value})} />
              </div>
              <div>
                <div style={{fontSize:"10px",fontWeight:800,color:"#9a9a9a",textTransform:"uppercase",marginBottom:"4px"}}>Provincia</div>
                <input style={IS} placeholder="Santa Fe" value={nuevo.provincia} onChange={e=>setNuevo({...nuevo,provincia:e.target.value})} />
              </div>
            </div>
            <div style={{fontSize:"10px",fontWeight:800,color:"#9a9a9a",textTransform:"uppercase",marginBottom:"4px"}}>Avatar URL</div>
            <input style={{...IS,marginBottom:"10px"}} placeholder="https://..." value={nuevo.avatar_url} onChange={e=>setNuevo({...nuevo,avatar_url:e.target.value})} />
            <div style={{fontSize:"10px",fontWeight:800,color:"#9a9a9a",textTransform:"uppercase",marginBottom:"4px"}}>BIT Free iniciales</div>
            <input type="number" style={{...IS,marginBottom:"10px"}} value={nuevo.bits_free} onChange={e=>setNuevo({...nuevo,bits_free:e.target.value})} />
            <div style={{fontSize:"10px",fontWeight:800,color:"#9a9a9a",textTransform:"uppercase",marginBottom:"4px"}}>Propósito / descripción</div>
            <input style={{...IS,marginBottom:"16px"}} placeholder="Anuncios de autos usados Rosario" value={nuevo.descripcion} onChange={e=>setNuevo({...nuevo,descripcion:e.target.value})} />
            <button onClick={crearBot} disabled={guardando||!nuevo.nombre_usuario||!nuevo.nombre} style={{...BTN("linear-gradient(135deg,#8e44ad,#6c3483)"),width:"100%",padding:"14px",fontSize:"14px",opacity:guardando?0.6:1}}>
              {guardando?"⏳ Creando...":"🤖 Crear usuario interno"}
            </button>
          </div>
        </div>
      )}

      {/* ══ MODAL ASIGNAR BIT ══ */}
      {showBits && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:"16px"}} onClick={()=>setShowBits(null)}>
          <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:"16px",padding:"24px",maxWidth:"400px",width:"100%"}}>
            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"20px",color:"#1a2a3a",marginBottom:"6px"}}>💰 Asignar BIT Free</div>
            <div style={{fontSize:"12px",color:"#9a9a9a",fontWeight:700,marginBottom:"16px"}}>A: {showBits.nombre_usuario} — Saldo actual: {(showBits.bits_free||0).toLocaleString()} BIT</div>
            <div style={{fontSize:"10px",fontWeight:800,color:"#9a9a9a",textTransform:"uppercase",marginBottom:"4px"}}>Cantidad *</div>
            <input type="number" style={{...IS,marginBottom:"10px"}} placeholder="10000" value={bitsCantidad} onChange={e=>setBitsCantidad(e.target.value)} />
            <div style={{fontSize:"10px",fontWeight:800,color:"#9a9a9a",textTransform:"uppercase",marginBottom:"4px"}}>Motivo</div>
            <input style={{...IS,marginBottom:"16px"}} placeholder="Carga de anuncios sector autos" value={bitsMotivo} onChange={e=>setBitsMotivo(e.target.value)} />
            <button onClick={asignarBits} disabled={guardando||!bitsCantidad} style={{...BTN("linear-gradient(135deg,#d4a017,#e67e22)"),width:"100%",padding:"14px",fontSize:"14px",opacity:guardando?0.6:1}}>
              {guardando?"⏳...":"💰 Asignar "+bitsCantidad+" BIT Free"}
            </button>
          </div>
        </div>
      )}

      {/* ══ MODAL EDITAR ══ */}
      {showEditar && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:"16px"}} onClick={()=>setShowEditar(null)}>
          <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:"16px",padding:"24px",maxWidth:"400px",width:"100%"}}>
            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"20px",color:"#1a2a3a",marginBottom:"16px"}}>✏️ Editar bot</div>
            <div style={{fontSize:"10px",fontWeight:800,color:"#9a9a9a",textTransform:"uppercase",marginBottom:"4px"}}>Nombre de usuario</div>
            <input style={{...IS,marginBottom:"10px"}} value={showEditar.nombre_usuario||""} onChange={e=>setShowEditar({...showEditar,nombre_usuario:e.target.value})} />
            <div style={{fontSize:"10px",fontWeight:800,color:"#9a9a9a",textTransform:"uppercase",marginBottom:"4px"}}>Nombre visible</div>
            <input style={{...IS,marginBottom:"10px"}} value={showEditar.nombre||""} onChange={e=>setShowEditar({...showEditar,nombre:e.target.value})} />
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px",marginBottom:"10px"}}>
              <div>
                <div style={{fontSize:"10px",fontWeight:800,color:"#9a9a9a",textTransform:"uppercase",marginBottom:"4px"}}>Ciudad</div>
                <input style={IS} value={showEditar.ciudad||""} onChange={e=>setShowEditar({...showEditar,ciudad:e.target.value})} />
              </div>
              <div>
                <div style={{fontSize:"10px",fontWeight:800,color:"#9a9a9a",textTransform:"uppercase",marginBottom:"4px"}}>Provincia</div>
                <input style={IS} value={showEditar.provincia||""} onChange={e=>setShowEditar({...showEditar,provincia:e.target.value})} />
              </div>
            </div>
            <div style={{fontSize:"10px",fontWeight:800,color:"#9a9a9a",textTransform:"uppercase",marginBottom:"4px"}}>Avatar URL</div>
            <input style={{...IS,marginBottom:"16px"}} value={showEditar.avatar_url||""} onChange={e=>setShowEditar({...showEditar,avatar_url:e.target.value})} />
            <button onClick={guardarEdicion} disabled={guardando} style={{...BTN("#3a7bd5"),width:"100%",padding:"14px",fontSize:"14px",opacity:guardando?0.6:1}}>
              {guardando?"⏳...":"💾 Guardar cambios"}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
