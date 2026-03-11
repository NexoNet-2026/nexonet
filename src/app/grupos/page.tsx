"use client";
import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/lib/supabase";
import PopupAccesoGrupo from "@/components/PopupAccesoGrupo";

type Grupo = {
  id: number; nombre: string; descripcion: string; imagen: string;
  tipo: "abierto"|"cerrado"; miembros_count: number;
  categoria_id: number; subcategoria_id: number;
  categoria_nombre: string; subcategoria_nombre: string;
  whatsapp_link: string; creador_id: string;
};
type Categoria    = { id: number; nombre: string; emoji: string };
type Subcategoria = { id: number; nombre: string; emoji: string; categoria_id: number };

export default function Grupos() {
  return (
    <Suspense fallback={<div style={{ paddingTop:"95px", textAlign:"center", padding:"60px", color:"#9a9a9a", fontWeight:700 }}>Cargando...</div>}>
      <GruposInner />
    </Suspense>
  );
}

function GruposInner() {
  const sp     = useSearchParams();
  const router = useRouter();

  const [categorias,    setCategorias]    = useState<Categoria[]>([]);
  const [subcategorias, setSubcategorias] = useState<Subcategoria[]>([]);
  const [grupos,        setGrupos]        = useState<Grupo[]>([]);
  const [loading,       setLoading]       = useState(true);

  const [query,     setQuery]     = useState("");
  const [catSel,    setCatSel]    = useState<Categoria|null>(null);
  const [subSel,    setSubSel]    = useState<Subcategoria|null>(null);
  const [dropOpen,  setDropOpen]  = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropRef  = useRef<HTMLDivElement>(null);
  const [subActivo, setSubActivo] = useState<Record<number,number|null>>({});

  const [session,   setSession]   = useState<any>(null);
  const [misGrupos, setMisGrupos] = useState<Set<number>>(new Set());
  const [grupoPopup, setGrupoPopup] = useState<Grupo|null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      if (s) {
        supabase.from("grupo_miembros").select("grupo_id").eq("usuario_id", s.user.id).eq("estado","activo")
          .then(({ data }) => { if (data) setMisGrupos(new Set(data.map((x:any)=>x.grupo_id))); });
      }
    });

    const cat = sp.get("cat"); const sub = sp.get("sub");

    Promise.all([
      supabase.from("grupo_categorias").select("id,nombre,emoji").eq("activo",true).order("orden"),
      supabase.from("grupo_subcategorias").select("id,nombre,emoji,categoria_id").eq("activo",true).order("orden"),
      supabase.from("grupos")
        .select("id,nombre,descripcion,imagen,tipo,miembros_count,categoria_id,subcategoria_id,whatsapp_link,creador_id,grupo_categorias(nombre,emoji),grupo_subcategorias(nombre,emoji)")
        .eq("activo",true).order("miembros_count",{ascending:false}).limit(300),
    ]).then(([{data:cData},{data:sData},{data:gData}]) => {
      const cats = cData || [];
      const subs = sData || [];
      setCategorias(cats);
      setSubcategorias(subs);
      if (gData) setGrupos(gData.map((g:any)=>({
        ...g,
        categoria_nombre:    (g.grupo_categorias?.nombre  || ""),
        subcategoria_nombre: (g.grupo_subcategorias?.nombre || ""),
      })));
      if (cat) { const c = cats.find((x:any)=>x.id===parseInt(cat)); if(c){setCatSel(c);setQuery(c.nombre);} }
      if (sub) { const s = subs.find((x:any)=>x.id===parseInt(sub)); if(s){setSubSel(s);setQuery(s.nombre);} }
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    const h=(e:MouseEvent)=>{
      if(dropRef.current&&!dropRef.current.contains(e.target as Node)&&
         inputRef.current&&!inputRef.current.contains(e.target as Node)) setDropOpen(false);
    };
    document.addEventListener("mousedown",h); return()=>document.removeEventListener("mousedown",h);
  },[]);

  const qLow     = query.toLowerCase();
  const catFilt  = categorias.filter(c=>c.nombre.toLowerCase().includes(qLow));
  const subFilt  = subcategorias.filter(s=>s.nombre.toLowerCase().includes(qLow));
  const subDeCat = catSel ? subcategorias.filter(s=>s.categoria_id===catSel.id) : [];

  const limpQ = ()=>{ setQuery(""); setCatSel(null); setSubSel(null); setDropOpen(false); };
  const selCat = (c:Categoria)=>{ setCatSel(c); setSubSel(null); setQuery(c.nombre); setDropOpen(false); };
  const selSub = (s:Subcategoria)=>{ setCatSel(categorias.find(c=>c.id===s.categoria_id)||null); setSubSel(s); setQuery(s.nombre); setDropOpen(false); };
  const togSub = (catId:number,subId:number)=>setSubActivo(p=>({...p,[catId]:p[catId]===subId?null:subId}));

  const gruposFilt = grupos.filter(g=>{
    if(subSel) return g.subcategoria_id === subSel.id;
    if(catSel) return g.categoria_id    === catSel.id;
    if(query.trim()) return g.nombre.toLowerCase().includes(qLow)||g.categoria_nombre.toLowerCase().includes(qLow)||g.subcategoria_nombre.toLowerCase().includes(qLow);
    return true;
  });

  const busLibre = query.trim()!==""&&!catSel&&!subSel;
  const catsM    = catSel ? categorias.filter(c=>c.id===catSel.id) : categorias;

  const getGrupos = (cat:Categoria) => {
    const sa = subActivo[cat.id];
    return gruposFilt.filter(g=>{
      if(g.categoria_id !== cat.id) return false;
      if(sa) return g.subcategoria_id === sa;
      return true;
    }).slice(0,10);
  };

  const misGruposList  = grupos.filter(g=>misGrupos.has(g.id));
  const sinCategoria   = gruposFilt.filter(g=>!g.categoria_id);

  const unirse = (g:Grupo, e:React.MouseEvent)=>{
    e.preventDefault(); e.stopPropagation();
    if(!session){ router.push("/login"); return; }
    if(misGrupos.has(g.id)){ router.push(`/grupos/${g.id}`); return; }
    setGrupoPopup(g);
  };

  return (
    <main style={{ paddingTop:"95px", paddingBottom:"130px", background:"#f4f4f2", minHeight:"100vh", fontFamily:"'Nunito',sans-serif" }}>
      <Header />

      {/* HERO + BUSCADOR */}
      <div style={{ background:"linear-gradient(135deg,#1a2a3a,#243b55)", padding:"14px 16px 16px", display:"flex", flexDirection:"column", gap:"10px" }}>
        <div style={{ textAlign:"center" }}>
          <div style={{ fontSize:"13px", fontWeight:700, color:"#d4a017", letterSpacing:"2px", textTransform:"uppercase" }}>👥 Grupos NexoNet</div>
        </div>

        {/* Buscador con dropdown */}
        <div style={{ position:"relative" }}>
          <div style={{ display:"flex", background:"#fff", borderRadius:"14px", boxShadow:"0 2px 8px rgba(0,0,0,0.2)", zIndex:10, position:"relative" }}>
            <div style={{ flex:1, position:"relative" }}>
              <input ref={inputRef} type="text" value={query}
                onChange={e=>{ setQuery(e.target.value); setCatSel(null); setSubSel(null); setDropOpen(true); }}
                onFocus={()=>setDropOpen(true)} placeholder="Buscá un grupo..."
                style={{ width:"100%", border:"none", padding:"12px 16px", fontFamily:"'Nunito',sans-serif", fontSize:"14px", color:"#2c2c2e", outline:"none", background:"transparent", boxSizing:"border-box", borderRadius:"14px 0 0 14px" }}
              />
              {(catSel||subSel)&&(
                <div onClick={limpQ} style={{ position:"absolute", right:"8px", top:"50%", transform:"translateY(-50%)", background:"#d4a017", borderRadius:"20px", padding:"3px 10px", fontSize:"11px", fontWeight:800, color:"#1a2a3a", cursor:"pointer" }}>
                  {subSel?subSel.nombre:catSel!.nombre} ✕
                </div>
              )}
            </div>
            {query&&!catSel&&<button onClick={limpQ} style={{ background:"none", border:"none", padding:"0 8px", cursor:"pointer", fontSize:"16px", color:"#9a9a9a" }}>✕</button>}
            <button onClick={()=>setDropOpen(false)} style={{ background:"#d4a017", border:"none", padding:"0 18px", cursor:"pointer", fontSize:"16px", color:"#1a2a3a", borderRadius:"0 14px 14px 0", flexShrink:0 }}>🔍</button>
          </div>

          {dropOpen&&(
            <div ref={dropRef} style={{ position:"absolute", top:"calc(100% + 6px)", left:0, right:0, background:"#fff", borderRadius:"14px", boxShadow:"0 8px 32px rgba(0,0,0,0.2)", zIndex:100, maxHeight:"300px", overflowY:"auto", border:"1px solid #e8e8e6" }}>
              {catSel&&subDeCat.length>0?(
                <>
                  <div style={{ padding:"10px 14px 6px", fontSize:"10px", fontWeight:800, color:"#9a9a9a", textTransform:"uppercase", letterSpacing:"1px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <span>Subcategorías de {catSel.nombre}</span>
                    <button onClick={limpQ} style={{ background:"none", border:"none", cursor:"pointer", fontSize:"11px", color:"#d4a017", fontWeight:800, fontFamily:"'Nunito',sans-serif" }}>← Todas</button>
                  </div>
                  <div onClick={()=>{ setSubSel(null); setDropOpen(false); }} style={dItem(false)}>
                    <span>{catSel.emoji}</span><div style={{ fontSize:"13px", fontWeight:800, color:"#1a2a3a" }}>Todos en {catSel.nombre}</div>
                  </div>
                  {subDeCat.map(s=>(
                    <div key={s.id} onClick={()=>selSub(s)} style={dItem(subSel?.id===s.id)}>
                      <span style={{ fontSize:"13px" }}>↳ {s.emoji}</span>
                      <div style={{ fontSize:"13px", fontWeight:700, color:"#1a2a3a" }}>{s.nombre}</div>
                    </div>
                  ))}
                </>
              ):(
                <>
                  {query===""&&<div style={{ padding:"10px 14px 4px", fontSize:"10px", fontWeight:800, color:"#9a9a9a", textTransform:"uppercase", letterSpacing:"1px" }}>Todas las categorías</div>}
                  {query!==""&&catFilt.length===0&&subFilt.length===0&&<div style={{ padding:"20px", textAlign:"center", fontSize:"13px", color:"#9a9a9a", fontWeight:600 }}>Sin resultados para "{query}"</div>}
                  {catFilt.map(c=>(
                    <div key={c.id} onClick={()=>selCat(c)} style={dItem(catSel?.id===c.id)}>
                      <span style={{ fontSize:"18px" }}>{c.emoji}</span>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:"13px", fontWeight:800, color:"#1a2a3a" }}>{c.nombre}</div>
                        <div style={{ fontSize:"10px", color:"#9a9a9a", fontWeight:600 }}>{subcategorias.filter(s=>s.categoria_id===c.id).length} subcategorías</div>
                      </div>
                      <span style={{ fontSize:"12px", color:"#d4a017", fontWeight:800 }}>→</span>
                    </div>
                  ))}
                  {query!==""&&subFilt.length>0&&(
                    <>
                      <div style={{ padding:"8px 14px 4px", fontSize:"10px", fontWeight:800, color:"#9a9a9a", textTransform:"uppercase", letterSpacing:"1px", borderTop:"1px solid #f0f0f0" }}>Subcategorías</div>
                      {subFilt.slice(0,5).map(s=>{
                        const c=categorias.find(x=>x.id===s.categoria_id);
                        return(
                          <div key={s.id} onClick={()=>selSub(s)} style={dItem(false)}>
                            <span style={{ fontSize:"13px" }}>↳ {s.emoji}</span>
                            <div>
                              <div style={{ fontSize:"13px", fontWeight:700, color:"#1a2a3a" }}>{s.nombre}</div>
                              {c&&<div style={{ fontSize:"10px", color:"#9a9a9a", fontWeight:600 }}>en {c.nombre}</div>}
                            </div>
                          </div>
                        );
                      })}
                    </>
                  )}
                </>
              )}
              {query!==""&&<div onClick={()=>setDropOpen(false)} style={{...dItem(false),borderTop:"1px solid #f0f0f0",background:"#f9f7f0"}}><span>🔍</span><div><div style={{ fontSize:"13px", fontWeight:800, color:"#d4a017" }}>Buscar "{query}"</div><div style={{ fontSize:"10px", color:"#9a9a9a", fontWeight:600 }}>Ver todos los resultados</div></div></div>}
            </div>
          )}
        </div>

        {/* Botón crear */}
        <button onClick={()=>router.push("/grupos/crear")} style={{ background:"linear-gradient(135deg,rgba(212,160,23,0.2),rgba(212,160,23,0.1))", border:"2px solid rgba(212,160,23,0.4)", borderRadius:"12px", padding:"10px 16px", fontSize:"13px", fontWeight:800, color:"#d4a017", cursor:"pointer", fontFamily:"'Nunito',sans-serif", display:"flex", alignItems:"center", justifyContent:"center", gap:"8px" }}>
          ➕ Crear un grupo
        </button>
      </div>

      {loading?(
        <div style={{ textAlign:"center", padding:"40px", color:"#9a9a9a", fontWeight:700 }}>Cargando grupos...</div>
      ):busLibre?(
        /* Búsqueda libre */
        <div>
          <div style={{ padding:"14px 16px 8px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <span style={{ fontSize:"14px", fontWeight:900, color:"#1a2a3a" }}>🔍 <span style={{ color:"#d4a017" }}>{gruposFilt.length}</span> resultado{gruposFilt.length!==1?"s":""} para "{query}"</span>
            <button onClick={limpQ} style={{ background:"none", border:"none", fontSize:"12px", fontWeight:700, color:"#9a9a9a", cursor:"pointer", fontFamily:"'Nunito',sans-serif" }}>✕ Limpiar</button>
          </div>
          {gruposFilt.length===0?(
            <div style={{ textAlign:"center", padding:"40px 20px" }}>
              <div style={{ fontSize:"40px", marginBottom:"12px" }}>👥</div>
              <div style={{ fontSize:"15px", fontWeight:800, color:"#1a2a3a", marginBottom:"6px" }}>Sin resultados</div>
              <button onClick={limpQ} style={{ background:"linear-gradient(135deg,#d4a017,#f0c040)", border:"none", borderRadius:"12px", padding:"12px 24px", fontSize:"13px", fontWeight:800, color:"#1a2a3a", cursor:"pointer", fontFamily:"'Nunito',sans-serif" }}>Ver todos</button>
            </div>
          ):(
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px", padding:"8px 16px 16px" }}>
              {gruposFilt.map(g=><TarjetaGrupo key={g.id} g={g} esMiembro={misGrupos.has(g.id)} onUnirse={unirse} grid />)}
            </div>
          )}
        </div>
      ):(
        <>
          {/* Mis grupos */}
          {misGruposList.length>0&&(
            <SeccionGrupo titulo="⭐ Mis grupos">
              {misGruposList.map(g=><TarjetaGrupo key={g.id} g={g} esMiembro={true} onUnirse={unirse} />)}
            </SeccionGrupo>
          )}

          {/* Por categoría */}
          {catsM.map(cat=>{
            const items = getGrupos(cat);
            const subs  = subcategorias.filter(s=>s.categoria_id===cat.id);
            if(!catSel&&items.length===0) return null;
            return(
              <div key={cat.id} style={{ marginBottom:"8px", background:"#fff", paddingBottom:"12px", borderBottom:"6px solid #f4f4f2" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"14px 16px 8px" }}>
                  <span style={{ fontSize:"16px", fontWeight:900, color:"#1a2a3a" }}>{cat.emoji} {cat.nombre}</span>
                  <span style={{ fontSize:"12px", fontWeight:700, color:"#d4a017", cursor:"pointer" }}>Ver todos →</span>
                </div>
                {/* Subcategorías como chips */}
                {subs.length>0&&(
                  <div style={{ display:"flex", gap:"8px", padding:"0 16px 12px", overflowX:"auto", scrollbarWidth:"none" }}>
                    {subs.map(s=>(
                      <button key={s.id} onClick={()=>togSub(cat.id,s.id)} style={{ background:subActivo[cat.id]===s.id?"#1a2a3a":"#f4f4f2", border:`2px solid ${subActivo[cat.id]===s.id?"#1a2a3a":"#e8e8e6"}`, borderRadius:"20px", padding:"5px 14px", fontSize:"12px", fontWeight:700, color:subActivo[cat.id]===s.id?"#d4a017":"#2c2c2e", whiteSpace:"nowrap", cursor:"pointer", flexShrink:0, fontFamily:"'Nunito',sans-serif" }}>
                        {s.emoji} {s.nombre}
                      </button>
                    ))}
                  </div>
                )}
                {items.length===0?(
                  <div style={{ padding:"12px 16px", color:"#9a9a9a", fontSize:"13px", fontWeight:600 }}>Sin grupos en esta categoría</div>
                ):(
                  <div style={{ display:"flex", gap:"12px", padding:"0 16px", overflowX:"auto", scrollbarWidth:"none" }}>
                    {items.map(g=><TarjetaGrupo key={g.id} g={g} esMiembro={misGrupos.has(g.id)} onUnirse={unirse} />)}
                  </div>
                )}
              </div>
            );
          })}

          {sinCategoria.length>0&&(
            <SeccionGrupo titulo="📦 Otros grupos">
              {sinCategoria.slice(0,10).map(g=><TarjetaGrupo key={g.id} g={g} esMiembro={misGrupos.has(g.id)} onUnirse={unirse} />)}
            </SeccionGrupo>
          )}

          {gruposFilt.length===0&&!loading&&(
            <div style={{ textAlign:"center", padding:"60px 20px" }}>
              <div style={{ fontSize:"40px", marginBottom:"12px" }}>👥</div>
              <div style={{ fontSize:"15px", fontWeight:800, color:"#1a2a3a", marginBottom:"6px" }}>Aún no hay grupos</div>
              <button onClick={()=>router.push("/grupos/crear")} style={{ background:"linear-gradient(135deg,#d4a017,#f0c040)", border:"none", borderRadius:"12px", padding:"12px 24px", fontSize:"13px", fontWeight:800, color:"#1a2a3a", cursor:"pointer", fontFamily:"'Nunito',sans-serif" }}>
                ➕ Crear el primero
              </button>
            </div>
          )}
        </>
      )}

      {grupoPopup && session && (
        <PopupAccesoGrupo
          grupo={grupoPopup}
          userId={session.user.id}
          onClose={()=>setGrupoPopup(null)}
          onExito={()=>{
            setMisGrupos(prev=>new Set([...prev, grupoPopup.id]));
            setGrupoPopup(null);
          }}
        />
      )}
      <BottomNav />
    </main>
  );
}

function SeccionGrupo({ titulo, children }:{ titulo:string; children:React.ReactNode }) {
  return(
    <div style={{ marginBottom:"8px", background:"#fff", paddingBottom:"12px", borderBottom:"6px solid #f4f4f2" }}>
      <div style={{ padding:"14px 16px 8px" }}>
        <span style={{ fontSize:"16px", fontWeight:900, color:"#1a2a3a" }}>{titulo}</span>
      </div>
      <div style={{ display:"flex", gap:"12px", padding:"0 16px", overflowX:"auto", scrollbarWidth:"none" }}>
        {children}
      </div>
    </div>
  );
}

function TarjetaGrupo({ g, esMiembro, onUnirse, grid }:{ g:Grupo; esMiembro:boolean; onUnirse:(g:Grupo,e:React.MouseEvent)=>void; grid?:boolean }) {
  return(
    <div style={{ textDecoration:"none", flexShrink:grid?undefined:0, width:grid?undefined:"180px", cursor:"pointer" }}
         onClick={()=>window.location.href=`/grupos/${g.id}`}>
      <div style={{ background:"#fff", borderRadius:"16px", overflow:"hidden", boxShadow:"0 2px 10px rgba(0,0,0,0.08)", border:"1px solid #f0f0f0" }}>
        {/* Imagen */}
        <div style={{ width:"100%", height:"95px", background:"linear-gradient(135deg,#1a2a3a,#243b55)", display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden", position:"relative" }}>
          {g.imagen
            ?<img src={g.imagen} alt={g.nombre} style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
            :<span style={{ fontSize:"34px", opacity:0.5 }}>👥</span>
          }
          <div style={{ position:"absolute", top:"6px", right:"6px", display:"flex", gap:"4px" }}>
            <span style={{ background:g.tipo==="cerrado"?"rgba(230,57,70,0.85)":"rgba(0,168,132,0.85)", borderRadius:"20px", padding:"2px 7px", fontSize:"9px", fontWeight:800, color:"#fff" }}>
              {g.tipo==="cerrado"?"🔒":"🔓"}
            </span>
            {g.whatsapp_link&&<span style={{ background:"rgba(37,211,102,0.85)", borderRadius:"20px", padding:"2px 6px", fontSize:"9px", fontWeight:800, color:"#fff" }}>WA</span>}
          </div>
          {esMiembro&&<div style={{ position:"absolute", top:"6px", left:"6px", background:"rgba(212,160,23,0.9)", borderRadius:"20px", padding:"2px 7px", fontSize:"9px", fontWeight:800, color:"#1a2a3a" }}>⭐</div>}
        </div>
        {/* Info */}
        <div style={{ padding:"9px 10px 11px" }}>
          {g.subcategoria_nombre&&<div style={{ fontSize:"10px", color:"#9a9a9a", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:"2px" }}>{g.subcategoria_nombre}</div>}
          <div style={{ fontSize:"13px", fontWeight:800, color:"#1a2a3a", marginBottom:"3px", overflow:"hidden", whiteSpace:"nowrap", textOverflow:"ellipsis" }}>{g.nombre}</div>
          <div style={{ fontSize:"11px", color:"#9a9a9a", fontWeight:600, marginBottom:"7px" }}>👥 {g.miembros_count} miembro{g.miembros_count!==1?"s":""}</div>
          <button
            onClick={e=>{ e.stopPropagation(); onUnirse(g,e); }}
            style={{ width:"100%", background:esMiembro?"linear-gradient(135deg,#1a2a3a,#243b55)":"linear-gradient(135deg,#f0c040,#d4a017)", border:"none", borderRadius:"8px", padding:"7px", fontSize:"11px", fontWeight:900, color:esMiembro?"#d4a017":"#1a2a3a", cursor:"pointer", fontFamily:"'Nunito',sans-serif" }}>
            {esMiembro?"Ver grupo →":g.tipo==="cerrado"?"🔒 Solicitar":"Unirse →"}
          </button>
        </div>
      </div>
    </div>
  );
}

const dItem=(activo:boolean):React.CSSProperties=>({ display:"flex", alignItems:"center", gap:"12px", padding:"12px 14px", cursor:"pointer", background:activo?"rgba(212,160,23,0.08)":"transparent", borderLeft:activo?"3px solid #d4a017":"3px solid transparent" });
