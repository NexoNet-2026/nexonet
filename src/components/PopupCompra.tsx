"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type SeccionKey = "anuncio" | "conexion" | "flash" | "extras" | "grupo";
type Tipo = SeccionKey | "general" | "link" | "adjunto";

type Producto = {
  id: string;
  label: string;
  precio: string;
  desc: string;
  badge: string;
};

type Props = {
  tipo: Tipo;
  tituloAccion?: string;
  bitsDisponibles?: { nexo: number; promo: number; free: number };
  onClose: () => void;
  onUsarBits?: (
    cantidad: number,
    tipo: "nexo" | "promo" | "free"
  ) => void | Promise<void>;
};

const PRODUCTOS: Record<SeccionKey | "general", Producto[]> = {
  conexion: [
    { id: "cx500", label: "500 BIT Conexión", precio: "$500", desc: "500 conexiones", badge: "" },
    { id: "cx1000", label: "1.000 BIT Conexión", precio: "$900", desc: "Ahorrás $100", badge: "💰 Oferta" },
    { id: "cx5000", label: "5.000 BIT Conexión", precio: "$4.000", desc: "Ahorrás $1.000", badge: "🔥 Popular" },
    { id: "cxilim", label: "BIT Ilimitados /30d", precio: "$10.000", desc: "Sin límite por 30 días", badge: "⭐ Pro" },
  ],
  anuncio: [
    { id: "an3", label: "BIT Anuncio x3", precio: "$1.000", desc: "3 anuncios por 30 días", badge: "" },
    { id: "an10", label: "BIT Anuncio x10", precio: "$3.000", desc: "10 anuncios por 30 días", badge: "💰 Oferta" },
    { id: "anEmp", label: "BIT EMPRESA x50", precio: "$10.000", desc: "50 anuncios por 30 días", badge: "🏢 Empresa" },
  ],
  flash: [
    { id: "flBarr", label: "Promo Flash Barrio", precio: "$500", desc: "15 días en tu barrio", badge: "" },
    { id: "flCiud", label: "Promo Flash Ciudad", precio: "$2.000", desc: "15 días en tu ciudad", badge: "🔥 Popular" },
    { id: "flProv", label: "Promo Flash Provincia", precio: "$5.000", desc: "30 días en tu provincia", badge: "" },
    { id: "flPais", label: "Promo Flash País", precio: "$10.000", desc: "30 días en todo el país", badge: "⭐ Máximo" },
  ],
  extras: [
    { id: "exLink", label: "BIT Link", precio: "$500", desc: "Link externo por 30 días", badge: "" },
    { id: "exAdj", label: "BIT Adjunto", precio: "$500", desc: "Archivo adjunto /30 días", badge: "" },
    { id: "exGrupo", label: "BIT Grupo", precio: "$500", desc: "Acceso al grupo /30 días", badge: "" },
  ],
  grupo: [
    { id: "exGrupo", label: "BIT Grupo", precio: "$500", desc: "Acceso al grupo /30 días", badge: "" },
  ],
  general: [],
};

const SECCIONES_GENERAL: { key: SeccionKey; titulo: string; color: string }[] = [
  { key: "anuncio", titulo: "📋 Anuncios", color: "#d4a017" },
  { key: "conexion", titulo: "🔗 Conexiones", color: "#3a7bd5" },
  { key: "flash", titulo: "⚡ Promo Flash", color: "#e63946" },
  { key: "extras", titulo: "🔧 Extras", color: "#00a884" },
];

export default function PopupCompra({
  tipo,
  tituloAccion,
  bitsDisponibles,
  onClose,
  onUsarBits,
}: Props) {
  const router = useRouter();
  const [seccion, setSeccion] = useState<SeccionKey>("anuncio");

  const nexo = bitsDisponibles?.nexo || 0;
  const promo = bitsDisponibles?.promo || 0;
  const free = bitsDisponibles?.free || 0;
  const totalDisp = nexo + promo + free;
  const tieneDisponibles = totalDisp > 0;

  const categoriaActual: SeccionKey =
    tipo === "general"
      ? seccion
      : tipo === "link" || tipo === "adjunto"
      ? "extras"
      : tipo;

  const productos = PRODUCTOS[categoriaActual] || [];

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        background: "rgba(0,0,0,0.65)",
        display: "flex",
        alignItems: "flex-end",
        padding: "16px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%",
          background: "#fff",
          borderRadius: "20px 20px 16px 16px",
          padding: "24px 20px 20px",
          boxShadow: "0 -8px 40px rgba(0,0,0,0.3)",
          maxHeight: "90vh",
          overflowY: "auto",
          fontFamily: "'Nunito',sans-serif",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "16px",
          }}
        >
          <div>
            <div
              style={{
                fontFamily: "'Bebas Neue',sans-serif",
                fontSize: "22px",
                color: "#1a2a3a",
                letterSpacing: "1px",
              }}
            >
              {tituloAccion || "⚡ Cargar BIT"}
            </div>
            <div
              style={{
                fontSize: "11px",
                fontWeight: 700,
                color: "#9a9a9a",
                marginTop: "2px",
              }}
            >
              Seleccioná el plan que necesitás
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: "#f0f0f0",
              border: "none",
              borderRadius: "50%",
              width: "34px",
              height: "34px",
              fontSize: "16px",
              cursor: "pointer",
            }}
          >
            ✕
          </button>
        </div>

        {tieneDisponibles && onUsarBits && (
          <div
            style={{
              background: "linear-gradient(135deg,#1a2a3a,#243b55)",
              borderRadius: "16px",
              padding: "14px 16px",
              marginBottom: "16px",
              border: "2px solid #d4a017",
            }}
          >
            <div
              style={{
                fontSize: "12px",
                fontWeight: 800,
                color: "#d4a017",
                marginBottom: "10px",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              ✅ Tenés BIT disponibles para usar
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {nexo > 0 && (
                <BtnUsarBits
                  label="BIT NexoNet"
                  cantidad={nexo}
                  color="#d4a017"
                  desc="BIT adquiridos"
                  onClick={async () => {
                    await onUsarBits(nexo, "nexo");
                    onClose();
                  }}
                />
              )}

              {promo > 0 && (
                <BtnUsarBits
                  label="BIT NexoPromotor"
                  cantidad={promo}
                  color="#27ae60"
                  desc="BIT por referidos"
                  onClick={async () => {
                    await onUsarBits(promo, "promo");
                    onClose();
                  }}
                />
              )}

              {free > 0 && (
                <BtnUsarBits
                  label="BIT FREE"
                  cantidad={free}
                  color="#3a7bd5"
                  desc="BIT gratuitos"
                  onClick={async () => {
                    await onUsarBits(free, "free");
                    onClose();
                  }}
                />
              )}
            </div>

            <div
              style={{
                fontSize: "11px",
                fontWeight: 600,
                color: "#8a9aaa",
                marginTop: "10px",
                textAlign: "center",
              }}
            >
              O comprá más BIT abajo 👇
            </div>
          </div>
        )}

        {tipo === "general" && (
          <div
            style={{
              display: "flex",
              gap: "6px",
              marginBottom: "14px",
              overflowX: "auto",
              scrollbarWidth: "none",
            }}
          >
            {SECCIONES_GENERAL.map((s) => (
              <button
                key={s.key}
                onClick={() => setSeccion(s.key)}
                style={{
                  background: seccion === s.key ? s.color : "#f4f4f2",
                  border: `2px solid ${seccion === s.key ? s.color : "#e8e8e6"}`,
                  borderRadius: "20px",
                  padding: "6px 14px",
                  fontSize: "12px",
                  fontWeight: 800,
                  color: seccion === s.key ? "#fff" : "#1a2a3a",
                  cursor: "pointer",
                  fontFamily: "'Nunito',sans-serif",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                {s.titulo}
              </button>
            ))}
          </div>
        )}

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            marginBottom: "16px",
          }}
        >
          {productos.map((p) => (
            <button
              key={p.id}
              onClick={() => router.push(`/comprar?cat=${categoriaActual}`)}
              style={{
                background: "#f8f8f8",
                border: "2px solid #e8e8e6",
                borderRadius: "14px",
                padding: "14px 16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                cursor: "pointer",
                fontFamily: "'Nunito',sans-serif",
                textAlign: "left",
                width: "100%",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: "14px",
                    fontWeight: 900,
                    color: "#1a2a3a",
                    marginBottom: "2px",
                  }}
                >
                  {p.label}
                </div>
                <div
                  style={{
                    fontSize: "11px",
                    fontWeight: 600,
                    color: "#9a9a9a",
                  }}
                >
                  {p.desc}
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-end",
                  gap: "4px",
                }}
              >
                <div
                  style={{
                    fontSize: "16px",
                    fontWeight: 900,
                    color: "#d4a017",
                  }}
                >
                  {p.precio}
                </div>

                {p.badge && (
                  <span
                    style={{
                      background: "rgba(212,160,23,0.15)",
                      border: "1px solid rgba(212,160,23,0.4)",
                      borderRadius: "20px",
                      padding: "1px 8px",
                      fontSize: "10px",
                      fontWeight: 800,
                      color: "#a07810",
                    }}
                  >
                    {p.badge}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>

        <button
          onClick={() => {
            onClose();
            router.push("/comprar");
          }}
          style={{
            width: "100%",
            background: "linear-gradient(135deg,#f0c040,#d4a017)",
            border: "none",
            borderRadius: "12px",
            padding: "13px",
            fontSize: "14px",
            fontWeight: 900,
            color: "#1a2a3a",
            cursor: "pointer",
            fontFamily: "'Nunito',sans-serif",
            boxShadow: "0 3px 0 #a07810",
          }}
        >
          Ver todos los planes →
        </button>
      </div>
    </div>
  );
}

function BtnUsarBits({
  label,
  cantidad,
  color,
  desc,
  onClick,
}: {
  label: string;
  cantidad: number;
  color: string;
  desc: string;
  onClick: () => void | Promise<void>;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        background: `${color}18`,
        border: `2px solid ${color}50`,
        borderRadius: "12px",
        padding: "10px 14px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        cursor: "pointer",
        fontFamily: "'Nunito',sans-serif",
        width: "100%",
      }}
    >
      <div style={{ textAlign: "left" }}>
        <div style={{ fontSize: "13px", fontWeight: 900, color }}>{label}</div>
        <div style={{ fontSize: "11px", fontWeight: 600, color: "#9a9a9a" }}>{desc}</div>
      </div>

      <div style={{ textAlign: "right" }}>
        <div style={{ fontSize: "18px", fontWeight: 900, color }}>
          {cantidad.toLocaleString()}
        </div>
        <div style={{ fontSize: "10px", fontWeight: 800, color: "#9a9a9a" }}>
          disponibles
        </div>
      </div>
    </button>
  );
}