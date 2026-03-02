'use client'

export default function Home() {
  return (
    <div style={{
      fontFamily: "'Nunito', sans-serif",
      maxWidth: "390px",
      margin: "0 auto",
      minHeight: "100vh",
      position: "relative",
      overflow: "hidden",
      background: "#050d1a"
    }}>

      {/* IMAGEN DE FONDO */}
      <div style={{
        position: "absolute",
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundImage: "url('/fondo-titulo.png')",
        backgroundSize: "cover",
        backgroundPosition: "center top",
        backgroundRepeat: "no-repeat",
      }} />

      {/* OVERLAY */}
      <div style={{
        position: "absolute",
        top: 0, left: 0, right: 0, bottom: 0,
        background: "linear-gradient(180deg, rgba(5,13,26,0.2) 0%, rgba(5,13,26,0.05) 25%, rgba(5,13,26,0.6) 70%, rgba(5,13,26,0.92) 100%)"
      }} />

      {/* CONTENIDO */}
      <div style={{ position: "relative", zIndex: 10, display: "flex", flexDirection: "column", minHeight: "100vh" }}>

        {/* TITULO */}
        <div style={{ padding: "52px 24px 0" }}>

          {/* NEXONET */}
          <div style={{ lineHeight: 1 }}>
            <span style={{ fontSize: "60px", fontWeight: 900, color: "white", letterSpacing: "-2px" }}>Nexo</span>
            <span style={{ fontSize: "60px", fontWeight: 900, color: "#FFE600", letterSpacing: "-2px" }}>Net</span>
          </div>

          {/* ARGENTINA */}
          <div style={{ fontSize: "20px", fontWeight: 800, color: "#4FC3F7", letterSpacing: "3px", marginTop: "-2px" }}>
            Argentina
          </div>

          {/* SLOGANS */}
          <div style={{ marginTop: "14px", display: "flex", flexDirection: "column", gap: "4px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ width: "3px", height: "14px", background: "#FFE600", borderRadius: "2px" }} />
              <span style={{ fontSize: "12px", fontWeight: 800, color: "rgba(255,255,255,0.85)", letterSpacing: "1.5px", textTransform: "uppercase" }}>Conectando a la Comunidad</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ width: "3px", height: "14px", background: "#4FC3F7", borderRadius: "2px" }} />
              <span style={{ fontSize: "12px", fontWeight: 800, color: "rgba(255,255,255,0.85)", letterSpacing: "1.5px", textTransform: "uppercase" }}>Conectando Oportunidades</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ width: "3px", height: "14px", background: "#00A650", borderRadius: "2px" }} />
              <span style={{ fontSize: "12px", fontWeight: 800, color: "rgba(255,255,255,0.85)", letterSpacing: "1.5px", textTransform: "uppercase" }}>Formando Grupos</span>
            </div>
          </div>
        </div>

        <div style={{ flex: 1 }} />

        {/* BOTONES */}
        <div style={{ padding: "0 20px 56px", display: "flex", flexDirection: "column", gap: "10px" }}>

          <a href="/explorar" style={{ textDecoration: "none" }}>
            <div style={{
              background: "rgba(255,255,255,0.10)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,0.20)",
              borderRadius: "16px",
              padding: "13px 20px",
              display: "flex",
              alignItems: "center",
              gap: "14px",
            }}>
              <span style={{ fontSize: "22px" }}>📋</span>
              <span style={{ fontSize: "15px", fontWeight: 800, color: "white" }}>Buscar en listas</span>
              <span style={{ marginLeft: "auto", fontSize: "18px", color: "rgba(255,255,255,0.35)" }}>›</span>
            </div>
          </a>

          <a href="/mapa" style={{ textDecoration: "none" }}>
            <div style={{
              background: "rgba(255,255,255,0.10)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,0.20)",
              borderRadius: "16px",
              padding: "13px 20px",
              display: "flex",
              alignItems: "center",
              gap: "14px",
            }}>
              <span style={{ fontSize: "22px" }}>🗺️</span>
              <span style={{ fontSize: "15px", fontWeight: 800, color: "white" }}>Buscar en mapa</span>
              <span style={{ marginLeft: "auto", fontSize: "18px", color: "rgba(255,255,255,0.35)" }}>›</span>
            </div>
          </a>

          <a href="/publicar-inicio" style={{ textDecoration: "none" }}>
            <div style={{
              background: "rgba(255,140,0,0.22)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: "1px solid rgba(255,180,0,0.40)",
              borderRadius: "16px",
              padding: "13px 20px",
              display: "flex",
              alignItems: "center",
              gap: "14px",
            }}>
              <span style={{ fontSize: "22px" }}>➕</span>
              <span style={{ fontSize: "15px", fontWeight: 800, color: "#FFE600" }}>Publicar</span>
              <span style={{ marginLeft: "auto", fontSize: "18px", color: "rgba(255,230,0,0.4)" }}>›</span>
            </div>
          </a>

        </div>

        {/* FOOTER */}
        <div style={{ position: "absolute", bottom: "18px", right: "20px", display: "flex", gap: "14px", alignItems: "center" }}>
          <a href="/login" style={{ fontSize: "11px", color: "rgba(255,255,255,0.55)", textDecoration: "none", fontWeight: 700 }}>Ingresar</a>
          <div style={{ width: "1px", height: "10px", background: "rgba(255,255,255,0.2)" }} />
          <a href="/login" style={{ fontSize: "11px", color: "rgba(255,255,255,0.55)", textDecoration: "none", fontWeight: 700 }}>Registrarse</a>
        </div>

      </div>
    </div>
  )
}
