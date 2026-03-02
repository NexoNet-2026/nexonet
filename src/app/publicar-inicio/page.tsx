'use client'

export default function PublicarInicio() {
  const opciones = [
    {
      href: "/publicar",
      emoji: "📋",
      titulo: "Anuncio Gratis",
      subtitulo: "3 disponibles",
      desc: "Publicá hasta 3 anuncios gratis con fotos y contacto.",
      color: "#3483FA",
      badge: "GRATIS",
    },
    {
      href: "/publicar?tipo=conexion",
      emoji: "🔗",
      titulo: "BIT CONEXIÓN",
      subtitulo: "Máxima visibilidad",
      desc: "Te conectamos automáticamente con toda tu comunidad.",
      color: "#FFE600",
      badge: "⚡ TOP",
    },
    {
      href: "/publicar?tipo=grupo",
      emoji: "👥",
      titulo: "Crear Grupo",
      subtitulo: "Comunidad",
      desc: "Reuní personas con intereses comunes en tu ciudad.",
      color: "#00A650",
      badge: "NUEVO",
    },
    {
      href: "/publicar?tipo=empresa",
      emoji: "🏢",
      titulo: "BIT EMPRESA",
      subtitulo: "Paquete empresarial",
      desc: "Anuncios ilimitados y beneficios exclusivos para tu negocio.",
      color: "#FF8C00",
      badge: "PRO",
    },
    {
      href: "/publicar?tipo=posicionamiento",
      emoji: "🚀",
      titulo: "BIT Posicionamiento",
      subtitulo: "Primero en resultados",
      desc: "Aparecé antes que todos en las búsquedas de tu zona.",
      color: "#CE93D8",
      badge: "BIT",
    },
    {
      href: "/publicar?tipo=promoflash",
      emoji: "⚡",
      titulo: "BIT Promo Flash",
      subtitulo: "Tiempo limitado",
      desc: "Máxima visibilidad para ofertas, liquidaciones y eventos.",
      color: "#F48FB1",
      badge: "FLASH",
    },
  ]

  return (
    <div style={{
      fontFamily: "'Nunito', sans-serif",
      maxWidth: "390px",
      margin: "0 auto",
      minHeight: "100vh",
      position: "relative",
      overflow: "hidden",
    }}>

      {/* FONDO */}
      <div style={{
        position: "fixed",
        top: 0, left: "50%", transform: "translateX(-50%)",
        width: "390px", height: "100vh",
        backgroundImage: "url('/Fondo-Universal-NexoNet.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        zIndex: 0
      }} />
      <div style={{
        position: "fixed",
        top: 0, left: "50%", transform: "translateX(-50%)",
        width: "390px", height: "100vh",
        background: "linear-gradient(180deg, rgba(5,13,26,0.7) 0%, rgba(5,13,26,0.5) 40%, rgba(5,13,26,0.85) 100%)",
        zIndex: 1
      }} />

      {/* CONTENIDO */}
      <div style={{ position: "relative", zIndex: 2, padding: "54px 20px 40px" }}>

        {/* HEADER */}
        <div style={{ marginBottom: "24px" }}>
          <a href="/" style={{ color: "rgba(255,255,255,0.5)", textDecoration: "none", fontSize: "13px", fontWeight: 700 }}>← Volver</a>
          <div style={{ marginTop: "14px", display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: "11px", color: "#FFE600", fontWeight: 800, letterSpacing: "2px", textTransform: "uppercase", marginBottom: "4px" }}>NexoNet</div>
              <div style={{ fontSize: "26px", fontWeight: 900, color: "white", lineHeight: 1.1 }}>¿Qué querés<br/>hacer?</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>BITs disponibles</div>
              <div style={{ fontSize: "22px", fontWeight: 900, color: "#FFE600" }}>🪙 0</div>
            </div>
          </div>
        </div>

        {/* CARDS */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {opciones.map((op, i) => (
            <a key={i} href={op.href} style={{ textDecoration: "none" }}>
              <div style={{
                background: "rgba(255,255,255,0.07)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                border: `1px solid ${op.color}35`,
                borderLeft: `3px solid ${op.color}`,
                borderRadius: "16px",
                padding: "14px 16px",
                display: "flex",
                alignItems: "center",
                gap: "14px",
              }}>
                {/* ICONO */}
                <div style={{
                  width: "48px", height: "48px", borderRadius: "14px", flexShrink: 0,
                  background: `${op.color}18`,
                  border: `1px solid ${op.color}40`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "24px"
                }}>{op.emoji}</div>

                {/* TEXTO */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "2px" }}>
                    <div style={{ fontSize: "15px", fontWeight: 900, color: "white" }}>{op.titulo}</div>
                    <div style={{ background: `${op.color}25`, border: `1px solid ${op.color}50`, borderRadius: "6px", padding: "1px 7px", fontSize: "9px", fontWeight: 900, color: op.color, letterSpacing: "0.5px" }}>{op.badge}</div>
                  </div>
                  <div style={{ fontSize: "10px", color: op.color, fontWeight: 700, marginBottom: "3px" }}>{op.subtitulo}</div>
                  <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.45)", lineHeight: 1.4 }}>{op.desc}</div>
                </div>

                <div style={{ fontSize: "16px", color: "rgba(255,255,255,0.25)", flexShrink: 0 }}>›</div>
              </div>
            </a>
          ))}
        </div>

        {/* FOOTER */}
        <div style={{ marginTop: "24px", textAlign: "center" }}>
          <a href="/login" style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", textDecoration: "none", fontWeight: 600 }}>
            ¿No tenés cuenta? <span style={{ color: "#FFE600" }}>Registrarse</span>
          </a>
        </div>

      </div>
    </div>
  )
}
