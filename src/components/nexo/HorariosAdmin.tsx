"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

const DIAS = ["Lunes","Martes","Miércoles","Jueves","Viernes","Sábado","Domingo"];

function getFeriadosArgentinos(anio: number): string[] {
  const f = [
    `${anio}-01-01`, `${anio}-02-24`, `${anio}-02-25`,
    `${anio}-03-24`, `${anio}-04-02`,
    `${anio}-05-01`, `${anio}-05-25`,
    `${anio}-06-17`, `${anio}-06-20`, `${anio}-07-09`,
    `${anio}-08-17`, `${anio}-10-12`,
    `${anio}-11-20`, `${anio}-12-08`, `${anio}-12-25`,
  ];
  // Semana Santa (variable) — aproximación fija para el año actual
  // Se puede mejorar con algoritmo de Gauss si se necesita exactitud
  return f;
}

interface Horario {
  dia: number;
  hora_desde: string;
  hora_hasta: string;
  cerrado: boolean;
}

interface Props {
  nexoId: string;
  color: string;
}

export default function HorariosAdmin({ nexoId, color }: Props) {
  const anio = new Date().getFullYear();
  const feriados = getFeriadosArgentinos(anio);
  const hoy = new Date().toISOString().slice(0, 10);
  const esFeriado = feriados.includes(hoy);

  const [horarios, setHorarios] = useState<Horario[]>(
    DIAS.map((_, i) => ({ dia: i, hora_desde: "09:00", hora_hasta: "18:00", cerrado: false }))
  );
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);
  const [feriado, setFeriado] = useState<{ cerrado: boolean; hora_desde: string; hora_hasta: string }>({
    cerrado: true, hora_desde: "09:00", hora_hasta: "18:00"
  });

  useEffect(() => {
    const cargar = async () => {
      const { data } = await supabase.from("nexo_horarios").select("*").eq("nexo_id", nexoId).order("dia");
      if (data && data.length > 0) {
        setHorarios(DIAS.map((_, i) => {
          const row = data.find((r: any) => r.dia === i);
          return row
            ? { dia: i, hora_desde: row.hora_desde?.slice(0,5) || "09:00", hora_hasta: row.hora_hasta?.slice(0,5) || "18:00", cerrado: row.cerrado || false }
            : { dia: i, hora_desde: "09:00", hora_hasta: "18:00", cerrado: false };
        }));
      }
      const { data: feriadoData } = await supabase.from("nexo_horarios")
        .select("*").eq("nexo_id", nexoId).eq("dia", 7).maybeSingle();
      if (feriadoData) {
        setFeriado({ cerrado: feriadoData.cerrado || false, hora_desde: feriadoData.hora_desde?.slice(0,5) || "09:00", hora_hasta: feriadoData.hora_hasta?.slice(0,5) || "18:00" });
      }
      setCargando(false);
    };
    cargar();
  }, [nexoId]);

  const actualizar = (dia: number, campo: keyof Horario, valor: any) => {
    setHorarios(prev => prev.map(h => h.dia === dia ? { ...h, [campo]: valor } : h));
    setGuardado(false);
  };

  const guardar = async () => {
    setGuardando(true);
    for (const h of horarios) {
      await supabase.from("nexo_horarios").upsert({
        nexo_id: nexoId,
        dia: h.dia,
        hora_desde: h.cerrado ? null : h.hora_desde,
        hora_hasta: h.cerrado ? null : h.hora_hasta,
        cerrado: h.cerrado,
        updated_at: new Date().toISOString(),
      }, { onConflict: "nexo_id,dia" });
    }
    await supabase.from("nexo_horarios").upsert({
      nexo_id: nexoId,
      dia: 7,
      hora_desde: feriado.cerrado ? null : feriado.hora_desde,
      hora_hasta: feriado.cerrado ? null : feriado.hora_hasta,
      cerrado: feriado.cerrado,
      updated_at: new Date().toISOString(),
    }, { onConflict: "nexo_id,dia" });
    setGuardando(false);
    setGuardado(true);
    setTimeout(() => setGuardado(false), 2500);
  };

  if (cargando) return <div style={{ padding:"20px", textAlign:"center", color:"#9a9a9a", fontFamily:"'Nunito',sans-serif" }}>Cargando horarios...</div>;

  return (
    <div style={{ fontFamily:"'Nunito',sans-serif", display:"flex", flexDirection:"column", gap:"10px" }}>

      {/* AVISO FERIADO */}
      {esFeriado && (
        <div style={{ background:"rgba(230,126,34,0.1)", border:"2px solid rgba(230,126,34,0.35)", borderRadius:"14px", padding:"12px 16px" }}>
          <div style={{ fontSize:"13px", fontWeight:900, color:"#e67e22" }}>🇦🇷 Hoy es feriado nacional</div>
          <div style={{ fontSize:"11px", color:"#9a9a9a", fontWeight:600, marginTop:"2px" }}>
            Recordá actualizar tu disponibilidad si corresponde.
          </div>
        </div>
      )}

      {/* FERIADOS DEL AÑO */}
      <div style={{ background:"#fff", borderRadius:"16px", padding:"16px", boxShadow:"0 2px 8px rgba(0,0,0,0.06)" }}>
        <div style={{ fontSize:"11px", fontWeight:900, color:"#9a9a9a", textTransform:"uppercase", letterSpacing:"1px", marginBottom:"12px" }}>
          🇦🇷 Feriados nacionales {anio}
        </div>
        <div style={{ display:"flex", flexWrap:"wrap", gap:"6px" }}>
          {feriados.map(f => {
            const fecha = new Date(f + "T12:00:00");
            const esHoy = f === hoy;
            return (
              <div key={f} style={{
                background: esHoy ? `${color}20` : "#f4f4f2",
                border: esHoy ? `2px solid ${color}` : "2px solid transparent",
                borderRadius:"8px", padding:"4px 10px",
                fontSize:"11px", fontWeight:800,
                color: esHoy ? color : "#555",
              }}>
                {fecha.toLocaleDateString("es-AR", { day:"2-digit", month:"2-digit" })}
              </div>
            );
          })}
        </div>
      </div>

      {/* GRILLA HORARIOS */}
      <div style={{ background:"#fff", borderRadius:"16px", padding:"16px", boxShadow:"0 2px 8px rgba(0,0,0,0.06)" }}>
        <div style={{ fontSize:"11px", fontWeight:900, color:"#9a9a9a", textTransform:"uppercase", letterSpacing:"1px", marginBottom:"14px" }}>
          🕐 Horarios de atención
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
          {horarios.map(h => (
            <div key={h.dia} style={{
              display:"flex", alignItems:"center", gap:"10px",
              padding:"10px 12px", borderRadius:"12px",
              background: h.cerrado ? "#f9f9f9" : `${color}08`,
              border: `1.5px solid ${h.cerrado ? "#e8e8e6" : color + "30"}`,
              opacity: h.cerrado ? 0.6 : 1,
            }}>
              {/* Día */}
              <div style={{ width:"76px", fontSize:"13px", fontWeight:900, color: h.cerrado ? "#9a9a9a" : "#1a2a3a", flexShrink:0 }}>
                {DIAS[h.dia].slice(0,3).toUpperCase()}
              </div>

              {/* Toggle cerrado */}
              <div onClick={() => actualizar(h.dia, "cerrado", !h.cerrado)}
                style={{ width:"40px", height:"22px", borderRadius:"11px", background: h.cerrado ? "#e74c3c" : "#27ae60", position:"relative", cursor:"pointer", flexShrink:0, transition:"background .2s" }}>
                <div style={{ width:"16px", height:"16px", borderRadius:"50%", background:"#fff", position:"absolute", top:"3px", left: h.cerrado ? "3px" : "21px", transition:"left .2s", boxShadow:"0 1px 3px rgba(0,0,0,0.2)" }} />
              </div>
              <div style={{ fontSize:"10px", fontWeight:800, color: h.cerrado ? "#e74c3c" : "#27ae60", width:"40px", flexShrink:0 }}>
                {h.cerrado ? "CERR." : "ABRE"}
              </div>

              {/* Horas */}
              {!h.cerrado && (
                <>
                  <input type="time" value={h.hora_desde} onChange={e => actualizar(h.dia, "hora_desde", e.target.value)}
                    style={{ border:"2px solid #e8e8e6", borderRadius:"8px", padding:"5px 8px", fontSize:"13px", fontFamily:"'Nunito',sans-serif", fontWeight:700, outline:"none", color:"#1a2a3a", flex:1, minWidth:"0" }} />
                  <span style={{ fontSize:"11px", color:"#9a9a9a", fontWeight:700, flexShrink:0 }}>a</span>
                  <input type="time" value={h.hora_hasta} onChange={e => actualizar(h.dia, "hora_hasta", e.target.value)}
                    style={{ border:"2px solid #e8e8e6", borderRadius:"8px", padding:"5px 8px", fontSize:"13px", fontFamily:"'Nunito',sans-serif", fontWeight:700, outline:"none", color:"#1a2a3a", flex:1, minWidth:"0" }} />
                </>
              )}
              {h.cerrado && (
                <div style={{ flex:1, fontSize:"12px", fontWeight:700, color:"#bbb", textAlign:"center" }}>No disponible</div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div style={{ background:"#fff", borderRadius:"16px", padding:"16px", boxShadow:"0 2px 8px rgba(0,0,0,0.06)" }}>
        <div style={{ fontSize:"11px", fontWeight:900, color:"#9a9a9a", textTransform:"uppercase" as const, letterSpacing:"1px", marginBottom:"14px" }}>
          🇦🇷 Horario en feriados
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:"10px", padding:"10px 12px", borderRadius:"12px", background: feriado.cerrado ? "#f9f9f9" : `${color}08`, border:`1.5px solid ${feriado.cerrado ? "#e8e8e6" : color + "30"}` }}>
          <div style={{ width:"76px", fontSize:"13px", fontWeight:900, color:"#1a2a3a", flexShrink:0 }}>FERIADO</div>
          <div onClick={() => setFeriado(f => ({ ...f, cerrado: !f.cerrado }))}
            style={{ width:"40px", height:"22px", borderRadius:"11px", background: feriado.cerrado ? "#e74c3c" : "#27ae60", position:"relative", cursor:"pointer", flexShrink:0, transition:"background .2s" }}>
            <div style={{ width:"16px", height:"16px", borderRadius:"50%", background:"#fff", position:"absolute", top:"3px", left: feriado.cerrado ? "3px" : "21px", transition:"left .2s", boxShadow:"0 1px 3px rgba(0,0,0,0.2)" }} />
          </div>
          <div style={{ fontSize:"10px", fontWeight:800, color: feriado.cerrado ? "#e74c3c" : "#27ae60", width:"40px", flexShrink:0 }}>
            {feriado.cerrado ? "CERR." : "ABRE"}
          </div>
          {!feriado.cerrado && (<>
            <input type="time" value={feriado.hora_desde} onChange={e => setFeriado(f => ({ ...f, hora_desde: e.target.value }))}
              style={{ border:"2px solid #e8e8e6", borderRadius:"8px", padding:"5px 8px", fontSize:"13px", fontFamily:"'Nunito',sans-serif", fontWeight:700, outline:"none", color:"#1a2a3a", flex:1, minWidth:"0" }} />
            <span style={{ fontSize:"11px", color:"#9a9a9a", fontWeight:700, flexShrink:0 }}>a</span>
            <input type="time" value={feriado.hora_hasta} onChange={e => setFeriado(f => ({ ...f, hora_hasta: e.target.value }))}
              style={{ border:"2px solid #e8e8e6", borderRadius:"8px", padding:"5px 8px", fontSize:"13px", fontFamily:"'Nunito',sans-serif", fontWeight:700, outline:"none", color:"#1a2a3a", flex:1, minWidth:"0" }} />
          </>)}
          {feriado.cerrado && <div style={{ flex:1, fontSize:"12px", fontWeight:700, color:"#bbb", textAlign:"center" as const }}>No disponible</div>}
        </div>
      </div>

      <button onClick={guardar} disabled={guardando}
        style={{ width:"100%", background: guardado ? "linear-gradient(135deg,#27ae60,#1e8449)" : `linear-gradient(135deg,${color}cc,${color})`, border:"none", borderRadius:"12px", padding:"14px", fontSize:"15px", fontWeight:900, color:"#fff", cursor:"pointer", fontFamily:"'Nunito',sans-serif", boxShadow:`0 4px 0 ${color}88`, transition:"background .3s" }}>
        {guardando ? "⏳ Guardando..." : guardado ? "✅ ¡Guardado!" : "💾 Guardar horarios"}
      </button>
    </div>
  );
}
