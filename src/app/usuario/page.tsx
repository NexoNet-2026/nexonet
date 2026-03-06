"use client";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { useState } from "react";

type Seccion = "datos" | "anuncios" | "estadisticas" | "promotor";

const diasSemana = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

export default function Usuario() {
  const [seccion, setSeccion] = useState<Seccion>("datos");
  const [form, setForm] = useState({
    usuario: "AAA-00000",
    nombre: "",
    apellido: "",
    empresa: "",
    whatsapp: "",
    direccion: "",
    direccionComercial: "",
  });
  const [visibilidad, setVisibilidad] = useState({
    nombre: true,
    empresa: true,
    whatsapp: false,
    direccion: false,
    direccionComercial: false,
  });
  const [horarios, setHorarios] = useState<Record<string, { desde: string; hasta: string; activo: boolean }>>({
    Lunes:      { desde: "09:00", hasta: "18:00", activo: true },
    Martes:     { desde: "09:00", hasta: "18:00", activo: true },
    Miércoles:  { desde: "09:00", hasta: "18:00", activo: true },
    Jueves:     { desde: "09:00", hasta: "18:00", activo: true },
    Viernes:    { desde: "09:00", hasta: "18:00", activo: true },
    Sábado:     { desde: "09:00", hasta: "13:00", activo: false },
    Domingo:    { desde: "09:00", hasta: "13:00", activo: false },
  });

  const secciones: { id: Seccion; label: string; emoji: string }[] = [
    { id: "datos",        label: "Datos",        emoji: "👤" },
    { id: "anuncios",     label: "Anuncios",     emoji: "📋" },
    { id: "estadisticas", label: "Estadísticas", emoji: "📊" },
    { id: "promotor",     label: "Promotor",     emoji: "⭐" },
  ];

  const toggleVisibilidad = (campo: keyof typeof visibilidad) => {
    setVisibilidad({ ...visibilidad, [campo]: !visibilidad[campo] });
  };

  const toggleHorario = (dia: string) => {
    setHorarios({ ...horarios, [dia]: { ...horarios[dia], activo: !horarios[dia].activo } });
  };

  return (
    <main style={{ paddingTop: "90px", paddingBottom: "130px", background: "#f4f4f2", minHeight: "100vh", fontFamily: "'Nunito', sans-serif" }}>
      <Header />

      {/* HERO USUARIO */}
      <div style={{ background: "linear-gradient(135deg, #1a2a3a 0%, #243b55 100%)", padding: "20px 16px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "16px" }}>
          <div style={{ width: "60px", height: "60px", borderRadius: "50%", background: "linear-gradient(135deg, #d4a017, #f0c040)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "28px", boxShadow: "0 4px 16px rgba(212,160,23,0.4)", flexShrink: 0 }}>
            👤
          </div>
          <div>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "22px", color: "#d4a017", letterSpacing: "2px" }}>AAA-00000</div>
            <div style={{ fontSize: "12px", color: "#8a9aaa", fontWeight: 600 }}>Miembro desde Marzo 2026</div>
          </div>
          <button style={{ marginLeft: "auto", background: "rgba(212,160,23,0.15)", border: "1px solid rgba(212,160,23,0.4)", borderRadius: "10px", padding: "6px 12px", color: "#d4a017", fontSize: "12px", fontWeight: 800, cursor: "pointer", fontFamily: "'Nunito', sans-serif" }}>
            ✏️ Editar
          </button>
        </div>

        {/* TABS */}
        <div style={{ display: "flex" }}>
          {secciones.map((s) => (
            <button key={s.id} onClick={() => setSeccion(s.id)} style={{
              flex: 1, background: "none", border: "none",
              borderBottom: seccion === s.id ? "3px solid #d4a017" : "3px solid transparent",
              padding: "10px 4px", cursor: "pointer",
              display: "flex", flexDirection: "column", alignItems: "center", gap: "2px",
            }}>
              <span style={{ fontSize: "16px" }}>{s.emoji}</span>
              <span style={{ fontSize: "9px", fontWeight: 800, color: seccion === s.id ? "#d4a017" : "#8a9aaa", textTransform: "uppercase", letterSpacing: "0.5px" }}>{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: "16px", maxWidth: "480px", margin: "0 auto" }}>

        {/* ── DATOS ── */}
        {seccion === "datos" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>

            {/* DATOS PERSONALES */}
            <div style={cardStyle}>
              <h3 style={subtituloStyle}>Datos personales</h3>

              <CampoVisible label="Nombre de usuario" valor={form.usuario} onChange={(v) => setForm({ ...form, usuario: v })} visible={true} sinToggle />
              <CampoVisible label="Nombre" valor={form.nombre} onChange={(v) => setForm({ ...form, nombre: v })} visible={visibilidad.nombre} onToggle={() => toggleVisibilidad("nombre")} placeholder="Tu nombre" />
              <CampoVisible label="Apellido" valor={form.apellido} onChange={(v) => setForm({ ...form, apellido: v })} visible={true} sinToggle placeholder="Tu apellido" />
              <CampoVisible label="Nombre de empresa" valor={form.empresa} onChange={(v) => setForm({ ...form, empresa: v })} visible={visibilidad.empresa} onToggle={() => toggleVisibilidad("empresa")} placeholder="Tu empresa (opcional)" highlight />
              <CampoVisible label="WhatsApp" valor={form.whatsapp} onChange={(v) => setForm({ ...form, whatsapp: v })} visible={visibilidad.whatsapp} onToggle={() => toggleVisibilidad("whatsapp")} placeholder="Ej: 3492123456" />
            </div>

            {/* DIRECCIÓN */}
            <div style={cardStyle}>
              <h3 style={subtituloStyle}>Ubicación</h3>
              <CampoVisible label="Dirección" valor={form.direccion} onChange={(v) => setForm({ ...form, direccion: v })} visible={visibilidad.direccion} onToggle={() => toggleVisibilidad("direccion")} placeholder="Tu dirección" icono="📍" />
              <CampoVisible label="Dirección comercial" valor={form.direccionComercial} onChange={(v) => setForm({ ...form, direccionComercial: v })} visible={visibilidad.direccionComercial} onToggle={() => toggleVisibilidad("direccionComercial")} placeholder="Dirección de tu negocio" icono="🏪" highlight />
            </div>

            {/* HORARIOS */}
            <div style={cardStyle}>
              <h3 style={subtituloStyle}>🕐 Horario disponible</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {diasSemana.map((dia) => (
                  <div key={dia} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <button onClick={() => toggleHorario(dia)} style={{
                      width: "28px", height: "28px", borderRadius: "8px", flexShrink: 0,
                      background: horarios[dia].activo ? "#d4a017" : "#f4f4f2",
                      border: `2px solid ${horarios[dia].activo ? "#d4a017" : "#e8e8e6"}`,
                      cursor: "pointer", fontSize: "14px",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      {horarios[dia].activo ? "✓" : ""}
                    </button>
                    <span style={{ fontSize: "13px", fontWeight: 700, color: horarios[dia].activo ? "#1a2a3a" : "#9a9a9a", width: "80px", flexShrink: 0 }}>{dia}</span>
                    {horarios[dia].activo ? (
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", flex: 1 }}>
                        <input type="time" value={horarios[dia].desde} onChange={(e) => setHorarios({ ...horarios, [dia]: { ...horarios[dia], desde: e.target.value } })} style={{ ...inputStyle, padding: "6px 8px", fontSize: "12px" }} />
                        <span style={{ fontSize: "12px", color: "#9a9a9a", fontWeight: 600 }}>a</span>
                        <input type="time" value={horarios[dia].hasta} onChange={(e) => setHorarios({ ...horarios, [dia]: { ...horarios[dia], hasta: e.target.value } })} style={{ ...inputStyle, padding: "6px 8px", fontSize: "12px" }} />
                      </div>
                    ) : (
                      <span style={{ fontSize: "12px", color: "#9a9a9a", fontWeight: 600 }}>No disponible</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <button style={btnPrincipalStyle}>Guardar cambios</button>
          </div>
        )}

        {/* ── ANUNCIOS ── */}
        {seccion === "anuncios" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: "4px" }}>
              {[{ n: "3", label: "Publicados" }, { n: "1", label: "Flash" }, { n: "0", label: "Vencidos" }].map((s) => (
                <div key={s.label} style={{ background: "#fff", borderRadius: "12px", padding: "14px 10px", textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                  <div style={{ fontSize: "22px", fontWeight: 900, color: "#d4a017" }}>{s.n}</div>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: "#666", textTransform: "uppercase", letterSpacing: "0.5px" }}>{s.label}</div>
                </div>
              ))}
            </div>

            {[
              { emoji: "🚗", titulo: "Toyota Corolla 2020", precio: "$18.500.000", estado: "Publicado", flash: true, conexiones: "12/100" },
              { emoji: "💻", titulo: "MacBook Air M2", precio: "$2.800.000", estado: "Publicado", flash: false, conexiones: "5/100" },
              { emoji: "🔧", titulo: "Plomero disponible", precio: "Consultar", estado: "Publicado", flash: false, conexiones: "3/100" },
            ].map((a, i) => (
              <div key={i} style={{ ...cardStyle, display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ width: "50px", height: "50px", borderRadius: "12px", background: "#f4f4f2", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "26px", flexShrink: 0 }}>
                  {a.emoji}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "13px", fontWeight: 800, color: "#1a2a3a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.titulo}</div>
                  <div style={{ fontSize: "14px", fontWeight: 900, color: "#d4a017" }}>{a.precio}</div>
                  <div style={{ fontSize: "11px", color: "#9a9a9a", fontWeight: 600 }}>🔗 {a.conexiones} conexiones</div>
                </div>
                {a.flash && <span style={{ background: "#d4a017", color: "#1a2a3a", fontSize: "9px", fontWeight: 900, padding: "3px 7px", borderRadius: "8px", textTransform: "uppercase", flexShrink: 0 }}>Flash</span>}
              </div>
            ))}

            <button style={btnPrincipalStyle}>➕ Publicar nuevo anuncio</button>
          </div>
        )}

        {/* ── ESTADÍSTICAS ── */}
        {seccion === "estadisticas" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              {[
                { n: "247", label: "Visitas totales", emoji: "👁️" },
                { n: "20", label: "Conexiones", emoji: "🔗" },
                { n: "3", label: "Anuncios activos", emoji: "📋" },
                { n: "1", label: "Grupos unidos", emoji: "👥" },
              ].map((s) => (
                <div key={s.label} style={{ background: "#fff", borderRadius: "14px", padding: "16px", textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                  <div style={{ fontSize: "24px", marginBottom: "4px" }}>{s.emoji}</div>
                  <div style={{ fontSize: "26px", fontWeight: 900, color: "#d4a017" }}>{s.n}</div>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: "#666", textTransform: "uppercase", letterSpacing: "0.5px" }}>{s.label}</div>
                </div>
              ))}
            </div>

            <div style={cardStyle}>
              <h3 style={subtituloStyle}>💰 Mis Bits</h3>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <span style={{ fontSize: "32px", fontWeight: 900, color: "#d4a017" }}>0</span>
                <span style={{ fontSize: "14px", fontWeight: 700, color: "#666" }}>Bits disponibles</span>
              </div>
              <button style={btnPrincipalStyle}>Comprar Bits</button>
            </div>
          </div>
        )}

        {/* ── PROMOTOR ── */}
        {seccion === "promotor" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ background: "linear-gradient(135deg, #1a2a3a, #243b55)", borderRadius: "16px", padding: "24px 20px", textAlign: "center" }}>
              <div style={{ fontSize: "40px", marginBottom: "8px" }}>⭐</div>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "28px", color: "#d4a017", letterSpacing: "2px", marginBottom: "4px" }}>Nexo Promotor</div>
              <div style={{ fontSize: "13px", color: "#8a9aaa", fontWeight: 600, marginBottom: "20px" }}>Ganá el 30% por cada referido que se registre</div>
              <div style={{ background: "rgba(212,160,23,0.15)", borderRadius: "12px", padding: "16px", marginBottom: "16px" }}>
                <div style={{ fontSize: "12px", color: "#8a9aaa", fontWeight: 600, marginBottom: "4px" }}>Tu código de promotor</div>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "28px", color: "#d4a017", letterSpacing: "4px" }}>AAA-00000</div>
              </div>
              <button style={btnPrincipalStyle}>Compartir mi código</button>
            </div>

            <div style={cardStyle}>
              <h3 style={subtituloStyle}>📊 Mis referidos</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
                {[{ n: "0", label: "Referidos" }, { n: "$0", label: "Ganado" }, { n: "0", label: "Este mes" }].map((s) => (
                  <div key={s.label} style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "22px", fontWeight: 900, color: "#d4a017" }}>{s.n}</div>
                    <div style={{ fontSize: "11px", fontWeight: 700, color: "#666", textTransform: "uppercase" }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
      <BottomNav />
    </main>
  );
}

// ── COMPONENTE CAMPO CON VISIBILIDAD ──
function CampoVisible({ label, valor, onChange, visible, onToggle, placeholder, icono, highlight, sinToggle }: {
  label: string; valor: string; onChange: (v: string) => void;
  visible: boolean; onToggle?: () => void; placeholder?: string;
  icono?: string; highlight?: boolean; sinToggle?: boolean;
}) {
  return (
    <div style={{ marginBottom: "14px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
        <label style={{ fontSize: "11px", fontWeight: 800, color: highlight ? "#d4a017" : "#666", textTransform: "uppercase", letterSpacing: "1px" }}>
          {icono && `${icono} `}{label}
        </label>
        {!sinToggle && (
          <button onClick={onToggle} style={{ background: visible ? "rgba(212,160,23,0.15)" : "#f4f4f2", border: `1px solid ${visible ? "#d4a017" : "#e8e8e6"}`, borderRadius: "6px", padding: "2px 8px", fontSize: "10px", fontWeight: 800, color: visible ? "#d4a017" : "#9a9a9a", cursor: "pointer", fontFamily: "'Nunito', sans-serif" }}>
            {visible ? "👁️ Se ve" : "🙈 Oculto"}
          </button>
        )}
      </div>
      <input
        type="text"
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ ...inputStyle, borderColor: highlight ? "rgba(212,160,23,0.4)" : "#e8e8e6", background: highlight ? "rgba(212,160,23,0.04)" : "#fff" }}
      />
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  background: "#fff", borderRadius: "16px", padding: "20px",
  boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
};

const subtituloStyle: React.CSSProperties = {
  fontSize: "15px", fontWeight: 900, color: "#1a2a3a", marginBottom: "16px",
};

const inputStyle: React.CSSProperties = {
  width: "100%", border: "2px solid #e8e8e6", borderRadius: "10px",
  padding: "11px 14px", fontSize: "14px", fontFamily: "'Nunito', sans-serif",
  color: "#2c2c2e", outline: "none", boxSizing: "border-box",
};

const btnPrincipalStyle: React.CSSProperties = {
  width: "100%", background: "linear-gradient(135deg, #d4a017, #f0c040)",
  color: "#1a2a3a", border: "none", borderRadius: "12px", padding: "16px",
  fontSize: "15px", fontWeight: 800, fontFamily: "'Nunito', sans-serif",
  cursor: "pointer", letterSpacing: "1px", textTransform: "uppercase",
};
