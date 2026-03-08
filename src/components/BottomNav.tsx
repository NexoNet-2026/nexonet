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
    { icon: "🔍", label: "Buscar",  href: "/buscar" },
    { icon: "🗺️", label: "Mapa",    href: "/mapa" },
    { icon: "➕", label: "Publicar", href: "/mis-anuncios", central: true },
    { icon: "👥", label: "Grupos",  href: "/grupos" },
    { icon: "👤", label: "Perfil",  href: "/usuario" },
  ];

  return (
    <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100 }}>

      {/* FRANJA LOGIN — solo si NO está logueado */}
      {!logueado && (
        <div style={{
          display: "flex",
          background: "linear-gradient(90deg, #b8860b, #d4a017, #f0c040, #d4a017, #b8860b)",
          borderTop: "1px solid rgba(255,255,255,0.15)",
          overflow: "hidden",
        }}>
          <Link href="/login" style={{
            flex: 1, textDecoration: "none",
            background: "#1a2a3a", color: "#f0c040",
            padding: "11px", fontSize: "13px", fontWeight: 900,
            letterSpacing: "0.5px", textAlign: "center",
            borderRight: "1px solid rgba(255,255,255,0.15)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
          }}>🔑 Ingresar</Link>
          <Link href="/registro" style={{
            flex: 1, textDecoration: "none",
            background: "#1a2a3a", color: "#f0c040",
            padding: "11px", fontSize: "13px", fontWeight: 900,
            letterSpacing: "0.5px", textAlign: "center",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
          }}>👤 Registrate</Link>
        </div>
      )}

      {/* FRANJA GRUPO GRATIS — solo si está logueado */}
      {logueado && (
        <Link href="/grupos" style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          background: "linear-gradient(180deg, #2a3f55 0%, #1a2e42 100%)",
          padding: "10px 16px",
          textDecoration: "none",
          borderTop: "2px solid rgba(212,160,23,0.5)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.1), 0 -2px 8px rgba(0,0,0,0.3)",
          cursor: "pointer",
          width: "100%",
          boxSizing: "border-box",
        }}>
          <span style={{ fontSize: "14px" }}>👥</span>
          <span style={{ fontSize: "12px", fontWeight: 800, color: "#fff", letterSpacing: "0.3px" }}>
            Creá un <span style={{ color: "#d4a017" }}>GRUPO GRATIS</span> y ganá
          </span>
          <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "20px", color: "#f0c040", textShadow: "0 2px 4px rgba(0,0,0,0.4)" }}>30%</span>
        </Link>
      )}

      {/* NAV PRINCIPAL */}
      <nav style={{
        height: "64px",
        background: "linear-gradient(180deg, #0f1c28 0%, #0a1520 100%)",
        display: "flex",
        alignItems: "center",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        boxShadow: "0 -4px 16px rgba(0,0,0,0.4)",
        position: "relative",
      }}>
        {navItems.map(({ icon, label, href, central }: any) => {
          const isActive = pathname === href || (href === "/mis-anuncios" && pathname === "/publicar");

          if (central) {
            return (
              <div key={href} style={{ flex: 1, position: "relative", display: "flex", justifyContent: "center" }}>
                <Link href={href} style={{
                  display: "flex", flexDirection: "column", alignItems: "center",
                  textDecoration: "none", position: "absolute", top: "-43px",
                }}>
                  <div style={{
                    width: "56px", height: "56px", borderRadius: "50%",
                    background: isActive
                      ? "linear-gradient(135deg, #b8860b, #d4a017)"
                      : "linear-gradient(135deg, #d4a017, #f0c040)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "26px",
                    boxShadow: "0 4px 0 rgba(0,0,0,0.5), 0 0 20px rgba(212,160,23,0.6)",
                    border: "3px solid #0a1520",
                  }}>{icon}</div>
                  <span style={{
                    fontSize: "9px", fontWeight: 800, textTransform: "uppercase",
                    letterSpacing: "0.5px", color: isActive ? "#d4a017" : "#6a8aaa",
                    marginTop: "2px", textShadow: "0 1px 3px rgba(255,255,255,0.15)",
                  }}>{label}</span>
                </Link>
              </div>
            );
          }

          return (
            <Link key={href} href={href} style={{
              flex: 1, display: "flex", flexDirection: "column",
              alignItems: "center", gap: "3px", padding: "8px 0", textDecoration: "none",
            }}>
              <span style={{
                fontSize: "22px",
                filter: isActive
                  ? "drop-shadow(0 0 6px rgba(212,160,23,0.9)) drop-shadow(0 2px 4px rgba(255,255,255,0.3))"
                  : "drop-shadow(0 1px 3px rgba(255,255,255,0.2))",
                opacity: isActive ? 1 : 0.7,
              }}>{icon}</span>
              <span style={{
                fontSize: "9px", fontWeight: 800, textTransform: "uppercase",
                letterSpacing: "0.5px", color: isActive ? "#d4a017" : "#6a8aaa",
                textShadow: "0 1px 3px rgba(255,255,255,0.15)",
              }}>{label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
