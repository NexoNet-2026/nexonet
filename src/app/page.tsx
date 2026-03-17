"use client";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const FUENTES: Record<string, { label: string; color: string; texto: string }> = {
  nexonet:       { label: "NexoNet",        color: "#d4a017", texto: "#1a2a3a" },
  mercadolibre:  { label: "Mercado Libre",  color: "#ffe600", texto: "#333"    },
  rosariogarage: { label: "Rosario Garage", color: "#ff6b00", texto: "#fff"    },
  olx:           { label: "OLX",            color: "#00a884", texto: "#fff"    },
  otro:          { label: "Externo",        color: "#888",    texto: "#fff"    },
};

type Anuncio = {
  id: number; titulo: string; precio: number; moneda: string;
  ciudad: string; provincia: string; imagenes: string[];
  flash: boolean; fuente: string; permuto: boolean;
  subrubro: string; rubro: string; usuario_id: string;
  owner_whatsapp?: string;
};

type Nexo = {
  id: string; titulo: string; descripcion: string; tipo: string;
  ciudad: string; provincia: string; avatar_url: string;
  miembros_count?: number; config?: any;
};

type Rubro = { id: number; nombre: string };
type Subrubro = { id: number; nombre: string; rubro_id: number };

export default function Home() {
  const router = useRouter();
  const [anuncios,   setAnuncios]   = useState<Anuncio[]>([]);
  const [nexos,      setNexos]      = useState<Nexo[]>([]);
  const [rubros,     setRubros]     = useState<Rubro[]>([]);
  const [subrubros,  setSubrubros]  = useState<Subrubro[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [soloPermuto,setSoloPermuto]= useState(false);

  const [query,       setQuery]      = useState("");
  const [rubroSel,    setRubroSel]   = useState<Rubro | null>(null);
  const [subrubroSel, setSubrubroSel]= useState<Subrubro | null>(null);
  const [dropOpen,    setDropOpen]   = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropRef  = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cargar = async () => {
      const [
        { data: rData }, { data: sData }, { data: aData },
        { data: nData }, { data: gData },
      ] = await Promise.all([
        supabase.from("rubros").select("id,nombre").order("nombre"),
        supabase.from("subrubros").select("id,nombre,rubro_id").order("nombre"),
        supabase.from("anuncios").select(`
          id,titulo,precio,moneda,ciudad,provincia,imagenes,avatar_url,banner_url,flash,
          fuente,permuto,created_at,usuario_id,subrubro_id,
          subrubros(nombre,rubros(nombre))
        `).eq("estado","activo").order("created_at",{ascending:false}).limit(80),
        supabase.from("nexos")
          .select("id,titulo,descripcion,tipo,ciudad,provincia,avatar_url,config,miembros_count")
          .order("created_at",{ascending:false}).limit(60),
        supabase.from("grupos")
          .select("id,nombre,descripcion,imagen,ciudad,provincia,creador_id,miembros_count,pago_ingreso_admin")
          .eq("activo",true).order("created_at",{ascending:false}).limit(60),
      ]);

      if (rData) setRubros(rData);
      if (sData) setSubrubros(sData);

      if (aData) {
        let mapped: Anuncio[] = aData.map((a: any) => ({
          id: a.id, titulo: a.titulo, precio: a.precio, moneda: a.moneda,
          ciudad: a.ciudad, provincia: a.provincia, imagenes: a.imagenes || [],
          flash: a.flash || false, fuente: a.fuente || "nexonet",
          permuto: a.permuto || false, usuario_id: a.usuario_id,
          subrubro: a.subrubros?.nombre || "",
          rubro: Array.isArray(a.subrubros?.rubros)
            ? (a.subrubros.rubros[0]?.nombre || "")
            : (a.subrubros?.rubros?.nombre || ""),
        }));
        const uids = [...new Set(mapped.map(a => a.usuario_id).filter(Boolean))];
        if (uids.length > 0) {
          const { data: owners } = await supabase
            .from("usuarios").select("id,bits,bits_promo,bits_free,whatsapp,vis_personal").in("id", uids);
          if (owners) {
            const ownerMap: Record<string,any> = Object.fromEntries(owners.map((o:any) => [o.id, o]));
            mapped = mapped.map(a => {
              const o = ownerMap[a.usuario_id];
              const totalBits = (o?.bits||0)+(o?.bits_promo||0)+(o?.bits_free||0);
              const waVisible = o?.vis_personal?.whatsapp === true;
              return { ...a, owner_whatsapp: (o?.whatsapp && waVisible && totalBits > 0) ? o.whatsapp : undefined };
            });
          }
        }
        setAnuncios(mapped);
      }

      const nexosArr: Nexo[] = nData ? nData.map((n:any) => ({ ...n, id: String(n.id) })) : [];
      const gruposArr: Nexo[] = gData ? gData.map((g:any) => ({
        id: String(g.id), titulo: g.nombre || "Sin nombre",
        descripcion: g.descripcion || "", tipo: "grupo",
        ciudad: g.ciudad || "", provincia: g.provincia || "",
        avatar_url: g.imagen || "",
        miembros_count: g.miembros_count || 0,
        config: { tipo_acceso: g.pago_ingreso_admin ? "pago" : "libre" },
      })) : [];
      setNexos([...nexosArr, ...gruposArr]);
      setLoading(false);
    };
    cargar();
  }, []);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node) &&
          inputRef.current && !inputRef.current.contains(e.target as Node))
        setDropOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const queryLow = query.toLowerCase();
  const rubrosFiltered    = rubros.filter(r => r.nombre.toLowerCase().includes(queryLow));
  const subrubrosFiltered = subrubros.filter(s => s.nombre.toLowerCase().includes(queryLow));

  const anuFiltrados = anuncios.filter(a => {
    if (rubroSel    && a.rubro    !== rubroSel.nombre)    return false;
    if (subrubroSel && a.subrubro !== subrubroSel.nombre) return false;
    if (query && !rubroSel && !subrubroSel) {
      if (!a.titulo.toLowerCase().includes(queryLow) &&
          !a.rubro.toLowerCase().includes(queryLow)  &&
          !a.subrubro.toLowerCase().includes(queryLow)) return false;
    }
    if (soloPermuto && !a.permuto) return false;
    return true;
  });

  const recientes  = anuFiltrados.slice(0, 12);
  const grupos     = nexos.filter(n => n.tipo === "grupo").slice(0, 10);
  const empresas   = nexos.filter(n => n.tipo === "empresa").slice(0, 10);
  const servicios  = nexos.filter(n => n.tipo === "servicio").slice(0, 10);
  const trabajos   = nexos.filter(n => n.tipo === "trabajo").slice(0, 10);

  const limpiar = () => { setQuery(""); setRubroSel(null); setSubrubroSel(null); setDropOpen(false); };
  const selR = (r: Rubro) => { setRubroSel(r); setSubrubroSel(null); setQuery(r.nombre); setDropOpen(false); };
  const selS = (s: Subrubro) => {
    setRubroSel(rubros.find(r => r.id === s.rubro_id) || null);
    setSubrubroSel(s); setQuery(s.nombre); setDropOpen(false);
  };
  const irBuscar = () => {
    const p = new URLSearchParams();
    if (rubroSel)    p.set("rubro",    String(rubroSel.id));
    if (subrubroSel) p.set("subrubro", String(subrubroSel.id));
    if (query && !rubroSel) p.set("q", query);
    router.push(`/buscar?${p}`);
  };
  const irMapa = () => {
    const p = new URLSearchParams();
    if (rubroSel)    p.set("rubro",    String(rubroSel.id));
    if (subrubroSel) p.set("subrubro", String(subrubroSel.id));
    if (query && !rubroSel) p.set("q", query);
    router.push(`/mapa?${p}`);
  };
  const fmt = (p: number, m: string) =>
    !p ? "Consultar" : `${m === "USD" ? "U$D" : "$"} ${p.toLocaleString("es-AR")}`;
  const subsDe = rubroSel ? subrubros.filter(s => s.rubro_id === rubroSel.id) : [];

  return (
    <main style={{paddingTop:"95px",paddingBottom:"130px",background:"#f4f4f2",minHeight:"100vh",fontFamily:"'Nunito',sans-serif"}}>
      <Header />

      {/* HERO */}
      <div style={{background:"linear-gradient(135deg,#1a2a3a 0%,#243b55 100%)",padding:"18px 16px 20px"}}>
        <div style={{fontSize:"13px",fontWeight:700,color:"#d4a017",letterSpacing:"2px",textTransform:"uppercase",marginBottom:"4px",textAlign:"center"}}>
          Conectando Oportunidades
        </div>
        <div style={{fontSize:"12px",color:"#7a8fa0",marginBottom:"14px",fontWeight:600,textAlign:"center"}}>
          Conectando a la Comunidad
        </div>

        {/* BUSCADOR */}
        <div style={{position:"relative",maxWidth:"500px",margin:"0 auto"}}>
          <div style={{display:"flex",background:"#fff",borderRadius:"14px",overflow:"visible",boxShadow:"0 4px 20px rgba(0,0,0,0.25)",position:"relative",zIndex:10}}>
            <div style={{flex:1,position:"relative"}}>
              <input ref={inputRef} type="text" value={query}
                onChange={e=>{setQuery(e.target.value);setRubroSel(null);setSubrubroSel(null);setDropOpen(true);}}
                onFocus={()=>setDropOpen(true)}
                placeholder="Rubro, subrubro o producto..."
                style={{width:"100%",border:"none",padding:"14px 16px",fontFamily:"'Nunito',sans-serif",fontSize:"14px",color:"#2c2c2e",outline:"none",background:"transparent",boxSizing:"border-box",borderRadius:"14px 0 0 14px"}}
              />
              {(rubroSel||subrubroSel) && (
                <div onClick={limpiar} style={{position:"absolute",right:"8px",top:"50%",transform:"translateY(-50%)",background:rubroSel?"#d4a017":"#2980b9",borderRadius:"20px",padding:"3px 10px",fontSize:"11px",fontWeight:800,color:rubroSel&&!subrubroSel?"#1a2a3a":"#fff",cursor:"pointer"}}>
                  {subrubroSel?subrubroSel.nombre:rubroSel!.nombre} ✕
                </div>
              )}
            </div>
            {query && <button onClick={limpiar} style={{background:"none",border:"none",padding:"0 8px",cursor:"pointer",fontSize:"16px",color:"#9a9a9a"}}>✕</button>}
            <button onClick={irBuscar} style={{background:"#d4a017",border:"none",padding:"0 18px",cursor:"pointer",fontSize:"18px",borderRadius:"0 14px 14px 0",flexShrink:0}}>🔍</button>
          </div>

          {dropOpen && (
            <div ref={dropRef} style={{position:"absolute",top:"calc(100% + 6px)",left:0,right:0,background:"#fff",borderRadius:"14px",boxShadow:"0 8px 32px rgba(0,0,0,0.2)",zIndex:100,maxHeight:"320px",overflowY:"auto",border:"1px solid #e8e8e6"}}>
              {rubroSel && subsDe.length > 0 ? (<>
                <div style={{padding:"10px 14px 6px",fontSize:"10px",fontWeight:800,color:"#9a9a9a",textTransform:"uppercase",letterSpacing:"1px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <span>Subrubros de {rubroSel.nombre}</span>
                  <button onClick={limpiar} style={{background:"none",border:"none",cursor:"pointer",fontSize:"11px",color:"#d4a017",fontWeight:800,fontFamily:"'Nunito',sans-serif"}}>← Todos</button>
                </div>
                <div onClick={()=>{setSubrubroSel(null);setDropOpen(false);}} style={DI(false)}><span>📋</span><div style={{fontSize:"13px",fontWeight:800,color:"#1a2a3a"}}>Todos en {rubroSel.nombre}</div></div>
                {subsDe.map(s=><div key={s.id} onClick={()=>selS(s)} style={DI(subrubroSel?.id===s.id)}><span>↳</span><div style={{fontSize:"13px",fontWeight:700,color:"#1a2a3a"}}>{s.nombre}</div></div>)}
              </>) : (<>
                {query===""&&<div style={{padding:"10px 14px 6px",fontSize:"10px",fontWeight:800,color:"#9a9a9a",textTransform:"uppercase",letterSpacing:"1px"}}>Todos los rubros</div>}
                {query!==""&&rubrosFiltered.length===0&&subrubrosFiltered.length===0&&<div style={{padding:"20px",textAlign:"center",fontSize:"13px",color:"#9a9a9a",fontWeight:600}}>Sin resultados para "{query}"</div>}
                {rubrosFiltered.map(r=><div key={r.id} onClick={()=>selR(r)} style={DI(rubroSel?.id===r.id)}><span>📂</span><div style={{flex:1}}><div style={{fontSize:"13px",fontWeight:800,color:"#1a2a3a"}}>{r.nombre}</div><div style={{fontSize:"10px",color:"#9a9a9a",fontWeight:600}}>{subrubros.filter(s=>s.rubro_id===r.id).length} subrubros</div></div><span style={{fontSize:"12px",color:"#d4a017",fontWeight:800}}>→</span></div>)}
                {query!==""&&subrubrosFiltered.length>0&&<>
                  <div style={{padding:"8px 14px 4px",fontSize:"10px",fontWeight:800,color:"#9a9a9a",textTransform:"uppercase",letterSpacing:"1px",borderTop:"1px solid #f0f0f0"}}>Subrubros</div>
                  {subrubrosFiltered.slice(0,5).map(s=>{const r=rubros.find(x=>x.id===s.rubro_id);return<div key={s.id} onClick={()=>selS(s)} style={DI(false)}><span>↳</span><div><div style={{fontSize:"13px",fontWeight:700,color:"#1a2a3a"}}>{s.nombre}</div>{r&&<div style={{fontSize:"10px",color:"#9a9a9a",fontWeight:600}}>en {r.nombre}</div>}</div></div>;})}
                </>}
                {query!==""&&<div onClick={irBuscar} style={{...DI(false),borderTop:"1px solid #f0f0f0",background:"#f9f7f0"}}><span>🔍</span><div><div style={{fontSize:"13px",fontWeight:800,color:"#d4a017"}}>Buscar "{query}"</div><div style={{fontSize:"10px",color:"#9a9a9a",fontWeight:600}}>Ver todos los resultados</div></div></div>}
              </>)}
            </div>
          )}
        </div>

        {/* FILTROS */}
        <div style={{display:"flex",gap:"8px",justifyContent:"center",marginTop:"12px",flexWrap:"wrap"}}>
          <button onClick={()=>setSoloPermuto(v=>!v)}
            style={{background:soloPermuto?"#d4a017":"rgba(255,255,255,0.12)",border:`2px solid ${soloPermuto?"#d4a017":"rgba(255,255,255,0.3)"}`,borderRadius:"20px",padding:"7px 16px",fontSize:"12px",fontWeight:800,color:soloPermuto?"#1a2a3a":"#fff",cursor:"pointer",fontFamily:"'Nunito',sans-serif"}}>
            🔄 Permuta {soloPermuto&&"✓"}
          </button>
          <button onClick={()=>router.push("/busqueda-ia")}
            style={{background:"linear-gradient(135deg,rgba(22,160,133,0.3),rgba(22,160,133,0.15))",border:"2px solid rgba(22,160,133,0.7)",borderRadius:"20px",padding:"7px 16px",fontSize:"12px",fontWeight:800,color:"#1abc9c",cursor:"pointer",fontFamily:"'Nunito',sans-serif"}}>
            🤖 Búsqueda IA
          </button>
        </div>

        <div style={{display:"flex",gap:"8px",justifyContent:"center",marginTop:"10px"}}>
          <button onClick={irBuscar} style={{background:"linear-gradient(135deg,#f0c040,#d4a017)",border:"none",borderRadius:"20px",padding:"8px 20px",fontSize:"13px",fontWeight:900,color:"#1a2a3a",cursor:"pointer",fontFamily:"'Nunito',sans-serif",boxShadow:"0 3px 0 #a07810"}}>📋 Ver en lista</button>
          <button onClick={irMapa}   style={{background:"rgba(255,255,255,0.12)",border:"2px solid rgba(255,255,255,0.25)",borderRadius:"20px",padding:"8px 20px",fontSize:"13px",fontWeight:800,color:"#fff",cursor:"pointer",fontFamily:"'Nunito',sans-serif"}}>🗺️ Ver en mapa</button>
        </div>
      </div>

      {loading ? (
        <div style={{textAlign:"center",padding:"40px",color:"#9a9a9a",fontWeight:700}}>Cargando...</div>
      ) : (
        <>
          {/* 1. RECIÉN PUBLICADOS */}
          <Slider titulo="🕐 Recién publicados" acento="#d4a017" verTodos="/buscar" onTituloClick={()=>router.push("/buscar")}>
            {recientes.map(a => <TarjetaAnuncio key={a.id} a={a} fmt={fmt} />)}
          </Slider>

          {/* 2. EMPRESAS */}
          <Slider titulo="🏢 Empresas" acento="#c0392b" verTodos="/buscar?tipo=empresas" onTituloClick={()=>router.push("/buscar?tipo=empresas")}>
            {empresas.length > 0
              ? empresas.map(n => <TarjetaNexo key={n.id} nexo={n} color="#c0392b" onClick={()=>router.push(`/nexo/${n.id}`)} />)
              : [<TarjetaVacia key="vacia" emoji="🏢" texto="Sé el primero en crear una empresa" color="#c0392b" onClick={()=>router.push("/nexo/crear/empresa")} />]
            }
          </Slider>

          {/* 3. GRUPOS */}
          <Slider titulo="👥 Grupos" acento="#3a7bd5" verTodos="/buscar?tipo=grupos" onTituloClick={()=>router.push("/buscar?tipo=grupos")}>
            {grupos.length > 0
              ? grupos.map(n => <TarjetaNexo key={n.id} nexo={n} color="#3a7bd5" onClick={()=>router.push(`/grupos/${n.id}`)} />)
              : [<TarjetaVacia key="vacia" emoji="👥" texto="Sé el primero en crear un grupo" color="#3a7bd5" onClick={()=>router.push("/publicar")} />]
            }
          </Slider>

          {/* 4. SERVICIOS */}
          <Slider titulo="🛠️ Servicios" acento="#27ae60" verTodos="/buscar?tipo=servicios" onTituloClick={()=>router.push("/buscar?tipo=servicios")}>
            {servicios.length > 0
              ? servicios.map(n => <TarjetaNexo key={n.id} nexo={n} color="#27ae60" onClick={()=>router.push(`/nexo/${n.id}`)} />)
              : [<TarjetaVacia key="vacia" emoji="🛠️" texto="Sé el primero en ofrecer un servicio" color="#27ae60" onClick={()=>router.push("/nexo/crear/servicio")} />]
            }
          </Slider>

          {/* 5. BUSCO TRABAJO */}
          <Slider titulo="💼 Busco Trabajo" acento="#8e44ad" verTodos="/buscar?tipo=trabajo" onTituloClick={()=>router.push("/buscar?tipo=trabajo")}>
            {trabajos.length > 0
              ? trabajos.map(n => <TarjetaNexo key={n.id} nexo={n} color="#8e44ad" onClick={()=>router.push(`/nexo/${n.id}`)} />)
              : [<TarjetaVacia key="vacia" emoji="💼" texto="Sé el primero en buscar trabajo" color="#8e44ad" onClick={()=>router.push("/nexo/crear/trabajo")} />]
            }
          </Slider>

          {anuFiltrados.length === 0 && (
            <div style={{textAlign:"center",padding:"40px 20px"}}>
              <div style={{fontSize:"40px",marginBottom:"12px"}}>🔍</div>
              <div style={{fontSize:"16px",fontWeight:800,color:"#1a2a3a",marginBottom:"6px"}}>Sin resultados</div>
              <button onClick={()=>{limpiar();setSoloPermuto(false);}} style={{background:"linear-gradient(135deg,#d4a017,#f0c040)",border:"none",borderRadius:"12px",padding:"12px 24px",fontSize:"13px",fontWeight:800,color:"#1a2a3a",cursor:"pointer",fontFamily:"'Nunito',sans-serif"}}>Ver todos</button>
            </div>
          )}
        </>
      )}

      <BottomNav />
    </main>
  );
}

// ── SLIDER ──────────────────────────────────────────────────────────────────
function Slider({ titulo, acento, verTodos, onTituloClick, children }: {
  titulo:string; acento:string; verTodos:string; onTituloClick?:()=>void; children:React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const items = Array.isArray(children) ? children : [children];
  const total = items.length;
  const [idx, setIdx] = useState(0);
  const CARD_W = 202;

  const scrollTo = (i: number) => {
    const el = ref.current; if (!el) return;
    const c = Math.max(0, Math.min(i, total-1));
    setIdx(c);
    el.scrollTo({left: c * CARD_W, behavior:"smooth"});
  };
  const onScroll = () => { if (ref.current) setIdx(Math.round(ref.current.scrollLeft / CARD_W)); };

  return (
    <div style={{marginBottom:"8px",background:"#fff",paddingBottom:"12px",borderBottom:"6px solid #f4f4f2"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 16px 10px"}}>
        <div onClick={onTituloClick} style={{display:"flex",alignItems:"center",gap:"8px",cursor:onTituloClick?"pointer":"default"}}>
          <div style={{width:"3px",height:"18px",background:acento,borderRadius:"2px"}}/>
          <span style={{fontSize:"16px",fontWeight:900,color:"#1a2a3a"}}>{titulo}</span>
          {onTituloClick && <span style={{fontSize:"13px",color:acento}}>→</span>}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
          <button onClick={()=>scrollTo(idx-1)} disabled={idx===0}
            style={{width:"28px",height:"28px",borderRadius:"50%",border:`2px solid ${acento}`,background:idx===0?"transparent":acento,color:idx===0?acento:"#1a2a3a",fontSize:"13px",cursor:idx===0?"not-allowed":"pointer",display:"flex",alignItems:"center",justifyContent:"center",opacity:idx===0?0.35:1}}>‹</button>
          <button onClick={()=>scrollTo(idx+1)} disabled={idx>=total-1}
            style={{width:"28px",height:"28px",borderRadius:"50%",border:`2px solid ${acento}`,background:idx>=total-1?"transparent":acento,color:idx>=total-1?acento:"#1a2a3a",fontSize:"13px",cursor:idx>=total-1?"not-allowed":"pointer",display:"flex",alignItems:"center",justifyContent:"center",opacity:idx>=total-1?0.35:1}}>›</button>
          <a href={verTodos} style={{fontSize:"12px",fontWeight:700,color:acento,textDecoration:"none"}}>Ver todos →</a>
        </div>
      </div>
      <div ref={ref} onScroll={onScroll}
        style={{display:"flex",gap:"12px",padding:"0 16px 8px",overflowX:"auto",scrollbarWidth:"none",scrollSnapType:"x mandatory"}}>
        {items.map((child, i) => <div key={i} style={{scrollSnapAlign:"start",flexShrink:0}}>{child}</div>)}
      </div>
      {total > 1 && (
        <div style={{display:"flex",justifyContent:"center",gap:"5px",paddingTop:"6px"}}>
          {items.map((_,i)=><div key={i} onClick={()=>scrollTo(i)} style={{width:i===idx?"18px":"6px",height:"6px",borderRadius:"3px",background:i===idx?acento:"rgba(0,0,0,0.15)",cursor:"pointer",transition:"all .25s"}}/>)}
        </div>
      )}
    </div>
  );
}

// ── TARJETA ANUNCIO ──────────────────────────────────────────────────────────
function TarjetaAnuncio({ a, fmt }: { a:Anuncio; fmt:(p:number,m:string)=>string }) {
  const fuente = FUENTES[a.fuente] || FUENTES.nexonet;
  const tieneWA = !!a.owner_whatsapp;
  return (
    <a href={`/anuncios/${a.id}`} style={{textDecoration:"none",flexShrink:0,width:"190px",display:"block"}}>
      <div style={{background:"#fff",borderRadius:"16px",overflow:"hidden",boxShadow:"0 2px 10px rgba(0,0,0,0.08)",border:"1px solid #f0f0f0"}}>
        <div style={{background:fuente.color,padding:"4px 10px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <span style={{fontSize:"10px",fontWeight:900,color:fuente.texto,textTransform:"uppercase",letterSpacing:"0.5px"}}>{fuente.label}</span>
          <div style={{display:"flex",gap:"4px",alignItems:"center"}}>
            {a.flash && <span style={{background:"#1a2a3a",color:"#d4a017",fontSize:"9px",fontWeight:900,padding:"1px 6px",borderRadius:"6px"}}>⚡</span>}
            {a.permuto && <span style={{background:"#8e44ad",color:"#fff",fontSize:"9px",fontWeight:900,padding:"1px 6px",borderRadius:"6px"}}>🔄</span>}
            <div style={{width:"14px",height:"14px",borderRadius:"50%",background:tieneWA?"#25d366":"rgba(0,0,0,0.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"8px",opacity:tieneWA?1:0.3}}>📱</div>
          </div>
        </div>
        <div style={{width:"100%",height:"120px",background:"#e8e8e6",display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden"}}>
          {(a.imagenes?.[0] || (a as any).avatar_url || (a as any).banner_url)
            ? <img src={a.imagenes?.[0] || (a as any).avatar_url || (a as any).banner_url} alt={a.titulo} style={{width:"100%",height:"100%",objectFit:"cover"}}/>
            : <span style={{fontSize:"40px"}}>📦</span>}
        </div>
        <div style={{padding:"8px 10px 12px"}}>
          <div style={{fontSize:"10px",color:"#9a9a9a",fontWeight:700,marginBottom:"2px",textTransform:"uppercase",letterSpacing:"0.5px"}}>{a.subrubro}</div>
          <div style={{fontSize:"13px",fontWeight:800,color:"#2c2c2e",marginBottom:"3px",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{a.titulo}</div>
          <div style={{fontSize:"15px",fontWeight:900,color:"#d4a017"}}>{fmt(a.precio, a.moneda)}</div>
          <div style={{fontSize:"11px",color:"#9a9a9a",fontWeight:600,marginTop:"2px"}}>📍 {a.ciudad}</div>
        </div>
      </div>
    </a>
  );
}

// ── TARJETA NEXO ─────────────────────────────────────────────────────────────
function TarjetaNexo({ nexo, color, onClick }: { nexo:Nexo; color:string; onClick:()=>void }) {
  const TIPO_EMOJI: Record<string,string> = {
    grupo:"👥", empresa:"🏢", servicio:"🛠️", trabajo:"💼",
  };
  return (
    <div onClick={onClick} style={{flexShrink:0,width:"160px",cursor:"pointer"}}>
      <div style={{background:"#fff",borderRadius:"14px",overflow:"hidden",boxShadow:"0 2px 10px rgba(0,0,0,0.08)",border:`2px solid ${color}20`}}>
        <div style={{width:"100%",height:"90px",background:`linear-gradient(135deg,${color}33,${color}11)`,display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",position:"relative"}}>
          {nexo.avatar_url
            ? <img src={nexo.avatar_url} alt={nexo.titulo} style={{width:"100%",height:"100%",objectFit:"cover"}}/>
            : <span style={{fontSize:"36px",opacity:0.6}}>{TIPO_EMOJI[nexo.tipo]||"✨"}</span>
          }
          <div style={{position:"absolute",top:"6px",left:"6px",background:color,borderRadius:"20px",padding:"2px 7px",fontSize:"9px",fontWeight:900,color:"#fff",textTransform:"uppercase"}}>
            {nexo.tipo}
          </div>
          {nexo.config?.tipo_acceso === "pago" && (
            <div style={{position:"absolute",top:"6px",right:"6px",background:"rgba(212,160,23,0.95)",borderRadius:"6px",padding:"2px 6px",fontSize:"9px",fontWeight:900,color:"#1a2a3a"}}>💰</div>
          )}
        </div>
        <div style={{padding:"8px 10px 10px"}}>
          <div style={{fontSize:"12px",fontWeight:800,color:"#1a2a3a",overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical" as any,marginBottom:"4px"}}>
            {nexo.titulo}
          </div>
          <div style={{display:"flex",alignItems:"center",gap:"4px"}}>
            {nexo.tipo==="grupo" && <span style={{fontSize:"10px",color:"#9a9a9a",fontWeight:600}}>👥 {nexo.miembros_count||0}</span>}
            {nexo.ciudad && <span style={{fontSize:"10px",color:"#9a9a9a",fontWeight:600}}>📍 {nexo.ciudad}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── TARJETA VACÍA ────────────────────────────────────────────────────────────
function TarjetaVacia({ emoji, texto, color, onClick }: { emoji:string; texto:string; color:string; onClick:()=>void }) {
  return (
    <div onClick={onClick} style={{flexShrink:0,width:"180px",cursor:"pointer"}}>
      <div style={{background:"#fff",borderRadius:"14px",overflow:"hidden",boxShadow:"0 2px 10px rgba(0,0,0,0.06)",border:`2px dashed ${color}40`,height:"160px",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"10px",padding:"16px",textAlign:"center"}}>
        <span style={{fontSize:"36px",opacity:0.5}}>{emoji}</span>
        <div style={{fontSize:"12px",fontWeight:700,color:"#9a9a9a",lineHeight:1.4}}>{texto}</div>
        <div style={{background:`${color}18`,border:`1px solid ${color}40`,borderRadius:"20px",padding:"4px 12px",fontSize:"11px",fontWeight:800,color}}>➕ Crear</div>
      </div>
    </div>
  );
}

const DI = (activo:boolean): React.CSSProperties => ({
  display:"flex", alignItems:"center", gap:"12px", padding:"12px 14px",
  cursor:"pointer", background:activo?"rgba(212,160,23,0.08)":"transparent",
  borderLeft:activo?"3px solid #d4a017":"3px solid transparent",
});
