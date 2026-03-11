"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/lib/supabase";

type Categoria    = { id:number; nombre:string; emoji:string; descripcion:string; orden:number; activo:boolean; subcats_count?:number };
type Subcategoria = { id:number; nombre:string; emoji:string; orden:number; activo:boolean; categoria_id:number };

const ADMIN_IDS = ["00000000-0000-0000-0000-000000000001"]; // reemplazar con tus IDs admin reales

export default function AdminGrupos() {
  const router = useRouter();
  const [session,       setSession]       = useState<any>(null);
  const [autorizado,    setAutorizado]    = useState(false);
  const [categorias,    setCategorias]    = useState<Categoria[]>([]);
  const [subcategorias, setSubcategorias] = useState<Subcategoria[]>([]);
  const [tab,           setTab]           = useState<"cats"|"subcats"|"grupos">("cats");
  const [catExpand,     setCatExpand]     = useState<number|null>(null);
  const [loading,       setLoading]       = useState(true);
  // Popups
  const [popupCat,      setPopupCat]      = useState(false);
  const [popupSub,      setPopupSub]      = useState(false);
  const [editCat,       setEditCat]       = useState<Categoria|null>(null);
  const [editSub,       setEditSub]       = useState<Subcategoria|null>(null);
  const [catParaSub,    setCatParaSub]    = useState<number|null>(null);
  // Formularios
  const [fCat, setFCat] = useState({ nombre:"", emoji:"👥", descripcion:"", orden:"0" });
  const [fSub, setFSub] = useState({ nombre:"", emoji:"📌", orden:"0", categoria_id:"" });
  const [guardando, setGuardando] = useState(false);
  // Stats grupos
  const [statsGrupos, setStatsGrupos] = useState<any[]>([]);

  useEffect(()=>{
    supabase.auth.getSession().then(({data:{session:s}})=>{
      if(!s){ router.push("/login"); return; }
      setSession(s);
      // Verificar si es admin por email o por código de usuario
      supabase.from("usuarios").select("codigo,plan").eq("id",s.user.id).single()
        .then(({data})=>{
          const esAdmin = data?.codigo==="NXN-00001" || data?.codigo==="NXN-00002" || data?.plan==="nexoempresa";
          if(!esAdmin){ router.push("/"); return; }
          setAutorizado(true);
          cargar();
        });
    });
  },[]);

  const cargar = async()=>{
    setLoading(true);
    const [c,s,g] = await Promise.all([
      supabase.from("grupo_categorias").select("id,nombre,emoji,descripcion,orden,activo").order("orden"),
      supabase.from("grupo_subcategorias").select("id,nombre,emoji,orden,activo,categoria_id").order("orden"),
      supabase.from("grupos").select("id,nombre,tipo,miembros_count,activo,categoria_id,subcategoria_id,grupo_categorias(nombre),grupo_subcategorias(nombre)").order("created_at",{ascending:false}).limit(100),
    ]);
    if(c.data) setCategorias(c.data);
    if(s.data) setSubcategorias(s.data);
    if(g.data) setStatsGrupos(g.data.map((x:any)=>({...x,cat_nombre:x.grupo_categorias?.nombre||"—",sub_nombre:x.grupo_subcategorias?.nombre||"—"})));
    setLoading(false);
  };

  // Abrir popup nueva/editar categoría
  const abrirPopupCat = (cat?:Categoria)=>{
    if(cat){ setEditCat(cat); setFCat({nombre:cat.nombre,emoji:cat.emoji,descripcion:cat.descripcion||"",orden:String(cat.orden)}); }
    else   { setEditCat(null); setFCat({nombre:"",emoji:"👥",descripcion:"",orden:String(categorias.length+1)}); }
    setPopupCat(true);
  };
  const abrirPopupSub = (catId:number, sub?:Subcategoria)=>{
    setCatParaSub(catId);
    if(sub){ setEditSub(sub); setFSub({nombre:sub.nombre,emoji:sub.emoji,orden:String(sub.orden),categoria_id:String(sub.categoria_id)}); }
    else   { setEditSub(null); setFSub({nombre:"",emoji:"📌",orden:String(subcategorias.filter(s=>s.categoria_id===catId).length+1),categoria_id:String(catId)}); }
    setPopupSub(true);
  };

  const guardarCat = async()=>{
    if(!fCat.nombre.trim()) return;
    setGuardando(true);
    const data = { nombre:fCat.nombre, emoji:fCat.emoji, descripcion:fCat.descripcion, orden:parseInt(fCat.orden)||0 };
    if(editCat){
      await supabase.from("grupo_categorias").update(data).eq("id",editCat.id);
      setCategorias(p=>p.map(c=>c.id===editCat.id?{...c,...data}:c));
    } else {
      const {data:d}=await supabase.from("grupo_categorias").insert({...data,activo:true}).select().single();
      if(d) setCategorias(p=>[...p,d]);
    }
    setGuardando(false); setPopupCat(false);
  };

  const guardarSub = async()=>{
    if(!fSub.nombre.trim()) return;
    setGuardando(true);
    const data = { nombre:fSub.nombre, emoji:fSub.emoji, orden:parseInt(fSub.orden)||0, categoria_id:parseInt(fSub.categoria_id)||catParaSub };
    if(editSub){
      await supabase.from("grupo_subcategorias").update(data).eq("id",editSub.id);
      setSubcategorias(p=>p.map(s=>s.id===editSub.id?{...s,...data as any}:s));
    } else {
      const {data:d}=await supabase.from("grupo_subcategorias").insert({...data,activo:true}).select().single();
      if(d) setSubcategorias(p=>[...p,d]);
    }
    setGuardando(false); setPopupSub(false);
  };

  const toggleCat = async(cat:Categoria)=>{
    await supabase.from("grupo_categorias").update({activo:!cat.activo}).eq("id",cat.id);
    setCategorias(p=>p.map(c=>c.id===cat.id?{...c,activo:!c.activo}:c));
  };
  const toggleSub = async(sub:Subcategoria)=>{
    await supabase.from("grupo_subcategorias").update({activo:!sub.activo}).eq("id",sub.id);
    setSubcategorias(p=>p.map(s=>s.id===sub.id?{...s,activo:!s.activo}:s));
  };
  const toggleGrupo = async(g:any)=>{
    await supabase.from("grupos").update({activo:!g.activo}).eq("id",g.id);
    setStatsGrupos(p=>p.map(x=>x.id===g.id?{...x,activo:!x.activo}:x));
  };

  if(!autorizado) return(
    <main style={{paddingTop:"95px",fontFamily:"'Nunito',sans-serif"}}><Header/>
      <div style={{textAlign:"center",padding:"60px 20px"}}>
        <div style={{fontSize:"40px",marginBottom:"12px"}}>🔒</div>
        <div style={{fontSize:"16px",fontWeight:800,color:"#1a2a3a"}}>Acceso restringido</div>
        <div style={{fontSize:"13px",color:"#9a9a9a",marginTop:"6px"}}>Solo administradores de NexoNet</div>
      </div>
    <BottomNav/></main>
  );

  const subcatsTotal = subcategorias.length;
  const gruposActivos = statsGrupos.filter(g=>g.activo).length;

  return(
    <main style={{paddingTop:"95px",paddingBottom:"130px",background:"#f4f4f2",minHeight:"100vh",fontFamily:"'Nunito',sans-serif"}}>
      <Header/>

      {/* Header */}
      <div style={{background:"linear-gradient(135deg,#1a2a3a,#243b55)",padding:"16px"}}>
        <div style={{fontSize:"10px",fontWeight:700,color:"#d4a017",letterSpacing:"2px",textTransform:"uppercase",marginBottom:"4px"}}>Panel Admin</div>
        <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"24px",color:"#fff",letterSpacing:"1px",marginBottom:"14px"}}>🛡️ Gestión de Grupos</div>
        {/* Stats rápidas */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"8px"}}>
          {[{l:"Categorías",v:categorias.length,c:"#d4a017"},{l:"Subcategorías",v:subcatsTotal,c:"#f0c040"},{l:"Grupos activos",v:gruposActivos,c:"#00a884"}]
            .map((s,i)=><div key={i} style={{background:"rgba(255,255,255,0.07)",borderRadius:"12px",padding:"10px",textAlign:"center"}}><div style={{fontSize:"20px",fontWeight:900,color:s.c}}>{s.v}</div><div style={{fontSize:"10px",fontWeight:700,color:"#8a9aaa"}}>{s.l}</div></div>)}
        </div>
      </div>

      {/* Tabs */}
      <div style={{background:"#fff",borderBottom:"2px solid #f0f0f0",display:"flex"}}>
        {[{id:"cats",l:"📂 Categorías"},{id:"subcats",l:"📌 Subcategorías"},{id:"grupos",l:"👥 Grupos"}].map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id as any)} style={{flex:1,padding:"12px",border:"none",background:"none",fontSize:"12px",fontWeight:tab===t.id?900:600,color:tab===t.id?"#d4a017":"#2c2c2e",borderBottom:tab===t.id?"3px solid #d4a017":"3px solid transparent",cursor:"pointer",fontFamily:"'Nunito',sans-serif"}}>
            {t.l}
          </button>
        ))}
      </div>

      <div style={{padding:"16px"}}>

        {/* ── CATEGORÍAS ── */}
        {tab==="cats"&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"12px"}}>
              <span style={{fontSize:"15px",fontWeight:900,color:"#1a2a3a"}}>Categorías de grupos</span>
              <button onClick={()=>abrirPopupCat()} style={btnStyle}>➕ Nueva</button>
            </div>
            {loading?<Loader/>:categorias.map(cat=>{
              const subs=subcategorias.filter(s=>s.categoria_id===cat.id);
              const exp=catExpand===cat.id;
              return(
                <div key={cat.id} style={{background:"#fff",borderRadius:"14px",boxShadow:"0 2px 8px rgba(0,0,0,0.06)",marginBottom:"10px",overflow:"hidden",border:`2px solid ${cat.activo?"#e8e8e6":"#f0c040"}`}}>
                  <div style={{padding:"14px 16px",display:"flex",alignItems:"center",gap:"12px"}}>
                    <span style={{fontSize:"28px"}}>{cat.emoji}</span>
                    <div style={{flex:1}}>
                      <div style={{fontSize:"15px",fontWeight:900,color:cat.activo?"#1a2a3a":"#9a9a9a"}}>{cat.nombre}</div>
                      <div style={{fontSize:"11px",color:"#9a9a9a",fontWeight:600}}>{subs.length} subcategorías · orden {cat.orden}</div>
                    </div>
                    <div style={{display:"flex",gap:"6px",alignItems:"center"}}>
                      <button onClick={()=>toggleCat(cat)} style={{background:cat.activo?"rgba(0,168,132,0.1)":"rgba(230,57,70,0.1)",border:`2px solid ${cat.activo?"#00a884":"#e63946"}`,borderRadius:"8px",padding:"4px 10px",fontSize:"11px",fontWeight:800,color:cat.activo?"#00a884":"#e63946",cursor:"pointer",fontFamily:"'Nunito',sans-serif"}}>
                        {cat.activo?"ON":"OFF"}
                      </button>
                      <button onClick={()=>abrirPopupCat(cat)} style={{background:"#f4f4f2",border:"2px solid #e8e8e6",borderRadius:"8px",padding:"4px 10px",fontSize:"11px",fontWeight:800,color:"#1a2a3a",cursor:"pointer",fontFamily:"'Nunito',sans-serif"}}>✏️</button>
                      <button onClick={()=>setCatExpand(exp?null:cat.id)} style={{background:"#f4f4f2",border:"2px solid #e8e8e6",borderRadius:"8px",padding:"4px 10px",fontSize:"11px",fontWeight:800,color:"#1a2a3a",cursor:"pointer",fontFamily:"'Nunito',sans-serif"}}>{exp?"▲":"▼"}</button>
                    </div>
                  </div>
                  {/* Subcategorías inline */}
                  {exp&&(
                    <div style={{borderTop:"1px solid #f5f5f5",background:"#fafafa",padding:"10px 16px"}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"8px"}}>
                        <span style={{fontSize:"11px",fontWeight:800,color:"#9a9a9a",textTransform:"uppercase",letterSpacing:"0.5px"}}>Subcategorías</span>
                        <button onClick={()=>abrirPopupSub(cat.id)} style={{...btnStyle,fontSize:"11px",padding:"4px 12px"}}>➕ Agregar</button>
                      </div>
                      {subs.length===0?<div style={{fontSize:"12px",color:"#bbb",padding:"8px 0"}}>Sin subcategorías aún.</div>:
                        subs.map(s=>(
                          <div key={s.id} style={{display:"flex",alignItems:"center",gap:"8px",padding:"7px 0",borderBottom:"1px solid #f0f0f0"}}>
                            <span style={{fontSize:"16px"}}>{s.emoji}</span>
                            <div style={{flex:1}}>
                              <span style={{fontSize:"13px",fontWeight:800,color:s.activo?"#1a2a3a":"#9a9a9a"}}>{s.nombre}</span>
                              <span style={{fontSize:"10px",color:"#bbb",marginLeft:"6px"}}>orden {s.orden}</span>
                            </div>
                            <button onClick={()=>toggleSub(s)} style={{background:s.activo?"rgba(0,168,132,0.1)":"rgba(230,57,70,0.1)",border:`1px solid ${s.activo?"#00a884":"#e63946"}`,borderRadius:"6px",padding:"2px 8px",fontSize:"10px",fontWeight:800,color:s.activo?"#00a884":"#e63946",cursor:"pointer",fontFamily:"'Nunito',sans-serif"}}>
                              {s.activo?"ON":"OFF"}
                            </button>
                            <button onClick={()=>abrirPopupSub(cat.id,s)} style={{background:"#f0f0f0",border:"none",borderRadius:"6px",padding:"2px 8px",fontSize:"10px",fontWeight:800,color:"#1a2a3a",cursor:"pointer",fontFamily:"'Nunito',sans-serif"}}>✏️</button>
                          </div>
                        ))
                      }
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── SUBCATEGORÍAS (vista completa) ── */}
        {tab==="subcats"&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"12px"}}>
              <span style={{fontSize:"15px",fontWeight:900,color:"#1a2a3a"}}>Todas las subcategorías</span>
              <span style={{fontSize:"12px",fontWeight:700,color:"#9a9a9a"}}>{subcategorias.length} total</span>
            </div>
            {loading?<Loader/>:categorias.map(cat=>{
              const subs=subcategorias.filter(s=>s.categoria_id===cat.id);
              if(subs.length===0) return null;
              return(
                <div key={cat.id} style={{marginBottom:"14px"}}>
                  <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"8px",padding:"8px 12px",background:"linear-gradient(135deg,#1a2a3a,#243b55)",borderRadius:"10px"}}>
                    <span style={{fontSize:"18px"}}>{cat.emoji}</span>
                    <span style={{fontSize:"13px",fontWeight:900,color:"#f0c040"}}>{cat.nombre}</span>
                    <span style={{fontSize:"11px",color:"#8a9aaa",fontWeight:600,marginLeft:"auto"}}>{subs.length} subcats</span>
                    <button onClick={()=>abrirPopupSub(cat.id)} style={{background:"rgba(212,160,23,0.2)",border:"1px solid rgba(212,160,23,0.4)",borderRadius:"8px",padding:"3px 10px",fontSize:"11px",fontWeight:800,color:"#d4a017",cursor:"pointer",fontFamily:"'Nunito',sans-serif"}}>➕</button>
                  </div>
                  {subs.map((s,i)=>(
                    <div key={s.id} style={{background:"#fff",borderRadius:"10px",padding:"12px 14px",marginBottom:"6px",boxShadow:"0 1px 4px rgba(0,0,0,0.05)",display:"flex",alignItems:"center",gap:"10px",border:`1px solid ${s.activo?"#f0f0f0":"rgba(240,192,64,0.3)"}`}}>
                      <span style={{fontSize:"20px"}}>{s.emoji}</span>
                      <div style={{flex:1}}>
                        <div style={{fontSize:"13px",fontWeight:800,color:s.activo?"#1a2a3a":"#9a9a9a"}}>{s.nombre}</div>
                        <div style={{fontSize:"10px",color:"#bbb",fontWeight:600}}>orden {s.orden}</div>
                      </div>
                      <button onClick={()=>toggleSub(s)} style={{background:s.activo?"rgba(0,168,132,0.1)":"rgba(230,57,70,0.1)",border:`2px solid ${s.activo?"#00a884":"#e63946"}`,borderRadius:"8px",padding:"4px 10px",fontSize:"11px",fontWeight:800,color:s.activo?"#00a884":"#e63946",cursor:"pointer",fontFamily:"'Nunito',sans-serif"}}>
                        {s.activo?"ON":"OFF"}
                      </button>
                      <button onClick={()=>abrirPopupSub(cat.id,s)} style={{background:"#f4f4f2",border:"2px solid #e8e8e6",borderRadius:"8px",padding:"4px 10px",fontSize:"11px",fontWeight:800,color:"#1a2a3a",cursor:"pointer",fontFamily:"'Nunito',sans-serif"}}>✏️</button>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}

        {/* ── GRUPOS ── */}
        {tab==="grupos"&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"12px"}}>
              <span style={{fontSize:"15px",fontWeight:900,color:"#1a2a3a"}}>Grupos en NexoNet</span>
              <span style={{fontSize:"12px",fontWeight:700,color:"#9a9a9a"}}>{statsGrupos.length} total</span>
            </div>
            {/* Resumen por categoría */}
            <div style={{background:"#fff",borderRadius:"14px",padding:"14px 16px",boxShadow:"0 2px 8px rgba(0,0,0,0.06)",marginBottom:"14px"}}>
              <div style={{fontSize:"11px",fontWeight:800,color:"#9a9a9a",textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:"10px"}}>Por categoría</div>
              {categorias.map(cat=>{
                const n=statsGrupos.filter(g=>g.categoria_id===cat.id&&g.activo).length;
                if(!n) return null;
                return(
                  <div key={cat.id} style={{display:"flex",alignItems:"center",gap:"10px",padding:"6px 0",borderBottom:"1px solid #f5f5f5"}}>
                    <span style={{fontSize:"16px"}}>{cat.emoji}</span>
                    <span style={{flex:1,fontSize:"13px",fontWeight:700,color:"#1a2a3a"}}>{cat.nombre}</span>
                    <span style={{fontSize:"14px",fontWeight:900,color:"#d4a017"}}>{n}</span>
                  </div>
                );
              })}
            </div>
            {loading?<Loader/>:statsGrupos.map(g=>(
              <div key={g.id} style={{background:"#fff",borderRadius:"14px",padding:"14px 16px",boxShadow:"0 2px 6px rgba(0,0,0,0.06)",marginBottom:"8px",display:"flex",alignItems:"center",gap:"10px",border:`2px solid ${g.activo?"#f0f0f0":"rgba(230,57,70,0.2)"}`}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:"14px",fontWeight:900,color:g.activo?"#1a2a3a":"#9a9a9a",marginBottom:"2px"}}>{g.nombre}</div>
                  <div style={{display:"flex",gap:"6px",flexWrap:"wrap"}}>
                    <span style={{fontSize:"10px",fontWeight:700,color:"#9a9a9a"}}>{g.cat_nombre}{g.sub_nombre&&g.sub_nombre!=="—"?` › ${g.sub_nombre}`:""}</span>
                    <span style={{fontSize:"10px",fontWeight:700,color:"#9a9a9a"}}>· {g.tipo==="cerrado"?"🔒":"🔓"} {g.tipo}</span>
                    <span style={{fontSize:"10px",fontWeight:700,color:"#9a9a9a"}}>· 👥 {g.miembros_count}</span>
                  </div>
                </div>
                <button onClick={()=>toggleGrupo(g)} style={{background:g.activo?"rgba(0,168,132,0.1)":"rgba(230,57,70,0.1)",border:`2px solid ${g.activo?"#00a884":"#e63946"}`,borderRadius:"8px",padding:"5px 12px",fontSize:"11px",fontWeight:800,color:g.activo?"#00a884":"#e63946",cursor:"pointer",fontFamily:"'Nunito',sans-serif"}}>
                  {g.activo?"Activo":"Inactivo"}
                </button>
                <a href={`/grupos/${g.id}`} style={{background:"#f4f4f2",border:"2px solid #e8e8e6",borderRadius:"8px",padding:"5px 10px",fontSize:"13px",textDecoration:"none"}}>👁️</a>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── POPUP CATEGORÍA ── */}
      {popupCat&&(
        <Popup titulo={editCat?"✏️ Editar categoría":"➕ Nueva categoría"} onClose={()=>setPopupCat(false)}>
          <div style={{display:"flex",flexDirection:"column",gap:"10px",marginBottom:"16px"}}>
            <div style={{display:"flex",gap:"8px"}}>
              <div style={{width:"70px"}}>
                <div style={labelStyle}>Emoji</div>
                <input value={fCat.emoji} onChange={e=>setFCat(p=>({...p,emoji:e.target.value}))} maxLength={4} style={{...inputStyle,textAlign:"center",fontSize:"22px"}}/>
              </div>
              <div style={{flex:1}}>
                <div style={labelStyle}>Nombre *</div>
                <input value={fCat.nombre} onChange={e=>setFCat(p=>({...p,nombre:e.target.value}))} placeholder="Ej: Deportivos" maxLength={40} style={inputStyle}/>
              </div>
            </div>
            <div>
              <div style={labelStyle}>Descripción</div>
              <input value={fCat.descripcion} onChange={e=>setFCat(p=>({...p,descripcion:e.target.value}))} placeholder="Breve descripción" maxLength={120} style={inputStyle}/>
            </div>
            <div>
              <div style={labelStyle}>Orden (número)</div>
              <input value={fCat.orden} onChange={e=>setFCat(p=>({...p,orden:e.target.value}))} type="number" min="0" style={{...inputStyle,width:"100px"}}/>
            </div>
          </div>
          <button onClick={guardarCat} disabled={guardando||!fCat.nombre.trim()} style={{...btnStyle,width:"100%",padding:"13px",fontSize:"14px"}}>
            {guardando?"Guardando...":editCat?"💾 Guardar cambios":"✅ Crear categoría"}
          </button>
        </Popup>
      )}

      {/* ── POPUP SUBCATEGORÍA ── */}
      {popupSub&&(
        <Popup titulo={editSub?"✏️ Editar subcategoría":"➕ Nueva subcategoría"} onClose={()=>setPopupSub(false)}>
          <div style={{fontSize:"12px",fontWeight:700,color:"#9a9a9a",marginBottom:"12px"}}>
            Categoría: <strong style={{color:"#1a2a3a"}}>{categorias.find(c=>c.id===catParaSub)?.nombre}</strong>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:"10px",marginBottom:"16px"}}>
            <div style={{display:"flex",gap:"8px"}}>
              <div style={{width:"70px"}}>
                <div style={labelStyle}>Emoji</div>
                <input value={fSub.emoji} onChange={e=>setFSub(p=>({...p,emoji:e.target.value}))} maxLength={4} style={{...inputStyle,textAlign:"center",fontSize:"22px"}}/>
              </div>
              <div style={{flex:1}}>
                <div style={labelStyle}>Nombre *</div>
                <input value={fSub.nombre} onChange={e=>setFSub(p=>({...p,nombre:e.target.value}))} placeholder="Ej: Pádel" maxLength={40} style={inputStyle}/>
              </div>
            </div>
            <div>
              <div style={labelStyle}>Orden</div>
              <input value={fSub.orden} onChange={e=>setFSub(p=>({...p,orden:e.target.value}))} type="number" min="0" style={{...inputStyle,width:"100px"}}/>
            </div>
          </div>
          <button onClick={guardarSub} disabled={guardando||!fSub.nombre.trim()} style={{...btnStyle,width:"100%",padding:"13px",fontSize:"14px"}}>
            {guardando?"Guardando...":editSub?"💾 Guardar cambios":"✅ Crear subcategoría"}
          </button>
        </Popup>
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
function Loader() {
  return <div style={{textAlign:"center",padding:"40px",color:"#9a9a9a",fontWeight:700}}>Cargando...</div>;
}
const btnStyle:React.CSSProperties={background:"linear-gradient(135deg,#f0c040,#d4a017)",border:"none",borderRadius:"10px",padding:"7px 16px",fontSize:"12px",fontWeight:900,color:"#1a2a3a",cursor:"pointer",fontFamily:"'Nunito',sans-serif",boxShadow:"0 2px 0 #a07810"};
const inputStyle:React.CSSProperties={border:"2px solid #e8e8e8",borderRadius:"12px",padding:"11px 14px",fontSize:"14px",fontFamily:"'Nunito',sans-serif",outline:"none",color:"#1a2a3a",width:"100%",boxSizing:"border-box",background:"#fff"};
const labelStyle:React.CSSProperties={fontSize:"11px",fontWeight:800,color:"#9a9a9a",textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:"5px"};
