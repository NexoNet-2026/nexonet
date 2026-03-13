"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Header from "@/components/Header";
import { supabase } from "@/lib/supabase";

type TabAdmin = "info" | "miembros" | "mensajes" | "adjuntos" | "config";

export default function GrupoAdminPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [grupo,        setGrupo]        = useState<any>(null);
  const [perfil,       setPerfil]       = useState<any>(null);
  const [tab,          setTab]          = useState<TabAdmin>("info");
  const [miembros,     setMiembros]     = useState<any[]>([]);
  const [mensajes,     setMensajes]     = useState<any[]>([]);
  const [adjuntos,     setAdjuntos]     = useState<any[]>([]);
  const [cargando,     setCargando]     = useState(true);
  const [guardando,    setGuardando]    = useState(false);
  const [subiendoImg,  setSubiendoImg]  = useState<"imagen"|"fondo"|null>(null);

  const [formGrupo, setFormGrupo] = useState({
    nombre: "", descripcion: "", reglas: "", tipo: "publico",
    modelo_acceso: "libre", imagen: "", imagen_fondo: "",
  });

  useEffect(() => {
    const cargar = async () => {
      const { data:{ session } } = await supabase.auth.getSession();
      if (!session) { router.push("/login"); return; }

      const { data: u } = await supabase.from("usuarios").select("*").eq("id", session.user.id).single();
      setPerfil(u);

      const { data: g } = await supabase.from("grupos").select("*").eq("id", id).single();
      if (!g || (g.creador_id !== session.user.id)) { router.push(`/grupos/${id}`); return; }
      setGrupo(g);
      setFormGrupo({ nombre:g.nombre||"", descripcion:g.descripcion||"", reglas:g.reglas||"", tipo:g.tipo||"publico", modelo_acceso:g.modelo_acceso||"libre", imagen:g.imagen||"", imagen_fondo:g.imagen_fondo||"" });

      const { data: mbs } = await supabase.from("grupo_miembros")
        .select("*, usuarios(id,nombre_usuario,codigo,avatar_url,plan,bits_promotor_total)")
        .eq("grupo_id", id).order("created_at");

      const { data: msgs } = await supabase.from("grupo_mensajes")
        .select("*, usuarios(nombre_usuario,codigo,avatar_url)")
        .eq("grupo_id", id).order("created_at", { ascending: false }).limit(200);

      setMiembros(mbs || []);
      setMensajes(msgs || []);

      const adjs = (msgs||[]).filter((m:any) => m.adjunto_url).map((m:any) => ({
        id: m.id, url: m.adjunto_url, tipo: detectarTipo(m.adjunto_url),
        nombre: m.adjunto_nombre || m.adjunto_url?.split("/").pop(),
        autor: m.usuarios?.nombre_usuario, fecha: m.created_at, msg_id: m.id,
      }));
      setAdjuntos(adjs);
      setCargando(false);
    };
    cargar();
  }, [id]);

  const detectarTipo = (url: string) => {
    const ext = url?.split(".").pop()?.toLowerCase().split("?")[0] || "";
    if (["mp4","webm","mov"].includes(ext)) return "video";
    if (["jpg","jpeg","png","gif","webp"].includes(ext)) return "imagen";
    if (ext === "pdf") return "pdf";
    if (["doc","docx"].includes(ext)) return "word";
    return "archivo";
  };

  const subirImagen = async (e: React.ChangeEvent<HTMLInputElement>, tipo: "imagen" | "fondo") => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert("Máximo 5MB"); return; }
    setSubiendoImg(tipo);
    const ext  = file.name.split(".").pop();
    const path = `grupos/${id}/${tipo}.${ext}`;
    await supabase.storage.from("grupos").upload(path, file, { upsert: true });
    const { data } = supabase.storage.from("grupos").getPublicUrl(path);
    const url = `${data.publicUrl}?t=${Date.now()}`;
    setFormGrupo(f => ({ ...f, [tipo]: url }));
    setSubiendoImg(null);
  };

  const guardarInfo = async () => {
    setGuardando(true);
    await supabase.from("grupos").update({
      nombre:        formGrupo.nombre,
      descripcion:   formGrupo.descripcion,
      reglas:        formGrupo.reglas,
      tipo:          formGrupo.tipo,
      modelo_acceso: formGrupo.modelo_acceso,
      imagen:        formGrupo.imagen || null,
      imagen_fondo:  formGrupo.imagen_fondo || null,
    }).eq("id", id);
    setGuardando(false);
    alert("✅ Cambios guardados");
  };

  const accionMiembro = async (miembroId: string, usuarioId: string, accion: string) => {
    if (accion === "expulsar") {
      if (!confirm("¿Expulsar a este miembro?")) return;
      await supabase.from("grupo_miembros").update({ estado:"expulsado" }).eq("id", miembroId);
      setMiembros(prev => prev.filter(m => m.id !== miembroId));
    } else if (accion === "bloquear") {
      if (!confirm("¿Bloquear a este miembro?")) return;
      await supabase.from("grupo_miembros").update({ estado:"bloqueado" }).eq("id", miembroId);
      setMiembros(prev => prev.map(m => m.id===miembroId ? {...m,estado:"bloqueado"} : m));
    } else if (accion === "silenciar") {
      const m = miembros.find(m => m.id === miembroId);
      const nuevo = !m?.silenciado;
      await supabase.from("grupo_miembros").update({ silenciado: nuevo }).eq("id", miembroId);
      setMiembros(prev => prev.map(m => m.id===miembroId ? {...m,silenciado:nuevo} : m));
    } else if (accion === "hacer_mod") {
      await supabase.from("grupo_miembros").update({ rol:"moderador" }).eq("id", miembroId);
      setMiembros(prev => prev.map(m => m.id===miembroId ? {...m,rol:"moderador"} : m));
    } else if (accion === "quitar_mod") {
      await supabase.from("grupo_miembros").update({ rol:"miembro" }).eq("id", miembroId);
      setMiembros(prev => prev.map(m => m.id===miembroId ? {...m,rol:"miembro"} : m));
    } else if (accion === "aprobar") {
      await supabase.from("grupo_miembros").update({ estado:"activo" }).eq("id", miembroId);
      setMiembros(prev => prev.map(m => m.id===miembroId ? {...m,estado:"activo"} : m));
    }
  };

  const eliminarMensaje = async (msgId: string) => {
    if (!confirm("¿Eliminar este mensaje?")) return;
    await supabase.from("grupo_mensajes").delete().eq("id", msgId);
    setMensajes(prev => prev.filter(m => m.id !== msgId));
  };

  const eliminarAdjunto = async (msgId: string) => {
    if (!confirm("¿Eliminar este archivo del chat?")) return;
    await supabase.from("grupo_mensajes").update({ adjunto_url:null, adjunto_tipo:null, adjunto_nombre:null }).eq("id", msgId);
    setAdjuntos(prev => prev.filter(a => a.msg_id !== msgId));
  };

  if (cargando) return <main style={{ paddingTop:"80px", textAlign:"center", color:"#9a9a9a", fontFamily:"'Nunito',sans-serif" }}>Cargando panel...</main>;

  const imgFondo = formGrupo.imagen_fondo || grupo?.imagen || null;
  const pendientes = miembros.filter(m => m.estado === "pendiente");
  const activos    = miembros.filter(m => m.estado === "activo");
  const bloqueados = miembros.filter(m => m.estado === "bloqueado");

  const TABS: { key: TabAdmin; label: string; emoji: string; badge?: number }[] = [
    { key:"info",      label:"Info",      emoji:"✏️" },
    { key:"miembros",  label:"Miembros",  emoji:"👥", badge: pendientes.length||undefined },
    { key:"mensajes",  label:"Mensajes",  emoji:"💬" },
    { key:"adjuntos",  label:"Archivos",  emoji:"📎" },
    { key:"config",    label:"Config",    emoji:"⚙️" },
  ];

  return (
    <main style={{ paddingTop:"0", paddingBottom:"100px", background:"#f4f4f2", minHeight:"100vh", fontFamily:"'Nunito',sans-serif" }}>
      <Header />

      {/* HERO ADMIN */}
      <div style={{ position:"relative", background: imgFondo ? `url(${imgFondo}) center/cover no-repeat` : "linear-gradient(135deg,#1a2a3a,#2d4a6a)", paddingTop:"80px", minHeight:"180px" }}>
        {imgFondo && <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.55)" }} />}
        <div style={{ position:"relative", zIndex:1, padding:"12px 16px 16px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom:"12px" }}>
            <button onClick={()=>router.push(`/grupos/${id}`)} style={{ background:"rgba(255,255,255,0.15)", border:"1px solid rgba(255,255,255,0.25)", borderRadius:"10px", padding:"8px 12px", color:"#fff", fontSize:"13px", fontWeight:700, cursor:"pointer", fontFamily:"'Nunito',sans-serif" }}>← Volver</button>
            <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"22px", color:"#d4a017", letterSpacing:"1px" }}>Panel Admin</div>
            <div style={{ marginLeft:"auto", background:"rgba(212,160,23,0.9)", borderRadius:"20px", padding:"4px 12px", fontSize:"11px", fontWeight:900, color:"#1a2a3a" }}>👑 Creador</div>
          </div>

          <div style={{ display:"flex", alignItems:"center", gap:"14px" }}>
            <div style={{ position:"relative" }}>
              <div style={{ width:"64px", height:"64px", borderRadius:"16px", overflow:"hidden", border:"3px solid rgba(255,255,255,0.3)", background:"#1a2a3a", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"28px" }}>
                {formGrupo.imagen ? <img src={formGrupo.imagen} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} /> : "👥"}
              </div>
              <label style={{ position:"absolute", bottom:"-6px", right:"-6px", width:"26px", height:"26px", borderRadius:"50%", background:"#d4a017", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", border:"2px solid #1a2a3a", fontSize:"12px" }}>
                {subiendoImg==="imagen"?"⏳":"📷"}
                <input type="file" accept="image/*" onChange={e=>subirImagen(e,"imagen")} style={{ display:"none" }} />
              </label>
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"24px", color:"#fff", letterSpacing:"1px" }}>{grupo?.nombre}</div>
              <div style={{ fontSize:"12px", color:"rgba(255,255,255,0.6)", fontWeight:600 }}>👥 {activos.length} activos · {pendientes.length} pendientes</div>
            </div>
            <label style={{ background:"rgba(255,255,255,0.15)", border:"1px solid rgba(255,255,255,0.3)", borderRadius:"10px", padding:"8px 12px", color:"#fff", fontSize:"12px", fontWeight:700, cursor:"pointer", flexShrink:0, textAlign:"center" }}>
              {subiendoImg==="fondo"?"⏳":"🖼️ Fondo"}
              <input type="file" accept="image/*" onChange={e=>subirImagen(e,"fondo")} style={{ display:"none" }} />
            </label>
          </div>
        </div>
      </div>

      {/* TAB BAR */}
      <div style={{ position:"sticky", top:"60px", zIndex:100, background:"#1a2a3a", boxShadow:"0 2px 12px rgba(0,0,0,0.25)" }}>
        <div style={{ display:"flex", overflowX:"auto", scrollbarWidth:"none" }}>
          {TABS.map(t => (
            <button key={t.key} onClick={()=>setTab(t.key)}
              style={{ flex:"0 0 auto", minWidth:"70px", background:"none", border:"none", cursor:"pointer", padding:"10px 6px 6px", display:"flex", flexDirection:"column", alignItems:"center", gap:"3px", borderBottom: tab===t.key ? "3px solid #d4a017" : "3px solid transparent", position:"relative" }}>
              <span style={{ fontSize:"18px" }}>{t.emoji}</span>
              {t.badge && <span style={{ position:"absolute", top:"6px", right:"8px", background:"#e74c3c", color:"#fff", borderRadius:"20px", fontSize:"9px", fontWeight:900, padding:"1px 5px" }}>{t.badge}</span>}
              <span style={{ fontSize:"10px", fontWeight:800, color: tab===t.key ? "#d4a017" : "rgba(255,255,255,0.5)", textTransform:"uppercase", letterSpacing:"0.5px" }}>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding:"16px", maxWidth:"600px", margin:"0 auto" }}>

        {/* ── INFO ── */}
        {tab === "info" && (
          <div style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
            <Tarjeta titulo="✏️ Información del grupo">
              <Campo label="Nombre" valor={formGrupo.nombre} onChange={v=>setFormGrupo(f=>({...f,nombre:v}))} />
              <Campo label="Descripción" valor={formGrupo.descripcion} onChange={v=>setFormGrupo(f=>({...f,descripcion:v}))} multiline />
              <Campo label="Reglas del grupo" valor={formGrupo.reglas} onChange={v=>setFormGrupo(f=>({...f,reglas:v}))} multiline placeholder="Ej: No se permiten spam, respeto entre miembros..." />
            </Tarjeta>

            <Tarjeta titulo="🌐 Visibilidad y acceso">
              <div style={{ marginBottom:"12px" }}>
                <div style={{ fontSize:"11px", fontWeight:800, color:"#666", textTransform:"uppercase", letterSpacing:"1px", marginBottom:"8px" }}>Tipo de grupo</div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px" }}>
                  {[{v:"publico",l:"🌐 Público",d:"Aparece en búsquedas"},{v:"privado",l:"🔒 Privado",d:"Solo por invitación"}].map(o=>(
                    <button key={o.v} onClick={()=>setFormGrupo(f=>({...f,tipo:o.v}))}
                      style={{ background:formGrupo.tipo===o.v?"linear-gradient(135deg,#1a2a3a,#243b55)":"#f4f4f2", border:formGrupo.tipo===o.v?"2px solid #d4a017":"2px solid #e8e8e6", borderRadius:"12px", padding:"12px", cursor:"pointer", textAlign:"left", fontFamily:"'Nunito',sans-serif" }}>
                      <div style={{ fontSize:"13px", fontWeight:900, color:formGrupo.tipo===o.v?"#f0c040":"#1a2a3a" }}>{o.l}</div>
                      <div style={{ fontSize:"10px", color:formGrupo.tipo===o.v?"#8a9aaa":"#9a9a9a", fontWeight:600 }}>{o.d}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ fontSize:"11px", fontWeight:800, color:"#666", textTransform:"uppercase", letterSpacing:"1px", marginBottom:"8px" }}>Modelo de acceso</div>
                <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
                  {[{v:"libre",l:"🟢 Libre",d:"Cualquiera puede unirse"},{v:"aprobacion",l:"⏳ Con aprobación",d:"El admin aprueba cada ingreso"},{v:"pago",l:"💰 De pago",d:"Requiere pago de 500 BIT"}].map(o=>(
                    <button key={o.v} onClick={()=>setFormGrupo(f=>({...f,modelo_acceso:o.v}))}
                      style={{ background:formGrupo.modelo_acceso===o.v?"rgba(212,160,23,0.1)":"#f4f4f2", border:formGrupo.modelo_acceso===o.v?"2px solid #d4a017":"2px solid #e8e8e6", borderRadius:"12px", padding:"12px 14px", cursor:"pointer", display:"flex", gap:"10px", alignItems:"center", fontFamily:"'Nunito',sans-serif", textAlign:"left" }}>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:"13px", fontWeight:900, color:formGrupo.modelo_acceso===o.v?"#d4a017":"#1a2a3a" }}>{o.l}</div>
                        <div style={{ fontSize:"10px", color:"#9a9a9a", fontWeight:600 }}>{o.d}</div>
                      </div>
                      {formGrupo.modelo_acceso===o.v && <span style={{ color:"#d4a017", fontSize:"16px" }}>✓</span>}
                    </button>
                  ))}
                </div>
              </div>
            </Tarjeta>

            <button onClick={guardarInfo} disabled={guardando}
              style={{ width:"100%", background:"linear-gradient(135deg,#f0c040,#d4a017)", border:"none", borderRadius:"14px", padding:"16px", fontSize:"15px", fontWeight:900, color:"#1a2a3a", cursor:"pointer", fontFamily:"'Nunito',sans-serif", boxShadow:"0 4px 0 #a07810" }}>
              {guardando?"Guardando...":"💾 Guardar todos los cambios"}
            </button>
          </div>
        )}

        {/* ── MIEMBROS ── */}
        {tab === "miembros" && (
          <div style={{ display:"flex", flexDirection:"column", gap:"12px" }}>
            {pendientes.length > 0 && (
              <div>
                <SectionHeader label={`⏳ Pendientes de aprobación (${pendientes.length})`} color="#e67e22" />
                {pendientes.map(m => (
                  <TarjetaMiembro key={m.id} m={m} onAccion={accionMiembro} showAprobar />
                ))}
              </div>
            )}

            <div>
              <SectionHeader label={`✅ Miembros activos (${activos.length})`} color="#27ae60" />
              {activos.map(m => (
                <TarjetaMiembro key={m.id} m={m} onAccion={accionMiembro} />
              ))}
            </div>

            {bloqueados.length > 0 && (
              <div>
                <SectionHeader label={`🚫 Bloqueados (${bloqueados.length})`} color="#e74c3c" />
                {bloqueados.map(m => (
                  <TarjetaMiembro key={m.id} m={m} onAccion={accionMiembro} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── MENSAJES ── */}
        {tab === "mensajes" && (
          <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
            <div style={{ fontSize:"11px", fontWeight:800, color:"#9a9a9a", textTransform:"uppercase", letterSpacing:"1px", marginBottom:"4px" }}>{mensajes.length} mensajes en el grupo</div>
            {mensajes.map((m:any) => (
              <div key={m.id} style={{ background:"#fff", borderRadius:"14px", padding:"12px 14px", display:"flex", alignItems:"flex-start", gap:"10px" }}>
                <div style={{ width:"36px", height:"36px", borderRadius:"50%", background:"linear-gradient(135deg,#1a2a3a,#243b55)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"15px", flexShrink:0, overflow:"hidden" }}>
                  {m.usuarios?.avatar_url ? <img src={m.usuarios.avatar_url} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} /> : "👤"}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"3px" }}>
                    <span style={{ fontSize:"12px", fontWeight:900, color:"#d4a017" }}>{m.usuarios?.nombre_usuario}</span>
                    <span style={{ fontSize:"10px", color:"#bbb", fontWeight:600 }}>{new Date(m.created_at).toLocaleString("es-AR",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"})}</span>
                  </div>
                  {m.texto && <div style={{ fontSize:"13px", color:"#2c2c2e", fontWeight:600, lineHeight:1.5, marginBottom:m.adjunto_url?"6px":"0" }}>{m.texto}</div>}
                  {m.adjunto_url && <div style={{ fontSize:"11px", color:"#3a7bd5", fontWeight:700 }}>📎 Adjunto</div>}
                </div>
                <button onClick={()=>eliminarMensaje(m.id)}
                  style={{ background:"rgba(231,76,60,0.1)", border:"1px solid rgba(231,76,60,0.25)", borderRadius:"8px", padding:"6px 8px", fontSize:"14px", cursor:"pointer", flexShrink:0, color:"#e74c3c" }}>🗑️</button>
              </div>
            ))}
            {mensajes.length === 0 && <EmptyState emoji="💬" texto="Sin mensajes" sub="El chat está vacío" />}
          </div>
        )}

        {/* ── ADJUNTOS ── */}
        {tab === "adjuntos" && (
          <div>
            {adjuntos.length === 0 ? (
              <EmptyState emoji="📎" texto="Sin archivos" sub="No se han compartido archivos en el chat" />
            ) : (
              <div>
                <div style={{ fontSize:"11px", fontWeight:800, color:"#9a9a9a", textTransform:"uppercase", letterSpacing:"1px", marginBottom:"12px" }}>{adjuntos.length} archivos compartidos</div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px" }}>
                  {adjuntos.map((a:any) => (
                    <TarjetaAdjuntoAdmin key={a.id} adjunto={a} onEliminar={()=>eliminarAdjunto(a.msg_id)} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── CONFIG ── */}
        {tab === "config" && (
          <div style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
            <Tarjeta titulo="⚙️ Permisos del grupo">
              {[
                { k:"permitir_adjuntos", l:"📎 Permitir adjuntos",     d:"Los miembros pueden enviar archivos" },
                { k:"permitir_links",    l:"🔗 Permitir links",         d:"Los miembros pueden compartir URLs" },
                { k:"solo_admins",       l:"🛡️ Solo admins publican",  d:"Solo creadores y mods pueden escribir" },
              ].map(op => {
                const val = grupo?.config?.[op.k] ?? true;
                return (
                  <div key={op.k} onClick={async () => {
                    const nuevo = !val;
                    const config = { ...(grupo.config||{}), [op.k]:nuevo };
                    await supabase.from("grupos").update({ config }).eq("id", id);
                    setGrupo((g:any) => ({ ...g, config }));
                  }} style={{ display:"flex", alignItems:"center", gap:"12px", padding:"14px 0", borderBottom:"1px solid #f0f0f0", cursor:"pointer" }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:"13px", fontWeight:900, color:"#1a2a3a" }}>{op.l}</div>
                      <div style={{ fontSize:"11px", color:"#9a9a9a", fontWeight:600 }}>{op.d}</div>
                    </div>
                    <div style={{ width:"48px", height:"28px", borderRadius:"14px", background: val?"#27ae60":"#d0d0d0", position:"relative", flexShrink:0, transition:"background .2s" }}>
                      <div style={{ position:"absolute", top:"3px", left:val?"23px":"3px", width:"22px", height:"22px", borderRadius:"50%", background:"#fff", boxShadow:"0 1px 4px rgba(0,0,0,0.2)", transition:"left .2s" }} />
                    </div>
                  </div>
                );
              })}
            </Tarjeta>

            <div style={{ background:"linear-gradient(135deg,#2c1a1a,#4a2020)", borderRadius:"16px", padding:"20px", border:"2px solid rgba(231,76,60,0.3)" }}>
              <div style={{ fontSize:"14px", fontWeight:900, color:"#e74c3c", marginBottom:"8px" }}>⚠️ Zona peligrosa</div>
              <div style={{ fontSize:"12px", color:"#e88a8a", fontWeight:600, marginBottom:"16px" }}>Estas acciones son irreversibles</div>
              <button onClick={async () => {
                if (!confirm("¿Eliminar el grupo? Esto borrará todos los mensajes y miembros.")) return;
                await supabase.from("grupo_miembros").delete().eq("grupo_id", id);
                await supabase.from("grupo_mensajes").delete().eq("grupo_id", id);
                await supabase.from("grupos").delete().eq("id", id);
                router.push("/grupos");
              }} style={{ width:"100%", background:"rgba(231,76,60,0.2)", border:"2px solid rgba(231,76,60,0.5)", borderRadius:"12px", padding:"13px", fontSize:"13px", fontWeight:900, color:"#e74c3c", cursor:"pointer", fontFamily:"'Nunito',sans-serif" }}>
                🗑️ Eliminar grupo definitivamente
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function TarjetaMiembro({ m, onAccion, showAprobar }: { m:any; onAccion:(id:string,uid:string,acc:string)=>void; showAprobar?:boolean }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div style={{ background:"#fff", borderRadius:"14px", marginBottom:"8px", overflow:"hidden", boxShadow:"0 2px 8px rgba(0,0,0,0.06)" }}>
      <div style={{ padding:"12px 14px", display:"flex", alignItems:"center", gap:"10px", cursor:"pointer" }} onClick={()=>setExpanded(e=>!e)}>
        <div style={{ width:"42px", height:"42px", borderRadius:"50%", background:"linear-gradient(135deg,#1a2a3a,#243b55)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"18px", overflow:"hidden", flexShrink:0 }}>
          {m.usuarios?.avatar_url ? <img src={m.usuarios.avatar_url} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} /> : (m.usuarios?.plan==="nexoempresa"?"🏢":"👤")}
        </div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:"14px", fontWeight:900, color:"#1a2a3a" }}>{m.usuarios?.nombre_usuario||"---"}</div>
          <div style={{ fontSize:"11px", color:"#9a9a9a", fontWeight:600 }}>{m.usuarios?.codigo} · Ingresó {new Date(m.created_at).toLocaleDateString("es-AR")}</div>
        </div>
        <div style={{ display:"flex", gap:"6px", alignItems:"center" }}>
          {m.silenciado && <span style={{ fontSize:"12px" }}>🔇</span>}
          <RolBadge rol={m.rol} />
          <span style={{ fontSize:"16px", color:"#d4a017", transform:expanded?"rotate(90deg)":"none", transition:"transform .2s", display:"inline-block" }}>›</span>
        </div>
      </div>
      {expanded && (
        <div style={{ borderTop:"1px solid #f4f4f2", padding:"10px 14px", background:"#fafafa", display:"flex", flexWrap:"wrap", gap:"6px" }}>
          {showAprobar && <AccBtn label="✅ Aprobar" color="#27ae60" onClick={()=>onAccion(m.id,m.usuario_id,"aprobar")} />}
          {m.rol==="miembro" && <AccBtn label="🛡️ Hacer mod" color="#3a7bd5" onClick={()=>onAccion(m.id,m.usuario_id,"hacer_mod")} />}
          {m.rol==="moderador" && <AccBtn label="⬇️ Quitar mod" color="#7f8c8d" onClick={()=>onAccion(m.id,m.usuario_id,"quitar_mod")} />}
          <AccBtn label={m.silenciado?"🔊 Activar":"🔇 Silenciar"} color="#e67e22" onClick={()=>onAccion(m.id,m.usuario_id,"silenciar")} />
          {m.estado==="activo" && <AccBtn label="🚫 Expulsar" color="#e74c3c" onClick={()=>onAccion(m.id,m.usuario_id,"expulsar")} />}
          {m.estado!=="bloqueado" && <AccBtn label="⛔ Bloquear" color="#c0392b" onClick={()=>onAccion(m.id,m.usuario_id,"bloquear")} />}
        </div>
      )}
    </div>
  );
}

function TarjetaAdjuntoAdmin({ adjunto, onEliminar }: { adjunto:any; onEliminar:()=>void }) {
  const iconos: Record<string,string> = { video:"🎬", imagen:"🖼️", pdf:"📕", word:"📝", archivo:"📎" };
  const tipo = adjunto.tipo || "archivo";
  return (
    <div style={{ background:"#fff", borderRadius:"16px", overflow:"hidden", boxShadow:"0 2px 8px rgba(0,0,0,0.06)" }}>
      <div style={{ height:"90px", background:"linear-gradient(135deg,#1a2a3a,#243b55)", display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden", position:"relative" }}>
        {tipo==="imagen" && <img src={adjunto.url} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />}
        {tipo==="video" && <div style={{ position:"relative", width:"100%", height:"100%" }}><video src={adjunto.url} style={{ width:"100%", height:"100%", objectFit:"cover" }} /><div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.4)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"28px" }}>▶️</div></div>}
        {(tipo!=="imagen"&&tipo!=="video") && <span style={{ fontSize:"36px", opacity:0.5 }}>{iconos[tipo]}</span>}
        <button onClick={onEliminar} style={{ position:"absolute", top:"6px", right:"6px", background:"rgba(231,76,60,0.9)", border:"none", borderRadius:"6px", width:"26px", height:"26px", fontSize:"13px", cursor:"pointer", color:"#fff", display:"flex", alignItems:"center", justifyContent:"center" }}>🗑️</button>
      </div>
      <div style={{ padding:"8px 10px" }}>
        <a href={adjunto.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration:"none" }}>
          <div style={{ fontSize:"11px", fontWeight:800, color:"#3a7bd5", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{adjunto.nombre||"Archivo"}</div>
        </a>
        <div style={{ fontSize:"10px", color:"#9a9a9a", fontWeight:600, marginTop:"2px" }}>por {adjunto.autor}</div>
      </div>
    </div>
  );
}

function AccBtn({ label, color, onClick }: { label:string; color:string; onClick:()=>void }) {
  return (
    <button onClick={onClick} style={{ background:`${color}15`, border:`1px solid ${color}40`, borderRadius:"8px", padding:"7px 12px", fontSize:"12px", fontWeight:800, color, cursor:"pointer", fontFamily:"'Nunito',sans-serif" }}>{label}</button>
  );
}

function Tarjeta({ titulo, children }: { titulo:string; children:React.ReactNode }) {
  return (
    <div style={{ background:"#fff", borderRadius:"16px", padding:"18px", boxShadow:"0 2px 10px rgba(0,0,0,0.06)" }}>
      <div style={{ fontSize:"12px", fontWeight:900, color:"#9a9a9a", textTransform:"uppercase", letterSpacing:"1px", marginBottom:"14px" }}>{titulo}</div>
      {children}
    </div>
  );
}

function Campo({ label, valor, onChange, multiline, placeholder }: { label:string; valor:string; onChange:(v:string)=>void; multiline?:boolean; placeholder?:string }) {
  return (
    <div style={{ marginBottom:"14px" }}>
      <label style={{ display:"block", fontSize:"11px", fontWeight:800, color:"#666", textTransform:"uppercase", letterSpacing:"1px", marginBottom:"6px" }}>{label}</label>
      {multiline
        ? <textarea value={valor} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={3} style={{ width:"100%", border:"2px solid #e8e8e6", borderRadius:"10px", padding:"11px 14px", fontSize:"13px", fontFamily:"'Nunito',sans-serif", color:"#2c2c2e", outline:"none", boxSizing:"border-box" as any, resize:"vertical" }} />
        : <input type="text" value={valor} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={{ width:"100%", border:"2px solid #e8e8e6", borderRadius:"10px", padding:"11px 14px", fontSize:"14px", fontFamily:"'Nunito',sans-serif", color:"#2c2c2e", outline:"none", boxSizing:"border-box" as any }} />
      }
    </div>
  );
}

function SectionHeader({ label, color }: { label:string; color:string }) {
  return <div style={{ fontSize:"11px", fontWeight:800, color, textTransform:"uppercase", letterSpacing:"1px", marginBottom:"8px", paddingLeft:"4px" }}>{label}</div>;
}

function RolBadge({ rol }: { rol:string }) {
  const map: Record<string,{c:string;bg:string;label:string}> = {
    creador:   { c:"#1a2a3a", bg:"#d4a017",             label:"👑 Creador" },
    moderador: { c:"#fff",    bg:"#3a7bd5",             label:"🛡️ Mod" },
    miembro:   { c:"#27ae60", bg:"rgba(39,174,96,0.12)", label:"✅ Miembro" },
  };
  const s = map[rol]||map.miembro;
  return <span style={{ background:s.bg, color:s.c, borderRadius:"20px", padding:"3px 10px", fontSize:"10px", fontWeight:900 }}>{s.label}</span>;
}

function EmptyState({ emoji, texto, sub }: { emoji:string; texto:string; sub:string }) {
  return (
    <div style={{ textAlign:"center", padding:"50px 20px", background:"#fff", borderRadius:"16px" }}>
      <div style={{ fontSize:"48px", marginBottom:"12px" }}>{emoji}</div>
      <div style={{ fontSize:"16px", fontWeight:900, color:"#1a2a3a", marginBottom:"6px" }}>{texto}</div>
      <div style={{ fontSize:"13px", color:"#9a9a9a", fontWeight:600 }}>{sub}</div>
    </div>
  );
}
