"use client";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";

export default function Header() {
  const [usuario,  setUsuario]  = useState<{ nombre_usuario: string; codigo: string } | null>(null);
  const [userId,   setUserId]   = useState<string | null>(null);
  const [notifs,   setNotifs]   = useState<any[]>([]);
  const [noLeidas, setNoLeidas] = useState(0);
  const [panelOpen,setPanelOpen]= useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cargarUsuario = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUserId(session.user.id);
        const { data } = await supabase
          .from("usuarios")
          .select("nombre_usuario, codigo")
          .eq("id", session.user.id)
          .single();
        if (data) setUsuario(data);
        cargarNotifs(session.user.id);
      }
    };
    cargarUsuario();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUserId(session.user.id);
        supabase.from("usuarios").select("nombre_usuario, codigo").eq("id", session.user.id).single()
          .then(({ data }) => { if (data) setUsuario(data); });
        cargarNotifs(session.user.id);
      } else {
        setUsuario(null);
        setUserId(null);
        setNotifs([]);
        setNoLeidas(0);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const cargarNotifs = async (uid: string) => {
    const { data } = await supabase
      .from("notificaciones")
      .select("id, tipo, mensaje, leida, created_at, anuncio_id")
      .eq("usuario_id", uid)
      .order("created_at", { ascending: false })
      .limit(20);
    if (data) {
      setNotifs(data);
      setNoLeidas(data.filter((n: any) => !n.leida).length);
    }
  };

  const marcarLeidas = async () => {
    if (!userId || noLeidas === 0) return;
    await supabase
      .from("notificaciones")
      .update({ leida: true })
      .eq("usuario_id", userId)
      .eq("leida", false);
    setNotifs(prev => prev.map(n => ({ ...n, leida: true })));
    setNoLeidas(0);
  };

  const togglePanel = () => {
    if (!panelOpen && noLeidas > 0) marcarLeidas();
    setPanelOpen(v => !v);
  };

  // Cerrar panel al clickear fuera
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setPanelOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const tiempoRelativo = (ts: string) => {
    const diff = (Date.now() - new Date(ts).getTime()) / 1000;
    if (diff < 60)   return "ahora";
    if (diff < 3600) return `${Math.floor(diff/60)}m`;
    if (diff < 86400)return `${Math.floor(diff/3600)}h`;
    return `${Math.floor(diff/86400)}d`;
  };

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100 }}>

      {/* FRANJA PRINCIPAL */}
      <header style={{
        height: "60px",
        background: "linear-gradient(135deg, #1a2a3a 0%, #243b55 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 16px",
        boxShadow: "0 2px 12px rgba(0,0,0,0.3)",
      }}>

        {/* LOGO */}
        <Link href="/" style={{ textDecoration: "none", display: "flex", flexDirection: "column", lineHeight: 1 }}>
          <div style={{ fontSize: "22px", letterSpacing: "1px", fontFamily: "'Bebas Neue', sans-serif" }}>
            <span style={{ color: "#c8c8c8" }}>Nexo</span>
            <span style={{ color: "#d4a017" }}>Net</span>
          </div>
          <div style={{ fontSize: "10px", fontWeight: 700, color: "#8a9aaa", letterSpacing: "3px", textTransform: "uppercase" }}>
            Argentina
          </div>
        </Link>

        {/* CENTRO: HOME + CAMPANA */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Link href="/" style={{
            display: "flex", alignItems: "center", gap: "6px", textDecoration: "none",
            background: "linear-gradient(135deg, #d4a017, #f0c040)",
            borderRadius: "20px", padding: "7px 16px",
            boxShadow: "0 4px 0 rgba(0,0,0,0.4), 0 0 12px rgba(212,160,23,0.3)",
          }}>
            <span style={{ fontSize: "16px" }}>🏠</span>
            <span style={{ fontSize: "11px", fontWeight: 900, color: "#1a2a3a", textTransform: "uppercase", letterSpacing: "1.5px" }}>HOME</span>
          </Link>

          {/* CAMPANA */}
          {usuario && (
            <div ref={panelRef} style={{ position: "relative" }}>
              <button onClick={togglePanel} style={{
                position: "relative", width: "40px", height: "40px", borderRadius: "50%",
                background: panelOpen ? "rgba(212,160,23,0.25)" : "rgba(255,255,255,0.08)",
                border: `2px solid ${panelOpen ? "#d4a017" : "rgba(255,255,255,0.15)"}`,
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "18px", transition: "all .2s",
              }}>
                🔔
                {noLeidas > 0 && (
                  <div style={{
                    position: "absolute", top: "-3px", right: "-3px",
                    background: "#e74c3c", borderRadius: "50%",
                    minWidth: "18px", height: "18px", display: "flex",
                    alignItems: "center", justifyContent: "center",
                    fontSize: "10px", fontWeight: 900, color: "#fff",
                    border: "2px solid #1a2a3a", padding: "0 3px",
                  }}>
                    {noLeidas > 9 ? "9+" : noLeidas}
                  </div>
                )}
              </button>

              {/* PANEL NOTIFICACIONES */}
              {panelOpen && (
                <div style={{
                  position: "fixed", top: "95px", left: "8px", right: "8px",
                  width: "auto", background: "#fff", borderRadius: "16px",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.25)", border: "1px solid #e8e8e6",
                  maxHeight: "60vh", overflow: "hidden", display: "flex", flexDirection: "column",
                  zIndex: 200,
                }}>
                  <div style={{
                    padding: "14px 16px 10px", borderBottom: "1px solid #f0f0f0",
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                  }}>
                    <span style={{ fontSize: "14px", fontWeight: 900, color: "#1a2a3a" }}>🔔 Notificaciones</span>
                    <Link href="/usuario" onClick={() => setPanelOpen(false)}
                      style={{ fontSize: "11px", fontWeight: 700, color: "#d4a017", textDecoration: "none" }}>
                      Ver todas →
                    </Link>
                  </div>

                  <div style={{ overflowY: "auto", flex: 1 }}>
                    {notifs.length === 0 ? (
                      <div style={{ padding: "28px", textAlign: "center", color: "#bbb", fontSize: "13px", fontWeight: 600 }}>
                        <div style={{ fontSize: "28px", marginBottom: "8px" }}>🔕</div>
                        Sin notificaciones
                      </div>
                    ) : notifs.map(n => (
                      <a key={n.id} href={n.anuncio_id ? `/anuncios/${n.anuncio_id}` : "/usuario"}
                        onClick={() => setPanelOpen(false)}
                        style={{
                          display: "block", padding: "11px 16px", textDecoration: "none",
                          borderBottom: "1px solid #f8f8f8",
                          background: n.leida ? "#fff" : "rgba(212,160,23,0.05)",
                          borderLeft: n.leida ? "3px solid transparent" : "3px solid #d4a017",
                        }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
                          <div style={{ fontSize: "12px", fontWeight: n.leida ? 600 : 800, color: "#1a2a3a", lineHeight: 1.4, flex: 1 }}>
                            {n.mensaje}
                          </div>
                          <span style={{ fontSize: "10px", color: "#bbb", fontWeight: 600, flexShrink: 0 }}>
                            {tiempoRelativo(n.created_at)}
                          </span>
                        </div>
                        <div style={{ fontSize: "10px", color: "#9a9a9a", fontWeight: 700, marginTop: "3px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                          {n.tipo === "match" ? "🎯 Match búsqueda" : n.tipo === "conexion" ? "🔗 Conexión" : "📢 Sistema"}
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* USUARIO */}
        {usuario ? (
          <Link href="/usuario" style={{ textDecoration: "none", display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
            <span style={{ fontSize: "13px", fontWeight: 800, color: "#fff", maxWidth: "100px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {usuario.nombre_usuario}
            </span>
            <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "13px", color: "#d4a017", letterSpacing: "2px" }}>
              {usuario.codigo}
            </span>
          </Link>
        ) : (
          <div style={{ width: "80px" }} />
        )}

      </header>

      {/* FRANJA NEXO PROMOTOR */}
      <Link href="/promotor" style={{
        display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
        background: "linear-gradient(90deg, #b8860b, #d4a017, #f0c040, #d4a017, #b8860b)",
        padding: "7px 16px", textDecoration: "none", cursor: "pointer",
      }}>
        <span style={{ fontSize: "14px" }}>⭐</span>
        <span style={{ fontSize: "12px", fontWeight: 800, color: "#1a2a3a" }}>NEXO PROMOTOR</span>
        <span style={{ fontSize: "10px", color: "#1a2a3a", fontWeight: 700 }}>—</span>
        <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "20px", color: "#1a2a3a" }}>30%</span>
        <span style={{ fontSize: "12px", fontWeight: 800, color: "#1a2a3a" }}>de ganancia</span>
        <span style={{ fontSize: "12px", color: "#1a2a3a", fontWeight: 800 }}>→</span>
      </Link>

    </div>
  );
}
