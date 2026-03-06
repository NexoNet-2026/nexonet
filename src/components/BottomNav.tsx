"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { icon: "🔍", label: "Buscar",   href: "/buscar" },
  { icon: "🗺️", label: "Mapa",     href: "/mapa" },
  { icon: "➕", label: "Publicar", href: "/publicar", central: true },
  { icon: "👥", label: "Grupos",   href: "/grupos" },
  { icon: "👤", label: "Perfil",   href: "/usuario" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100 }}>

      {/* FRANJA DOBLE */}
      <div style={{ display: "flex" }}>
        {/* GRUPO GRATIS */}
        <Link href="/grupos" style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "6px",
          background: "#1a2a3a",
          padding: "7px 10px",
          textDecoration: "none",
          borderTop: "1px solid rgba(212,160,23,0.3)",
          borderRight: "1px solid rgba(212,160,23,0.3)",
        }}>
          <span style={{ fontSize: "13px" }}>👥</span>
          <span style={{ fontSize: "11px", fontWeight: 800, color: "#fff" }}>
            Creá un <span style={{ color: "#d4a017" }}>GRUPO GRATIS</span>
          </span>
        </Link>

        {/* NEXO PROMOTOR */}
        <Link href="/usuario" style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "6px",
          background: "#243b55",
          padding: "7px 10px",
          textDecoration: "none",
          borderTop: "1px solid rgba(212,160,23,0.3)",
        }}>
          <span style={{ fontSize: "13px" }}>⭐</span>
          <span style={{ fontSize: "11px", fontWeight: 800, color: "#fff" }}>
            <span style={{ color: "#f0c040" }}>PROMOTOR</span>{" "}
            <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "15px", color: "#d4a017" }}>30%</span>
          </span>
        </Link>
      </div>

      {/* NAV PRINCIPAL */}
      <nav style={{
        height: "64px",
        background: "#ffffff",
        display: "flex",
        alignItems: "center",
        borderTop: "1px solid #e8e8e6",
        boxShadow: "0 -4px 16px rgba(0,0,0,0.08)",
      }}>
        {navItems.map(({ icon, label, href, central }) => {
          const isActive = pathname === href;

          if (central) {
            return (
              <Link key={href} href={href} style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textDecoration: "none",
                marginTop: "-20px",
              }}>
                <div style={{
                  width: "52px", height: "52px",
                  borderRadius: "50%",
                  background: isActive
                    ? "linear-gradient(135deg, #b8860b, #d4a017)"
                    : "linear-gradient(135deg, #d4a017, #f0c040)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "24px",
                  boxShadow: "0 4px 16px rgba(212,160,23,0.5)",
                  border: "3px solid #fff",
                }}>
                  {icon}
                </div>
                <span style={{
                  fontSize: "9px", fontWeight: 800,
                  textTransform: "uppercase", letterSpacing: "0.5px",
                  color: isActive ? "#d4a017" : "#9a9a9a",
                  marginTop: "2px",
                }}>{label}</span>
              </Link>
            );
          }

          return (
            <Link key={href} href={href} style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "3px",
              padding: "8px 0",
              textDecoration: "none",
            }}>
              <span style={{
                fontSize: "20px",
                filter: isActive ? "drop-shadow(0 0 4px rgba(212,160,23,0.6))" : "none",
                opacity: isActive ? 1 : 0.6,
              }}>{icon}</span>
              <span style={{
                fontSize: "9px",
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                color: isActive ? "#d4a017" : "#9a9a9a",
              }}>{label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
