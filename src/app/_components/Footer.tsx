"use client";

import Link from "next/link";

export default function Footer() {
  const yearActual = new Date().getFullYear();

  return (
    <footer
      style={{
        backgroundColor: "#1a2a3a",
        color: "#e8e8e8",
        padding: "48px 24px 24px 24px",
        marginTop: "48px",
        paddingBottom: "140px",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "32px",
        }}
      >
        {/* Columna 1 — NexoNet */}
        <div>
          <div
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: "26px",
              letterSpacing: "1px",
              marginBottom: "8px",
            }}
          >
            <span style={{ color: "#ffffff" }}>NEXO</span>
            <span style={{ color: "#e0b020" }}>NET</span>
            <span style={{ color: "#9aa5b1", fontSize: "14px", marginLeft: "8px" }}>
              ARGENTINA
            </span>
          </div>
          <p
            style={{
              fontSize: "13px",
              color: "#9aa5b1",
              margin: "0 0 16px 0",
              lineHeight: 1.5,
            }}
          >
            Conectando oportunidades en Argentina.
          </p>
          <div style={{ fontSize: "12px", color: "#9aa5b1", lineHeight: 1.7 }}>
            <div>Adrián Morra — Monotributista</div>
            <div>CUIT: [PENDIENTE — completar]</div>
            <div>Roldán, Santa Fe, Argentina</div>
            <div>
              <a
                href="mailto:legal@nexonet.ar"
                style={{ color: "#9aa5b1", textDecoration: "none" }}
              >
                legal@nexonet.ar
              </a>
            </div>
          </div>
        </div>

        {/* Columna 2 — Plataforma */}
        <div>
          <h4 style={tituloColumna}>Plataforma</h4>
          <ul style={listaSinEstilo}>
            <li><Link href="/login" style={linkStyle}>Ingresar</Link></li>
            <li><Link href="/registro" style={linkStyle}>Registrarse</Link></li>
            <li><Link href="/publicar" style={linkStyle}>Crear anuncio</Link></li>
            <li><Link href="/buscar" style={linkStyle}>Buscar</Link></li>
          </ul>
        </div>

        {/* Columna 3 — Legal */}
        <div>
          <h4 style={tituloColumna}>Legal</h4>
          <ul style={listaSinEstilo}>
            <li><Link href="/legal/terminos" style={linkStyle}>Términos y Condiciones</Link></li>
            <li><Link href="/legal/privacidad" style={linkStyle}>Política de Privacidad</Link></li>
            <li><Link href="/legal/cookies" style={linkStyle}>Política de Cookies</Link></li>
            <li><Link href="/legal/copyright" style={linkStyle}>Reclamo de Copyright</Link></li>
            <li>
              <Link href="/legal/arrepentimiento" style={{ ...linkStyle, fontWeight: 700 }}>
                Botón de Arrepentimiento
              </Link>
            </li>
            <li>
              <a
                href="https://www.argentina.gob.ar/produccion/defensadelconsumidor/formulario"
                target="_blank"
                rel="noopener noreferrer"
                style={linkStyle}
              >
                Defensa del Consumidor
              </a>
            </li>
          </ul>
        </div>

        {/* Columna 4 — Soporte */}
        <div>
          <h4 style={tituloColumna}>Soporte</h4>
          <ul style={listaSinEstilo}>
            <li>
              <a href="mailto:legal@nexonet.ar" style={linkStyle}>
                Contacto
              </a>
            </li>
            {/* TODO: agregar redes sociales cuando estén creadas */}
          </ul>
        </div>
      </div>

      {/* Barra inferior */}
      <div
        style={{
          maxWidth: "1200px",
          margin: "32px auto 0 auto",
          paddingTop: "24px",
          borderTop: "1px solid #2c3e50",
          display: "flex",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "8px",
          fontSize: "12px",
          color: "#9aa5b1",
        }}
      >
        <div>© {yearActual} NexoNet Argentina. Todos los derechos reservados.</div>
        <div>v0.1.0</div>
      </div>
    </footer>
  );
}

const tituloColumna: React.CSSProperties = {
  color: "#e0b020",
  fontSize: "15px",
  fontWeight: 800,
  margin: "0 0 12px 0",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
};

const listaSinEstilo: React.CSSProperties = {
  listStyle: "none",
  padding: 0,
  margin: 0,
  display: "flex",
  flexDirection: "column",
  gap: "8px",
  fontSize: "14px",
};

const linkStyle: React.CSSProperties = {
  color: "#e8e8e8",
  textDecoration: "none",
};
