"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { TIPOS_INSIGNIA } from "./InsigniaReputacion";

type Props = {
  receptorId: string;
  anuncioId?: number;
  nexoId?: string;
  sessionUserId?: string;
};

export default function BotonDarInsignia({ receptorId, anuncioId, nexoId, sessionUserId }: Props) {
  const [open, setOpen] = useState(false);
  const [yaDio, setYaDio] = useState<boolean | null>(null);
  const [enviando, setEnviando] = useState(false);

  if (!sessionUserId || sessionUserId === receptorId) return null;

  const verificar = async () => {
    if (yaDio !== null) { setOpen(true); return; }
    // Check if user already gave a badge for this anuncio/nexo
    let query = supabase.from("insignias_reputacion").select("id").eq("dador_id", sessionUserId);
    if (anuncioId) query = query.eq("anuncio_id", anuncioId);
    else if (nexoId) query = query.eq("nexo_id", nexoId);
    else return;
    const { data } = await query.maybeSingle();
    setYaDio(!!data);
    setOpen(true);
  };

  const dar = async (tipo: string) => {
    setEnviando(true);
    const row: any = { receptor_id: receptorId, dador_id: sessionUserId, tipo };
    if (anuncioId) row.anuncio_id = anuncioId;
    if (nexoId) row.nexo_id = nexoId;

    const { error } = await supabase.from("insignias_reputacion").insert(row);
    if (error) {
      if (error.code === "23505") setYaDio(true); // unique violation
      else alert("Error: " + error.message);
    } else {
      setYaDio(true);
      // Notify receptor
      const tipoInfo = TIPOS_INSIGNIA.find(t => t.tipo === tipo);
      await supabase.from("notificaciones").insert({
        usuario_id: receptorId,
        tipo: "sistema",
        mensaje: `${tipoInfo?.emoji} ¡Recibiste una insignia de "${tipoInfo?.nombre}"!`,
        leida: false,
      });
    }
    setEnviando(false);
    setOpen(false);
  };

  return (
    <>
      <button onClick={verificar} style={{
        background: "linear-gradient(135deg,#f0c040,#d4a017)", border: "none",
        borderRadius: "10px", padding: "8px 14px", fontSize: "12px", fontWeight: 800,
        color: "#1a2a3a", cursor: "pointer", fontFamily: "'Nunito',sans-serif",
        display: "inline-flex", alignItems: "center", gap: "4px",
      }}>
        🏅 Dar insignia
      </button>

      {open && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 800, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
          <div style={{ background: "#fff", borderRadius: "24px 24px 0 0", padding: "24px 20px 40px", width: "100%", maxWidth: "480px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div style={{ fontSize: "16px", fontWeight: 900, color: "#1a2a3a" }}>🏅 Dar insignia</div>
              <button onClick={() => setOpen(false)} style={{ background: "#f4f4f2", border: "none", borderRadius: "50%", width: "32px", height: "32px", fontSize: "16px", cursor: "pointer" }}>✕</button>
            </div>

            {yaDio ? (
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                <div style={{ fontSize: "40px", marginBottom: "8px" }}>✅</div>
                <div style={{ fontSize: "14px", fontWeight: 800, color: "#27ae60" }}>Ya le diste una insignia aquí</div>
                <div style={{ fontSize: "12px", color: "#9a9a9a", fontWeight: 600, marginTop: "4px" }}>Solo se puede dar 1 insignia por anuncio/nexo</div>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                {TIPOS_INSIGNIA.map(t => (
                  <button key={t.tipo} onClick={() => dar(t.tipo)} disabled={enviando}
                    style={{
                      background: `${t.color}10`, border: `2px solid ${t.color}30`,
                      borderRadius: "14px", padding: "16px 10px", cursor: "pointer",
                      display: "flex", flexDirection: "column", alignItems: "center", gap: "6px",
                      opacity: enviando ? 0.5 : 1, fontFamily: "'Nunito',sans-serif",
                    }}>
                    <span style={{ fontSize: "28px" }}>{t.emoji}</span>
                    <span style={{ fontSize: "12px", fontWeight: 800, color: t.color }}>{t.nombre}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
