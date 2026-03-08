"use client";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Seccion = "datos" | "estadisticas" | "promotor";

const DIAS_SEMANA = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

const FERIADOS_ARG: Record<string, string> = {
  "01/01": "Año Nuevo",        "24/03": "Día de la Memoria",
  "02/04": "Día de Malvinas",  "01/05": "Día del Trabajador",
  "25/05": "Revolución de Mayo","17/06": "Paso a la Inmortalidad de Güemes",
  "09/07": "Día de la Independencia","17/08": "San Martín",
  "12/10": "Diversidad Cultural","20/11": "Soberanía Nacional",
  "08/12": "Inmaculada Concepción","25/12": "Navidad",
};

type Horario = { desde: string; hasta: string; activo: boolean };
type Vis = Record<string, boolean>;

export default function Usuario() {
  const router = useRouter();
  const [seccion, setSeccion] = useState<Seccion>("datos");
  const [perfil, setPerfil] = useState<any>(null);
  const [guardando, setGuardando] = useState(false);

  const [personal, setPersonal] = useState({
    nombre_usuario: "", nombre: "", apellido: "",
    whatsapp: "", provincia: "", ciudad: "", barrio: "", direccion: "",
    lat: "", lng: "",
  });
  const [visP, setVisP] = useState<Vis>({
    nombre_usuario: true, nombre_apellido: true,
    whatsapp: false, provincia: true,
    ciudad: true, barrio: false, direccion: false,
  });

  const [emp, setEmp] = useState({
    nombre_empresa: "", telefono: "", whatsapp_empresa: "",
    provincia_empresa: "", ciudad_empresa: "", barrio_empresa: "",
    direccion_empresa: "", lat_empresa: "", lng_empresa: "",
  });
  const [visE, setVisE] = useState<Vis>({
    nombre_empresa: true, telefono: false, whatsapp_empresa: false,
    provincia_empresa: true, ciudad_empresa: true,
    barrio_empresa: false, direccion_empresa: false,
  });
  const [horarios, setHorarios] = useState<Record<string, Horario>>({
    Lunes:     { desde: "09:00", hasta: "18:00", activo: true  },
    Martes:    { desde: "09:00", hasta: "18:00", activo: true  },
    Miércoles: { desde: "09:00", hasta: "18:00", activo: true  },
    Jueves:    { desde: "09:00", hasta: "18:00", activo: true  },
    Viernes:   { desde: "09:00", hasta: "18:00", activo: true  },
    Sábado:    { desde: "09:00", hasta: "13:00", activo: false },
    Domingo:   { desde: "09:00", hasta: "13:00", activo: false },
  });
  const [feriados, setFeriados] = useState<Record<string, Horario>>(() =>
    Object.fromEntries(Object.keys(FERIADOS_ARG).map(f => [f, { activo: false, desde: "10:00", hasta: "16:00" }]))
  );

  const esEmpresa = perfil?.plan === "nexoempresa";

  useEffect(() => {
    const cargar = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/login"); return; }
      const { data } = await supabase.from("usuarios").select("*").eq("id", session.user.id).single();
      if (data) {
        setPerfil(data);
        setPersonal({
          nombre_usuario: data.nombre_usuario || "",
          nombre: data.nombre || "", apellido: data.apellido || "",
          whatsapp: data.whatsapp || "",
          provincia: data.provincia || "", ciudad: data.ciudad || "",
          barrio: data.barrio || "", direccion: data.direccion || "",
          lat: data.lat || "", lng: data.lng || "",
        });
        if (data.vis_personal) setVisP(data.vis_personal);
        setEmp({
          nombre_empresa: data.nombre_empresa || "",
          telefono: data.telefono || "",
          whatsapp_empresa: data.whatsapp_empresa || "",
          provincia_empresa: data.provincia_empresa || "",
          ciudad_empresa: data.ciudad_empresa || "",
          barrio_empresa: data.barrio_empresa || "",
          direccion_empresa: data.direccion_empresa || "",
          lat_empresa: data.lat_empresa || "",
          lng_empresa: data.lng_empresa || "",
        });
        if (data.vis_empresa) setVisE(data.vis_empresa);
        if (data.horarios) setHorarios(data.horarios);
        if (data.feriados) setFeriados(data.feriados);
      }
    };
    cargar();
  }, []);

  const geolocPersonal = () => {
    if (!navigator.geolocation) return alert("GPS no disponible");
    navigator.geolocation.getCurrentPosition(async pos => {
      const { latitude: lat, longitude: lng } = pos.coords;
      try {
        const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
        const d = await r.json();
        setPersonal(p => ({
          ...p, lat: String(lat), lng: String(lng),
          ciudad: d.address?.city || d.address?.town || d.address?.village || p.ciudad,
          provincia: d.address?.state || p.provincia,
          barrio: d.address?.suburb || d.address?.neighbourhood || p.barrio,
          direccion: (`${d.address?.road || ""} ${d.address?.house_number || ""}`).trim() || p.direccion,
        }));
        alert("✅ Ubicación personal detectada");
      } catch { alert("Error al obtener dirección"); }
    }, () => alert("No se pudo acceder al GPS"));
  };

  const geolocEmpresa = () => {
    if (!navigator.geolocation) return alert("GPS no disponible");
    navigator.geolocation.getCurrentPosition(async pos => {
      const { latitude: lat, longitude: lng } = pos.coords;
      try {
        const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
        const d = await r.json();
        setEmp(e => ({
          ...e, lat_empresa: String(lat), lng_empresa: String(lng),
          ciudad_empresa: d.address?.city || d.address?.town || d.address?.village || e.ciudad_empresa,
          provincia_empresa: d.address?.state || e.provincia_empresa,
          barrio_empresa: d.address?.suburb || d.address?.neighbourhood || e.barrio_empresa,
          direccion_empresa: (`${d.address?.road || ""} ${d.address?.house_number || ""}`).trim() || e.direccion_empresa,
        }));
        alert("✅ Ubicación empresa detectada");
      } catch { alert("Error al obtener dirección"); }
    }, () => alert("No se pudo acceder al GPS"));
  };

  const guardar = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    setGuardando(true);
    await supabase.from("usuarios").update({
      nombre_usuario: personal.nombre_usuario,
      nombre: personal.nombre, apellido: personal.apellido,
      whatsapp: personal.whatsapp,
      provincia: personal.provincia, ciudad: personal.ciudad,
      barrio: personal.barrio, direccion: personal.direccion,
      lat: personal.lat || null, lng: personal.lng || null,
      vis_personal: visP,
      nombre_empresa: emp.nombre_empresa, telefono: emp.telefono,
      whatsapp_empresa: emp.whatsapp_empresa,
      provincia_empresa: emp.provincia_empresa, ciudad_empresa: emp.ciudad_empresa,
      barrio_empresa: emp.barrio_empresa, direccion_empresa: emp.direccion_empresa,
      lat_empresa: emp.lat_empresa || null, lng_empresa: emp.lng_empresa || null,
      vis_empresa: visE, horarios, feriados,
    }).eq("id", session.user.id);
    setGuardando(false);
    alert("¡Cambios guardados!");
  };

  const cerrarSesion = async () => { await supabase.auth.signOut(); router.push("/"); };
  const toggleP = (k: string) => setVisP(v => ({ ...v, [k]: !v[k] }));
  const toggleE = (k: string) => setVisE(v => ({ ...v, [k]: !v[k] }));

  return (
    <main style={{ paddingTop: "95px", paddingBottom: "130px", background: "#f4f4f2", minHeight: "100vh", fontFamily: "'Nunito', sans-serif" }}>
      <Header />

      {/* HERO */}
      <div style={{ background: "linear-gradient(135deg, #1a2a3a 0%, #243b55 100%)", padding: "20px 16px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "16px" }}>
          <div style={{ width: "60px", height: "60px", borderRadius: "50%", background: "linear-gradient(135deg, #d4a017, #f0c040)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "28px", boxShadow: "0 4px 16px rgba(212,160,23,0.4)", flexShrink: 0 }}>
            {esEmpresa ? "🏢" : "👤"}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "22px", color: "#fff", letterSpacing: "1px" }}>{perfil?.nombre_usuario || "---"}</div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "16px", color: "#d4a017", letterSpacing: "2px" }}>{perfil?.codigo || "---"}</div>
              {esEmpresa && <div style={{ background: "#c0392b", borderRadius: "8px", padding: "2px 8px", fontSize: "9px", fontWeight: 900, color: "#fff" }}>EMPRESA</div>}
            </div>
          </div>
          <button onClick={cerrarSesion} style={{ background: "rgba(255,80,80,0.15)", border: "1px solid rgba(255,80,80,0.4)", borderRadius: "10px", padding: "6px 12px", color: "#ff6b6b", fontSize: "12px", fontWeight: 800, cursor: "pointer", fontFamily: "'Nunito', sans-serif" }}>🚪 Salir</button>
        </div>
        <div style={{ display: "flex" }}>
          {(["datos","estadisticas","promotor"] as Seccion[]).map((id, i) => {
            const labels = [["👤","Datos"],["📊","Stats"],["⭐","Promotor"]];
            return (
              <button key={id} onClick={() => setSeccion(id)} style={{ flex: 1, background: "none", border: "none", borderBottom: seccion === id ? "3px solid #d4a017" : "3px solid transparent", padding: "10px 4px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
                <span style={{ fontSize: "16px" }}>{labels[i][0]}</span>
                <span style={{ fontSize: "9px", fontWeight: 800, color: seccion === id ? "#d4a017" : "#8a9aaa", textTransform: "uppercase", letterSpacing: "0.5px" }}>{labels[i][1]}</span>
              </button>
            );
          })}
          <button onClick={() => router.push("/mis-anuncios")} style={{ flex: 1, background: "none", border: "none", borderBottom: "3px solid transparent", padding: "10px 4px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
            <span style={{ fontSize: "16px" }}>📋</span>
            <span style={{ fontSize: "9px", fontWeight: 800, color: "#8a9aaa", textTransform: "uppercase", letterSpacing: "0.5px" }}>Anuncios</span>
          </button>
        </div>
      </div>

      <div style={{ padding: "16px", maxWidth: "480px", margin: "0 auto" }}>

        {/* ── DATOS ── */}
        {seccion === "datos" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>

            {/* PERSONALES */}
            <div style={C}>
              <SectionTitle>👤 Datos personales</SectionTitle>
              <Campo label="Nombre de usuario" valor={personal.nombre_usuario} onChange={v => setPersonal(p=>({...p,nombre_usuario:v}))} visible={visP.nombre_usuario} onToggle={()=>toggleP("nombre_usuario")} />
              <Campo label="Nombre y apellido" valor={`${personal.nombre}${personal.apellido?" "+personal.apellido:""}`}
                onChange={v=>{const pts=v.split(" ");setPersonal(p=>({...p,nombre:pts[0]||"",apellido:pts.slice(1).join(" ")}))}}
                visible={visP.nombre_apellido} onToggle={()=>toggleP("nombre_apellido")} placeholder="Nombre Apellido" />
              <Campo label="WhatsApp" valor={personal.whatsapp} onChange={v=>setPersonal(p=>({...p,whatsapp:v}))} visible={visP.whatsapp} onToggle={()=>toggleP("whatsapp")} placeholder="Ej: 3492123456" icono="📱" />
              <BtnGPS onClick={geolocPersonal} detectado={!!personal.lat} label="Geolocalizar mi ubicación" />
              <Campo label="Provincia" valor={personal.provincia} onChange={v=>setPersonal(p=>({...p,provincia:v}))} visible={visP.provincia} onToggle={()=>toggleP("provincia")} placeholder="Ej: Santa Fe" icono="🗺️" />
              <Campo label="Ciudad" valor={personal.ciudad} onChange={v=>setPersonal(p=>({...p,ciudad:v}))} visible={visP.ciudad} onToggle={()=>toggleP("ciudad")} placeholder="Ej: Rosario" icono="🏙️" />
              <Campo label="Barrio" valor={personal.barrio} onChange={v=>setPersonal(p=>({...p,barrio:v}))} visible={visP.barrio} onToggle={()=>toggleP("barrio")} placeholder="Ej: Centro" icono="🏘️" />
              <Campo label="Dirección" valor={personal.direccion} onChange={v=>setPersonal(p=>({...p,direccion:v}))} visible={visP.direccion} onToggle={()=>toggleP("direccion")} placeholder="Calle y número" icono="🏠" />
            </div>

            {/* EMPRESA */}
            {esEmpresa ? (
              <div style={{ ...C, border: "2px solid rgba(192,57,43,0.25)" }}>
                <SectionTitle color="#c0392b">🏢 Datos de la empresa</SectionTitle>
                <Campo label="Nombre de la empresa" valor={emp.nombre_empresa} onChange={v=>setEmp(e=>({...e,nombre_empresa:v}))} visible={visE.nombre_empresa} onToggle={()=>toggleE("nombre_empresa")} placeholder="Nombre comercial" highlight />
                <Campo label="Teléfono fijo" valor={emp.telefono} onChange={v=>setEmp(e=>({...e,telefono:v}))} visible={visE.telefono} onToggle={()=>toggleE("telefono")} placeholder="Ej: 0341-4123456" icono="☎️" />
                <Campo label="WhatsApp empresa" valor={emp.whatsapp_empresa} onChange={v=>setEmp(e=>({...e,whatsapp_empresa:v}))} visible={visE.whatsapp_empresa} onToggle={()=>toggleE("whatsapp_empresa")} placeholder="Ej: 3412345678" icono="📱" />
                <BtnGPS onClick={geolocEmpresa} detectado={!!emp.lat_empresa} label="Geolocalizar ubicación comercial" colorOverride="#c0392b" />
                <Campo label="Provincia" valor={emp.provincia_empresa} onChange={v=>setEmp(e=>({...e,provincia_empresa:v}))} visible={visE.provincia_empresa} onToggle={()=>toggleE("provincia_empresa")} placeholder="Ej: Santa Fe" icono="🗺️" />
                <Campo label="Ciudad" valor={emp.ciudad_empresa} onChange={v=>setEmp(e=>({...e,ciudad_empresa:v}))} visible={visE.ciudad_empresa} onToggle={()=>toggleE("ciudad_empresa")} placeholder="Ej: Rosario" icono="🏙️" />
                <Campo label="Barrio" valor={emp.barrio_empresa} onChange={v=>setEmp(e=>({...e,barrio_empresa:v}))} visible={visE.barrio_empresa} onToggle={()=>toggleE("barrio_empresa")} placeholder="Ej: Palermo" icono="🏘️" />
                <Campo label="Dirección comercial" valor={emp.direccion_empresa} onChange={v=>setEmp(e=>({...e,direccion_empresa:v}))} visible={visE.direccion_empresa} onToggle={()=>toggleE("direccion_empresa")} placeholder="Calle y número" icono="🏪" highlight />

                {/* HORARIOS */}
                <div style={{ borderTop: "1px solid #f0e8e8", paddingTop: "16px", marginTop: "6px" }}>
                  <div style={tHS("#c0392b")}>🕐 Horarios de atención</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {DIAS_SEMANA.map(dia => (
                      <FilaHorario key={dia} label={dia}
                        activo={horarios[dia].activo} desde={horarios[dia].desde} hasta={horarios[dia].hasta}
                        onToggle={()=>setHorarios(h=>({...h,[dia]:{...h[dia],activo:!h[dia].activo}}))}
                        onDesde={v=>setHorarios(h=>({...h,[dia]:{...h[dia],desde:v}}))}
                        onHasta={v=>setHorarios(h=>({...h,[dia]:{...h[dia],hasta:v}}))}
                      />
                    ))}
                  </div>
                </div>

                {/* FERIADOS */}
                <div style={{ borderTop: "1px solid #f0e8e8", paddingTop: "16px", marginTop: "14px" }}>
                  <div style={tHS("#c0392b")}>📅 Feriados nacionales</div>
                  <div style={{ fontSize: "11px", color: "#9a9a9a", fontWeight: 600, marginBottom: "12px" }}>Activá los feriados en que abrís</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {Object.entries(FERIADOS_ARG).map(([fecha, nombre]) => {
                      const [dd, mm] = fecha.split("/");
                      const meses = ["","Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
                      return (
                        <FilaHorario key={fecha}
                          label={`${dd} ${meses[parseInt(mm)]} — ${nombre}`}
                          activo={feriados[fecha]?.activo || false}
                          desde={feriados[fecha]?.desde || "10:00"}
                          hasta={feriados[fecha]?.hasta || "16:00"}
                          onToggle={()=>setFeriados(f=>({...f,[fecha]:{...f[fecha],activo:!f[fecha]?.activo}}))}
                          onDesde={v=>setFeriados(f=>({...f,[fecha]:{...f[fecha],desde:v}}))}
                          onHasta={v=>setFeriados(f=>({...f,[fecha]:{...f[fecha],hasta:v}}))}
                          esFeriado
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div onClick={()=>router.push("/mis-anuncios")} style={{ background: "linear-gradient(135deg, #2c1a1a, #4a2020)", borderRadius: "16px", padding: "20px", textAlign: "center", cursor: "pointer" }}>
                <div style={{ fontSize: "32px", marginBottom: "8px" }}>🏢</div>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "20px", color: "#f0a040", letterSpacing: "1px", marginBottom: "4px" }}>Perfil de empresa</div>
                <div style={{ fontSize: "12px", color: "#e88a8a", fontWeight: 600, marginBottom: "16px" }}>Disponible con BIT Empresa × 50</div>
                <div style={{ background: "#c0392b", borderRadius: "10px", padding: "10px 20px", display: "inline-block", fontSize: "12px", fontWeight: 900, color: "#fff" }}>Ver planes →</div>
              </div>
            )}

            <button onClick={guardar} disabled={guardando} style={{ ...BTN, opacity: guardando ? 0.7 : 1 }}>
              {guardando ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        )}

        {/* ── ESTADÍSTICAS ── */}
        {seccion === "estadisticas" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              {[{n:"0",l:"Visitas totales",e:"👁️"},{n:"0",l:"Conexiones",e:"🔗"},{n:"0",l:"Anuncios activos",e:"📋"},{n:"0",l:"Grupos unidos",e:"👥"}].map(s=>(
                <div key={s.l} style={{ background: "#fff", borderRadius: "14px", padding: "16px", textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                  <div style={{ fontSize: "24px", marginBottom: "4px" }}>{s.e}</div>
                  <div style={{ fontSize: "26px", fontWeight: 900, color: "#d4a017" }}>{s.n}</div>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: "#666", textTransform: "uppercase" }}>{s.l}</div>
                </div>
              ))}
            </div>
            <div style={C}>
              <SectionTitle>💰 Mis Bits</SectionTitle>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <span style={{ fontSize: "32px", fontWeight: 900, color: "#d4a017" }}>{perfil?.bits || 0}</span>
                <span style={{ fontSize: "14px", fontWeight: 700, color: "#666" }}>Bits disponibles</span>
              </div>
              <button style={BTN}>Comprar Bits</button>
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
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "28px", color: "#d4a017", letterSpacing: "4px" }}>{perfil?.codigo || "---"}</div>
              </div>
              <button style={BTN}>Compartir mi código</button>
            </div>
            <div style={C}>
              <SectionTitle>📊 Mis referidos</SectionTitle>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
                {[{n:"0",l:"Referidos"},{n:"$0",l:"Ganado"},{n:"0",l:"Este mes"}].map(s=>(
                  <div key={s.l} style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "22px", fontWeight: 900, color: "#d4a017" }}>{s.n}</div>
                    <div style={{ fontSize: "11px", fontWeight: 700, color: "#666", textTransform: "uppercase" }}>{s.l}</div>
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

function SectionTitle({ children, color = "#1a2a3a" }: { children: React.ReactNode; color?: string }) {
  return <div style={{ fontSize: "13px", fontWeight: 900, color, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "16px" }}>{children}</div>;
}

function BtnGPS({ onClick, detectado, label, colorOverride }: { onClick: ()=>void; detectado: boolean; label: string; colorOverride?: string }) {
  const color = colorOverride || "#27ae60";
  return (
    <button onClick={onClick} style={{ width: "100%", background: `${color}12`, border: `2px solid ${color}40`, borderRadius: "10px", padding: "10px 14px", fontSize: "13px", fontWeight: 800, color, cursor: "pointer", fontFamily: "'Nunito', sans-serif", textAlign: "left", marginBottom: "14px", display: "flex", alignItems: "center", gap: "6px" }}>
      📍 {label}
      {detectado && <span style={{ fontSize: "10px", color: "#27ae60", fontWeight: 700 }}>✓ detectada</span>}
    </button>
  );
}

function Campo({ label, valor, onChange, visible, onToggle, placeholder, icono, highlight }: {
  label: string; valor: string; onChange: (v: string) => void;
  visible: boolean; onToggle: () => void;
  placeholder?: string; icono?: string; highlight?: boolean;
}) {
  return (
    <div style={{ marginBottom: "14px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
        <label style={{ fontSize: "11px", fontWeight: 800, color: highlight ? "#c0392b" : "#666", textTransform: "uppercase", letterSpacing: "1px" }}>
          {icono && `${icono} `}{label}
        </label>
        <button onClick={onToggle} style={{ background: visible ? "rgba(212,160,23,0.15)" : "#f4f4f2", border: `1px solid ${visible ? "#d4a017" : "#e8e8e6"}`, borderRadius: "6px", padding: "2px 8px", fontSize: "10px", fontWeight: 800, color: visible ? "#d4a017" : "#9a9a9a", cursor: "pointer", fontFamily: "'Nunito', sans-serif" }}>
          {visible ? "👁️ Se ve" : "🙈 Oculto"}
        </button>
      </div>
      <input type="text" value={valor} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ width: "100%", border: `2px solid ${highlight ? "rgba(192,57,43,0.25)" : "#e8e8e6"}`, borderRadius: "10px", padding: "11px 14px", fontSize: "14px", fontFamily: "'Nunito', sans-serif", color: "#2c2c2e", outline: "none", boxSizing: "border-box", background: highlight ? "rgba(192,57,43,0.02)" : "#fff" }} />
    </div>
  );
}

function FilaHorario({ label, activo, desde, hasta, onToggle, onDesde, onHasta, esFeriado }: {
  label: string; activo: boolean; desde: string; hasta: string;
  onToggle: ()=>void; onDesde: (v:string)=>void; onHasta: (v:string)=>void; esFeriado?: boolean;
}) {
  const color = esFeriado ? "#c0392b" : "#d4a017";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
      <button onClick={onToggle} style={{ width: "28px", height: "28px", borderRadius: "8px", flexShrink: 0, background: activo ? color : "#f4f4f2", border: `2px solid ${activo ? color : "#e8e8e6"}`, cursor: "pointer", fontSize: "13px", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 900 }}>
        {activo ? "✓" : ""}
      </button>
      <span style={{ fontSize: "12px", fontWeight: 700, color: activo ? "#1a2a3a" : "#9a9a9a", flex: 1, minWidth: "130px" }}>{label}</span>
      {activo ? (
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <input type="time" value={desde} onChange={e=>onDesde(e.target.value)} style={{ border: "2px solid #e8e8e6", borderRadius: "8px", padding: "4px 6px", fontSize: "12px", fontFamily: "'Nunito', sans-serif", outline: "none", color: "#1a2a3a" }} />
          <span style={{ fontSize: "11px", color: "#9a9a9a" }}>a</span>
          <input type="time" value={hasta} onChange={e=>onHasta(e.target.value)} style={{ border: "2px solid #e8e8e6", borderRadius: "8px", padding: "4px 6px", fontSize: "12px", fontFamily: "'Nunito', sans-serif", outline: "none", color: "#1a2a3a" }} />
        </div>
      ) : (
        <span style={{ fontSize: "11px", color: "#9a9a9a", fontWeight: 600 }}>{esFeriado ? "Cerrado" : "No disponible"}</span>
      )}
    </div>
  );
}

const C: React.CSSProperties = { background: "#fff", borderRadius: "16px", padding: "20px", boxShadow: "0 2px 10px rgba(0,0,0,0.06)" };
const BTN: React.CSSProperties = { width: "100%", background: "linear-gradient(135deg, #d4a017, #f0c040)", color: "#1a2a3a", border: "none", borderRadius: "12px", padding: "16px", fontSize: "15px", fontWeight: 800, fontFamily: "'Nunito', sans-serif", cursor: "pointer", letterSpacing: "1px", textTransform: "uppercase" };
const tHS = (c: string): React.CSSProperties => ({ fontSize: "12px", fontWeight: 900, color: c, textTransform: "uppercase", letterSpacing: "1px", marginBottom: "12px" });
