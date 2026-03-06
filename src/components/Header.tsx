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

        {/* BANNER PROMOTOR CENTRAL */}
        <Link href="/usuario" style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textDecoration: "none",
          background: "linear-gradient(135deg, rgba(212,160,23,0.2), rgba(240,192,64,0.15))",
          border: "1px solid rgba(212,160,23,0.5)",
          borderRadius: "10px",
          padding: "5px 12px",
          cursor: "pointer",
          transition: "all .2s",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <span style={{ fontSize: "12px" }}>⭐</span>
            <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "15px", color: "#d4a017", letterSpacing: "1px" }}>
              NEXO PROMOTOR
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "18px", color: "#f0c040" }}>30%</span>
            <span style={{ fontSize: "9px", fontWeight: 800, color: "#8a9aaa", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              de ganancia
            </span>
          </div>
        </Link>

        {/* BOTÓN INICIO + USUARIO */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "2px" }}>
          <Link href="/" style={{
            display: "flex", alignItems: "center", gap: "4px",
            textDecoration: "none",
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: "8px",
            padding: "2px 8px",
          }}>
            <span style={{ fontSize: "12px" }}>🏠</span>
            <span style={{ fontSize: "9px", fontWeight: 800, color: "#8a9aaa", textTransform: "uppercase", letterSpacing: "1px" }}>Inicio</span>
          </Link>
          <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "14px", color: "#d4a017", letterSpacing: "2px" }}>
            AAA-00000
          </span>
        </div>
      </header>

    </div>
  );
}
