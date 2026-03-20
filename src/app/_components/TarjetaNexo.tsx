"use client";
import { TIPO_EMOJI, type Nexo } from "@/app/_lib/home-constants";

export default function TarjetaNexo({ nexo, color, onClick, esPrimero }: { nexo: Nexo; color: string; onClick: () => void; esPrimero?: boolean }) {
  return (
    <div onClick={onClick} style={{ flexShrink: 0, width: "160px", cursor: "pointer", position: "relative" }}>
      {esPrimero && (
        <div style={{ position: "absolute", top: "-6px", right: "-4px", zIndex: 2, background: "linear-gradient(135deg,#ff6b00,#ff4500)", borderRadius: "8px", padding: "2px 7px", fontSize: "10px", fontWeight: 900, color: "#fff", boxShadow: "0 2px 6px rgba(255,69,0,0.4)" }}>
          🔥
        </div>
      )}
      <div style={{ background: "#fff", borderRadius: "14px", overflow: "hidden", boxShadow: "0 2px 10px rgba(0,0,0,0.08)", border: esPrimero ? "2px solid #ff6b00" : `2px solid ${color}20` }}>
        <div style={{ width: "100%", height: "90px", background: `linear-gradient(135deg,${color}33,${color}11)`, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", position: "relative" }}>
          {nexo.avatar_url
            ? <img src={nexo.avatar_url} alt={nexo.titulo} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : <span style={{ fontSize: "36px", opacity: 0.6 }}>{TIPO_EMOJI[nexo.tipo] || "✨"}</span>
          }
          <div style={{ position: "absolute", top: "6px", left: "6px", background: color, borderRadius: "20px", padding: "2px 7px", fontSize: "9px", fontWeight: 900, color: "#fff", textTransform: "uppercase" }}>
            {nexo.tipo}
          </div>
          {nexo.config?.tipo_acceso === "pago" && (
            <div style={{ position: "absolute", top: "6px", right: "6px", background: "rgba(212,160,23,0.95)", borderRadius: "6px", padding: "2px 6px", fontSize: "9px", fontWeight: 900, color: "#1a2a3a" }}>💰</div>
          )}
        </div>
        <div style={{ padding: "8px 10px 10px" }}>
          <div style={{ fontSize: "12px", fontWeight: 800, color: "#1a2a3a", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as any, marginBottom: "4px" }}>
            {nexo.titulo}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            {nexo.tipo === "grupo" && <span style={{ fontSize: "10px", color: "#9a9a9a", fontWeight: 600 }}>👥 {nexo.miembros_count || 0}</span>}
            {nexo.ciudad && <span style={{ fontSize: "10px", color: "#9a9a9a", fontWeight: 600 }}>📍 {nexo.ciudad}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
