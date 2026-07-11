"use client";
import { useState, useEffect } from "react";

// Banner de consentimiento de cookies. Guarda la preferencia en
// localStorage("cookie_consent") = "accepted" | "rejected" y solo se muestra
// mientras no exista una preferencia guardada.
export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const consent = localStorage.getItem("cookie_consent");
      if (!consent) setVisible(true);
    } catch {
      // Si localStorage no está disponible, no mostramos el banner.
    }
  }, []);

  const decidir = (valor: "accepted" | "rejected") => {
    try {
      localStorage.setItem("cookie_consent", valor);
    } catch {
      // ignoramos errores de almacenamiento
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Consentimiento de cookies"
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 2000,
        background: "#1a2a3a",
        color: "#e8e8e8",
        padding: "16px 20px",
        boxShadow: "0 -2px 16px rgba(0,0,0,0.3)",
        fontFamily: "'Nunito', sans-serif",
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "center",
        gap: "14px",
      }}
    >
      <span style={{ fontSize: "13px", lineHeight: 1.5, maxWidth: "640px" }}>
        Usamos cookies para mejorar tu experiencia. Al aceptar, permitís cookies de
        rendimiento y funcionalidad. Más info en nuestra{" "}
        <a href="/legal/cookies" style={{ color: "#e0b020", textDecoration: "underline" }}>
          Política de Cookies
        </a>
        .
      </span>
      <div style={{ display: "flex", gap: "10px", flexShrink: 0 }}>
        <button
          onClick={() => decidir("rejected")}
          style={{
            background: "transparent",
            border: "1px solid #9aa5b1",
            color: "#e8e8e8",
            borderRadius: "10px",
            padding: "9px 18px",
            fontSize: "13px",
            fontWeight: 800,
            cursor: "pointer",
            fontFamily: "'Nunito', sans-serif",
          }}
        >
          Rechazar
        </button>
        <button
          onClick={() => decidir("accepted")}
          style={{
            background: "#e0b020",
            border: "none",
            color: "#1a2a3a",
            borderRadius: "10px",
            padding: "9px 18px",
            fontSize: "13px",
            fontWeight: 900,
            cursor: "pointer",
            fontFamily: "'Nunito', sans-serif",
          }}
        >
          Aceptar
        </button>
      </div>
    </div>
  );
}
