"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/lib/supabase";

const TIPOS = [
  { key: "todos",          label: "Todas",      emoji: "🔔" },
  { key: "conexion",       label: "Conexiones", emoji: "🔗" },
  { key: "flash",          label: "Flash",      emoji: "⚡" },
  { key: "match",          label: "IA",         emoji: "🤖" },
  { key: "solicitud_admin",label: "Admin",      emoji: "⭐" },
  { key: "sistema",        label: "Sistema",    emoji: "📢" },
];

const TIPO_EMOJI: Record<string,string> = {
  conexion: "🔗", flash: "⚡", match: "🤖", solicitud_admin: "⭐",
  sistema: "📢", mensaje: "💬", general: "📣",
};

export default function NotificacionesPage() {
  const router = useRouter();
  const [notifs, setNotifs] = useState<any[]>([]);
  const [filtro, setFiltro] = useState("todos");
  const [cargando, setCargando] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const cargar = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/login"); return; }
      setUserId(session.user.id);
      const { data } = await supabase.from("notificaciones")
        .select("id, tipo, mensaje, leida, created_at, anuncio_id, nexo_id, emisor_id")
        .eq("usuario_id", session.user.id)
        .order("created_at", { ascending: false })
        .limit(100);
      setNotifs(data || []);
      // Marcar todas como leídas
      await supabase.from("notificaciones").update({ leida: true })
        .eq("usuario_id", session.user.id).eq("leida", false);
      setCargando(false);
    };
    cargar();
  }, []);

  const marcarTodasLeidas = async () => {
    if (!userId) return;
    await supabase.from("notificaciones").update({ leida: true })
      .eq("usuario_id", userId).eq("leida", false);
    setNotifs(prev => prev.map(n => ({ ...n, leida: true })));
  };

  const eliminarTodas = async () => {
    if (!userId || !confirm("¿Eliminar todas las notificaciones?")) return;
    await supabase.from("notificaciones").delete().eq("usuario_id", userId);
    setNotifs([]);
  };

  const getLinkNotif = (n: any) => {
    if (n.tipo === "conexion" && n.emisor_id) return `/chat/${n.emisor_id}`;
    if (n.tipo === "mensaje" && n.emisor_id) return `/chat/${n.emisor_id}`;
    if (n.tipo === "solicitud_admin" && n.nexo_id) return `/nexo/${n.nexo_id}/admin`;
    if (n.nexo_id) return `/nexo/${n.nexo_id}`;
    if (n.anuncio_id) return `/anuncios/${n.anuncio_id}`;
    return "/usuario";
  };

  const tiempoRelativo = (ts: string) => {
    const diff = (Date.now() - new Date(ts).getTime()) / 1000;
    if (diff < 60)    return "ahora";
    if (diff < 3600)  return `${Math.floor(diff/60)}m`;
    if (diff < 86400) return `${Math.floor(diff/3600)}h`;
    if (diff < 604800)return `${Math.floor(diff/86400)}d`;
    return new Date(ts).toLocaleDateString("es-AR", { day:"2-digit", month:"2-digit" });
  };

  const filtradas = filtro === "todos" ? notifs : notifs.filter(n => n.tipo === filtro);
  const noLeidas = notifs.filter(n => !n.leida).length;

  return (
    <main style={{ paddingTop:"0", paddingBottom:"100px", background:"#f4f4f2", minHeight:"100vh", fontFamily:"'Nunito',sans-serif" }}>
      <Header />

      {/* HERO */}
      <div style={{ background:"linear-gradient(135deg,#1a2a3a,#243b55)", paddingTop:"95px", padding:"95px 16px 16px" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"28px", color:"#fff", letterSpacing:"1px" }}>
              🔔 Notificaciones
            </div>
            {noLeidas > 0 && (
              <div style={{ fontSize:"12px", fontWeight:700, color:"#d4a017" }}>{noLeidas} sin leer</div>
            )}
          </div>
          <div style={{ display:"flex", gap:"8px" }}>
            {noLeidas > 0 && (
              <button onClick={marcarTodasLeidas}
                style={{ background:"rgba(212,160,23,0.15)", border:"1px solid rgba(212,160,23,0.4)", borderRadius:"10px", padding:"7px 12px", fontSize:"11px", fontWeight:800, color:"#d4a017", cursor:"pointer", fontFamily:"'Nunito',sans-serif" }}>
                ✓ Leídas
              </button>
            )}
            {notifs.length > 0 && (
              <button onClick={eliminarTodas}
                style={{ background:"rgba(231,76,60,0.1)", border:"1px solid rgba(231,76,60,0.3)", borderRadius:"10px", padding:"7px 12px", fontSize:"11px", fontWeight:800, color:"#e74c3c", cursor:"pointer", fontFamily:"'Nunito',sans-serif" }}>
                🗑️
              </button>
            )}
          </div>
        </div>
      </div>

      {/* FILTROS */}
      <div style={{ background:"#1a2a3a", padding:"0 12px 12px", display:"flex", gap:"6px", overflowX:"auto", scrollbarWidth:"none" }}>
        {TIPOS.map(t => {
          const count = t.key === "todos" ? notifs.length : notifs.filter(n => n.tipo === t.key).length;
          if (count === 0 && t.key !== "todos") return null;
          const activo = filtro === t.key;
          return (
            <button key={t.key} onClick={() => setFiltro(t.key)}
              style={{ flexShrink:0, background:activo?"rgba(212,160,23,0.2)":"rgba(255,255,255,0.06)", border:`2px solid ${activo?"#d4a017":"rgba(255,255,255,0.12)"}`, borderRadius:"20px", padding:"5px 12px", fontSize:"11px", fontWeight:800, color:activo?"#d4a017":"rgba(255,255,255,0.5)", cursor:"pointer", fontFamily:"'Nunito',sans-serif", display:"flex", alignItems:"center", gap:"4px" }}>
              {t.emoji} {t.label}
              {count > 0 && <span style={{ background:activo?"#d4a017":"rgba(255,255,255,0.15)", color:activo?"#1a2a3a":"#fff", borderRadius:"20px", padding:"1px 6px", fontSize:"9px", fontWeight:900 }}>{count}</span>}
            </button>
          );
        })}
      </div>

      {/* LISTA */}
      <div style={{ maxWidth:"600px", margin:"0 auto", padding:"12px 12px" }}>
        {cargando && (
          <div style={{ textAlign:"center", padding:"40px", color:"#9a9a9a", fontWeight:700 }}>Cargando...</div>
        )}

        {!cargando && filtradas.length === 0 && (
          <div style={{ textAlign:"center", padding:"60px 20px", background:"#fff", borderRadius:"16px" }}>
            <div style={{ fontSize:"48px", marginBottom:"12px" }}>🔕</div>
            <div style={{ fontSize:"15px", fontWeight:900, color:"#1a2a3a", marginBottom:"6px" }}>Sin notificaciones</div>
            <div style={{ fontSize:"12px", color:"#9a9a9a", fontWeight:600 }}>
              {filtro !== "todos" ? "Probá otro filtro" : "Cuando recibas notificaciones aparecerán acá"}
            </div>
          </div>
        )}

        <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
          {filtradas.map(n => (
            <a key={n.id} href={getLinkNotif(n)}
              style={{ textDecoration:"none", display:"block", background:"#fff", borderRadius:"14px", padding:"14px 16px", boxShadow:"0 2px 8px rgba(0,0,0,0.06)", borderLeft:`4px solid ${n.leida ? "#f0f0f0" : "#d4a017"}`, opacity: n.leida ? 0.85 : 1 }}>
              <div style={{ display:"flex", gap:"12px", alignItems:"flex-start" }}>
                <div style={{ width:"38px", height:"38px", borderRadius:"50%", background:n.leida?"#f4f4f2":"rgba(212,160,23,0.12)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"18px", flexShrink:0 }}>
                  {TIPO_EMOJI[n.tipo] || "📣"}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:"13px", fontWeight:n.leida?600:800, color:"#1a2a3a", lineHeight:1.5, marginBottom:"4px" }}>
                    {n.mensaje}
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
                    <span style={{ fontSize:"10px", fontWeight:800, color:"#9a9a9a", textTransform:"uppercase", letterSpacing:"0.5px" }}>
                      {TIPO_EMOJI[n.tipo]} {n.tipo?.replace("_"," ")}
                    </span>
                    <span style={{ fontSize:"10px", color:"#bbb", fontWeight:600 }}>{tiempoRelativo(n.created_at)}</span>
                    {!n.leida && <span style={{ width:"6px", height:"6px", borderRadius:"50%", background:"#d4a017", display:"inline-block" }} />}
                  </div>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
      <BottomNav />
    </main>
  );
}
