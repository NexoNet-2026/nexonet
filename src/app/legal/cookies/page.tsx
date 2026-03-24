"use client";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import Link from "next/link";
import { useRouter } from "next/navigation";

const S: React.CSSProperties = { fontSize:"13px", color:"#444", lineHeight:1.8, marginBottom:"16px" };
const H: React.CSSProperties = { fontFamily:"'Bebas Neue',sans-serif", fontSize:"18px", color:"#1a2a3a", letterSpacing:"0.5px", marginBottom:"8px", marginTop:"28px" };

export default function CookiesPage() {
  const router = useRouter();
  return (
    <main style={{ paddingTop:"95px", paddingBottom:"130px", background:"#f4f4f2", minHeight:"100vh", fontFamily:"'Nunito',sans-serif" }}>
      <Header />
      <div style={{ padding:"16px", maxWidth:"600px", margin:"0 auto" }}>
        <button onClick={()=>router.back()} style={{background:"rgba(26,42,58,0.08)",border:"1px solid rgba(26,42,58,0.2)",borderRadius:"10px",padding:"7px 13px",color:"#1a2a3a",fontSize:"13px",fontWeight:700,cursor:"pointer",fontFamily:"'Nunito',sans-serif",marginBottom:"14px"}}>← Volver</button>
        <div style={{ background:"#fff", borderRadius:"16px", padding:"24px", boxShadow:"0 2px 10px rgba(0,0,0,0.06)" }}>
          <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"28px", color:"#1a2a3a", letterSpacing:"1px", marginBottom:"4px" }}>
            🍪 Política de Cookies
          </div>
          <div style={{ fontSize:"12px", color:"#9a9a9a", fontWeight:600, marginBottom:"20px" }}>Última actualización: Marzo 2026</div>

          <div style={H}>1. ¿Qué son las cookies?</div>
          <p style={S}>Las cookies son pequeños archivos que se almacenan en tu dispositivo cuando visitás un sitio web. Nos permiten recordar tus preferencias y mejorar tu experiencia.</p>

          <div style={H}>2. Cookies que usamos</div>
          <p style={S}>
            <strong>Cookies esenciales (no desactivables):</strong><br/>
            — Sesión de usuario: para mantenerte logueado.<br/>
            — Seguridad: para prevenir ataques CSRF.<br/><br/>
            <strong>Cookies de rendimiento:</strong><br/>
            — Vercel Analytics: mide el rendimiento de la plataforma de forma anónima.<br/><br/>
            <strong>Cookies de funcionalidad:</strong><br/>
            — Preferencias de idioma y región.<br/>
            — Configuración de filtros de búsqueda.
          </p>

          <div style={H}>3. Cookies de terceros</div>
          <p style={S}>
            <strong>MercadoPago:</strong> cuando realizás un pago.<br/>
            <strong>Supabase:</strong> para la gestión de sesiones.<br/><br/>
            NexoNet no usa cookies publicitarias ni de seguimiento de terceros para publicidad.
          </p>

          <div style={H}>4. Cómo gestionar las cookies</div>
          <p style={S}>Podés configurar tu navegador para rechazar cookies. Tené en cuenta que algunas funciones de NexoNet pueden no funcionar correctamente sin cookies esenciales.</p>

          <div style={H}>5. Contacto</div>
          <p style={S}>Para consultas sobre cookies escribí a <strong>legal@nexonet.ar</strong></p>

          <div style={{borderTop:"1px solid #f0f0f0",paddingTop:"20px",marginTop:"28px",display:"flex",gap:"12px",flexWrap:"wrap",justifyContent:"center"}}>
            <Link href="/legal/terminos" style={{fontSize:"12px",fontWeight:700,color:"#3a7bd5",textDecoration:"none"}}>📜 Términos</Link>
            <Link href="/legal/privacidad" style={{fontSize:"12px",fontWeight:700,color:"#3a7bd5",textDecoration:"none"}}>🔒 Privacidad</Link>
            <Link href="/legal/copyright" style={{fontSize:"12px",fontWeight:700,color:"#3a7bd5",textDecoration:"none"}}>⚖️ Copyright</Link>
            <Link href="/" style={{fontSize:"12px",fontWeight:700,color:"#9a9a9a",textDecoration:"none"}}>🏠 Inicio</Link>
          </div>
        </div>
      </div>
      <BottomNav />
    </main>
  );
}
