"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { dropdownItemStyle, type Rubro, type Subrubro } from "@/app/_lib/home-constants";

type Props = {
  rubros: Rubro[];
  subrubros: Subrubro[];
  soloPermuto: boolean;
  setSoloPermuto: React.Dispatch<React.SetStateAction<boolean>>;
};

export default function HeroBuscador({ rubros, subrubros, soloPermuto, setSoloPermuto }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [rubroSel, setRubroSel] = useState<Rubro | null>(null);
  const [subrubroSel, setSubrubroSel] = useState<Subrubro | null>(null);
  const [dropOpen, setDropOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

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
  const rubrosFiltered = rubros.filter(r => r.nombre.toLowerCase().includes(queryLow));
  const subrubrosFiltered = subrubros.filter(s => s.nombre.toLowerCase().includes(queryLow));
  const subsDe = rubroSel ? subrubros.filter(s => s.rubro_id === rubroSel.id) : [];

  const limpiar = () => { setQuery(""); setRubroSel(null); setSubrubroSel(null); setDropOpen(false); };
  const selR = (r: Rubro) => { setRubroSel(r); setSubrubroSel(null); setQuery(r.nombre); setDropOpen(false); };
  const selS = (s: Subrubro) => {
    setRubroSel(rubros.find(r => r.id === s.rubro_id) || null);
    setSubrubroSel(s); setQuery(s.nombre); setDropOpen(false);
  };

  const buildParams = () => {
    const p = new URLSearchParams();
    if (rubroSel) p.set("rubro", String(rubroSel.id));
    if (subrubroSel) p.set("subrubro", String(subrubroSel.id));
    if (query && !rubroSel) p.set("q", query);
    return p;
  };
  const irBuscar = () => router.push(`/buscar?${buildParams()}`);
  const irMapa = () => router.push(`/mapa?${buildParams()}`);

  return (
    <div style={{ background: "linear-gradient(135deg,#1a2a3a 0%,#243b55 100%)", padding: "18px 16px 20px" }}>
      <div style={{ fontSize: "13px", fontWeight: 700, color: "#d4a017", letterSpacing: "2px", textTransform: "uppercase", marginBottom: "4px", textAlign: "center" }}>
        Conectando Oportunidades
      </div>
      <div style={{ fontSize: "12px", color: "#7a8fa0", marginBottom: "14px", fontWeight: 600, textAlign: "center" }}>
        Conectando a la Comunidad
      </div>

      {/* BUSCADOR */}
      <div style={{ position: "relative", maxWidth: "500px", margin: "0 auto" }}>
        <div style={{ display: "flex", background: "#fff", borderRadius: "14px", overflow: "visible", boxShadow: "0 4px 20px rgba(0,0,0,0.25)", position: "relative", zIndex: 10 }}>
          <div style={{ flex: 1, position: "relative" }}>
            <input ref={inputRef} type="text" value={query}
              onChange={e => { setQuery(e.target.value); setRubroSel(null); setSubrubroSel(null); setDropOpen(true); }}
              onFocus={() => setDropOpen(true)}
              placeholder="Rubro, subrubro o producto..."
              style={{ width: "100%", border: "none", padding: "14px 16px", fontFamily: "'Nunito',sans-serif", fontSize: "14px", color: "#2c2c2e", outline: "none", background: "transparent", boxSizing: "border-box", borderRadius: "14px 0 0 14px" }}
            />
            {(rubroSel || subrubroSel) && (
              <div onClick={limpiar} style={{ position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)", background: rubroSel ? "#d4a017" : "#2980b9", borderRadius: "20px", padding: "3px 10px", fontSize: "11px", fontWeight: 800, color: rubroSel && !subrubroSel ? "#1a2a3a" : "#fff", cursor: "pointer" }}>
                {subrubroSel ? subrubroSel.nombre : rubroSel!.nombre} ✕
              </div>
            )}
          </div>
          {query && <button onClick={limpiar} style={{ background: "none", border: "none", padding: "0 8px", cursor: "pointer", fontSize: "16px", color: "#9a9a9a" }}>✕</button>}
          <button onClick={irBuscar} style={{ background: "#d4a017", border: "none", padding: "0 18px", cursor: "pointer", fontSize: "18px", borderRadius: "0 14px 14px 0", flexShrink: 0 }}>🔍</button>
        </div>

        {dropOpen && (
          <div ref={dropRef} style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, background: "#fff", borderRadius: "14px", boxShadow: "0 8px 32px rgba(0,0,0,0.2)", zIndex: 100, maxHeight: "320px", overflowY: "auto", border: "1px solid #e8e8e6" }}>
            {rubroSel && subsDe.length > 0 ? (<>
              <div style={{ padding: "10px 14px 6px", fontSize: "10px", fontWeight: 800, color: "#9a9a9a", textTransform: "uppercase", letterSpacing: "1px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span>Subrubros de {rubroSel.nombre}</span>
                <button onClick={limpiar} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "11px", color: "#d4a017", fontWeight: 800, fontFamily: "'Nunito',sans-serif" }}>← Todos</button>
              </div>
              <div onClick={() => { setSubrubroSel(null); setDropOpen(false); }} style={dropdownItemStyle(false)}><span>📋</span><div style={{ fontSize: "13px", fontWeight: 800, color: "#1a2a3a" }}>Todos en {rubroSel.nombre}</div></div>
              {subsDe.map(s => <div key={s.id} onClick={() => selS(s)} style={dropdownItemStyle(subrubroSel?.id === s.id)}><span>↳</span><div style={{ fontSize: "13px", fontWeight: 700, color: "#1a2a3a" }}>{s.nombre}</div></div>)}
            </>) : (<>
              {query === "" && <div style={{ padding: "10px 14px 6px", fontSize: "10px", fontWeight: 800, color: "#9a9a9a", textTransform: "uppercase", letterSpacing: "1px" }}>Todos los rubros</div>}
              {query !== "" && rubrosFiltered.length === 0 && subrubrosFiltered.length === 0 && <div style={{ padding: "20px", textAlign: "center", fontSize: "13px", color: "#9a9a9a", fontWeight: 600 }}>Sin resultados para "{query}"</div>}
              {rubrosFiltered.map(r => <div key={r.id} onClick={() => selR(r)} style={dropdownItemStyle(rubroSel?.id === r.id)}><span>📂</span><div style={{ flex: 1 }}><div style={{ fontSize: "13px", fontWeight: 800, color: "#1a2a3a" }}>{r.nombre}</div><div style={{ fontSize: "10px", color: "#9a9a9a", fontWeight: 600 }}>{subrubros.filter(s => s.rubro_id === r.id).length} subrubros</div></div><span style={{ fontSize: "12px", color: "#d4a017", fontWeight: 800 }}>→</span></div>)}
              {query !== "" && subrubrosFiltered.length > 0 && <>
                <div style={{ padding: "8px 14px 4px", fontSize: "10px", fontWeight: 800, color: "#9a9a9a", textTransform: "uppercase", letterSpacing: "1px", borderTop: "1px solid #f0f0f0" }}>Subrubros</div>
                {subrubrosFiltered.slice(0, 5).map(s => { const r = rubros.find(x => x.id === s.rubro_id); return <div key={s.id} onClick={() => selS(s)} style={dropdownItemStyle(false)}><span>↳</span><div><div style={{ fontSize: "13px", fontWeight: 700, color: "#1a2a3a" }}>{s.nombre}</div>{r && <div style={{ fontSize: "10px", color: "#9a9a9a", fontWeight: 600 }}>en {r.nombre}</div>}</div></div>; })}
              </>}
              {query !== "" && <div onClick={irBuscar} style={{ ...dropdownItemStyle(false), borderTop: "1px solid #f0f0f0", background: "#f9f7f0" }}><span>🔍</span><div><div style={{ fontSize: "13px", fontWeight: 800, color: "#d4a017" }}>Buscar "{query}"</div><div style={{ fontSize: "10px", color: "#9a9a9a", fontWeight: 600 }}>Ver todos los resultados</div></div></div>}
            </>)}
          </div>
        )}
      </div>

      {/* FILTROS */}
      <div style={{ display: "flex", gap: "8px", justifyContent: "center", marginTop: "12px", flexWrap: "wrap" }}>
        <button onClick={() => setSoloPermuto(v => !v)}
          style={{ background: soloPermuto ? "#d4a017" : "rgba(255,255,255,0.12)", border: `2px solid ${soloPermuto ? "#d4a017" : "rgba(255,255,255,0.3)"}`, borderRadius: "20px", padding: "7px 16px", fontSize: "12px", fontWeight: 800, color: soloPermuto ? "#1a2a3a" : "#fff", cursor: "pointer", fontFamily: "'Nunito',sans-serif" }}>
          🔄 Permuta {soloPermuto && "✓"}
        </button>
        <button onClick={() => router.push("/busqueda-ia")}
          style={{ background: "linear-gradient(135deg,rgba(22,160,133,0.3),rgba(22,160,133,0.15))", border: "2px solid rgba(22,160,133,0.7)", borderRadius: "20px", padding: "7px 16px", fontSize: "12px", fontWeight: 800, color: "#1abc9c", cursor: "pointer", fontFamily: "'Nunito',sans-serif" }}>
          🤖 Búsqueda IA
        </button>
      </div>

      <div style={{ display: "flex", gap: "8px", justifyContent: "center", marginTop: "10px" }}>
        <button onClick={irBuscar} style={{ background: "linear-gradient(135deg,#f0c040,#d4a017)", border: "none", borderRadius: "20px", padding: "8px 20px", fontSize: "13px", fontWeight: 900, color: "#1a2a3a", cursor: "pointer", fontFamily: "'Nunito',sans-serif", boxShadow: "0 3px 0 #a07810" }}>📋 Ver en lista</button>
        <button onClick={irMapa} style={{ background: "rgba(255,255,255,0.12)", border: "2px solid rgba(255,255,255,0.25)", borderRadius: "20px", padding: "8px 20px", fontSize: "13px", fontWeight: 800, color: "#fff", cursor: "pointer", fontFamily: "'Nunito',sans-serif" }}>🗺️ Ver en mapa</button>
      </div>
    </div>
  );
}
