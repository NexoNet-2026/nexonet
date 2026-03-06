"use client";
import Link from "next/link";

export default function Header() {
  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100 }}>

      {/* FRANJA PRINCIPAL */}
      <header style={{
        height: "60px",
        background: "linear-gradient(135deg, #1a2a3a 0%, #243b55 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 16px",
        boxShadow: "0 2px 12px rgba(0,0,0,0.3)",
      }}>
        {/* LOGO */}
        <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
          <div style={{ fontSize: "22px", letterSpacing: "1px", fontFamily: "'Bebas Neue', sans-serif" }}>
            <span style={{ color: "#c8c8c8" }}>Nexo</span>
            <span style={{ color: "#d4a017" }}>Net</span>
          </div>
          <div style={{ fontSize: "10px", fontWeight: 700, color: "#8a9aaa", letterSpacing: "3px", textTransform: "uppercase" }}>
            Argentina
          </div>
        </div>

        {/* BOTÓN INICIO */}
        <Link href="/" style={{
          display: "flex", alignItems: "center", gap: "4px",
          textDecoration: "none",
          background: "rgba(255,255,255,0.08)",
          border: "1px solid rgba(255,255,255,0.15)",
          borderRadius: "8px",
          padding: "5px 12px",
        }}>
          <span style={{ fontSize: "14px" }}>🏠</span>
          <span style={{ fontSize: "10px", fontWeight: 800, color: "#8a9aaa", textTransform: "uppercase", letterSpacing: "1px" }}>Inicio</span>
        </Link>

        {/* USUARIO */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
          <span style={{ fontSize: "10px", color: "#8a9aaa", fontWeight: 600, textTransform: "uppercase", letterSpacing: "1px" }}>Usuario</span>
          <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "16px", color: "#d4a017", letterSpacing: "2px" }}>AAA-00000</span>
        </div>
      </header>

      {/* FRANJA NEXO PROMOTOR */}
      <Link href="/usuario" style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        background: "linear-gradient(90deg, #b8860b, #d4a017, #f0c040, #d4a017, #b8860b)",
        padding: "7px 16px",
        textDecoration: "none",
        cursor: "pointer",
      }}>
        <span style={{ fontSize: "14px" }}>⭐</span>
        <span style={{ fontSize: "12px", fontWeight: 800, color: "#1a2a3a", letterSpacing: "0.3px" }}>
          NEXO PROMOTOR
        </span>
        <span style={{ fontSize: "10px", color: "#1a2a3a", fontWeight: 700 }}>—</span>
        <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "20px", color: "#1a2a3a", letterSpacing: "1px" }}>30%</span>
        <span style={{ fontSize: "12px", fontWeight: 800, color: "#1a2a3a" }}>de ganancia</span>
        <span style={{ fontSize: "12px", color: "#1a2a3a", fontWeight: 800 }}>→</span>
      </Link>

    </div>
  );
}
