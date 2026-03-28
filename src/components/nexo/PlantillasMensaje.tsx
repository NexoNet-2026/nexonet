"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

interface Plantilla {
  id: string;
  titulo: string;
  cuerpo: string;
  incluir_link: boolean;
  activa: boolean;
  created_at: string;
}

interface Props {
  nexoId: string;
  usuarioId: string;
  color: string;
  onSelect?: (p: Plantilla) => void;
  modoSelector?: boolean;
}

export default function PlantillasMensaje({ nexoId, usuarioId, color, onSelect, modoSelector = false }: Props) {
  const [plantillas, setPlantillas] = useState<Plantilla[]>([]);
  const [cargando, setCargando] = useState(true);
  const [creando, setCreando] = useState(false);
  const [editando, setEditando] = useState<Plantilla | null>(null);
  const [titulo, setTitulo] = useState("");
  const [cuerpo, setCuerpo] = useState("");
  const [incluirLink, setIncluirLink] = useState(false);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => { cargarPlantillas(); }, [nexoId]);

  const cargarPlantillas = async () => {
    setCargando(true);
    const { data } = await supabase.from("nexo_plantillas_mensaje")
      .select("*").eq("nexo_id", nexoId).order("created_at", { ascending: false });
    setPlantillas(data || []);
    setCargando(false);
  };

  const abrirCrear = () => {
    setTitulo(""); setCuerpo(""); setIncluirLink(false);
    setEditando(null); setCreando(true);
  };

  const abrirEditar = (p: Plantilla) => {
    setTitulo(p.titulo); setCuerpo(p.cuerpo); setIncluirLink(p.incluir_link);
    setEditando(p); setCreando(true);
  };

  const guardar = async () => {
    if (!titulo.trim() || !cuerpo.trim()) return;
    setGuardando(true);
    if (editando) {
      const { data } = await supabase.from("nexo_plantillas_mensaje")
        .update({ titulo: titulo.trim(), cuerpo: cuerpo.trim(), incluir_link: incluirLink })
        .eq("id", editando.id).select().single();
      if (data) setPlantillas(prev => prev.map(p => p.id === editando.id ? data : p));
    } else {
      const { data } = await supabase.from("nexo_plantillas_mensaje")
        .insert({ nexo_id: nexoId, usuario_id: usuarioId, titulo: titulo.trim(), cuerpo: cuerpo.trim(), incluir_link: incluirLink })
        .select().single();
      if (data) setPlantillas(prev => [data, ...prev]);
    }
    setCreando(false); setEditando(null); setGuardando(false);
  };

  const eliminar = async (id: string) => {
    if (!confirm("¿Eliminar esta plantilla?")) return;
    await supabase.from("nexo_plantillas_mensaje").delete().eq("id", id);
    setPlantillas(prev => prev.filter(p => p.id !== id));
  };

  const toggleActiva = async (p: Plantilla) => {
    await supabase.from("nexo_plantillas_mensaje").update({ activa: !p.activa }).eq("id", p.id);
    setPlantillas(prev => prev.map(x => x.id === p.id ? { ...x, activa: !x.activa } : x));
  };

  if (cargando) return <div style={{ padding:"20px", textAlign:"center", color:"#9a9a9a", fontFamily:"'Nunito',sans-serif" }}>Cargando...</div>;

  return (
    <div style={{ fontFamily:"'Nunito',sans-serif" }}>
      {!modoSelector && (
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"14px" }}>
          <div style={{ fontSize:"13px", fontWeight:900, color:"#1a2a3a" }}>✉️ Plantillas ({plantillas.length})</div>
          <button onClick={abrirCrear} style={{ background:`linear-gradient(135deg,${color}cc,${color})`, border:"none", borderRadius:"10px", padding:"8px 14px", fontSize:"12px", fontWeight:900, color:"#fff", cursor:"pointer", fontFamily:"'Nunito',sans-serif" }}>
            + Nueva plantilla
          </button>
        </div>
      )}
      {modoSelector && !creando && (
        <button onClick={abrirCrear} style={{ width:"100%", background:"rgba(58,123,213,0.08)", border:"2px dashed rgba(58,123,213,0.3)", borderRadius:"14px", padding:"14px", fontSize:"13px", fontWeight:800, color:"#3a7bd5", cursor:"pointer", fontFamily:"'Nunito',sans-serif", marginBottom:"10px" }}>
          + Crear nueva plantilla
        </button>
      )}
      {creando && (
        <div style={{ background:"#fff", borderRadius:"16px", padding:"18px", marginBottom:"14px", boxShadow:"0 4px 20px rgba(0,0,0,0.1)", border:`2px solid ${color}40` }}>
          <div style={{ fontSize:"13px", fontWeight:900, color:"#1a2a3a", marginBottom:"14px" }}>{editando?"✏️ Editar plantilla":"✉️ Nueva plantilla"}</div>
          <div style={{ marginBottom:"12px" }}>
            <label style={{ fontSize:"11px", fontWeight:800, color:"#9a9a9a", textTransform:"uppercase" as const, display:"block", marginBottom:"6px" }}>Título</label>
            <input value={titulo} onChange={e=>setTitulo(e.target.value)} placeholder="Ej: Promo de verano" maxLength={80}
              style={{ width:"100%", border:"2px solid #e8e8e6", borderRadius:"12px", padding:"10px 14px", fontSize:"14px", fontFamily:"'Nunito',sans-serif", outline:"none", boxSizing:"border-box" as const }} />
          </div>
          <div style={{ marginBottom:"12px" }}>
            <label style={{ fontSize:"11px", fontWeight:800, color:"#9a9a9a", textTransform:"uppercase" as const, display:"block", marginBottom:"6px" }}>Mensaje ({cuerpo.length}/500)</label>
            <textarea value={cuerpo} onChange={e=>setCuerpo(e.target.value)} placeholder="Escribí el mensaje..." rows={5} maxLength={500}
              style={{ width:"100%", border:"2px solid #e8e8e6", borderRadius:"12px", padding:"10px 14px", fontSize:"14px", fontFamily:"'Nunito',sans-serif", outline:"none", resize:"vertical", boxSizing:"border-box" as const }} />
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom:"16px", background:"#f4f4f2", borderRadius:"12px", padding:"10px 14px" }}>
            <input type="checkbox" id="inclLink" checked={incluirLink} onChange={e=>setIncluirLink(e.target.checked)} style={{ width:"16px", height:"16px", accentColor:color, cursor:"pointer" }} />
            <label htmlFor="inclLink" style={{ fontSize:"13px", fontWeight:700, color:"#1a2a3a", cursor:"pointer" }}>🔗 Permitir incluir link al enviar</label>
          </div>
          <div style={{ display:"flex", gap:"10px" }}>
            <button onClick={()=>{setCreando(false);setEditando(null);}} style={{ flex:1, background:"#f4f4f2", border:"none", borderRadius:"12px", padding:"12px", fontSize:"13px", fontWeight:800, color:"#9a9a9a", cursor:"pointer", fontFamily:"'Nunito',sans-serif" }}>Cancelar</button>
            <button onClick={guardar} disabled={guardando||!titulo.trim()||!cuerpo.trim()}
              style={{ flex:2, background:titulo.trim()&&cuerpo.trim()?`linear-gradient(135deg,${color}cc,${color})`:"#ccc", border:"none", borderRadius:"12px", padding:"12px", fontSize:"13px", fontWeight:900, color:"#fff", cursor:titulo.trim()&&cuerpo.trim()?"pointer":"default", fontFamily:"'Nunito',sans-serif" }}>
              {guardando?"⏳ Guardando...":editando?"✅ Actualizar":"✅ Guardar"}
            </button>
          </div>
        </div>
      )}
      {plantillas.length === 0 && !creando && (
        <div style={{ textAlign:"center", padding:"40px 20px", background:"#fff", borderRadius:"16px" }}>
          <div style={{ fontSize:"40px", marginBottom:"10px" }}>✉️</div>
          <div style={{ fontSize:"14px", fontWeight:900, color:"#1a2a3a", marginBottom:"6px" }}>Sin plantillas</div>
          <div style={{ fontSize:"12px", color:"#9a9a9a", fontWeight:600 }}>Creá mensajes para enviar rápido a tus usuarios</div>
        </div>
      )}
      <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
        {plantillas.map(p => (
          <div key={p.id} style={{ background:"#fff", borderRadius:"14px", padding:"14px 16px", boxShadow:"0 2px 8px rgba(0,0,0,0.06)", border:p.activa?"none":"1.5px solid #e8e8e6", opacity:p.activa?1:0.55, cursor:modoSelector?"pointer":"default" }}
            onClick={()=>modoSelector&&onSelect&&onSelect(p)}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:"10px" }}>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:"14px", fontWeight:900, color:"#1a2a3a", marginBottom:"4px" }}>
                  {p.titulo}
                  {p.incluir_link && <span style={{ marginLeft:"6px", fontSize:"10px", background:"rgba(58,123,213,0.1)", color:"#3a7bd5", borderRadius:"6px", padding:"2px 7px", fontWeight:800 }}>🔗 Link</span>}
                </div>
                <div style={{ fontSize:"12px", color:"#555", fontWeight:600, lineHeight:1.5, maxHeight:"48px", overflow:"hidden" }}>{p.cuerpo}</div>
              </div>
              {!modoSelector && (
                <div style={{ display:"flex", gap:"6px", flexShrink:0 }}>
                  <button onClick={()=>toggleActiva(p)} style={{ background:p.activa?"rgba(39,174,96,0.1)":"rgba(231,76,60,0.1)", border:"none", borderRadius:"8px", padding:"5px 8px", fontSize:"11px", fontWeight:800, color:p.activa?"#27ae60":"#e74c3c", cursor:"pointer", fontFamily:"'Nunito',sans-serif" }}>{p.activa?"✅":"⛔"}</button>
                  <button onClick={()=>abrirEditar(p)} style={{ background:"rgba(212,160,23,0.1)", border:"none", borderRadius:"8px", padding:"5px 8px", fontSize:"11px", fontWeight:800, color:"#d4a017", cursor:"pointer", fontFamily:"'Nunito',sans-serif" }}>✏️</button>
                  <button onClick={()=>eliminar(p.id)} style={{ background:"rgba(231,76,60,0.1)", border:"none", borderRadius:"8px", padding:"5px 8px", fontSize:"11px", fontWeight:800, color:"#e74c3c", cursor:"pointer", fontFamily:"'Nunito',sans-serif" }}>🗑️</button>
                </div>
              )}
            </div>
            {modoSelector && <div style={{ marginTop:"8px", textAlign:"right" }}><span style={{ fontSize:"11px", fontWeight:800, color:color }}>Seleccionar →</span></div>}
          </div>
        ))}
      </div>
    </div>
  );
}
