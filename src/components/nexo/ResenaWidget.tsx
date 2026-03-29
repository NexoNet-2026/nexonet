"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

interface Resena {
  id: string;
  usuario_id: string;
  rating: number;
  comentario: string;
  created_at: string;
  usuarios?: { nombre_usuario: string; avatar_url: string };
}

interface Props {
  nexoId: string;
  perfil: any;
  color: string;
}

function Estrellas({ rating, size = 16, interactivo = false, onSelect }: { rating: number; size?: number; interactivo?: boolean; onSelect?: (r: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display: "flex", gap: "2px" }}>
      {[1,2,3,4,5].map(i => (
        <span key={i}
          onClick={() => interactivo && onSelect?.(i)}
          onMouseEnter={() => interactivo && setHover(i)}
          onMouseLeave={() => interactivo && setHover(0)}
          style={{ fontSize: `${size}px`, cursor: interactivo ? "pointer" : "default", opacity: i <= (hover || rating) ? 1 : 0.25, transition: "opacity .15s" }}>
          ⭐
        </span>
      ))}
    </div>
  );
}

export function EstrellasMini({ rating, count }: { rating: number; count: number }) {
  if (count === 0) return null;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
      <span style={{ fontSize: "12px" }}>⭐</span>
      <span style={{ fontSize: "12px", fontWeight: 900, color: "#d4a017" }}>{rating.toFixed(1)}</span>
      <span style={{ fontSize: "11px", color: "#9a9a9a", fontWeight: 600 }}>({count})</span>
    </div>
  );
}

export default function ResenaWidget({ nexoId, perfil, color }: Props) {
  const [resenas, setResenas] = useState<Resena[]>([]);
  const [miResena, setMiResena] = useState<Resena | null>(null);
  const [cargando, setCargando] = useState(true);
  const [rating, setRating] = useState(0);
  const [comentario, setComentario] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [editando, setEditando] = useState(false);
  const [expandido, setExpandido] = useState(false);

  useEffect(() => { cargar(); }, [nexoId]);

  const cargar = async () => {
    const { data } = await supabase.from("nexo_resenas")
      .select("*, usuarios(nombre_usuario, avatar_url)")
      .eq("nexo_id", nexoId).order("created_at", { ascending: false });
    const todas = data || [];
    setResenas(todas);
    if (perfil) {
      const mia = todas.find(r => r.usuario_id === perfil.id);
      if (mia) { setMiResena(mia); setRating(mia.rating); setComentario(mia.comentario || ""); }
    }
    setCargando(false);
  };

  const promedio = resenas.length > 0 ? resenas.reduce((acc, r) => acc + r.rating, 0) / resenas.length : 0;

  const guardar = async () => {
    if (!perfil || rating === 0) return;
    setGuardando(true);
    if (miResena) {
      const { data } = await supabase.from("nexo_resenas")
        .update({ rating, comentario: comentario.trim() || null })
        .eq("id", miResena.id).select("*, usuarios(nombre_usuario, avatar_url)").single();
      if (data) {
        setMiResena(data);
        setResenas(prev => prev.map(r => r.id === data.id ? data : r));
      }
    } else {
      const { data } = await supabase.from("nexo_resenas")
        .insert({ nexo_id: nexoId, usuario_id: perfil.id, rating, comentario: comentario.trim() || null })
        .select("*, usuarios(nombre_usuario, avatar_url)").single();
      if (data) { setMiResena(data); setResenas(prev => [data, ...prev]); }
    }
    setGuardando(false);
    setEditando(false);
  };

  const eliminar = async () => {
    if (!miResena || !confirm("¿Eliminar tu reseña?")) return;
    await supabase.from("nexo_resenas").delete().eq("id", miResena.id);
    setResenas(prev => prev.filter(r => r.id !== miResena.id));
    setMiResena(null); setRating(0); setComentario("");
  };

  const distribucion = [5,4,3,2,1].map(n => ({
    n, count: resenas.filter(r => r.rating === n).length,
    pct: resenas.length > 0 ? (resenas.filter(r => r.rating === n).length / resenas.length) * 100 : 0,
  }));

  if (cargando) return null;

  return (
    <div style={{ fontFamily: "'Nunito',sans-serif", display: "flex", flexDirection: "column", gap: "12px" }}>

      {/* RESUMEN */}
      <div style={{ background: "#fff", borderRadius: "16px", padding: "18px", boxShadow: "0 2px 10px rgba(0,0,0,0.06)" }}>
        <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
          <div style={{ textAlign: "center", flexShrink: 0 }}>
            <div style={{ fontSize: "48px", fontWeight: 900, color: "#1a2a3a", lineHeight: 1, fontFamily: "'Bebas Neue',sans-serif" }}>
              {resenas.length > 0 ? promedio.toFixed(1) : "—"}
            </div>
            <Estrellas rating={Math.round(promedio)} size={14} />
            <div style={{ fontSize: "11px", color: "#9a9a9a", fontWeight: 600, marginTop: "4px" }}>
              {resenas.length} reseña{resenas.length !== 1 ? "s" : ""}
            </div>
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "5px" }}>
            {distribucion.map(d => (
              <div key={d.n} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ fontSize: "11px", fontWeight: 700, color: "#9a9a9a", width: "8px" }}>{d.n}</span>
                <span style={{ fontSize: "10px" }}>⭐</span>
                <div style={{ flex: 1, height: "6px", background: "#f0f0f0", borderRadius: "3px", overflow: "hidden" }}>
                  <div style={{ width: `${d.pct}%`, height: "100%", background: `linear-gradient(90deg,${color}cc,${color})`, borderRadius: "3px", transition: "width .4s" }} />
                </div>
                <span style={{ fontSize: "10px", fontWeight: 700, color: "#9a9a9a", width: "16px", textAlign: "right" }}>{d.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FORMULARIO */}
      {perfil && (
        <div style={{ background: "#fff", borderRadius: "16px", padding: "16px", boxShadow: "0 2px 10px rgba(0,0,0,0.06)" }}>
          {miResena && !editando ? (
            <div>
              <div style={{ fontSize: "12px", fontWeight: 800, color: "#9a9a9a", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "10px" }}>Tu reseña</div>
              <Estrellas rating={miResena.rating} size={18} />
              {miResena.comentario && <div style={{ fontSize: "13px", color: "#555", fontWeight: 600, marginTop: "8px", lineHeight: 1.5 }}>{miResena.comentario}</div>}
              <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                <button onClick={() => setEditando(true)} style={{ background: `${color}15`, border: `1px solid ${color}40`, borderRadius: "8px", padding: "6px 14px", fontSize: "12px", fontWeight: 800, color, cursor: "pointer", fontFamily: "'Nunito',sans-serif" }}>✏️ Editar</button>
                <button onClick={eliminar} style={{ background: "rgba(231,76,60,0.1)", border: "1px solid rgba(231,76,60,0.3)", borderRadius: "8px", padding: "6px 14px", fontSize: "12px", fontWeight: 800, color: "#e74c3c", cursor: "pointer", fontFamily: "'Nunito',sans-serif" }}>🗑️ Eliminar</button>
              </div>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: "12px", fontWeight: 800, color: "#9a9a9a", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "12px" }}>
                {miResena ? "Editar reseña" : "Escribí una reseña"}
              </div>
              <Estrellas rating={rating} size={28} interactivo onSelect={setRating} />
              {rating > 0 && (
                <div style={{ marginTop: "12px" }}>
                  <textarea value={comentario} onChange={e => setComentario(e.target.value)}
                    placeholder="Contá tu experiencia (opcional)..." rows={3} maxLength={400}
                    style={{ width: "100%", border: "2px solid #e8e8e6", borderRadius: "12px", padding: "10px 14px", fontSize: "13px", fontFamily: "'Nunito',sans-serif", outline: "none", resize: "vertical", boxSizing: "border-box" as const }} />
                  <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
                    {editando && <button onClick={() => setEditando(false)} style={{ flex: 1, background: "#f4f4f2", border: "none", borderRadius: "10px", padding: "11px", fontSize: "13px", fontWeight: 800, color: "#9a9a9a", cursor: "pointer", fontFamily: "'Nunito',sans-serif" }}>Cancelar</button>}
                    <button onClick={guardar} disabled={guardando || rating === 0}
                      style={{ flex: 2, background: `linear-gradient(135deg,${color}cc,${color})`, border: "none", borderRadius: "10px", padding: "11px", fontSize: "13px", fontWeight: 900, color: "#fff", cursor: "pointer", fontFamily: "'Nunito',sans-serif", opacity: guardando ? 0.6 : 1 }}>
                      {guardando ? "⏳ Guardando..." : "✅ Publicar reseña"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* LISTA */}
      {resenas.filter(r => r.usuario_id !== perfil?.id).length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div style={{ fontSize: "11px", fontWeight: 800, color: "#9a9a9a", textTransform: "uppercase", letterSpacing: "1px" }}>
            Opiniones ({resenas.filter(r => r.usuario_id !== perfil?.id).length})
          </div>
          {(expandido ? resenas : resenas.slice(0, 3)).filter(r => r.usuario_id !== perfil?.id).map(r => (
            <div key={r.id} style={{ background: "#fff", borderRadius: "14px", padding: "14px 16px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "linear-gradient(135deg,#1a2a3a,#243b55)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
                  {r.usuarios?.avatar_url ? <img src={r.usuarios.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : "👤"}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "13px", fontWeight: 800, color: "#1a2a3a" }}>{r.usuarios?.nombre_usuario || "Usuario"}</div>
                  <div style={{ fontSize: "10px", color: "#9a9a9a", fontWeight: 600 }}>{new Date(r.created_at).toLocaleDateString("es-AR")}</div>
                </div>
                <Estrellas rating={r.rating} size={13} />
              </div>
              {r.comentario && <div style={{ fontSize: "13px", color: "#555", fontWeight: 600, lineHeight: 1.6 }}>{r.comentario}</div>}
            </div>
          ))}
          {resenas.filter(r => r.usuario_id !== perfil?.id).length > 3 && (
            <button onClick={() => setExpandido(e => !e)}
              style={{ background: "#f4f4f2", border: "none", borderRadius: "12px", padding: "12px", fontSize: "13px", fontWeight: 800, color: "#9a9a9a", cursor: "pointer", fontFamily: "'Nunito',sans-serif" }}>
              {expandido ? "▲ Ver menos" : `▼ Ver todas (${resenas.filter(r => r.usuario_id !== perfil?.id).length})`}
            </button>
          )}
        </div>
      )}

      {resenas.length === 0 && !perfil && (
        <div style={{ textAlign: "center", padding: "30px", background: "#fff", borderRadius: "16px", color: "#9a9a9a", fontSize: "13px", fontWeight: 600 }}>
          Iniciá sesión para dejar una reseña
        </div>
      )}
    </div>
  );
}
