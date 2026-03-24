"use client";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import Link from "next/link";
import { useRouter } from "next/navigation";

const S: React.CSSProperties = { fontSize:"13px", color:"#444", lineHeight:1.8, marginBottom:"16px" };
const H: React.CSSProperties = { fontFamily:"'Bebas Neue',sans-serif", fontSize:"18px", color:"#1a2a3a", letterSpacing:"0.5px", marginBottom:"8px", marginTop:"28px" };

export default function PrivacidadPage() {
  const router = useRouter();
  return (
    <main style={{ paddingTop:"95px", paddingBottom:"130px", background:"#f4f4f2", minHeight:"100vh", fontFamily:"'Nunito',sans-serif" }}>
      <Header />
      <div style={{ padding:"16px", maxWidth:"600px", margin:"0 auto" }}>
        <button onClick={()=>router.back()} style={{background:"rgba(26,42,58,0.08)",border:"1px solid rgba(26,42,58,0.2)",borderRadius:"10px",padding:"7px 13px",color:"#1a2a3a",fontSize:"13px",fontWeight:700,cursor:"pointer",fontFamily:"'Nunito',sans-serif",marginBottom:"14px"}}>← Volver</button>
        <div style={{ background:"#fff", borderRadius:"16px", padding:"24px", boxShadow:"0 2px 10px rgba(0,0,0,0.06)" }}>
          <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"28px", color:"#1a2a3a", letterSpacing:"1px", marginBottom:"4px" }}>
            🔒 Política de Privacidad
          </div>
          <div style={{ fontSize:"12px", color:"#9a9a9a", fontWeight:600, marginBottom:"20px" }}>Última actualización: Marzo 2026</div>

          <div style={H}>1. Responsable del tratamiento</div>
          <p style={S}>Adrián Morra — NexoNet Argentina<br/>Domicilio: Roldán, Santa Fe, Argentina<br/>Email: <strong>legal@nexonet.ar</strong></p>

          <div style={H}>2. Datos que recopilamos</div>
          <p style={S}>
            <strong>Datos de registro:</strong> nombre, email, contraseña (encriptada).<br/>
            <strong>Datos de perfil:</strong> foto, ciudad, provincia, WhatsApp (opcional).<br/>
            <strong>Datos de uso:</strong> publicaciones, conexiones, mensajes, búsquedas.<br/>
            <strong>Datos de pago:</strong> procesados por MercadoPago. NexoNet no almacena datos de tarjetas.<br/>
            <strong>Datos técnicos:</strong> IP, dispositivo, navegador, páginas visitadas.
          </p>

          <div style={H}>3. Cómo usamos tus datos</div>
          <p style={S}>Para operar la plataforma y brindarte el servicio. Para enviarte notificaciones relacionadas con tu actividad. Para mejorar la experiencia de usuario. Para prevenir fraudes y garantizar la seguridad. No vendemos tus datos a terceros.</p>

          <div style={H}>4. Compartir datos</div>
          <p style={S}>Solo compartimos datos con:<br/>
            <strong>MercadoPago:</strong> para procesar pagos.<br/>
            <strong>Supabase:</strong> proveedor de base de datos (infraestructura).<br/>
            <strong>Vercel:</strong> proveedor de hosting (infraestructura).<br/>
            Estos proveedores están obligados contractualmente a proteger tus datos.
          </p>

          <div style={H}>5. Tus derechos (Ley 25.326 Argentina)</div>
          <p style={S}>Tenés derecho a: acceder a tus datos, rectificarlos, suprimirlos y oponerte a su tratamiento. Para ejercerlos escribí a <strong>legal@nexonet.ar</strong> con asunto "Derechos ARCO".</p>

          <div style={H}>6. Retención de datos</div>
          <p style={S}>Conservamos tus datos mientras tu cuenta esté activa. Al dar de baja tu cuenta, eliminamos tus datos en un plazo de 30 días.</p>

          <div style={H}>7. Seguridad</div>
          <p style={S}>Usamos cifrado SSL, autenticación segura vía Supabase Auth y acceso restringido a datos sensibles.</p>

          <div style={H}>8. Menores</div>
          <p style={S}>NexoNet no está dirigido a menores de 18 años. Si detectamos una cuenta de menor, la eliminamos de inmediato.</p>

          <div style={{borderTop:"1px solid #f0f0f0",paddingTop:"20px",marginTop:"28px",display:"flex",gap:"12px",flexWrap:"wrap",justifyContent:"center"}}>
            <Link href="/legal/terminos" style={{fontSize:"12px",fontWeight:700,color:"#3a7bd5",textDecoration:"none"}}>📜 Términos</Link>
            <Link href="/legal/cookies" style={{fontSize:"12px",fontWeight:700,color:"#3a7bd5",textDecoration:"none"}}>🍪 Cookies</Link>
            <Link href="/legal/copyright" style={{fontSize:"12px",fontWeight:700,color:"#3a7bd5",textDecoration:"none"}}>⚖️ Copyright</Link>
            <Link href="/" style={{fontSize:"12px",fontWeight:700,color:"#9a9a9a",textDecoration:"none"}}>🏠 Inicio</Link>
          </div>
        </div>
      </div>
      <BottomNav />
    </main>
  );
}
