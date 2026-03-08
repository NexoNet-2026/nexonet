"use client";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

const rubros = ["Todos", "Autos", "Inmuebles", "Tecnología", "Servicios", "Ropa", "Hogar"];

const FUENTES: Record<string, { label: string; color: string; texto: string }> = {
  nexonet:       { label: "NexoNet",        color: "#d4a017", texto: "#1a2a3a" },
  mercadolibre:  { label: "Mercado Libre",  color: "#ffe600", texto: "#333" },
  rosariogarage: { label: "Rosario Garage", color: "#ff6b00", texto: "#fff" },
  olx:           { label: "OLX",            color: "#00a884", texto: "#fff" },
  otro:          { label: "Externo",        color: "#888",    texto: "#fff" },
};

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
  envio_gratis: boolean;
  mas_vendido: boolean;
  tienda_oficial: boolean;
  descuento_cantidad: boolean;
  presupuesto_sin_cargo: boolean;
  conexion_habilitada: boolean;
  descuento_porcentaje: number;
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
          fuente, envio_gratis, mas_vendido, tienda_oficial, descuento_cantidad,
          presupuesto_sin_cargo, conexion_habilitada, descuento_porcentaje,
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
          fuente: a.fuente || "nexonet",
          envio_gratis: a.envio_gratis || false,
          mas_vendido: a.mas_vendido || false,
          tienda_oficial: a.tienda_oficial || false,
          descuento_cantidad: a.descuento_cantidad || false,
          presupuesto_sin_cargo: a.presupuesto_sin_cargo || false,
          conexion_habilitada: a.conexion_habilitada || false,
          descuento_porcentaje: a.descuento_porcentaje || 0,
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
      <div style={{ background: "linear-gradient(135deg, #1a2a3a 0%, #243b55 100%)", padding: "18px 16px 14px", textAlign: "center" }}>
        <div style={{ fontSize: "13px", fontWeight: 700, color: "#d4a017", letterSpacing: "2px", textTransform: "uppercase", marginBottom: "4px" }}>
          Conectando Oportunidades
        </div>
        <div style={{ fontSize: "12px", color: "#7a8fa0", marginBottom: "10px", fontWeight: 600 }}>
          Conectando a la Comunidad
        </div>
        <div style={{ display: "flex", background: "#fff", borderRadius: "12px", overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.25)", maxWidth: "500px", margin: "0 auto" }}>
          <input type="text" placeholder="¿Qué estás buscando?" style={{ flex: 1, border: "none", padding: "14px 16px", fontFamily: "'Nunito', sans-serif", fontSize: "14px", color: "#2c2c2e", outline: "none" }} />
          <button style={{ background: "#d4a017", border: "none", padding: "0 18px", cursor: "pointer", fontSize: "18px" }}>🔍</button>
        </div>
      </div>

      {/* ACCIONES RÁPIDAS */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", padding: "14px 16px" }}>
        <a href="/buscar" style={accionStyle}>
          <div style={{ fontSize: "28px", marginBottom: "6px" }}>📋</div>
          <div style={accionTituloStyle}>Ver en Lista</div>
          <div style={accionSubStyle}>Todos los anuncios</div>
        </a>
        <a href="/mapa" style={accionStyle}>
          <div style={{ fontSize: "28px", marginBottom: "6px" }}>🗺️</div>
          <div style={accionTituloStyle}>Ver en Mapa</div>
          <div style={accionSubStyle}>Anuncios cerca tuyo</div>
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
          {destacados.length > 0 && (
            <Seccion titulo="⚡ Destacados">
              {destacados.map((a) => <Tarjeta key={a.id} anuncio={a} formatPrecio={formatPrecio} />)}
            </Seccion>
          )}
          <Seccion titulo="🕐 Recién publicados">
            {recientes.map((a) => <Tarjeta key={a.id} anuncio={a} formatPrecio={formatPrecio} />)}
          </Seccion>
        </>
      )}

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
  const fuente = FUENTES[anuncio.fuente] || FUENTES.nexonet;

  const badges = [
    anuncio.envio_gratis        && { label: "Envío gratis",    color: "#00a884", texto: "#fff" },
    anuncio.mas_vendido         && { label: "Más vendido",     color: "#e63946", texto: "#fff" },
    anuncio.tienda_oficial      && { label: "Tienda oficial",  color: "#1a2a3a", texto: "#d4a017" },
    anuncio.conexion_habilitada && { label: "🔗 Conexión",     color: "#3a7bd5", texto: "#fff" },
    anuncio.presupuesto_sin_cargo && { label: "Presup. gratis", color: "#6a0dad", texto: "#fff" },
    anuncio.descuento_cantidad  && { label: "Desc. x cantidad", color: "#2d6a4f", texto: "#fff" },
    anuncio.descuento_porcentaje > 0 && { label: `${anuncio.descuento_porcentaje}% OFF`, color: "#e63946", texto: "#fff" },
  ].filter(Boolean) as { label: string; color: string; texto: string }[];

  return (
    <a href={`/anuncios/${anuncio.id}`} style={{ textDecoration: "none", flexShrink: 0, width: "190px" }}>
      <div style={{ background: "#fff", borderRadius: "16px", overflow: "hidden", boxShadow: "0 2px 10px rgba(0,0,0,0.08)", cursor: "pointer" }}>

        {/* FRANJA FUENTE */}
        <div style={{ background: fuente.color, padding: "4px 10px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: "10px", fontWeight: 900, color: fuente.texto, textTransform: "uppercase", letterSpacing: "0.5px" }}>
            {fuente.label}
          </span>
          {anuncio.flash && (
            <span style={{ background: "#1a2a3a", color: "#d4a017", fontSize: "9px", fontWeight: 900, padding: "1px 6px", borderRadius: "6px", textTransform: "uppercase" }}>
              ⚡ Flash
            </span>
          )}
        </div>

        {/* IMAGEN */}
        <div style={{ width: "100%", height: "120px", background: "#e8e8e6", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
          {imagen ? (
            <img src={imagen} alt={anuncio.titulo} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <span style={{ fontSize: "40px" }}>📦</span>
          )}
        </div>

        {/* BADGES */}
        {badges.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", padding: "6px 8px 0" }}>
            {badges.slice(0, 3).map((b, i) => (
              <span key={i} style={{ background: b.color, color: b.texto, fontSize: "9px", fontWeight: 800, padding: "2px 6px", borderRadius: "6px" }}>
                {b.label}
              </span>
            ))}
          </div>
        )}

        {/* INFO */}
        <div style={{ padding: "8px 10px 12px" }}>
          <div style={{ fontSize: "13px", fontWeight: 800, color: "#2c2c2e", marginBottom: "3px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{anuncio.titulo}</div>
          <div style={{ fontSize: "15px", fontWeight: 900, color: "#d4a017" }}>{formatPrecio(anuncio.precio, anuncio.moneda)}</div>
          <div style={{ fontSize: "11px", color: "#9a9a9a", fontWeight: 600, marginTop: "2px" }}>📍 {anuncio.ciudad}, {anuncio.provincia}</div>
        </div>
      </div>
    </a>
  );
}

const accionStyle: React.CSSProperties = {
  background: "linear-gradient(135deg, #1a2a3a 0%, #243b55 100%)",
  borderRadius: "16px", padding: "18px 10px", textAlign: "center",
  boxShadow: "0 4px 12px rgba(0,0,0,0.15)", cursor: "pointer",
  textDecoration: "none", color: "#fff", display: "block",
  border: "1px solid rgba(255,255,255,0.08)",
};
const accionTituloStyle: React.CSSProperties = {
  fontSize: "13px", fontWeight: 900, textTransform: "uppercase",
  letterSpacing: "0.5px", color: "#fff", marginBottom: "2px",
};
const accionSubStyle: React.CSSProperties = {
  fontSize: "11px", fontWeight: 600, color: "#8a9aaa",
};
