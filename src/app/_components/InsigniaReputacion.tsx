"use client";

export const TIPOS_INSIGNIA = [
  { tipo: "buen_trato",  emoji: "👍", nombre: "Buen trato", color: "#27ae60" },
  { tipo: "confiable",   emoji: "✅", nombre: "Confiable",  color: "#3a7bd5" },
  { tipo: "rapido",      emoji: "⚡", nombre: "Rápido",     color: "#e67e22" },
  { tipo: "recomendado", emoji: "🏆", nombre: "Recomendado",color: "#d4a017" },
];

export default function InsigniaReputacion({ contadores, size = "sm" }: {
  contadores: Record<string, number>;
  size?: "xs" | "sm" | "md";
}) {
  const total = Object.values(contadores).reduce((a, b) => a + b, 0);
  if (total === 0) return null;

  const sizes = {
    xs: { fontSize: "9px",  gap: "3px", padding: "1px 5px" },
    sm: { fontSize: "10px", gap: "4px", padding: "2px 6px" },
    md: { fontSize: "12px", gap: "6px", padding: "3px 8px" },
  };
  const s = sizes[size];

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: s.gap }}>
      {TIPOS_INSIGNIA.map(t => {
        const count = contadores[t.tipo] || 0;
        if (count === 0) return null;
        return (
          <span key={t.tipo} style={{
            display: "inline-flex", alignItems: "center", gap: "2px",
            background: `${t.color}12`, border: `1px solid ${t.color}30`,
            borderRadius: "20px", padding: s.padding, fontSize: s.fontSize,
            fontWeight: 800, color: t.color, whiteSpace: "nowrap",
          }}>
            {t.emoji} {count}
          </span>
        );
      })}
    </div>
  );
}
