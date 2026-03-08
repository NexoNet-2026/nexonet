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
  flash: boolean; fuente: string; envio_gratis: boolean;
  mas_vendido: boolean; tienda_oficial: boolean;
  descuento_cantidad: boolean; presupuesto_sin_cargo: boolean;
  conexion_habilitada: boolean; descuento_porcentaje: number;
  subrubro: string; rubro: string;
};

type Rubro = { id: number; nombre: string };
type Subrubro = { id: number; nombre: string; rubro_id: number };

export default function Home() {
  const router = useRouter();
  const [todos, setTodos]           = useState<Anuncio[]>([]);
  const [rubros, setRubros]         = useState<Rubro[]>([]);
  const [subrubros, setSubrubros]   = useState<Subrubro[]>([]);
  const [loading, setLoading]       = useState(true);

  // ── Buscador con dropdown ──
  const [query, setQuery]           = useState("");
  const [rubroSel, setRubroSel]     = useState<Rubro | null>(null);
  const [subrubroSel, setSubrubroSel] = useState<Subrubro | null>(null);
  const [dropOpen, setDropOpen]     = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropRef  = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cargar = async () => {
      const [{ data: rData }, { data: sData }, { data: aData }] = await Promise.all([
        supabase.from("rubros").select("id, nombre").order("nombre"),
        supabase.from("subrubros").select("id, nombre, rubro_id").order("nombre"),
        supabase.from("anuncios").select(`
          id, titulo, precio, moneda, ciudad, provincia, imagenes, flash,
          fuente, envio_gratis, mas_vendido, tienda_oficial, descuento_cantidad,
          presupuesto_sin_cargo, conexion_habilitada, descuento_porcentaje,
          subrubros!inner(nombre, rubros!inner(nombre))
        `).eq("estado", "activo").order("created_at", { ascending: false }).limit(40),
      ]);
      if (rData) setRubros(rData);
      if (sData) setSubrubros(sData);
      if (aData) {
        setTodos(aData.map((a: any) => ({
          id: a.id, titulo: a.titulo, precio: a.precio, moneda: a.moneda,
          ciudad: a.ciudad, provincia: a.provincia, imagenes: a.imagenes || [],
          flash: a.flash || false, fuente: a.fuente || "nexonet",
          envio_gratis: a.envio_gratis || false, mas_vendido: a.mas_vendido || false,
          tienda_oficial: a.tienda_oficial || false, descuento_cantidad: a.descuento_cantidad || false,
          presupuesto_sin_cargo: a.presupuesto_sin_cargo || false,
          conexion_habilitada: a.conexion_habilitada || false,
          descuento_porcentaje: a.descuento_porcentaje || 0,
          subrubro: a.subrubros?.nombre || "",
          rubro: a.subrubros?.rubros?.nombre || "",
        })));
      }
      setLoading(false);
    };
    cargar();
  }, []);

  // Cerrar dropdown al clickear afuera
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node) &&
          inputRef.current && !inputRef.current.contains(e.target as Node)) {
        setDropOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Filtrado del dropdown: rubros + subrubros que coincidan con query
  const queryLow = query.toLowerCase();
  const rubrosFiltered   = rubros.filter(r => r.nombre.toLowerCase().includes(queryLow));
  const subrubrosFiltered = subrubros.filter(s => s.nombre.toLowerCase().includes(queryLow));

  // Anuncios filtrados según selección
  const anunciosFiltrados = todos.filter(a => {
    const matchRubro    = rubroSel    ? a.rubro    === rubroSel.nombre    : true;
    const matchSubrubro = subrubroSel ? a.subrubro === subrubroSel.nombre : true;
    const matchQuery    = query && !rubroSel && !subrubroSel
      ? a.titulo.toLowerCase().includes(queryLow) ||
        a.rubro.toLowerCase().includes(queryLow)  ||
        a.subrubro.toLowerCase().includes(queryLow)
      : true;
    return matchRubro && matchSubrubro && matchQuery;
  });

  const destacados = anunciosFiltrados.filter(a => a.flash).slice(0, 6);
  const recientes  = anunciosFiltrados.slice(0, 8);

  const limpiar = () => {
    setQuery(""); setRubroSel(null); setSubrubroSel(null); setDropOpen(false);
  };

  const seleccionarRubro = (r: Rubro) => {
    setRubroSel(r); setSubrubroSel(null);
    setQuery(r.nombre); setDropOpen(false);
  };

  const seleccionarSubrubro = (s: Subrubro) => {
    const rubro = rubros.find(r => r.id === s.rubro_id) || null;
    setRubroSel(rubro); setSubrubroSel(s);
    setQuery(s.nombre); setDropOpen(false);
  };

  const irABuscar = () => {
    const params = new URLSearchParams();
    if (rubroSel)    params.set("rubro",    String(rubroSel.id));
    if (subrubroSel) params.set("subrubro", String(subrubroSel.id));
    if (query && !rubroSel) params.set("q", query);
    router.push(`/buscar?${params.toString()}`);
  };

  const formatPrecio = (precio: number, moneda: string) =>
    !precio ? "Consultar" : `${moneda === "USD" ? "U$D" : "$"} ${precio.toLocaleString("es-AR")}`;

  // Subrubros del rubro seleccionado (para segunda fila del dropdown)
  const subrubrosDeRubro = rubroSel
    ? subrubros.filter(s => s.rubro_id === rubroSel.id)
    : [];

  return (
    <main style={{ paddingTop:"95px", paddingBottom:"130px", background:"#f4f4f2", minHeight:"100vh", fontFamily:"'Nunito', sans-serif" }}>
      <Header />

      {/* HERO */}
      <div style={{ background:"linear-gradient(135deg, #1a2a3a 0%, #243b55 100%)", padding:"18px 16px 20px" }}>
        <div style={{ fontSize:"13px", fontWeight:700, color:"#d4a017", letterSpacing:"2px", textTransform:"uppercase", marginBottom:"4px", textAlign:"center" }}>
          Conectando Oportunidades
        </div>
        <div style={{ fontSize:"12px", color:"#7a8fa0", marginBottom:"14px", fontWeight:600, textAlign:"center" }}>
          Conectando a la Comunidad
        </div>

        {/* BUSCADOR */}
        <div style={{ position:"relative", maxWidth:"500px", margin:"0 auto" }}>
          <div style={{ display:"flex", background:"#fff", borderRadius:"14px", overflow:"visible", boxShadow:"0 4px 20px rgba(0,0,0,0.25)", position:"relative", zIndex:10 }}>
            <div style={{ flex:1, position:"relative" }}>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => { setQuery(e.target.value); setRubroSel(null); setSubrubroSel(null); setDropOpen(true); }}
                onFocus={() => setDropOpen(true)}
                placeholder="Rubro, subrubro o producto..."
                style={{ width:"100%", border:"none", padding:"14px 16px", fontFamily:"'Nunito', sans-serif", fontSize:"14px", color:"#2c2c2e", outline:"none", background:"transparent", boxSizing:"border-box", borderRadius:"14px 0 0 14px" }}
              />
              {/* TAG de selección activa */}
              {(rubroSel || subrubroSel) && (
                <div style={{ position:"absolute", right:"8px", top:"50%", transform:"translateY(-50%)", background:rubroSel?"#d4a017":"#2980b9", borderRadius:"20px", padding:"3px 10px", fontSize:"11px", fontWeight:800, color:rubroSel&&!subrubroSel?"#1a2a3a":"#fff", display:"flex", alignItems:"center", gap:"4px", cursor:"pointer" }} onClick={limpiar}>
                  {subrubroSel ? subrubroSel.nombre : rubroSel!.nombre} ✕
                </div>
              )}
            </div>
            {query && (
              <button onClick={limpiar} style={{ background:"none", border:"none", padding:"0 8px", cursor:"pointer", fontSize:"16px", color:"#9a9a9a" }}>✕</button>
            )}
            <button onClick={irABuscar} style={{ background:"#d4a017", border:"none", padding:"0 18px", cursor:"pointer", fontSize:"18px", borderRadius:"0 14px 14px 0", flexShrink:0 }}>🔍</button>
          </div>

          {/* DROPDOWN */}
          {dropOpen && (
            <div ref={dropRef} style={{ position:"absolute", top:"calc(100% + 6px)", left:0, right:0, background:"#fff", borderRadius:"14px", boxShadow:"0 8px 32px rgba(0,0,0,0.2)", zIndex:100, maxHeight:"320px", overflowY:"auto", border:"1px solid #e8e8e6" }}>

              {/* Si hay rubro seleccionado → mostrar subrubros */}
              {rubroSel && subrubrosDeRubro.length > 0 ? (
                <>
                  <div style={{ padding:"10px 14px 6px", fontSize:"10px", fontWeight:800, color:"#9a9a9a", textTransform:"uppercase", letterSpacing:"1px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                    <span>Subrubros de {rubroSel.nombre}</span>
                    <button onClick={limpiar} style={{ background:"none", border:"none", cursor:"pointer", fontSize:"11px", color:"#d4a017", fontWeight:800, fontFamily:"'Nunito', sans-serif" }}>← Todos los rubros</button>
                  </div>
                  <div onClick={() => { setSubrubroSel(null); setDropOpen(false); }} style={itemDropStyle(false)}>
                    <span style={{ fontSize:"16px" }}>📋</span>
                    <div>
                      <div style={{ fontSize:"13px", fontWeight:800, color:"#1a2a3a" }}>Todos en {rubroSel.nombre}</div>
                    </div>
                  </div>
                  {subrubrosDeRubro.map(s => (
                    <div key={s.id} onClick={() => seleccionarSubrubro(s)} style={itemDropStyle(subrubroSel?.id === s.id)}>
                      <span style={{ fontSize:"14px" }}>↳</span>
                      <div>
                        <div style={{ fontSize:"13px", fontWeight:700, color:"#1a2a3a" }}>{s.nombre}</div>
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                <>
                  {/* Sin rubro seleccionado → rubros y subrubros filtrados */}
                  {query === "" && (
                    <div style={{ padding:"10px 14px 6px", fontSize:"10px", fontWeight:800, color:"#9a9a9a", textTransform:"uppercase", letterSpacing:"1px" }}>Todos los rubros</div>
                  )}
                  {query !== "" && rubrosFiltered.length === 0 && subrubrosFiltered.length === 0 && (
                    <div style={{ padding:"20px", textAlign:"center", fontSize:"13px", color:"#9a9a9a", fontWeight:600 }}>Sin resultados para "{query}"</div>
                  )}

                  {/* RUBROS */}
                  {rubrosFiltered.map(r => (
                    <div key={r.id} onClick={() => seleccionarRubro(r)} style={itemDropStyle(rubroSel?.id === r.id)}>
                      <span style={{ fontSize:"18px" }}>📂</span>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:"13px", fontWeight:800, color:"#1a2a3a" }}>{r.nombre}</div>
                        <div style={{ fontSize:"10px", color:"#9a9a9a", fontWeight:600 }}>
                          {subrubros.filter(s => s.rubro_id === r.id).length} subrubros
                        </div>
                      </div>
                      <span style={{ fontSize:"12px", color:"#d4a017", fontWeight:800 }}>→</span>
                    </div>
                  ))}

                  {/* SUBRUBROS (solo cuando se está escribiendo) */}
                  {query !== "" && subrubrosFiltered.length > 0 && (
                    <>
                      <div style={{ padding:"8px 14px 4px", fontSize:"10px", fontWeight:800, color:"#9a9a9a", textTransform:"uppercase", letterSpacing:"1px", borderTop:"1px solid #f0f0f0" }}>Subrubros</div>
                      {subrubrosFiltered.slice(0, 5).map(s => {
                        const rubro = rubros.find(r => r.id === s.rubro_id);
                        return (
                          <div key={s.id} onClick={() => seleccionarSubrubro(s)} style={itemDropStyle(false)}>
                            <span style={{ fontSize:"14px" }}>↳</span>
                            <div>
                              <div style={{ fontSize:"13px", fontWeight:700, color:"#1a2a3a" }}>{s.nombre}</div>
                              {rubro && <div style={{ fontSize:"10px", color:"#9a9a9a", fontWeight:600 }}>en {rubro.nombre}</div>}
                            </div>
                          </div>
                        );
                      })}
                    </>
                  )}
                </>
              )}

              {/* BUSCAR TEXTO LIBRE */}
              {query !== "" && (
                <div onClick={irABuscar} style={{ ...itemDropStyle(false), borderTop:"1px solid #f0f0f0", background:"#f9f7f0" }}>
                  <span style={{ fontSize:"18px" }}>🔍</span>
                  <div>
                    <div style={{ fontSize:"13px", fontWeight:800, color:"#d4a017" }}>Buscar "{query}"</div>
                    <div style={{ fontSize:"10px", color:"#9a9a9a", fontWeight:600 }}>Ver todos los resultados</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* CHIPS DE RUBROS — scroll horizontal */}
        {!dropOpen && (
          <div style={{ display:"flex", gap:"8px", marginTop:"14px", overflowX:"auto", scrollbarWidth:"none", paddingBottom:"2px" }}>
            <button onClick={limpiar} style={chipStyle(!rubroSel)}>Todos</button>
            {rubros.slice(0, 8).map(r => (
              <button key={r.id} onClick={() => seleccionarRubro(r)} style={chipStyle(rubroSel?.id === r.id)}>
                {r.nombre}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ACCIONES RÁPIDAS */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px", padding:"14px 16px" }}>
        <a href="/buscar" style={accionStyle}>
          <div style={{ fontSize:"28px", marginBottom:"6px" }}>📋</div>
          <div style={accionTituloStyle}>Ver en Lista</div>
          <div style={accionSubStyle}>Todos los anuncios</div>
        </a>
        <a href="/mapa" style={accionStyle}>
          <div style={{ fontSize:"28px", marginBottom:"6px" }}>🗺️</div>
          <div style={accionTituloStyle}>Ver en Mapa</div>
          <div style={accionSubStyle}>Anuncios cerca tuyo</div>
        </a>
      </div>

      {/* FILTRO ACTIVO */}
      {(rubroSel || subrubroSel) && (
        <div style={{ padding:"0 16px 12px", display:"flex", alignItems:"center", gap:"8px" }}>
          <div style={{ background:"#1a2a3a", borderRadius:"20px", padding:"6px 14px", fontSize:"12px", fontWeight:800, color:"#d4a017", display:"flex", alignItems:"center", gap:"8px" }}>
            {rubroSel && <span>📂 {rubroSel.nombre}</span>}
            {subrubroSel && <span>↳ {subrubroSel.nombre}</span>}
          </div>
          <button onClick={limpiar} style={{ background:"rgba(0,0,0,0.08)", border:"none", borderRadius:"20px", padding:"6px 12px", fontSize:"11px", fontWeight:800, color:"#666", cursor:"pointer", fontFamily:"'Nunito', sans-serif" }}>
            ✕ Limpiar
          </button>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign:"center", padding:"40px", color:"#9a9a9a", fontWeight:700 }}>Cargando anuncios...</div>
      ) : anunciosFiltrados.length === 0 ? (
        <div style={{ textAlign:"center", padding:"40px 20px" }}>
          <div style={{ fontSize:"40px", marginBottom:"12px" }}>🔍</div>
          <div style={{ fontSize:"16px", fontWeight:800, color:"#1a2a3a", marginBottom:"6px" }}>Sin anuncios</div>
          <div style={{ fontSize:"13px", color:"#9a9a9a", fontWeight:600, marginBottom:"20px" }}>No encontramos resultados para tu búsqueda</div>
          <button onClick={limpiar} style={{ background:"linear-gradient(135deg,#d4a017,#f0c040)", border:"none", borderRadius:"12px", padding:"12px 24px", fontSize:"13px", fontWeight:800, color:"#1a2a3a", cursor:"pointer", fontFamily:"'Nunito', sans-serif" }}>
            Ver todos los anuncios
          </button>
        </div>
      ) : (
        <>
          {destacados.length > 0 && (
            <Seccion titulo="⚡ Destacados" rubroId={rubroSel?.id}>
              {destacados.map(a => <Tarjeta key={a.id} anuncio={a} formatPrecio={formatPrecio} />)}
            </Seccion>
          )}
          <Seccion titulo={rubroSel ? `📂 ${rubroSel.nombre}${subrubroSel ? ` → ${subrubroSel.nombre}` : ""}` : "🕐 Recién publicados"} rubroId={rubroSel?.id}>
            {recientes.map(a => <Tarjeta key={a.id} anuncio={a} formatPrecio={formatPrecio} />)}
          </Seccion>
        </>
      )}

      <BottomNav />
    </main>
  );
}

const itemDropStyle = (activo: boolean): React.CSSProperties => ({
  display:"flex", alignItems:"center", gap:"12px", padding:"12px 14px",
  cursor:"pointer", background: activo ? "rgba(212,160,23,0.08)" : "transparent",
  borderLeft: activo ? "3px solid #d4a017" : "3px solid transparent",
  transition:"background .15s",
});

const chipStyle = (activo: boolean): React.CSSProperties => ({
  background: activo ? "#d4a017" : "rgba(255,255,255,0.15)",
  border: `2px solid ${activo ? "#d4a017" : "rgba(255,255,255,0.25)"}`,
  borderRadius:"20px", padding:"5px 14px", fontSize:"12px", fontWeight:700,
  color: activo ? "#1a2a3a" : "#fff", whiteSpace:"nowrap",
  cursor:"pointer", flexShrink:0, fontFamily:"'Nunito', sans-serif",
  transition:"all .2s",
});

function Seccion({ titulo, children, rubroId }: { titulo: string; children: React.ReactNode; rubroId?: number }) {
  const href = rubroId ? `/buscar?rubro=${rubroId}` : "/buscar";
  return (
    <div style={{ marginBottom:"20px" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"0 16px 10px" }}>
        <span style={{ fontSize:"16px", fontWeight:900 }}>{titulo}</span>
        <a href={href} style={{ fontSize:"12px", fontWeight:700, color:"#d4a017", textDecoration:"none" }}>Ver todos →</a>
      </div>
      <div style={{ display:"flex", gap:"12px", padding:"0 16px 8px", overflowX:"auto", scrollbarWidth:"none" }}>
        {children}
      </div>
    </div>
  );
}

function Tarjeta({ anuncio, formatPrecio }: { anuncio: Anuncio; formatPrecio: (p: number, m: string) => string }) {
  const imagen = anuncio.imagenes?.[0];
  const fuente = FUENTES[anuncio.fuente] || FUENTES.nexonet;
  const badges = [
    anuncio.envio_gratis          && { label:"Envío gratis",     color:"#00a884", texto:"#fff"    },
    anuncio.mas_vendido           && { label:"Más vendido",      color:"#e63946", texto:"#fff"    },
    anuncio.tienda_oficial        && { label:"Tienda oficial",   color:"#1a2a3a", texto:"#d4a017" },
    anuncio.conexion_habilitada   && { label:"🔗 Conexión",      color:"#3a7bd5", texto:"#fff"    },
    anuncio.presupuesto_sin_cargo && { label:"Presup. gratis",   color:"#6a0dad", texto:"#fff"    },
    anuncio.descuento_cantidad    && { label:"Desc. x cantidad", color:"#2d6a4f", texto:"#fff"    },
    anuncio.descuento_porcentaje > 0 && { label:`${anuncio.descuento_porcentaje}% OFF`, color:"#e63946", texto:"#fff" },
  ].filter(Boolean) as { label:string; color:string; texto:string }[];

  return (
    <a href={`/anuncios/${anuncio.id}`} style={{ textDecoration:"none", flexShrink:0, width:"190px" }}>
      <div style={{ background:"#fff", borderRadius:"16px", overflow:"hidden", boxShadow:"0 2px 10px rgba(0,0,0,0.08)", cursor:"pointer" }}>
        <div style={{ background:fuente.color, padding:"4px 10px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <span style={{ fontSize:"10px", fontWeight:900, color:fuente.texto, textTransform:"uppercase", letterSpacing:"0.5px" }}>{fuente.label}</span>
          {anuncio.flash && <span style={{ background:"#1a2a3a", color:"#d4a017", fontSize:"9px", fontWeight:900, padding:"1px 6px", borderRadius:"6px" }}>⚡ Flash</span>}
        </div>
        <div style={{ width:"100%", height:"120px", background:"#e8e8e6", display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden" }}>
          {imagen
            ? <img src={imagen} alt={anuncio.titulo} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
            : <span style={{ fontSize:"40px" }}>📦</span>
          }
        </div>
        {badges.length > 0 && (
          <div style={{ display:"flex", flexWrap:"wrap", gap:"4px", padding:"6px 8px 0" }}>
            {badges.slice(0, 3).map((b, i) => (
              <span key={i} style={{ background:b.color, color:b.texto, fontSize:"9px", fontWeight:800, padding:"2px 6px", borderRadius:"6px" }}>{b.label}</span>
            ))}
          </div>
        )}
        <div style={{ padding:"8px 10px 12px" }}>
          <div style={{ fontSize:"11px", color:"#9a9a9a", fontWeight:700, marginBottom:"2px", textTransform:"uppercase", letterSpacing:"0.5px" }}>{anuncio.subrubro}</div>
          <div style={{ fontSize:"13px", fontWeight:800, color:"#2c2c2e", marginBottom:"3px", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{anuncio.titulo}</div>
          <div style={{ fontSize:"15px", fontWeight:900, color:"#d4a017" }}>{formatPrecio(anuncio.precio, anuncio.moneda)}</div>
          <div style={{ fontSize:"11px", color:"#9a9a9a", fontWeight:600, marginTop:"2px" }}>📍 {anuncio.ciudad}, {anuncio.provincia}</div>
        </div>
      </div>
    </a>
  );
}

const accionStyle: React.CSSProperties = { background:"linear-gradient(135deg, #1a2a3a 0%, #243b55 100%)", borderRadius:"16px", padding:"18px 10px", textAlign:"center", boxShadow:"0 4px 12px rgba(0,0,0,0.15)", cursor:"pointer", textDecoration:"none", color:"#fff", display:"block", border:"1px solid rgba(255,255,255,0.08)" };
const accionTituloStyle: React.CSSProperties = { fontSize:"13px", fontWeight:900, textTransform:"uppercase", letterSpacing:"0.5px", color:"#fff", marginBottom:"2px" };
const accionSubStyle: React.CSSProperties = { fontSize:"11px", fontWeight:600, color:"#8a9aaa" };
