"use client";

export default function TarjetaVacia({ emoji, texto, color, onClick }: { emoji: string; texto: string; color: string; onClick: () => void }) {
  return (
    <div onClick={onClick} style={{ flexShrink: 0, width: "180px", cursor: "pointer" }}>
      <div style={{ background: "#fff", borderRadius: "14px", overflow: "hidden", boxShadow: "0 2px 10px rgba(0,0,0,0.06)", border: `2px dashed ${color}40`, height: "160px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "10px", padding: "16px", textAlign: "center" }}>
        <span style={{ fontSize: "36px", opacity: 0.5 }}>{emoji}</span>
        <div style={{ fontSize: "12px", fontWeight: 700, color: "#9a9a9a", lineHeight: 1.4 }}>{texto}</div>
        <div style={{ background: `${color}18`, border: `1px solid ${color}40`, borderRadius: "20px", padding: "4px 12px", fontSize: "11px", fontWeight: 800, color }}>➕ Crear</div>
      </div>
    </div>
  );
}
