"use client";
import Link from "next/link";

export default function Header() {
  return (
    <header style={{
      position: "fixed",
      top: 0, left: 0, right: 0,
      height: "60px",
      background: "linear-gradient(135deg, #1a2a3a 0%, #243b55 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 16px",
      zIndex: 100,
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
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "2px",
        textDecoration: "none",
        background: "rgba(212,160,23,0.15)",
        border: "1px solid rgba(212,160,23,0.4)",
        borderRadius: "10px",
        padding: "5px 14px",
        transition: "all .2s",
      }}>
        <span style={{ fontSize: "16px", lineHeight: 1 }}>🏠</span>
        <span style={{ fontSize: "9px", fontWeight: 800, color: "#d4a017", letterSpacing: "1px", textTransform: "uppercase" }}>
          Inicio
        </span>
      </Link>

      {/* USUARIO */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
        <span style={{ fontSize: "10px", color: "#8a9aaa", fontWeight: 600, textTransform: "uppercase", letterSpacing: "1px" }}>
          Usuario
        </span>
        <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "16px", color: "#d4a017", letterSpacing: "2px" }}>
          AAA-00000
        </span>
      </div>

    </header>
  );
}
