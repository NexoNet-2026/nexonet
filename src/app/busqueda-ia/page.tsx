"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/lib/supabase";

type RubroFlat    = { id:number; nombre:string };
type SubrubroFlat = { id:number; nombre:string; rubro_id:number };
type Prov         = { id:number; nombre:string };
type Ciudad       = { id:number; nombre:string; provincia_id:number };

type Busqueda = {
  id: string;
  titulo: string;
  rubro_id: number | null;
  subrubro_id: number | null;
  precio_min: string;
  precio_max: string;
  moneda: string;
  km_min: string;
  km_max: string;
  anio_min: string;
  anio_max: string;
  provincia: string;
  ciudad: string;
  keywords: string;
  activa: boolean;
  guardando: boolean;
  dbId: string | null;
};

const MONEDAS = ["ARS","USD"];
const ANIO_MIN = 1950;
const ANIO_MAX = new Date().getFullYear();

function uid() { return Math.random().toString(36).slice(2); }

function nuevaBusqueda(): Busqueda {
  return {
    id: uid(), titulo: "", rubro_id: null, subrubro_id: null,
    precio_min: "", precio_max: "", moneda: "ARS",
    km_min: "", km_max: "", anio_min: "", anio_max: "",
    provincia: "", ciudad: "", keywords: "", activa: false,
    guardando: false, dbId: null,
  };
}

export default function BusquedaIA() {
  const router = useRouter();
  const [session,   setSession]   = useState<any>(null);
  const [bitsBusc,  setBitsBusc]  = useState(0);
  const [rubros,    setRubros]    = useState<RubroFlat[]>([]);
  const [subrubros, setSubrubros] = useState<SubrubroFlat[]>([]);
  const [provs,     setProvs]     = useState<Prov[]>([]);
  const [ciudades,  setCiudades]  = useState<Record<string,Ciudad[]>>({});
  const [busquedas, setBusquedas] = useState<Busqueda[]>([nuevaBusqueda()]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      if (!s) { setLoading(false); return; }
      Promise.all([
        supabase.from("usuarios").select("bits_busquedas").eq("id", s.user.id).single(),
        supabase.from("rubros").select("id,nombre").order("nombre"),
        supabase.from("subrubros").select("id,nombre,rubro_id").order("nombre"),
        supabase.from("provincias").select("id,nombre").order("nombre"),
        supabase.from("busquedas_automaticas").select("*").eq("usuario_id", s.user.id).order("created_at"),
      ]).then(([{ data: u }, { data: r }, { data: s2 }, { data: p }, { data: bData }]) => {
        if (u)  setBitsBusc(u.bits_busquedas || 0);
        if (r)  setRubros(r.map((x: any) => ({ id: Number(x.id), nombre: x.nombre })));
        if (s2) setSubrubros(s2.map((x: any) => ({ id: Number(x.id), nombre: x.nombre, rubro_id: Number(x.rubro_id) })));
        if (p)  setProvs(p);
        if (bData && bData.length > 0) {
          setBusquedas(bData.map((b: any) => ({
            id: uid(), titulo: b.titulo || "", rubro_id: b.rubro_id || null,
            subrubro_id: b.subrubro_id || null, precio_min: b.precio_min?.toString() || "",
            precio_max: b.precio_max?.toString() || "", moneda: b.moneda || "ARS",
            km_min: b.km_min?.toString() || "", km_max: b.km_max?.toString() || "",
            anio_min: b.anio_min?.toString() || "", anio_max: b.anio_max?.toString() || "",
            provincia: b.provincia || "", ciudad: b.ciudad || "", keywords: b.keywords || "",
            activa: b.activo, guardando: false, dbId: b.id,
          })));
        }
        setLoading(false);
      });
    });
  }, []);

  const cargarCiudades = async (provNombre: string) => {
    if (ciudades[provNombre]) return;
    const p = provs.find(x => x.nombre === provNombre);
    if (!p) return;
    const { data } = await supabase.from("ciudades").select("id,nombre,provincia_id").eq("provincia_id", p.id).order("nombre");
    if (data) setCiudades(prev => ({ ...prev, [provNombre]: data }));
  };

  const upd = (id: string, field: keyof Busqueda, value: any) => {
    setBusquedas(prev => prev.map(b => b.id === id ? { ...b, [field]: value } : b));
  };

  const guardar = async (b: Busqueda) => {
    if (!session) return;
    upd(b.id, "guardando", true);
    const payload = {
      usuario_id:  session.user.id,
      titulo:      b.titulo || "Sin título",
      subrubro_id: b.subrubro_id,
      precio_min:  b.precio_min ? parseFloat(b.precio_min) : null,
      precio_max:  b.precio_max ? parseFloat(b.precio_max) : null,
      moneda:      b.moneda,
      km_min:      b.km_min ? parseInt(b.km_min) : null,
      km_max:      b.km_max ? parseInt(b.km_max) : null,
      anio_min:    b.anio_min ? parseInt(b.anio_min) : null,
      anio_max:    b.anio_max ? parseInt(b.anio_max) : null,
      provincia:   b.provincia || null,
      ciudad:      b.ciudad || null,
      keywords:    b.keywords || null,
      activo:      b.activa,
    };
    if (b.dbId) {
      await supabase.from("busquedas_automaticas").update(payload).eq("id", b.dbId);
    } else {
      const { data } = await supabase.from("busquedas_automaticas").insert(payload).select().single();
      if (data) upd(b.id, "dbId", data.id);
    }
    upd(b.id, "guardando", false);
  };

  const eliminar = async (b: Busqueda) => {
    if (b.dbId) await supabase.from("busquedas_automaticas").delete().eq("id", b.dbId);
    setBusquedas(prev => prev.filter(x => x.id !== b.id));
  };

  const toggleActiva = async (b: Busqueda) => {
    if (!b.activa && bitsBusc <= 0) {
      alert("⚠️ No tenés BIT Búsquedas disponibles.");
      return;
    }
    const nueva = !b.activa;
    upd(b.id, "activa", nueva);
    if (b.dbId) await supabase.from("busquedas_automaticas").update({ activo: nueva }).eq("id", b.dbId);
  };

  const agregarBusqueda = () => {
    setBusquedas(prev => [...prev, nuevaBusqueda()]);
    setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" }), 100);
  };

  const sinsRubro = (rubroId: number | null) => rubroId ? subrubros.filter(s => s.rubro_id === rubroId) : [];
  const tieneKm   = (b: Busqueda) => {
    if (!b.subrubro_id) return false;
    const sub = subrubros.find(s => s.id === b.subrubro_id);
    const r   = sub ? rubros.find(r => r.id === sub.rubro_id) : null;
    const nombre = (r?.nombre || "").toLowerCase();
    return nombre.includes("auto") || nombre.includes("moto") || nombre.includes("vehic") || nombre.includes("camio") || nombre.includes("transpor");
  };
  const tieneAnio = (b: Busqueda) => tieneKm(b) || (() => {
    const sub = subrubros.find(s => s.id === b.subrubro_id);
    const r   = sub ? rubros.find(r => r.id === sub.rubro_id) : null;
    const nombre = (r?.nombre || "").toLowerCase();
    return nombre.includes("inmueble") || nombre.includes("propiedad");
  })();

  if (!session && !loading) {
    return (
      <main style={{paddingTop:"95px",fontFamily:"'Nunito',sans-serif",background:"#f4f4f2",minHeight:"100vh"}}>
        <Header/>
        <div style={{textAlign:"center",padding:"60px 24px"}}>
          <div style={{fontSize:"48px",marginBottom:"16px"}}>🤖</div>
          <div style={{fontSize:"18px",fontWeight:900,color:"#1a2a3a",marginBottom:"8px"}}>Búsqueda Inteligente IA</div>
          <div style={{fontSize:"14px",color:"#9a9a9a",fontWeight:600,marginBottom:"24px"}}>Necesitás una cuenta para usar esta función</div>
          <button onClick={() => router.push("/login")} style={{background:"linear-gradient(135deg,#f0c040,#d4a017)",border:"none",borderRadius:"14px",padding:"14px 32px",fontSize:"15px",fontWeight:900,color:"#1a2a3a",cursor:"pointer",fontFamily:"'Nunito',sans-serif",boxShadow:"0 4px 0 #a07810"}}>
            Iniciar sesión
          </button>
        </div>
        <BottomNav/>
      </main>
    );
  }

  return (
    <main style={{paddingTop:"95px",paddingBottom:"130px",background:"#f4f4f2",minHeight:"100vh",fontFamily:"'Nunito',sans-serif"}}>
      <Header/>

      {/* ── HEADER ── */}
      <div style={{background:"linear-gradient(135deg,#1a2a3a,#243b55)",padding:"16px"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"8px"}}>
          <div>
            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"24px",color:"#f0c040",letterSpacing:"1px"}}>🤖 Búsqueda Inteligente IA</div>
            <div style={{fontSize:"12px",color:"#8a9aaa",fontWeight:600}}>Te avisamos cuando aparezca lo que buscás</div>
          </div>
          <div style={{background:"rgba(22,160,133,0.2)",border:"1px solid rgba(22,160,133,0.5)",borderRadius:"20px",padding:"6px 14px",textAlign:"center"}}>
            <div style={{fontSize:"18px",fontWeight:900,color:"#1abc9c"}}>{bitsBusc}</div>
            <div style={{fontSize:"9px",fontWeight:800,color:"#8a9aaa",textTransform:"uppercase",letterSpacing:"0.5px"}}>BIT búsquedas</div>
          </div>
        </div>
        {bitsBusc <= 0 && (
          <div style={{background:"rgba(230,57,70,0.15)",border:"1px solid rgba(230,57,70,0.3)",borderRadius:"10px",padding:"8px 12px",display:"flex",alignItems:"center",gap:"8px"}}>
            <span style={{fontSize:"14px"}}>⚠️</span>
            <span style={{fontSize:"12px",fontWeight:700,color:"#e63946"}}>Sin BIT disponibles — las búsquedas no se activarán</span>
            <button onClick={() => router.push("/comprar?cat=busquedas")} style={{marginLeft:"auto",background:"#e63946",border:"none",borderRadius:"8px",padding:"4px 10px",fontSize:"11px",fontWeight:900,color:"#fff",cursor:"pointer",fontFamily:"'Nunito',sans-serif",whiteSpace:"nowrap"}}>
              Cargar BIT
            </button>
          </div>
        )}
      </div>

      {/* ── BUSQUEDAS ── */}
      <div style={{padding:"16px",display:"flex",flexDirection:"column",gap:"16px"}}>
        {loading ? (
          <div style={{textAlign:"center",padding:"40px",color:"#9a9a9a",fontWeight:700}}>Cargando...</div>
        ) : (
          busquedas.map((b, idx) => (
            <TarjetaBusqueda
              key={b.id}
              b={b}
              idx={idx}
              rubros={rubros}
              subrubros={subrubros}
              provs={provs}
              ciudades={ciudades[b.provincia] || []}
              bitsBusc={bitsBusc}
              sinsRubro={sinsRubro}
              tieneKm={tieneKm}
              tieneAnio={tieneAnio}
              onCargarCiudades={cargarCiudades}
              onUpd={upd}
              onGuardar={guardar}
              onEliminar={eliminar}
              onToggleActiva={toggleActiva}
            />
          ))
        )}

        {/* ── BOTÓN AGREGAR ── */}
        <button onClick={agregarBusqueda} style={{display:"flex",alignItems:"center",justifyContent:"center",gap:"10px",background:"#fff",border:"3px dashed #d4a017",borderRadius:"16px",padding:"18px",cursor:"pointer",fontFamily:"'Nunito',sans-serif",width:"100%"}}>
          <div style={{width:"36px",height:"36px",borderRadius:"50%",background:"linear-gradient(135deg,#f0c040,#d4a017)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"22px",fontWeight:900,color:"#1a2a3a",boxShadow:"0 3px 0 #a07810"}}>
            +
          </div>
          <span style={{fontSize:"14px",fontWeight:900,color:"#d4a017"}}>Agregar nueva búsqueda</span>
        </button>
      </div>

      <BottomNav/>
    </main>
  );
}

// ── TARJETA DE BÚSQUEDA ──
function TarjetaBusqueda({
  b, idx, rubros, subrubros, provs, ciudades, bitsBusc,
  sinsRubro, tieneKm, tieneAnio,
  onCargarCiudades, onUpd, onGuardar, onEliminar, onToggleActiva,
}: {
  b: Busqueda; idx: number;
  rubros: RubroFlat[]; subrubros: SubrubroFlat[]; provs: Prov[]; ciudades: Ciudad[];
  bitsBusc: number;
  sinsRubro: (id: number | null) => SubrubroFlat[];
  tieneKm:   (b: Busqueda) => boolean;
  tieneAnio: (b: Busqueda) => boolean;
  onCargarCiudades: (p: string) => void;
  onUpd: (id: string, field: keyof Busqueda, value: any) => void;
  onGuardar: (b: Busqueda) => void;
  onEliminar: (b: Busqueda) => void;
  onToggleActiva: (b: Busqueda) => void;
}) {
  const sinBits = bitsBusc <= 0;
  const subsFiltrados = sinsRubro(b.rubro_id);
  const showKm   = tieneKm(b);
  const showAnio = tieneAnio(b);

  return (
    <div style={{background:"#fff",borderRadius:"16px",boxShadow:"0 2px 12px rgba(0,0,0,0.08)",overflow:"hidden",border:b.activa?"2px solid #1abc9c":"2px solid transparent"}}>

      {/* Header tarjeta */}
      <div style={{background:b.activa?"linear-gradient(135deg,#0d6e5e,#16a085)":"linear-gradient(135deg,#1a2a3a,#243b55)",padding:"12px 16px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
          <div style={{width:"28px",height:"28px",borderRadius:"50%",background:"rgba(255,255,255,0.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"13px",fontWeight:900,color:"#f0c040"}}>
            {idx + 1}
          </div>
          <div>
            <div style={{fontSize:"13px",fontWeight:900,color:"#fff"}}>{b.titulo || `Búsqueda ${idx + 1}`}</div>
            <div style={{fontSize:"10px",color:b.activa?"#7fffd4":"#8a9aaa",fontWeight:600}}>
              {b.activa ? "🟢 Activa" : "⭕ Inactiva"}
            </div>
          </div>
        </div>
        <button onClick={() => onEliminar(b)} style={{background:"rgba(230,57,70,0.2)",border:"1px solid rgba(230,57,70,0.4)",borderRadius:"8px",padding:"5px 10px",fontSize:"12px",fontWeight:900,color:"#e63946",cursor:"pointer",fontFamily:"'Nunito',sans-serif"}}>
          🗑️
        </button>
      </div>

      <div style={{padding:"14px 16px",display:"flex",flexDirection:"column",gap:"12px"}}>

        {/* Nombre */}
        <div>
          <Label>📝 Nombre de la búsqueda</Label>
          <input value={b.titulo} onChange={e => onUpd(b.id, "titulo", e.target.value)}
            placeholder="Ej: Auto Toyota hasta $15M" style={iStyle}/>
        </div>

        {/* Rubro */}
        <div>
          <Label>📂 Rubro</Label>
          <select value={b.rubro_id || ""} onChange={e => {
            onUpd(b.id, "rubro_id", e.target.value ? parseInt(e.target.value) : null);
            onUpd(b.id, "subrubro_id", null);
          }} style={iStyle}>
            <option value="">— Todos los rubros —</option>
            {rubros.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
          </select>
        </div>

        {/* Subrubro */}
        {b.rubro_id && subsFiltrados.length > 0 && (
          <div>
            <Label>📋 Subrubro</Label>
            <select value={b.subrubro_id || ""} onChange={e => onUpd(b.id, "subrubro_id", e.target.value ? parseInt(e.target.value) : null)} style={iStyle}>
              <option value="">— Todos —</option>
              {subsFiltrados.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
            </select>
          </div>
        )}

        {/* Keywords */}
        <div>
          <Label>🔍 Palabras clave</Label>
          <input value={b.keywords} onChange={e => onUpd(b.id, "keywords", e.target.value)}
            placeholder="Ej: toyota corolla automático" style={iStyle}/>
          <div style={{fontSize:"10px",color:"#9a9a9a",fontWeight:600,marginTop:"4px"}}>Separadas por espacio — todas deben aparecer en el anuncio</div>
        </div>

        {/* Precio */}
        <div>
          <Label>💰 Rango de precio</Label>
          <div style={{display:"flex",gap:"8px",alignItems:"center"}}>
            <input value={b.precio_min} onChange={e => onUpd(b.id, "precio_min", e.target.value)}
              placeholder="Desde" type="number" style={{...iStyle, flex:1}}/>
            <span style={{color:"#9a9a9a",fontWeight:800,fontSize:"13px"}}>—</span>
            <input value={b.precio_max} onChange={e => onUpd(b.id, "precio_max", e.target.value)}
              placeholder="Hasta" type="number" style={{...iStyle, flex:1}}/>
            <select value={b.moneda} onChange={e => onUpd(b.id, "moneda", e.target.value)} style={{...iStyle, width:"75px"}}>
              {MONEDAS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>

        {/* KM */}
        {showKm && (
          <div>
            <Label>🚗 Rango de KM</Label>
            <div style={{display:"flex",gap:"8px",alignItems:"center"}}>
              <input value={b.km_min} onChange={e => onUpd(b.id, "km_min", e.target.value)}
                placeholder="Desde KM" type="number" style={{...iStyle, flex:1}}/>
              <span style={{color:"#9a9a9a",fontWeight:800,fontSize:"13px"}}>—</span>
              <input value={b.km_max} onChange={e => onUpd(b.id, "km_max", e.target.value)}
                placeholder="Hasta KM" type="number" style={{...iStyle, flex:1}}/>
            </div>
          </div>
        )}

        {/* Año */}
        {showAnio && (
          <div>
            <Label>📅 Año de fabricación</Label>
            <div style={{display:"flex",gap:"8px",alignItems:"center"}}>
              <input value={b.anio_min} onChange={e => onUpd(b.id, "anio_min", e.target.value)}
                placeholder={`Desde (${ANIO_MIN})`} type="number" min={ANIO_MIN} max={ANIO_MAX} style={{...iStyle, flex:1}}/>
              <span style={{color:"#9a9a9a",fontWeight:800,fontSize:"13px"}}>—</span>
              <input value={b.anio_max} onChange={e => onUpd(b.id, "anio_max", e.target.value)}
                placeholder={`Hasta (${ANIO_MAX})`} type="number" min={ANIO_MIN} max={ANIO_MAX} style={{...iStyle, flex:1}}/>
            </div>
          </div>
        )}

        {/* Ubicación */}
        <div>
          <Label>📍 Ubicación</Label>
          <div style={{display:"flex",gap:"8px"}}>
            <select value={b.provincia} onChange={e => {
              onUpd(b.id, "provincia", e.target.value);
              onUpd(b.id, "ciudad", "");
              if (e.target.value) onCargarCiudades(e.target.value);
            }} style={{...iStyle, flex:1}}>
              <option value="">— Provincia —</option>
              {provs.map(p => <option key={p.id} value={p.nombre}>{p.nombre}</option>)}
            </select>
            {b.provincia && ciudades.length > 0 && (
              <select value={b.ciudad} onChange={e => onUpd(b.id, "ciudad", e.target.value)} style={{...iStyle, flex:1}}>
                <option value="">— Ciudad —</option>
                {ciudades.map(c => <option key={c.id} value={c.nombre}>{c.nombre}</option>)}
              </select>
            )}
          </div>
        </div>

        {/* Botones */}
        <div style={{display:"flex",flexDirection:"column",gap:"10px",paddingTop:"4px",borderTop:"1px solid #f0f0f0",marginTop:"4px"}}>

          {/* Toggle activa */}
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px",background:b.activa?"rgba(22,160,133,0.08)":"#f9f9f9",borderRadius:"12px",border:b.activa?"1px solid rgba(22,160,133,0.3)":"1px solid #eee"}}>
            <div>
              <div style={{fontSize:"13px",fontWeight:800,color:"#1a2a3a"}}>🔔 Mantener búsqueda activa</div>
              <div style={{fontSize:"11px",color:"#9a9a9a",fontWeight:600}}>
                {sinBits ? "⚠️ Sin BIT disponibles" : b.activa ? `Consume 1 BIT por match (tenés ${bitsBusc})` : "Activar para recibir alertas"}
              </div>
            </div>
            <button onClick={() => onToggleActiva(b)} disabled={sinBits && !b.activa}
              style={{width:"50px",height:"28px",borderRadius:"14px",border:"none",
                background:b.activa?"#1abc9c":sinBits?"#e0e0e0":"#e0e0e0",
                position:"relative",cursor:(sinBits&&!b.activa)?"not-allowed":"pointer",flexShrink:0,opacity:(sinBits&&!b.activa)?0.5:1,transition:"background .2s"}}>
              <div style={{width:"22px",height:"22px",borderRadius:"50%",background:"#fff",position:"absolute",top:"3px",left:b.activa?"25px":"3px",transition:"left .2s",boxShadow:"0 1px 3px rgba(0,0,0,0.25)"}}/>
            </button>
          </div>

          {/* Guardar */}
          <button onClick={() => onGuardar(b)} disabled={b.guardando || sinBits}
            style={{width:"100%",background:(b.guardando||sinBits)?"#f0f0f0":"linear-gradient(135deg,#f0c040,#d4a017)",
              border:"none",borderRadius:"12px",padding:"13px",fontSize:"14px",fontWeight:900,
              color:(b.guardando||sinBits)?"#bbb":"#1a2a3a",cursor:(b.guardando||sinBits)?"not-allowed":"pointer",
              fontFamily:"'Nunito',sans-serif",boxShadow:(b.guardando||sinBits)?"none":"0 3px 0 #a07810"}}>
            {b.guardando ? "Guardando..." : b.dbId ? "💾 Actualizar búsqueda" : "🔍 Guardar búsqueda"}
          </button>

          {sinBits && (
            <div style={{textAlign:"center",fontSize:"12px",color:"#e63946",fontWeight:700}}>
              ⚠️ Necesitás BIT Búsquedas para guardar y activar
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <div style={{fontSize:"11px",fontWeight:800,color:"#9a9a9a",textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:"6px"}}>{children}</div>;
}

const iStyle: React.CSSProperties = {
  border:"2px solid #e8e8e8", borderRadius:"12px", padding:"10px 14px",
  fontSize:"14px", fontFamily:"'Nunito',sans-serif", outline:"none",
  color:"#1a2a3a", width:"100%", boxSizing:"border-box", background:"#fff",
};
