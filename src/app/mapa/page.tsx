"use client";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { supabase } from "@/lib/supabase";
import PopupCompra, { MetodoPago } from "@/components/PopupCompra";

const MapaLeaflet = dynamic(() => import("@/components/MapaLeaflet"), { ssr: false });

type Anuncio = { id:number; titulo:string; precio:number; moneda:string; rubro:string; imagenes:string[]; lat:number; lng:number; ciudad:string; provincia:string; flash:boolean; subrubro_id:number; usuario_id:string };
type RubroFlat = { id:number; nombre:string };
type SubrubroFlat = { id:number; nombre:string; rubro_id:number };

function MapaInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paramLat = searchParams.get("lat");
  const paramLng = searchParams.get("lng");
  const paramId  = searchParams.get("id");

  const [anuncios,      setAnuncios]      = useState<Anuncio[]>([]);
  const [rFlat,         setRFlat]         = useState<RubroFlat[]>([]);
  const [sFlat,         setSFlat]         = useState<SubrubroFlat[]>([]);
  const [rSel,          setRSel]          = useState<RubroFlat|null>(null);
  const [sSel,          setSSel]          = useState<SubrubroFlat|null>(null);
  const [query,         setQuery]         = useState("");
  const [dropOpen,      setDropOpen]      = useState(false);
  const [anuncioSel,    setAnuncioSel]    = useState<Anuncio|null>(null);
  const [loading,       setLoading]       = useState(true);
  const [centroMapa,    setCentroMapa]    = useState<[number,number]|null>(
    paramLat && paramLng ? [parseFloat(paramLat), parseFloat(paramLng)] : null
  );
  const inputRef = useRef<HTMLInputElement>(null);
  const dropRef  = useRef<HTMLDivElement>(null);

  const [session,        setSession]        = useState<any>(null);
  const [bits,           setBits]           = useState(0);
  const [bitsPromo,      setBitsPromo]      = useState(0);
  const [bitsFree,       setBitsFree]       = useState(0);
  const [modoConexion,   setModoConexion]   = useState(false);
  const [seleccionados,  setSeleccionados]  = useState<Set<number>>(new Set());
  const [conectando,     setConectando]     = useState(false);
  const [resultadoConex, setResultadoConex] = useState<string|null>(null);
  const [popupConexion,  setPopupConexion]  = useState(false);
  const [popupPago,      setPopupPago]      = useState(false);

  const MENSAJES_PRESET = [
    "Hola, estoy interesado/a en tu anuncio. ¿Podemos hablar?",
    "Hola, vi tu publicación y me gustaría más información.",
    "Buen día, ¿el anuncio sigue disponible?",
    "Hola, ¿cuál es el precio final? Estoy listo/a para cerrar.",
  ];
  const [mensajeConexion, setMensajeConexion] = useState(MENSAJES_PRESET[0]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      if (s) supabase.from("usuarios").select("bits,bits_promo,bits_free").eq("id", s.user.id).single()
        .then(({data}) => { if(data) { setBits(data.bits||0); setBitsPromo(data.bits_promo||0); setBitsFree(data.bits_free||0); } });
    });
  }, []);

  useEffect(() => {
    Promise.all([
      supabase.from("rubros").select("id,nombre,subrubros(id,nombre)").order("nombre"),
      supabase.from("anuncios")
        .select("id,titulo,precio,moneda,imagenes,flash,ciudad,provincia,lat,lng,subrubro_id,usuario_id")
        .eq("estado","activo").not("lat","is",null).not("lng","is",null),
    ]).then(([{data:rData},{data:aData}]) => {
      if (rData) {
        setRFlat(rData.map((r:any) => ({id:r.id,nombre:r.nombre})));
        setSFlat(rData.flatMap((r:any) => (r.subrubros||[]).map((s:any) => ({id:s.id,nombre:s.nombre,rubro_id:r.id}))));
      }
      if (aData) {
        const lista = (aData as any[]).map(a=>({
        ...a,
        rubro:"Otros",
        moneda:a.moneda||"ARS",
        imagenes:a.imagenes||[],
        flash:a.flash||false,
        tipo: "anuncio",
      }));
        setAnuncios(lista);
        if (paramId) {
          const target = lista.find((a:any) => String(a.id) === paramId);
          if (target) setAnuncioSel(target);
        }
      }
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    const h = (e:MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node) &&
          inputRef.current && !inputRef.current.contains(e.target as Node)) setDropOpen(false);
    };
    document.addEventListener("mousedown",h); return () => document.removeEventListener("mousedown",h);
  }, []);

  const qLow  = query.toLowerCase();
  const rFilt = rFlat.filter(r => r.nombre.toLowerCase().includes(qLow));
  const sFilt = sFlat.filter(s => s.nombre.toLowerCase().includes(qLow));
  const sDRubro = rSel ? sFlat.filter(s => s.rubro_id===rSel.id) : [];
  const limpQ = () => { setQuery(""); setRSel(null); setSSel(null); setDropOpen(false); };
  const selR  = (r:RubroFlat)    => { setRSel(r); setSSel(null); setQuery(r.nombre); setDropOpen(false); };
  const selS  = (s:SubrubroFlat) => { setRSel(rFlat.find(r=>r.id===s.rubro_id)||null); setSSel(s); setQuery(s.nombre); setDropOpen(false); };

  const anunciosFiltrados = anuncios.filter(a => {
    if (session && a.usuario_id === session?.user.id) return false;
    if (sSel) return a.subrubro_id===sSel.id;
    if (rSel) return sFlat.filter(s=>s.rubro_id===rSel.id).map(s=>s.id).includes(a.subrubro_id);
    return true;
  });

  const fmt = (p:number,m:string) => !p?"Consultar":`${m==="USD"?"U$D":"$"} ${p.toLocaleString("es-AR")}`;

  const toggleSeleccion = (id:number) => {
    const s = new Set(seleccionados);
    s.has(id) ? s.delete(id) : s.add(id);
    setSeleccionados(s);
  };
  const seleccionarTodos   = () => setSeleccionados(new Set(anunciosFiltrados.map(a=>a.id)));
  const deseleccionarTodos = () => setSeleccionados(new Set());
  const todosSelec = anunciosFiltrados.length>0 && seleccionados.size===anunciosFiltrados.length;

  const activarModoConexion = () => {
    if (!session) { router.push("/login"); return; }
    setModoConexion(true); setSeleccionados(new Set()); setAnuncioSel(null);
  };
  const cancelarConexion = () => {
    setModoConexion(false); setSeleccionados(new Set()); setResultadoConex(null);
  };

  const ejecutarConexion = async () => {
    if (seleccionados.size===0) return;
    setConectando(true);
    const ids = Array.from(seleccionados);
    const { data: anuData } = await supabase.from("anuncios").select("id,usuario_id,conexiones").in("id",ids);
    if (anuData) {
      await Promise.all(anuData.map((a:any) => supabase.from("anuncios").update({conexiones:(a.conexiones||0)+1}).eq("id",a.id)));
      await supabase.from("notificaciones").insert(anuData.map((a:any)=>({
        usuario_id:a.usuario_id, emisor_id:session.user.id,
        anuncio_id:a.id, tipo:"conexion", mensaje:mensajeConexion,
      })));
      const nb = bits - ids.length;
      await supabase.from("usuarios").update({bits:nb, bits_gastados_conexion: nb}).eq("id",session.user.id);
      setBits(nb);
    }
    setResultadoConex(`✅ Mensaje enviado a ${ids.length} anuncio${ids.length!==1?"s":""}. Usaste ${ids.length} BIT.`);
    setConectando(false);
    setSeleccionados(new Set());
    setMensajeConexion(MENSAJES_PRESET[0]);
    setTimeout(() => cancelarConexion(), 3000);
  };

  return (
    <div style={{fontFamily:"'Nunito',sans-serif"}}>
      <Header />

      {/* BARRA BUSCADOR */}
      <div style={{position:"fixed",top:"100px",left:0,right:0,background:"linear-gradient(135deg,#1a2a3a,#243b55)",padding:"10px 16px",zIndex:99,display:"flex",flexDirection:"column",gap:"8px"}}>
        <div style={{position:"relative"}}>
          <div style={{display:"flex",background:"#fff",borderRadius:"14px",boxShadow:"0 2px 8px rgba(0,0,0,0.2)",position:"relative",zIndex:10}}>
            <div style={{flex:1,position:"relative"}}>
              <input ref={inputRef} type="text" value={query}
                onChange={e=>{setQuery(e.target.value);setRSel(null);setSSel(null);setDropOpen(true);}}
                onFocus={()=>setDropOpen(true)} placeholder="Filtrar por rubro o subrubro..."
                style={{width:"100%",border:"none",padding:"11px 16px",fontFamily:"'Nunito',sans-serif",fontSize:"14px",color:"#2c2c2e",outline:"none",background:"transparent",boxSizing:"border-box",borderRadius:"14px 0 0 14px"}}
              />
              {(rSel||sSel) && (
                <div onClick={limpQ} style={{position:"absolute",right:"8px",top:"50%",transform:"translateY(-50%)",background:"#d4a017",borderRadius:"20px",padding:"3px 10px",fontSize:"11px",fontWeight:800,color:"#1a2a3a",cursor:"pointer"}}>
                  {sSel?sSel.nombre:rSel!.nombre} ✕
                </div>
              )}
            </div>
            {query&&!rSel && <button onClick={limpQ} style={{background:"none",border:"none",padding:"0 8px",cursor:"pointer",fontSize:"16px",color:"#9a9a9a"}}>✕</button>}
            <button onClick={()=>setDropOpen(false)} style={{background:"#d4a017",border:"none",padding:"0 18px",cursor:"pointer",fontSize:"16px",color:"#1a2a3a",borderRadius:"0 14px 14px 0",flexShrink:0}}>🔍</button>
          </div>
          {dropOpen && (
            <div ref={dropRef} style={{position:"absolute",top:"calc(100% + 6px)",left:0,right:0,background:"#fff",borderRadius:"14px",boxShadow:"0 8px 32px rgba(0,0,0,0.2)",zIndex:200,maxHeight:"280px",overflowY:"auto",border:"1px solid #e8e8e6"}}>
              {rSel&&sDRubro.length>0 ? (<>
                <div style={{padding:"10px 14px 6px",fontSize:"10px",fontWeight:800,color:"#9a9a9a",textTransform:"uppercase",letterSpacing:"1px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span>Subrubros de {rSel.nombre}</span>
                  <button onClick={limpQ} style={{background:"none",border:"none",cursor:"pointer",fontSize:"11px",color:"#d4a017",fontWeight:800,fontFamily:"'Nunito',sans-serif"}}>← Todos</button>
                </div>
                <div onClick={()=>{setSSel(null);setDropOpen(false);}} style={dItem(false)}><span>📋</span><div style={{fontSize:"13px",fontWeight:800,color:"#1a2a3a"}}>Todos en {rSel.nombre}</div></div>
                {sDRubro.map(s=>(<div key={s.id} onClick={()=>selS(s)} style={dItem(sSel?.id===s.id)}><span style={{fontSize:"13px"}}>↳</span><div style={{fontSize:"13px",fontWeight:700,color:"#1a2a3a"}}>{s.nombre}</div></div>))}
              </>) : (<>
                {query===""&&<div style={{padding:"10px 14px 4px",fontSize:"10px",fontWeight:800,color:"#9a9a9a",textTransform:"uppercase",letterSpacing:"1px"}}>Todos los rubros</div>}
                {query!==""&&rFilt.length===0&&sFilt.length===0&&<div style={{padding:"20px",textAlign:"center",fontSize:"13px",color:"#9a9a9a",fontWeight:600}}>Sin resultados para "{query}"</div>}
                {rFilt.map(r=>(<div key={r.id} onClick={()=>selR(r)} style={dItem(rSel?.id===r.id)}><span>📂</span><div style={{flex:1}}><div style={{fontSize:"13px",fontWeight:800,color:"#1a2a3a"}}>{r.nombre}</div><div style={{fontSize:"10px",color:"#9a9a9a",fontWeight:600}}>{sFlat.filter(s=>s.rubro_id===r.id).length} subrubros</div></div><span style={{fontSize:"12px",color:"#d4a017",fontWeight:800}}>→</span></div>))}
                {query!==""&&sFilt.length>0&&(<><div style={{padding:"8px 14px 4px",fontSize:"10px",fontWeight:800,color:"#9a9a9a",textTransform:"uppercase",letterSpacing:"1px",borderTop:"1px solid #f0f0f0"}}>Subrubros</div>
                  {sFilt.slice(0,5).map(s=>{const r=rFlat.find(x=>x.id===s.rubro_id);return(<div key={s.id} onClick={()=>selS(s)} style={dItem(false)}><span style={{fontSize:"13px"}}>↳</span><div><div style={{fontSize:"13px",fontWeight:700,color:"#1a2a3a"}}>{s.nombre}</div>{r&&<div style={{fontSize:"10px",color:"#9a9a9a",fontWeight:600}}>en {r.nombre}</div>}</div></div>);})}</>)}
              </>)}
            </div>
          )}
        </div>

        {session && !modoConexion && (
          <button onClick={activarModoConexion} style={{background:"linear-gradient(135deg,#f0c040,#d4a017)",border:"none",borderRadius:"12px",padding:"8px 16px",display:"flex",flexDirection:"row",alignItems:"center",justifyContent:"space-between",gap:"10px",cursor:"pointer",fontFamily:"'Nunito',sans-serif",boxShadow:"0 4px 0 #a07810",width:"100%"}}>
            <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
              <span style={{fontSize:"15px"}}>🔗</span>
              <span style={{fontSize:"13px",fontWeight:900,color:"#1a2a3a"}}>Conectarme con:</span>
            </div>
            <span style={{background:"rgba(26,42,58,0.18)",borderRadius:"20px",padding:"3px 12px",fontSize:"12px",fontWeight:800,color:"#1a2a3a",whiteSpace:"nowrap"}}>{bits} BIT disponibles</span>
          </button>
        )}
        {modoConexion && (
          <div style={{background:"linear-gradient(135deg,#f0c040,#d4a017)",borderRadius:"12px",padding:"8px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:"8px",boxShadow:"0 4px 0 #a07810"}}>
            <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
              <span style={{fontSize:"15px"}}>🔗</span>
              <span style={{fontSize:"13px",fontWeight:900,color:"#1a2a3a"}}>Conectándome a:</span>
            </div>
            <div style={{display:"flex",gap:"8px",alignItems:"center"}}>
              <button onClick={todosSelec?deseleccionarTodos:seleccionarTodos} style={{background:"#1a2a3a",border:"none",borderRadius:"20px",padding:"4px 14px",fontSize:"12px",fontWeight:900,color:"#d4a017",cursor:"pointer",fontFamily:"'Nunito',sans-serif",whiteSpace:"nowrap"}}>
                {todosSelec?"✕ TODOS":"✅ TODOS"}
              </button>
              <button onClick={cancelarConexion} style={{background:"rgba(26,42,58,0.2)",border:"none",borderRadius:"8px",padding:"4px 10px",fontSize:"14px",fontWeight:900,color:"#1a2a3a",cursor:"pointer",fontFamily:"'Nunito',sans-serif"}}>✕</button>
            </div>
          </div>
        )}
      </div>

      {/* MAPA */}
      <div style={{position:"fixed",top: modoConexion ? "210px" : "178px",left:0,right:0,bottom:modoConexion?"190px":"130px"}}>
        {loading ? (
          <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100%",background:"#f4f4f2",fontSize:"14px",fontWeight:700,color:"#9a9a9a"}}>Cargando anuncios...</div>
        ) : (
          <MapaLeaflet
            anuncios={anunciosFiltrados as any}
            onSeleccionar={(a:any)=>{ if(modoConexion){toggleSeleccion(a.id);}else{setAnuncioSel(a);} }}
            centrarEn={centroMapa}
          />
        )}

        {/* POPUP anuncio seleccionado */}
        {anuncioSel && !modoConexion && (
          <div style={{position:"absolute",bottom:"56px",left:"50%",transform:"translateX(-50%)",background:"#fff",borderRadius:"16px",padding:"14px 18px",boxShadow:"0 8px 30px rgba(0,0,0,0.2)",zIndex:1000,minWidth:"260px",maxWidth:"90vw",display:"flex",alignItems:"center",gap:"12px"}}>
            <div style={{width:"52px",height:"52px",borderRadius:"10px",overflow:"hidden",flexShrink:0,background:"#f4f4f2",display:"flex",alignItems:"center",justifyContent:"center"}}>
              {anuncioSel.imagenes?.[0]?<img src={anuncioSel.imagenes[0]} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<span style={{fontSize:"28px"}}>📦</span>}
            </div>
            <div style={{flex:1}}>
              <div style={{fontSize:"14px",fontWeight:800,color:"#1a2a3a"}}>{anuncioSel.titulo}</div>
              <div style={{fontSize:"16px",fontWeight:900,color:"#d4a017"}}>{fmt(anuncioSel.precio,anuncioSel.moneda)}</div>
              <div style={{fontSize:"11px",color:"#9a9a9a",fontWeight:600}}>📍 {anuncioSel.ciudad}{anuncioSel.provincia?`, ${anuncioSel.provincia}`:""}</div>
            </div>
            {anuncioSel.flash&&<div style={{background:"#d4a017",color:"#1a2a3a",fontSize:"9px",fontWeight:900,padding:"3px 7px",borderRadius:"8px",textTransform:"uppercase",alignSelf:"flex-start"}}>⚡Flash</div>}
            <div style={{display:"flex",flexDirection:"column",gap:"4px",alignSelf:"flex-start"}}>
              <button onClick={()=>setAnuncioSel(null)} style={{background:"none",border:"none",fontSize:"16px",cursor:"pointer",color:"#9a9a9a"}}>✕</button>
              <a href={`/anuncios/${anuncioSel.id}`} style={{background:"#d4a017",color:"#1a2a3a",border:"none",borderRadius:"8px",padding:"4px 8px",fontSize:"11px",fontWeight:800,textDecoration:"none",textAlign:"center"}}>Ver →</a>
              {session && (
                <button onClick={()=>{toggleSeleccion(anuncioSel.id);setModoConexion(true);}} style={{background:"#d4a017",border:"none",borderRadius:"8px",padding:"4px 8px",fontSize:"11px",fontWeight:800,color:"#fff",cursor:"pointer",fontFamily:"'Nunito',sans-serif"}}>🔗</button>
              )}
            </div>
          </div>
        )}

        <div style={{position:"absolute",bottom:0,left:0,right:0,background:"#fff",padding:"8px 16px",display:"flex",justifyContent:"space-between",alignItems:"center",borderTop:"1px solid #e8e8e6",zIndex:999}}>
          <span style={{fontSize:"13px",fontWeight:700,color:"#666"}}>
            📍 {anunciosFiltrados.length} anuncio{anunciosFiltrados.length!==1?"s":""} en el mapa
            {modoConexion && seleccionados.size>0 && <span style={{color:"#d4a017",marginLeft:"8px"}}>· {seleccionados.size} seleccionado{seleccionados.size!==1?"s":""}</span>}
          </span>
          <a href="/buscar" style={{fontSize:"12px",fontWeight:700,color:"#d4a017",textDecoration:"none"}}>Ver en lista →</a>
        </div>
      </div>

      {/* PANEL FLOTANTE CONEXIÓN */}
      {modoConexion && (
        <div style={{position:"fixed",bottom:"110px",left:0,right:0,zIndex:100,padding:"0 16px 12px"}}>
          {resultadoConex ? (
            <div style={{background:"linear-gradient(135deg,#f0c040,#d4a017)",borderRadius:"14px",padding:"14px 18px",textAlign:"center",fontSize:"14px",fontWeight:900,color:"#1a2a3a",boxShadow:"0 4px 0 #a07810"}}>
              {resultadoConex}
            </div>
          ) : (
            <div style={{background:"linear-gradient(135deg,#1a2a3a,#243b55)",borderRadius:"14px",padding:"12px 14px",boxShadow:"0 6px 0 #0a1015",border:"2px solid #d4a017"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"10px"}}>
                <span style={{fontSize:"13px",fontWeight:900,color:"#fff"}}>
                  {seleccionados.size>0?`🔗 ${seleccionados.size} anuncio${seleccionados.size!==1?"s":""}  ·  ${seleccionados.size} BIT`:"Tocá los pines"}
                </span>
                <span style={{background:"rgba(212,160,23,0.2)",borderRadius:"20px",padding:"2px 10px",fontSize:"11px",fontWeight:800,color:"#d4a017",border:"1px solid rgba(212,160,23,0.4)"}}>
                  Tenés {bits} BIT
                </span>
              </div>
              <button
                onClick={()=>{ if(seleccionados.size===0) return; setPopupConexion(true); }}
                disabled={seleccionados.size===0||conectando}
                style={{width:"100%",background:seleccionados.size===0?"rgba(255,255,255,0.06)":"linear-gradient(135deg,#f0c040,#d4a017)",border:"none",borderRadius:"10px",padding:"12px",fontSize:"14px",fontWeight:900,color:seleccionados.size===0?"rgba(255,255,255,0.25)":"#1a2a3a",cursor:seleccionados.size===0?"not-allowed":"pointer",fontFamily:"'Nunito',sans-serif",boxShadow:seleccionados.size===0?"none":"0 4px 0 #a07810"}}
              >
                {conectando?"Conectando...":seleccionados.size>0?`Conectar con ${seleccionados.size} anuncio${seleccionados.size!==1?"s":""} (${seleccionados.size} BIT)`:"Seleccioná pines"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* POPUP MENSAJE — igual que en buscar */}
      {popupConexion && (
        <div style={{position:"fixed",inset:0,zIndex:500,background:"rgba(0,0,0,0.65)",display:"flex",alignItems:"flex-end",padding:"16px"}}>
          <div style={{width:"100%",background:"#fff",borderRadius:"20px 20px 16px 16px",padding:"24px 20px 20px",boxShadow:"0 -8px 40px rgba(0,0,0,0.3)"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"18px"}}>
              <div>
                <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"22px",color:"#1a2a3a",letterSpacing:"1px"}}>🔗 Mensaje de conexión</div>
                <div style={{fontSize:"12px",color:"#9a9a9a",fontWeight:600}}>Se enviará a {seleccionados.size} anuncio{seleccionados.size!==1?"s":""} · {seleccionados.size} BIT</div>
              </div>
              <button onClick={()=>setPopupConexion(false)} style={{background:"#f0f0f0",border:"none",borderRadius:"50%",width:"32px",height:"32px",fontSize:"16px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:"8px",marginBottom:"14px"}}>
              {MENSAJES_PRESET.map((m,i) => (
                <button key={i} onClick={()=>setMensajeConexion(m)} style={{textAlign:"left",background:mensajeConexion===m?"linear-gradient(135deg,#fff8e0,#fff3c0)":"#f8f8f8",border:mensajeConexion===m?"2px solid #d4a017":"2px solid transparent",borderRadius:"12px",padding:"10px 14px",fontSize:"13px",fontWeight:700,color:"#1a2a3a",cursor:"pointer",fontFamily:"'Nunito',sans-serif"}}>
                  {mensajeConexion===m && <span style={{color:"#d4a017",marginRight:"6px"}}>✓</span>}{m}
                </button>
              ))}
            </div>
            <div style={{marginBottom:"16px"}}>
              <div style={{fontSize:"11px",fontWeight:800,color:"#9a9a9a",textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:"6px"}}>✏️ O escribí tu propio mensaje</div>
              <textarea value={mensajeConexion} onChange={e=>setMensajeConexion(e.target.value)} maxLength={200} rows={3}
                style={{width:"100%",borderRadius:"12px",border:"2px solid #e8e8e8",padding:"10px 14px",fontSize:"13px",fontWeight:600,color:"#1a2a3a",fontFamily:"'Nunito',sans-serif",resize:"none",outline:"none",boxSizing:"border-box"}}
                placeholder="Escribí tu mensaje..." />
              <div style={{textAlign:"right",fontSize:"10px",color:"#bbb",fontWeight:600}}>{mensajeConexion.length}/200</div>
            </div>
            <button onClick={()=>{ if(!mensajeConexion.trim()) return; setPopupConexion(false); setPopupPago(true); }} disabled={!mensajeConexion.trim()}
              style={{width:"100%",background:mensajeConexion.trim()?"linear-gradient(135deg,#f0c040,#d4a017)":"#f0f0f0",border:"none",borderRadius:"12px",padding:"14px",fontSize:"15px",fontWeight:900,color:mensajeConexion.trim()?"#1a2a3a":"#bbb",cursor:mensajeConexion.trim()?"pointer":"not-allowed",fontFamily:"'Nunito',sans-serif",boxShadow:mensajeConexion.trim()?"0 4px 0 #a07810":"none"}}>
              🔗 Conectar con anuncio
            </button>
          </div>
        </div>
      )}

      {/* POPUP PAGO */}
      {popupPago && (
        <PopupCompra
          titulo={`Conectar con ${seleccionados.size} anuncio${seleccionados.size!==1?"s":""}`}
          emoji="🔗"
          costo={`${seleccionados.size} BIT`}
          descripcion="Se enviará tu mensaje a los anuncios seleccionados"
          bits={{ free: bitsFree, nexo: bits, promo: bitsPromo }}
          onClose={() => setPopupPago(false)}
          onPagar={async (metodo: MetodoPago) => {
            setPopupPago(false);
            if (metodo === "bit_free" || metodo === "bit_nexo") {
              await ejecutarConexion();
            } else {
              alert("Próximamente — método de pago externo");
            }
          }}
        />
      )}

      <BottomNav />
    </div>
  );
}

export default function Mapa() {
  return (
    <Suspense fallback={<div style={{paddingTop:"95px",textAlign:"center",fontFamily:"'Nunito',sans-serif",color:"#9a9a9a",fontWeight:700}}>Cargando mapa...</div>}>
      <MapaInner />
    </Suspense>
  );
}

const dItem=(activo:boolean):React.CSSProperties=>({display:"flex",alignItems:"center",gap:"12px",padding:"12px 14px",cursor:"pointer",background:activo?"rgba(212,160,23,0.08)":"transparent",borderLeft:activo?"3px solid #d4a017":"3px solid transparent"});
