"use client";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { useState } from "react";

type Nivel = "pais" | "provincia" | "ciudad" | "selecto";

const niveles: { id: Nivel; label: string; emoji: string }[] = [
  { id: "pais",      label: "País",      emoji: "🌎" },
  { id: "provincia", label: "Provincia", emoji: "🗺️" },
  { id: "ciudad",    label: "Ciudad",    emoji: "🏙️" },
  { id: "selecto",   label: "Selecto",   emoji: "⭐" },
];

const gruposData: Record<Nivel, { nombre: string; emoji: string; miembros: number; descripcion: string; unido: boolean }[]> = {
  pais: [
    { nombre: "NexoNet Argentina", emoji: "🇦🇷", miembros: 12400, descripcion: "Comunidad nacional de clasificados", unido: false },
    { nombre: "Deportivos Argentina", emoji: "⚽", miembros: 8900, descripcion: "Artículos y eventos deportivos", unido: false },
    { nombre: "Fierreros Argentina", emoji: "🔧", miembros: 5600, descripcion: "Mecánica, autos y motos", unido: true },
    { nombre: "Comerciales AR", emoji: "🏪", miembros: 7200, descripcion: "Negocios y emprendimientos", unido: false },
  ],
  provincia: [
    { nombre: "NexoNet Santa Fe", emoji: "🌾", miembros: 3200, descripcion: "Clasificados provincia de Santa Fe", unido: true },
    { nombre: "Agro Santa Fe", emoji: "🚜", miembros: 1800, descripcion: "Maquinaria y productos agrícolas", unido: false },
    { nombre: "Inmuebles Santa Fe", emoji: "🏠", miembros: 2100, descripcion: "Propiedades en la provincia", unido: false },
    { nombre: "Autos Santa Fe", emoji: "🚗", miembros: 1500, descripcion: "Compra venta de vehículos", unido: true },
  ],
  ciudad: [
    { nombre: "NexoNet Rafaela", emoji: "🏘️", miembros: 890, descripcion: "Clasificados de Rafaela", unido: true },
    { nombre: "Servicios Rafaela", emoji: "🔨", miembros: 420, descripcion: "Plomeros, electricistas y más", unido: false },
    { nombre: "Gastronomía Rafaela", emoji: "🍕", miembros: 630, descripcion: "Restaurantes y delivery local", unido: true },
    { nombre: "Empleos Rafaela", emoji: "💼", miembros: 540, descripcion: "Ofertas laborales locales", unido: false },
  ],
  selecto: [
    { nombre: "Nexo Promotores", emoji: "⭐", miembros: 340, descripcion: "Comunidad exclusiva de promotores", unido: false },
    { nombre: "Premium Clasificados", emoji: "💎", miembros: 210, descripcion: "Anuncios destacados y flash", unido: false },
    { nombre: "Empresas NexoNet", emoji: "🏢", miembros: 180, descripcion: "Directorio de empresas verificadas", unido: true },
    { nombre: "Nexo Business", emoji: "📈", miembros: 290, descripcion: "Networking y negocios B2B", unido: false },
  ],
};

export default function Grupos() {
  const [nivelActivo, setNivelActivo] = useState<Nivel>("ciudad");
  const [busqueda, setBusqueda] = useState("");
  const [grupos, setGrupos] = useState(gruposData);

  const toggleUnirse = (nivel: Nivel, idx: number) => {
    const nuevo = { ...grupos };
    nuevo[nivel] = [...nuevo[nivel]];
    nuevo[nivel][idx] = { ...nuevo[nivel][idx], unido: !nuevo[nivel][idx].unido };
    setGrupos(nuevo);
  };

  const gruposFiltrados = grupos[nivelActivo].filter((g) =>
    g.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    g.descripcion.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <main style={{ paddingTop: "90px", paddingBottom: "130px", background: "#f4f4f2", minHeight: "100vh", fontFamily: "'Nunito', sans-serif" }}>
      <Header />

      {/* HERO */}
      <div style={{ background: "linear-gradient(135deg, #1a2a3a 0%, #243b55 100%)", padding: "16px 16px 0" }}>
        <div style={{ fontSize: "13px", fontWeight: 700, color: "#d4a017", letterSpacing: "2px", textTransform: "uppercase", marginBottom: "4px" }}>
          👥 Grupos NexoNet
        </div>
        <div style={{ fontSize: "12px", color: "#7a8fa0", fontWeight: 600, marginBottom: "14px" }}>
          Unite a tu comunidad
        </div>

        {/* BUSCADOR */}
        <div style={{ display: "flex", background: "#fff", borderRadius: "12px", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.2)", marginBottom: "14px" }}>
          <div style={{ padding: "0 14px", display: "flex", alignItems: "center", fontSize: "16px", background: "#f8f8f6" }}>🔍</div>
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar grupos..."
            style={{ flex: 1, border: "none", padding: "12px 10px", fontFamily: "'Nunito', sans-serif", fontSize: "14px", color: "#2c2c2e", outline: "none" }}
          />
        </div>

        {/* NIVELES */}
        <div style={{ display: "flex", gap: "0" }}>
          {niveles.map((n) => (
            <button key={n.id} onClick={() => setNivelActivo(n.id)} style={{
              flex: 1,
              background: "none",
              border: "none",
              borderBottom: nivelActivo === n.id ? "3px solid #d4a017" : "3px solid transparent",
              padding: "10px 4px",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "2px",
              transition: "all .2s",
            }}>
              <span style={{ fontSize: "18px" }}>{n.emoji}</span>
              <span style={{ fontSize: "10px", fontWeight: 800, color: nivelActivo === n.id ? "#d4a017" : "#8a9aaa", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                {n.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* LISTA DE GRUPOS */}
      <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "12px", maxWidth: "480px", margin: "0 auto" }}>

        {/* CREAR GRUPO */}
        <button style={{
          background: "linear-gradient(135deg, #1a2a3a, #243b55)",
          border: "2px dashed rgba(212,160,23,0.5)",
          borderRadius: "16px",
          padding: "14px 20px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          cursor: "pointer",
          width: "100%",
        }}>
          <div style={{ width: "44px", height: "44px", borderRadius: "50%", background: "rgba(212,160,23,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", flexShrink: 0 }}>
            ➕
          </div>
          <div style={{ textAlign: "left" }}>
            <div style={{ fontSize: "14px", fontWeight: 800, color: "#fff" }}>
              Crear grupo de {niveles.find(n => n.id === nivelActivo)?.label}
            </div>
            <div style={{ fontSize: "11px", color: "#8a9aaa", fontWeight: 600 }}>
              Organizá tu comunidad local
            </div>
          </div>
        </button>

        {/* GRUPOS */}
        {gruposFiltrados.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 20px", color: "#9a9a9a", fontWeight: 700 }}>
            No se encontraron grupos
          </div>
        ) : (
          gruposFiltrados.map((g, i) => (
            <div key={i} style={{
              background: "#fff",
              borderRadius: "16px",
              padding: "16px",
              boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
              display: "flex",
              alignItems: "center",
              gap: "14px",
              border: g.unido ? "2px solid rgba(212,160,23,0.3)" : "2px solid transparent",
            }}>
              {/* AVATAR */}
              <div style={{
                width: "52px", height: "52px", borderRadius: "14px",
                background: g.unido ? "linear-gradient(135deg, #1a2a3a, #243b55)" : "#f4f4f2",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "26px", flexShrink: 0,
                boxShadow: g.unido ? "0 4px 12px rgba(26,42,58,0.3)" : "none",
              }}>
                {g.emoji}
              </div>

              {/* INFO */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "14px", fontWeight: 800, color: "#1a2a3a", marginBottom: "2px" }}>{g.nombre}</div>
                <div style={{ fontSize: "11px", color: "#9a9a9a", fontWeight: 600, marginBottom: "4px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{g.descripcion}</div>
                <div style={{ fontSize: "11px", color: "#d4a017", fontWeight: 700 }}>👥 {g.miembros.toLocaleString()} miembros</div>
              </div>

              {/* BOTÓN */}
              <button
                onClick={() => toggleUnirse(nivelActivo, grupos[nivelActivo].indexOf(g))}
                style={{
                  background: g.unido ? "#f4f4f2" : "linear-gradient(135deg, #d4a017, #f0c040)",
                  color: g.unido ? "#9a9a9a" : "#1a2a3a",
                  border: g.unido ? "2px solid #e8e8e6" : "none",
                  borderRadius: "10px",
                  padding: "8px 14px",
                  fontSize: "12px",
                  fontWeight: 800,
                  fontFamily: "'Nunito', sans-serif",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                {g.unido ? "✓ Unido" : "Unirse"}
              </button>
            </div>
          ))
        )}

        {/* BANNER PROMOTOR */}
        <div style={{
          background: "linear-gradient(90deg, #b8860b, #d4a017, #f0c040)",
          borderRadius: "14px", padding: "14px 20px",
          display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
          cursor: "pointer",
        }}>
          <span style={{ fontWeight: 800, fontSize: "13px", color: "#1a2a3a" }}>⭐ Nexo Promotor —</span>
          <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "20px", color: "#1a2a3a" }}>30%</span>
          <span style={{ fontWeight: 800, fontSize: "13px", color: "#1a2a3a" }}>de ganancia →</span>
        </div>

      </div>

      <BottomNav />
    </main>
  );
}
