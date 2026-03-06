"use client";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { useState } from "react";

const rubros = ["Todos", "Autos", "Inmuebles", "Tecnología", "Servicios", "Ropa", "Hogar"];

const destacados = [
  { emoji: "🚗", titulo: "Toyota Corolla 2020", precio: "$18.500.000", lugar: "Rafaela, SF", bg: "#dde8f0", flash: true },
  { emoji: "🏠", titulo: "Depto 2 amb. céntrico", precio: "$320.000/mes", lugar: "Santa Fe", bg: "#f0ead8", flash: true },
  { emoji: "💻", titulo: "MacBook Air M2", precio: "$2.800.000", lugar: "Rosario, SF", bg: "#e8f0e8", flash: false },
  { emoji: "🔧", titulo: "Plomero disponible", precio: "Consultar", lugar: "Córdoba", bg: "#f0e8f0", flash: false },
];

const recientes = [
  { emoji: "👕", titulo: "Ropa nueva importada", precio: "$45.000", lugar: "Buenos Aires", bg: "#f0e8d8" },
  { emoji: "🛋️", titulo: "Sofá 3 cuerpos", precio: "$180.000", lugar: "Mendoza", bg: "#d8e8f0" },
  { emoji: "📱", titulo: "iPhone 14 Pro 128GB", precio: "$1.200.000", lugar: "Tucumán", bg: "#e8f0d8" },
];

export default function Home() {
  const [rubroActivo, setRubroActivo] = useState("Todos");

  return (
    <main style={{ paddingTop: "60px", paddingBottom: "100px", background: "#f4f4f2", minHeight: "100vh", fontFamily: "'Nunito', sans-serif" }}>
      <Header />

      {/* HERO */}
      <div style={{
        background: "linear-gradient(135deg, #1a2a3a 0%, #243b55 100%)",
        padding: "28px 16px 32px",
        textAlign: "center",
      }}>
        <div style={{ fontSize: "13px", fontWeight: 700, color: "#d4a017", letterSpacing: "2px", textTransform: "uppercase", marginBottom: "4px" }}>
          Conectando Oportunidades
        </div>
        <div style={{ fontSize: "12px", color: "#7a8fa0", marginBottom: "20px", fontWeight: 600 }}>
          Conectando a la Comunidad
        </div>
        {/* BUSCADOR */}
        <div style={{ display: "flex", background: "#fff", borderRadius: "12px", overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.25)", maxWidth: "500px", margin: "0 auto" }}>
          <input
            type="text"
            placeholder="¿Qué estás buscando?"
            style={{ flex: 1, border: "none", padding: "14px 16px", fontFamily: "'Nunito', sans-serif", fontSize: "14px", color: "#2c2c2e", outline: "none" }}
          />
          <button style={{ background: "#d4a017", border: "none", padding: "0 18px", cursor: "pointer", fontSize: "18px" }}>🔍</button>
        </div>
      </div>

      {/* BANNER PROMOTOR */}
      <div style={{
        background: "linear-gradient(90deg, #b8860b, #d4a017, #f0c040)",
        padding: "10px 16px",
        display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
        cursor: "pointer",
      }}>
        <span style={{ fontWeight: 800, fontSize: "13px", color: "#1a2a3a" }}>⭐ Nexo Promotor —</span>
        <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "20px", color: "#1a2a3a" }}>30%</span>
        <span style={{ fontWeight: 800, fontSize: "13px", color: "#1a2a3a" }}>de ganancia →</span>
      </div>

      {/* ACCIONES RÁPIDAS */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: "10px", padding: "16px", alignItems: "center" }}>
        <a href="/buscar" style={accionStyle}>
          <div style={{ fontSize: "24px", marginBottom: "6px" }}>📋</div>
          <div style={accionLabelStyle}>Ver en Lista</div>
        </a>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
          <button style={btnPublicarStyle}>➕</button>
          <span style={{ fontSize: "10px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px", color: "#2c2c2e" }}>Publicar</span>
        </div>
        <a href="/mapa" style={accionStyle}>
          <div style={{ fontSize: "24px", marginBottom: "6px" }}>🗺️</div>
          <div style={accionLabelStyle}>Ver en Mapa</div>
        </a>
      </div>

      {/* FILTROS RUBRO */}
      <div style={{ display: "flex", gap: "8px", padding: "0 16px 16px", overflowX: "auto", scrollbarWidth: "none" }}>
        {rubros.map((r) => (
          <button key={r} onClick={() => setRubroActivo(r)} style={{
            background: rubroActivo === r ? "#2c2c2e" : "#fff",
            border: `2px solid ${rubroActivo === r ? "#2c2c2e" : "#e8e8e6"}`,
            borderRadius: "20px",
            padding: "6px 14px",
            fontSize: "12px",
            fontWeight: 700,
            color: rubroActivo === r ? "#fff" : "#2c2c2e",
            whiteSpace: "nowrap",
            cursor: "pointer",
            flexShrink: 0,
            fontFamily: "'Nunito', sans-serif",
          }}>{r}</button>
        ))}
      </div>

      {/* SLIDER DESTACADOS */}
      <Seccion titulo="⚡ Destacados">
        {destacados.map((item, i) => (
          <Tarjeta key={i} {...item} />
        ))}
      </Seccion>

      {/* SLIDER RECIENTES */}
      <Seccion titulo="🕐 Recién publicados">
        {recientes.map((item, i) => (
          <Tarjeta key={i} {...item} />
        ))}
      </Seccion>

      {/* MAPA PREVIEW */}
      <a href="/mapa" style={{ display: "block", margin: "0 16px 20px", borderRadius: "16px", overflow: "hidden", boxShadow: "0 4px 16px rgba(0,0,0,0.1)", textDecoration: "none", position: "relative" }}>
        <div style={{ height: "180px", background: "linear-gradient(135deg, #c8d8e8, #b0c4d8)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "8px" }}>
          <span style={{ fontSize: "40px" }}>🗺️</span>
          <span style={{ fontWeight: 800, fontSize: "13px", color: "#1a2a3a", letterSpacing: "1px" }}>Ver anuncios en el mapa</span>
        </div>
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(transparent, rgba(26,42,58,0.8))", padding: "16px", color: "white", fontWeight: 800, fontSize: "14px" }}>
          📍 Anuncios cerca tuyo
        </div>
      </a>

      <BottomNav />
    </main>
  );
}

// ── COMPONENTES INTERNOS ──

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 16px 10px" }}>
        <span style={{ fontSize: "16px", fontWeight: 900 }}>{titulo}</span>
        <a href="/buscar" style={{ fontSize: "12px", fontWeight: 700, color: "#d4a017", textDecoration: "none" }}>Ver todos →</a>
      </div>
      <div style={{ display: "flex", gap: "12px", padding: "0 16px 8px", overflowX: "auto", scrollbarWidth: "none" }}>
        {children}
      </div>
    </div>
  );
}

function Tarjeta({ emoji, titulo, precio, lugar, bg, flash }: {
  emoji: string; titulo: string; precio: string; lugar: string; bg: string; flash?: boolean;
}) {
  return (
    <div style={{ background: "#fff", borderRadius: "16px", overflow: "hidden", boxShadow: "0 2px 10px rgba(0,0,0,0.08)", flexShrink: 0, width: "180px", cursor: "pointer" }}>
      <div style={{ width: "100%", height: "120px", background: bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "48px", position: "relative" }}>
        {emoji}
        {flash && (
          <span style={{ position: "absolute", top: "8px", right: "8px", background: "#d4a017", color: "#1a2a3a", fontSize: "9px", fontWeight: 900, padding: "3px 7px", borderRadius: "8px", letterSpacing: "0.5px", textTransform: "uppercase" }}>
            Flash
          </span>
        )}
      </div>
      <div style={{ padding: "10px 12px 12px" }}>
        <div style={{ fontSize: "13px", fontWeight: 800, color: "#2c2c2e", marginBottom: "3px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{titulo}</div>
        <div style={{ fontSize: "15px", fontWeight: 900, color: "#d4a017" }}>{precio}</div>
        <div style={{ fontSize: "11px", color: "#9a9a9a", fontWeight: 600, marginTop: "2px" }}>📍 {lugar}</div>
      </div>
    </div>
  );
}

// ── ESTILOS REUTILIZABLES ──
const accionStyle: React.CSSProperties = {
  background: "#fff",
  borderRadius: "14px",
  padding: "14px 10px",
  textAlign: "center",
  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
  cursor: "pointer",
  textDecoration: "none",
  color: "#2c2c2e",
  display: "block",
};

const accionLabelStyle: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: "0.5px",
  lineHeight: 1.2,
};

const btnPublicarStyle: React.CSSProperties = {
  background: "#d4a017",
  color: "#1a2a3a",
  border: "none",
  borderRadius: "50%",
  width: "68px",
  height: "68px",
  fontSize: "30px",
  cursor: "pointer",
  boxShadow: "0 4px 16px rgba(212,160,23,0.45)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};
