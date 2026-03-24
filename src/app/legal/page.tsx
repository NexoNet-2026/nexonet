"use client";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LegalPage() {
  const router = useRouter();
  const links = [
    { href: "/legal/terminos", emoji: "📜", titulo: "Términos y Condiciones", desc: "Reglas de uso de la plataforma" },
    { href: "/legal/privacidad", emoji: "🔒", titulo: "Política de Privacidad", desc: "Cómo manejamos tus datos" },
    { href: "/legal/cookies", emoji: "🍪", titulo: "Política de Cookies", desc: "Qué cookies usamos y por qué" },
    { href: "/legal/copyright", emoji: "⚖️", titulo: "Reclamos de Copyright", desc: "Reportar contenido que infringe derechos de autor" },
  ];

  return (
    <main style={{ paddingTop: "95px", paddingBottom: "130px", background: "#f4f4f2", minHeight: "100vh", fontFamily: "'Nunito',sans-serif" }}>
      <Header />
      <div style={{ padding: "16px", maxWidth: "500px", margin: "0 auto" }}>
        <button onClick={()=>router.back()} style={{background:"rgba(26,42,58,0.08)",border:"1px solid rgba(26,42,58,0.2)",borderRadius:"10px",padding:"7px 13px",color:"#1a2a3a",fontSize:"13px",fontWeight:700,cursor:"pointer",fontFamily:"'Nunito',sans-serif",marginBottom:"14px"}}>← Volver</button>
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "28px", color: "#1a2a3a", letterSpacing: "1px", marginBottom: "20px" }}>
          ⚖️ Legal
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {links.map(l => (
            <Link key={l.href} href={l.href} style={{ textDecoration: "none" }}>
              <div style={{ background: "#fff", borderRadius: "16px", padding: "20px", boxShadow: "0 2px 10px rgba(0,0,0,0.06)", display: "flex", alignItems: "center", gap: "14px" }}>
                <span style={{ fontSize: "28px" }}>{l.emoji}</span>
                <div>
                  <div style={{ fontSize: "15px", fontWeight: 900, color: "#1a2a3a" }}>{l.titulo}</div>
                  <div style={{ fontSize: "12px", color: "#9a9a9a", fontWeight: 600 }}>{l.desc}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
      <BottomNav />
    </main>
  );
}
