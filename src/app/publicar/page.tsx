"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";

const TIPOS_NEXO = [
  { id:"anuncio",  emoji:"📣", titulo:"Anuncio",      desc:"Vendé, comprá o permutá lo que quieras",        color:"#d4a017", bg:"linear-gradient(135deg,#1a2a3a,#2d3d50)", border:"#d4a017", subtipos:null },
  { id:"grupo",    emoji:"👥", titulo:"Grupo",         desc:"Creá tu comunidad, espacio o equipo",            color:"#3a7bd5", bg:"linear-gradient(135deg,#1a2535,#1e3a5f)", border:"#3a7bd5", subtipos:[
    { id:"emprendimiento", emoji:"🚀", titulo:"Emprendimiento",   desc:"Tu marca o negocio en comunidad" },
    { id:"curso",          emoji:"🎓", titulo:"Curso",            desc:"Enseñá y compartí conocimiento" },
    { id:"consorcio",      emoji:"🏢", titulo:"Consorcio",        desc:"Administrá tu edificio o complejo" },
    { id:"deportivo",      emoji:"⚽", titulo:"Club Deportivo",   desc:"Organizá tu equipo o club" },
    { id:"estudio",        emoji:"📚", titulo:"Grupo de Estudio", desc:"Estudiá y aprendé en grupo" },
    { id:"venta",          emoji:"🛒", titulo:"Grupo de Venta",   desc:"Catálogo y ventas colectivas" },
    { id:"artistas",       emoji:"🎨", titulo:"Artistas",         desc:"Mostrá tu arte y conectá creadores" },
    { id:"vecinos",        emoji:"🏘️", titulo:"Vecinos",          desc:"Conectá con tu barrio o zona" },
    { id:"generico",       emoji:"✨", titulo:"Grupo Libre",      desc:"Sliders personalizados, vos elegís" },
  ]},
  { id:"empresa",  emoji:"🏢", titulo:"Empresa",       desc:"Perfil comercial con 50 anuncios incluidos",    color:"#c0392b", bg:"linear-gradient(135deg,#2c1a1a,#4a2020)", border:"#c0392b", subtipos:null },
  { id:"servicio", emoji:"🛠️", titulo:"Servicio",      desc:"Mostrá lo que ofrecés con videos y portfolio",  color:"#27ae60", bg:"linear-gradient(135deg,#1a2e1a,#1e4a2a)", border:"#27ae60", subtipos:null },
  { id:"trabajo",  emoji:"💼", titulo:"Busco Trabajo", desc:"Ofrecé tus habilidades y adjuntá tu CV",        color:"#8e44ad", bg:"linear-gradient(135deg,#1e1a2e,#2e1a4a)", border:"#8e44ad", subtipos:null },
];

export default function PublicarSelector() {
  const router = useRouter();
  const [seleccionado, setSeleccionado] = useState<string | null>(null);
  const tipoActual = TIPOS_NEXO.find(t => t.id === seleccionado);

  const elegir = (tipoId: string, subtipoId?: string) => {
    const destino = subtipoId
      ? `/nexo/crear/${tipoId}?subtipo=${subtipoId}`
      : `/nexo/crear/${tipoId}`;
    window.location.href = destino;
  };

  return (
    <main style={{ paddingTop:"95px", paddingBottom:"100px", background:"#0f1923", minHeight:"100vh", fontFamily:"'Nunito',sans-serif" }}>
      <Header />

      <div style={{ padding:"28px 16px 24px", textAlign:"center" }}>
        <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"32px", color:"#fff", letterSpacing:"2px", lineHeight:1 }}>
          ✨ CREÁ TU NEXO
        </div>
        <div style={{ fontSize:"13px", color:"rgba(255,255,255,0.45)", fontWeight:600, marginTop:"6px" }}>
          ¿Qué querés crear hoy?
        </div>
      </div>

      {/* SELECTOR PRINCIPAL */}
      {!seleccionado && (
        <div style={{ padding:"0 16px", display:"flex", flexDirection:"column", gap:"12px" }}>
          {TIPOS_NEXO.map(t => (
            <button key={t.id}
              onClick={() => t.subtipos ? setSeleccionado(t.id) : elegir(t.id)}
              style={{ background:t.bg, border:`2px solid ${t.border}30`, borderRadius:"18px", padding:"20px", display:"flex", alignItems:"center", gap:"16px", cursor:"pointer", textAlign:"left", fontFamily:"'Nunito',sans-serif", boxShadow:"0 4px 20px rgba(0,0,0,0.3)" }}>
              <div style={{ width:"58px", height:"58px", borderRadius:"16px", background:`${t.color}22`, border:`2px solid ${t.color}40`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"28px", flexShrink:0 }}>
                {t.emoji}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"22px", color:t.color, letterSpacing:"1px", lineHeight:1, marginBottom:"4px" }}>{t.titulo}</div>
                <div style={{ fontSize:"12px", color:"rgba(255,255,255,0.5)", fontWeight:600, lineHeight:1.4 }}>{t.desc}</div>
              </div>
              <div style={{ fontSize:"22px", color:`${t.color}80` }}>{t.subtipos ? "›" : "→"}</div>
            </button>
          ))}
        </div>
      )}

      {/* SUBTIPOS DE GRUPO */}
      {seleccionado && tipoActual?.subtipos && (
        <div style={{ padding:"0 16px" }}>
          <button onClick={() => setSeleccionado(null)}
            style={{ background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.15)", borderRadius:"10px", padding:"8px 14px", color:"rgba(255,255,255,0.6)", fontSize:"13px", fontWeight:700, cursor:"pointer", fontFamily:"'Nunito',sans-serif", marginBottom:"16px", display:"flex", alignItems:"center", gap:"6px" }}>
            ← Volver
          </button>
          <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"20px", color:"#3a7bd5", letterSpacing:"1px", marginBottom:"14px" }}>
            👥 ¿Qué tipo de grupo?
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px" }}>
            {tipoActual.subtipos.map(s => (
              <button key={s.id}
                onClick={() => elegir("grupo", s.id)}
                style={{ background:"linear-gradient(135deg,#1a2535,#1e3050)", border:"2px solid rgba(58,123,213,0.25)", borderRadius:"16px", padding:"16px 14px", cursor:"pointer", textAlign:"left", fontFamily:"'Nunito',sans-serif", display:"flex", flexDirection:"column", gap:"8px", boxShadow:"0 4px 16px rgba(0,0,0,0.25)" }}>
                <div style={{ fontSize:"32px" }}>{s.emoji}</div>
                <div>
                  <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"17px", color:"#7fb3f5", letterSpacing:"0.5px", lineHeight:1.1 }}>{s.titulo}</div>
                  <div style={{ fontSize:"10px", color:"rgba(255,255,255,0.4)", fontWeight:600, marginTop:"3px", lineHeight:1.4 }}>{s.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <BottomNav />
    </main>
  );
}
