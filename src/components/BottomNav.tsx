"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function BottomNav() {
  const pathname = usePathname();
  const [logueado, setLogueado] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setLogueado(!!session));
    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => setLogueado(!!session));
    return () => listener.subscription.unsubscribe();
  }, []);

  const navItems = [
    { icon: "🔍", label: "Buscar",   href: "/buscar" },
    { icon: "🗺️", label: "Mapa",     href: "/mapa" },
    { icon: "➕", label: "Publicar", href: "/publicar", central: true },
    { icon: "👥", label: "Grupos",   href: "/grupos" },
    logueado
      ? { icon: "👤", label: "Perfil",   href: "/usuario" }
      : { icon: "🔑", label: "Ingresar", href: "/login" },
  ];

  return (
    <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100 }}>

      {/* FRANJA GRUPO GRATIS — estilo botón 3D */}
      <Link href="/grupos" style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        background: "linear-gradient(180deg, #2a3f55 0%, #1a2e42 100%)",
        padding: "8px 16px",
        textDecoration: "none",
        borderTop: "1px solid rgba(212,160,23,0.4)",
        borderBottom: "1px solid rgba(0,0,0,0.3)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08), 0 -2px 0 rgba(0,0,0,0.3)",
        cursor: "pointer",
        position: "relative",
      }}>
        {/* RECUADRO 3D */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          background: "linear-gradient(180deg, #243b55 0%, #1a2a3a 100%)",
          border: "1px solid rgba(212,160,23,0.5)",
          borderRadius: "10px",
          padding: "5px 16px",
          boxShadow: "0 4px 0 rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)",
        }}>
          <span style={{ fontSize: "14px" }}>👥</span>
          <span style={{ fontSize: "12px", fontWeight: 800, color: "#fff" }}>
            Creá un <span style={{ color: "#d4a017" }}>GRUPO GRATIS</span> y ganá
          </span>
          <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "18px", color: "#f0c040" }}>30%</span>
        </div>
      </Link>

      {/* NAV PRINCIPAL — fondo azul oscuro */}
      <nav style={{
        height: "64px",
        background: "linear-gradient(180deg, #0f1c28 0%, #0a1520 100%)",
        display: "flex",
        alignItems: "center",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        boxShadow: "0 -4px 16px rgba(0,0,0,0.4)",
      }}>
        {navItems.map(({ icon, label, href, central }: any) => {
          const isActive = pathname === href;

          if (central) {
            return (
              <Link key={href} href={href} style={{
                flex: 1, display: "flex", flexDirection: "column",
                alignItems: "center", textDecoration: "none", marginTop: "-20px",
              }}>
                <div style={{
                  width: "52px", height: "52px", borderRadius: "50%",
                  background: isActive
                    ? "linear-gradient(135deg, #b8860b, #d4a017)"
                    : "linear-gradient(135deg, #d4a017, #f0c040)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "24px",
                  boxShadow: "0 4px 0 rgba(0,0,0,0.4), 0 0 16px rgba(212,160,23,0.5)",
                  border: "3px solid #0a1520",
                }}>{icon}</div>
                <span style={{
                  fontSize: "9px", fontWeight: 800, textTransform: "uppercase",
                  letterSpacing: "0.5px", color: isActive ? "#d4a017" : "#6a8aaa",
                  marginTop: "2px",
                }}>{label}</span>
              </Link>
            );
          }

          return (
            <Link key={href} href={href} style={{
              flex: 1, display: "flex", flexDirection: "column",
              alignItems: "center", gap: "3px", padding: "8px 0", textDecoration: "none",
            }}>
              <span style={{
                fontSize: "20px",
                filter: isActive ? "drop-shadow(0 0 6px rgba(212,160,23,0.8))" : "none",
                opacity: isActive ? 1 : 0.5,
              }}>{icon}</span>
              <span style={{
                fontSize: "9px", fontWeight: 800, textTransform: "uppercase",
                letterSpacing: "0.5px", color: isActive ? "#d4a017" : "#6a8aaa",
              }}>{label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
