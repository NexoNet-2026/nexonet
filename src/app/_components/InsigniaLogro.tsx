"use client";

const NIVELES = [
  { nivel: "ninguna",  emoji: "🌱", nombre: "Nuevo",    color: "#9a9a9a", min: 0 },
  { nivel: "bronce",   emoji: "🥉", nombre: "Bronce",   color: "#cd7f32", min: 100 },
  { nivel: "plata",    emoji: "🥈", nombre: "Plata",    color: "#a0a0a0", min: 500 },
  { nivel: "oro",      emoji: "🥇", nombre: "Oro",      color: "#d4a017", min: 1000 },
  { nivel: "platino",  emoji: "💎", nombre: "Platino",  color: "#8e44ad", min: 5000 },
  { nivel: "diamante", emoji: "👑", nombre: "Diamante", color: "#e74c3c", min: 10000 },
];

export function calcularInsigniaLogro(bitsTotales: number): string {
  let nivel = "ninguna";
  for (const n of NIVELES) {
    if (bitsTotales >= n.min) nivel = n.nivel;
  }
  return nivel;
}

export function getNivelInfo(nivel: string) {
  return NIVELES.find(n => n.nivel === nivel) || NIVELES[0];
}

export default function InsigniaLogro({ nivel, size = "sm" }: { nivel?: string; size?: "xs" | "sm" | "md" }) {
  const info = getNivelInfo(nivel || "ninguna");
  if (info.nivel === "ninguna") return null;

  const sizes = {
    xs: { fontSize: "10px", padding: "1px 6px", gap: "2px" },
    sm: { fontSize: "11px", padding: "2px 8px", gap: "3px" },
    md: { fontSize: "13px", padding: "4px 10px", gap: "4px" },
  };
  const s = sizes[size];

  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: s.gap,
      background: `${info.color}18`, border: `1px solid ${info.color}40`,
      borderRadius: "20px", padding: s.padding, fontSize: s.fontSize,
      fontWeight: 800, color: info.color, whiteSpace: "nowrap",
    }}>
      {info.emoji} {info.nombre}
    </span>
  );
}
