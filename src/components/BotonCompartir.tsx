"use client";
import { useState } from "react";

type Props = {
  titulo: string;
  descripcion?: string;
  imagen?: string;
  url: string;
  codigoReferido?: string;
  estiloBoton?: React.CSSProperties;
  textoBoton?: string;
};

export default function BotonCompartir({
  titulo,
  descripcion = "",
  imagen = "",
  url,
  codigoReferido = "",
  estiloBoton,
  textoBoton = "📤 Compartir",
}: Props) {
  const [abierto, setAbierto] = useState(false);
  const [copiado, setCopiado] = useState(false);

  const urlFinal = codigoReferido
    ? `${url}${url.includes("?") ? "&" : "?"}ref=${encodeURIComponent(codigoReferido)}`
    : url;

  const compartirFacebook = () => {
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(urlFinal)}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const compartirWhatsApp = () => {
    window.open(
      `https://wa.me/?text=${encodeURIComponent(titulo + " " + urlFinal)}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const compartirTwitter = () => {
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(titulo)}&url=${encodeURIComponent(urlFinal)}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const compartirInstagram = async () => {
    if (typeof navigator !== "undefined" && (navigator as any).share) {
      try {
        await (navigator as any).share({ title: titulo, text: descripcion || titulo, url: urlFinal });
      } catch {
        // usuario canceló
      }
    } else {
      alert("Instagram solo permite compartir desde el móvil. Copiá el link y pegalo en tu historia o bio.");
    }
  };

  const copiarLink = async () => {
    try {
      await navigator.clipboard.writeText(urlFinal);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      alert("No se pudo copiar el link");
    }
  };

  const opciones = [
    { emoji: "📘", label: "Facebook", color: "#1877f2", onClick: compartirFacebook },
    { emoji: "💬", label: "WhatsApp", color: "#25d366", onClick: compartirWhatsApp },
    { emoji: "🐦", label: "X / Twitter", color: "#000", onClick: compartirTwitter },
    { emoji: "📸", label: "Instagram", color: "#e1306c", onClick: compartirInstagram },
    { emoji: copiado ? "✅" : "🔗", label: copiado ? "¡Copiado!" : "Copiar link", color: "#d4a017", onClick: copiarLink },
  ];

  const defaultBtn: React.CSSProperties = {
    background: "rgba(58,123,213,0.85)",
    border: "none",
    borderRadius: "20px",
    padding: "6px 14px",
    color: "#fff",
    fontSize: "13px",
    fontWeight: 800,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "4px",
    fontFamily: "'Nunito',sans-serif",
  };

  return (
    <>
      <button onClick={() => setAbierto(true)} style={{ ...defaultBtn, ...estiloBoton }}>
        {textoBoton}
      </button>

      {abierto && (
        <div
          onClick={() => setAbierto(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.65)",
            zIndex: 900,
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            fontFamily: "'Nunito',sans-serif",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#0d1520",
              borderRadius: "24px 24px 0 0",
              padding: "22px 20px 32px",
              width: "100%",
              maxWidth: "480px",
              boxShadow: "0 -8px 30px rgba(0,0,0,0.5)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
              <div style={{ fontSize: "16px", fontWeight: 900, color: "#d4a017", letterSpacing: "0.5px" }}>
                📤 Compartir
              </div>
              <button
                onClick={() => setAbierto(false)}
                style={{
                  background: "rgba(255,255,255,0.08)",
                  border: "none",
                  borderRadius: "50%",
                  width: "32px",
                  height: "32px",
                  fontSize: "16px",
                  color: "#fff",
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>

            {(titulo || imagen) && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  background: "rgba(255,255,255,0.05)",
                  borderRadius: "12px",
                  padding: "10px 12px",
                  marginBottom: "18px",
                }}
              >
                {imagen && (
                  <img
                    src={imagen}
                    alt=""
                    style={{ width: "48px", height: "48px", borderRadius: "8px", objectFit: "cover", flexShrink: 0 }}
                  />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: "13px",
                      fontWeight: 800,
                      color: "#fff",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {titulo}
                  </div>
                  {descripcion && (
                    <div
                      style={{
                        fontSize: "11px",
                        color: "#9a9a9a",
                        fontWeight: 600,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {descripcion}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "10px" }}>
              {opciones.map((op) => (
                <button
                  key={op.label}
                  onClick={op.onClick}
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "14px",
                    padding: "12px 6px",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "6px",
                    fontFamily: "'Nunito',sans-serif",
                    transition: "background 0.15s",
                  }}
                >
                  <div
                    style={{
                      width: "38px",
                      height: "38px",
                      borderRadius: "50%",
                      background: op.color,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "18px",
                    }}
                  >
                    {op.emoji}
                  </div>
                  <div style={{ fontSize: "10px", fontWeight: 700, color: "#fff", textAlign: "center", lineHeight: 1.2 }}>
                    {op.label}
                  </div>
                </button>
              ))}
            </div>

            <div
              style={{
                marginTop: "18px",
                background: "rgba(212,160,23,0.08)",
                border: "1px solid rgba(212,160,23,0.2)",
                borderRadius: "10px",
                padding: "10px 12px",
                fontSize: "11px",
                color: "#d4a017",
                fontWeight: 700,
                wordBreak: "break-all",
              }}
            >
              🔗 {urlFinal}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
