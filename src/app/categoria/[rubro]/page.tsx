"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/lib/supabase";

type Anuncio = {
  id: number; titulo: string; precio: number | null; moneda: string;
  ciudad: string; provincia: string; imagenes: string[]; flash: boolean;
  subrubro_id: number; subrubro_nombre: string; permuto: boolean;
  usuario_id: string; created_at: string;
};
type Subrubro = { id: number; nombre: string };

const ANIO_MIN = 1950;
const ANIO_MAX = new Date().getFullYear();

export default function CategoriaPage() {
  const params  = useParams();
  const router  = useRouter();
  const rubroId = parseInt(params?.rubro as string);

  const [rubroNombre, setRubroNombre] = useState("");
  const [subrubros,   setSubrubros]   = useState<Subrubro[]>([]);
  const [anuncios,    setAnuncios]    = useState<Anuncio[]>([]);
  const [loading,     setLoading]     = useState(true);

  // Filtros
  const [subSel,      setSubSel]      = useState<number|null>(null);
  const [precioMin,   setPrecioMin]   = useState("");
  const [precioMax,   setPrecioMax]   = useState("");
  const [moneda,      setMoneda]      = useState("ARS");
  const [anioMin,     setAnioMin]     = useState("");
  const [anioMax,     setAnioMax]     = useState("");
  const [kmMin,       setKmMin]       = useState("");
  const [kmMax,       setKmMax]       = useState("");
  const [provincia,   setProvincia]   = useState("");
  const [ciudad,      setCiudad]      = useState("");
  const [soloPermuto, setSoloPermuto] = useState(false);
  const [keywords,    setKeywords]    = useState("");
  const [orden,       setOrden]       = useState<"reciente"|"menor"|"mayor">("reciente");
  const [filtrosOpen, setFiltrosOpen] = useState(false);

  // Provincias/ciudades
  const [provs,    setProvs]    = useState<{id:number;nombre:string}[]>([]);
  const [ciudades, setCiudades] = useState<{id:number;nombre:string}[]>([]);

  // Detección si es rubro de vehículos (para km/año)
  const esVehiculo = rubroNombre.toLowerCase().includes("auto") ||
                     rubroNombre.toLowerCase().includes("moto") ||
                     rubroNombre.toLowerCase().includes("vehic") ||
                     rubroNombre.toLowerCase().includes("camio") ||
                     rubroNombre.toLowerCase().includes("transpor");

  useEffect(() => {
    const cargar = async () => {
      // Rubro
      const { data: r } = await supabase.from("rubros").select("id,nombre").eq("id", rubroId).single();
      if (r) setRubroNombre(r.nombre);

      // Subrubros
      const { data: s } = await supabase.from("subrubros").select("id,nombre").eq("rubro_id", rubroId).order("nombre");
      if (s) setSubrubros(s);

      // Provincias
      const { data: p } = await supabase.from("provincias").select("id,nombre").order("nombre");
      if (p) setProvs(p);

      // Anuncios
      const { data: a } = await supabase
        .from("anuncios")
        .select("id,titulo,precio,moneda,ciudad,provincia,imagenes,flash,subrubro_id,permuto,usuario_id,created_at,subrubros!inner(id,nombre,rubro_id)")
        .eq("estado","activo")
        .eq("subrubros.rubro_id", rubroId)
        .order("created_at", { ascending: false })
        .limit(300);

      if (a) {
        setAnuncios(a.map((x:any) => ({
          ...x,
          subrubro_nombre: x.subrubros?.nombre || "",
          imagenes: x.imagenes || [],
          flash: x.flash || false,
          permuto: x.permuto || false,
        })));
      }
      setLoading(false);
    };
    cargar();
  }, [rubroId]);

  const cambiarProv = async (nombre: string) => {
    setProvincia(nombre); setCiudad(""); setCiudades([]);
    if (!nombre) return;
    const p = provs.find(x => x.nombre === nombre);
    if (!p) return;
    const { data } = await supabase.from("ciudades").select("id,nombre").eq("provincia_id", p.id).order("nombre");
    if (data) setCiudades(data);
  };

  // Aplicar filtros
  const anunciosFiltrados = anuncios.filter(a => {
    if (subSel && a.subrubro_id !== subSel) return false;
    if (precioMin && (a.precio||0) < parseFloat(precioMin)) return false;
    if (precioMax && (a.precio||0) > parseFloat(precioMax)) return false;
    if (soloPermuto && !a.permuto) return false;
    if (provincia && !(a.provincia||"").toLowerCase().includes(provincia.toLowerCase())) return false;
    if (ciudad    && !(a.ciudad||"").toLowerCase().includes(ciudad.toLowerCase())) return false;
    if (keywords.trim()) {
      const kws = keywords.trim().toLowerCase().split(/\s+/);
      const hay = kws.every(k => (a.titulo||"").toLowerCase().includes(k));
      if (!hay) return false;
    }
    return true;
  }).sort((a, b) => {
    if (orden === "menor") return (a.precio||0) - (b.precio||0);
    if (orden === "mayor") return (b.precio||0) - (a.precio||0);
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const fmt = (p: number|null, m: string) =>
    !p ? "Consultar" : `${m === "USD" ? "U$D" : "$"} ${p.toLocaleString("es-AR")}`;

  const cantFiltrosActivos = [subSel,precioMin,precioMax,anioMin,anioMax,kmMin,kmMax,provincia,soloPermuto,keywords.trim()].filter(Boolean).length;

  const limpiarFiltros = () => {
    setSubSel(null); setPrecioMin(""); setPrecioMax(""); setAnioMin(""); setAnioMax("");
    setKmMin(""); setKmMax(""); setProvincia(""); setCiudad(""); setSoloPermuto(false); setKeywords("");
  };

  return (
    <main style={{ paddingTop:"95px", paddingBottom:"130px", background:"#f4f4f2", minHeight:"100vh", fontFamily:"'Nunito',sans-serif" }}>
      <Header />

      {/* HEADER */}
      <div style={{ background:"linear-gradient(135deg,#1a2a3a,#243b55)", padding:"14px 16px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"12px", marginBottom:"12px" }}>
          <button onClick={()=>router.back()} style={{ background:"rgba(255,255,255,0.1)", border:"1px solid rgba(255,255,255,0.2)", borderRadius:"10px", padding:"7px 12px", color:"#fff", fontSize:"13px", fontWeight:700, cursor:"pointer", fontFamily:"'Nunito',sans-serif" }}>← Volver</button>
          <div style={{ flex:1 }}>
            <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"24px", color:"#f0c040", letterSpacing:"1px" }}>
              {rubroNombre || "Categoría"}
            </div>
            <div style={{ fontSize:"11px", color:"#8a9aaa", fontWeight:600 }}>
              {loading ? "Cargando..." : `${anunciosFiltrados.length} anuncio${anunciosFiltrados.length!==1?"s":""}`}
            </div>
          </div>
          <button onClick={() => {
            const params = new URLSearchParams();
            if (subSel) params.set("subrubro", String(subSel));
            if (provincia) params.set("provincia", provincia);
            if (ciudad) params.set("ciudad", ciudad);
            router.push(`/mapa?${params.toString()}`);
          }}
            style={{ background:"rgba(58,123,213,0.2)", border:"1px solid rgba(58,123,213,0.5)", borderRadius:"10px", padding:"7px 12px", fontSize:"12px", fontWeight:800, color:"#7fb3f5", cursor:"pointer", fontFamily:"'Nunito',sans-serif", whiteSpace:"nowrap" }}>
            🗺️ Mapa
          </button>
          <button onClick={() => router.push("/busqueda-ia")}
            style={{ background:"rgba(22,160,133,0.2)", border:"1px solid rgba(22,160,133,0.5)", borderRadius:"10px", padding:"7px 12px", fontSize:"12px", fontWeight:800, color:"#1abc9c", cursor:"pointer", fontFamily:"'Nunito',sans-serif" }}>
            🤖 IA
          </button>
        </div>

        {/* BÚSQUEDA */}
        <div style={{ display:"flex", gap:"8px", marginBottom:"12px" }}>
          <input
            type="text" value={keywords} onChange={e => setKeywords(e.target.value)}
            placeholder={`Buscar en ${rubroNombre}...`}
            style={{ flex:1, background:"#fff", border:"none", borderRadius:"12px", padding:"11px 14px", fontSize:"14px", fontFamily:"'Nunito',sans-serif", color:"#2c2c2e", outline:"none" }}
          />
          {keywords && (
            <button onClick={()=>setKeywords("")} style={{ background:"rgba(255,80,80,0.15)", border:"none", borderRadius:"12px", padding:"0 12px", color:"#ff6b6b", fontSize:"16px", cursor:"pointer" }}>✕</button>
          )}
        </div>

        {/* SUBRUBROS */}
        <div style={{ display:"flex", gap:"8px", overflowX:"auto", scrollbarWidth:"none", marginBottom:"12px", paddingBottom:"2px" }}>
          <button onClick={()=>setSubSel(null)}
            style={{ flexShrink:0, background:!subSel?"#d4a017":"rgba(255,255,255,0.1)", border:`2px solid ${!subSel?"#d4a017":"rgba(255,255,255,0.2)"}`, borderRadius:"20px", padding:"6px 14px", fontSize:"12px", fontWeight:800, color:!subSel?"#1a2a3a":"#fff", cursor:"pointer", fontFamily:"'Nunito',sans-serif", whiteSpace:"nowrap" }}>
            Todos
          </button>
          {subrubros.map(s => (
            <button key={s.id} onClick={()=>setSubSel(subSel===s.id?null:s.id)}
              style={{ flexShrink:0, background:subSel===s.id?"#d4a017":"rgba(255,255,255,0.1)", border:`2px solid ${subSel===s.id?"#d4a017":"rgba(255,255,255,0.2)"}`, borderRadius:"20px", padding:"6px 14px", fontSize:"12px", fontWeight:800, color:subSel===s.id?"#1a2a3a":"#fff", cursor:"pointer", fontFamily:"'Nunito',sans-serif", whiteSpace:"nowrap" }}>
              {s.nombre}
            </button>
          ))}
        </div>

        {/* BARRA INFERIOR: filtros + orden + permuta */}
        <div style={{ display:"flex", gap:"8px", alignItems:"center" }}>
          <button onClick={()=>setFiltrosOpen(v=>!v)}
            style={{ flex:1, background:cantFiltrosActivos>0?"rgba(212,160,23,0.2)":"rgba(255,255,255,0.1)", border:`2px solid ${cantFiltrosActivos>0?"#d4a017":"rgba(255,255,255,0.2)"}`, borderRadius:"12px", padding:"8px 12px", fontSize:"12px", fontWeight:800, color:cantFiltrosActivos>0?"#d4a017":"#fff", cursor:"pointer", fontFamily:"'Nunito',sans-serif", display:"flex", alignItems:"center", gap:"6px" }}>
            🔧 Filtros {cantFiltrosActivos>0 && <span style={{ background:"#d4a017", color:"#1a2a3a", borderRadius:"20px", padding:"1px 7px", fontSize:"10px", fontWeight:900 }}>{cantFiltrosActivos}</span>}
          </button>
          <button onClick={()=>setSoloPermuto(v=>!v)}
            style={{ flexShrink:0, background:soloPermuto?"#d4a017":"rgba(255,255,255,0.1)", border:`2px solid ${soloPermuto?"#d4a017":"rgba(255,255,255,0.2)"}`, borderRadius:"12px", padding:"8px 12px", fontSize:"12px", fontWeight:800, color:soloPermuto?"#1a2a3a":"#fff", cursor:"pointer", fontFamily:"'Nunito',sans-serif" }}>
            🔄 Permuta
          </button>
          <select value={orden} onChange={e=>setOrden(e.target.value as any)}
            style={{ flexShrink:0, background:"rgba(255,255,255,0.1)", border:"2px solid rgba(255,255,255,0.2)", borderRadius:"12px", padding:"8px 10px", fontSize:"12px", fontWeight:800, color:"#fff", cursor:"pointer", fontFamily:"'Nunito',sans-serif", outline:"none" }}>
            <option value="reciente">🕐 Reciente</option>
            <option value="menor">💰 Menor precio</option>
            <option value="mayor">💰 Mayor precio</option>
          </select>
        </div>
      </div>

      {/* PANEL FILTROS AVANZADOS */}
      {filtrosOpen && (
        <div style={{ background:"#fff", borderBottom:"3px solid #f4f4f2", padding:"16px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"14px" }}>
            <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"18px", color:"#1a2a3a", letterSpacing:"1px" }}>🔧 Filtros avanzados</div>
            {cantFiltrosActivos > 0 && (
              <button onClick={limpiarFiltros} style={{ background:"rgba(231,76,60,0.1)", border:"1px solid rgba(231,76,60,0.3)", borderRadius:"8px", padding:"5px 12px", fontSize:"12px", fontWeight:800, color:"#e74c3c", cursor:"pointer", fontFamily:"'Nunito',sans-serif" }}>
                ✕ Limpiar filtros
              </button>
            )}
          </div>

          <div style={{ display:"flex", flexDirection:"column", gap:"14px" }}>

            {/* PRECIO */}
            <div>
              <Label>💰 Rango de precio</Label>
              <div style={{ display:"flex", gap:"8px", alignItems:"center" }}>
                <input type="number" value={precioMin} onChange={e=>setPrecioMin(e.target.value)} placeholder="Desde" style={IS} />
                <span style={{ color:"#9a9a9a", fontWeight:800 }}>—</span>
                <input type="number" value={precioMax} onChange={e=>setPrecioMax(e.target.value)} placeholder="Hasta" style={IS} />
                <select value={moneda} onChange={e=>setMoneda(e.target.value)} style={{ ...IS, width:"80px" }}>
                  <option value="ARS">ARS</option>
                  <option value="USD">USD</option>
                </select>
              </div>
            </div>

            {/* KM — solo vehículos */}
            {esVehiculo && (
              <div>
                <Label>🚗 Kilómetros</Label>
                <div style={{ display:"flex", gap:"8px", alignItems:"center" }}>
                  <input type="number" value={kmMin} onChange={e=>setKmMin(e.target.value)} placeholder="Desde KM" style={IS} />
                  <span style={{ color:"#9a9a9a", fontWeight:800 }}>—</span>
                  <input type="number" value={kmMax} onChange={e=>setKmMax(e.target.value)} placeholder="Hasta KM" style={IS} />
                </div>
              </div>
            )}

            {/* AÑO — solo vehículos */}
            {esVehiculo && (
              <div>
                <Label>📅 Año de fabricación</Label>
                <div style={{ display:"flex", gap:"8px", alignItems:"center" }}>
                  <input type="number" value={anioMin} onChange={e=>setAnioMin(e.target.value)} placeholder={`Desde (${ANIO_MIN})`} min={ANIO_MIN} max={ANIO_MAX} style={IS} />
                  <span style={{ color:"#9a9a9a", fontWeight:800 }}>—</span>
                  <input type="number" value={anioMax} onChange={e=>setAnioMax(e.target.value)} placeholder={`Hasta (${ANIO_MAX})`} min={ANIO_MIN} max={ANIO_MAX} style={IS} />
                </div>
              </div>
            )}

            {/* UBICACIÓN */}
            <div>
              <Label>📍 Ubicación</Label>
              <div style={{ display:"flex", gap:"8px" }}>
                <select value={provincia} onChange={e=>cambiarProv(e.target.value)} style={{ ...IS, flex:1 }}>
                  <option value="">— Provincia —</option>
                  {provs.map(p => <option key={p.id} value={p.nombre}>{p.nombre}</option>)}
                </select>
                {provincia && ciudades.length > 0 && (
                  <select value={ciudad} onChange={e=>setCiudad(e.target.value)} style={{ ...IS, flex:1 }}>
                    <option value="">— Ciudad —</option>
                    {ciudades.map(c => <option key={c.id} value={c.nombre}>{c.nombre}</option>)}
                  </select>
                )}
              </div>
            </div>
          </div>

          <button onClick={()=>setFiltrosOpen(false)}
            style={{ width:"100%", marginTop:"16px", background:"linear-gradient(135deg,#1a2a3a,#243b55)", border:"none", borderRadius:"12px", padding:"13px", fontSize:"14px", fontWeight:900, color:"#d4a017", cursor:"pointer", fontFamily:"'Nunito',sans-serif" }}>
            ✓ Ver {anunciosFiltrados.length} resultado{anunciosFiltrados.length!==1?"s":""}
          </button>
        </div>
      )}

      {/* RESULTADOS */}
      <div style={{ padding:"12px 16px" }}>
        {loading ? (
          <div style={{ textAlign:"center", padding:"50px", color:"#9a9a9a", fontWeight:700 }}>Cargando...</div>
        ) : anunciosFiltrados.length === 0 ? (
          <div style={{ textAlign:"center", padding:"50px 20px" }}>
            <div style={{ fontSize:"48px", marginBottom:"12px" }}>🔍</div>
            <div style={{ fontSize:"16px", fontWeight:900, color:"#1a2a3a", marginBottom:"6px" }}>Sin resultados</div>
            <div style={{ fontSize:"13px", color:"#9a9a9a", fontWeight:600, marginBottom:"20px" }}>Probá ajustando los filtros</div>
            {cantFiltrosActivos > 0 && (
              <button onClick={limpiarFiltros} style={{ background:"linear-gradient(135deg,#d4a017,#f0c040)", border:"none", borderRadius:"12px", padding:"12px 24px", fontSize:"13px", fontWeight:900, color:"#1a2a3a", cursor:"pointer", fontFamily:"'Nunito',sans-serif" }}>
                Limpiar filtros
              </button>
            )}
          </div>
        ) : (
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px" }}>
            {anunciosFiltrados.map(a => (
              <a key={a.id} href={`/anuncios/${a.id}`} style={{ textDecoration:"none" }}>
                <div style={{ background:"#fff", borderRadius:"14px", overflow:"hidden", boxShadow:"0 2px 10px rgba(0,0,0,0.08)", border:"1px solid #f0f0f0" }}>
                  <div style={{ width:"100%", height:"120px", background:"#f4f4f2", display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden", position:"relative" }}>
                    {a.imagenes?.[0]
                      ? <img src={a.imagenes[0]} alt={a.titulo} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                      : <span style={{ fontSize:"36px" }}>📦</span>
                    }
                    {a.flash && (
                      <div style={{ position:"absolute", top:"6px", left:"6px", background:"#d4a017", color:"#1a2a3a", fontSize:"9px", fontWeight:900, padding:"2px 7px", borderRadius:"6px" }}>⚡ FLASH</div>
                    )}
                    {a.permuto && (
                      <div style={{ position:"absolute", top:"6px", right:"6px", background:"#8e44ad", color:"#fff", fontSize:"9px", fontWeight:900, padding:"2px 7px", borderRadius:"6px" }}>🔄</div>
                    )}
                  </div>
                  <div style={{ padding:"8px 10px 12px" }}>
                    <div style={{ fontSize:"10px", color:"#9a9a9a", fontWeight:700, marginBottom:"3px", textTransform:"uppercase", letterSpacing:"0.5px" }}>
                      {a.subrubro_nombre}
                    </div>
                    <div style={{ fontSize:"12px", fontWeight:800, color:"#2c2c2e", marginBottom:"4px", overflow:"hidden", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical" as any }}>
                      {a.titulo}
                    </div>
                    <div style={{ fontSize:"15px", fontWeight:900, color:"#d4a017", marginBottom:"3px" }}>
                      {fmt(a.precio, a.moneda)}
                    </div>
                    <div style={{ fontSize:"11px", color:"#9a9a9a", fontWeight:600 }}>📍 {a.ciudad}</div>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </main>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize:"11px", fontWeight:800, color:"#666", textTransform:"uppercase" as const, letterSpacing:"1px", marginBottom:"6px" }}>{children}</div>;
}

const IS: React.CSSProperties = {
  flex:1, border:"2px solid #e8e8e6", borderRadius:"10px", padding:"10px 12px",
  fontSize:"13px", fontFamily:"'Nunito',sans-serif", color:"#2c2c2e",
  outline:"none", background:"#fff", boxSizing:"border-box",
};
