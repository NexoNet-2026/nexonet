"use client";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { supabase } from "@/lib/supabase";

const MapaLeaflet = dynamic(() => import("@/components/MapaLeaflet"), { ssr: false });

type Anuncio = { id:number; titulo:string; precio:number; moneda:string; rubro:string; imagenes:string[]; lat:number; lng:number; ciudad:string; provincia:string; flash:boolean; subrubro_id:number };
type RubroFlat = { id:number; nombre:string };
type SubrubroFlat = { id:number; nombre:string; rubro_id:number };

export default function Mapa() {
  const [anuncios,    setAnuncios]    = useState<Anuncio[]>([]);
  const [rFlat,       setRFlat]       = useState<RubroFlat[]>([]);
  const [sFlat,       setSFlat]       = useState<SubrubroFlat[]>([]);
  const [rSel,        setRSel]        = useState<RubroFlat|null>(null);
  const [sSel,        setSSel]        = useState<SubrubroFlat|null>(null);
  const [query,       setQuery]       = useState("");
  const [dropOpen,    setDropOpen]    = useState(false);
  const [anuncioSel,  setAnuncioSel]  = useState<Anuncio|null>(null);
  const [loading,     setLoading]     = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropRef  = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.all([
      supabase.from("rubros").select("id,nombre,subrubros(id,nombre)").order("nombre"),
      supabase.from("anuncios")
        .select("id,titulo,precio,moneda,imagenes,flash,ciudad,provincia,lat,lng,subrubro_id")
        .eq("estado","activo").not("lat","is",null).not("lng","is",null),
    ]).then(([{data:rData},{data:aData}]) => {
      if (rData) {
        setRFlat(rData.map((r:any) => ({id:r.id,nombre:r.nombre})));
        setSFlat(rData.flatMap((r:any) => (r.subrubros||[]).map((s:any) => ({id:s.id,nombre:s.nombre,rubro_id:r.id}))));
      }
      if (aData) setAnuncios((aData as any[]).map(a => ({ ...a, rubro: "Otros", moneda: a.moneda || "ARS", imagenes: a.imagenes || [], flash: a.flash || false })));
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    const h = (e:MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node) &&
          inputRef.current && !inputRef.current.contains(e.target as Node))
        setDropOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const qLow   = query.toLowerCase();
  const rFilt  = rFlat.filter(r => r.nombre.toLowerCase().includes(qLow));
  const sFilt  = sFlat.filter(s => s.nombre.toLowerCase().includes(qLow));
  const sDRubro = rSel ? sFlat.filter(s => s.rubro_id===rSel.id) : [];

  const limpQ = () => { setQuery(""); setRSel(null); setSSel(null); setDropOpen(false); };
  const selR  = (r:RubroFlat)    => { setRSel(r); setSSel(null); setQuery(r.nombre); setDropOpen(false); };
  const selS  = (s:SubrubroFlat) => { setRSel(rFlat.find(r=>r.id===s.rubro_id)||null); setSSel(s); setQuery(s.nombre); setDropOpen(false); };

  const anunciosFiltrados = anuncios.filter(a => {
    if (sSel) return a.subrubro_id === sSel.id;
    if (rSel) return sFlat.filter(s=>s.rubro_id===rSel.id).map(s=>s.id).includes(a.subrubro_id);
    return true;
  });

  const fmt = (p:number,m:string) => !p ? "Consultar" : `${m==="USD"?"U$D":"$"} ${p.toLocaleString("es-AR")}`;

  return (
    <div style={{fontFamily:"'Nunito',sans-serif"}}>
      <Header />

      {/* BARRA BUSCADOR */}
      <div style={{position:"fixed",top:"100px",left:0,right:0,background:"linear-gradient(135deg,#1a2a3a,#243b55)",padding:"10px 16px",zIndex:99}}>
        <div style={{position:"relative"}}>
          <div style={{display:"flex",background:"#fff",borderRadius:"14px",boxShadow:"0 2px 8px rgba(0,0,0,0.2)",position:"relative",zIndex:10}}>
            <div style={{flex:1,position:"relative"}}>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e=>{setQuery(e.target.value);setRSel(null);setSSel(null);setDropOpen(true);}}
                onFocus={()=>setDropOpen(true)}
                placeholder="Filtrar por rubro o subrubro..."
                style={{width:"100%",border:"none",padding:"11px 16px",fontFamily:"'Nunito',sans-serif",fontSize:"14px",color:"#2c2c2e",outline:"none",background:"transparent",boxSizing:"border-box",borderRadius:"14px 0 0 14px"}}
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
            <div ref={dropRef} style={{position:"absolute",top:"calc(100% + 6px)",left:0,right:0,background:"#fff",borderRadius:"14px",boxShadow:"0 8px 32px rgba(0,0,0,0.2)",zIndex:200,maxHeight:"280px",overflowY:"auto",border:"1px solid #e8e8e6"}}>
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
            </div>
          )}
        </div>
      </div>

      {/* MAPA */}
      <div style={{position:"fixed",top:"158px",left:0,right:0,bottom:"130px"}}>
        {loading ? (
          <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100%",background:"#f4f4f2",fontSize:"14px",fontWeight:700,color:"#9a9a9a"}}>
            Cargando anuncios...
          </div>
        ) : (
          <MapaLeaflet anuncios={anunciosFiltrados as any} onSeleccionar={(a:any) => setAnuncioSel(a)} />
        )}

        {/* POPUP */}
        {anuncioSel && (
          <div style={{position:"absolute",bottom:"56px",left:"50%",transform:"translateX(-50%)",background:"#fff",borderRadius:"16px",padding:"14px 18px",boxShadow:"0 8px 30px rgba(0,0,0,0.2)",zIndex:1000,minWidth:"260px",maxWidth:"90vw",display:"flex",alignItems:"center",gap:"12px"}}>
            <div style={{width:"52px",height:"52px",borderRadius:"10px",overflow:"hidden",flexShrink:0,background:"#f4f4f2",display:"flex",alignItems:"center",justifyContent:"center"}}>
              {anuncioSel.imagenes?.[0]
                ? <img src={anuncioSel.imagenes[0]} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                : <span style={{fontSize:"28px"}}>📦</span>}
            </div>
            <div style={{flex:1}}>
              <div style={{fontSize:"14px",fontWeight:800,color:"#1a2a3a"}}>{anuncioSel.titulo}</div>
              <div style={{fontSize:"16px",fontWeight:900,color:"#d4a017"}}>{fmt(anuncioSel.precio,anuncioSel.moneda)}</div>
              <div style={{fontSize:"11px",color:"#9a9a9a",fontWeight:600}}>📍 {anuncioSel.ciudad}{anuncioSel.provincia?`, ${anuncioSel.provincia}`:""}</div>
            </div>
            {anuncioSel.flash && <div style={{background:"#d4a017",color:"#1a2a3a",fontSize:"9px",fontWeight:900,padding:"3px 7px",borderRadius:"8px",textTransform:"uppercase",alignSelf:"flex-start"}}>⚡Flash</div>}
            <div style={{display:"flex",flexDirection:"column",gap:"4px",alignSelf:"flex-start"}}>
              <button onClick={()=>setAnuncioSel(null)} style={{background:"none",border:"none",fontSize:"16px",cursor:"pointer",color:"#9a9a9a"}}>✕</button>
              <a href={`/anuncios/${anuncioSel.id}`} style={{background:"#d4a017",color:"#1a2a3a",border:"none",borderRadius:"8px",padding:"4px 8px",fontSize:"11px",fontWeight:800,textDecoration:"none",textAlign:"center"}}>Ver →</a>
            </div>
          </div>
        )}

        {/* CONTADOR */}
        <div style={{position:"absolute",bottom:0,left:0,right:0,background:"#fff",padding:"8px 16px",display:"flex",justifyContent:"space-between",alignItems:"center",borderTop:"1px solid #e8e8e6",zIndex:999}}>
          <span style={{fontSize:"13px",fontWeight:700,color:"#666"}}>
            📍 {anunciosFiltrados.length} anuncio{anunciosFiltrados.length!==1?"s":""} en el mapa
          </span>
          <a href="/buscar" style={{fontSize:"12px",fontWeight:700,color:"#d4a017",textDecoration:"none"}}>Ver en lista →</a>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}

const dItem=(activo:boolean):React.CSSProperties=>({display:"flex",alignItems:"center",gap:"12px",padding:"12px 14px",cursor:"pointer",background:activo?"rgba(212,160,23,0.08)":"transparent",borderLeft:activo?"3px solid #d4a017":"3px solid transparent"});
