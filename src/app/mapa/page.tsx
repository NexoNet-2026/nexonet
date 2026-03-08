"use client";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { supabase } from "@/lib/supabase";

const MapaLeaflet = dynamic(() => import("@/components/MapaLeaflet"), { ssr: false });

type Anuncio = {
  id: number;
  titulo: string;
  precio: number;
  moneda: string;
  rubro: string;
  imagenes: string[];
  lat: number;
  lng: number;
  ciudad: string;
  provincia: string;
  flash: boolean;
};

const rubros = ["Todos", "Vehículos", "Inmuebles", "Tecnología", "Servicios", "Ropa", "Hogar"];

export default function Mapa() {
  const [rubroActivo, setRubroActivo] = useState("Todos");
  const [anuncios, setAnuncios] = useState<Anuncio[]>([]);
  const [anuncioSeleccionado, setAnuncioSeleccionado] = useState<Anuncio | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargar = async () => {
      const { data } = await supabase
        .from("anuncios")
        .select("id, titulo, precio, moneda, imagenes, flash, ciudad, provincia, lat, lng, subrubros(nombre, rubros(nombre))")
        .eq("estado", "activo")
        .not("lat", "is", null)
        .not("lng", "is", null);

      if (data) {
        setAnuncios(data.map((a: any) => ({
          id: a.id,
          titulo: a.titulo,
          precio: a.precio,
          moneda: a.moneda,
          imagenes: a.imagenes || [],
          flash: a.flash || false,
          ciudad: a.ciudad || "",
          provincia: a.provincia || "",
          lat: a.lat,
          lng: a.lng,
          rubro: a.subrubros?.rubros?.nombre || "Otros",
        })));
      }
      setLoading(false);
    };
    cargar();
  }, []);

  const formatPrecio = (precio: number, moneda: string) => {
    if (!precio) return "Consultar";
    return `${moneda === "USD" ? "U$D" : "$"} ${precio.toLocaleString("es-AR")}`;
  };

  const anunciosFiltrados = rubroActivo === "Todos"
    ? anuncios
    : anuncios.filter((a) => a.rubro === rubroActivo);

  return (
    <div style={{ fontFamily: "'Nunito', sans-serif" }}>
      <Header />

      {/* FILTROS */}
      <div style={{ position: "fixed", top: "100px", left: 0, right: 0, background: "linear-gradient(135deg, #1a2a3a 0%, #243b55 100%)", padding: "10px 16px", zIndex: 99 }}>
        <div style={{ display: "flex", gap: "8px", overflowX: "auto", scrollbarWidth: "none" }}>
          {rubros.map((r) => (
            <button key={r} onClick={() => setRubroActivo(r)} style={{
              background: rubroActivo === r ? "#d4a017" : "rgba(255,255,255,0.1)",
              border: `2px solid ${rubroActivo === r ? "#d4a017" : "rgba(255,255,255,0.2)"}`,
              borderRadius: "20px", padding: "6px 14px", fontSize: "12px", fontWeight: 700,
              color: rubroActivo === r ? "#1a2a3a" : "#fff", whiteSpace: "nowrap",
              cursor: "pointer", flexShrink: 0, fontFamily: "'Nunito', sans-serif",
            }}>{r}</button>
          ))}
        </div>
      </div>

      {/* MAPA */}
      <div style={{ position: "fixed", top: "150px", left: 0, right: 0, bottom: "130px" }}>
        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", background: "#f4f4f2", fontSize: "14px", fontWeight: 700, color: "#9a9a9a" }}>
            Cargando anuncios...
          </div>
        ) : (
          <MapaLeaflet anuncios={anunciosFiltrados} onSeleccionar={setAnuncioSeleccionado} />
        )}

        {/* POPUP */}
        {anuncioSeleccionado && (
          <div style={{
            position: "absolute", bottom: "56px", left: "50%", transform: "translateX(-50%)",
            background: "#fff", borderRadius: "16px", padding: "14px 18px",
            boxShadow: "0 8px 30px rgba(0,0,0,0.2)", zIndex: 1000,
            minWidth: "260px", maxWidth: "90vw", display: "flex", alignItems: "center", gap: "12px",
          }}>
            {/* IMAGEN O EMOJI */}
            <div style={{ width: "52px", height: "52px", borderRadius: "10px", overflow: "hidden", flexShrink: 0, background: "#f4f4f2", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {anuncioSeleccionado.imagenes?.[0]
                ? <img src={anuncioSeleccionado.imagenes[0]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <span style={{ fontSize: "28px" }}>📦</span>
              }
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "14px", fontWeight: 800, color: "#1a2a3a" }}>{anuncioSeleccionado.titulo}</div>
              <div style={{ fontSize: "16px", fontWeight: 900, color: "#d4a017" }}>{formatPrecio(anuncioSeleccionado.precio, anuncioSeleccionado.moneda)}</div>
              <div style={{ fontSize: "11px", color: "#9a9a9a", fontWeight: 600 }}>📍 {anuncioSeleccionado.ciudad}{anuncioSeleccionado.provincia ? `, ${anuncioSeleccionado.provincia}` : ""}</div>
            </div>
            {anuncioSeleccionado.flash && (
              <div style={{ background: "#d4a017", color: "#1a2a3a", fontSize: "9px", fontWeight: 900, padding: "3px 7px", borderRadius: "8px", textTransform: "uppercase", alignSelf: "flex-start" }}>⚡Flash</div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: "4px", alignSelf: "flex-start" }}>
              <button onClick={() => setAnuncioSeleccionado(null)} style={{ background: "none", border: "none", fontSize: "16px", cursor: "pointer", color: "#9a9a9a" }}>✕</button>
              <a href={`/anuncios/${anuncioSeleccionado.id}`} style={{ background: "#d4a017", color: "#1a2a3a", border: "none", borderRadius: "8px", padding: "4px 8px", fontSize: "11px", fontWeight: 800, textDecoration: "none", textAlign: "center" }}>Ver →</a>
            </div>
          </div>
        )}

        {/* CONTADOR */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "#fff", padding: "8px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #e8e8e6", zIndex: 999 }}>
          <span style={{ fontSize: "13px", fontWeight: 700, color: "#666" }}>
            📍 {anunciosFiltrados.length} anuncio{anunciosFiltrados.length !== 1 ? "s" : ""} en el mapa
          </span>
          <a href="/buscar" style={{ fontSize: "12px", fontWeight: 700, color: "#d4a017", textDecoration: "none" }}>Ver en lista →</a>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
