"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { icon: "🏠", label: "Inicio",   href: "/" },
  { icon: "👥", label: "Grupos",   href: "/grupos" },
  { icon: "👤", label: "Registro", href: "/registro" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav style={{
      position: "fixed",
      bottom: 0, left: 0, right: 0,
      height: "64px",
      background: "#ffffff",
      display: "flex",
      alignItems: "center",
      borderTop: "1px solid #e8e8e6",
      boxShadow: "0 -4px 16px rgba(0,0,0,0.06)",
      zIndex: 100,
    }}>
      {navItems.map(({ icon, label, href }) => {
        const isActive = pathname === href;
        return (
          <Link key={href} href={href} style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "3px",
            padding: "8px 0",
            textDecoration: "none",
            color: isActive ? "#1a2a3a" : "#9a9a9a",
          }}>
            <span style={{
              fontSize: "22px",
              filter: isActive ? "drop-shadow(0 0 6px rgba(212,160,23,0.6))" : "none",
            }}>{icon}</span>
            <span style={{
              fontSize: "10px",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              color: isActive ? "#d4a017" : "#9a9a9a",
            }}>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
