"use client";
import { useState } from "react";

type AyudaItem = { emoji: string; titulo: string; desc: string };

export default function AyudaPopup({
  titulo,
  items,
  color = "#d4a017",
}: {
  titulo: string;
  items: AyudaItem[];
  color?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Botón flotante "?" */}
      <button
        onClick={() => setOpen(true)}
        style={{
          position: "fixed",
          bottom: 110,
          right: 16,
          width: 44,
          height: 44,
          borderRadius: "50%",
          background: color,
          border: "none",
          color: "#fff",
          fontSize: 22,
          fontWeight: 900,
          fontFamily: "'Bebas Neue',sans-serif",
          cursor: "pointer",
          zIndex: 200,
          boxShadow: `0 4px 12px ${color}66`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        ?
      </button>

      {/* Bottom sheet modal */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 9999,
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 480,
              maxHeight: "80vh",
              background: "#fff",
              borderRadius: "24px 24px 0 0",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "18px 20px 10px",
                borderBottom: "1px solid #f0f0f0",
              }}
            >
              <span
                style={{
                  fontFamily: "'Bebas Neue',sans-serif",
                  fontSize: 22,
                  color: "#1a2a3a",
                  letterSpacing: 1,
                }}
              >
                {titulo}
              </span>
              <button
                onClick={() => setOpen(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: 22,
                  color: "#999",
                  cursor: "pointer",
                  padding: 4,
                }}
              >
                ✕
              </button>
            </div>

            {/* Items */}
            <div style={{ overflowY: "auto", padding: "14px 20px 10px" }}>
              {items.map((it, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    gap: 14,
                    alignItems: "flex-start",
                    padding: "12px 0",
                    borderBottom:
                      i < items.length - 1 ? "1px solid #f4f4f2" : "none",
                  }}
                >
                  <span style={{ fontSize: 40, lineHeight: 1 }}>
                    {it.emoji}
                  </span>
                  <div>
                    <div
                      style={{
                        fontFamily: "'Nunito',sans-serif",
                        fontWeight: 900,
                        fontSize: 14,
                        color: "#1a2a3a",
                      }}
                    >
                      {it.titulo}
                    </div>
                    <div
                      style={{
                        fontFamily: "'Nunito',sans-serif",
                        fontSize: 13,
                        color: "#888",
                        marginTop: 2,
                        lineHeight: 1.4,
                      }}
                    >
                      {it.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Botón cerrar */}
            <div style={{ padding: "10px 20px 20px" }}>
              <button
                onClick={() => setOpen(false)}
                style={{
                  width: "100%",
                  background: color,
                  border: "none",
                  borderRadius: 14,
                  padding: 14,
                  fontSize: 15,
                  fontWeight: 900,
                  color: "#fff",
                  cursor: "pointer",
                  fontFamily: "'Nunito',sans-serif",
                }}
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
