"use client";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

const rubros = ["Todos", "Autos", "Inmuebles", "Tecnología", "Servicios", "Ropa", "Hogar"];

type Anuncio = {
  id: number;
  titulo: string;
  precio: number;
  moneda: string;
  ciudad: string;
  provincia: string;
  imagenes: string[];
  flash: boolean;
  subrubro: string;
  rubro: string;
};

export default function Home() {
  const [rubroActivo, setRubroActivo] = useState("Todos");
  const [destacados, setDestacados] = useState<Anuncio[]>([]);
  const [recientes, setRecientes] = useState<Anuncio[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargar = async () => {
      const { data } = await supabase
  .from("anuncios")
  .select(`id, titulo, precio, moneda, ciudad, provincia, imagenes, flash, estado,
    subrubro_id, subrubros!inner(nombre, rubros!inner(nombre))`)
  .eq("estado", "activo")
  .order("created_at", { ascending: false })
  .limit(20);

      if (data) {
        const mapped = data.map((a: any) => ({
          id: a.id,
          titulo: a.titulo,
          precio: a.precio,
          moneda: a.moneda,
          ciudad: a.ciudad,
          provincia: a.provincia,
          imagenes: a.imagenes || [],
          flash: a.flash || false,
          subrubro: a.subrubros?.nombre || "",
          rubro: a.subrubros?.rubros?.nombre || "",
        }));
        setDestacados(mapped.filter((a) => a.flash).slice(0, 6));
        setRecientes(mapped.slice(0, 8));
      }
      setLoading(false);
    };
    cargar();
  }, []);

  const formatPrecio = (precio: number, moneda: string) => {
    if (!precio) return "Consultar";
    return `${moneda === "USD" ? "U$D" : "$"} ${precio.toLocaleString("es-AR")}`;
  };

  return (
    <main style={{ paddingTop: "95px", paddingBottom: "130px", background: "#f4f4f2", minHeight: "100vh", fontFamily: "'Nunito', sans-serif" }}>
      <Header />

      {/* HERO */}
      <div style={{ background: "linear-gradient(135deg, #1a2a3a 0%, #243b55 100%)", padding: "28px 16px 32px", textAlign: "center" }}>
        <div style={{ fontSize: "13px", fontWeight: 700, color: "#d4a017", letterSpacing: "2px", textTransform: "uppercase", marginBottom: "4px" }}>
          Conectando Oportunidades
        </div>
        <div style={{ fontSize: "12px", color: "#7a8fa0", marginBottom: "20px", fontWeight: 600 }}>
          Conectando a la Comunidad
        </div>
        <div style={{ display: "flex", background: "#fff", borderRadius: "12px", overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.25)", maxWidth: "500px", margin: "0 auto" }}>
          <input type="text" placeholder="¿Qué estás buscando?" style={{ flex: 1, border: "none", padding: "14px 16px", fontFamily: "'Nunito', sans-serif", fontSize: "14px", color: "#2c2c2e", outline: "none" }} />
          <button style={{ background: "#d4a017", border: "none", padding: "0 18px", cursor: "pointer", fontSize: "18px" }}>🔍</button>
        </div>
      </div>

      {/* ACCIONES RÁPIDAS */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: "10px", padding: "16px", alignItems: "center" }}>
        <a href="/buscar" style={accionStyle}>
          <div style={{ fontSize: "24px", marginBottom: "6px" }}>📋</div>
          <div style={accionLabelStyle}>Ver en Lista</div>
        </a>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
          <a href="/publicar" style={btnPublicarStyle}>➕</a>
          <span style={{ fontSize: "10px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px", color: "#2c2c2e" }}>Publicar</span>
        </div>
        <a href="/mapa" style={accionStyle}>
          <div style={{ fontSize: "24px", marginBottom: "6px" }}>🗺️</div>
          <div style={accionLabelStyle}>Ver en Mapa</div>
        </a>
      </div>

      {/* FILTROS RUBRO */}
      <div style={{ display: "flex", gap: "8px", padding: "0 16px 16px", overflowX: "auto", scrollbarWidth: "none" }}>
        {rubros.map((r) => (
          <button key={r} onClick={() => setRubroActivo(r)} style={{
            background: rubroActivo === r ? "#2c2c2e" : "#fff",
            border: `2px solid ${rubroActivo === r ? "#2c2c2e" : "#e8e8e6"}`,
            borderRadius: "20px", padding: "6px 14px", fontSize: "12px", fontWeight: 700,
            color: rubroActivo === r ? "#fff" : "#2c2c2e", whiteSpace: "nowrap",
            cursor: "pointer", flexShrink: 0, fontFamily: "'Nunito', sans-serif",
          }}>{r}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#9a9a9a", fontWeight: 700 }}>Cargando anuncios...</div>
      ) : (
        <>
          {/* SLIDER DESTACADOS */}
          {destacados.length > 0 && (
            <Seccion titulo="⚡ Destacados">
              {destacados.map((a) => <Tarjeta key={a.id} anuncio={a} formatPrecio={formatPrecio} />)}
            </Seccion>
          )}

          {/* SLIDER RECIENTES */}
          <Seccion titulo="🕐 Recién publicados">
            {recientes.map((a) => <Tarjeta key={a.id} anuncio={a} formatPrecio={formatPrecio} />)}
          </Seccion>
        </>
      )}

      {/* MAPA PREVIEW */}
      <a href="/mapa" style={{ display: "block", margin: "0 16px 20px", borderRadius: "16px", overflow: "hidden", boxShadow: "0 4px 16px rgba(0,0,0,0.1)", textDecoration: "none", position: "relative" }}>
        <div style={{ height: "180px", background: "linear-gradient(135deg, #c8d8e8, #b0c4d8)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "8px" }}>
          <span style={{ fontSize: "40px" }}>🗺️</span>
          <span style={{ fontWeight: 800, fontSize: "13px", color: "#1a2a3a", letterSpacing: "1px" }}>Ver anuncios en el mapa</span>
        </div>
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(transparent, rgba(26,42,58,0.8))", padding: "16px", color: "white", fontWeight: 800, fontSize: "14px" }}>
          📍 Anuncios cerca tuyo
        </div>
      </a>

      <BottomNav />
    </main>
  );
}

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 16px 10px" }}>
        <span style={{ fontSize: "16px", fontWeight: 900 }}>{titulo}</span>
        <a href="/buscar" style={{ fontSize: "12px", fontWeight: 700, color: "#d4a017", textDecoration: "none" }}>Ver todos →</a>
      </div>
      <div style={{ display: "flex", gap: "12px", padding: "0 16px 8px", overflowX: "auto", scrollbarWidth: "none" }}>
        {children}
      </div>
    </div>
  );
}

function Tarjeta({ anuncio, formatPrecio }: { anuncio: Anuncio; formatPrecio: (p: number, m: string) => string }) {
  const imagen = anuncio.imagenes?.[0];
  return (
    <a href={`/anuncios/${anuncio.id}`} style={{ textDecoration: "none", flexShrink: 0, width: "180px" }}>
      <div style={{ background: "#fff", borderRadius: "16px", overflow: "hidden", boxShadow: "0 2px 10px rgba(0,0,0,0.08)", cursor: "pointer" }}>
        <div style={{ width: "100%", height: "120px", background: "#e8e8e6", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
          {imagen ? (
            <img src={imagen} alt={anuncio.titulo} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <span style={{ fontSize: "40px" }}>📦</span>
          )}
          {anuncio.flash && <span style={{ position: "absolute", top: "8px", right: "8px", background: "#d4a017", color: "#1a2a3a", fontSize: "9px", fontWeight: 900, padding: "3px 7px", borderRadius: "8px", textTransform: "uppercase" }}>Flash</span>}
        </div>
        <div style={{ padding: "10px 12px 12px" }}>
          <div style={{ fontSize: "13px", fontWeight: 800, color: "#2c2c2e", marginBottom: "3px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{anuncio.titulo}</div>
          <div style={{ fontSize: "15px", fontWeight: 900, color: "#d4a017" }}>{formatPrecio(anuncio.precio, anuncio.moneda)}</div>
          <div style={{ fontSize: "11px", color: "#9a9a9a", fontWeight: 600, marginTop: "2px" }}>📍 {anuncio.ciudad}, {anuncio.provincia}</div>
        </div>
      </div>
    </a>
  );
}

const accionStyle: React.CSSProperties = {
  background: "#fff", borderRadius: "14px", padding: "14px 10px", textAlign: "center",
  boxShadow: "0 2px 8px rgba(0,0,0,0.08)", cursor: "pointer", textDecoration: "none", color: "#2c2c2e", display: "block",
};
const accionLabelStyle: React.CSSProperties = {
  fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px", lineHeight: 1.2,
};
const btnPublicarStyle: React.CSSProperties = {
  background: "#d4a017", color: "#1a2a3a", border: "none", borderRadius: "50%",
  width: "68px", height: "68px", fontSize: "30px", cursor: "pointer",
  boxShadow: "0 4px 16px rgba(212,160,23,0.45)", display: "flex",
  alignItems: "center", justifyContent: "center", textDecoration: "none",
};
