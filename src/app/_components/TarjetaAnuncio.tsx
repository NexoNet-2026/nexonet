"use client";
import { FUENTES, formatPrecio, type Anuncio } from "@/app/_lib/home-constants";
import InsigniaLogro from "./InsigniaLogro";

export default function TarjetaAnuncio({ a, esPrimero }: { a: Anuncio; esPrimero?: boolean }) {
  const fuente = FUENTES[a.fuente] || FUENTES.nexonet;
  const tieneWA = !!a.owner_whatsapp;
  return (
    <a href={`/anuncios/${a.id}`} style={{ textDecoration: "none", flexShrink: 0, width: "190px", display: "block", position: "relative" }}>
      {esPrimero && (
        <div style={{ position: "absolute", top: "-6px", right: "-4px", zIndex: 2, background: "linear-gradient(135deg,#ff6b00,#ff4500)", borderRadius: "8px", padding: "2px 7px", fontSize: "10px", fontWeight: 900, color: "#fff", boxShadow: "0 2px 6px rgba(255,69,0,0.4)" }}>
          🔥
        </div>
      )}
      <div style={{ background: "#fff", borderRadius: "16px", overflow: "hidden", boxShadow: "0 2px 10px rgba(0,0,0,0.08)", border: esPrimero ? "2px solid #ff6b00" : "1px solid #f0f0f0" }}>
        <div style={{ background: fuente.color, padding: "4px 10px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: "10px", fontWeight: 900, color: fuente.texto, textTransform: "uppercase", letterSpacing: "0.5px" }}>{fuente.label}</span>
          <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
            {a.flash && <span style={{ background: "#1a2a3a", color: "#d4a017", fontSize: "9px", fontWeight: 900, padding: "1px 6px", borderRadius: "6px" }}>⚡</span>}
            {a.permuto && <span style={{ background: "#8e44ad", color: "#fff", fontSize: "9px", fontWeight: 900, padding: "1px 6px", borderRadius: "6px" }}>🔄</span>}
            <div style={{ width: "14px", height: "14px", borderRadius: "50%", background: tieneWA ? "#25d366" : "rgba(0,0,0,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "8px", opacity: tieneWA ? 1 : 0.3 }}>📱</div>
          </div>
        </div>
        <div style={{ width: "100%", height: "120px", background: "#e8e8e6", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
          {(a.imagenes?.[0] || (a as any).avatar_url || (a as any).banner_url)
            ? <img src={a.imagenes?.[0] || (a as any).avatar_url || (a as any).banner_url} alt={a.titulo} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : <span style={{ fontSize: "40px" }}>📦</span>}
        </div>
        <div style={{ padding: "8px 10px 12px" }}>
          <div style={{ fontSize: "10px", color: "#9a9a9a", fontWeight: 700, marginBottom: "2px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{a.subrubro}</div>
          <div style={{ fontSize: "13px", fontWeight: 800, color: "#2c2c2e", marginBottom: "3px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.titulo}</div>
          <div style={{ fontSize: "15px", fontWeight: 900, color: "#d4a017" }}>{formatPrecio(a.precio, a.moneda)}</div>
          <div style={{ fontSize: "11px", color: "#9a9a9a", fontWeight: 600, marginTop: "2px" }}>📍 {a.ciudad}</div>
          {a.owner_insignia_logro && a.owner_insignia_logro !== "ninguna" && (
            <div style={{ marginTop: "4px" }}><InsigniaLogro nivel={a.owner_insignia_logro} size="xs" /></div>
          )}
        </div>
      </div>
    </a>
  );
}
