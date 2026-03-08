"use client";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Subrubro     = { id: number; nombre: string };
type Rubro        = { id: number; nombre: string; subrubros: Subrubro[] };
type RubroFlat    = { id: number; nombre: string };
type SubrubroFlat = { id: number; nombre: string; rubro_id: number };
type Anuncio      = {
  id: number; titulo: string; precio: number; moneda: string;
  ciudad: string; provincia: string; barrio: string;
  imagenes: string[]; flash: boolean; fuente: string; subrubro_id: number;
};
type Provincia = { id: number; nombre: string };
type Ciudad    = { id: number; nombre: string; provincia_id: number };
type Barrio    = { id: number; nombre: string; ciudad_id: number };

const FUENTES: Record<string, { color: string; texto: string; label: string }> = {
  nexonet:       { color: "#d4a017", texto: "#1a2a3a", label: "NexoNet"        },
  mercadolibre:  { color: "#ffe600", texto: "#333",    label: "Mercado Libre"  },
  rosariogarage: { color: "#ff6b00", texto: "#fff",    label: "Rosario Garage" },
  olx:           { color: "#00a884", texto: "#fff",    label: "OLX"            },
  otro:          { color: "#888",    texto: "#fff",    label: "Externo"        },
};

export default function Buscar() {
  return (
    <Suspense fallback={
      <main style={{ paddingTop:"95px", paddingBottom:"130px", background:"#f4f4f2", minHeight:"100vh", fontFamily:"'Nunito', sans-serif", display:"flex", alignItems:"center", justifyContent:"center" }}>
        <div style={{ textAlign:"center", color:"#9a9a9a", fontWeight:700 }}>Cargando...</div>
      </main>
    }>
      <BuscarInner />
    </Suspense>
  );
}

function BuscarInner() {
  const searchParams = useSearchParams();

  // ── Ubicación ──
  const [provincias,  setProvincias]  = useState<Provincia[]>([]);
  const [ciudades,    setCiudades]    = useState<Ciudad[]>([]);
  const [barrios,     setBarrios]     = useState<Barrio[]>([]);
  const [provSel,     setProvSel]     = useState("");
  const [ciudadSel,   setCiudadSel]   = useState("");
  const [barrioSel,   setBarrioSel]   = useState("");
  const [gpsLoading,  setGpsLoading]  = useState(false);
  const [ubiLabel,    setUbiLabel]    = useState("");

  // ── Buscador dropdown ──
  const [query,       setQuery]       = useState("");
  const [rubroSel,    setRubroSel]    = useState<RubroFlat | null>(null);
  const [subrubroSel, setSubrubroSel] = useState<SubrubroFlat | null>(null);
  const [dropOpen,    setDropOpen]    = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropRef  = useRef<HTMLDivElement>(null);

  // ── Datos anuncios / rubros ──
  const [rubros,        setRubros]        = useState<Rubro[]>([]);
  const [rubrosFlat,    setRubrosFlat]    = useState<RubroFlat[]>([]);
  const [subrubrosFlat, setSubrubrosFlat] = useState<SubrubroFlat[]>([]);
  const [anuncios,      setAnuncios]      = useState<Anuncio[]>([]);
  const [subActivos,    setSubActivos]    = useState<Record<number, number | null>>({});
  const [loading,       setLoading]       = useState(true);

  // ── Cargar datos iniciales ──
  useEffect(() => {
    const qParam = searchParams.get("q");
    if (qParam) setQuery(qParam);
    (window as any).__rP = searchParams.get("rubro");
    (window as any).__sP = searchParams.get("subrubro");

    const cargar = async () => {
      const [{ data: provData }, { data: rData }, { data: aData }] = await Promise.all([
        supabase.from("provincias").select("id, nombre").order("nombre"),
        supabase.from("rubros").select("id, nombre, subrubros(id, nombre)").order("nombre"),
        supabase.from("anuncios")
          .select("id, titulo, precio, moneda, ciudad, provincia, barrio, imagenes, flash, fuente, subrubro_id")
          .eq("estado", "activo").order("created_at", { ascending: false }).limit(100),
      ]);

      if (provData) setProvincias(provData);
      if (rData) {
        setRubros(rData as any);
        const flat = rData.map((r: any) => ({ id: r.id, nombre: r.nombre }));
        setRubrosFlat(flat);
        setSubrubrosFlat(rData.flatMap((r: any) =>
          (r.subrubros || []).map((s: any) => ({ id: s.id, nombre: s.nombre, rubro_id: r.id }))
        ));
        const rP = (window as any).__rP;
        const sP = (window as any).__sP;
        if (rP) { const r = flat.find((x: RubroFlat) => x.id === parseInt(rP)); if (r) { setRubroSel(r); setQuery(r.nombre); } }
        if (sP) {
          const allS = rData.flatMap((r: any) => (r.subrubros||[]).map((s: any) => ({ id:s.id, nombre:s.nombre, rubro_id:r.id })));
          const s = allS.find((x: SubrubroFlat) => x.id === parseInt(sP));
          if (s) { setSubrubroSel(s); setQuery(s.nombre); }
        }
      }
      if (aData) setAnuncios(aData as any);
      setLoading(false);
    };
    cargar();
  }, []);

  // Cargar ciudades al seleccionar provincia
  useEffect(() => {
    setCiudadSel(""); setBarrioSel(""); setCiudades([]); setBarrios([]);
    if (!provSel) return;
    const prov = provincias.find(p => p.nombre === provSel);
    if (!prov) return;
    supabase.from("ciudades").select("id, nombre, provincia_id")
      .eq("provincia_id", prov.id).order("nombre")
      .then(({ data }) => { if (data) setCiudades(data); });
  }, [provSel, provincias]);

  // Cargar barrios al seleccionar ciudad
  useEffect(() => {
    setBarrioSel(""); setBarrios([]);
    if (!ciudadSel) return;
    const ciudad = ciudades.find(c => c.nombre === ciudadSel);
    if (!ciudad) return;
    supabase.from("barrios").select("id, nombre, ciudad_id")
      .eq("ciudad_id", ciudad.id).order("nombre")
      .then(({ data }) => { if (data) setBarrios(data); });
  }, [ciudadSel, ciudades]);

  // Actualizar label de ubicación
  useEffect(() => {
    const parts = [provSel, ciudadSel, barrioSel].filter(Boolean);
    setUbiLabel(parts.length ? parts[parts.length - 1] : "");
  }, [provSel, ciudadSel, barrioSel]);

  // Cerrar dropdown afuera
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node) &&
          inputRef.current && !inputRef.current.contains(e.target as Node))
        setDropOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  // ── GPS ──
  const detectarGPS = () => {
    if (!navigator.geolocation) return alert("GPS no disponible");
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(async pos => {
      try {
        const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`);
        const d = await r.json();
        const prov   = d.address?.state || "";
        const ciudad = d.address?.city || d.address?.town || d.address?.village || "";
        const barrio = d.address?.suburb || d.address?.neighbourhood || "";

        // Buscar provincia en nuestra lista
        const provMatch = provincias.find(p =>
          p.nombre.toLowerCase().includes(prov.toLowerCase()) ||
          prov.toLowerCase().includes(p.nombre.toLowerCase())
        );
        if (provMatch) {
          setProvSel(provMatch.nombre);
          // Esperar ciudades y setear
          const { data: ciudadesData } = await supabase.from("ciudades")
            .select("id, nombre, provincia_id").eq("provincia_id", provMatch.id).order("nombre");
          if (ciudadesData) {
            setCiudades(ciudadesData);
            const ciudadMatch = ciudadesData.find((c: Ciudad) =>
              c.nombre.toLowerCase().includes(ciudad.toLowerCase()) ||
              ciudad.toLowerCase().includes(c.nombre.toLowerCase())
            );
            if (ciudadMatch) {
              setCiudadSel(ciudadMatch.nombre);
              const { data: barriosData } = await supabase.from("barrios")
                .select("id, nombre, ciudad_id").eq("ciudad_id", ciudadMatch.id).order("nombre");
              if (barriosData) {
                setBarrios(barriosData);
                const barrioMatch = barriosData.find((b: Barrio) =>
                  b.nombre.toLowerCase().includes(barrio.toLowerCase()) ||
                  barrio.toLowerCase().includes(b.nombre.toLowerCase())
                );
                if (barrioMatch) setBarrioSel(barrioMatch.nombre);
              }
            }
          }
        }
      } catch { alert("No se pudo obtener la ubicación"); }
      setGpsLoading(false);
    }, () => { alert("No se pudo acceder al GPS"); setGpsLoading(false); });
  };

  const limpiarUbi = () => { setProvSel(""); setCiudadSel(""); setBarrioSel(""); };

  // ── Buscador ──
  const qLow = query.toLowerCase();
  const rubrosFiltered    = rubrosFlat.filter(r => r.nombre.toLowerCase().includes(qLow));
  const subrubrosFiltered = subrubrosFlat.filter(s => s.nombre.toLowerCase().includes(qLow));
  const subrubrosDeRubro  = rubroSel ? subrubrosFlat.filter(s => s.rubro_id === rubroSel.id) : [];
  const limpiarBusqueda   = () => { setQuery(""); setRubroSel(null); setSubrubroSel(null); setDropOpen(false); };
  const selRubro    = (r: RubroFlat)    => { setRubroSel(r); setSubrubroSel(null); setQuery(r.nombre); setDropOpen(false); };
  const selSubrubro = (s: SubrubroFlat) => {
    setRubroSel(rubrosFlat.find(r => r.id === s.rubro_id) || null);
    setSubrubroSel(s); setQuery(s.nombre); setDropOpen(false);
  };
  const toggleSub = (rubroId: number, subId: number) =>
    setSubActivos(p => ({ ...p, [rubroId]: p[rubroId] === subId ? null : subId }));

  // ── Filtrado ──
  const anunciosFiltrados = anuncios.filter(a => {
    let geo = true;
    if (barrioSel) geo = (a.barrio || "").toLowerCase().includes(barrioSel.toLowerCase());
    else if (ciudadSel) geo = (a.ciudad || "").toLowerCase().includes(ciudadSel.toLowerCase());
    else if (provSel)   geo = (a.provincia || "").toLowerCase().includes(provSel.toLowerCase());
    return geo;
  });

  const busquedaLibre = query.trim() !== "" && !rubroSel && !subrubroSel;
  const resultadosTexto = busquedaLibre
    ? anunciosFiltrados.filter(a => a.titulo.toLowerCase().includes(qLow))
    : [];

  const rubrosAMostrar = rubroSel ? rubros.filter(r => r.id === rubroSel.id) : rubros;
  const getAnunciosPorRubro = (rubro: Rubro) => {
    const subIds    = rubro.subrubros.map(s => s.id);
    const subActivo = subActivos[rubro.id];
    return anunciosFiltrados.filter(a =>
      subActivo ? a.subrubro_id === subActivo : subIds.includes(a.subrubro_id)
    ).slice(0, 8);
  };

  const formatPrecio = (precio: number, moneda: string) =>
    !precio ? "Consultar" : `${moneda === "USD" ? "U$D" : "$"} ${precio.toLocaleString("es-AR")}`;

  const placeholderQ = ubiLabel ? `¿Qué buscás en ${ubiLabel}?` : "¿Qué buscás?";
  const ubiActiva    = !!(provSel || ciudadSel || barrioSel);

  return (
    <main style={{ paddingTop:"95px", paddingBottom:"130px", background:"#f4f4f2", minHeight:"100vh", fontFamily:"'Nunito', sans-serif" }}>
      <Header />

      {/* ════ BARRA ════ */}
      <div style={{ background:"linear-gradient(135deg, #1a2a3a 0%, #243b55 100%)", padding:"12px 16px 14px", display:"flex", flexDirection:"column", gap:"10px" }}>

        {/* FILA UBICACIÓN */}
        <div style={{ display:"flex", gap:"8px", alignItems:"center" }}>
          <UbiSelect
            value={provSel}
            placeholder="🗺️ Provincia"
            opciones={provincias.map(p => p.nombre)}
            onChange={v => setProvSel(v)}
          />
          {provSel && (
            <UbiSelect
              value={ciudadSel}
              placeholder="🏙️ Ciudad"
              opciones={ciudades.map(c => c.nombre)}
              onChange={v => setCiudadSel(v)}
            />
          )}
          {ciudadSel && barrios.length > 0 && (
            <UbiSelect
              value={barrioSel}
              placeholder="🏘️ Barrio"
              opciones={barrios.map(b => b.nombre)}
              onChange={v => setBarrioSel(v)}
            />
          )}
          {/* GPS */}
          <button onClick={detectarGPS} disabled={gpsLoading} title="Detectar mi ubicación" style={{
            background:"rgba(212,160,23,0.2)", border:"2px solid rgba(212,160,23,0.5)",
            borderRadius:"12px", width:"42px", height:"42px", flexShrink:0,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:"18px", cursor:"pointer", opacity:gpsLoading ? 0.6 : 1,
          }}>
            {gpsLoading ? "⏳" : "📍"}
          </button>
          {ubiActiva && (
            <button onClick={limpiarUbi} title="Limpiar" style={{
              background:"rgba(255,80,80,0.15)", border:"2px solid rgba(255,80,80,0.3)",
              borderRadius:"12px", width:"42px", height:"42px", flexShrink:0,
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:"16px", cursor:"pointer",
            }}>✕</button>
          )}
        </div>

        {/* CHIPS ACTIVOS */}
        {ubiActiva && (
          <div style={{ display:"flex", gap:"6px", flexWrap:"wrap" }}>
            {[provSel, ciudadSel, barrioSel].filter(Boolean).map((label, i) => (
              <span key={i} style={{ background:"rgba(212,160,23,0.2)", border:"1px solid rgba(212,160,23,0.4)", borderRadius:"20px", padding:"3px 10px", fontSize:"11px", fontWeight:800, color:"#d4a017" }}>
                {["🗺️","🏙️","🏘️"][i]} {label}
              </span>
            ))}
          </div>
        )}

        {/* BUSCADOR CON DROPDOWN */}
        <div style={{ position:"relative" }}>
          <div style={{ display:"flex", background:"#fff", borderRadius:"14px", boxShadow:"0 2px 8px rgba(0,0,0,0.2)", position:"relative", zIndex:10 }}>
            <div style={{ flex:1, position:"relative" }}>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => { setQuery(e.target.value); setRubroSel(null); setSubrubroSel(null); setDropOpen(true); }}
                onFocus={() => setDropOpen(true)}
                placeholder={placeholderQ}
                style={{ width:"100%", border:"none", padding:"12px 16px", fontFamily:"'Nunito', sans-serif", fontSize:"14px", color:"#2c2c2e", outline:"none", background:"transparent", boxSizing:"border-box", borderRadius:"14px 0 0 14px" }}
              />
              {(rubroSel || subrubroSel) && (
                <div onClick={limpiarBusqueda} style={{ position:"absolute", right:"8px", top:"50%", transform:"translateY(-50%)", background: subrubroSel ? "#2980b9" : "#d4a017", borderRadius:"20px", padding:"3px 10px", fontSize:"11px", fontWeight:800, color: subrubroSel ? "#fff" : "#1a2a3a", cursor:"pointer" }}>
                  {subrubroSel ? subrubroSel.nombre : rubroSel!.nombre} ✕
                </div>
              )}
            </div>
            {query && !rubroSel && (
              <button onClick={limpiarBusqueda} style={{ background:"none", border:"none", padding:"0 8px", cursor:"pointer", fontSize:"16px", color:"#9a9a9a" }}>✕</button>
            )}
            <button onClick={() => setDropOpen(false)} style={{ background:"#d4a017", border:"none", padding:"0 18px", cursor:"pointer", fontSize:"16px", color:"#1a2a3a", borderRadius:"0 14px 14px 0", flexShrink:0 }}>🔍</button>
          </div>

          {/* DROPDOWN RUBROS/SUBRUBROS */}
          {dropOpen && (
            <div ref={dropRef} style={{ position:"absolute", top:"calc(100% + 6px)", left:0, right:0, background:"#fff", borderRadius:"14px", boxShadow:"0 8px 32px rgba(0,0,0,0.2)", zIndex:100, maxHeight:"300px", overflowY:"auto", border:"1px solid #e8e8e6" }}>
              {rubroSel && subrubrosDeRubro.length > 0 ? (
                <>
                  <div style={{ padding:"10px 14px 6px", fontSize:"10px", fontWeight:800, color:"#9a9a9a", textTransform:"uppercase", letterSpacing:"1px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <span>Subrubros de {rubroSel.nombre}</span>
                    <button onClick={limpiarBusqueda} style={{ background:"none", border:"none", cursor:"pointer", fontSize:"11px", color:"#d4a017", fontWeight:800, fontFamily:"'Nunito', sans-serif" }}>← Todos</button>
                  </div>
                  <div onClick={() => { setSubrubroSel(null); setDropOpen(false); }} style={iDrop(false)}>
                    <span>📋</span><div style={{ fontSize:"13px", fontWeight:800, color:"#1a2a3a" }}>Todos en {rubroSel.nombre}</div>
                  </div>
                  {subrubrosDeRubro.map(s => (
                    <div key={s.id} onClick={() => selSubrubro(s)} style={iDrop(subrubroSel?.id === s.id)}>
                      <span style={{ fontSize:"13px" }}>↳</span>
                      <div style={{ fontSize:"13px", fontWeight:700, color:"#1a2a3a" }}>{s.nombre}</div>
                    </div>
                  ))}
                </>
              ) : (
                <>
                  {query === "" && <div style={{ padding:"10px 14px 4px", fontSize:"10px", fontWeight:800, color:"#9a9a9a", textTransform:"uppercase", letterSpacing:"1px" }}>Todos los rubros</div>}
                  {query !== "" && rubrosFiltered.length === 0 && subrubrosFiltered.length === 0 && (
                    <div style={{ padding:"20px", textAlign:"center", fontSize:"13px", color:"#9a9a9a", fontWeight:600 }}>Sin resultados para "{query}"</div>
                  )}
                  {rubrosFiltered.map(r => (
                    <div key={r.id} onClick={() => selRubro(r)} style={iDrop(rubroSel?.id === r.id)}>
                      <span>📂</span>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:"13px", fontWeight:800, color:"#1a2a3a" }}>{r.nombre}</div>
                        <div style={{ fontSize:"10px", color:"#9a9a9a", fontWeight:600 }}>{subrubrosFlat.filter(s => s.rubro_id === r.id).length} subrubros</div>
                      </div>
                      <span style={{ fontSize:"12px", color:"#d4a017", fontWeight:800 }}>→</span>
                    </div>
                  ))}
                  {query !== "" && subrubrosFiltered.length > 0 && (
                    <>
                      <div style={{ padding:"8px 14px 4px", fontSize:"10px", fontWeight:800, color:"#9a9a9a", textTransform:"uppercase", letterSpacing:"1px", borderTop:"1px solid #f0f0f0" }}>Subrubros</div>
                      {subrubrosFiltered.slice(0, 5).map(s => {
                        const r = rubrosFlat.find(x => x.id === s.rubro_id);
                        return (
                          <div key={s.id} onClick={() => selSubrubro(s)} style={iDrop(false)}>
                            <span style={{ fontSize:"13px" }}>↳</span>
                            <div>
                              <div style={{ fontSize:"13px", fontWeight:700, color:"#1a2a3a" }}>{s.nombre}</div>
                              {r && <div style={{ fontSize:"10px", color:"#9a9a9a", fontWeight:600 }}>en {r.nombre}</div>}
                            </div>
                          </div>
                        );
                      })}
                    </>
                  )}
                </>
              )}
              {query !== "" && (
                <div onClick={() => setDropOpen(false)} style={{ ...iDrop(false), borderTop:"1px solid #f0f0f0", background:"#f9f7f0" }}>
                  <span>🔍</span>
                  <div>
                    <div style={{ fontSize:"13px", fontWeight:800, color:"#d4a017" }}>Buscar "{query}"</div>
                    <div style={{ fontSize:"10px", color:"#9a9a9a", fontWeight:600 }}>Ver todos los resultados</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ════ RESULTADOS ════ */}
      {loading ? (
        <div style={{ textAlign:"center", padding:"40px", color:"#9a9a9a", fontWeight:700 }}>Cargando...</div>

      ) : busquedaLibre ? (
        /* MODO TEXTO LIBRE — grilla plana */
        <div>
          <div style={{ padding:"14px 16px 8px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <span style={{ fontSize:"14px", fontWeight:900, color:"#1a2a3a" }}>
              🔍 <span style={{ color:"#d4a017" }}>{resultadosTexto.length}</span> resultado{resultadosTexto.length !== 1 ? "s" : ""} para "{query}"
            </span>
            <button onClick={limpiarBusqueda} style={{ background:"none", border:"none", fontSize:"12px", fontWeight:700, color:"#9a9a9a", cursor:"pointer", fontFamily:"'Nunito', sans-serif" }}>✕ Limpiar</button>
          </div>
          {resultadosTexto.length === 0 ? (
            <div style={{ textAlign:"center", padding:"40px 20px" }}>
              <div style={{ fontSize:"40px", marginBottom:"12px" }}>🔍</div>
              <div style={{ fontSize:"15px", fontWeight:800, color:"#1a2a3a", marginBottom:"6px" }}>Sin resultados</div>
              <div style={{ fontSize:"13px", color:"#9a9a9a", fontWeight:600, marginBottom:"20px" }}>No encontramos anuncios para "{query}"</div>
              <button onClick={limpiarBusqueda} style={{ background:"linear-gradient(135deg,#d4a017,#f0c040)", border:"none", borderRadius:"12px", padding:"12px 24px", fontSize:"13px", fontWeight:800, color:"#1a2a3a", cursor:"pointer", fontFamily:"'Nunito', sans-serif" }}>Ver todos</button>
            </div>
          ) : (
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px", padding:"0 16px 16px" }}>
              {resultadosTexto.map(a => <TarjetaCard key={a.id} a={a} qLow={qLow} query={query} formatPrecio={formatPrecio} />)}
            </div>
          )}
        </div>

      ) : (
        /* MODO RUBROS AGRUPADOS */
        rubrosAMostrar.map(rubro => {
          const items = getAnunciosPorRubro(rubro);
          // Solo ocultar si hay filtro de ubicación activo Y no tiene anuncios
          if (ubiActiva && !rubroSel && items.length === 0) return null;
          return (
            <div key={rubro.id} style={{ marginBottom:"8px", background:"#fff", paddingBottom:"12px", borderBottom:"6px solid #f4f4f2" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"14px 16px 8px" }}>
                <span style={{ fontSize:"16px", fontWeight:900, color:"#1a2a3a" }}>{rubro.nombre}</span>
                <span style={{ fontSize:"12px", fontWeight:700, color:"#d4a017" }}>Ver todos →</span>
              </div>
              <div style={{ display:"flex", gap:"8px", padding:"0 16px 12px", overflowX:"auto", scrollbarWidth:"none" }}>
                {rubro.subrubros.map(sub => (
                  <button key={sub.id} onClick={() => toggleSub(rubro.id, sub.id)} style={{
                    background: subActivos[rubro.id] === sub.id ? "#1a2a3a" : "#f4f4f2",
                    border:`2px solid ${subActivos[rubro.id] === sub.id ? "#1a2a3a" : "#e8e8e6"}`,
                    borderRadius:"20px", padding:"5px 14px", fontSize:"12px", fontWeight:700,
                    color: subActivos[rubro.id] === sub.id ? "#d4a017" : "#2c2c2e",
                    whiteSpace:"nowrap", cursor:"pointer", flexShrink:0, fontFamily:"'Nunito', sans-serif",
                  }}>{sub.nombre}</button>
                ))}
              </div>
              {items.length === 0 ? (
                <div style={{ padding:"12px 16px", color:"#9a9a9a", fontSize:"13px", fontWeight:600 }}>
                  Sin anuncios{ubiActiva ? ` en ${barrioSel || ciudadSel || provSel}` : ""}
                </div>
              ) : (
                <div style={{ display:"flex", gap:"12px", padding:"0 16px", overflowX:"auto", scrollbarWidth:"none" }}>
                  {items.map(a => <TarjetaCard key={a.id} a={a} formatPrecio={formatPrecio} horizontal />)}
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

// ── Tarjeta reutilizable ──
function TarjetaCard({ a, qLow, query, formatPrecio, horizontal }: {
  a: any; qLow?: string; query?: string; formatPrecio: (p: number, m: string) => string; horizontal?: boolean;
}) {
  const f = FUENTES[a.fuente] || FUENTES.nexonet;
  return (
    <a href={`/anuncios/${a.id}`} style={{ textDecoration:"none", flexShrink: horizontal ? 0 : undefined, width: horizontal ? "160px" : undefined }}>
      <div style={{ background:"#fff", borderRadius:"14px", overflow:"hidden", boxShadow:"0 2px 10px rgba(0,0,0,0.08)", border:"1px solid #f0f0f0" }}>
        <div style={{ background:f.color, padding:"3px 8px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <span style={{ fontSize:"9px", fontWeight:900, color:f.texto, textTransform:"uppercase" }}>{f.label}</span>
          {a.flash && <span style={{ background:"#1a2a3a", color:"#d4a017", fontSize:"8px", fontWeight:900, padding:"1px 5px", borderRadius:"5px" }}>⚡Flash</span>}
        </div>
        <div style={{ width:"100%", height:"110px", background:"#f4f4f2", display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden" }}>
          {a.imagenes?.[0] ? <img src={a.imagenes[0]} alt={a.titulo} style={{ width:"100%", height:"100%", objectFit:"cover" }} /> : <span style={{ fontSize:"36px" }}>📦</span>}
        </div>
        <div style={{ padding:"8px 10px 10px" }}>
          <div style={{ fontSize:"12px", fontWeight:800, color:"#2c2c2e", marginBottom:"3px", overflow:"hidden", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical" }}>
            {qLow && query
              ? a.titulo.split(new RegExp(`(${query})`, "gi")).map((part: string, i: number) =>
                  part.toLowerCase() === qLow
                    ? <mark key={i} style={{ background:"#fff3cd", color:"#1a2a3a", borderRadius:"3px", padding:"0 2px" }}>{part}</mark>
                    : part
                )
              : a.titulo
            }
          </div>
          <div style={{ fontSize:"14px", fontWeight:900, color:"#d4a017" }}>{formatPrecio(a.precio, a.moneda)}</div>
          <div style={{ fontSize:"11px", color:"#9a9a9a", fontWeight:600, marginTop:"2px" }}>📍 {a.ciudad}</div>
        </div>
      </div>
    </a>
  );
}

const iDrop = (activo: boolean): React.CSSProperties => ({
  display:"flex", alignItems:"center", gap:"12px", padding:"12px 14px", cursor:"pointer",
  background: activo ? "rgba(212,160,23,0.08)" : "transparent",
  borderLeft: activo ? "3px solid #d4a017" : "3px solid transparent",
});

// ── Selector de ubicación custom (reemplaza <select> nativo) ──
function UbiSelect({ value, placeholder, opciones, onChange }: {
  value: string;
  placeholder: string;
  opciones: string[];
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [filtro, setFiltro] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false); setFiltro("");
      }
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const filtradas = opciones.filter(o => o.toLowerCase().includes(filtro.toLowerCase()));

  return (
    <div ref={ref} style={{ flex:1, position:"relative", minWidth:0 }}>
      {/* BOTÓN TRIGGER */}
      <button
        onClick={() => { setOpen(v => !v); setFiltro(""); }}
        style={{
          width:"100%", height:"42px",
          background: value ? "#d4a017" : "rgba(255,255,255,0.12)",
          border:`2px solid ${value ? "#d4a017" : "rgba(255,255,255,0.3)"}`,
          borderRadius:"12px", padding:"0 10px",
          fontSize:"12px", fontWeight:800,
          color: value ? "#1a2a3a" : "#fff",
          cursor:"pointer", fontFamily:"'Nunito', sans-serif",
          display:"flex", alignItems:"center", justifyContent:"space-between",
          gap:"4px", whiteSpace:"nowrap", overflow:"hidden",
        }}
      >
        <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
          {value || placeholder}
        </span>
        <span style={{ fontSize:"10px", opacity:0.7, flexShrink:0 }}>{open ? "▲" : "▼"}</span>
      </button>

      {/* DROPDOWN */}
      {open && (
        <div style={{
          position:"absolute", top:"calc(100% + 4px)", left:0, right:0, zIndex:200,
          background:"#fff", borderRadius:"12px", boxShadow:"0 8px 32px rgba(0,0,0,0.25)",
          border:"1px solid #e8e8e6", maxHeight:"260px", display:"flex", flexDirection:"column",
          overflow:"hidden",
        }}>
          {/* BÚSQUEDA DENTRO DEL DROPDOWN */}
          <div style={{ padding:"8px", borderBottom:"1px solid #f0f0f0", flexShrink:0 }}>
            <input
              autoFocus
              type="text"
              value={filtro}
              onChange={e => setFiltro(e.target.value)}
              placeholder="Buscar..."
              style={{
                width:"100%", border:"2px solid #e8e8e6", borderRadius:"8px",
                padding:"7px 10px", fontSize:"13px", fontFamily:"'Nunito', sans-serif",
                outline:"none", boxSizing:"border-box", color:"#1a2a3a",
              }}
            />
          </div>
          {/* OPCIONES */}
          <div style={{ overflowY:"auto", flex:1 }}>
            {value && (
              <div
                onClick={() => { onChange(""); setOpen(false); setFiltro(""); }}
                style={{ padding:"10px 14px", fontSize:"12px", fontWeight:700, color:"#e74c3c", cursor:"pointer", borderBottom:"1px solid #f9f9f9", display:"flex", alignItems:"center", gap:"6px" }}
              >
                ✕ Limpiar selección
              </div>
            )}
            {filtradas.length === 0 ? (
              <div style={{ padding:"16px", textAlign:"center", fontSize:"13px", color:"#9a9a9a" }}>Sin resultados</div>
            ) : (
              filtradas.map(o => (
                <div
                  key={o}
                  onClick={() => { onChange(o); setOpen(false); setFiltro(""); }}
                  style={{
                    padding:"10px 14px", fontSize:"13px", fontWeight: o === value ? 800 : 600,
                    color: o === value ? "#d4a017" : "#1a2a3a",
                    background: o === value ? "rgba(212,160,23,0.08)" : "transparent",
                    cursor:"pointer", borderLeft: o === value ? "3px solid #d4a017" : "3px solid transparent",
                  }}
                >
                  {o}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
