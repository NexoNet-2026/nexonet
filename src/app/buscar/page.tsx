"use client";
import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/lib/supabase";

type Anuncio = { id:number; titulo:string; precio:number; moneda:string; ciudad:string; provincia:string; barrio:string; imagenes:string[]; flash:boolean; fuente:string; subrubro_id:number };
type Rubro = { id:number; nombre:string; subrubros:{id:number; nombre:string}[] };
type RubroFlat = { id:number; nombre:string };
type SubrubroFlat = { id:number; nombre:string; rubro_id:number };
type Prov = { id:number; nombre:string };
type Ciudad = { id:number; nombre:string; provincia_id:number };
type Barrio = { id:number; nombre:string; ciudad_id:number };

const F: Record<string,{color:string;texto:string;label:string}> = {
  nexonet:      {color:"#d4a017",texto:"#1a2a3a",label:"NexoNet"},
  mercadolibre: {color:"#ffe600",texto:"#333",   label:"Mercado Libre"},
  rosariogarage:{color:"#ff6b00",texto:"#fff",   label:"Rosario Garage"},
  olx:          {color:"#00a884",texto:"#fff",   label:"OLX"},
  otro:         {color:"#888",   texto:"#fff",   label:"Externo"},
};

export default function Buscar() {
  return (
    <Suspense fallback={<div style={{paddingTop:"95px",textAlign:"center",padding:"60px",color:"#9a9a9a",fontWeight:700}}>Cargando...</div>}>
      <BuscarInner />
    </Suspense>
  );
}

function BuscarInner() {
  const sp = useSearchParams();

  // Ubicación
  const [provs,    setProvs]    = useState<Prov[]>([]);
  const [ciudades, setCiudades] = useState<Ciudad[]>([]);
  const [barrios,  setBarrios]  = useState<Barrio[]>([]);
  const [provSel,  setProvSel]  = useState("");
  const [ciudSel,  setCiudSel]  = useState("");
  const [barrSel,  setBarrSel]  = useState("");
  const [gpsLoad,  setGpsLoad]  = useState(false);
  const gpsSettingRef = useRef(false); // evita que useEffect resetee lo que pone el GPS

  // Buscador
  const [query,    setQuery]    = useState("");
  const [rSel,     setRSel]     = useState<RubroFlat|null>(null);
  const [sSel,     setSSel]     = useState<SubrubroFlat|null>(null);
  const [dropOpen, setDropOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropRef  = useRef<HTMLDivElement>(null);

  // Datos
  const [rubros,   setRubros]   = useState<Rubro[]>([]);
  const [rFlat,    setRFlat]    = useState<RubroFlat[]>([]);
  const [sFlat,    setSFlat]    = useState<SubrubroFlat[]>([]);
  const [anuncios, setAnuncios] = useState<Anuncio[]>([]);
  const [subAct,   setSubAct]   = useState<Record<number,number|null>>({});
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    if (sp.get("q")) setQuery(sp.get("q")!);
    (window as any).__rP = sp.get("rubro");
    (window as any).__sP = sp.get("subrubro");

    Promise.all([
      supabase.from("provincias").select("id,nombre").order("nombre"),
      supabase.from("rubros").select("id,nombre,subrubros(id,nombre)").order("nombre"),
      supabase.from("anuncios")
        .select("id,titulo,precio,moneda,ciudad,provincia,barrio,imagenes,flash,fuente,subrubro_id")
        .eq("estado","activo").order("created_at",{ascending:false}).limit(100),
    ]).then(([{data:pData},{data:rData},{data:aData}]) => {
      if (pData) setProvs(pData);
      if (rData) {
        setRubros(rData as any);
        const rf = rData.map((r:any) => ({id:r.id,nombre:r.nombre}));
        setRFlat(rf);
        setSFlat(rData.flatMap((r:any) => (r.subrubros||[]).map((s:any) => ({id:s.id,nombre:s.nombre,rubro_id:r.id}))));
        const rP = (window as any).__rP, sP = (window as any).__sP;
        if (rP) { const r = rf.find((x:any) => x.id===parseInt(rP)); if(r){setRSel(r);setQuery(r.nombre);} }
        if (sP) {
          const all = rData.flatMap((r:any) => (r.subrubros||[]).map((s:any) => ({id:s.id,nombre:s.nombre,rubro_id:r.id})));
          const s = all.find((x:any) => x.id===parseInt(sP));
          if(s){setSSel(s);setQuery(s.nombre);}
        }
      }
      if (aData) setAnuncios(aData as any);
      setLoading(false);
    });
  }, []);

  // Ciudades al cambiar provincia (se saltea si lo está seteando el GPS)
  useEffect(() => {
    if (gpsSettingRef.current) return; // GPS ya maneja todo
    if (!provSel) { setCiudSel(""); setBarrSel(""); setCiudades([]); setBarrios([]); return; }
    const p = provs.find(x => x.nombre===provSel);
    if (!p) return;
    setCiudSel(""); setBarrSel(""); setBarrios([]);
    supabase.from("ciudades").select("id,nombre,provincia_id").eq("provincia_id",p.id).order("nombre")
      .then(({data}) => { if(data) setCiudades(data); });
  }, [provSel, provs]);

  // Barrios al cambiar ciudad
  useEffect(() => {
    setBarrSel(""); setBarrios([]);
    if (!ciudSel) return;
    const c = ciudades.find(x => x.nombre===ciudSel);
    if (!c) return;
    supabase.from("barrios").select("id,nombre,ciudad_id").eq("ciudad_id",c.id).order("nombre")
      .then(({data}) => { if(data) setBarrios(data); });
  }, [ciudSel, ciudades]);

  // Cerrar dropdown afuera
  useEffect(() => {
    const h = (e:MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node) &&
          inputRef.current && !inputRef.current.contains(e.target as Node))
        setDropOpen(false);
    };
    document.addEventListener("mousedown",h);
    return () => document.removeEventListener("mousedown",h);
  }, []);

  // GPS
  const gps = () => {
    if (!navigator.geolocation) return alert("GPS no disponible");
    setGpsLoad(true);
    navigator.geolocation.getCurrentPosition(async pos => {
      try {
        const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`);
        const d = await r.json();
        const pNom = d.address?.state||"";
        const cNom = d.address?.city||d.address?.town||d.address?.village||"";
        const bNom = d.address?.suburb||d.address?.neighbourhood||"";

        const pm = provs.find(p =>
          p.nombre.toLowerCase().includes(pNom.toLowerCase()) ||
          pNom.toLowerCase().includes(p.nombre.toLowerCase())
        );
        if (!pm) { setGpsLoad(false); return; }

        // Cargar ciudades
        const {data:cd} = await supabase.from("ciudades")
          .select("id,nombre,provincia_id").eq("provincia_id",pm.id).order("nombre");

        let ciudadFinal = "";
        let barrioFinal = "";
        let barriosFinal: Barrio[] = [];
        let ciudadesFinal: Ciudad[] = cd||[];

        if (cd && cNom) {
          const cm = cd.find((c:any) =>
            c.nombre.toLowerCase().includes(cNom.toLowerCase()) ||
            cNom.toLowerCase().includes(c.nombre.toLowerCase())
          );
          if (cm) {
            ciudadFinal = cm.nombre;
            const {data:bd} = await supabase.from("barrios")
              .select("id,nombre,ciudad_id").eq("ciudad_id",cm.id).order("nombre");
            if (bd) {
              barriosFinal = bd;
              if (bNom) {
                const bm = bd.find((b:any) =>
                  b.nombre.toLowerCase().includes(bNom.toLowerCase()) ||
                  bNom.toLowerCase().includes(b.nombre.toLowerCase())
                );
                if (bm) barrioFinal = bm.nombre;
              }
            }
          }
        }

        // Activar flag ANTES de setear provincia para que useEffect no resetee
        gpsSettingRef.current = true;
        setCiudades(ciudadesFinal);
        setBarrios(barriosFinal);
        setProvSel(pm.nombre);
        setCiudSel(ciudadFinal);
        setBarrSel(barrioFinal);
        // Desactivar flag en el siguiente tick
        setTimeout(() => { gpsSettingRef.current = false; }, 100);

      } catch { alert("Error al obtener ubicación"); }
      setGpsLoad(false);
    }, () => { alert("No se pudo acceder al GPS"); setGpsLoad(false); });
  };

  const limpUbi = () => { setProvSel(""); setCiudSel(""); setBarrSel(""); };
  const ubiActiva = !!(provSel||ciudSel||barrSel);

  // Filtrado
  const qLow = query.toLowerCase();
  const rFilt = rFlat.filter(r => r.nombre.toLowerCase().includes(qLow));
  const sFilt = sFlat.filter(s => s.nombre.toLowerCase().includes(qLow));
  const sDRubro = rSel ? sFlat.filter(s => s.rubro_id===rSel.id) : [];

  const limpQ  = () => { setQuery(""); setRSel(null); setSSel(null); setDropOpen(false); };
  const selR   = (r:RubroFlat)    => { setRSel(r); setSSel(null); setQuery(r.nombre); setDropOpen(false); };
  const selS   = (s:SubrubroFlat) => { setRSel(rFlat.find(r=>r.id===s.rubro_id)||null); setSSel(s); setQuery(s.nombre); setDropOpen(false); };
  const togSub = (rId:number,sId:number) => setSubAct(p => ({...p,[rId]:p[rId]===sId?null:sId}));

  const anuFilt = anuncios.filter(a => {
    if (barrSel) return (a.barrio||"").toLowerCase().includes(barrSel.toLowerCase());
    if (ciudSel) return (a.ciudad||"").toLowerCase().includes(ciudSel.toLowerCase());
    if (provSel) return (a.provincia||"").toLowerCase().includes(provSel.toLowerCase());
    return true;
  });

  const busLibre = query.trim()!==""&&!rSel&&!sSel;
  const resTxt   = busLibre ? anuFilt.filter(a=>a.titulo.toLowerCase().includes(qLow)) : [];
  const rubrosM  = rSel ? rubros.filter(r=>r.id===rSel.id) : rubros;

  const getAnus = (rubro:Rubro) => {
    const ids = rubro.subrubros.map(s=>s.id);
    const sa  = subAct[rubro.id];
    return anuFilt.filter(a => sa ? a.subrubro_id===sa : ids.includes(a.subrubro_id)).slice(0,8);
  };

  const fmt = (p:number,m:string) => !p?"Consultar":`${m==="USD"?"U$D":"$"} ${p.toLocaleString("es-AR")}`;
  const phQ  = barrSel?`¿Qué buscás en ${barrSel}?`:ciudSel?`¿Qué buscás en ${ciudSel}?`:provSel?`¿Qué buscás en ${provSel}?`:"¿Qué buscás?";

  return (
    <main style={{paddingTop:"95px",paddingBottom:"130px",background:"#f4f4f2",minHeight:"100vh",fontFamily:"'Nunito',sans-serif"}}>
      <Header />

      {/* BARRA */}
      <div style={{background:"linear-gradient(135deg,#1a2a3a,#243b55)",padding:"12px 16px 14px",display:"flex",flexDirection:"column",gap:"10px"}}>

        {/* FILA UBICACIÓN */}
        <div style={{display:"flex",gap:"8px",alignItems:"center"}}>
          <SelUbi value={provSel} placeholder="🗺️ Provincia" opciones={provs.map(p=>p.nombre)} onChange={setProvSel} />
          {provSel && <SelUbi value={ciudSel} placeholder="🏙️ Ciudad" opciones={ciudades.map(c=>c.nombre)} onChange={setCiudSel} />}
          {ciudSel && barrios.length>0 && <SelUbi value={barrSel} placeholder="🏘️ Barrio" opciones={barrios.map(b=>b.nombre)} onChange={setBarrSel} />}
          <button onClick={gps} disabled={gpsLoad} title="GPS" style={{flexShrink:0,width:"42px",height:"42px",background:"rgba(212,160,23,0.2)",border:"2px solid rgba(212,160,23,0.5)",borderRadius:"12px",fontSize:"18px",cursor:"pointer",opacity:gpsLoad?0.6:1,display:"flex",alignItems:"center",justifyContent:"center"}}>
            {gpsLoad?"⏳":"📍"}
          </button>
          {ubiActiva && <button onClick={limpUbi} style={{flexShrink:0,width:"42px",height:"42px",background:"rgba(255,80,80,0.15)",border:"2px solid rgba(255,80,80,0.3)",borderRadius:"12px",fontSize:"16px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>}
        </div>

        {/* CHIPS */}
        {ubiActiva && (
          <div style={{display:"flex",gap:"6px",flexWrap:"wrap"}}>
            {[provSel,ciudSel,barrSel].filter(Boolean).map((l,i)=>(
              <span key={i} style={{background:"rgba(212,160,23,0.2)",border:"1px solid rgba(212,160,23,0.4)",borderRadius:"20px",padding:"3px 10px",fontSize:"11px",fontWeight:800,color:"#d4a017"}}>
                {["🗺️","🏙️","🏘️"][i]} {l}
              </span>
            ))}
          </div>
        )}

        {/* BUSCADOR */}
        <div style={{position:"relative"}}>
          <div style={{display:"flex",background:"#fff",borderRadius:"14px",boxShadow:"0 2px 8px rgba(0,0,0,0.2)",zIndex:10,position:"relative"}}>
            <div style={{flex:1,position:"relative"}}>
              <input ref={inputRef} type="text" value={query}
                onChange={e=>{setQuery(e.target.value);setRSel(null);setSSel(null);setDropOpen(true);}}
                onFocus={()=>setDropOpen(true)}
                placeholder={phQ}
                style={{width:"100%",border:"none",padding:"12px 16px",fontFamily:"'Nunito',sans-serif",fontSize:"14px",color:"#2c2c2e",outline:"none",background:"transparent",boxSizing:"border-box",borderRadius:"14px 0 0 14px"}}
              />
              {(rSel||sSel) && (
                <div onClick={limpQ} style={{position:"absolute",right:"8px",top:"50%",transform:"translateY(-50%)",background:sSel?"#2980b9":"#d4a017",borderRadius:"20px",padding:"3px 10px",fontSize:"11px",fontWeight:800,color:sSel?"#fff":"#1a2a3a",cursor:"pointer"}}>
                  {sSel?sSel.nombre:rSel!.nombre} ✕
                </div>
              )}
            </div>
            {query&&!rSel && <button onClick={limpQ} style={{background:"none",border:"none",padding:"0 8px",cursor:"pointer",fontSize:"16px",color:"#9a9a9a"}}>✕</button>}
            <button onClick={()=>setDropOpen(false)} style={{background:"#d4a017",border:"none",padding:"0 18px",cursor:"pointer",fontSize:"16px",color:"#1a2a3a",borderRadius:"0 14px 14px 0",flexShrink:0}}>🔍</button>
          </div>

          {dropOpen && (
            <div ref={dropRef} style={{position:"absolute",top:"calc(100% + 6px)",left:0,right:0,background:"#fff",borderRadius:"14px",boxShadow:"0 8px 32px rgba(0,0,0,0.2)",zIndex:100,maxHeight:"300px",overflowY:"auto",border:"1px solid #e8e8e6"}}>
              {rSel&&sDRubro.length>0 ? (
                <>
                  <div style={{padding:"10px 14px 6px",fontSize:"10px",fontWeight:800,color:"#9a9a9a",textTransform:"uppercase",letterSpacing:"1px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <span>Subrubros de {rSel.nombre}</span>
                    <button onClick={limpQ} style={{background:"none",border:"none",cursor:"pointer",fontSize:"11px",color:"#d4a017",fontWeight:800,fontFamily:"'Nunito',sans-serif"}}>← Todos</button>
                  </div>
                  <div onClick={()=>{setSSel(null);setDropOpen(false);}} style={dItem(false)}>
                    <span>📋</span><div style={{fontSize:"13px",fontWeight:800,color:"#1a2a3a"}}>Todos en {rSel.nombre}</div>
                  </div>
                  {sDRubro.map(s=>(
                    <div key={s.id} onClick={()=>selS(s)} style={dItem(sSel?.id===s.id)}>
                      <span style={{fontSize:"13px"}}>↳</span>
                      <div style={{fontSize:"13px",fontWeight:700,color:"#1a2a3a"}}>{s.nombre}</div>
                    </div>
                  ))}
                </>
              ) : (
                <>
                  {query===""&&<div style={{padding:"10px 14px 4px",fontSize:"10px",fontWeight:800,color:"#9a9a9a",textTransform:"uppercase",letterSpacing:"1px"}}>Todos los rubros</div>}
                  {query!==""&&rFilt.length===0&&sFilt.length===0&&<div style={{padding:"20px",textAlign:"center",fontSize:"13px",color:"#9a9a9a",fontWeight:600}}>Sin resultados para "{query}"</div>}
                  {rFilt.map(r=>(
                    <div key={r.id} onClick={()=>selR(r)} style={dItem(rSel?.id===r.id)}>
                      <span>📂</span>
                      <div style={{flex:1}}>
                        <div style={{fontSize:"13px",fontWeight:800,color:"#1a2a3a"}}>{r.nombre}</div>
                        <div style={{fontSize:"10px",color:"#9a9a9a",fontWeight:600}}>{sFlat.filter(s=>s.rubro_id===r.id).length} subrubros</div>
                      </div>
                      <span style={{fontSize:"12px",color:"#d4a017",fontWeight:800}}>→</span>
                    </div>
                  ))}
                  {query!==""&&sFilt.length>0&&(
                    <>
                      <div style={{padding:"8px 14px 4px",fontSize:"10px",fontWeight:800,color:"#9a9a9a",textTransform:"uppercase",letterSpacing:"1px",borderTop:"1px solid #f0f0f0"}}>Subrubros</div>
                      {sFilt.slice(0,5).map(s=>{
                        const r=rFlat.find(x=>x.id===s.rubro_id);
                        return (
                          <div key={s.id} onClick={()=>selS(s)} style={dItem(false)}>
                            <span style={{fontSize:"13px"}}>↳</span>
                            <div>
                              <div style={{fontSize:"13px",fontWeight:700,color:"#1a2a3a"}}>{s.nombre}</div>
                              {r&&<div style={{fontSize:"10px",color:"#9a9a9a",fontWeight:600}}>en {r.nombre}</div>}
                            </div>
                          </div>
                        );
                      })}
                    </>
                  )}
                </>
              )}
              {query!==""&&(
                <div onClick={()=>setDropOpen(false)} style={{...dItem(false),borderTop:"1px solid #f0f0f0",background:"#f9f7f0"}}>
                  <span>🔍</span>
                  <div>
                    <div style={{fontSize:"13px",fontWeight:800,color:"#d4a017"}}>Buscar "{query}"</div>
                    <div style={{fontSize:"10px",color:"#9a9a9a",fontWeight:600}}>Ver todos los resultados</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* RESULTADOS */}
      {loading ? (
        <div style={{textAlign:"center",padding:"40px",color:"#9a9a9a",fontWeight:700}}>Cargando...</div>
      ) : busLibre ? (
        <div>
          <div style={{padding:"14px 16px 8px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={{fontSize:"14px",fontWeight:900,color:"#1a2a3a"}}>🔍 <span style={{color:"#d4a017"}}>{resTxt.length}</span> resultado{resTxt.length!==1?"s":""} para "{query}"</span>
            <button onClick={limpQ} style={{background:"none",border:"none",fontSize:"12px",fontWeight:700,color:"#9a9a9a",cursor:"pointer",fontFamily:"'Nunito',sans-serif"}}>✕ Limpiar</button>
          </div>
          {resTxt.length===0 ? (
            <div style={{textAlign:"center",padding:"40px 20px"}}>
              <div style={{fontSize:"40px",marginBottom:"12px"}}>🔍</div>
              <div style={{fontSize:"15px",fontWeight:800,color:"#1a2a3a",marginBottom:"6px"}}>Sin resultados</div>
              <div style={{fontSize:"13px",color:"#9a9a9a",fontWeight:600,marginBottom:"20px"}}>No encontramos anuncios para "{query}"</div>
              <button onClick={limpQ} style={{background:"linear-gradient(135deg,#d4a017,#f0c040)",border:"none",borderRadius:"12px",padding:"12px 24px",fontSize:"13px",fontWeight:800,color:"#1a2a3a",cursor:"pointer",fontFamily:"'Nunito',sans-serif"}}>Ver todos</button>
            </div>
          ) : (
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px",padding:"8px 16px 16px"}}>
              {resTxt.map(a=><Tarjeta key={a.id} a={a} fmt={fmt} qLow={qLow} query={query} />)}
            </div>
          )}
        </div>
      ) : (
        rubrosM.map(rubro => {
          const items = getAnus(rubro);
          if (ubiActiva && !rSel && items.length===0) return null;
          return (
            <div key={rubro.id} style={{marginBottom:"8px",background:"#fff",paddingBottom:"12px",borderBottom:"6px solid #f4f4f2"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 16px 8px"}}>
                <span style={{fontSize:"16px",fontWeight:900,color:"#1a2a3a"}}>{rubro.nombre}</span>
                <span style={{fontSize:"12px",fontWeight:700,color:"#d4a017",cursor:"pointer"}}>Ver todos →</span>
              </div>
              <div style={{display:"flex",gap:"8px",padding:"0 16px 12px",overflowX:"auto",scrollbarWidth:"none"}}>
                {rubro.subrubros.map(sub=>(
                  <button key={sub.id} onClick={()=>togSub(rubro.id,sub.id)} style={{background:subAct[rubro.id]===sub.id?"#1a2a3a":"#f4f4f2",border:`2px solid ${subAct[rubro.id]===sub.id?"#1a2a3a":"#e8e8e6"}`,borderRadius:"20px",padding:"5px 14px",fontSize:"12px",fontWeight:700,color:subAct[rubro.id]===sub.id?"#d4a017":"#2c2c2e",whiteSpace:"nowrap",cursor:"pointer",flexShrink:0,fontFamily:"'Nunito',sans-serif"}}>
                    {sub.nombre}
                  </button>
                ))}
              </div>
              {items.length===0 ? (
                <div style={{padding:"12px 16px",color:"#9a9a9a",fontSize:"13px",fontWeight:600}}>Sin anuncios{ubiActiva?` en ${barrSel||ciudSel||provSel}`:""}</div>
              ) : (
                <div style={{display:"flex",gap:"12px",padding:"0 16px",overflowX:"auto",scrollbarWidth:"none"}}>
                  {items.map(a=><Tarjeta key={a.id} a={a} fmt={fmt} horizontal />)}
                </div>
              )}
            </div>
          );
        })
      )}
      <BottomNav />
    </main>
  );
}

function SelUbi({value,placeholder,opciones,onChange}:{value:string;placeholder:string;opciones:string[];onChange:(v:string)=>void}) {
  const [open,  setOpen]  = useState(false);
  const [filtro,setFiltro]= useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(()=>{
    const h=(e:MouseEvent)=>{ if(ref.current&&!ref.current.contains(e.target as Node)){setOpen(false);setFiltro("");} };
    document.addEventListener("mousedown",h);
    return ()=>document.removeEventListener("mousedown",h);
  },[]);

  const lista = opciones.filter(o=>o.toLowerCase().includes(filtro.toLowerCase()));

  return (
    <div ref={ref} style={{flex:1,position:"relative",minWidth:0}}>
      <button onClick={()=>{setOpen(v=>!v);setFiltro("");}} style={{width:"100%",height:"42px",background:value?"#d4a017":"rgba(255,255,255,0.12)",border:`2px solid ${value?"#d4a017":"rgba(255,255,255,0.3)"}`,borderRadius:"12px",padding:"0 10px",fontSize:"12px",fontWeight:800,color:value?"#1a2a3a":"#fff",cursor:"pointer",fontFamily:"'Nunito',sans-serif",display:"flex",alignItems:"center",justifyContent:"space-between",gap:"4px",overflow:"hidden"}}>
        <span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{value||placeholder}</span>
        <span style={{fontSize:"10px",opacity:0.7,flexShrink:0}}>{open?"▲":"▼"}</span>
      </button>
      {open&&(
        <div style={{position:"absolute",top:"calc(100% + 4px)",left:0,right:0,zIndex:300,background:"#fff",borderRadius:"12px",boxShadow:"0 8px 32px rgba(0,0,0,0.25)",border:"1px solid #e8e8e6",maxHeight:"260px",display:"flex",flexDirection:"column",overflow:"hidden"}}>
          <div style={{padding:"8px",borderBottom:"1px solid #f0f0f0",flexShrink:0}}>
            <input autoFocus type="text" value={filtro} onChange={e=>setFiltro(e.target.value)} placeholder="Buscar..."
              style={{width:"100%",border:"2px solid #e8e8e6",borderRadius:"8px",padding:"7px 10px",fontSize:"13px",fontFamily:"'Nunito',sans-serif",outline:"none",boxSizing:"border-box",color:"#1a2a3a"}} />
          </div>
          <div style={{overflowY:"auto",flex:1}}>
            {value&&(
              <div onClick={()=>{onChange("");setOpen(false);setFiltro("");}} style={{padding:"10px 14px",fontSize:"12px",fontWeight:700,color:"#e74c3c",cursor:"pointer",borderBottom:"1px solid #f9f9f9"}}>
                ✕ Limpiar
              </div>
            )}
            {lista.length===0
              ? <div style={{padding:"16px",textAlign:"center",fontSize:"13px",color:"#9a9a9a"}}>Sin resultados</div>
              : lista.map(o=>(
                  <div key={o} onClick={()=>{onChange(o);setOpen(false);setFiltro("");}}
                    style={{padding:"10px 14px",fontSize:"13px",fontWeight:o===value?800:600,color:o===value?"#d4a017":"#1a2a3a",background:o===value?"rgba(212,160,23,0.08)":"transparent",cursor:"pointer",borderLeft:o===value?"3px solid #d4a017":"3px solid transparent"}}>
                    {o}
                  </div>
                ))
            }
          </div>
        </div>
      )}
    </div>
  );
}

function Tarjeta({a,fmt,qLow,query,horizontal}:{a:Anuncio;fmt:(p:number,m:string)=>string;qLow?:string;query?:string;horizontal?:boolean}) {
  const f = F[a.fuente]||F.nexonet;
  return (
    <a href={`/anuncios/${a.id}`} style={{textDecoration:"none",flexShrink:horizontal?0:undefined,width:horizontal?"160px":undefined}}>
      <div style={{background:"#fff",borderRadius:"14px",overflow:"hidden",boxShadow:"0 2px 10px rgba(0,0,0,0.08)",border:"1px solid #f0f0f0"}}>
        <div style={{background:f.color,padding:"3px 8px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{fontSize:"9px",fontWeight:900,color:f.texto,textTransform:"uppercase"}}>{f.label}</span>
          {a.flash&&<span style={{background:"#1a2a3a",color:"#d4a017",fontSize:"8px",fontWeight:900,padding:"1px 5px",borderRadius:"5px"}}>⚡Flash</span>}
        </div>
        <div style={{width:"100%",height:"110px",background:"#f4f4f2",display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden"}}>
          {a.imagenes?.[0]?<img src={a.imagenes[0]} alt={a.titulo} style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<span style={{fontSize:"36px"}}>📦</span>}
        </div>
        <div style={{padding:"8px 10px 10px"}}>
          <div style={{fontSize:"12px",fontWeight:800,color:"#2c2c2e",marginBottom:"3px",overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>
            {qLow&&query
              ? a.titulo.split(new RegExp(`(${query})`, "gi")).map((p:string,i:number)=>
                  p.toLowerCase()===qLow?<mark key={i} style={{background:"#fff3cd",color:"#1a2a3a",borderRadius:"3px",padding:"0 2px"}}>{p}</mark>:p)
              : a.titulo}
          </div>
          <div style={{fontSize:"14px",fontWeight:900,color:"#d4a017"}}>{fmt(a.precio,a.moneda)}</div>
          <div style={{fontSize:"11px",color:"#9a9a9a",fontWeight:600,marginTop:"2px"}}>📍 {a.ciudad}</div>
        </div>
      </div>
    </a>
  );
}

const dItem=(activo:boolean):React.CSSProperties=>({display:"flex",alignItems:"center",gap:"12px",padding:"12px 14px",cursor:"pointer",background:activo?"rgba(212,160,23,0.08)":"transparent",borderLeft:activo?"3px solid #d4a017":"3px solid transparent"});
