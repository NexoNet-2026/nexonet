"use client";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

type Subrubro = { id: number; nombre: string };
type Rubro = { id: number; nombre: string; subrubros: Subrubro[] };
type Anuncio = {
  id: number;
  titulo: string;
  precio: number;
  moneda: string;
  ciudad: string;
  provincia: string;
  imagenes: string[];
  flash: boolean;
  fuente: string;
  subrubro_id: number;
};

const FUENTES: Record<string, { color: string; texto: string }> = {
  nexonet:       { color: "#d4a017", texto: "#1a2a3a" },
  mercadolibre:  { color: "#ffe600", texto: "#333" },
  rosariogarage: { color: "#ff6b00", texto: "#fff" },
  olx:           { color: "#00a884", texto: "#fff" },
  otro:          { color: "#888",    texto: "#fff" },
};

export default function Buscar() {
  const [ubicacion, setUbicacion] = useState("Rafaela, Santa Fe");
  const [busqueda, setBusqueda] = useState("");
  const [rubros, setRubros] = useState<Rubro[]>([]);
  const [anuncios, setAnuncios] = useState<Anuncio[]>([]);
  const [subrubrosActivos, setSubrubrosActivos] = useState<Record<number, number | null>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargar = async () => {
      // Cargar rubros y subrubros
      const { data: rubrosData } = await supabase
        .from("rubros")
        .select("id, nombre, subrubros(id, nombre)")
        .order("nombre");

      if (rubrosData) setRubros(rubrosData as any);

      // Cargar anuncios
      const { data: anunciosData } = await supabase
        .from("anuncios")
        .select("id, titulo, precio, moneda, ciudad, provincia, imagenes, flash, fuente, subrubro_id")
        .eq("estado", "activo")
        .order("created_at", { ascending: false })
        .limit(60);

      if (anunciosData) setAnuncios(anunciosData as any);
      setLoading(false);
    };
    cargar();
  }, []);

  const toggleSubrubro = (rubroId: number, subId: number) => {
    setSubrubrosActivos((prev) => ({
      ...prev,
      [rubroId]: prev[rubroId] === subId ? null : subId,
    }));
  };

  const formatPrecio = (precio: number, moneda: string) => {
    if (!precio) return "Consultar";
    return `${moneda === "USD" ? "U$D" : "$"} ${precio.toLocaleString("es-AR")}`;
  };

  const getAnunciosPorRubro = (rubro: Rubro) => {
    const subIds = rubro.subrubros.map((s) => s.id);
    const subActivo = subrubrosActivos[rubro.id];
    return anuncios.filter((a) =>
      subActivo ? a.subrubro_id === subActivo : subIds.includes(a.subrubro_id)
    ).slice(0, 8);
  };

  return (
    <main style={{ paddingTop: "95px", paddingBottom: "130px", background: "#f4f4f2", minHeight: "100vh", fontFamily: "'Nunito', sans-serif" }}>
      <Header />

      {/* BUSCADORES */}
      <div style={{ background: "linear-gradient(135deg, #1a2a3a 0%, #243b55 100%)", padding: "12px 16px", display: "flex", flexDirection: "column", gap: "10px" }}>
        <div style={{ display: "flex", background: "#fff", borderRadius: "12px", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.2)" }}>
          <div style={{ padding: "0 14px", display: "flex", alignItems: "center", fontSize: "18px", background: "#f8f8f6" }}>📍</div>
          <input type="text" value={ubicacion} onChange={(e) => setUbicacion(e.target.value)} placeholder="Tu ubicación..."
            style={{ flex: 1, border: "none", padding: "10px", fontFamily: "'Nunito', sans-serif", fontSize: "14px", fontWeight: 600, color: "#2c2c2e", outline: "none", background: "transparent" }} />
          <button style={{ background: "#d4a017", border: "none", padding: "0 14px", cursor: "pointer", fontSize: "11px", fontWeight: 800, color: "#1a2a3a", letterSpacing: "0.5px" }}>CAMBIAR</button>
        </div>
        <div style={{ display: "flex", background: "#fff", borderRadius: "12px", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.2)" }}>
          <div style={{ padding: "0 14px", display: "flex", alignItems: "center", fontSize: "18px", background: "#f8f8f6" }}>🔍</div>
          <input type="text" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder={`¿Qué buscás en ${ubicacion.split(",")[0]}?`}
            style={{ flex: 1, border: "none", padding: "10px", fontFamily: "'Nunito', sans-serif", fontSize: "14px", color: "#2c2c2e", outline: "none" }} />
          <button style={{ background: "#d4a017", border: "none", padding: "0 18px", cursor: "pointer", fontSize: "14px", fontWeight: 800, color: "#1a2a3a" }}>Buscar</button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#9a9a9a", fontWeight: 700 }}>Cargando...</div>
      ) : (
        rubros.map((rubro) => {
          const items = getAnunciosPorRubro(rubro);
          return (
            <div key={rubro.id} style={{ marginBottom: "8px", background: "#fff", paddingBottom: "12px", borderBottom: "6px solid #f4f4f2" }}>

              {/* HEADER RUBRO */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px 8px" }}>
                <span style={{ fontSize: "16px", fontWeight: 900, color: "#1a2a3a" }}>{rubro.nombre}</span>
                <span style={{ fontSize: "12px", fontWeight: 700, color: "#d4a017", cursor: "pointer" }}>Ver todos →</span>
              </div>

              {/* SUBRUBROS */}
              <div style={{ display: "flex", gap: "8px", padding: "0 16px 12px", overflowX: "auto", scrollbarWidth: "none" }}>
                {rubro.subrubros.map((sub) => (
                  <button key={sub.id} onClick={() => toggleSubrubro(rubro.id, sub.id)} style={{
                    background: subrubrosActivos[rubro.id] === sub.id ? "#1a2a3a" : "#f4f4f2",
                    border: `2px solid ${subrubrosActivos[rubro.id] === sub.id ? "#1a2a3a" : "#e8e8e6"}`,
                    borderRadius: "20px", padding: "5px 14px", fontSize: "12px", fontWeight: 700,
                    color: subrubrosActivos[rubro.id] === sub.id ? "#d4a017" : "#2c2c2e",
                    whiteSpace: "nowrap", cursor: "pointer", flexShrink: 0, fontFamily: "'Nunito', sans-serif",
                  }}>{sub.nombre}</button>
                ))}
              </div>

              {/* TARJETAS */}
              {items.length === 0 ? (
                <div style={{ padding: "12px 16px", color: "#9a9a9a", fontSize: "13px", fontWeight: 600 }}>Sin anuncios en esta categoría aún</div>
              ) : (
                <div style={{ display: "flex", gap: "12px", padding: "0 16px", overflowX: "auto", scrollbarWidth: "none" }}>
                  {items.map((a) => {
                    const imagen = a.imagenes?.[0];
                    const fuente = FUENTES[a.fuente] || FUENTES.nexonet;
                    return (
                      <a key={a.id} href={`/anuncios/${a.id}`} style={{ textDecoration: "none", flexShrink: 0, width: "160px" }}>
                        <div style={{ background: "#fff", borderRadius: "14px", overflow: "hidden", boxShadow: "0 2px 10px rgba(0,0,0,0.08)", border: "1px solid #f0f0f0" }}>
                          {/* FRANJA FUENTE */}
                          <div style={{ background: fuente.color, padding: "3px 8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontSize: "9px", fontWeight: 900, color: fuente.texto, textTransform: "uppercase" }}>
                              {a.fuente || "nexonet"}
                            </span>
                            {a.flash && <span style={{ background: "#1a2a3a", color: "#d4a017", fontSize: "8px", fontWeight: 900, padding: "1px 5px", borderRadius: "5px" }}>⚡Flash</span>}
                          </div>
                          {/* IMAGEN */}
                          <div style={{ width: "100%", height: "110px", background: "#f4f4f2", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                            {imagen
                              ? <img src={imagen} alt={a.titulo} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                              : <span style={{ fontSize: "40px" }}>📦</span>
                            }
                          </div>
                          {/* INFO */}
                          <div style={{ padding: "8px 10px 10px" }}>
                            <div style={{ fontSize: "12px", fontWeight: 800, color: "#2c2c2e", marginBottom: "3px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.titulo}</div>
                            <div style={{ fontSize: "14px", fontWeight: 900, color: "#d4a017" }}>{formatPrecio(a.precio, a.moneda)}</div>
                            <div style={{ fontSize: "11px", color: "#9a9a9a", fontWeight: 600, marginTop: "2px" }}>📍 {a.ciudad}</div>
                          </div>
                        </div>
                      </a>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })
      )}

      <BottomNav />
    </main>
  );
}
