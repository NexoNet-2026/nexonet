"use client";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { useState, useEffect, useRef } from "react";
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

const FUENTES: Record<string, { color: string; texto: string; label: string }> = {
  nexonet:       { color: "#d4a017", texto: "#1a2a3a", label: "NexoNet"        },
  mercadolibre:  { color: "#ffe600", texto: "#333",    label: "Mercado Libre"  },
  rosariogarage: { color: "#ff6b00", texto: "#fff",    label: "Rosario Garage" },
  olx:           { color: "#00a884", texto: "#fff",    label: "OLX"            },
  otro:          { color: "#888",    texto: "#fff",    label: "Externo"        },
};

type ModoUbi = "gps" | "manual";

export default function Buscar() {
  const searchParams = useSearchParams();

  // ── Modo ubicación ──
  const [modoUbi,     setModoUbi]     = useState<ModoUbi>("gps");
  const [ubiPanel,    setUbiPanel]    = useState(false); // panel abierto/cerrado

  // ── GPS ──
  const [gpsLoading,  setGpsLoading]  = useState(false);
  const [gpsProv,     setGpsProv]     = useState("");
  const [gpsCiudad,   setGpsCiudad]   = useState("");
  const [gpsBarrio,   setGpsBarrio]   = useState("");
  const [gpsNivel,    setGpsNivel]    = useState<"provincia"|"ciudad"|"barrio"|"">("");

  // ── Manual ──
  const [manProv,     setManProv]     = useState("");
  const [manCiudad,   setManCiudad]   = useState("");
  const [manBarrio,   setManBarrio]   = useState("");

  // Listas para manual (extraídas de los anuncios cargados)
  const [listaProvs,   setListaProvs]   = useState<string[]>([]);
  const [listaCiudades, setListaCiudades] = useState<string[]>([]);
  const [listaBarrios,  setListaBarrios]  = useState<string[]>([]);

  // ── Buscador dropdown ──
  const [query,       setQuery]       = useState("");
  const [rubroSel,    setRubroSel]    = useState<RubroFlat | null>(null);
  const [subrubroSel, setSubrubroSel] = useState<SubrubroFlat | null>(null);
  const [dropOpen,    setDropOpen]    = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropRef  = useRef<HTMLDivElement>(null);

  // ── Datos ──
  const [rubros,        setRubros]        = useState<Rubro[]>([]);
  const [rubrosFlat,    setRubrosFlat]    = useState<RubroFlat[]>([]);
  const [subrubrosFlat, setSubrubrosFlat] = useState<SubrubroFlat[]>([]);
  const [anuncios,      setAnuncios]      = useState<Anuncio[]>([]);
  const [subrubrosActivos, setSubrubrosActivos] = useState<Record<number, number | null>>({});
  const [loading,       setLoading]       = useState(true);

  // Leer params de URL
  useEffect(() => {
    const qParam = searchParams.get("q");
    if (qParam) setQuery(qParam);
    (window as any).__initRubroParam    = searchParams.get("rubro");
    (window as any).__initSubrubroParam = searchParams.get("subrubro");
  }, []);

  useEffect(() => {
    const cargar = async () => {
      const [{ data: rData }, { data: aData }] = await Promise.all([
        supabase.from("rubros").select("id, nombre, subrubros(id, nombre)").order("nombre"),
        supabase.from("anuncios")
          .select("id, titulo, precio, moneda, ciudad, provincia, barrio, imagenes, flash, fuente, subrubro_id")
          .eq("estado", "activo").order("created_at", { ascending: false }).limit(100),
      ]);

      if (rData) {
        setRubros(rData as any);
        const flat = rData.map((r: any) => ({ id: r.id, nombre: r.nombre }));
        setRubrosFlat(flat);
        setSubrubrosFlat(rData.flatMap((r: any) =>
          (r.subrubros || []).map((s: any) => ({ id: s.id, nombre: s.nombre, rubro_id: r.id }))
        ));
        const rP = (window as any).__initRubroParam;
        const sP = (window as any).__initSubrubroParam;
        if (rP) { const r = flat.find((x: RubroFlat) => x.id === parseInt(rP)); if (r) { setRubroSel(r); setQuery(r.nombre); } }
        if (sP) {
          const allSub = rData.flatMap((r: any) => (r.subrubros||[]).map((s: any) => ({ id:s.id, nombre:s.nombre, rubro_id:r.id })));
          const s = allSub.find((x: SubrubroFlat) => x.id === parseInt(sP));
          if (s) { setSubrubroSel(s); setQuery(s.nombre); }
        }
      }

      if (aData) {
        setAnuncios(aData as any);
        // Listas únicas para manual
        const provs    = [...new Set((aData as any[]).map(a => a.provincia).filter(Boolean))].sort();
        setListaProvs(provs);
      }
      setLoading(false);
    };
    cargar();
  }, []);

  // Actualizar ciudades cuando cambia provincia manual
  useEffect(() => {
    if (!manProv) { setListaCiudades([]); setManCiudad(""); setManBarrio(""); return; }
    const ciudades = [...new Set(anuncios.filter(a => a.provincia === manProv).map(a => a.ciudad).filter(Boolean))].sort();
    setListaCiudades(ciudades);
    setManCiudad(""); setManBarrio("");
  }, [manProv, anuncios]);

  // Actualizar barrios cuando cambia ciudad manual
  useEffect(() => {
    if (!manCiudad) { setListaBarrios([]); setManBarrio(""); return; }
    const barrios = [...new Set(anuncios.filter(a => a.ciudad === manCiudad).map(a => a.barrio).filter(Boolean))].sort();
    setListaBarrios(barrios);
    setManBarrio("");
  }, [manCiudad, anuncios]);

  // Cerrar dropdown al clickear afuera
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
        setGpsProv(d.address?.state || "");
        setGpsCiudad(d.address?.city || d.address?.town || d.address?.village || "");
        setGpsBarrio(d.address?.suburb || d.address?.neighbourhood || "");
        setGpsNivel("provincia");
        setModoUbi("gps");
        setUbiPanel(false);
      } catch { alert("No se pudo obtener la ubicación"); }
      setGpsLoading(false);
    }, () => { alert("No se pudo acceder al GPS"); setGpsLoading(false); });
  };

  const avanzarGPS = () => {
    if (gpsNivel === "provincia") setGpsNivel("ciudad");
    else if (gpsNivel === "ciudad") setGpsNivel("barrio");
    else { setGpsNivel(""); setGpsProv(""); setGpsCiudad(""); setGpsBarrio(""); }
  };

  const gpsLabel = () => {
    if (!gpsNivel) return "📍 GPS";
    if (gpsNivel === "provincia") return `🗺️ ${gpsProv}`;
    if (gpsNivel === "ciudad")    return `🏙️ ${gpsCiudad}`;
    return `🏘️ ${gpsBarrio || gpsCiudad}`;
  };
  const gpsNextLabel = () => {
    if (gpsNivel === "provincia" && gpsCiudad) return `Acotar a ${gpsCiudad}`;
    if (gpsNivel === "ciudad"   && gpsBarrio)  return `Acotar a ${gpsBarrio}`;
    if (gpsNivel) return "Limpiar filtro";
    return null;
  };

  // Label resumen ubicación activa
  const ubiActiva = modoUbi === "gps" ? !!gpsNivel
    : !!(manProv || manCiudad || manBarrio);

  const ubiResumen = () => {
    if (modoUbi === "gps") return gpsLabel();
    const parts = [manProv, manCiudad, manBarrio].filter(Boolean);
    return parts.length ? `📍 ${parts.join(", ")}` : "📍 Sin filtro";
  };

  // ── Buscador ──
  const qLow = query.toLowerCase();
  const rubrosFiltered    = rubrosFlat.filter(r => r.nombre.toLowerCase().includes(qLow));
  const subrubrosFiltered = subrubrosFlat.filter(s => s.nombre.toLowerCase().includes(qLow));
  const subrubrosDeRubro  = rubroSel ? subrubrosFlat.filter(s => s.rubro_id === rubroSel.id) : [];

  const limpiarBusqueda = () => { setQuery(""); setRubroSel(null); setSubrubroSel(null); setDropOpen(false); };
  const selRubro    = (r: RubroFlat)    => { setRubroSel(r); setSubrubroSel(null); setQuery(r.nombre); setDropOpen(false); };
  const selSubrubro = (s: SubrubroFlat) => {
    setRubroSel(rubrosFlat.find(r => r.id === s.rubro_id)||null);
    setSubrubroSel(s); setQuery(s.nombre); setDropOpen(false);
  };
  const toggleSubrubro = (rubroId: number, subId: number) =>
    setSubrubrosActivos(p => ({ ...p, [rubroId]: p[rubroId] === subId ? null : subId }));

  // ── Filtrado de anuncios ──
  const anunciosFiltrados = anuncios.filter(a => {
    // Geo
    let geo = true;
    if (modoUbi === "gps" && gpsNivel) {
      if (gpsNivel === "provincia") geo = a.provincia?.toLowerCase().includes(gpsProv.toLowerCase());
      if (gpsNivel === "ciudad")    geo = a.ciudad?.toLowerCase().includes(gpsCiudad.toLowerCase());
      if (gpsNivel === "barrio")    geo = (a.barrio||a.ciudad)?.toLowerCase().includes((gpsBarrio||gpsCiudad).toLowerCase());
    }
    if (modoUbi === "manual") {
      if (manBarrio) geo = (a.barrio||"").toLowerCase().includes(manBarrio.toLowerCase());
      else if (manCiudad) geo = (a.ciudad||"").toLowerCase().includes(manCiudad.toLowerCase());
      else if (manProv)   geo = (a.provincia||"").toLowerCase().includes(manProv.toLowerCase());
    }
    // Búsqueda texto
    const matchQ = query && !rubroSel
      ? a.titulo.toLowerCase().includes(qLow) : true;
    return geo && matchQ;
  });

  const getAnunciosPorRubro = (rubro: Rubro) => {
    const subIds    = rubro.subrubros.map(s => s.id);
    const subActivo = subrubrosActivos[rubro.id];
    return anunciosFiltrados.filter(a =>
      subActivo ? a.subrubro_id === subActivo : subIds.includes(a.subrubro_id)
    ).slice(0, 8);
  };

  // Modo texto libre: busca en titulo, descripcion, rubro, subrubro
  const busquedaLibre = query.trim() !== "" && !rubroSel && !subrubroSel;

  const resultadosTexto = busquedaLibre
    ? anunciosFiltrados.filter(a =>
        a.titulo.toLowerCase().includes(qLow)
      )
    : [];

  const rubrosAMostrar = rubroSel ? rubros.filter(r => r.id === rubroSel.id) : rubros;
  const formatPrecio   = (precio: number, moneda: string) =>
    !precio ? "Consultar" : `${moneda === "USD" ? "U$D" : "$"} ${precio.toLocaleString("es-AR")}`;

  // ── Placeholder dinámico ──
  const placeholderGeo = () => {
    if (modoUbi === "manual") {
      const lugar = manBarrio || manCiudad || manProv;
      return lugar ? `¿Qué buscás en ${lugar}?` : "¿Qué buscás?";
    }
    if (gpsNivel === "barrio")    return `¿Qué buscás en ${gpsBarrio||gpsCiudad}?`;
    if (gpsNivel === "ciudad")    return `¿Qué buscás en ${gpsCiudad}?`;
    if (gpsNivel === "provincia") return `¿Qué buscás en ${gpsProv}?`;
    return "¿Qué buscás?";
  };

  return (
    <main style={{ paddingTop:"95px", paddingBottom:"130px", background:"#f4f4f2", minHeight:"100vh", fontFamily:"'Nunito', sans-serif" }}>
      <Header />

      {/* ════ BARRA SUPERIOR ════ */}
      <div style={{ background:"linear-gradient(135deg, #1a2a3a 0%, #243b55 100%)", padding:"14px 16px 16px", display:"flex", flexDirection:"column", gap:"10px" }}>

        {/* FILA 1: UBICACIÓN */}
        <div style={{ display:"flex", gap:"8px" }}>
          {/* Botón resumen ubicación → abre panel */}
          <button onClick={() => setUbiPanel(v => !v)} style={{
            flex:1, background: ubiActiva ? "rgba(212,160,23,0.2)" : "rgba(255,255,255,0.1)",
            border:`2px solid ${ubiActiva ? "#d4a017" : "rgba(255,255,255,0.25)"}`,
            borderRadius:"12px", padding:"10px 14px", fontSize:"13px", fontWeight:800,
            color: ubiActiva ? "#d4a017" : "#fff", cursor:"pointer",
            fontFamily:"'Nunito', sans-serif", textAlign:"left",
            display:"flex", alignItems:"center", justifyContent:"space-between",
          }}>
            <span>{ubiActiva ? ubiResumen() : "📍 ¿Dónde buscás?"}</span>
            <span style={{ fontSize:"10px", opacity:0.7 }}>{ubiPanel ? "▲" : "▼"}</span>
          </button>

          {/* Si GPS activo → botón acotar */}
          {modoUbi === "gps" && gpsNivel && gpsNextLabel() && (
            <button onClick={avanzarGPS} style={{
              background:"rgba(255,255,255,0.12)", border:"2px solid rgba(255,255,255,0.25)",
              borderRadius:"12px", padding:"10px 12px", fontSize:"11px", fontWeight:800,
              color:"#fff", cursor:"pointer", fontFamily:"'Nunito', sans-serif", whiteSpace:"nowrap", flexShrink:0,
            }}>
              {gpsNextLabel()} →
            </button>
          )}
        </div>

        {/* PANEL UBICACIÓN */}
        {ubiPanel && (
          <div style={{ background:"rgba(255,255,255,0.06)", borderRadius:"14px", padding:"14px", border:"1px solid rgba(255,255,255,0.12)" }}>

            {/* TABS GPS / MANUAL */}
            <div style={{ display:"flex", gap:"8px", marginBottom:"14px" }}>
              {[["gps","📡 GPS automático"],["manual","✏️ Ingresar manual"]] .map(([m, l]) => (
                <button key={m} onClick={() => setModoUbi(m as ModoUbi)} style={{
                  flex:1, background: modoUbi === m ? "#d4a017" : "rgba(255,255,255,0.1)",
                  border:"none", borderRadius:"10px", padding:"8px", fontSize:"12px", fontWeight:800,
                  color: modoUbi === m ? "#1a2a3a" : "#fff", cursor:"pointer", fontFamily:"'Nunito', sans-serif",
                }}>{l}</button>
              ))}
            </div>

            {/* GPS */}
            {modoUbi === "gps" && (
              <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
                <button onClick={detectarGPS} disabled={gpsLoading} style={{
                  width:"100%", background: gpsNivel ? "rgba(39,174,96,0.2)" : "#d4a017",
                  border:`2px solid ${gpsNivel ? "#27ae60" : "#d4a017"}`,
                  borderRadius:"12px", padding:"12px", fontSize:"13px", fontWeight:900,
                  color: gpsNivel ? "#27ae60" : "#1a2a3a", cursor:"pointer",
                  fontFamily:"'Nunito', sans-serif", opacity: gpsLoading ? 0.7 : 1,
                }}>
                  {gpsLoading ? "⏳ Detectando..." : gpsNivel ? `✅ ${gpsLabel()} — Volver a detectar` : "📍 Detectar mi ubicación por GPS"}
                </button>

                {/* Niveles GPS detectados */}
                {gpsNivel && (
                  <div style={{ display:"flex", flexDirection:"column", gap:"6px" }}>
                    {[
                      { nivel:"provincia", label:`🗺️ ${gpsProv}`,          activo: gpsNivel === "provincia" },
                      { nivel:"ciudad",    label:`🏙️ ${gpsCiudad}`,         activo: gpsNivel === "ciudad"    },
                      ...(gpsBarrio ? [{ nivel:"barrio", label:`🏘️ ${gpsBarrio}`, activo: gpsNivel === "barrio" }] : []),
                    ].map(item => (
                      <button key={item.nivel} onClick={() => { setGpsNivel(item.nivel as any); setUbiPanel(false); }} style={{
                        width:"100%", background: item.activo ? "rgba(212,160,23,0.25)" : "rgba(255,255,255,0.08)",
                        border:`2px solid ${item.activo ? "#d4a017" : "rgba(255,255,255,0.15)"}`,
                        borderRadius:"10px", padding:"10px 14px", fontSize:"13px", fontWeight:800,
                        color: item.activo ? "#d4a017" : "#8a9aaa", cursor:"pointer",
                        fontFamily:"'Nunito', sans-serif", textAlign:"left", display:"flex", alignItems:"center", justifyContent:"space-between",
                      }}>
                        {item.label}
                        {item.activo && <span style={{ fontSize:"10px", background:"#d4a017", color:"#1a2a3a", borderRadius:"20px", padding:"2px 8px" }}>ACTIVO</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* MANUAL */}
            {modoUbi === "manual" && (
              <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>

                {/* PROVINCIA */}
                <div>
                  <div style={labelStyle}>🗺️ Provincia</div>
                  <select value={manProv} onChange={e => setManProv(e.target.value)} style={selectStyle}>
                    <option value="">Todas las provincias</option>
                    {listaProvs.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>

                {/* CIUDAD */}
                {manProv && (
                  <div>
                    <div style={labelStyle}>🏙️ Ciudad</div>
                    <select value={manCiudad} onChange={e => setManCiudad(e.target.value)} style={selectStyle}>
                      <option value="">Todas las ciudades</option>
                      {listaCiudades.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                )}

                {/* BARRIO */}
                {manCiudad && listaBarrios.length > 0 && (
                  <div>
                    <div style={labelStyle}>🏘️ Barrio</div>
                    <select value={manBarrio} onChange={e => setManBarrio(e.target.value)} style={selectStyle}>
                      <option value="">Todos los barrios</option>
                      {listaBarrios.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                )}

                {/* BOTÓN APLICAR */}
                <button onClick={() => setUbiPanel(false)} style={{
                  width:"100%", background:"linear-gradient(135deg, #d4a017, #f0c040)",
                  border:"none", borderRadius:"12px", padding:"12px", fontSize:"13px",
                  fontWeight:900, color:"#1a2a3a", cursor:"pointer", fontFamily:"'Nunito', sans-serif",
                }}>
                  ✅ Aplicar ubicación
                </button>

                {(manProv || manCiudad || manBarrio) && (
                  <button onClick={() => { setManProv(""); setManCiudad(""); setManBarrio(""); }} style={{
                    width:"100%", background:"none", border:"1px solid rgba(255,255,255,0.2)",
                    borderRadius:"10px", padding:"8px", fontSize:"12px", fontWeight:700,
                    color:"#8a9aaa", cursor:"pointer", fontFamily:"'Nunito', sans-serif",
                  }}>
                    ✕ Limpiar filtro de ubicación
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* FILA 2: BUSCADOR CON DROPDOWN */}
        <div style={{ position:"relative" }}>
          <div style={{ display:"flex", background:"#fff", borderRadius:"14px", boxShadow:"0 2px 8px rgba(0,0,0,0.2)", position:"relative", zIndex:10 }}>
            <div style={{ flex:1, position:"relative" }}>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => { setQuery(e.target.value); setRubroSel(null); setSubrubroSel(null); setDropOpen(true); }}
                onFocus={() => setDropOpen(true)}
                placeholder={placeholderGeo()}
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
            <button onClick={() => setDropOpen(false)} style={{ background:"#d4a017", border:"none", padding:"0 18px", cursor:"pointer", fontSize:"16px", fontWeight:900, color:"#1a2a3a", borderRadius:"0 14px 14px 0", flexShrink:0 }}>🔍</button>
          </div>

          {/* DROPDOWN RUBROS */}
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

        {/* CHIPS FILTROS ACTIVOS */}
        {(ubiActiva || rubroSel) && (
          <div style={{ display:"flex", gap:"6px", flexWrap:"wrap" }}>
            {ubiActiva && (
              <div style={{ background:"rgba(212,160,23,0.2)", borderRadius:"20px", padding:"4px 12px", fontSize:"11px", fontWeight:800, color:"#d4a017" }}>
                {ubiResumen()}
              </div>
            )}
            {rubroSel && (
              <div onClick={limpiarBusqueda} style={{ background:"rgba(255,255,255,0.15)", borderRadius:"20px", padding:"4px 12px", fontSize:"11px", fontWeight:800, color:"#fff", cursor:"pointer" }}>
                📂 {rubroSel.nombre}{subrubroSel ? ` → ${subrubroSel.nombre}` : ""} ✕
              </div>
            )}
          </div>
        )}
      </div>

      {/* ════ LISTADO ════ */}
      {loading ? (
        <div style={{ textAlign:"center", padding:"40px", color:"#9a9a9a", fontWeight:700 }}>Cargando...</div>

      /* ── MODO TEXTO LIBRE ── */
      ) : busquedaLibre ? (
        <div>
          <div style={{ padding:"14px 16px 8px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <span style={{ fontSize:"14px", fontWeight:900, color:"#1a2a3a" }}>
              🔍 {resultadosTexto.length} resultado{resultadosTexto.length !== 1 ? "s" : ""} para <span style={{ color:"#d4a017" }}>"{query}"</span>
            </span>
            <button onClick={limpiarBusqueda} style={{ background:"none", border:"none", fontSize:"12px", fontWeight:700, color:"#9a9a9a", cursor:"pointer", fontFamily:"'Nunito', sans-serif" }}>✕ Limpiar</button>
          </div>

          {resultadosTexto.length === 0 ? (
            <div style={{ textAlign:"center", padding:"40px 20px" }}>
              <div style={{ fontSize:"40px", marginBottom:"12px" }}>🔍</div>
              <div style={{ fontSize:"16px", fontWeight:800, color:"#1a2a3a", marginBottom:"6px" }}>Sin resultados</div>
              <div style={{ fontSize:"13px", color:"#9a9a9a", fontWeight:600, marginBottom:"20px" }}>No encontramos anuncios para "{query}"</div>
              <button onClick={limpiarBusqueda} style={{ background:"linear-gradient(135deg,#d4a017,#f0c040)", border:"none", borderRadius:"12px", padding:"12px 24px", fontSize:"13px", fontWeight:800, color:"#1a2a3a", cursor:"pointer", fontFamily:"'Nunito', sans-serif" }}>
                Ver todos los anuncios
              </button>
            </div>
          ) : (
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px", padding:"0 16px 16px" }}>
              {resultadosTexto.map(a => {
                const f = FUENTES[a.fuente] || FUENTES.nexonet;
                return (
                  <a key={a.id} href={`/anuncios/${a.id}`} style={{ textDecoration:"none" }}>
                    <div style={{ background:"#fff", borderRadius:"14px", overflow:"hidden", boxShadow:"0 2px 10px rgba(0,0,0,0.08)", border:"1px solid #f0f0f0" }}>
                      <div style={{ background:f.color, padding:"3px 8px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                        <span style={{ fontSize:"9px", fontWeight:900, color:f.texto, textTransform:"uppercase" }}>{f.label}</span>
                        {a.flash && <span style={{ background:"#1a2a3a", color:"#d4a017", fontSize:"8px", fontWeight:900, padding:"1px 5px", borderRadius:"5px" }}>⚡Flash</span>}
                      </div>
                      <div style={{ width:"100%", height:"110px", background:"#f4f4f2", display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden" }}>
                        {a.imagenes?.[0] ? <img src={a.imagenes[0]} alt={a.titulo} style={{ width:"100%", height:"100%", objectFit:"cover" }} /> : <span style={{ fontSize:"36px" }}>📦</span>}
                      </div>
                      <div style={{ padding:"8px 10px 10px" }}>
                        {/* Highlight del texto buscado */}
                        <div style={{ fontSize:"12px", fontWeight:800, color:"#2c2c2e", marginBottom:"3px", overflow:"hidden", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical" }}>
                          {a.titulo.split(new RegExp(`(${query})`, "gi")).map((part, i) =>
                            part.toLowerCase() === qLow
                              ? <mark key={i} style={{ background:"#fff3cd", color:"#1a2a3a", borderRadius:"3px", padding:"0 2px" }}>{part}</mark>
                              : part
                          )}
                        </div>
                        <div style={{ fontSize:"14px", fontWeight:900, color:"#d4a017" }}>{formatPrecio(a.precio, a.moneda)}</div>
                        <div style={{ fontSize:"10px", color:"#9a9a9a", fontWeight:600, marginTop:"2px" }}>📍 {a.ciudad}</div>
                      </div>
                    </div>
                  </a>
                );
              })}
            </div>
          )}
        </div>

      /* ── MODO AGRUPADO POR RUBRO ── */
      ) : (
        rubrosAMostrar.map(rubro => {
          const items = getAnunciosPorRubro(rubro);
          if (!rubroSel && items.length === 0) return null; // ocultar rubros vacíos
          return (
            <div key={rubro.id} style={{ marginBottom:"8px", background:"#fff", paddingBottom:"12px", borderBottom:"6px solid #f4f4f2" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"14px 16px 8px" }}>
                <span style={{ fontSize:"16px", fontWeight:900, color:"#1a2a3a" }}>{rubro.nombre}</span>
                <span style={{ fontSize:"12px", fontWeight:700, color:"#d4a017", cursor:"pointer" }}>Ver todos →</span>
              </div>
              <div style={{ display:"flex", gap:"8px", padding:"0 16px 12px", overflowX:"auto", scrollbarWidth:"none" }}>
                {rubro.subrubros.map(sub => (
                  <button key={sub.id} onClick={() => toggleSubrubro(rubro.id, sub.id)} style={{
                    background: subrubrosActivos[rubro.id] === sub.id ? "#1a2a3a" : "#f4f4f2",
                    border:`2px solid ${subrubrosActivos[rubro.id] === sub.id ? "#1a2a3a" : "#e8e8e6"}`,
                    borderRadius:"20px", padding:"5px 14px", fontSize:"12px", fontWeight:700,
                    color: subrubrosActivos[rubro.id] === sub.id ? "#d4a017" : "#2c2c2e",
                    whiteSpace:"nowrap", cursor:"pointer", flexShrink:0, fontFamily:"'Nunito', sans-serif",
                  }}>{sub.nombre}</button>
                ))}
              </div>
              {items.length === 0 ? (
                <div style={{ padding:"12px 16px", color:"#9a9a9a", fontSize:"13px", fontWeight:600 }}>Sin anuncios{ubiActiva ? ` en ${ubiResumen().replace(/[📍🗺️🏙️🏘️]/g,"")}` : ""}</div>
              ) : (
                <div style={{ display:"flex", gap:"12px", padding:"0 16px", overflowX:"auto", scrollbarWidth:"none" }}>
                  {items.map(a => {
                    const f = FUENTES[a.fuente] || FUENTES.nexonet;
                    return (
                      <a key={a.id} href={`/anuncios/${a.id}`} style={{ textDecoration:"none", flexShrink:0, width:"160px" }}>
                        <div style={{ background:"#fff", borderRadius:"14px", overflow:"hidden", boxShadow:"0 2px 10px rgba(0,0,0,0.08)", border:"1px solid #f0f0f0" }}>
                          <div style={{ background:f.color, padding:"3px 8px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                            <span style={{ fontSize:"9px", fontWeight:900, color:f.texto, textTransform:"uppercase" }}>{f.label}</span>
                            {a.flash && <span style={{ background:"#1a2a3a", color:"#d4a017", fontSize:"8px", fontWeight:900, padding:"1px 5px", borderRadius:"5px" }}>⚡Flash</span>}
                          </div>
                          <div style={{ width:"100%", height:"110px", background:"#f4f4f2", display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden" }}>
                            {a.imagenes?.[0] ? <img src={a.imagenes[0]} alt={a.titulo} style={{ width:"100%", height:"100%", objectFit:"cover" }} /> : <span style={{ fontSize:"40px" }}>📦</span>}
                          </div>
                          <div style={{ padding:"8px 10px 10px" }}>
                            <div style={{ fontSize:"12px", fontWeight:800, color:"#2c2c2e", marginBottom:"3px", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{a.titulo}</div>
                            <div style={{ fontSize:"14px", fontWeight:900, color:"#d4a017" }}>{formatPrecio(a.precio, a.moneda)}</div>
                            <div style={{ fontSize:"11px", color:"#9a9a9a", fontWeight:600, marginTop:"2px" }}>📍 {a.ciudad}</div>
                          </div>
                        </div>
                      </a>
                    );
                  })}
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

const iDrop = (activo: boolean): React.CSSProperties => ({
  display:"flex", alignItems:"center", gap:"12px", padding:"12px 14px", cursor:"pointer",
  background: activo ? "rgba(212,160,23,0.08)" : "transparent",
  borderLeft: activo ? "3px solid #d4a017" : "3px solid transparent",
});
const labelStyle: React.CSSProperties = {
  fontSize:"11px", fontWeight:800, color:"rgba(255,255,255,0.7)",
  textTransform:"uppercase", letterSpacing:"1px", marginBottom:"6px",
};
const selectStyle: React.CSSProperties = {
  width:"100%", background:"rgba(255,255,255,0.12)", border:"2px solid rgba(255,255,255,0.2)",
  borderRadius:"10px", padding:"10px 14px", fontSize:"13px", fontWeight:700,
  color:"#fff", fontFamily:"'Nunito', sans-serif", outline:"none", cursor:"pointer",
  appearance:"none", WebkitAppearance:"none",
};
