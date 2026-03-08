"use client";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

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
  descripcion: string;
  precio: number;
  moneda: string;
  ciudad: string;
  provincia: string;
  imagenes: string[];
  flash: boolean;
  estado: string;
  created_at: string;
  vistas: number;
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
  usuario_nombre: string;
  usuario_whatsapp: string;
  usuario_codigo: string;
};

export default function AnuncioDetalle() {
  const params = useParams();
  const router = useRouter();
  const [anuncio, setAnuncio] = useState<Anuncio | null>(null);
  const [loading, setLoading] = useState(true);
  const [imgActiva, setImgActiva] = useState(0);

  useEffect(() => {
    const cargar = async () => {
      const { data } = await supabase
        .from("anuncios")
        .select(`
          id, titulo, descripcion, precio, moneda, ciudad, provincia,
          imagenes, flash, estado, created_at, vistas,
          fuente, envio_gratis, mas_vendido, tienda_oficial,
          descuento_cantidad, presupuesto_sin_cargo, conexion_habilitada, descuento_porcentaje,
          subrubros(nombre, rubros(nombre)),
          usuarios(nombre_usuario, whatsapp, codigo)
        `)
        .eq("id", params.id)
        .single();

      if (data) {
        setAnuncio({
          id: data.id,
          titulo: data.titulo,
          descripcion: data.descripcion || "",
          precio: data.precio,
          moneda: data.moneda,
          ciudad: data.ciudad,
          provincia: data.provincia,
          imagenes: data.imagenes || [],
          flash: data.flash || false,
          estado: data.estado,
          created_at: data.created_at,
          vistas: data.vistas || 0,
          fuente: data.fuente || "nexonet",
          envio_gratis: data.envio_gratis || false,
          mas_vendido: data.mas_vendido || false,
          tienda_oficial: data.tienda_oficial || false,
          descuento_cantidad: data.descuento_cantidad || false,
          presupuesto_sin_cargo: data.presupuesto_sin_cargo || false,
          conexion_habilitada: data.conexion_habilitada || false,
          descuento_porcentaje: data.descuento_porcentaje || 0,
          subrubro: (data.subrubros as any)?.nombre || "",
          rubro: (data.subrubros as any)?.rubros?.nombre || "",
          usuario_nombre: (data.usuarios as any)?.nombre_usuario || "Usuario",
          usuario_whatsapp: (data.usuarios as any)?.whatsapp || "",
          usuario_codigo: (data.usuarios as any)?.codigo || "",
        });
        await supabase.from("anuncios").update({ vistas: (data.vistas || 0) + 1 }).eq("id", params.id);
      }
      setLoading(false);
    };
    cargar();
  }, [params.id]);

  const formatPrecio = (precio: number, moneda: string) => {
    if (!precio) return "Consultar";
    return `${moneda === "USD" ? "U$D" : "$"} ${precio.toLocaleString("es-AR")}`;
  };

  const formatFecha = (fecha: string) =>
    new Date(fecha).toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" });

  if (loading) return (
    <main style={{ paddingTop: "95px", paddingBottom: "130px", background: "#f4f4f2", minHeight: "100vh", fontFamily: "'Nunito', sans-serif" }}>
      <Header />
      <div style={{ textAlign: "center", padding: "60px 16px", color: "#9a9a9a", fontWeight: 700 }}>Cargando...</div>
      <BottomNav />
    </main>
  );

  if (!anuncio) return (
    <main style={{ paddingTop: "95px", paddingBottom: "130px", background: "#f4f4f2", minHeight: "100vh", fontFamily: "'Nunito', sans-serif" }}>
      <Header />
      <div style={{ textAlign: "center", padding: "60px 16px" }}>
        <div style={{ fontSize: "48px", marginBottom: "16px" }}>😕</div>
        <div style={{ fontSize: "18px", fontWeight: 800, color: "#1a2a3a" }}>Anuncio no encontrado</div>
        <button onClick={() => router.push("/")} style={{ marginTop: "20px", background: "#d4a017", border: "none", borderRadius: "12px", padding: "12px 24px", fontWeight: 800, cursor: "pointer", fontFamily: "'Nunito', sans-serif" }}>Volver al inicio</button>
      </div>
      <BottomNav />
    </main>
  );

  const fuente = FUENTES[anuncio.fuente] || FUENTES.nexonet;

  const badges = [
    anuncio.envio_gratis         && { label: "Envío gratis",     color: "#00a884", texto: "#fff" },
    anuncio.mas_vendido          && { label: "⭐ Más vendido",    color: "#e63946", texto: "#fff" },
    anuncio.tienda_oficial       && { label: "Tienda oficial",    color: "#1a2a3a", texto: "#d4a017" },
    anuncio.conexion_habilitada  && { label: "🔗 Conexión",       color: "#3a7bd5", texto: "#fff" },
    anuncio.presupuesto_sin_cargo && { label: "Presup. gratis",   color: "#6a0dad", texto: "#fff" },
    anuncio.descuento_cantidad   && { label: "Desc. x cantidad",  color: "#2d6a4f", texto: "#fff" },
    anuncio.descuento_porcentaje > 0 && { label: `${anuncio.descuento_porcentaje}% OFF`, color: "#e63946", texto: "#fff" },
  ].filter(Boolean) as { label: string; color: string; texto: string }[];

  return (
    <main style={{ paddingTop: "95px", paddingBottom: "130px", background: "#f4f4f2", minHeight: "100vh", fontFamily: "'Nunito', sans-serif" }}>
      <Header />

      {/* GALERÍA */}
      <div style={{ position: "relative", background: "#1a2a3a" }}>

        {/* FRANJA FUENTE */}
        <div style={{ background: fuente.color, padding: "5px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: "11px", fontWeight: 900, color: fuente.texto, textTransform: "uppercase", letterSpacing: "1px" }}>{fuente.label}</span>
          {anuncio.flash && <span style={{ background: "#1a2a3a", color: "#d4a017", fontSize: "10px", fontWeight: 900, padding: "2px 8px", borderRadius: "8px" }}>⚡ Flash</span>}
        </div>

        {/* IMAGEN PRINCIPAL */}
        <div style={{ height: "280px", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
          {anuncio.imagenes.length > 0
            ? <img src={anuncio.imagenes[imgActiva]} alt={anuncio.titulo} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : <span style={{ fontSize: "80px" }}>📦</span>
          }
        </div>

        {/* BOTÓN VOLVER */}
        <button onClick={() => router.back()} style={{ position: "absolute", top: "44px", left: "12px", background: "rgba(0,0,0,0.5)", border: "none", borderRadius: "50%", width: "36px", height: "36px", color: "#fff", fontSize: "18px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>←</button>

        {/* MINIATURAS */}
        {anuncio.imagenes.length > 1 && (
          <div style={{ display: "flex", gap: "6px", padding: "8px 12px", overflowX: "auto", scrollbarWidth: "none" }}>
            {anuncio.imagenes.map((img, i) => (
              <div key={i} onClick={() => setImgActiva(i)} style={{ width: "52px", height: "52px", flexShrink: 0, borderRadius: "8px", overflow: "hidden", border: `2px solid ${imgActiva === i ? "#d4a017" : "transparent"}`, cursor: "pointer" }}>
                <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>

        {/* INFO PRINCIPAL */}
        <div style={{ background: "#fff", borderRadius: "16px", padding: "20px", boxShadow: "0 2px 10px rgba(0,0,0,0.06)" }}>
          <div style={{ fontSize: "11px", fontWeight: 700, color: "#d4a017", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "6px" }}>
            {anuncio.rubro}{anuncio.subrubro ? ` → ${anuncio.subrubro}` : ""}
          </div>
          <h1 style={{ fontSize: "20px", fontWeight: 900, color: "#1a2a3a", margin: "0 0 12px 0", lineHeight: 1.3 }}>{anuncio.titulo}</h1>
          <div style={{ fontSize: "28px", fontWeight: 900, color: "#d4a017", marginBottom: "12px" }}>
            {formatPrecio(anuncio.precio, anuncio.moneda)}
          </div>
          {badges.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "12px" }}>
              {badges.map((b, i) => (
                <span key={i} style={{ background: b.color, color: b.texto, fontSize: "11px", fontWeight: 800, padding: "4px 10px", borderRadius: "8px" }}>{b.label}</span>
              ))}
            </div>
          )}
          <div style={{ display: "flex", gap: "16px", fontSize: "12px", color: "#9a9a9a", fontWeight: 600, flexWrap: "wrap" }}>
            <span>📍 {anuncio.ciudad}, {anuncio.provincia}</span>
            <span>👁️ {anuncio.vistas} vistas</span>
            <span>📅 {formatFecha(anuncio.created_at)}</span>
          </div>
        </div>

        {/* DESCRIPCIÓN */}
        {anuncio.descripcion && (
          <div style={{ background: "#fff", borderRadius: "16px", padding: "20px", boxShadow: "0 2px 10px rgba(0,0,0,0.06)" }}>
            <h3 style={{ fontSize: "14px", fontWeight: 900, color: "#1a2a3a", marginBottom: "10px", textTransform: "uppercase", letterSpacing: "1px" }}>Descripción</h3>
            <p style={{ fontSize: "14px", color: "#444", lineHeight: 1.7, margin: 0, whiteSpace: "pre-wrap" }}>{anuncio.descripcion}</p>
          </div>
        )}

        {/* VENDEDOR */}
        <div style={{ background: "#fff", borderRadius: "16px", padding: "20px", boxShadow: "0 2px 10px rgba(0,0,0,0.06)" }}>
          <h3 style={{ fontSize: "14px", fontWeight: 900, color: "#1a2a3a", marginBottom: "14px", textTransform: "uppercase", letterSpacing: "1px" }}>Vendedor</h3>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "linear-gradient(135deg, #d4a017, #f0c040)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", flexShrink: 0 }}>👤</div>
            <div>
              <div style={{ fontSize: "15px", fontWeight: 800, color: "#1a2a3a" }}>{anuncio.usuario_nombre}</div>
              <div style={{ fontSize: "12px", color: "#d4a017", fontWeight: 700 }}>{anuncio.usuario_codigo}</div>
            </div>
          </div>
        </div>

        {/* BOTONES CONTACTO */}
        <div style={{ display: "flex", gap: "10px" }}>
          {anuncio.usuario_whatsapp && (
            <a href={`https://wa.me/54${anuncio.usuario_whatsapp}?text=Hola! Vi tu anuncio "${anuncio.titulo}" en NexoNet`}
              target="_blank" rel="noopener noreferrer"
              style={{ flex: 1, background: "#25D366", color: "#fff", borderRadius: "12px", padding: "16px", fontSize: "14px", fontWeight: 800, textAlign: "center", textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
              💬 WhatsApp
            </a>
          )}
          <button style={{ flex: 1, background: "linear-gradient(135deg, #d4a017, #f0c040)", color: "#1a2a3a", border: "none", borderRadius: "12px", padding: "16px", fontSize: "14px", fontWeight: 800, cursor: "pointer", fontFamily: "'Nunito', sans-serif" }}>
            🔗 Conectar
          </button>
        </div>

      </div>
      <BottomNav />
    </main>
  );
}
