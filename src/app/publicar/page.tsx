"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/lib/supabase";

const TIPOS_NEXO = [
  { id:"anuncio",  emoji:"📣", titulo:"Anuncio",      desc:"Vendé, comprá o permutá lo que quieras",          color:"#d4a017", bg:"linear-gradient(135deg,#1a2a3a,#2d3d50)", border:"#d4a017", tablaRubros:"rubros", tablaSubrubros:"subrubros", fkSub:"rubro_id" },
  { id:"grupo",    emoji:"👥", titulo:"Grupo",         desc:"Creá tu comunidad, espacio o equipo",              color:"#3a7bd5", bg:"linear-gradient(135deg,#1a2535,#1e3a5f)", border:"#3a7bd5", tablaRubros:"grupo_categorias", tablaSubrubros:"grupo_subcategorias", fkSub:"categoria_id" },
  { id:"empresa",  emoji:"🏢", titulo:"Empresa",       desc:"Perfil comercial con 50 anuncios incluidos",      color:"#c0392b", bg:"linear-gradient(135deg,#2c1a1a,#4a2020)", border:"#c0392b", tablaRubros:"empresa_rubros", tablaSubrubros:"empresa_subrubros", fkSub:"rubro_id" },
  { id:"servicio", emoji:"🛠️", titulo:"Servicio",      desc:"Mostrá lo que ofrecés con videos y portfolio",   color:"#27ae60", bg:"linear-gradient(135deg,#1a2e1a,#1e4a2a)", border:"#27ae60", tablaRubros:"servicio_rubros", tablaSubrubros:"servicio_subrubros", fkSub:"rubro_id" },
  { id:"trabajo",  emoji:"💼", titulo:"Busco Trabajo", desc:"Ofrecé tus habilidades y adjuntá tu CV",          color:"#8e44ad", bg:"linear-gradient(135deg,#1e1a2e,#2e1a4a)", border:"#8e44ad", tablaRubros:"trabajo_rubros", tablaSubrubros:"trabajo_subrubros", fkSub:"rubro_id" },
];

export default function PublicarSelector() {
  const router = useRouter();
  const [paso, setPaso] = useState<"tipo"|"rubro"|"subrubro">("tipo");
  const [seleccionado, setSeleccionado] = useState<string|null>(null);
  const [animando, setAnimando] = useState(false);
  const [rubros, setRubros] = useState<any[]>([]);
  const [subrubros, setSubrubros] = useState<any[]>([]);
  const [rubroSel, setRubroSel] = useState<any>(null);
  const [cargando, setCargando] = useState(false);

  useEffect(() => { setAnimando(false); setSeleccionado(null); setPaso("tipo"); }, []);

  const tipoActual = TIPOS_NEXO.find(t => t.id === seleccionado);

  const elegir = (tipoId: string, subtipoId?: string) => {
    setAnimando(true);
    const destino = subtipoId
      ? `/nexo/crear/${tipoId}?subtipo=${subtipoId}`
      : `/nexo/crear/${tipoId}`;
    setTimeout(() => router.push(destino), 220);
  };

  const elegirConCategoria = (tipoId: string, rubroId?: number, subrubroId?: number) => {
    setAnimando(true);
    const params = new URLSearchParams();
    if (rubroId) params.set("rubro_id", String(rubroId));
    if (subrubroId) params.set("subrubro_id", String(subrubroId));
    const qs = params.toString();
    setTimeout(() => router.push(`/nexo/crear/${tipoId}${qs ? "?" + qs : ""}`), 220);
  };

  const seleccionarTipo = async (tipoId: string) => {
    const tipo = TIPOS_NEXO.find(t => t.id === tipoId);
    if (!tipo) return;

    // Cargar rubros
    if (tipo.tablaRubros) {
      setCargando(true);
      setSeleccionado(tipoId);
      const { data } = await supabase.from(tipo.tablaRubros).select("id,nombre,emoji").order("orden", { ascending: true });
      setRubros(data || []);
      setCargando(false);
      if (!data || data.length === 0) {
        // Sin rubros → ir directo
        elegir(tipoId);
      } else {
        setPaso("rubro");
      }
    } else {
      elegir(tipoId);
    }
  };

  const seleccionarRubro = async (rubro: any) => {
    setRubroSel(rubro);
    const tipo = TIPOS_NEXO.find(t => t.id === seleccionado);
    if (!tipo?.tablaSubrubros) { elegirConCategoria(seleccionado!, rubro.id); return; }

    setCargando(true);
    const fk = (tipo as any).fkSub || "rubro_id";
    const { data } = await supabase.from(tipo.tablaSubrubros).select("id,nombre").eq(fk, rubro.id).order("orden", { ascending: true });
    setSubrubros(data || []);
    setCargando(false);
    if (!data || data.length === 0) {
      elegirConCategoria(seleccionado!, rubro.id);
    } else {
      setPaso("subrubro");
    }
  };

  const volver = () => {
    if (paso === "subrubro") { setPaso("rubro"); setSubrubros([]); setRubroSel(null); }
    else if (paso === "rubro") { setPaso("tipo"); setSeleccionado(null); setRubros([]); }
    else { setSeleccionado(null); }
  };

  const color = tipoActual?.color || "#d4a017";

  return (
    <main style={{ paddingTop:"95px", paddingBottom:"160px", background:"#0f1923", minHeight:"100vh", fontFamily:"'Nunito',sans-serif" }}>
      <Header />

      <div style={{ padding:"28px 16px 24px", textAlign:"center" }}>
        <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"32px", color:"#fff", letterSpacing:"2px", lineHeight:1 }}>
          {paso === "tipo" ? "✨ CREÁ TU NEXO" : paso === "rubro" ? `${tipoActual?.emoji} ${tipoActual?.titulo?.toUpperCase()}` : `📁 ${rubroSel?.nombre?.toUpperCase()}`}
        </div>
        <div style={{ fontSize:"13px", color:"rgba(255,255,255,0.45)", fontWeight:600, marginTop:"6px" }}>
          {paso === "tipo" ? "¿Qué querés crear hoy?" : paso === "rubro" ? "Elegí una categoría" : "Elegí una subcategoría"}
        </div>
      </div>

      {/* PASO 1: TIPO */}
      {paso === "tipo" && !seleccionado && (
        <div style={{ padding:"0 16px", display:"flex", flexDirection:"column", gap:"12px", opacity:animando?0:1, transition:"opacity .2s" }}>
          {TIPOS_NEXO.map(t => (
            <button key={t.id} onClick={() => seleccionarTipo(t.id)}
              style={{ background:t.bg, border:`2px solid ${t.border}30`, borderRadius:"18px", padding:"20px", display:"flex", alignItems:"center", gap:"16px", cursor:"pointer", textAlign:"left", fontFamily:"'Nunito',sans-serif", transition:"transform .15s", boxShadow:"0 4px 20px rgba(0,0,0,0.3)" }}
              onMouseDown={e=>(e.currentTarget.style.transform="scale(0.98)")} onMouseUp={e=>(e.currentTarget.style.transform="scale(1)")}>
              <div style={{ width:"58px", height:"58px", borderRadius:"16px", background:`${t.color}22`, border:`2px solid ${t.color}40`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"28px", flexShrink:0 }}>{t.emoji}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"22px", color:t.color, letterSpacing:"1px", lineHeight:1, marginBottom:"4px" }}>{t.titulo}</div>
                <div style={{ fontSize:"12px", color:"rgba(255,255,255,0.5)", fontWeight:600, lineHeight:1.4 }}>{t.desc}</div>
              </div>
              <div style={{ fontSize:"22px", color:`${t.color}80` }}>→</div>
            </button>
          ))}
        </div>
      )}

      {/* PASO 2: RUBROS */}
      {paso === "rubro" && (
        <div style={{ padding:"0 16px", opacity:animando?0:1, transition:"opacity .2s" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"16px" }}>
            <button onClick={volver} style={{ background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.15)", borderRadius:"10px", padding:"8px 14px", color:"rgba(255,255,255,0.6)", fontSize:"13px", fontWeight:700, cursor:"pointer", fontFamily:"'Nunito',sans-serif" }}>← Volver</button>
            <button onClick={() => elegirConCategoria(seleccionado!)} style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:"10px", padding:"8px 14px", color:"rgba(255,255,255,0.4)", fontSize:"12px", fontWeight:700, cursor:"pointer", fontFamily:"'Nunito',sans-serif" }}>Saltar categoría →</button>
          </div>
          {cargando ? (
            <div style={{ textAlign:"center", padding:"40px", color:"#9a9a9a", fontWeight:700 }}>Cargando...</div>
          ) : (
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px" }}>
              {rubros.map(r => (
                <button key={r.id} onClick={() => seleccionarRubro(r)}
                  style={{ background:`linear-gradient(135deg,${color}15,${color}08)`, border:`2px solid ${color}30`, borderRadius:"16px", padding:"16px 14px", cursor:"pointer", textAlign:"left", fontFamily:"'Nunito',sans-serif", display:"flex", flexDirection:"column", gap:"8px", boxShadow:"0 4px 16px rgba(0,0,0,0.25)", transition:"transform .15s" }}
                  onMouseDown={e=>(e.currentTarget.style.transform="scale(0.96)")} onMouseUp={e=>(e.currentTarget.style.transform="scale(1)")}>
                  <div style={{ fontSize:"28px" }}>{r.emoji || "📁"}</div>
                  <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"16px", color, letterSpacing:"0.5px", lineHeight:1.1 }}>{r.nombre}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* PASO 3: SUBRUBROS */}
      {paso === "subrubro" && (
        <div style={{ padding:"0 16px", opacity:animando?0:1, transition:"opacity .2s" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"16px" }}>
            <button onClick={volver} style={{ background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.15)", borderRadius:"10px", padding:"8px 14px", color:"rgba(255,255,255,0.6)", fontSize:"13px", fontWeight:700, cursor:"pointer", fontFamily:"'Nunito',sans-serif" }}>← Volver</button>
            <button onClick={() => elegirConCategoria(seleccionado!, rubroSel?.id)} style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:"10px", padding:"8px 14px", color:"rgba(255,255,255,0.4)", fontSize:"12px", fontWeight:700, cursor:"pointer", fontFamily:"'Nunito',sans-serif" }}>Saltar subcategoría →</button>
          </div>
          {cargando ? (
            <div style={{ textAlign:"center", padding:"40px", color:"#9a9a9a", fontWeight:700 }}>Cargando...</div>
          ) : (
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px" }}>
              {subrubros.map(s => (
                <button key={s.id} onClick={() => elegirConCategoria(seleccionado!, rubroSel?.id, s.id)}
                  style={{ background:`linear-gradient(135deg,${color}10,${color}05)`, border:`2px solid ${color}25`, borderRadius:"16px", padding:"16px 14px", cursor:"pointer", textAlign:"left", fontFamily:"'Nunito',sans-serif", boxShadow:"0 4px 16px rgba(0,0,0,0.2)", transition:"transform .15s" }}
                  onMouseDown={e=>(e.currentTarget.style.transform="scale(0.96)")} onMouseUp={e=>(e.currentTarget.style.transform="scale(1)")}>
                  <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"15px", color, letterSpacing:"0.5px", lineHeight:1.2 }}>{s.nombre}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <BottomNav />
    </main>
  );
}
