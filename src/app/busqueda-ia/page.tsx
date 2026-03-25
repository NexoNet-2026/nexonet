"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/lib/supabase";
import AyudaPopup from "@/components/AyudaPopup";


type RubroFlat    = { id:number; nombre:string };
type SubrubroFlat = { id:number; nombre:string; rubro_id:number };
type Prov         = { id:number; nombre:string };
type Ciudad       = { id:number; nombre:string; provincia_id:number };
type TipoNexo     = "anuncio" | "grupo" | "empresa" | "servicio" | "trabajo";

const TIPOS_NEXO: { key:TipoNexo; emoji:string; label:string; color:string }[] = [
  { key:"anuncio",  emoji:"📣", label:"Anuncio",  color:"#d4a017" },
  { key:"grupo",    emoji:"👥", label:"Grupo",    color:"#3a7bd5" },
  { key:"empresa",  emoji:"🏢", label:"Empresa",  color:"#c0392b" },
  { key:"servicio", emoji:"🛠️", label:"Servicio", color:"#27ae60" },
  { key:"trabajo",  emoji:"💼", label:"Trabajo",  color:"#8e44ad" },
];

type Busqueda = {
  id: string;
  tipo_nexo: TipoNexo;
  rubro_id: number | null;
  subrubro_id: number | null;
  precio_min: string;
  precio_max: string;
  moneda: string;
  km_min: string;
  km_max: string;
  anio_min: string;
  anio_max: string;
  dormitorios: string;
  ambientes: string;
  metros_min: string;
  metros_max: string;
  provincia: string;
  ciudad: string;
  keywords: string;
  marca: string;
  permuta: string; // "si" | "no" | ""
  activa: boolean;
  guardando: boolean;
  dbId: string | null;
};

const ANIO_MIN = 1950;
const ANIO_MAX = new Date().getFullYear();
function uid() { return Math.random().toString(36).slice(2); }

function nueva(): Busqueda {
  return {
    id: uid(), tipo_nexo: "anuncio", rubro_id: null, subrubro_id: null,
    precio_min: "", precio_max: "", moneda: "ARS",
    km_min: "", km_max: "", anio_min: "", anio_max: "",
    dormitorios: "", ambientes: "", metros_min: "", metros_max: "",
    provincia: "", ciudad: "", keywords: "",
    marca: "", permuta: "",
    activa: false, guardando: false, dbId: null,
  };
}

export default function BusquedaIA() {
  const router = useRouter();
  const [session,   setSession]   = useState<any>(null);
  const [bits,      setBits]      = useState(0);
  const [rubros,    setRubros]    = useState<RubroFlat[]>([]);
  const [subrubros, setSubrubros] = useState<SubrubroFlat[]>([]);
  const [provs,     setProvs]     = useState<Prov[]>([]);
  const [ciudades,  setCiudades]  = useState<Record<string,Ciudad[]>>({});
  const [busquedas, setBusquedas] = useState<Busqueda[]>([nueva()]);
  const [loading,   setLoading]   = useState(true);
  const [filtrosDinamicos, setFiltrosDinamicos] = useState<Record<number, any[]>>({});

  const cargarFiltrosSubrubro = async (subrubroId: number) => {
    if (filtrosDinamicos[subrubroId]) return;
    const { data } = await supabase
      .from("subrubro_filtros")
      .select("*")
      .eq("subrubro_id", subrubroId)
      .in("contexto", ["busqueda_ia", "ambos"])
      .order("orden");
    if (data) setFiltrosDinamicos(prev => ({ ...prev, [subrubroId]: data }));
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      if (!s) { setLoading(false); return; }
      Promise.all([
        supabase.from("usuarios").select("bits,bits_free,bits_promo").eq("id", s.user.id).single(),
        supabase.from("rubros").select("id,nombre").order("nombre"),
        supabase.from("subrubros").select("id,nombre,rubro_id").order("nombre"),
        supabase.from("provincias").select("id,nombre").order("nombre"),
        supabase.from("busquedas_automaticas").select("*").eq("usuario_id", s.user.id).order("created_at"),
      ]).then(([{ data: u }, { data: r }, { data: s2 }, { data: p }, { data: bData }]) => {
        if (u) setBits(Math.max(0, u.bits||0) + Math.max(0, u.bits_free||0) + Math.max(0, u.bits_promo||0));
        if (r)  setRubros(r.map((x:any) => ({ id:Number(x.id), nombre:x.nombre })));
        if (s2) setSubrubros(s2.map((x:any) => ({ id:Number(x.id), nombre:x.nombre, rubro_id:Number(x.rubro_id) })));
        if (p)  setProvs(p);
        if (bData && bData.length > 0) {
          setBusquedas(bData.map((b:any) => ({
            id: uid(), tipo_nexo: b.tipo_nexo || "anuncio",
            rubro_id: b.rubro_id || null, subrubro_id: b.subrubro_id || null,
            precio_min: b.precio_min?.toString()||"", precio_max: b.precio_max?.toString()||"",
            moneda: b.moneda||"ARS",
            km_min: b.km_min?.toString()||"", km_max: b.km_max?.toString()||"",
            anio_min: b.anio_min?.toString()||"", anio_max: b.anio_max?.toString()||"",
            dormitorios: b.dormitorios?.toString()||"", ambientes: b.ambientes?.toString()||"",
            metros_min: b.metros_min?.toString()||"", metros_max: b.metros_max?.toString()||"",
            provincia: b.provincia||"", ciudad: b.ciudad||"",
            keywords: b.keywords||"",
            marca: b.config?.marca||"", permuta: b.config?.permuta===true?"si":b.config?.permuta===false?"no":"",
            activa: b.activo, guardando: false, dbId: b.id,
            ...(b.config?.filtros_valores || {}),
          })));
        }
        setLoading(false);
      });
    });
  }, []);

  const cargarCiudades = async (prov: string) => {
    if (ciudades[prov]) return;
    const p = provs.find(x => x.nombre===prov); if (!p) return;
    const { data } = await supabase.from("ciudades").select("id,nombre,provincia_id").eq("provincia_id",p.id).order("nombre");
    if (data) setCiudades(prev => ({ ...prev, [prov]: data }));
  };

  const upd = (id:string, field:keyof Busqueda, value:any) =>
    setBusquedas(prev => prev.map(b => b.id===id ? {...b,[field]:value} : b));

  const guardar = async (b:Busqueda) => {
    if (!session) return;
    upd(b.id,"guardando",true);
    const payload: any = {
      usuario_id:  session.user.id,
      tipo_nexo:   b.tipo_nexo,
      subrubro_id: b.subrubro_id,
      precio_min:  b.precio_min  ? parseFloat(b.precio_min)  : null,
      precio_max:  b.precio_max  ? parseFloat(b.precio_max)  : null,
      moneda:      b.moneda,
      km_min:      b.km_min      ? parseInt(b.km_min)        : null,
      km_max:      b.km_max      ? parseInt(b.km_max)        : null,
      anio_min:    b.anio_min    ? parseInt(b.anio_min)      : null,
      anio_max:    b.anio_max    ? parseInt(b.anio_max)      : null,
      dormitorios: b.dormitorios ? parseInt(b.dormitorios)   : null,
      ambientes:   b.ambientes   ? parseInt(b.ambientes)     : null,
      metros_min:  b.metros_min  ? parseFloat(b.metros_min)  : null,
      metros_max:  b.metros_max  ? parseFloat(b.metros_max)  : null,
      provincia:   b.provincia   || null,
      ciudad:      b.ciudad      || null,
      keywords:    b.keywords    || null,
      activo:      b.activa,
      config:      {
        ...(b.marca ? {marca:b.marca} : {}),
        ...(b.permuta==="si" ? {permuta:true} : b.permuta==="no" ? {permuta:false} : {}),
        filtros_valores: Object.fromEntries(
          Object.entries(b).filter(([k,v]) => k.startsWith('filtro_') && v !== '')
        ),
      },
    };
    if (b.dbId) {
      const { error } = await supabase.from("busquedas_automaticas").update(payload).eq("id", b.dbId);
      if (error) { console.error("Error actualizando búsqueda:", error); alert("Error al actualizar la búsqueda: " + error.message); upd(b.id,"guardando",false); return; }
    } else {
      const { data, error } = await supabase.from("busquedas_automaticas").insert(payload).select().single();
      if (error) { console.error("Error guardando búsqueda:", error); alert("Error al guardar la búsqueda: " + error.message); upd(b.id,"guardando",false); return; }
      if (data) upd(b.id,"dbId",data.id);
    }
    upd(b.id,"guardando",false);
  };

  const eliminar = async (b:Busqueda) => {
    if (b.dbId) await supabase.from("busquedas_automaticas").delete().eq("id",b.dbId);
    setBusquedas(prev => prev.filter(x => x.id!==b.id));
  };

  const toggleActiva = async (b:Busqueda) => {
    if (!b.activa && bits<=0) { alert("⚠️ Sin BIT disponibles. Cargá BIT desde la tienda."); return; }
    const nueva = !b.activa;
    upd(b.id,"activa",nueva);
    if (b.dbId) await supabase.from("busquedas_automaticas").update({activo:nueva}).eq("id",b.dbId);
  };

  if (!session && !loading) return (
    <main style={{paddingTop:"95px",fontFamily:"'Nunito',sans-serif",background:"#f4f4f2",minHeight:"100vh"}}>
      <Header/>
      <div style={{textAlign:"center",padding:"60px 24px"}}>
        <div style={{fontSize:"48px",marginBottom:"16px"}}>🤖</div>
        <div style={{fontSize:"18px",fontWeight:900,color:"#1a2a3a",marginBottom:"8px"}}>Búsqueda Inteligente IA</div>
        <div style={{fontSize:"14px",color:"#9a9a9a",fontWeight:600,marginBottom:"24px"}}>Necesitás una cuenta para usar esta función</div>
        <button onClick={()=>router.push("/login")} style={{background:"linear-gradient(135deg,#f0c040,#d4a017)",border:"none",borderRadius:"14px",padding:"14px 32px",fontSize:"15px",fontWeight:900,color:"#1a2a3a",cursor:"pointer",fontFamily:"'Nunito',sans-serif",boxShadow:"0 4px 0 #a07810"}}>
          Iniciar sesión
        </button>
      </div>
      <BottomNav/>
    </main>
  );

  return (
    <main style={{paddingTop:"95px",paddingBottom:"130px",background:"#f4f4f2",minHeight:"100vh",fontFamily:"'Nunito',sans-serif"}}>
      <Header/>

      <div style={{background:"linear-gradient(135deg,#1a2a3a,#243b55)",padding:"16px"}}>
        <button onClick={()=>router.back()} style={{background:"rgba(255,255,255,0.15)",border:"1px solid rgba(255,255,255,0.25)",borderRadius:"10px",padding:"7px 13px",color:"#fff",fontSize:"13px",fontWeight:700,cursor:"pointer",fontFamily:"'Nunito',sans-serif",marginBottom:"10px"}}>← Volver</button>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"8px"}}>
          <div>
            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"24px",color:"#f0c040",letterSpacing:"1px"}}>🤖 Búsqueda Inteligente IA</div>
            <div style={{fontSize:"12px",color:"#8a9aaa",fontWeight:600}}>Te avisamos cuando aparezca lo que buscás</div>
          </div>
          <div style={{background:"rgba(22,160,133,0.2)",border:"1px solid rgba(22,160,133,0.5)",borderRadius:"20px",padding:"6px 14px",textAlign:"center"}}>
            <div style={{fontSize:"18px",fontWeight:900,color:"#1abc9c"}}>{bits.toLocaleString()}</div>
            <div style={{fontSize:"9px",fontWeight:800,color:"#8a9aaa",textTransform:"uppercase",letterSpacing:"0.5px"}}>BIT disponibles</div>
          </div>
        </div>
        {bits<=0 && (
          <div style={{background:"rgba(230,57,70,0.15)",border:"1px solid rgba(230,57,70,0.3)",borderRadius:"10px",padding:"8px 12px",display:"flex",alignItems:"center",gap:"8px"}}>
            <span>⚠️</span>
            <span style={{fontSize:"12px",fontWeight:700,color:"#e63946"}}>Sin BIT disponibles — las búsquedas no se activarán</span>
            <button onClick={()=>router.push("/tienda")} style={{marginLeft:"auto",background:"#e63946",border:"none",borderRadius:"8px",padding:"4px 10px",fontSize:"11px",fontWeight:900,color:"#fff",cursor:"pointer",fontFamily:"'Nunito',sans-serif",whiteSpace:"nowrap"}}>
              Cargar BIT
            </button>
          </div>
        )}
      </div>

      <div style={{padding:"16px",display:"flex",flexDirection:"column",gap:"16px"}}>
        {loading ? (
          <div style={{textAlign:"center",padding:"40px",color:"#9a9a9a",fontWeight:700}}>Cargando...</div>
        ) : (
          busquedas.map((b,idx) => (
            <TarjetaBusqueda key={b.id} b={b} idx={idx}
              rubros={rubros} subrubros={subrubros} provs={provs}
              ciudades={ciudades[b.provincia]||[]} bits={bits}
              filtrosDinamicos={filtrosDinamicos}
              onCargarCiudades={cargarCiudades}
              onCargarFiltros={cargarFiltrosSubrubro}
              onUpd={upd} onGuardar={guardar} onEliminar={eliminar} onToggleActiva={toggleActiva}
            />
          ))
        )}
        <button onClick={()=>{ setBusquedas(prev=>[...prev,nueva()]); setTimeout(()=>window.scrollTo({top:document.body.scrollHeight,behavior:"smooth"}),100); }}
          style={{display:"flex",alignItems:"center",justifyContent:"center",gap:"10px",background:"#fff",border:"3px dashed #d4a017",borderRadius:"16px",padding:"18px",cursor:"pointer",fontFamily:"'Nunito',sans-serif",width:"100%"}}>
          <div style={{width:"36px",height:"36px",borderRadius:"50%",background:"linear-gradient(135deg,#f0c040,#d4a017)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"22px",fontWeight:900,color:"#1a2a3a",boxShadow:"0 3px 0 #a07810"}}>+</div>
          <span style={{fontSize:"14px",fontWeight:900,color:"#d4a017"}}>Agregar nueva búsqueda</span>
        </button>
      </div>
      <AyudaPopup tipo="busqueda_ia"/>
      <BottomNav/>
    </main>
  );
}

function TarjetaBusqueda({ b, idx, rubros, subrubros, provs, ciudades, bits,
  filtrosDinamicos, onCargarCiudades, onCargarFiltros, onUpd, onGuardar, onEliminar, onToggleActiva }: {
  b:Busqueda; idx:number; rubros:RubroFlat[]; subrubros:SubrubroFlat[];
  provs:Prov[]; ciudades:Ciudad[]; bits:number;
  filtrosDinamicos:Record<number, any[]>;
  onCargarCiudades:(p:string)=>void;
  onCargarFiltros:(id:number)=>void;
  onUpd:(id:string,field:keyof Busqueda,value:any)=>void;
  onGuardar:(b:Busqueda)=>void;
  onEliminar:(b:Busqueda)=>void;
  onToggleActiva:(b:Busqueda)=>void;
}) {
  const sinBits = bits<=0;
  const subsDe  = b.rubro_id ? subrubros.filter(s=>s.rubro_id===b.rubro_id) : [];
  const tipoInfo = TIPOS_NEXO.find(t=>t.key===b.tipo_nexo)!;

  return (
    <div style={{background:"#fff",borderRadius:"16px",boxShadow:"0 2px 12px rgba(0,0,0,0.08)",overflow:"hidden",border:b.activa?`2px solid ${tipoInfo.color}`:"2px solid transparent"}}>

      {/* HEADER */}
      <div style={{background:b.activa?`linear-gradient(135deg,${tipoInfo.color}cc,${tipoInfo.color})`:"linear-gradient(135deg,#1a2a3a,#243b55)",padding:"12px 16px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
          <div style={{width:"28px",height:"28px",borderRadius:"50%",background:"rgba(255,255,255,0.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"13px",fontWeight:900,color:"#fff"}}>
            {idx+1}
          </div>
          <div>
            <div style={{fontSize:"13px",fontWeight:900,color:"#fff"}}>
              {tipoInfo.emoji} {b.keywords||`Búsqueda ${idx+1}`}
            </div>
            <div style={{fontSize:"10px",color:"rgba(255,255,255,0.6)",fontWeight:600}}>
              {b.activa?"🟢 Activa":"⭕ Inactiva"}
            </div>
          </div>
        </div>
        <button onClick={()=>onEliminar(b)} style={{background:"rgba(230,57,70,0.2)",border:"1px solid rgba(230,57,70,0.4)",borderRadius:"8px",padding:"5px 10px",fontSize:"12px",fontWeight:900,color:"#e63946",cursor:"pointer",fontFamily:"'Nunito',sans-serif"}}>
          🗑️
        </button>
      </div>

      {/* Badges de filtros activos */}
      {b.dbId && (b.precio_min||b.precio_max||b.anio_min||b.anio_max||b.km_min||b.km_max||b.marca||b.permuta) && (
        <div style={{padding:"8px 16px 0",display:"flex",gap:"6px",flexWrap:"wrap"}}>
          {(b.precio_min||b.precio_max) && <span style={{background:"rgba(212,160,23,0.15)",border:"1px solid rgba(212,160,23,0.3)",borderRadius:"20px",padding:"3px 10px",fontSize:"10px",fontWeight:800,color:"#d4a017"}}>💰 {b.moneda==="USD"?"U$":"$"}{b.precio_min||"0"} - {b.moneda==="USD"?"U$":"$"}{b.precio_max||"∞"}</span>}
          {(b.anio_min||b.anio_max) && <span style={{background:"rgba(58,123,213,0.12)",border:"1px solid rgba(58,123,213,0.3)",borderRadius:"20px",padding:"3px 10px",fontSize:"10px",fontWeight:800,color:"#3a7bd5"}}>📅 {b.anio_min||"?"}-{b.anio_max||"?"}</span>}
          {(b.km_min||b.km_max) && <span style={{background:"rgba(39,174,96,0.12)",border:"1px solid rgba(39,174,96,0.3)",borderRadius:"20px",padding:"3px 10px",fontSize:"10px",fontWeight:800,color:"#27ae60"}}>🚗 {b.km_min?`${Number(b.km_min).toLocaleString()}km`:"0"} - {b.km_max?`${Number(b.km_max).toLocaleString()}km`:"∞"}</span>}
          {b.marca && <span style={{background:"rgba(142,68,173,0.12)",border:"1px solid rgba(142,68,173,0.3)",borderRadius:"20px",padding:"3px 10px",fontSize:"10px",fontWeight:800,color:"#8e44ad"}}>🏷️ {b.marca}</span>}
          {b.permuta==="si" && <span style={{background:"rgba(230,126,34,0.12)",border:"1px solid rgba(230,126,34,0.3)",borderRadius:"20px",padding:"3px 10px",fontSize:"10px",fontWeight:800,color:"#e67e22"}}>🔄 Permuta</span>}
          {b.permuta==="no" && <span style={{background:"rgba(231,76,60,0.12)",border:"1px solid rgba(231,76,60,0.3)",borderRadius:"20px",padding:"3px 10px",fontSize:"10px",fontWeight:800,color:"#e74c3c"}}>🔄 Sin permuta</span>}
        </div>
      )}

      <div style={{padding:"14px 16px",display:"flex",flexDirection:"column",gap:"14px"}}>

        {/* TIPO DE NEXO */}
        <div>
          <L>🗂️ Tipo de publicación</L>
          <div style={{display:"flex",gap:"8px",flexWrap:"wrap"}}>
            {TIPOS_NEXO.map(t=>(
              <button key={t.key} onClick={()=>{ onUpd(b.id,"tipo_nexo",t.key); onUpd(b.id,"rubro_id",null); onUpd(b.id,"subrubro_id",null); }}
                style={{flex:"0 0 auto",background:b.tipo_nexo===t.key?t.color:"#f4f4f2",
                         border:`2px solid ${b.tipo_nexo===t.key?t.color:"#e8e8e6"}`,
                         borderRadius:"20px",padding:"6px 14px",fontSize:"12px",fontWeight:800,
                         color:b.tipo_nexo===t.key?"#fff":"#666",cursor:"pointer",
                         fontFamily:"'Nunito',sans-serif",display:"flex",alignItems:"center",gap:"5px"}}>
                {t.emoji} {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* RUBRO — solo para anuncios */}
        {b.tipo_nexo === "anuncio" && (
          <div>
            <L>📂 Rubro</L>
            <select value={b.rubro_id||""} onChange={e=>{
              onUpd(b.id,"rubro_id",e.target.value?parseInt(e.target.value):null);
              onUpd(b.id,"subrubro_id",null);
            }} style={IS}>
              <option value="">— Todos los rubros —</option>
              {rubros.map(r=><option key={r.id} value={r.id}>{r.nombre}</option>)}
            </select>
          </div>
        )}

        {/* SUBRUBRO */}
        {b.tipo_nexo === "anuncio" && b.rubro_id && subsDe.length>0 && (
          <div>
            <L>📋 Subrubro</L>
            <select value={b.subrubro_id||""} onChange={e=>{
              onUpd(b.id,"subrubro_id",e.target.value?parseInt(e.target.value):null);
              if (e.target.value) onCargarFiltros(parseInt(e.target.value));
            }} style={IS}>
              <option value="">— Todos —</option>
              {subsDe.map(s=><option key={s.id} value={s.id}>{s.nombre}</option>)}
            </select>
          </div>
        )}

        {/* PALABRAS CLAVE */}
        <div>
          <L>🔍 Palabras clave</L>
          <input value={b.keywords} onChange={e=>onUpd(b.id,"keywords",e.target.value)}
            placeholder={
              b.tipo_nexo==="anuncio" ? "Ej: toyota corolla automático" :
              b.tipo_nexo==="grupo"   ? "Ej: emprendimiento rosario" :
              b.tipo_nexo==="trabajo" ? "Ej: diseñador gráfico" :
              "Palabras que debe contener..."
            }
            style={IS}/>
          <div style={{fontSize:"10px",color:"#9a9a9a",fontWeight:600,marginTop:"4px"}}>
            Separadas por espacio — todas deben aparecer en la publicación
          </div>
        </div>

        {/* ── FILTROS DINÁMICOS DEL SUBRUBRO ── */}
        {b.tipo_nexo==="anuncio" && b.subrubro_id && (filtrosDinamicos[b.subrubro_id]||[]).length > 0 && (
          <div style={{background:"rgba(26,42,58,0.04)",border:"1px solid rgba(26,42,58,0.1)",borderRadius:"12px",padding:"12px 14px",display:"flex",flexDirection:"column",gap:"12px"}}>
            <div style={{fontSize:"11px",fontWeight:800,color:"#1a2a3a",textTransform:"uppercase",letterSpacing:"0.5px"}}>
              🔧 Filtros específicos
            </div>
            {(filtrosDinamicos[b.subrubro_id]||[]).map((f:any) => (
              <div key={f.id}>
                <L>{f.nombre}</L>
                {(f.tipo==="rango") && (
                  <div style={{display:"flex",gap:"8px",alignItems:"center"}}>
                    <input placeholder="Desde" type="number"
                      value={(b as any)[`filtro_${f.id}_min`]||""}
                      onChange={e=>onUpd(b.id,`filtro_${f.id}_min` as any,e.target.value)}
                      style={{...IS,flex:1}}/>
                    <span style={{color:"#9a9a9a",fontWeight:800}}>—</span>
                    <input placeholder="Hasta" type="number"
                      value={(b as any)[`filtro_${f.id}_max`]||""}
                      onChange={e=>onUpd(b.id,`filtro_${f.id}_max` as any,e.target.value)}
                      style={{...IS,flex:1}}/>
                  </div>
                )}
                {(f.tipo==="numero") && (
                  <input placeholder={f.nombre} type="number"
                    value={(b as any)[`filtro_${f.id}`]||""}
                    onChange={e=>onUpd(b.id,`filtro_${f.id}` as any,e.target.value)}
                    style={IS}/>
                )}
                {(f.tipo==="texto") && (
                  <input placeholder={`Ej: ${f.nombre}...`}
                    value={(b as any)[`filtro_${f.id}`]||""}
                    onChange={e=>onUpd(b.id,`filtro_${f.id}` as any,e.target.value)}
                    style={IS}/>
                )}
                {(f.tipo==="boolean") && (
                  <div style={{display:"flex",gap:"8px"}}>
                    {[{v:"",l:"Indiferente"},{v:"si",l:"Sí"},{v:"no",l:"No"}].map(op=>(
                      <button key={op.v}
                        onClick={()=>onUpd(b.id,`filtro_${f.id}` as any,op.v)}
                        style={{flex:1,background:(b as any)[`filtro_${f.id}`]===op.v?"#1a2a3a":"#f4f4f2",
                          border:`2px solid ${(b as any)[`filtro_${f.id}`]===op.v?"#1a2a3a":"#e8e8e6"}`,
                          borderRadius:"10px",padding:"8px",fontSize:"12px",fontWeight:800,
                          color:(b as any)[`filtro_${f.id}`]===op.v?"#d4a017":"#666",
                          cursor:"pointer",fontFamily:"'Nunito',sans-serif"}}>
                        {op.l}
                      </button>
                    ))}
                  </div>
                )}
                {(f.tipo==="opciones") && (
                  <select value={(b as any)[`filtro_${f.id}`]||""}
                    onChange={e=>onUpd(b.id,`filtro_${f.id}` as any,e.target.value)}
                    style={IS}>
                    <option value="">— Cualquiera —</option>
                    {(Array.isArray(f.opciones)?f.opciones:[]).map((op:string)=>(
                      <option key={op} value={op}>{op}</option>
                    ))}
                  </select>
                )}
              </div>
            ))}
          </div>
        )}

        {/* UBICACIÓN */}
        <div>
          <L>📍 Ubicación</L>
          <div style={{display:"flex",gap:"8px"}}>
            <select value={b.provincia} onChange={e=>{
              onUpd(b.id,"provincia",e.target.value);
              onUpd(b.id,"ciudad","");
              if (e.target.value) onCargarCiudades(e.target.value);
            }} style={{...IS,flex:1}}>
              <option value="">— Provincia —</option>
              {provs.map(p=><option key={p.id} value={p.nombre}>{p.nombre}</option>)}
            </select>
            {b.provincia && ciudades.length>0 && (
              <select value={b.ciudad} onChange={e=>onUpd(b.id,"ciudad",e.target.value)} style={{...IS,flex:1}}>
                <option value="">— Ciudad —</option>
                {ciudades.map(c=><option key={c.id} value={c.nombre}>{c.nombre}</option>)}
              </select>
            )}
          </div>
        </div>

        {/* TOGGLE + GUARDAR */}
        <div style={{display:"flex",flexDirection:"column",gap:"10px",paddingTop:"4px",borderTop:"1px solid #f0f0f0"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px",
            background:b.activa?`${tipoInfo.color}12`:"#f9f9f9",borderRadius:"12px",
            border:b.activa?`1px solid ${tipoInfo.color}40`:"1px solid #eee"}}>
            <div>
              <div style={{fontSize:"13px",fontWeight:800,color:"#1a2a3a"}}>🔔 Búsqueda activa</div>
              <div style={{fontSize:"11px",color:"#9a9a9a",fontWeight:600}}>
                {sinBits?"⚠️ Sin BIT":b.activa?`Consume 1 BIT por match (tenés ${bits.toLocaleString()})`:"Activar para recibir alertas"}
              </div>
            </div>
            <button onClick={()=>onToggleActiva(b)} disabled={sinBits&&!b.activa}
              style={{width:"50px",height:"28px",borderRadius:"14px",border:"none",
                background:b.activa?tipoInfo.color:"#e0e0e0",position:"relative",
                cursor:(sinBits&&!b.activa)?"not-allowed":"pointer",flexShrink:0,
                opacity:(sinBits&&!b.activa)?0.5:1,transition:"background .2s"}}>
              <div style={{width:"22px",height:"22px",borderRadius:"50%",background:"#fff",
                position:"absolute",top:"3px",left:b.activa?"25px":"3px",
                transition:"left .2s",boxShadow:"0 1px 3px rgba(0,0,0,0.25)"}}/>
            </button>
          </div>

          <button onClick={()=>onGuardar(b)} disabled={b.guardando||sinBits}
            style={{width:"100%",
              background:(b.guardando||sinBits)?"#f0f0f0":`linear-gradient(135deg,${tipoInfo.color}cc,${tipoInfo.color})`,
              border:"none",borderRadius:"12px",padding:"13px",fontSize:"14px",fontWeight:900,
              color:(b.guardando||sinBits)?"#bbb":"#fff",
              cursor:(b.guardando||sinBits)?"not-allowed":"pointer",
              fontFamily:"'Nunito',sans-serif",
              boxShadow:(b.guardando||sinBits)?"none":"0 3px 0 rgba(0,0,0,0.2)"}}>
            {b.guardando?"Guardando...":b.dbId?"💾 Actualizar búsqueda":"🔍 Guardar búsqueda"}
          </button>
        </div>
      </div>
    </div>
  );
}

function L({ children }:{ children:React.ReactNode }) {
  return <div style={{fontSize:"11px",fontWeight:800,color:"#9a9a9a",textTransform:"uppercase" as const,letterSpacing:"0.5px",marginBottom:"6px"}}>{children}</div>;
}

const IS: React.CSSProperties = {
  border:"2px solid #e8e8e8", borderRadius:"12px", padding:"10px 14px",
  fontSize:"14px", fontFamily:"'Nunito',sans-serif", outline:"none",
  color:"#1a2a3a", width:"100%", boxSizing:"border-box", background:"#fff",
};
