"use client";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Rubro = { id: number; nombre: string };
type Subrubro = { id: number; nombre: string; rubro_id: number };

// ── Helpers para embeds ──
function getLinkEmbed(url: string): { tipo: "youtube"|"instagram"|"facebook"|"mercadolibre"|"otro"; embedUrl: string|null } {
  if (!url) return { tipo:"otro", embedUrl:null };
  const u = url.toLowerCase();
  if (u.includes("youtube.com/watch")) {
    const id = url.split("v=")[1]?.split("&")[0];
    return { tipo:"youtube", embedUrl: id ? `https://www.youtube.com/embed/${id}` : null };
  }
  if (u.includes("youtu.be/")) {
    const id = url.split("youtu.be/")[1]?.split("?")[0];
    return { tipo:"youtube", embedUrl: id ? `https://www.youtube.com/embed/${id}` : null };
  }
  if (u.includes("instagram.com")) return { tipo:"instagram", embedUrl:null };
  if (u.includes("facebook.com")) return { tipo:"facebook", embedUrl:null };
  if (u.includes("mercadolibre.com")) return { tipo:"mercadolibre", embedUrl:null };
  return { tipo:"otro", embedUrl:null };
}

const LINK_ICONOS: Record<string,string> = {
  youtube:"▶️", instagram:"📸", facebook:"👤", mercadolibre:"🛍️", otro:"🔗"
};

export default function Publicar() {
  const router = useRouter();
  const [paso, setPaso] = useState<"categoria"|"datos">("categoria");
  const [progreso, setProgreso] = useState(50);
  const [rubros, setRubros] = useState<Rubro[]>([]);
  const [subrubros, setSubrubros] = useState<Subrubro[]>([]);
  const [subrubrosFiltrados, setSubrubrosFiltrados] = useState<Subrubro[]>([]);
  const [rubroSeleccionado, setRubroSeleccionado] = useState<Rubro|null>(null);
  const [subrubroSeleccionado, setSubrubroSeleccionado] = useState<Subrubro|null>(null);
  const [loading, setLoading] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [coordenadas, setCoordenadas] = useState<{lat:number;lng:number}|null>(null);
  const [form, setForm] = useState({ titulo:"", descripcion:"", precio:"", moneda:"ARS", ciudad:"", provincia:"", direccion:"" });
  const [fotos, setFotos] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  // ── Links ──
  const [linksHabilitados, setLinksHabilitados] = useState(false); // true si pagó
  const [links, setLinks] = useState<string[]>([""]);
  const [linkExpandido, setLinkExpandido] = useState<number|null>(null);
  const [popupLink, setPopupLink] = useState(false);

  // ── Archivos ──
  const [archivosHabilitados, setArchivosHabilitados] = useState(false);
  const [archivos, setArchivos] = useState<File[]>([]);
  const [archivosPrev, setArchivosPrev] = useState<string[]>([]);
  const [archivoExpandido, setArchivoExpandido] = useState<number|null>(null);
  const [popupArchivo, setPopupArchivo] = useState(false);

  useEffect(() => {
    const cargar = async () => {
      const [{ data:r },{ data:s }] = await Promise.all([
        supabase.from("rubros").select("id,nombre").order("nombre"),
        supabase.from("subrubros").select("id,nombre,rubro_id").order("nombre"),
      ]);
      if (r) setRubros(r);
      if (s) setSubrubros(s);
    };
    cargar();
  }, []);

  const seleccionarRubro = (rubro: Rubro) => {
    setRubroSeleccionado(rubro);
    setSubrubroSeleccionado(null);
    setSubrubrosFiltrados(subrubros.filter(s => s.rubro_id === rubro.id));
  };

  const usarGPS = () => {
    if (!navigator.geolocation) { alert("Tu dispositivo no soporta GPS"); return; }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(async pos => {
      const { latitude:lat, longitude:lng } = pos.coords;
      setCoordenadas({ lat, lng });
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=es`);
        const data = await res.json();
        setForm(prev => ({
          ...prev,
          ciudad: data.address?.city || data.address?.town || data.address?.village || "",
          provincia: data.address?.state || "",
          direccion: data.display_name || "",
        }));
      } catch {}
      setGpsLoading(false);
    }, () => { alert("No se pudo obtener la ubicación."); setGpsLoading(false); });
  };

  const buscarDireccion = async () => {
    if (!form.direccion) { alert("Escribí una dirección primero"); return; }
    setGeoLoading(true);
    try {
      const q = `${form.direccion}, ${form.ciudad}, ${form.provincia}, Argentina`;
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1`);
      const data = await res.json();
      if (data.length > 0) {
        setCoordenadas({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) });
        alert("✅ Ubicación encontrada en el mapa");
      } else alert("No se encontró la dirección.");
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
    const nuevas = [...fotos, ...files].slice(0,5);
    setFotos(nuevas);
    setPreviews(nuevas.map(f => URL.createObjectURL(f)));
  };

  const eliminarFoto = (i:number) => {
    const nf = fotos.filter((_,j) => j!==i);
    setFotos(nf);
    setPreviews(nf.map(f => URL.createObjectURL(f)));
  };

  // ── Links handlers ──
  const actualizarLink = (i:number, val:string) => {
    const arr = [...links]; arr[i] = val; setLinks(arr);
    // Si el último tiene texto, agregar uno vacío
    if (i === links.length-1 && val.trim() !== "") setLinks([...arr, ""]);
  };
  const eliminarLink = (i:number) => {
    const arr = links.filter((_,j) => j!==i);
    setLinks(arr.length ? arr : [""]);
  };

  // ── Archivos handlers ──
  const agregarArchivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (archivos.length + files.length > 5) { alert("Máximo 5 archivos"); return; }
    const nuevos = [...archivos, ...files].slice(0,5);
    setArchivos(nuevos);
    setArchivosPrev(nuevos.map(f => f.type.startsWith("image/") ? URL.createObjectURL(f) : ""));
  };
  const eliminarArchivo = (i:number) => {
    const na = archivos.filter((_,j) => j!==i);
    setArchivos(na);
    setArchivosPrev(na.map(f => f.type.startsWith("image/") ? URL.createObjectURL(f) : ""));
  };

  const subirFoto = async (file:File, anuncioId:number, index:number): Promise<string> => {
    const ext = file.name.split(".").pop();
    const path = `anuncios/${anuncioId}/${index}.${ext}`;
    const { error } = await supabase.storage.from("imagenes").upload(path, file, { upsert:true });
    if (error) throw error;
    const { data } = supabase.storage.from("imagenes").getPublicUrl(path);
    return data.publicUrl;
  };

  const publicar = async () => {
    if (!form.titulo) { alert("El título es obligatorio"); return; }
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { alert("Tenés que iniciar sesión para publicar"); router.push("/login"); return; }

    const linksLimpios = links.filter(l => l.trim() !== "");

    const { data:anuncio, error } = await supabase.from("anuncios").insert({
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
      links: linksLimpios.length ? linksLimpios : null,
    }).select().single();

    if (error || !anuncio) { alert("Error al publicar."); setLoading(false); return; }

    if (fotos.length > 0) {
      setSubiendo(true);
      try {
        const urls = await Promise.all(fotos.map((f,i) => subirFoto(f, anuncio.id, i)));
        await supabase.from("anuncios").update({ imagenes: urls }).eq("id", anuncio.id);
      } catch(e) { console.error(e); }
      setSubiendo(false);
    }

    setLoading(false);
    router.push(`/anuncios/${anuncio.id}`);
  };

  const linksConValor = links.filter(l => l.trim() !== "");

  return (
    <main style={{ paddingTop:"95px", paddingBottom:"130px", background:"#f4f4f2", minHeight:"100vh", fontFamily:"'Nunito',sans-serif" }}>
      <Header />

      {/* POPUP LINK */}
      {popupLink && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", zIndex:1000, display:"flex", alignItems:"flex-end", justifyContent:"center" }}>
          <div style={{ background:"#fff", borderRadius:"20px 20px 0 0", padding:"28px 24px 40px", width:"100%", maxWidth:"480px" }}>
            <div style={{ fontSize:"22px", fontWeight:900, color:"#1a2a3a", marginBottom:"6px" }}>🔗 Link Multimedia</div>
            <div style={{ fontSize:"13px", color:"#555", fontWeight:600, marginBottom:"18px", lineHeight:1.5 }}>
              Adjuntá links externos a tu anuncio para que los compradores vean más contenido:
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:"10px", marginBottom:"22px" }}>
              {[["▶️","YouTube","Videos de tu producto o servicio"],["📸","Instagram","Posts o reels de tu cuenta"],["👤","Facebook","Publicaciones o página"],["🛍️","Mercado Libre","Tu publicación en ML"],["🔗","Cualquier URL","Sitio web, TikTok, etc"]].map(([ico,nom,desc])=>(
                <div key={nom} style={{ display:"flex", alignItems:"center", gap:"12px", padding:"10px 14px", background:"#f4f4f2", borderRadius:"12px" }}>
                  <span style={{ fontSize:"22px" }}>{ico}</span>
                  <div>
                    <div style={{ fontSize:"13px", fontWeight:800, color:"#1a2a3a" }}>{nom}</div>
                    <div style={{ fontSize:"11px", color:"#9a9a9a", fontWeight:600 }}>{desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ background:"linear-gradient(135deg,#1a2a3a,#243b55)", borderRadius:"14px", padding:"16px", marginBottom:"16px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div>
                <div style={{ fontSize:"13px", fontWeight:900, color:"#d4a017" }}>💰 Precio</div>
                <div style={{ fontSize:"22px", fontWeight:900, color:"#fff" }}>$500 <span style={{ fontSize:"12px", color:"#8a9aaa" }}>/ por anuncio</span></div>
              </div>
              <div style={{ fontSize:"11px", color:"#8a9aaa", fontWeight:600, maxWidth:"120px", textAlign:"right" }}>Links ilimitados una vez habilitado</div>
            </div>
            <button onClick={() => router.push("/comprar?producto=link")} style={{ width:"100%", background:"linear-gradient(135deg,#d4a017,#f0c040)", border:"none", borderRadius:"12px", padding:"15px", fontSize:"15px", fontWeight:900, color:"#1a2a3a", cursor:"pointer", fontFamily:"'Nunito',sans-serif", marginBottom:"10px" }}>
              🚀 Comprar por $500
            </button>
            <button onClick={() => setPopupLink(false)} style={{ width:"100%", background:"none", border:"2px solid #e8e8e6", borderRadius:"12px", padding:"13px", fontSize:"14px", fontWeight:700, color:"#9a9a9a", cursor:"pointer", fontFamily:"'Nunito',sans-serif" }}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* POPUP ARCHIVO */}
      {popupArchivo && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", zIndex:1000, display:"flex", alignItems:"flex-end", justifyContent:"center" }}>
          <div style={{ background:"#fff", borderRadius:"20px 20px 0 0", padding:"28px 24px 40px", width:"100%", maxWidth:"480px" }}>
            <div style={{ fontSize:"22px", fontWeight:900, color:"#1a2a3a", marginBottom:"6px" }}>📎 Archivos Adjuntos</div>
            <div style={{ fontSize:"13px", color:"#555", fontWeight:600, marginBottom:"18px", lineHeight:1.5 }}>
              Adjuntá archivos para mostrar más detalles de tu producto o servicio:
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:"10px", marginBottom:"22px" }}>
              {[["📄","PDF","Catálogos, fichas técnicas, manuales"],["🖼️","Imágenes","Fotos adicionales, diseños, planos"],["📊","Excel / Word","Listas de precios, presupuestos"],["🎵","Audio / Video","Demostraciones, tutoriales"]].map(([ico,nom,desc])=>(
                <div key={nom} style={{ display:"flex", alignItems:"center", gap:"12px", padding:"10px 14px", background:"#f4f4f2", borderRadius:"12px" }}>
                  <span style={{ fontSize:"22px" }}>{ico}</span>
                  <div>
                    <div style={{ fontSize:"13px", fontWeight:800, color:"#1a2a3a" }}>{nom}</div>
                    <div style={{ fontSize:"11px", color:"#9a9a9a", fontWeight:600 }}>{desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ background:"linear-gradient(135deg,#1a2a3a,#243b55)", borderRadius:"14px", padding:"16px", marginBottom:"16px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div>
                <div style={{ fontSize:"13px", fontWeight:900, color:"#d4a017" }}>💰 Precio</div>
                <div style={{ fontSize:"22px", fontWeight:900, color:"#fff" }}>$500 <span style={{ fontSize:"12px", color:"#8a9aaa" }}>/ por anuncio</span></div>
              </div>
              <div style={{ fontSize:"11px", color:"#8a9aaa", fontWeight:600, maxWidth:"120px", textAlign:"right" }}>Hasta 5 archivos una vez habilitado</div>
            </div>
            <button onClick={() => router.push("/comprar?producto=archivos")} style={{ width:"100%", background:"linear-gradient(135deg,#d4a017,#f0c040)", border:"none", borderRadius:"12px", padding:"15px", fontSize:"15px", fontWeight:900, color:"#1a2a3a", cursor:"pointer", fontFamily:"'Nunito',sans-serif", marginBottom:"10px" }}>
              🚀 Comprar por $500
            </button>
            <button onClick={() => setPopupArchivo(false)} style={{ width:"100%", background:"none", border:"2px solid #e8e8e6", borderRadius:"12px", padding:"13px", fontSize:"14px", fontWeight:700, color:"#9a9a9a", cursor:"pointer", fontFamily:"'Nunito',sans-serif" }}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* LINK EXPANDIDO */}
      {linkExpandido !== null && links[linkExpandido] && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.85)", zIndex:999, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"20px" }}>
          <div style={{ width:"100%", maxWidth:"560px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"12px" }}>
              <div style={{ fontSize:"13px", fontWeight:700, color:"#fff", wordBreak:"break-all" }}>{links[linkExpandido]}</div>
              <button onClick={() => setLinkExpandido(null)} style={{ background:"rgba(255,255,255,0.15)", border:"none", borderRadius:"50%", width:"36px", height:"36px", color:"#fff", fontSize:"18px", cursor:"pointer", flexShrink:0, marginLeft:"12px" }}>✕</button>
            </div>
            {(() => {
              const { tipo, embedUrl } = getLinkEmbed(links[linkExpandido]);
              if (embedUrl) return (
                <iframe src={embedUrl} style={{ width:"100%", aspectRatio:"16/9", borderRadius:"14px", border:"none" }} allowFullScreen />
              );
              return (
                <div style={{ background:"#fff", borderRadius:"14px", padding:"24px", textAlign:"center" }}>
                  <div style={{ fontSize:"40px", marginBottom:"10px" }}>{LINK_ICONOS[tipo]}</div>
                  <div style={{ fontSize:"14px", fontWeight:700, color:"#1a2a3a", marginBottom:"16px" }}>Ver en {tipo.charAt(0).toUpperCase()+tipo.slice(1)}</div>
                  <a href={links[linkExpandido]} target="_blank" rel="noopener noreferrer" style={{ background:"linear-gradient(135deg,#d4a017,#f0c040)", color:"#1a2a3a", borderRadius:"10px", padding:"12px 24px", fontSize:"13px", fontWeight:800, textDecoration:"none", display:"inline-block" }}>
                    Abrir enlace →
                  </a>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ARCHIVO EXPANDIDO */}
      {archivoExpandido !== null && archivos[archivoExpandido] && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.85)", zIndex:999, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"20px" }}>
          <div style={{ width:"100%", maxWidth:"560px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"12px" }}>
              <div style={{ fontSize:"13px", fontWeight:700, color:"#fff" }}>{archivos[archivoExpandido].name}</div>
              <button onClick={() => setArchivoExpandido(null)} style={{ background:"rgba(255,255,255,0.15)", border:"none", borderRadius:"50%", width:"36px", height:"36px", color:"#fff", fontSize:"18px", cursor:"pointer" }}>✕</button>
            </div>
            {archivos[archivoExpandido].type.startsWith("image/") && archivosPrev[archivoExpandido] ? (
              <img src={archivosPrev[archivoExpandido]} alt="" style={{ width:"100%", borderRadius:"14px", maxHeight:"70vh", objectFit:"contain" }} />
            ) : (
              <div style={{ background:"#fff", borderRadius:"14px", padding:"30px", textAlign:"center" }}>
                <div style={{ fontSize:"48px", marginBottom:"10px" }}>📄</div>
                <div style={{ fontSize:"14px", fontWeight:700, color:"#1a2a3a" }}>{archivos[archivoExpandido].name}</div>
                <div style={{ fontSize:"12px", color:"#9a9a9a", marginTop:"6px" }}>{(archivos[archivoExpandido].size/1024).toFixed(1)} KB</div>
              </div>
            )}
          </div>
        </div>
      )}

      <div style={{ background:"linear-gradient(135deg,#1a2a3a,#243b55)", padding:"12px 16px 0" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom:"10px" }}>
          {paso==="datos" && (
            <button onClick={() => { setPaso("categoria"); setProgreso(50); }} style={{ background:"none", border:"none", color:"#d4a017", fontSize:"14px", cursor:"pointer", fontFamily:"'Nunito',sans-serif" }}>← Categoría</button>
          )}
          <div style={{ fontSize:"18px", fontWeight:900, color:"#fff" }}>
            {paso==="categoria" ? "Elegí la categoría" : "📝 Publicar anuncio"}
          </div>
        </div>
        {rubroSeleccionado && subrubroSeleccionado && (
          <div style={{ fontSize:"10px", color:"#8a9aaa", fontWeight:700, letterSpacing:"1px", textTransform:"uppercase", marginBottom:"8px" }}>
            {rubroSeleccionado.nombre} → {subrubroSeleccionado.nombre}
          </div>
        )}
        <div style={{ height:"4px", background:"rgba(255,255,255,0.15)", borderRadius:"2px" }}>
          <div style={{ height:"100%", width:`${progreso}%`, background:"#d4a017", borderRadius:"2px", transition:"width .4s ease" }} />
        </div>
      </div>

      <div style={{ padding:"16px", maxWidth:"480px", margin:"0 auto" }}>

        {/* PASO 1 */}
        {paso==="categoria" && (
          <div style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
            <div style={cardStyle}>
              <h3 style={subtituloStyle}>Rubro</h3>
              <div style={{ display:"flex", flexWrap:"wrap", gap:"8px" }}>
                {rubros.map(r => (
                  <button key={r.id} onClick={() => seleccionarRubro(r)} style={{ background:rubroSeleccionado?.id===r.id?"#d4a017":"#f4f4f2", border:`2px solid ${rubroSeleccionado?.id===r.id?"#d4a017":"#e8e8e6"}`, borderRadius:"20px", padding:"6px 14px", fontSize:"12px", fontWeight:700, color:rubroSeleccionado?.id===r.id?"#1a2a3a":"#444", cursor:"pointer", fontFamily:"'Nunito',sans-serif" }}>{r.nombre}</button>
                ))}
              </div>
            </div>
            {subrubrosFiltrados.length>0 && (
              <div style={cardStyle}>
                <h3 style={subtituloStyle}>Subrubro</h3>
                <div style={{ display:"flex", flexWrap:"wrap", gap:"8px" }}>
                  {subrubrosFiltrados.map(s => (
                    <button key={s.id} onClick={() => setSubrubroSeleccionado(s)} style={{ background:subrubroSeleccionado?.id===s.id?"#1a2a3a":"#f4f4f2", border:`2px solid ${subrubroSeleccionado?.id===s.id?"#1a2a3a":"#e8e8e6"}`, borderRadius:"20px", padding:"6px 14px", fontSize:"12px", fontWeight:700, color:subrubroSeleccionado?.id===s.id?"#fff":"#444", cursor:"pointer", fontFamily:"'Nunito',sans-serif" }}>{s.nombre}</button>
                  ))}
                </div>
              </div>
            )}
            <button onClick={irADatos} disabled={!rubroSeleccionado||!subrubroSeleccionado} style={{ width:"100%", background:(!rubroSeleccionado||!subrubroSeleccionado)?"#ccc":"linear-gradient(135deg,#d4a017,#f0c040)", color:"#1a2a3a", border:"none", borderRadius:"12px", padding:"16px", fontSize:"15px", fontWeight:800, fontFamily:"'Nunito',sans-serif", cursor:(!rubroSeleccionado||!subrubroSeleccionado)?"not-allowed":"pointer", letterSpacing:"1px", textTransform:"uppercase" }}>Siguiente →</button>
          </div>
        )}

        {/* PASO 2 */}
        {paso==="datos" && (
          <div style={{ display:"flex", flexDirection:"column", gap:"14px" }}>

            {/* TÍTULO Y DESCRIPCIÓN */}
            <div style={cardStyle}>
              <Campo label="Título *" value={form.titulo} onChange={v => setForm({...form,titulo:v})} placeholder="Ej: iPhone 14 Pro 128GB" />
              <Campo label="Descripción" value={form.descripcion} onChange={v => setForm({...form,descripcion:v})} placeholder="Describí tu producto o servicio..." textarea />
              <div style={{ display:"flex", gap:"10px" }}>
                <div style={{ flex:1 }}><Campo label="Precio" value={form.precio} onChange={v => setForm({...form,precio:v})} placeholder="0" type="number" /></div>
                <div style={{ width:"90px" }}>
                  <label style={labelStyle}>Moneda</label>
                  <select value={form.moneda} onChange={e => setForm({...form,moneda:e.target.value})} style={{...inputStyle,padding:"11px 10px"}}>
                    <option value="ARS">ARS $</option>
                    <option value="USD">USD U$D</option>
                  </select>
                </div>
              </div>
            </div>

            {/* UBICACIÓN */}
            <div style={cardStyle}>
              <h3 style={subtituloStyle}>📍 Ubicación</h3>
              <button onClick={usarGPS} disabled={gpsLoading} style={{ width:"100%", background:coordenadas?"linear-gradient(135deg,#2d6a4f,#40916c)":"linear-gradient(135deg,#1a2a3a,#243b55)", color:"#fff", border:"none", borderRadius:"12px", padding:"14px", fontSize:"14px", fontWeight:800, cursor:"pointer", fontFamily:"'Nunito',sans-serif", marginBottom:"12px", display:"flex", alignItems:"center", justifyContent:"center", gap:"8px" }}>
                {gpsLoading ? "📡 Obteniendo ubicación..." : coordenadas ? "✅ Ubicación GPS obtenida" : "📡 Usar mi ubicación GPS"}
              </button>
              {coordenadas && (
                <div style={{ padding:"10px 14px", background:"#f0f8f0", borderRadius:"10px", marginBottom:"12px" }}>
                  <div style={{ fontSize:"12px", fontWeight:800, color:"#2d6a4f" }}>📍 {form.ciudad}{form.provincia?`, ${form.provincia}`:""}</div>
                  <div style={{ fontSize:"11px", color:"#666" }}>Lat: {coordenadas.lat.toFixed(5)} | Lng: {coordenadas.lng.toFixed(5)}</div>
                </div>
              )}
              <div style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom:"12px" }}>
                <div style={{ flex:1, height:"1px", background:"#e8e8e6" }} />
                <span style={{ fontSize:"11px", fontWeight:700, color:"#9a9a9a" }}>O completá manualmente</span>
                <div style={{ flex:1, height:"1px", background:"#e8e8e6" }} />
              </div>
              <div style={{ display:"flex", gap:"10px", marginBottom:"12px" }}>
                <Campo label="Ciudad" value={form.ciudad} onChange={v => setForm({...form,ciudad:v})} placeholder="Tu ciudad" />
                <Campo label="Provincia" value={form.provincia} onChange={v => setForm({...form,provincia:v})} placeholder="Provincia" />
              </div>
              <label style={labelStyle}>Dirección</label>
              <div style={{ display:"flex", gap:"8px" }}>
                <input type="text" value={form.direccion} onChange={e => setForm({...form,direccion:e.target.value})} placeholder="Ej: San Martín 500, Rafaela" style={{...inputStyle,flex:1}} />
                <button onClick={buscarDireccion} disabled={geoLoading} style={{ background:"#d4a017", border:"none", borderRadius:"10px", padding:"0 14px", fontSize:"13px", fontWeight:800, color:"#1a2a3a", cursor:"pointer", fontFamily:"'Nunito',sans-serif" }}>{geoLoading?"...":"Buscar"}</button>
              </div>
            </div>

            {/* FOTOS */}
            <div style={cardStyle}>
              <h3 style={subtituloStyle}>📷 Fotos (hasta 5)</h3>
              {previews.length>0 && (
                <div style={{ display:"flex", gap:"10px", flexWrap:"wrap", marginBottom:"14px" }}>
                  {previews.map((p,i) => (
                    <div key={i} style={{ width:"80px", height:"80px", borderRadius:"10px", overflow:"hidden", position:"relative" }}>
                      <img src={p} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                      <button onClick={() => eliminarFoto(i)} style={{ position:"absolute", top:"2px", right:"2px", background:"rgba(0,0,0,0.6)", border:"none", borderRadius:"50%", width:"20px", height:"20px", color:"#fff", fontSize:"12px", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>
                    </div>
                  ))}
                </div>
              )}
              {fotos.length<5 && (
                <div style={{ display:"flex", gap:"10px" }}>
                  <label style={{ flex:1, background:"linear-gradient(135deg,#1a2a3a,#243b55)", borderRadius:"12px", padding:"14px", display:"flex", alignItems:"center", justifyContent:"center", gap:"8px", cursor:"pointer", color:"#fff", fontSize:"13px", fontWeight:800 }}>
                    📷 Cámara
                    <input type="file" accept="image/*" capture="environment" onChange={agregarFotos} style={{ display:"none" }} />
                  </label>
                  <label style={{ flex:1, background:"linear-gradient(135deg,#d4a017,#f0c040)", borderRadius:"12px", padding:"14px", display:"flex", alignItems:"center", justifyContent:"center", gap:"8px", cursor:"pointer", color:"#1a2a3a", fontSize:"13px", fontWeight:800 }}>
                    🖼️ Galería
                    <input type="file" accept="image/*" multiple onChange={agregarFotos} style={{ display:"none" }} />
                  </label>
                </div>
              )}
            </div>

            {/* ── LINKS ── */}
            <div style={cardStyle}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"14px" }}>
                <h3 style={{...subtituloStyle, marginBottom:0}}>🔗 Links multimedia</h3>
                {!linksHabilitados && (
                  <button onClick={() => setPopupLink(true)} style={{ background:"linear-gradient(135deg,#d4a017,#f0c040)", border:"none", borderRadius:"20px", padding:"6px 14px", fontSize:"11px", fontWeight:900, color:"#1a2a3a", cursor:"pointer", fontFamily:"'Nunito',sans-serif", whiteSpace:"nowrap" }}>
                    💰 Comprar $500
                  </button>
                )}
              </div>

              {!linksHabilitados ? (
                <div style={{ background:"#f9f7f0", borderRadius:"12px", padding:"14px", border:"2px dashed #e8d5a0" }}>
                  <div style={{ fontSize:"12px", color:"#9a9a9a", fontWeight:600, textAlign:"center", marginBottom:"8px" }}>
                    Agregá links de YouTube, Instagram, Facebook, Mercado Libre y más
                  </div>
                  <div style={{ display:"flex", justifyContent:"center", gap:"10px", fontSize:"22px" }}>
                    {["▶️","📸","👤","🛍️","🔗"].map(i => <span key={i}>{i}</span>)}
                  </div>
                  {/* DEMO: botón para habilitar sin pagar (en producción esto lo habilita el backend tras el pago) */}
                  <button onClick={() => setLinksHabilitados(true)} style={{ width:"100%", marginTop:"12px", background:"none", border:"2px solid #d4a017", borderRadius:"10px", padding:"8px", fontSize:"11px", fontWeight:700, color:"#d4a017", cursor:"pointer", fontFamily:"'Nunito',sans-serif" }}>
                    [DEMO] Habilitar sin pagar
                  </button>
                </div>
              ) : (
                <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
                  {links.map((link, i) => {
                    const { tipo, embedUrl } = getLinkEmbed(link);
                    const tieneLink = link.trim() !== "";
                    return (
                      <div key={i}>
                        <div style={{ display:"flex", gap:"8px", alignItems:"center" }}>
                          {tieneLink && <span style={{ fontSize:"18px", flexShrink:0 }}>{LINK_ICONOS[tipo]}</span>}
                          <input
                            type="url"
                            value={link}
                            onChange={e => actualizarLink(i, e.target.value)}
                            placeholder="Pegá el link (YouTube, Instagram, etc)"
                            style={{...inputStyle, flex:1, fontSize:"13px", padding:"10px 12px"}}
                          />
                          {tieneLink && (
                            <>
                              <button onClick={() => setLinkExpandido(i)} title="Ver" style={{ background:"#1a2a3a", border:"none", borderRadius:"8px", width:"36px", height:"36px", color:"#d4a017", fontSize:"16px", cursor:"pointer", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center" }}>⛶</button>
                              <button onClick={() => eliminarLink(i)} style={{ background:"rgba(231,76,60,0.1)", border:"2px solid rgba(231,76,60,0.2)", borderRadius:"8px", width:"36px", height:"36px", color:"#e74c3c", fontSize:"16px", cursor:"pointer", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>
                            </>
                          )}
                        </div>
                        {/* PREVIEW EMBED */}
                        {tieneLink && embedUrl && (
                          <div style={{ marginTop:"8px", borderRadius:"12px", overflow:"hidden", border:"2px solid #e8e8e6", position:"relative" }}>
                            <iframe src={embedUrl} style={{ width:"100%", aspectRatio:"16/9", border:"none", display:"block" }} allowFullScreen />
                            <button onClick={() => setLinkExpandido(i)} style={{ position:"absolute", top:"8px", right:"8px", background:"rgba(0,0,0,0.6)", border:"none", borderRadius:"8px", padding:"4px 10px", fontSize:"11px", fontWeight:700, color:"#fff", cursor:"pointer" }}>⛶ Agrandar</button>
                          </div>
                        )}
                        {tieneLink && !embedUrl && (
                          <div style={{ marginTop:"8px", background:"#f4f4f2", borderRadius:"12px", padding:"12px 14px", display:"flex", alignItems:"center", gap:"10px", border:"2px solid #e8e8e6" }}>
                            <span style={{ fontSize:"24px" }}>{LINK_ICONOS[tipo]}</span>
                            <div style={{ flex:1, fontSize:"12px", color:"#555", fontWeight:600, wordBreak:"break-all" }}>{link}</div>
                            <button onClick={() => setLinkExpandido(i)} style={{ background:"#1a2a3a", border:"none", borderRadius:"8px", padding:"6px 12px", fontSize:"11px", fontWeight:800, color:"#d4a017", cursor:"pointer", fontFamily:"'Nunito',sans-serif", flexShrink:0 }}>Ver →</button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  <div style={{ fontSize:"11px", color:"#9a9a9a", fontWeight:600, textAlign:"center" }}>
                    {linksConValor.length} link{linksConValor.length!==1?"s":""} · Se agrega nueva línea automáticamente
                  </div>
                </div>
              )}
            </div>

            {/* ── ARCHIVOS ── */}
            <div style={cardStyle}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"14px" }}>
                <h3 style={{...subtituloStyle, marginBottom:0}}>📎 Archivos adjuntos</h3>
                {!archivosHabilitados && (
                  <button onClick={() => setPopupArchivo(true)} style={{ background:"linear-gradient(135deg,#d4a017,#f0c040)", border:"none", borderRadius:"20px", padding:"6px 14px", fontSize:"11px", fontWeight:900, color:"#1a2a3a", cursor:"pointer", fontFamily:"'Nunito',sans-serif", whiteSpace:"nowrap" }}>
                    💰 Comprar $500
                  </button>
                )}
              </div>

              {!archivosHabilitados ? (
                <div style={{ background:"#f9f7f0", borderRadius:"12px", padding:"14px", border:"2px dashed #e8d5a0" }}>
                  <div style={{ fontSize:"12px", color:"#9a9a9a", fontWeight:600, textAlign:"center", marginBottom:"8px" }}>
                    Adjuntá PDFs, imágenes extra, planillas y más (hasta 5 archivos)
                  </div>
                  <div style={{ display:"flex", justifyContent:"center", gap:"10px", fontSize:"22px" }}>
                    {["📄","🖼️","📊","🎵","📦"].map(i => <span key={i}>{i}</span>)}
                  </div>
                  <button onClick={() => setArchivosHabilitados(true)} style={{ width:"100%", marginTop:"12px", background:"none", border:"2px solid #d4a017", borderRadius:"10px", padding:"8px", fontSize:"11px", fontWeight:700, color:"#d4a017", cursor:"pointer", fontFamily:"'Nunito',sans-serif" }}>
                    [DEMO] Habilitar sin pagar
                  </button>
                </div>
              ) : (
                <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
                  {archivos.length>0 && (
                    <div style={{ display:"flex", gap:"10px", flexWrap:"wrap" }}>
                      {archivos.map((f,i) => (
                        <div key={i} style={{ position:"relative" }}>
                          <div onClick={() => setArchivoExpandido(i)} style={{ width:"80px", height:"80px", borderRadius:"10px", overflow:"hidden", background:"#f4f4f2", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", cursor:"pointer", border:"2px solid #e8e8e6" }}>
                            {f.type.startsWith("image/") && archivosPrev[i]
                              ? <img src={archivosPrev[i]} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                              : <>
                                  <span style={{ fontSize:"28px" }}>{f.type.includes("pdf")?"📄":f.type.includes("audio")?"🎵":f.type.includes("video")?"🎬":"📎"}</span>
                                  <span style={{ fontSize:"9px", color:"#9a9a9a", fontWeight:700, textAlign:"center", padding:"0 4px", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", width:"100%" }}>{f.name}</span>
                                </>
                            }
                          </div>
                          <button onClick={() => eliminarArchivo(i)} style={{ position:"absolute", top:"2px", right:"2px", background:"rgba(0,0,0,0.6)", border:"none", borderRadius:"50%", width:"20px", height:"20px", color:"#fff", fontSize:"12px", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>
                        </div>
                      ))}
                    </div>
                  )}
                  {archivos.length<5 && (
                    <label style={{ background:"linear-gradient(135deg,#1a2a3a,#243b55)", borderRadius:"12px", padding:"14px", display:"flex", alignItems:"center", justifyContent:"center", gap:"8px", cursor:"pointer", color:"#fff", fontSize:"13px", fontWeight:800 }}>
                      📎 Seleccionar archivos
                      <input type="file" multiple accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.mp3,.mp4" onChange={agregarArchivo} style={{ display:"none" }} />
                    </label>
                  )}
                  <div style={{ fontSize:"11px", color:"#9a9a9a", fontWeight:600, textAlign:"center" }}>
                    {archivos.length}/5 archivos · Tocá una miniatura para agrandar
                  </div>
                </div>
              )}
            </div>

            <button onClick={publicar} disabled={loading||subiendo} style={{ width:"100%", background:(loading||subiendo)?"#ccc":"linear-gradient(135deg,#d4a017,#f0c040)", color:"#1a2a3a", border:"none", borderRadius:"12px", padding:"16px", fontSize:"15px", fontWeight:800, fontFamily:"'Nunito',sans-serif", cursor:(loading||subiendo)?"not-allowed":"pointer", letterSpacing:"1px", textTransform:"uppercase" }}>
              {subiendo?"Subiendo fotos...":loading?"Publicando...":"🚀 Publicar anuncio"}
            </button>
          </div>
        )}
      </div>
      <BottomNav />
    </main>
  );
}

function Campo({ label, value, onChange, placeholder, type="text", textarea }: {
  label:string; value:string; onChange:(v:string)=>void;
  placeholder?:string; type?:string; textarea?:boolean;
}) {
  return (
    <div style={{ marginBottom:"14px" }}>
      <label style={labelStyle}>{label}</label>
      {textarea
        ? <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={4} style={{...inputStyle,resize:"vertical"}} />
        : <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={inputStyle} />
      }
    </div>
  );
}

const cardStyle: React.CSSProperties = { background:"#fff", borderRadius:"16px", padding:"20px", boxShadow:"0 2px 10px rgba(0,0,0,0.06)" };
const subtituloStyle: React.CSSProperties = { fontSize:"15px", fontWeight:900, color:"#1a2a3a", marginBottom:"14px" };
const labelStyle: React.CSSProperties = { display:"block", fontSize:"11px", fontWeight:800, color:"#666", textTransform:"uppercase", letterSpacing:"1px", marginBottom:"6px" };
const inputStyle: React.CSSProperties = { width:"100%", border:"2px solid #e8e8e6", borderRadius:"10px", padding:"11px 14px", fontSize:"14px", fontFamily:"'Nunito',sans-serif", color:"#2c2c2e", outline:"none", boxSizing:"border-box" };
