"use client";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { useState } from "react";

const rubros = [
  {
    nombre: "🚗 Vehículos",
    subrubros: ["Autos", "Motos", "Camionetas", "Camiones", "Náutica", "Maquinaria", "Repuestos"],
    items: [
      { emoji: "🚗", titulo: "Toyota Corolla 2020", precio: "$18.500.000", lugar: "Rafaela, SF", flash: true },
      { emoji: "🏍️", titulo: "Honda CB 250 2022", precio: "$4.200.000", lugar: "Santa Fe", flash: false },
      { emoji: "🚙", titulo: "Ford Ranger XLT", precio: "$32.000.000", lugar: "Rosario", flash: true },
      { emoji: "🚐", titulo: "VW Amarok 2021", precio: "$28.500.000", lugar: "Córdoba", flash: false },
    ],
  },
  {
    nombre: "🏠 Inmuebles",
    subrubros: ["Casas", "Departamentos", "Terrenos", "Locales", "Oficinas", "Galpones", "Quintas"],
    items: [
      { emoji: "🏠", titulo: "Casa 3 dormitorios", precio: "$85.000.000", lugar: "Rafaela, SF", flash: false },
      { emoji: "🏢", titulo: "Depto 2 amb. céntrico", precio: "$320.000/mes", lugar: "Santa Fe", flash: true },
      { emoji: "🏗️", titulo: "Terreno 400m²", precio: "$12.000.000", lugar: "Susana, SF", flash: false },
      { emoji: "🏪", titulo: "Local comercial", precio: "$180.000/mes", lugar: "Rafaela", flash: false },
    ],
  },
  {
    nombre: "💻 Tecnología",
    subrubros: ["Celulares", "Computadoras", "Tablets", "Audio", "TV", "Consolas", "Accesorios"],
    items: [
      { emoji: "💻", titulo: "MacBook Air M2", precio: "$2.800.000", lugar: "Rosario, SF", flash: true },
      { emoji: "📱", titulo: "iPhone 14 Pro 128GB", precio: "$1.200.000", lugar: "Tucumán", flash: false },
      { emoji: "🎮", titulo: "PlayStation 5", precio: "$850.000", lugar: "Buenos Aires", flash: true },
      { emoji: "🖥️", titulo: "Monitor LG 27\" 4K", precio: "$420.000", lugar: "Córdoba", flash: false },
    ],
  },
  {
    nombre: "🔧 Servicios",
    subrubros: ["Plomería", "Electricidad", "Pintura", "Albañilería", "Jardinería", "Limpieza", "Fletes"],
    items: [
      { emoji: "🔧", titulo: "Plomero disponible", precio: "Consultar", lugar: "Rafaela, SF", flash: false },
      { emoji: "⚡", titulo: "Electricista matriculado", precio: "$5.000/hr", lugar: "Santa Fe", flash: false },
      { emoji: "🎨", titulo: "Pintor de interiores", precio: "Consultar", lugar: "Rosario", flash: false },
      { emoji: "🌿", titulo: "Jardinero profesional", precio: "$8.000/visita", lugar: "Rafaela", flash: false },
    ],
  },
  {
    nombre: "👕 Ropa y Moda",
    subrubros: ["Hombre", "Mujer", "Niños", "Calzado", "Accesorios", "Deportiva", "Segunda mano"],
    items: [
      { emoji: "👕", titulo: "Ropa nueva importada", precio: "$45.000", lugar: "Buenos Aires", flash: false },
      { emoji: "👗", titulo: "Vestidos de fiesta", precio: "$60.000", lugar: "Rosario", flash: true },
      { emoji: "👟", titulo: "Nike Air Max 2024", precio: "$95.000", lugar: "Córdoba", flash: false },
      { emoji: "👜", titulo: "Cartera de cuero", precio: "$38.000", lugar: "Mendoza", flash: false },
    ],
  },
  {
    nombre: "🛋️ Hogar",
    subrubros: ["Muebles", "Electrodomésticos", "Deco", "Jardín", "Herramientas", "Iluminación", "Colchones"],
    items: [
      { emoji: "🛋️", titulo: "Sofá 3 cuerpos", precio: "$180.000", lugar: "Mendoza", flash: false },
      { emoji: "❄️", titulo: "Heladera Bambi 380L", precio: "$350.000", lugar: "Rafaela, SF", flash: true },
      { emoji: "🛏️", titulo: "Sommier 2 plazas", precio: "$220.000", lugar: "Santa Fe", flash: false },
      { emoji: "🔨", titulo: "Set herramientas Bosch", precio: "$85.000", lugar: "Córdoba", flash: false },
    ],
  },
];

export default function Buscar() {
  const [ubicacion, setUbicacion] = useState("Rafaela, Santa Fe");
  const [busqueda, setBusqueda] = useState("");
  const [subrubrosActivos, setSubrubrosActivos] = useState<Record<string, string>>({});

  const toggleSubrubro = (rubro: string, sub: string) => {
    setSubrubrosActivos((prev) => ({
      ...prev,
      [rubro]: prev[rubro] === sub ? "" : sub,
    }));
  };

  return (
    <main style={{ paddingTop: "90px", paddingBottom: "130px", background: "#f4f4f2", minHeight: "100vh", fontFamily: "'Nunito', sans-serif" }}>
      <Header />

      {/* BUSCADORES */}
      <div style={{ background: "linear-gradient(135deg, #1a2a3a 0%, #243b55 100%)", padding: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>

        {/* UBICACIÓN */}
        <div style={{ display: "flex", background: "#fff", borderRadius: "12px", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.2)" }}>
          <div style={{ padding: "0 14px", display: "flex", alignItems: "center", fontSize: "18px", background: "#f8f8f6" }}>📍</div>
          <input
            type="text"
            value={ubicacion}
            onChange={(e) => setUbicacion(e.target.value)}
            placeholder="Tu ubicación..."
            style={{ flex: 1, border: "none", padding: "12px 10px", fontFamily: "'Nunito', sans-serif", fontSize: "14px", fontWeight: 600, color: "#2c2c2e", outline: "none", background: "transparent" }}
          />
          <button style={{ background: "#d4a017", border: "none", padding: "0 14px", cursor: "pointer", fontSize: "11px", fontWeight: 800, color: "#1a2a3a", letterSpacing: "0.5px" }}>
            CAMBIAR
          </button>
        </div>

        {/* BÚSQUEDA */}
        <div style={{ display: "flex", background: "#fff", borderRadius: "12px", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.2)" }}>
          <div style={{ padding: "0 14px", display: "flex", alignItems: "center", fontSize: "18px", background: "#f8f8f6" }}>🔍</div>
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder={`¿Qué buscás en ${ubicacion.split(",")[0]}?`}
            style={{ flex: 1, border: "none", padding: "12px 10px", fontFamily: "'Nunito', sans-serif", fontSize: "14px", color: "#2c2c2e", outline: "none" }}
          />
          <button style={{ background: "#d4a017", border: "none", padding: "0 18px", cursor: "pointer", fontSize: "14px", fontWeight: 800, color: "#1a2a3a" }}>
            Buscar
          </button>
        </div>
      </div>

      {/* RUBROS CON SLIDERS */}
      {rubros.map((rubro) => (
        <div key={rubro.nombre} style={{ marginBottom: "8px", background: "#fff", paddingBottom: "12px", borderBottom: "6px solid #f4f4f2" }}>

          {/* HEADER RUBRO */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px 8px" }}>
            <span style={{ fontSize: "16px", fontWeight: 900, color: "#1a2a3a" }}>{rubro.nombre}</span>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#d4a017", cursor: "pointer" }}>Ver todos →</span>
          </div>

          {/* SLIDER SUBRUBROS */}
          <div style={{ display: "flex", gap: "8px", padding: "0 16px 12px", overflowX: "auto", scrollbarWidth: "none" }}>
            {rubro.subrubros.map((sub) => (
              <button
                key={sub}
                onClick={() => toggleSubrubro(rubro.nombre, sub)}
                style={{
                  background: subrubrosActivos[rubro.nombre] === sub ? "#1a2a3a" : "#f4f4f2",
                  border: `2px solid ${subrubrosActivos[rubro.nombre] === sub ? "#1a2a3a" : "#e8e8e6"}`,
                  borderRadius: "20px",
                  padding: "5px 14px",
                  fontSize: "12px",
                  fontWeight: 700,
                  color: subrubrosActivos[rubro.nombre] === sub ? "#d4a017" : "#2c2c2e",
                  whiteSpace: "nowrap",
                  cursor: "pointer",
                  flexShrink: 0,
                  fontFamily: "'Nunito', sans-serif",
                }}
              >{sub}</button>
            ))}
          </div>

          {/* SLIDER TARJETAS */}
          <div style={{ display: "flex", gap: "12px", padding: "0 16px", overflowX: "auto", scrollbarWidth: "none" }}>
            {rubro.items.map((item, i) => (
              <div key={i} style={{
                background: "#fff",
                borderRadius: "14px",
                overflow: "hidden",
                boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
                flexShrink: 0,
                width: "160px",
                cursor: "pointer",
                border: "1px solid #f0f0f0",
              }}>
                <div style={{ width: "100%", height: "110px", background: "#f4f4f2", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "44px", position: "relative" }}>
                  {item.emoji}
                  {item.flash && (
                    <span style={{ position: "absolute", top: "6px", right: "6px", background: "#d4a017", color: "#1a2a3a", fontSize: "9px", fontWeight: 900, padding: "2px 6px", borderRadius: "6px", textTransform: "uppercase" }}>
                      Flash
                    </span>
                  )}
                </div>
                <div style={{ padding: "8px 10px 10px" }}>
                  <div style={{ fontSize: "12px", fontWeight: 800, color: "#2c2c2e", marginBottom: "3px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.titulo}</div>
                  <div style={{ fontSize: "14px", fontWeight: 900, color: "#d4a017" }}>{item.precio}</div>
                  <div style={{ fontSize: "11px", color: "#9a9a9a", fontWeight: 600, marginTop: "2px" }}>📍 {item.lugar}</div>
                </div>
              </div>
            ))}
          </div>

        </div>
      ))}

      <BottomNav />
    </main>
  );
}
