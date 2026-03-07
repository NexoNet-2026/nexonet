"use client";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { useState } from "react";
import { useRouter } from "next/navigation";

const rubrosData: Record<string, string[]> = {
  "Vehículos":   ["Autos", "Motos", "Camionetas", "Camiones", "Náutica", "Maquinaria", "Repuestos"],
  "Inmuebles":   ["Casas", "Departamentos", "Terrenos", "Locales", "Oficinas", "Galpones", "Quintas"],
  "Tecnología":  ["Celulares", "Computadoras", "Tablets", "Audio", "TV", "Consolas", "Accesorios"],
  "Servicios":   ["Plomería", "Electricidad", "Pintura", "Albañilería", "Jardinería", "Limpieza", "Fletes"],
  "Ropa y Moda": ["Hombre", "Mujer", "Niños", "Calzado", "Accesorios", "Deportiva", "Segunda mano"],
  "Hogar":       ["Muebles", "Electrodomésticos", "Decoración", "Jardín", "Herramientas", "Iluminación"],
  "Empleos":     ["Tiempo completo", "Medio tiempo", "Freelance", "Prácticas", "Oficios"],
  "Animales":    ["Perros", "Gatos", "Aves", "Peces", "Accesorios", "Veterinaria"],
};

type Paso = "categoria" | "datos";

export default function Publicar() {
  const [paso, setPaso] = useState<Paso>("categoria");
  const [rubro, setRubro] = useState("");
  const [subrubro, setSubrubro] = useState("");
  const [form, setForm] = useState({ titulo: "", descripcion: "", precio: "", moneda: "ARS" });
  const [fotos, setFotos] = useState<string[]>([]);
  const [error, setError] = useState("");
  const router = useRouter();

  const pasoNum = paso === "categoria" ? 1 : 2;
  const progreso = paso === "categoria" ? 40 : 85;

  const handleCategoria = () => {
    if (!rubro || !subrubro) { setError("Seleccioná rubro y subrubro"); return; }
    setError("");
    setPaso("datos");
  };

  const handleFoto = () => {
    if (fotos.length < 3) setFotos([...fotos, `foto_${fotos.length + 1}`]);
  };

  const handlePublicar = () => {
    if (!form.titulo) { setError("El título es obligatorio"); return; }
    // lógica de publicación futura
    router.push("/");
  };

  return (
    <main style={{ paddingTop: "60px", paddingBottom: "64px", background: "#f4f4f2", minHeight: "100vh", fontFamily: "'Nunito', sans-serif" }}>
      <Header />

      {/* SUB-HEADER */}
      <div style={{ background: "linear-gradient(135deg, #1a2a3a 0%, #243b55 100%)", padding: "12px 16px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
          {paso === "datos" && (
            <button onClick={() => setPaso("categoria")} style={{ background: "none", border: "none", color: "#d4a017", fontSize: "20px", cursor: "pointer", padding: 0 }}>←</button>
          )}
          <div>
            {rubro && subrubro && (
              <div style={{ fontSize: "10px", color: "#8a9aaa", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase" }}>
                {rubro} › {subrubro}
              </div>
            )}
            <div style={{ fontSize: "18px", fontWeight: 900, color: "#fff" }}>➕ Publicar anuncio</div>
          </div>
        </div>

        {/* BARRA PROGRESO */}
        <div style={{ height: "4px", background: "rgba(255,255,255,0.15)", borderRadius: "2px", marginBottom: "0" }}>
          <div style={{ height: "100%", width: `${progreso}%`, background: "#d4a017", borderRadius: "2px", transition: "width .4s ease" }} />
        </div>
      </div>

      <div style={{ padding: "20px 16px" }}>

        {/* ── PASO 1: CATEGORÍA ── */}
        {paso === "categoria" && (
          <div style={{ background: "#fff", borderRadius: "20px", padding: "24px 20px", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", maxWidth: "480px", margin: "0 auto" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 900, color: "#1a2a3a", marginBottom: "20px" }}>¿En qué categoría publicás?</h2>

            {/* RUBRO */}
            <div style={{ marginBottom: "16px" }}>
              <label style={labelStyle}>Rubro</label>
              <select
                value={rubro}
                onChange={(e) => { setRubro(e.target.value); setSubrubro(""); }}
                style={selectStyle}
              >
                <option value="">Seleccioná un rubro...</option>
                {Object.keys(rubrosData).map((r) => (
                  <option key={r} value={r}>{r.toUpperCase()}</option>
                ))}
              </select>
            </div>

            {/* SUBRUBRO */}
            <div style={{ marginBottom: "24px" }}>
              <label style={labelStyle}>Subrubro</label>
              <select
                value={subrubro}
                onChange={(e) => setSubrubro(e.target.value)}
                disabled={!rubro}
                style={{ ...selectStyle, opacity: rubro ? 1 : 0.5, borderColor: subrubro ? "#1a2a3a" : "#e8e8e6" }}
              >
                <option value="">Seleccioná un subrubro...</option>
                {rubro && rubrosData[rubro].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {error && <MensajeError texto={error} />}

            <button onClick={handleCategoria} style={btnPrincipalStyle}>
              Continuar →
            </button>
          </div>
        )}

        {/* ── PASO 2: DATOS ── */}
        {paso === "datos" && (
          <div style={{ maxWidth: "480px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "14px" }}>

            {/* DATOS PRINCIPALES */}
            <div style={cardStyle}>
              <h3 style={subtituloStyle}>Datos del anuncio</h3>

              <div style={{ marginBottom: "14px" }}>
                <label style={labelStyle}>Título *</label>
                <input
                  type="text"
                  value={form.titulo}
                  onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                  placeholder={`Ej: ${rubro === "Vehículos" ? "Toyota Corolla 2020 Full" : rubro === "Inmuebles" ? "Casa 3 dorm. con jardín" : "Título de tu anuncio"}`}
                  style={inputStyle}
                />
              </div>

              <div style={{ marginBottom: "14px" }}>
                <label style={labelStyle}>Descripción</label>
                <textarea
                  value={form.descripcion}
                  onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                  placeholder="Describí tu anuncio con todos los detalles..."
                  rows={4}
                  style={{ ...inputStyle, resize: "vertical", lineHeight: 1.5 }}
                />
              </div>

              {/* PRECIO + MONEDA */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "10px" }}>
                <div>
                  <label style={labelStyle}>Precio</label>
                  <input
                    type="number"
                    value={form.precio}
                    onChange={(e) => setForm({ ...form, precio: e.target.value })}
                    placeholder="0"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Moneda</label>
                  <select value={form.moneda} onChange={(e) => setForm({ ...form, moneda: e.target.value })} style={selectStyle}>
                    <option>ARS</option>
                    <option>USD</option>
                  </select>
                </div>
              </div>
            </div>

            {/* FOTOS */}
            <div style={cardStyle}>
              <h3 style={subtituloStyle}>📸 Fotos (hasta 3)</h3>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                {fotos.map((f, i) => (
                  <div key={i} style={{ width: "90px", height: "90px", borderRadius: "10px", background: "#e8f0e8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "28px", border: "2px solid #c8d8c8" }}>
                    ✅
                  </div>
                ))}
                {fotos.length < 3 && (
                  <button onClick={handleFoto} style={{ width: "90px", height: "90px", borderRadius: "10px", background: "#f4f4f2", border: "2px dashed #d0d0d0", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "4px" }}>
                    <span style={{ fontSize: "24px" }}>📷</span>
                    <span style={{ fontSize: "10px", fontWeight: 700, color: "#9a9a9a" }}>Agregar</span>
                  </button>
                )}
              </div>
            </div>

            {/* BITS */}
            <div style={{ ...cardStyle, background: "linear-gradient(135deg, #1a2a3a, #243b55)" }}>
              <h3 style={{ ...subtituloStyle, color: "#d4a017" }}>⚡ Potenciá tu anuncio</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                {[
                  { label: "Bit Flash", desc: "Aparecé primero", bits: "14 Bits", color: "#d4a017" },
                  { label: "Bit Posición", desc: "Mejor posición", bits: "15 Bits", color: "#d4a017" },
                  { label: "Bit Conexión", desc: "+Contactos", bits: "13 Bits", color: "#d4a017" },
                  { label: "Bit Empresa", desc: "Logo de empresa", bits: "16 Bits", color: "#d4a017" },
                ].map((b) => (
                  <div key={b.label} style={{ background: "rgba(255,255,255,0.08)", borderRadius: "10px", padding: "10px 12px", border: "1px solid rgba(212,160,23,0.3)", cursor: "pointer" }}>
                    <div style={{ fontSize: "12px", fontWeight: 800, color: "#fff" }}>{b.label}</div>
                    <div style={{ fontSize: "10px", color: "#8a9aaa", marginBottom: "4px" }}>{b.desc}</div>
                    <div style={{ fontSize: "13px", fontWeight: 900, color: b.color }}>{b.bits}</div>
                  </div>
                ))}
              </div>
            </div>

            {error && <MensajeError texto={error} />}

            <button onClick={handlePublicar} style={btnPrincipalStyle}>
              ✅ Publicar anuncio
            </button>

          </div>
        )}
      </div>

      <BottomNav />
    </main>
  );
}

function MensajeError({ texto }: { texto: string }) {
  return (
    <div style={{ color: "#e53e3e", fontSize: "13px", fontWeight: 700, marginBottom: "12px", textAlign: "center" }}>
      ⚠️ {texto}
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: "11px", fontWeight: 800, color: "#666",
  textTransform: "uppercase", letterSpacing: "1px", marginBottom: "6px",
};

const inputStyle: React.CSSProperties = {
  width: "100%", border: "2px solid #e8e8e6", borderRadius: "10px",
  padding: "12px 14px", fontSize: "14px", fontFamily: "'Nunito', sans-serif",
  color: "#2c2c2e", outline: "none", boxSizing: "border-box",
};

const selectStyle: React.CSSProperties = {
  width: "100%", border: "2px solid #e8e8e6", borderRadius: "10px",
  padding: "12px 14px", fontSize: "14px", fontFamily: "'Nunito', sans-serif",
  color: "#2c2c2e", outline: "none", background: "#fff", cursor: "pointer",
  boxSizing: "border-box",
};

const btnPrincipalStyle: React.CSSProperties = {
  width: "100%", background: "linear-gradient(135deg, #d4a017, #f0c040)",
  color: "#1a2a3a", border: "none", borderRadius: "12px", padding: "16px",
  fontSize: "15px", fontWeight: 800, fontFamily: "'Nunito', sans-serif",
  cursor: "pointer", letterSpacing: "1px", textTransform: "uppercase",
};

const cardStyle: React.CSSProperties = {
  background: "#fff", borderRadius: "16px", padding: "20px",
  boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
};

const subtituloStyle: React.CSSProperties = {
  fontSize: "16px", fontWeight: 900, color: "#1a2a3a", marginBottom: "16px",
};
