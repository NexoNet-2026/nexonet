"use client";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Rubro = { id: number; nombre: string };
type Subrubro = { id: number; nombre: string; rubro_id: number };

export default function Publicar() {
  const router = useRouter();
  const [paso, setPaso] = useState<"categoria" | "datos">("categoria");
  const [progreso, setProgreso] = useState(50);
  const [rubros, setRubros] = useState<Rubro[]>([]);
  const [subrubros, setSubrubros] = useState<Subrubro[]>([]);
  const [subrubrosFiltrados, setSubrubrosFiltrados] = useState<Subrubro[]>([]);
  const [rubroSeleccionado, setRubroSeleccionado] = useState<Rubro | null>(null);
  const [subrubroSeleccionado, setSubrubroSeleccionado] = useState<Subrubro | null>(null);
  const [loading, setLoading] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [coordenadas, setCoordenadas] = useState<{ lat: number; lng: number } | null>(null);
  const [form, setForm] = useState({
    titulo: "", descripcion: "", precio: "",
    moneda: "ARS", ciudad: "", provincia: "", direccion: "",
  });
  const [fotos, setFotos] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  useEffect(() => {
    const cargar = async () => {
      const [{ data: r }, { data: s }] = await Promise.all([
        supabase.from("rubros").select("id, nombre").order("nombre"),
        supabase.from("subrubros").select("id, nombre, rubro_id").order("nombre"),
      ]);
      if (r) setRubros(r);
      if (s) setSubrubros(s);
    };
    cargar();
  }, []);

  const seleccionarRubro = (rubro: Rubro) => {
    setRubroSeleccionado(rubro);
    setSubrubroSeleccionado(null);
    setSubrubrosFiltrados(subrubros.filter((s) => s.rubro_id === rubro.id));
  };

  const usarGPS = () => {
    if (!navigator.geolocation) { alert("Tu dispositivo no soporta GPS"); return; }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setCoordenadas({ lat, lng });
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=es`);
          const data = await res.json();
          const ciudad = data.address?.city || data.address?.town || data.address?.village || "";
          const provincia = data.address?.state || "";
          const direccion = data.display_name || "";
          setForm((prev) => ({ ...prev, ciudad, provincia, direccion }));
        } catch {}
        setGpsLoading(false);
      },
      () => { alert("No se pudo obtener la ubicación. Verificá los permisos."); setGpsLoading(false); }
    );
  };

  const buscarDireccion = async () => {
    if (!form.direccion) { alert("Escribí una dirección primero"); return; }
    setGeoLoading(true);
    try {
      const query = `${form.direccion}, ${form.ciudad}, ${form.provincia}, Argentina`;
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`);
      const data = await res.json();
      if (data.length > 0) {
        setCoordenadas({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) });
        alert("✅ Ubicación encontrada en el mapa");
      } else {
        alert("No se encontró la dirección. Probá escribirla de otra forma.");
      }
    } catch { alert("Error al buscar la dirección."); }
    setGeoLoading(false);
  };

  const irADatos = () => {
    if (!rubroSeleccionado || !subrubroSeleccionado) return;
    setPaso("datos"); setProgreso(100);
  };

  const agregarFotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (fotos.length + files.length > 5) { alert("Máximo 5 fotos"); return; }
    const nuevas = [...fotos, ...files].slice(0, 5);
    setFotos(nuevas);
    setPreviews(nuevas.map((f) => URL.createObjectURL(f)));
  };

  const eliminarFoto = (i: number) => {
    const nf = fotos.filter((_, j) => j !== i);
    setFotos(nf);
    setPreviews(nf.map((f) => URL.createObjectURL(f)));
  };

  const subirFoto = async (file: File, anuncioId: number, index: number): Promise<string> => {
    const ext = file.name.split(".").pop();
    const path = `anuncios/${anuncioId}/${index}.${ext}`;
    const { error } = await supabase.storage.from("imagenes").upload(path, file, { upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from("imagenes").getPublicUrl(path);
    return data.publicUrl;
  };

  const publicar = async () => {
    if (!form.titulo) { alert("El título es obligatorio"); return; }
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { alert("Tenés que iniciar sesión para publicar"); router.push("/login"); return; }

    const { data: anuncio, error } = await supabase.from("anuncios").insert({
      usuario_id: session.user.id,
      subrubro_id: subrubroSeleccionado?.id,
      titulo: form.titulo,
      descripcion: form.descripcion,
      precio: form.precio ? parseFloat(form.precio) : null,
      moneda: form.moneda,
      ciudad: form.ciudad,
      provincia: form.provincia,
      imagenes: [],
      estado: "activo",
      lat: coordenadas?.lat || null,
      lng: coordenadas?.lng || null,
    }).select().single();

    if (error || !anuncio) { alert("Error al publicar. Intentá de nuevo."); setLoading(false); return; }

    let urls: string[] = [];
    if (fotos.length > 0) {
      setSubiendo(true);
      try {
        urls = await Promise.all(fotos.map((f, i) => subirFoto(f, anuncio.id, i)));
        await supabase.from("anuncios").update({ imagenes: urls }).eq("id", anuncio.id);
      } catch (e) { console.error("Error subiendo fotos", e); }
      setSubiendo(false);
    }

    setLoading(false);
    router.push(`/anuncios/${anuncio.id}`);
  };

  return (
    <main style={{ paddingTop: "95px", paddingBottom: "130px", background: "#f4f4f2", minHeight: "100vh", fontFamily: "'Nunito', sans-serif" }}>
      <Header />

      <div style={{ background: "linear-gradient(135deg, #1a2a3a 0%, #243b55 100%)", padding: "12px 16px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
          {paso === "datos" && (
            <button onClick={() => { setPaso("categoria"); setProgreso(50); }} style={{ background: "none", border: "none", color: "#d4a017", fontSize: "14px", cursor: "pointer", fontFamily: "'Nunito', sans-serif" }}>← Categoría</button>
          )}
          <div style={{ fontSize: "18px", fontWeight: 900, color: "#fff" }}>
            {paso === "categoria" ? "Elegí la categoría" : "📝 Publicar anuncio"}
          </div>
        </div>
        {rubroSeleccionado && subrubroSeleccionado && (
          <div style={{ fontSize: "10px", color: "#8a9aaa", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", marginBottom: "8px" }}>
            {rubroSeleccionado.nombre} → {subrubroSeleccionado.nombre}
          </div>
        )}
        <div style={{ height: "4px", background: "rgba(255,255,255,0.15)", borderRadius: "2px" }}>
          <div style={{ height: "100%", width: `${progreso}%`, background: "#d4a017", borderRadius: "2px", transition: "width .4s ease" }} />
        </div>
      </div>

      <div style={{ padding: "16px", maxWidth: "480px", margin: "0 auto" }}>

        {/* PASO 1 */}
        {paso === "categoria" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={cardStyle}>
              <h3 style={subtituloStyle}>Rubro</h3>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {rubros.map((r) => (
                  <button key={r.id} onClick={() => seleccionarRubro(r)} style={{
                    background: rubroSeleccionado?.id === r.id ? "#d4a017" : "#f4f4f2",
                    border: `2px solid ${rubroSeleccionado?.id === r.id ? "#d4a017" : "#e8e8e6"}`,
                    borderRadius: "20px", padding: "6px 14px", fontSize: "12px", fontWeight: 700,
                    color: rubroSeleccionado?.id === r.id ? "#1a2a3a" : "#444",
                    cursor: "pointer", fontFamily: "'Nunito', sans-serif",
                  }}>{r.nombre}</button>
                ))}
              </div>
            </div>
            {subrubrosFiltrados.length > 0 && (
              <div style={cardStyle}>
                <h3 style={subtituloStyle}>Subrubro</h3>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {subrubrosFiltrados.map((s) => (
                    <button key={s.id} onClick={() => setSubrubroSeleccionado(s)} style={{
                      background: subrubroSeleccionado?.id === s.id ? "#1a2a3a" : "#f4f4f2",
                      border: `2px solid ${subrubroSeleccionado?.id === s.id ? "#1a2a3a" : "#e8e8e6"}`,
                      borderRadius: "20px", padding: "6px 14px", fontSize: "12px", fontWeight: 700,
                      color: subrubroSeleccionado?.id === s.id ? "#fff" : "#444",
                      cursor: "pointer", fontFamily: "'Nunito', sans-serif",
                    }}>{s.nombre}</button>
                  ))}
                </div>
              </div>
            )}
            <button onClick={irADatos} disabled={!rubroSeleccionado || !subrubroSeleccionado} style={{
              width: "100%", background: (!rubroSeleccionado || !subrubroSeleccionado) ? "#ccc" : "linear-gradient(135deg, #d4a017, #f0c040)",
              color: "#1a2a3a", border: "none", borderRadius: "12px", padding: "16px",
              fontSize: "15px", fontWeight: 800, fontFamily: "'Nunito', sans-serif",
              cursor: (!rubroSeleccionado || !subrubroSeleccionado) ? "not-allowed" : "pointer",
              letterSpacing: "1px", textTransform: "uppercase",
            }}>Siguiente →</button>
          </div>
        )}

        {/* PASO 2 */}
        {paso === "datos" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>

            {/* TÍTULO Y DESCRIPCIÓN */}
            <div style={cardStyle}>
              <Campo label="Título *" value={form.titulo} onChange={(v) => setForm({ ...form, titulo: v })} placeholder="Ej: iPhone 14 Pro 128GB" />
              <Campo label="Descripción" value={form.descripcion} onChange={(v) => setForm({ ...form, descripcion: v })} placeholder="Describí tu producto o servicio..." textarea />
              <div style={{ display: "flex", gap: "10px" }}>
                <div style={{ flex: 1 }}>
                  <Campo label="Precio" value={form.precio} onChange={(v) => setForm({ ...form, precio: v })} placeholder="0" type="number" />
                </div>
                <div style={{ width: "90px" }}>
                  <label style={labelStyle}>Moneda</label>
                  <select value={form.moneda} onChange={(e) => setForm({ ...form, moneda: e.target.value })} style={{ ...inputStyle, padding: "11px 10px" }}>
                    <option value="ARS">ARS $</option>
                    <option value="USD">USD U$D</option>
                  </select>
                </div>
              </div>
            </div>

            {/* UBICACIÓN PRIMERO */}
            <div style={cardStyle}>
              <h3 style={subtituloStyle}>📍 Ubicación</h3>

              {/* BOTÓN GPS */}
              <button onClick={usarGPS} disabled={gpsLoading} style={{
                width: "100%",
                background: coordenadas
                  ? "linear-gradient(135deg, #2d6a4f, #40916c)"
                  : "linear-gradient(135deg, #1a2a3a, #243b55)",
                color: "#fff", border: "none", borderRadius: "12px", padding: "14px",
                fontSize: "14px", fontWeight: 800, cursor: "pointer",
                fontFamily: "'Nunito', sans-serif", marginBottom: "12px",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
              }}>
                {gpsLoading ? "📡 Obteniendo ubicación..." : coordenadas ? "✅ Ubicación GPS obtenida" : "📡 Usar mi ubicación GPS"}
              </button>

              {/* RESULTADO GPS */}
              {coordenadas && (
                <div style={{ padding: "10px 14px", background: "#f0f8f0", borderRadius: "10px", marginBottom: "12px" }}>
                  <div style={{ fontSize: "12px", fontWeight: 800, color: "#2d6a4f", marginBottom: "2px" }}>
                    📍 {form.ciudad}{form.provincia ? `, ${form.provincia}` : ""}
                  </div>
                  <div style={{ fontSize: "11px", color: "#666" }}>
                    Lat: {coordenadas.lat.toFixed(5)} | Lng: {coordenadas.lng.toFixed(5)}
                  </div>
                </div>
              )}

              {/* SEPARADOR */}
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                <div style={{ flex: 1, height: "1px", background: "#e8e8e6" }} />
                <span style={{ fontSize: "11px", fontWeight: 700, color: "#9a9a9a" }}>O completá manualmente</span>
                <div style={{ flex: 1, height: "1px", background: "#e8e8e6" }} />
              </div>

              {/* CIUDAD Y PROVINCIA MANUAL */}
              <div style={{ display: "flex", gap: "10px", marginBottom: "12px" }}>
                <Campo label="Ciudad" value={form.ciudad} onChange={(v) => setForm({ ...form, ciudad: v })} placeholder="Tu ciudad" />
                <Campo label="Provincia" value={form.provincia} onChange={(v) => setForm({ ...form, provincia: v })} placeholder="Provincia" />
              </div>

              {/* DIRECCIÓN MANUAL */}
              <label style={labelStyle}>Dirección</label>
              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  type="text"
                  value={form.direccion}
                  onChange={(e) => setForm({ ...form, direccion: e.target.value })}
                  placeholder="Ej: San Martín 500, Rafaela"
                  style={{ ...inputStyle, flex: 1 }}
                />
                <button onClick={buscarDireccion} disabled={geoLoading} style={{
                  background: "#d4a017", border: "none", borderRadius: "10px", padding: "0 14px",
                  fontSize: "13px", fontWeight: 800, color: "#1a2a3a", cursor: "pointer",
                  fontFamily: "'Nunito', sans-serif", whiteSpace: "nowrap",
                }}>{geoLoading ? "..." : "Buscar"}</button>
              </div>
            </div>

            {/* FOTOS */}
            <div style={cardStyle}>
              <h3 style={subtituloStyle}>📷 Fotos (hasta 5)</h3>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "14px" }}>
                {previews.map((p, i) => (
                  <div key={i} style={{ width: "80px", height: "80px", borderRadius: "10px", overflow: "hidden", position: "relative" }}>
                    <img src={p} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    <button onClick={() => eliminarFoto(i)} style={{
                      position: "absolute", top: "2px", right: "2px", background: "rgba(0,0,0,0.6)",
                      border: "none", borderRadius: "50%", width: "20px", height: "20px",
                      color: "#fff", fontSize: "12px", cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>✕</button>
                  </div>
                ))}
              </div>
              {fotos.length < 5 && (
                <div style={{ display: "flex", gap: "10px" }}>
                  <label style={{
                    flex: 1, background: "linear-gradient(135deg, #1a2a3a, #243b55)",
                    borderRadius: "12px", padding: "14px", display: "flex",
                    alignItems: "center", justifyContent: "center", gap: "8px",
                    cursor: "pointer", color: "#fff", fontSize: "13px", fontWeight: 800,
                  }}>
                    📷 Cámara
                    <input type="file" accept="image/*" capture="environment" onChange={agregarFotos} style={{ display: "none" }} />
                  </label>
                  <label style={{
                    flex: 1, background: "linear-gradient(135deg, #d4a017, #f0c040)",
                    borderRadius: "12px", padding: "14px", display: "flex",
                    alignItems: "center", justifyContent: "center", gap: "8px",
                    cursor: "pointer", color: "#1a2a3a", fontSize: "13px", fontWeight: 800,
                  }}>
                    🖼️ Galería
                    <input type="file" accept="image/*" multiple onChange={agregarFotos} style={{ display: "none" }} />
                  </label>
                </div>
              )}
            </div>

            <button onClick={publicar} disabled={loading || subiendo} style={{
              width: "100%", background: (loading || subiendo) ? "#ccc" : "linear-gradient(135deg, #d4a017, #f0c040)",
              color: "#1a2a3a", border: "none", borderRadius: "12px", padding: "16px",
              fontSize: "15px", fontWeight: 800, fontFamily: "'Nunito', sans-serif",
              cursor: (loading || subiendo) ? "not-allowed" : "pointer",
              letterSpacing: "1px", textTransform: "uppercase",
            }}>
              {subiendo ? "Subiendo fotos..." : loading ? "Publicando..." : "🚀 Publicar anuncio"}
            </button>
          </div>
        )}
      </div>
      <BottomNav />
    </main>
  );
}

function Campo({ label, value, onChange, placeholder, type = "text", textarea }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; textarea?: boolean;
}) {
  return (
    <div style={{ marginBottom: "14px" }}>
      <label style={labelStyle}>{label}</label>
      {textarea
        ? <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={4} style={{ ...inputStyle, resize: "vertical" }} />
        : <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={inputStyle} />
      }
    </div>
  );
}

const cardStyle: React.CSSProperties = { background: "#fff", borderRadius: "16px", padding: "20px", boxShadow: "0 2px 10px rgba(0,0,0,0.06)" };
const subtituloStyle: React.CSSProperties = { fontSize: "15px", fontWeight: 900, color: "#1a2a3a", marginBottom: "14px" };
const labelStyle: React.CSSProperties = { display: "block", fontSize: "11px", fontWeight: 800, color: "#666", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "6px" };
const inputStyle: React.CSSProperties = { width: "100%", border: "2px solid #e8e8e6", borderRadius: "10px", padding: "11px 14px", fontSize: "14px", fontFamily: "'Nunito', sans-serif", color: "#2c2c2e", outline: "none", boxSizing: "border-box" };
