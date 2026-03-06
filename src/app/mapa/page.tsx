"use client";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { useState } from "react";
import dynamic from "next/dynamic";

const MapaLeaflet = dynamic(() => import("@/components/MapaLeaflet"), { ssr: false });

const anuncios = [
  { id: 1, titulo: "Toyota Corolla 2020", precio: "$18.500.000", rubro: "Vehículos", emoji: "🚗", lat: -31.2532, lng: -61.4875, lugar: "Rafaela, SF", flash: true },
  { id: 2, titulo: "Depto 2 amb. céntrico", precio: "$320.000/mes", rubro: "Inmuebles", emoji: "🏠", lat: -31.6333, lng: -60.7000, lugar: "Santa Fe", flash: false },
  { id: 3, titulo: "MacBook Air M2", precio: "$2.800.000", rubro: "Tecnología", emoji: "💻", lat: -32.9468, lng: -60.6393, lugar: "Rosario, SF", flash: true },
  { id: 4, titulo: "Plomero disponible", precio: "Consultar", rubro: "Servicios", emoji: "🔧", lat: -31.2800, lng: -61.5000, lugar: "Rafaela, SF", flash: false },
  { id: 5, titulo: "Casa 3 dormitorios", precio: "$85.000.000", rubro: "Inmuebles", emoji: "🏡", lat: -31.2400, lng: -61.4700, lugar: "Rafaela, SF", flash: false },
  { id: 6, titulo: "Honda CB 250 2022", precio: "$4.200.000", rubro: "Vehículos", emoji: "🏍️", lat: -31.7333, lng: -61.5000, lugar: "Sunchales, SF", flash: false },
  { id: 7, titulo: "iPhone 14 Pro", precio: "$1.200.000", rubro: "Tecnología", emoji: "📱", lat: -31.3000, lng: -61.5200, lugar: "Rafaela, SF", flash: true },
  { id: 8, titulo: "Electricista matriculado", precio: "$5.000/hr", emoji: "⚡", rubro: "Servicios", lat: -32.1000, lng: -61.3500, lugar: "Esperanza, SF", flash: false },
];

const rubros = ["Todos", "Vehículos", "Inmuebles", "Tecnología", "Servicios"];

export default function Mapa() {
  const [rubroActivo, setRubroActivo] = useState("Todos");
  const [anuncioSeleccionado, setAnuncioSeleccionado] = useState<typeof anuncios[0] | null>(null);

  const anunciosFiltrados = rubroActivo === "Todos"
    ? anuncios
    : anuncios.filter((a) => a.rubro === rubroActivo);

  return (
    <div style={{ fontFamily: "'Nunito', sans-serif" }}>
      <Header />

      {/* FILTROS — fijos debajo del header */}
      <div style={{
        position: "fixed",
        top: "90px", left: 0, right: 0,
        background: "linear-gradient(135deg, #1a2a3a 0%, #243b55 100%)",
        padding: "10px 16px",
        zIndex: 99,
      }}>
        <div style={{ display: "flex", gap: "8px", overflowX: "auto", scrollbarWidth: "none" }}>
          {rubros.map((r) => (
            <button key={r} onClick={() => setRubroActivo(r)} style={{
              background: rubroActivo === r ? "#d4a017" : "rgba(255,255,255,0.1)",
              border: `2px solid ${rubroActivo === r ? "#d4a017" : "rgba(255,255,255,0.2)"}`,
              borderRadius: "20px",
              padding: "6px 14px",
              fontSize: "12px",
              fontWeight: 700,
              color: rubroActivo === r ? "#1a2a3a" : "#fff",
              whiteSpace: "nowrap",
              cursor: "pointer",
              flexShrink: 0,
              fontFamily: "'Nunito', sans-serif",
            }}>{r}</button>
          ))}
        </div>
      </div>

      {/* MAPA — ocupa todo el espacio entre filtros y nav */}
      <div style={{
        position: "fixed",
        top: "140px",
        left: 0, right: 0,
        bottom: "130px",
      }}>
        <MapaLeaflet
          anuncios={anunciosFiltrados}
          onSeleccionar={setAnuncioSeleccionado}
        />

        {/* POPUP */}
        {anuncioSeleccionado && (
          <div style={{
            position: "absolute",
            bottom: "20px", left: "50%",
            transform: "translateX(-50%)",
            background: "#fff",
            borderRadius: "16px",
            padding: "14px 18px",
            boxShadow: "0 8px 30px rgba(0,0,0,0.2)",
            zIndex: 1000,
            minWidth: "260px",
            maxWidth: "90vw",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}>
            <div style={{ fontSize: "36px" }}>{anuncioSeleccionado.emoji}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "14px", fontWeight: 800, color: "#1a2a3a" }}>{anuncioSeleccionado.titulo}</div>
              <div style={{ fontSize: "16px", fontWeight: 900, color: "#d4a017" }}>{anuncioSeleccionado.precio}</div>
              <div style={{ fontSize: "11px", color: "#9a9a9a", fontWeight: 600 }}>📍 {anuncioSeleccionado.lugar}</div>
            </div>
            {anuncioSeleccionado.flash && (
              <div style={{ background: "#d4a017", color: "#1a2a3a", fontSize: "9px", fontWeight: 900, padding: "3px 7px", borderRadius: "8px", textTransform: "uppercase", alignSelf: "flex-start" }}>
                Flash
              </div>
            )}
            <button onClick={() => setAnuncioSeleccionado(null)} style={{ background: "none", border: "none", fontSize: "18px", cursor: "pointer", color: "#9a9a9a", alignSelf: "flex-start" }}>✕</button>
          </div>
        )}

        {/* CONTADOR */}
        <div style={{
          position: "absolute",
          bottom: 0, left: 0, right: 0,
          background: "#fff",
          padding: "8px 16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderTop: "1px solid #e8e8e6",
          zIndex: 999,
        }}>
          <span style={{ fontSize: "13px", fontWeight: 700, color: "#666" }}>
            📍 {anunciosFiltrados.length} anuncios en el mapa
          </span>
          <a href="/buscar" style={{ fontSize: "12px", fontWeight: 700, color: "#d4a017", textDecoration: "none" }}>
            Ver en lista →
          </a>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
