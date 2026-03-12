"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const ADMIN_UUID = "ab56253d-b92e-4b73-a19a-3cd0cd95c458";

type Tab = "dashboard" | "usuarios" | "promotores" | "anuncios" | "grupos" | "soporte" | "config";

// ─── helpers de estilo ───────────────────────────────────────────────────────
const S = {
  card:  { background:"#fff", borderRadius:"16px", padding:"20px", boxShadow:"0 2px 12px rgba(0,0,0,0.07)", marginBottom:"14px" } as React.CSSProperties,
  label: { display:"block", fontSize:"11px", fontWeight:800, color:"#666", textTransform:"uppercase" as const, letterSpacing:"1px", marginBottom:"6px" },
  input: { width:"100%", border:"2px solid #e8e8e6", borderRadius:"10px", padding:"10px 14px", fontSize:"14px", fontFamily:"'Nunito',sans-serif", color:"#2c2c2e", outline:"none", boxSizing:"border-box" as const },
  btn:   (c="#d4a017") => ({ background:`linear-gradient(135deg,${c},${c}dd)`, border:"none", borderRadius:"10px", padding:"8px 16px", fontSize:"12px", fontWeight:900, color: c==="#e74c3c"||c==="#27ae60"||c==="#3a7bd5" ? "#fff":"#1a2a3a", cursor:"pointer", fontFamily:"'Nunito',sans-serif" } as React.CSSProperties),
  badge: (c:string, bg:string) => ({ background:bg, color:c, borderRadius:"20px", padding:"3px 10px", fontSize:"10px", fontWeight:900 } as React.CSSProperties),
};

const StatBox = ({ n, l, e, c="#d4a017" }:{n:string;l:string;e:string;c?:string}) => (
  <div style={{ background:"#fff", borderRadius:"14px", padding:"16px 12px", textAlign:"center", boxShadow:"0 2px 8px rgba(0,0,0,0.06)" }}>
    <div style={{ fontSize:"22px", marginBottom:"4px" }}>{e}</div>
    <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"28px", color:c, lineHeight:1 }}>{n}</div>
    <div style={{ fontSize:"10px", fontWeight:700, color:"#9a9a9a", textTransform:"uppercase", letterSpacing:"0.5px", lineHeight:1.3, marginTop:"2px" }}>{l}</div>
  </div>
);

export default function AdminPanel() {
  const router = useRouter();
  const [authed,  setAuthed]  = useState(false);
  const [tab,     setTab]     = useState<Tab>("dashboard");
  const [loading, setLoading] = useState(true);

  // ── datos globales ──
  const [stats,      setStats]      = useState<any>({});
  const [usuarios,   setUsuarios]   = useState<any[]>([]);
  const [anuncios,   setAnuncios]   = useState<any[]>([]);
  const [grupos,     setGrupos]     = useState<any[]>([]);
  const [liqs,       setLiqs]       = useState<any[]>([]);
  const [comisiones, setComisiones] = useState<any[]>([]);
  const [mensajes,   setMensajes]   = useState<any[]>([]);
  const [rubros,     setRubros]     = useState<any[]>([]);

  // ── filtros usuarios ──
  const [busqUser, setBusqUser] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("todos");

  // ── modal asignar BIT ──
  const [modalBit, setModalBit] = useState<any>(null);
  const [bitTipo,  setBitTipo]  = useState("bits_free");
  const [bitCant,  setBitCant]  = useState("");
  const [bitNota,  setBitNota]  = useState("");

  // ── modal reasignar referido ──
  const [modalRef, setModalRef] = useState<any>(null);
  const [nuevoRefCodigo, setNuevoRefCodigo] = useState("");

  // ── auth check ──
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session || session.user.id !== ADMIN_UUID) {
        router.push("/admin/login");
        return;
      }
      setAuthed(true);
      cargarTodo();
    });
  }, []);

  const cargarTodo = useCallback(async () => {
    setLoading(true);
    const [
      { data: usrs },
      { data: anuns },
      { data: grps },
      { data: liquidaciones },
      { data: coms },
      { data: msgs },
      { data: rubs },
      { count: totalUsers },
      { count: totalAnuncios },
      { count: totalGrupos },
      { count: totalMensajes },
    ] = await Promise.all([
      supabase.from("usuarios").select("*").order("created_at", { ascending: false }).limit(200),
      supabase.from("anuncios").select("*,usuarios(nombre_usuario,codigo)").order("created_at", { ascending: false }).limit(200),
      supabase.from("grupos").select("*,usuarios(nombre_usuario)").order("created_at", { ascending: false }).limit(100),
      supabase.from("liquidaciones_promotor").select("*,usuarios(nombre_usuario,codigo,email)").order("created_at", { ascending: false }),
      supabase.from("comisiones_promotor").select("*,promotor:promotor_id(nombre_usuario,codigo),origen:origen_id(nombre_usuario,codigo)").order("created_at", { ascending: false }).limit(100),
      supabase.from("mensajes").select("*,emisor:emisor_id(nombre_usuario),receptor:receptor_id(nombre_usuario)").order("created_at", { ascending: false }).limit(100),
      supabase.from("rubros").select("*,subrubros(id,nombre)").order("nombre"),
      supabase.from("usuarios").select("*", { count: "exact", head: true }),
      supabase.from("anuncios").select("*", { count: "exact", head: true }),
      supabase.from("grupos").select("*", { count: "exact", head: true }),
      supabase.from("mensajes").select("*", { count: "exact", head: true }),
    ]);

    setUsuarios(usrs || []);
    setAnuncios(anuns || []);
    setGrupos(grps || []);
    setLiqs(liquidaciones || []);
    setComisiones(coms || []);
    setMensajes(msgs || []);
    setRubros(rubs || []);

    const promotores  = (usrs || []).filter((u: any) => u.es_promotor).length;
    const bitsLibres  = (usrs || []).reduce((a: number, u: any) => a + (u.bits_free || 0), 0);
    const bitsNexo    = (usrs || []).reduce((a: number, u: any) => a + (u.bits || 0), 0);
    const bitsPromo   = (usrs || []).reduce((a: number, u: any) => a + (u.bits_promotor || 0), 0);
    const liqPend     = (liquidaciones || []).filter((l: any) => l.estado === "pendiente").length;

    setStats({ totalUsers, totalAnuncios, totalGrupos, totalMensajes, promotores, bitsLibres, bitsNexo, bitsPromo, liqPend });
    setLoading(false);
  }, []);

  const cerrarSesion = async () => { await supabase.auth.signOut(); router.push("/admin/login"); };

  // ── acciones usuarios ──
  const bloquearUsuario = async (u: any) => {
    const nuevoEstado = u.bloqueado ? false : true;
    await supabase.from("usuarios").update({ bloqueado: nuevoEstado }).eq("id", u.id);
    setUsuarios(prev => prev.map(x => x.id === u.id ? { ...x, bloqueado: nuevoEstado } : x));
  };

  const asignarBit = async () => {
    if (!modalBit || !bitCant) return;
    const cant = parseInt(bitCant);
    if (isNaN(cant) || cant <= 0) return;
    const actual = modalBit[bitTipo] || 0;
    await supabase.from("usuarios").update({ [bitTipo]: actual + cant }).eq("id", modalBit.id);
    setUsuarios(prev => prev.map(x => x.id === modalBit.id ? { ...x, [bitTipo]: actual + cant } : x));
    setModalBit(null); setBitCant(""); setBitNota("");
  };

  const reasignarReferido = async () => {
    if (!modalRef || !nuevoRefCodigo.trim()) return;
    const { data: nuevo } = await supabase.from("usuarios").select("id").eq("codigo", nuevoRefCodigo.trim().toUpperCase()).single();
    if (!nuevo) { alert("Código no encontrado"); return; }
    await supabase.from("usuarios").update({ referido_por: nuevo.id }).eq("id", modalRef.id);
    setUsuarios(prev => prev.map(x => x.id === modalRef.id ? { ...x, referido_por: nuevo.id } : x));
    setModalRef(null); setNuevoRefCodigo("");
  };

  // ── acciones anuncios ──
  const toggleAnuncio = async (a: any) => {
    const nuevo = a.estado === "activo" ? "bloqueado" : "activo";
    await supabase.from("anuncios").update({ estado: nuevo }).eq("id", a.id);
    setAnuncios(prev => prev.map(x => x.id === a.id ? { ...x, estado: nuevo } : x));
  };

  // ── liquidaciones ──
  const aprobarLiq = async (l: any) => {
    await supabase.from("liquidaciones_promotor").update({ estado: "aprobada" }).eq("id", l.id);
    setLiqs(prev => prev.map(x => x.id === l.id ? { ...x, estado: "aprobada" } : x));
  };
  const rechazarLiq = async (l: any) => {
    // Devolver los bits al promotor
    const { data: u } = await supabase.from("usuarios").select("bits_promotor").eq("id", l.promotor_id).single();
    if (u) await supabase.from("usuarios").update({ bits_promotor: (u.bits_promotor || 0) + l.monto_bits }).eq("id", l.promotor_id);
    await supabase.from("liquidaciones_promotor").update({ estado: "rechazada" }).eq("id", l.id);
    setLiqs(prev => prev.map(x => x.id === l.id ? { ...x, estado: "rechazada" } : x));
  };

  if (!authed) return null;

  const TABS: { id: Tab; e: string; l: string }[] = [
    { id:"dashboard",  e:"📊", l:"Dashboard"  },
    { id:"usuarios",   e:"👥", l:"Usuarios"   },
    { id:"promotores", e:"⭐", l:"Promotores" },
    { id:"anuncios",   e:"📋", l:"Anuncios"   },
    { id:"grupos",     e:"🏘️", l:"Grupos"     },
    { id:"soporte",    e:"💬", l:"Soporte"    },
    { id:"config",     e:"⚙️", l:"Config"     },
  ];

  const usuariosFiltrados = usuarios.filter(u => {
    const matchBusq = !busqUser || u.nombre_usuario?.toLowerCase().includes(busqUser.toLowerCase()) || u.codigo?.toLowerCase().includes(busqUser.toLowerCase()) || u.email?.toLowerCase().includes(busqUser.toLowerCase());
    const matchTipo = filtroTipo === "todos" || (filtroTipo === "promotor" && u.es_promotor) || (filtroTipo === "bloqueado" && u.bloqueado) || (filtroTipo === "empresa" && u.plan === "nexoempresa");
    return matchBusq && matchTipo;
  });

  return (
    <main style={{ minHeight:"100vh", background:"#f4f4f2", fontFamily:"'Nunito',sans-serif" }}>

      {/* HEADER ADMIN */}
      <div style={{ background:"linear-gradient(135deg,#0d1a26,#1a2a3a)", padding:"0 16px", position:"sticky", top:0, zIndex:100, boxShadow:"0 2px 12px rgba(0,0,0,0.4)" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", height:"56px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
            <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"22px" }}>
              <span style={{ color:"#c8c8c8" }}>Nexo</span><span style={{ color:"#d4a017" }}>Net</span>
            </div>
            <span style={{ background:"rgba(231,76,60,0.2)", border:"1px solid rgba(231,76,60,0.5)", borderRadius:"6px", padding:"2px 8px", fontSize:"10px", fontWeight:900, color:"#ff8a80", letterSpacing:"1px" }}>ADMIN</span>
          </div>
          <button onClick={cerrarSesion} style={{ background:"rgba(255,80,80,0.15)", border:"1px solid rgba(255,80,80,0.4)", borderRadius:"10px", padding:"6px 14px", color:"#ff6b6b", fontSize:"12px", fontWeight:800, cursor:"pointer", fontFamily:"'Nunito',sans-serif" }}>
            🚪 Salir
          </button>
        </div>

        {/* TABS */}
        <div style={{ display:"flex", overflowX:"auto", scrollbarWidth:"none", paddingBottom:"1px" }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ flexShrink:0, background:"none", border:"none", borderBottom: tab===t.id ? "3px solid #d4a017" : "3px solid transparent", padding:"10px 14px", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:"2px" }}>
              <span style={{ fontSize:"15px" }}>{t.e}</span>
              <span style={{ fontSize:"9px", fontWeight:800, color: tab===t.id ? "#d4a017" : "#8a9aaa", textTransform:"uppercase", letterSpacing:"0.5px", whiteSpace:"nowrap" }}>{t.l}</span>
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div style={{ textAlign:"center", padding:"60px 20px", color:"#9a9a9a", fontSize:"14px", fontWeight:600 }}>Cargando datos...</div>
      )}

      {!loading && (
        <div style={{ padding:"16px", maxWidth:"600px", margin:"0 auto" }}>

          {/* ══ DASHBOARD ══════════════════════════════════════════════════ */}
          {tab === "dashboard" && (
            <>
              <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"22px", color:"#1a2a3a", letterSpacing:"1px", marginBottom:"14px" }}>📊 Dashboard General</div>

              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px", marginBottom:"14px" }}>
                <StatBox n={String(stats.totalUsers||0)}    l="Usuarios"     e="👥" />
                <StatBox n={String(stats.totalAnuncios||0)} l="Anuncios"     e="📋" />
                <StatBox n={String(stats.totalGrupos||0)}   l="Grupos"       e:"🏘️" e="🏘️" />
                <StatBox n={String(stats.promotores||0)}    l="Promotores"   e="⭐" c="#27ae60" />
                <StatBox n={String(stats.totalMensajes||0)} l="Mensajes"     e="💬" c="#3a7bd5" />
                <StatBox n={String(stats.liqPend||0)}       l="Liqs pendientes" e="💳" c="#e74c3c" />
              </div>

              <div style={S.card}>
                <div style={{ fontSize:"11px", fontWeight:800, color:"#9a9a9a", textTransform:"uppercase", letterSpacing:"1px", marginBottom:"14px" }}>💰 BIT en circulación</div>
                {[
                  { l:"BIT Free en cuentas",     v:stats.bitsLibres||0, c:"#3a7bd5" },
                  { l:"BIT Nexo en cuentas",      v:stats.bitsNexo||0,   c:"#d4a017" },
                  { l:"BIT Promotor en cuentas",  v:stats.bitsPromo||0,  c:"#27ae60" },
                ].map(r => (
                  <div key={r.l} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 0", borderBottom:"1px solid #f4f4f2" }}>
                    <span style={{ fontSize:"13px", fontWeight:700, color:"#555" }}>{r.l}</span>
                    <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"22px", color:r.c }}>{r.v.toLocaleString()}</span>
                  </div>
                ))}
              </div>

              <div style={S.card}>
                <div style={{ fontSize:"11px", fontWeight:800, color:"#9a9a9a", textTransform:"uppercase", letterSpacing:"1px", marginBottom:"14px" }}>📅 Últimos registros</div>
                {usuarios.slice(0, 8).map((u: any) => (
                  <div key={u.id} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"8px 0", borderBottom:"1px solid #f8f8f8" }}>
                    <div>
                      <div style={{ fontSize:"13px", fontWeight:800, color:"#1a2a3a" }}>{u.nombre_usuario||"—"}</div>
                      <div style={{ fontSize:"10px", color:"#9a9a9a", fontWeight:600 }}>{u.codigo} · {new Date(u.created_at).toLocaleDateString("es-AR")}</div>
                    </div>
                    <span style={S.badge(u.es_promotor?"#d4a017":"#3a7bd5", u.es_promotor?"rgba(212,160,23,0.12)":"rgba(58,123,213,0.1)")}>
                      {u.es_promotor ? "⭐ Promotor" : "👤 Free"}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ══ USUARIOS ════════════════════════════════════════════════════ */}
          {tab === "usuarios" && (
            <>
              <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"22px", color:"#1a2a3a", letterSpacing:"1px", marginBottom:"14px" }}>👥 Gestión de Usuarios</div>

              {/* Filtros */}
              <div style={S.card}>
                <input value={busqUser} onChange={e=>setBusqUser(e.target.value)} placeholder="🔍 Buscar por nombre, código o email..." style={{ ...S.input, marginBottom:"10px" }} />
                <div style={{ display:"flex", gap:"6px", flexWrap:"wrap" }}>
                  {["todos","promotor","bloqueado","empresa"].map(f => (
                    <button key={f} onClick={()=>setFiltroTipo(f)}
                      style={{ ...S.btn(filtroTipo===f?"#d4a017":"#f0f0f0"), color:filtroTipo===f?"#1a2a3a":"#666", fontSize:"11px", padding:"6px 12px" }}>
                      {f.charAt(0).toUpperCase()+f.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ fontSize:"12px", color:"#9a9a9a", fontWeight:700, marginBottom:"10px" }}>{usuariosFiltrados.length} usuarios</div>

              {usuariosFiltrados.map((u: any) => (
                <div key={u.id} style={{ ...S.card, borderLeft: u.bloqueado ? "4px solid #e74c3c" : "4px solid transparent" }}>
                  <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:"10px" }}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:"8px", flexWrap:"wrap" }}>
                        <span style={{ fontSize:"14px", fontWeight:900, color:"#1a2a3a" }}>{u.nombre_usuario||"—"}</span>
                        <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"13px", color:"#d4a017", letterSpacing:"1px" }}>{u.codigo}</span>
                        {u.es_promotor && <span style={S.badge("#d4a017","rgba(212,160,23,0.12)")}>⭐ Promotor</span>}
                        {u.bloqueado   && <span style={S.badge("#e74c3c","rgba(231,76,60,0.1)")}>🚫 Bloqueado</span>}
                        {u.plan==="nexoempresa" && <span style={S.badge("#8e44ad","rgba(142,68,173,0.1)")}>🏢 Empresa</span>}
                      </div>
                      <div style={{ fontSize:"11px", color:"#9a9a9a", fontWeight:600, marginTop:"3px" }}>
                        {u.email} · {new Date(u.created_at).toLocaleDateString("es-AR")}
                      </div>
                      <div style={{ display:"flex", gap:"10px", marginTop:"6px", flexWrap:"wrap" }}>
                        <span style={{ fontSize:"11px", fontWeight:700, color:"#3a7bd5" }}>💙 Free: {(u.bits_free||0).toLocaleString()}</span>
                        <span style={{ fontSize:"11px", fontWeight:700, color:"#d4a017" }}>💛 Nexo: {(u.bits||0).toLocaleString()}</span>
                        <span style={{ fontSize:"11px", fontWeight:700, color:"#27ae60" }}>⭐ Promo: {(u.bits_promotor||0).toLocaleString()}</span>
                        <span style={{ fontSize:"11px", fontWeight:700, color:"#16a085" }}>🔍 Búsq: {(u.bits_busquedas||0).toLocaleString()}</span>
                      </div>
                      {u.referido_por && (
                        <div style={{ fontSize:"10px", color:"#9a9a9a", fontWeight:600, marginTop:"3px" }}>
                          Referido por: {usuarios.find((x:any)=>x.id===u.referido_por)?.codigo||u.referido_por.slice(0,8)}
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:"6px", flexWrap:"wrap" }}>
                    <button onClick={()=>{ setModalBit(u); setBitTipo("bits_free"); setBitCant(""); }} style={S.btn("#3a7bd5")}>💙 Asignar BIT</button>
                    <button onClick={()=>{ setModalRef(u); setNuevoRefCodigo(""); }} style={S.btn("#8e44ad")}>🔁 Referido</button>
                    <button onClick={()=>bloquearUsuario(u)} style={S.btn(u.bloqueado?"#27ae60":"#e74c3c")}>
                      {u.bloqueado ? "✅ Desbloquear" : "🚫 Bloquear"}
                    </button>
                  </div>
                </div>
              ))}
            </>
          )}

          {/* ══ PROMOTORES ══════════════════════════════════════════════════ */}
          {tab === "promotores" && (
            <>
              <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"22px", color:"#1a2a3a", letterSpacing:"1px", marginBottom:"14px" }}>⭐ Promotores y Liquidaciones</div>

              {/* Liquidaciones pendientes */}
              {liqs.filter((l:any)=>l.estado==="pendiente").length > 0 && (
                <div style={{ background:"rgba(231,76,60,0.06)", border:"2px solid rgba(231,76,60,0.2)", borderRadius:"16px", padding:"16px", marginBottom:"14px" }}>
                  <div style={{ fontSize:"13px", fontWeight:900, color:"#e74c3c", marginBottom:"12px" }}>🔔 {liqs.filter((l:any)=>l.estado==="pendiente").length} liquidación(es) pendiente(s)</div>
                  {liqs.filter((l:any)=>l.estado==="pendiente").map((l:any) => (
                    <div key={l.id} style={{ background:"#fff", borderRadius:"12px", padding:"14px", marginBottom:"8px" }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"8px" }}>
                        <div>
                          <div style={{ fontSize:"13px", fontWeight:900, color:"#1a2a3a" }}>{l.usuarios?.nombre_usuario||"—"} · {l.usuarios?.codigo}</div>
                          <div style={{ fontSize:"11px", color:"#9a9a9a", fontWeight:600 }}>{l.usuarios?.email}</div>
                          <div style={{ fontSize:"11px", color:"#9a9a9a", fontWeight:600 }}>{new Date(l.created_at).toLocaleDateString("es-AR")}</div>
                          {l.factura_url && <a href={l.factura_url} target="_blank" style={{ fontSize:"11px", color:"#3a7bd5", fontWeight:700 }}>📄 Ver factura</a>}
                        </div>
                        <div style={{ textAlign:"right" }}>
                          <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"28px", color:"#d4a017" }}>{l.monto_bits.toLocaleString()}</div>
                          <div style={{ fontSize:"10px", color:"#9a9a9a", fontWeight:600 }}>BIT · ${(l.monto_bits*1000).toLocaleString("es-AR")}</div>
                        </div>
                      </div>
                      <div style={{ display:"flex", gap:"8px" }}>
                        <button onClick={()=>aprobarLiq(l)} style={{ ...S.btn("#27ae60"), flex:1 }}>✅ Aprobar</button>
                        <button onClick={()=>rechazarLiq(l)} style={{ ...S.btn("#e74c3c"), flex:1 }}>❌ Rechazar</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Historial liquidaciones */}
              <div style={S.card}>
                <div style={{ fontSize:"11px", fontWeight:800, color:"#9a9a9a", textTransform:"uppercase", letterSpacing:"1px", marginBottom:"14px" }}>📋 Historial de liquidaciones</div>
                {liqs.length === 0 ? (
                  <div style={{ textAlign:"center", padding:"20px", color:"#bbb", fontSize:"13px" }}>Sin liquidaciones</div>
                ) : liqs.map((l:any) => (
                  <div key={l.id} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 0", borderBottom:"1px solid #f8f8f8" }}>
                    <div>
                      <div style={{ fontSize:"13px", fontWeight:800, color:"#1a2a3a" }}>{l.usuarios?.nombre_usuario} · {l.usuarios?.codigo}</div>
                      <div style={{ fontSize:"10px", color:"#9a9a9a", fontWeight:600 }}>{new Date(l.created_at).toLocaleDateString("es-AR")} · {l.monto_bits} BIT</div>
                    </div>
                    <span style={S.badge(
                      l.estado==="aprobada"?"#27ae60":l.estado==="rechazada"?"#e74c3c":"#d4a017",
                      l.estado==="aprobada"?"#e8f8ee":l.estado==="rechazada"?"#fef0ef":"#fff8e0"
                    )}>{l.estado.toUpperCase()}</span>
                  </div>
                ))}
              </div>

              {/* Ranking promotores */}
              <div style={S.card}>
                <div style={{ fontSize:"11px", fontWeight:800, color:"#9a9a9a", textTransform:"uppercase", letterSpacing:"1px", marginBottom:"14px" }}>🏆 Ranking de Promotores</div>
                {usuarios.filter((u:any)=>u.es_promotor).sort((a:any,b:any)=>(b.bits_promotor_total||0)-(a.bits_promotor_total||0)).slice(0,20).map((u:any,i:number) => (
                  <div key={u.id} style={{ display:"flex", alignItems:"center", gap:"12px", padding:"10px 0", borderBottom:"1px solid #f8f8f8" }}>
                    <div style={{ width:"28px", height:"28px", borderRadius:"50%", background:i<3?"rgba(212,160,23,0.2)":"#f4f4f2", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"13px", fontWeight:900, color:i<3?"#d4a017":"#9a9a9a", flexShrink:0 }}>{i+1}</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:"13px", fontWeight:800, color:"#1a2a3a" }}>{u.nombre_usuario} · <span style={{ color:"#d4a017" }}>{u.codigo}</span></div>
                      <div style={{ fontSize:"11px", color:"#9a9a9a", fontWeight:600 }}>{u.total_referidos||0} referidos</div>
                    </div>
                    <div style={{ textAlign:"right" }}>
                      <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"20px", color:"#27ae60" }}>{(u.bits_promotor_total||0).toLocaleString()}</div>
                      <div style={{ fontSize:"10px", color:"#9a9a9a", fontWeight:600 }}>BIT ganados</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Últimas comisiones */}
              <div style={S.card}>
                <div style={{ fontSize:"11px", fontWeight:800, color:"#9a9a9a", textTransform:"uppercase", letterSpacing:"1px", marginBottom:"14px" }}>💰 Últimas comisiones acreditadas</div>
                {comisiones.slice(0,20).map((c:any) => (
                  <div key={c.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 0", borderBottom:"1px solid #f8f8f8" }}>
                    <div>
                      <div style={{ fontSize:"12px", fontWeight:800, color:"#1a2a3a" }}>
                        {(c.promotor as any)?.nombre_usuario} ← {(c.origen as any)?.nombre_usuario}
                      </div>
                      <div style={{ fontSize:"10px", color:"#9a9a9a", fontWeight:600 }}>Nivel {c.nivel} · {c.concepto} · {new Date(c.created_at).toLocaleDateString("es-AR")}</div>
                    </div>
                    <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"18px", color:"#27ae60" }}>+{c.monto_comision}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ══ ANUNCIOS ════════════════════════════════════════════════════ */}
          {tab === "anuncios" && (
            <>
              <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"22px", color:"#1a2a3a", letterSpacing:"1px", marginBottom:"14px" }}>📋 Moderación de Anuncios</div>
              {anuncios.map((a:any) => (
                <div key={a.id} style={{ ...S.card, borderLeft:`4px solid ${a.estado==="activo"?"#27ae60":a.estado==="bloqueado"?"#e74c3c":"#d4a017"}` }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"8px" }}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:"14px", fontWeight:900, color:"#1a2a3a", marginBottom:"2px", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{a.titulo||"Sin título"}</div>
                      <div style={{ fontSize:"11px", color:"#9a9a9a", fontWeight:600 }}>
                        {(a.usuarios as any)?.nombre_usuario} · {(a.usuarios as any)?.codigo} · {new Date(a.created_at).toLocaleDateString("es-AR")}
                      </div>
                      {a.precio && <div style={{ fontSize:"12px", fontWeight:800, color:"#d4a017", marginTop:"2px" }}>${Number(a.precio).toLocaleString("es-AR")}</div>}
                    </div>
                    <span style={S.badge(
                      a.estado==="activo"?"#27ae60":a.estado==="bloqueado"?"#e74c3c":"#d4a017",
                      a.estado==="activo"?"#e8f8ee":a.estado==="bloqueado"?"#fef0ef":"#fff8e0"
                    )}>{a.estado?.toUpperCase()||"—"}</span>
                  </div>
                  {a.descripcion && <div style={{ fontSize:"12px", color:"#666", fontWeight:600, marginBottom:"10px", lineHeight:1.5, overflow:"hidden", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical" as any }}>{a.descripcion}</div>}
                  <div style={{ display:"flex", gap:"6px" }}>
                    <button onClick={()=>toggleAnuncio(a)} style={S.btn(a.estado==="activo"?"#e74c3c":"#27ae60")}>
                      {a.estado==="activo" ? "🚫 Bloquear" : "✅ Activar"}
                    </button>
                    <a href={`/anuncios/${a.id}`} target="_blank" style={{ ...S.btn("#3a7bd5"), textDecoration:"none", display:"inline-flex", alignItems:"center" }}>👁️ Ver</a>
                  </div>
                </div>
              ))}
            </>
          )}

          {/* ══ GRUPOS ══════════════════════════════════════════════════════ */}
          {tab === "grupos" && (
            <>
              <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"22px", color:"#1a2a3a", letterSpacing:"1px", marginBottom:"14px" }}>🏘️ Gestión de Grupos</div>
              {grupos.map((g:any) => (
                <div key={g.id} style={S.card}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"8px" }}>
                    <div>
                      <div style={{ fontSize:"14px", fontWeight:900, color:"#1a2a3a" }}>{g.nombre}</div>
                      <div style={{ fontSize:"11px", color:"#9a9a9a", fontWeight:600 }}>
                        Creador: {(g.usuarios as any)?.nombre_usuario} · {g.miembros_count||0} miembros · {new Date(g.created_at).toLocaleDateString("es-AR")}
                      </div>
                    </div>
                    <span style={S.badge(g.activo!==false?"#27ae60":"#e74c3c", g.activo!==false?"#e8f8ee":"#fef0ef")}>
                      {g.activo!==false?"ACTIVO":"INACTIVO"}
                    </span>
                  </div>
                  <div style={{ display:"flex", gap:"6px" }}>
                    <button onClick={async()=>{
                      await supabase.from("grupos").update({ activo: g.activo===false }).eq("id", g.id);
                      setGrupos(prev=>prev.map(x=>x.id===g.id?{...x,activo:g.activo===false}:x));
                    }} style={S.btn(g.activo!==false?"#e74c3c":"#27ae60")}>
                      {g.activo!==false?"🚫 Desactivar":"✅ Activar"}
                    </button>
                    <a href={`/grupos/${g.id}`} target="_blank" style={{ ...S.btn("#3a7bd5"), textDecoration:"none", display:"inline-flex", alignItems:"center" }}>👁️ Ver</a>
                  </div>
                </div>
              ))}
            </>
          )}

          {/* ══ SOPORTE ═════════════════════════════════════════════════════ */}
          {tab === "soporte" && (
            <>
              <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"22px", color:"#1a2a3a", letterSpacing:"1px", marginBottom:"14px" }}>💬 Soporte y Mensajes</div>
              <div style={S.card}>
                <div style={{ fontSize:"11px", fontWeight:800, color:"#9a9a9a", textTransform:"uppercase", letterSpacing:"1px", marginBottom:"14px" }}>📨 Últimos mensajes</div>
                {mensajes.length === 0 ? (
                  <div style={{ textAlign:"center", padding:"20px", color:"#bbb", fontSize:"13px" }}>Sin mensajes</div>
                ) : mensajes.map((m:any) => (
                  <div key={m.id} style={{ padding:"10px 0", borderBottom:"1px solid #f8f8f8" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"3px" }}>
                      <div style={{ fontSize:"12px", fontWeight:800, color:"#1a2a3a" }}>
                        {(m.emisor as any)?.nombre_usuario||"—"} → {(m.receptor as any)?.nombre_usuario||"—"}
                      </div>
                      <div style={{ fontSize:"10px", color:"#bbb", fontWeight:600 }}>
                        {new Date(m.created_at).toLocaleString("es-AR",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"})}
                      </div>
                    </div>
                    <div style={{ fontSize:"12px", color:"#666", fontWeight:600, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{m.texto}</div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ══ CONFIG ══════════════════════════════════════════════════════ */}
          {tab === "config" && (
            <>
              <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"22px", color:"#1a2a3a", letterSpacing:"1px", marginBottom:"14px" }}>⚙️ Configuración</div>

              <div style={S.card}>
                <div style={{ fontSize:"11px", fontWeight:800, color:"#9a9a9a", textTransform:"uppercase", letterSpacing:"1px", marginBottom:"14px" }}>📂 Rubros y Subrubros</div>
                {rubros.map((r:any) => (
                  <div key={r.id} style={{ marginBottom:"10px" }}>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"8px 12px", background:"#f4f4f2", borderRadius:"10px", marginBottom:"4px" }}>
                      <span style={{ fontSize:"13px", fontWeight:800, color:"#1a2a3a" }}>{r.nombre}</span>
                      <span style={{ fontSize:"11px", color:"#9a9a9a", fontWeight:700 }}>{(r.subrubros||[]).length} subrubros</span>
                    </div>
                    <div style={{ paddingLeft:"12px", display:"flex", flexWrap:"wrap", gap:"4px" }}>
                      {(r.subrubros||[]).slice(0,8).map((s:any) => (
                        <span key={s.id} style={{ background:"#fff", border:"1px solid #e8e8e6", borderRadius:"6px", padding:"2px 8px", fontSize:"10px", fontWeight:700, color:"#666" }}>{s.nombre}</span>
                      ))}
                      {(r.subrubros||[]).length > 8 && <span style={{ fontSize:"10px", color:"#bbb", fontWeight:600, padding:"2px 4px" }}>+{(r.subrubros||[]).length - 8} más</span>}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ ...S.card, background:"linear-gradient(135deg,#1a2a3a,#243b55)", color:"#fff" }}>
                <div style={{ fontSize:"11px", fontWeight:800, color:"#8a9aaa", textTransform:"uppercase", letterSpacing:"1px", marginBottom:"14px" }}>🔧 Acciones del sistema</div>
                {[
                  { l:"Recargar todos los datos", e:"🔄", fn:cargarTodo },
                  { l:"Ir a nexonet.ar", e:"🌐", fn:()=>window.open("https://nexonet.ar","_blank") },
                  { l:"Supabase Dashboard", e:"🗄️", fn:()=>window.open("https://supabase.com/dashboard","_blank") },
                  { l:"Vercel Dashboard", e:"▲", fn:()=>window.open("https://vercel.com/dashboard","_blank") },
                ].map(a => (
                  <button key={a.l} onClick={a.fn}
                    style={{ width:"100%", background:"rgba(255,255,255,0.07)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:"10px", padding:"12px 16px", fontSize:"13px", fontWeight:800, color:"#fff", cursor:"pointer", fontFamily:"'Nunito',sans-serif", textAlign:"left", marginBottom:"8px", display:"flex", alignItems:"center", gap:"10px" }}>
                    <span style={{ fontSize:"18px" }}>{a.e}</span>{a.l}
                  </button>
                ))}
              </div>
            </>
          )}

        </div>
      )}

      {/* ══ MODAL ASIGNAR BIT ══ */}
      {modalBit && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", zIndex:500, display:"flex", alignItems:"flex-end" }} onClick={()=>setModalBit(null)}>
          <div style={{ width:"100%", background:"#fff", borderRadius:"24px 24px 0 0", padding:"28px 20px 44px", fontFamily:"'Nunito',sans-serif" }} onClick={e=>e.stopPropagation()}>
            <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"20px", color:"#1a2a3a", letterSpacing:"1px", marginBottom:"4px" }}>💙 Asignar BIT</div>
            <div style={{ fontSize:"13px", color:"#9a9a9a", fontWeight:600, marginBottom:"20px" }}>{modalBit.nombre_usuario} · {modalBit.codigo}</div>
            <label style={S.label}>Tipo de BIT</label>
            <select value={bitTipo} onChange={e=>setBitTipo(e.target.value)} style={{ ...S.input, padding:"10px 14px", marginBottom:"14px" }}>
              <option value="bits_free">BIT Free 💙</option>
              <option value="bits">BIT Nexo 💛</option>
              <option value="bits_busquedas">BIT Búsquedas 🔍</option>
              <option value="bits_promotor">BIT Promotor ⭐</option>
            </select>
            <label style={S.label}>Cantidad</label>
            <input type="number" value={bitCant} onChange={e=>setBitCant(e.target.value)} placeholder="Ej: 100" style={{ ...S.input, marginBottom:"14px" }} />
            <label style={S.label}>Nota interna (opcional)</label>
            <input type="text" value={bitNota} onChange={e=>setBitNota(e.target.value)} placeholder="Motivo..." style={{ ...S.input, marginBottom:"20px" }} />
            <button onClick={asignarBit} style={{ ...S.btn(), width:"100%", padding:"14px", fontSize:"15px", boxShadow:"0 4px 0 #a07810", marginBottom:"10px" }}>✅ Confirmar asignación</button>
            <button onClick={()=>setModalBit(null)} style={{ width:"100%", background:"none", border:"none", fontSize:"13px", fontWeight:700, color:"#9a9a9a", cursor:"pointer", fontFamily:"'Nunito',sans-serif", padding:"8px" }}>Cancelar</button>
          </div>
        </div>
      )}

      {/* ══ MODAL REASIGNAR REFERIDO ══ */}
      {modalRef && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", zIndex:500, display:"flex", alignItems:"flex-end" }} onClick={()=>setModalRef(null)}>
          <div style={{ width:"100%", background:"#fff", borderRadius:"24px 24px 0 0", padding:"28px 20px 44px", fontFamily:"'Nunito',sans-serif" }} onClick={e=>e.stopPropagation()}>
            <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"20px", color:"#1a2a3a", letterSpacing:"1px", marginBottom:"4px" }}>🔁 Reasignar Referido</div>
            <div style={{ fontSize:"13px", color:"#9a9a9a", fontWeight:600, marginBottom:"6px" }}>{modalRef.nombre_usuario} · {modalRef.codigo}</div>
            <div style={{ fontSize:"12px", color:"#e74c3c", fontWeight:700, marginBottom:"20px" }}>⚠️ Las comisiones futuras se redirigirán al nuevo promotor</div>
            <label style={S.label}>Código del nuevo promotor</label>
            <input type="text" value={nuevoRefCodigo} onChange={e=>setNuevoRefCodigo(e.target.value.toUpperCase())} placeholder="NXN-00001" style={{ ...S.input, marginBottom:"20px" }} />
            <button onClick={reasignarReferido} style={{ ...S.btn("#8e44ad"), width:"100%", padding:"14px", fontSize:"15px", marginBottom:"10px" }}>🔁 Confirmar reasignación</button>
            <button onClick={()=>setModalRef(null)} style={{ width:"100%", background:"none", border:"none", fontSize:"13px", fontWeight:700, color:"#9a9a9a", cursor:"pointer", fontFamily:"'Nunito',sans-serif", padding:"8px" }}>Cancelar</button>
          </div>
        </div>
      )}

    </main>
  );
}
