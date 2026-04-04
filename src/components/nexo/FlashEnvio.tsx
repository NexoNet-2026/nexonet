"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import PlantillasMensaje from "./PlantillasMensaje";

interface Props {
  nexoId: string;
  nexoTitulo: string;
  usuarioId: string;
  color: string;
  perfil: any;
  itemContexto?: { id: string; titulo: string; url?: string; tipo: "adjunto"|"anuncio"|"link" };
  onClose: () => void;
}

type Filtros = { tipo: "todos"|"visitaron"|"miembros"; ciudad?: string; rubro?: string; };

export default function FlashEnvio({ nexoId, nexoTitulo, usuarioId, color, perfil, itemContexto, onClose }: Props) {
  const [filtros, setFiltros] = useState<Filtros>({ tipo: "todos" });
  const [plantillaSeleccionada, setPlantillaSeleccionada] = useState<any>(null);
  const [mensajeExtra, setMensajeExtra] = useState("");
  const [incluirLink, setIncluirLink] = useState(false);
  const [destinatarios, setDestinatarios] = useState<any[]>([]);
  const [buscandoDest, setBuscandoDest] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [ciudadesDisp, setCiudadesDisp] = useState<string[]>([]);
  const [rubrosDisp, setRubrosDisp] = useState<string[]>([]);

  useEffect(() => {
    supabase.from("usuarios").select("ciudad, rubro").not("ciudad","is",null).then(({data})=>{
      setCiudadesDisp([...new Set((data||[]).map((u:any)=>u.ciudad).filter(Boolean))].sort() as string[]);
      setRubrosDisp([...new Set((data||[]).map((u:any)=>u.rubro).filter(Boolean))].sort() as string[]);
    });
  }, []);

  const buscarDestinatarios = async () => {
    setBuscandoDest(true);
    let userIds: string[] = [];
    if (filtros.tipo === "miembros") {
      const { data } = await supabase.from("nexo_miembros").select("usuario_id").eq("nexo_id",nexoId).eq("estado","activo");
      userIds = (data||[]).map((m:any)=>m.usuario_id).filter((id:string)=>id!==usuarioId);
    } else if (filtros.tipo === "visitaron") {
      const { data } = await supabase.from("nexo_visitas").select("visitante_id").eq("nexo_id",nexoId);
      userIds = [...new Set((data||[]).map((v:any)=>v.visitante_id))].filter((id:string)=>id!==usuarioId) as string[];
    } else {
      let query = supabase.from("usuarios").select("id").neq("id",usuarioId);
      if (filtros.ciudad) query = query.eq("ciudad",filtros.ciudad);
      if (filtros.rubro) query = query.eq("rubro",filtros.rubro);
      const { data } = await query.limit(500);
      userIds = (data||[]).map((u:any)=>u.id);
    }
    if (!userIds.length) { setDestinatarios([]); setBuscandoDest(false); return; }
    const { data: usuarios } = await supabase.from("usuarios").select("id,nombre_usuario,ciudad,rubro").in("id",userIds);
    setDestinatarios(usuarios||[]);
    setBuscandoDest(false);
  };

  const costoBIT = destinatarios.length;
  const saldoBIT = perfil?.bits || 0;
  const alcanza = saldoBIT >= costoBIT;

  const enviar = async () => {
    if (!plantillaSeleccionada && !mensajeExtra.trim()) return;
    if (!alcanza) { alert(`Necesitás ${costoBIT} BIT, tenés ${saldoBIT}.`); return; }
    setEnviando(true);
    const cuerpoBase = plantillaSeleccionada ? `${plantillaSeleccionada.cuerpo}${mensajeExtra.trim()?"\n\n"+mensajeExtra.trim():""}` : mensajeExtra.trim();
    const linkExtra = (plantillaSeleccionada?.incluir_link||incluirLink)&&itemContexto?.url ? `\n🔗 ${itemContexto.titulo}: ${itemContexto.url}` : "";
    const mensajeFinal = cuerpoBase + linkExtra;
    await supabase.from("usuarios").update({ bits: saldoBIT - costoBIT, bits_gastados_flash: (perfil?.bits_gastados_flash||0) + costoBIT }).eq("id",usuarioId);
    const notifs = destinatarios.map(u=>({ usuario_id:u.id, tipo:"flash", mensaje:`⚡ ${nexoTitulo}: ${mensajeFinal}`, leida:false, nexo_id:nexoId, emisor_id:usuarioId }));
    for (let i=0;i<notifs.length;i+=100) await supabase.from("notificaciones").insert(notifs.slice(i,i+100));
    // Bump al tope: actualizar updated_at del nexo/anuncio para que aparezca primero
    // Verificar si es un anuncio o un nexo
    const { data: esAnuncio } = await supabase.from("anuncios").select("id").eq("id", nexoId).maybeSingle();
    if (esAnuncio) {
      await supabase.from("anuncios").update({ created_at: new Date().toISOString() }).eq("id", nexoId);
    } else {
      await supabase.from("nexos").update({ created_at: new Date().toISOString() }).eq("id", nexoId);
    }

    await supabase.from("nexo_flash_envios").insert({ nexo_id:nexoId, emisor_id:usuarioId, plantilla_id:plantillaSeleccionada?.id||null, item_id:itemContexto?.id||null, item_url:(incluirLink||plantillaSeleccionada?.incluir_link)?itemContexto?.url||null:null, mensaje:mensajeFinal, filtro:filtros, cantidad_destinatarios:destinatarios.length, bits_consumidos:costoBIT });
    setEnviado(true); setEnviando(false);
  };

  return (
    <div style={{ position:"fixed", inset:0, zIndex:800, background:"rgba(0,0,0,0.7)", display:"flex", alignItems:"flex-end", justifyContent:"center", fontFamily:"'Nunito',sans-serif" }} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{ width:"100%", maxWidth:"600px", background:"#f4f4f2", borderRadius:"24px 24px 0 0", padding:"0 0 24px", maxHeight:"90vh", overflowY:"auto" }}>
        <div style={{ padding:"20px 20px 14px", display:"flex", justifyContent:"space-between", alignItems:"center", position:"sticky", top:0, background:"#f4f4f2", zIndex:1, borderBottom:"1.5px solid #e8e8e6" }}>
          <div>
            <div style={{ fontSize:"18px", fontWeight:900, color:"#1a2a3a" }}>⚡ Envío Flash</div>
            <div style={{ fontSize:"11px", color:"#9a9a9a", fontWeight:600 }}>{itemContexto?`Desde: ${itemContexto.titulo}`:nexoTitulo}</div>
          </div>
          <button onClick={onClose} style={{ background:"rgba(0,0,0,0.08)", border:"none", borderRadius:"50%", width:"36px", height:"36px", fontSize:"16px", cursor:"pointer" }}>✕</button>
        </div>

        {enviado ? (
          <div style={{ padding:"40px 20px", textAlign:"center" }}>
            <div style={{ fontSize:"64px", marginBottom:"16px" }}>⚡</div>
            <div style={{ fontSize:"20px", fontWeight:900, color:"#1a2a3a", marginBottom:"8px" }}>¡Enviado!</div>
            <div style={{ fontSize:"14px", color:"#27ae60", fontWeight:700, marginBottom:"24px" }}>✅ {destinatarios.length} usuarios notificados — {costoBIT} BIT descontados</div>
            <button onClick={onClose} style={{ background:`linear-gradient(135deg,${color}cc,${color})`, border:"none", borderRadius:"14px", padding:"14px 32px", fontSize:"14px", fontWeight:900, color:"#fff", cursor:"pointer", fontFamily:"'Nunito',sans-serif" }}>Cerrar</button>
          </div>
        ) : (
          <div style={{ padding:"16px 20px", display:"flex", flexDirection:"column", gap:"16px" }}>
            <div style={{ background:"#fff", borderRadius:"16px", padding:"16px", boxShadow:"0 2px 8px rgba(0,0,0,0.06)" }}>
              <div style={{ fontSize:"12px", fontWeight:900, color:"#9a9a9a", textTransform:"uppercase" as const, letterSpacing:"1px", marginBottom:"12px" }}>1 — ¿A quién enviar?</div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"8px", marginBottom:"14px" }}>
                {[{v:"todos",l:"🌐 Todos"},{v:"visitaron",l:"👁️ Visitaron"},{v:"miembros",l:"✅ Miembros"}].map(op=>(
                  <button key={op.v} onClick={()=>setFiltros(f=>({...f,tipo:op.v as any}))}
                    style={{ background:filtros.tipo===op.v?`${color}15`:"#f4f4f2", border:`2px solid ${filtros.tipo===op.v?color:"transparent"}`, borderRadius:"12px", padding:"10px 6px", cursor:"pointer", fontFamily:"'Nunito',sans-serif", textAlign:"center" as const }}>
                    <div style={{ fontSize:"13px", fontWeight:900, color:filtros.tipo===op.v?color:"#1a2a3a" }}>{op.l}</div>
                  </button>
                ))}
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
                <select value={filtros.ciudad||""} onChange={e=>setFiltros(f=>({...f,ciudad:e.target.value||undefined}))}
                  style={{ border:"2px solid #e8e8e6", borderRadius:"10px", padding:"9px 12px", fontSize:"13px", fontFamily:"'Nunito',sans-serif", fontWeight:600, background:"#fff", outline:"none" }}>
                  <option value="">📍 Todas las ciudades</option>
                  {ciudadesDisp.map(c=><option key={c} value={c}>{c}</option>)}
                </select>
                <select value={filtros.rubro||""} onChange={e=>setFiltros(f=>({...f,rubro:e.target.value||undefined}))}
                  style={{ border:"2px solid #e8e8e6", borderRadius:"10px", padding:"9px 12px", fontSize:"13px", fontFamily:"'Nunito',sans-serif", fontWeight:600, background:"#fff", outline:"none" }}>
                  <option value="">🏷️ Todos los rubros</option>
                  {rubrosDisp.map(r=><option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <button onClick={buscarDestinatarios} disabled={buscandoDest}
                style={{ marginTop:"12px", width:"100%", background:`linear-gradient(135deg,${color}cc,${color})`, border:"none", borderRadius:"12px", padding:"12px", fontSize:"13px", fontWeight:900, color:"#fff", cursor:"pointer", fontFamily:"'Nunito',sans-serif", opacity:buscandoDest?0.6:1 }}>
                {buscandoDest?"⏳ Buscando...":"🔍 Buscar destinatarios"}
              </button>
              {destinatarios.length>0 && (
                <div style={{ marginTop:"10px", display:"flex", alignItems:"center", justifyContent:"space-between", background:`${color}10`, borderRadius:"10px", padding:"10px 14px" }}>
                  <div style={{ fontSize:"13px", fontWeight:800, color:"#1a2a3a" }}>👥 {destinatarios.length} usuarios</div>
                  <div style={{ fontSize:"12px", fontWeight:800, color:alcanza?"#27ae60":"#e74c3c" }}>💰 {costoBIT} BIT {alcanza?"✅":`⚠️ (tenés ${saldoBIT})`}</div>
                </div>
              )}
            </div>

            {destinatarios.length>0 && (
              <div style={{ background:"#fff", borderRadius:"16px", padding:"16px", boxShadow:"0 2px 8px rgba(0,0,0,0.06)" }}>
                <div style={{ fontSize:"12px", fontWeight:900, color:"#9a9a9a", textTransform:"uppercase" as const, letterSpacing:"1px", marginBottom:"12px" }}>2 — Mensaje</div>
                {plantillaSeleccionada ? (
                  <div style={{ background:`${color}10`, border:`2px solid ${color}40`, borderRadius:"12px", padding:"12px 14px" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"6px" }}>
                      <div style={{ fontSize:"13px", fontWeight:900, color:"#1a2a3a" }}>✅ {plantillaSeleccionada.titulo}</div>
                      <button onClick={()=>setPlantillaSeleccionada(null)} style={{ background:"none", border:"none", fontSize:"12px", fontWeight:800, color:"#e74c3c", cursor:"pointer", fontFamily:"'Nunito',sans-serif" }}>cambiar</button>
                    </div>
                    <div style={{ fontSize:"12px", color:"#555", fontWeight:600, lineHeight:1.5 }}>{plantillaSeleccionada.cuerpo}</div>
                  </div>
                ) : (
                  <PlantillasMensaje nexoId={nexoId} usuarioId={usuarioId} color={color} modoSelector onSelect={p=>setPlantillaSeleccionada(p)} />
                )}
                <div style={{ marginTop:"12px" }}>
                  <label style={{ fontSize:"11px", fontWeight:800, color:"#9a9a9a", textTransform:"uppercase" as const, display:"block", marginBottom:"6px" }}>
                    {plantillaSeleccionada?"Texto adicional (opcional)":"O escribí un mensaje libre"}
                  </label>
                  <textarea value={mensajeExtra} onChange={e=>setMensajeExtra(e.target.value)} placeholder="Mensaje..." rows={3} maxLength={300}
                    style={{ width:"100%", border:"2px solid #e8e8e6", borderRadius:"12px", padding:"10px 14px", fontSize:"13px", fontFamily:"'Nunito',sans-serif", outline:"none", resize:"vertical", boxSizing:"border-box" as const }} />
                </div>
                {itemContexto && (
                  <div style={{ display:"flex", alignItems:"center", gap:"10px", marginTop:"10px", background:"#f4f4f2", borderRadius:"10px", padding:"10px 12px" }}>
                    <input type="checkbox" id="inclLink2" checked={incluirLink} onChange={e=>setIncluirLink(e.target.checked)} style={{ width:"16px", height:"16px", accentColor:color, cursor:"pointer" }} />
                    <label htmlFor="inclLink2" style={{ fontSize:"13px", fontWeight:700, color:"#1a2a3a", cursor:"pointer" }}>🔗 Incluir link: <span style={{ color }}>{itemContexto.titulo}</span></label>
                  </div>
                )}
              </div>
            )}

            {destinatarios.length>0 && (plantillaSeleccionada||mensajeExtra.trim()) && (
              <button onClick={enviar} disabled={enviando||!alcanza}
                style={{ background:alcanza?`linear-gradient(135deg,${color}cc,${color})`:"#ccc", border:"none", borderRadius:"14px", padding:"16px", fontSize:"15px", fontWeight:900, color:"#fff", cursor:alcanza?"pointer":"default", fontFamily:"'Nunito',sans-serif", opacity:enviando?0.6:1 }}>
                {enviando?"⏳ Enviando...":`⚡ Enviar Flash — ${costoBIT} BIT`}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
