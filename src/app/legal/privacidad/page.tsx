"use client";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { useRouter } from "next/navigation";

const S: React.CSSProperties = { fontSize: "14px", color: "#444", lineHeight: 1.8, marginBottom: "16px" };
const H: React.CSSProperties = { fontSize: "16px", fontWeight: 900, color: "#1a2a3a", marginBottom: "8px", marginTop: "24px" };

export default function PrivacidadPage() {
  const router = useRouter();
  return (
    <main style={{ paddingTop: "95px", paddingBottom: "130px", background: "#f4f4f2", minHeight: "100vh", fontFamily: "'Nunito',sans-serif" }}>
      <Header />
      <div style={{ padding: "16px", maxWidth: "600px", margin: "0 auto" }}>
        <button onClick={()=>router.back()} style={{background:"rgba(26,42,58,0.08)",border:"1px solid rgba(26,42,58,0.2)",borderRadius:"10px",padding:"7px 13px",color:"#1a2a3a",fontSize:"13px",fontWeight:700,cursor:"pointer",fontFamily:"'Nunito',sans-serif",marginBottom:"14px"}}>← Volver</button>
        <div style={{ background: "#fff", borderRadius: "16px", padding: "24px", boxShadow: "0 2px 10px rgba(0,0,0,0.06)" }}>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "28px", color: "#1a2a3a", letterSpacing: "1px", marginBottom: "4px" }}>
            🔒 Política de Privacidad
          </div>
          <div style={{ fontSize: "12px", color: "#9a9a9a", fontWeight: 600, marginBottom: "20px" }}>
            Última actualización: Marzo 2026
          </div>

          <div style={H}>1. Datos que recopilamos</div>
          <p style={S}>Al registrarte recopilamos: email, nombre de usuario, código de referido (opcional). Opcionalmente podés agregar: nombre real, WhatsApp, dirección, ubicación GPS, avatar. Los datos de empresa incluyen: nombre comercial, dirección, contacto.</p>

          <div style={H}>2. Uso de los datos</div>
          <p style={S}>Tus datos se utilizan para: operar tu cuenta, facilitar conexiones entre usuarios, mostrar información de contacto según tu configuración de visibilidad, procesar transacciones de BIT, enviar notificaciones del sistema.</p>

          <div style={H}>3. Visibilidad de datos</div>
          <p style={S}>Vos controlás qué datos son visibles para otros usuarios a través de la sección "Datos" en tu perfil. Podés activar o desactivar la visibilidad de cada campo individualmente.</p>

          <div style={H}>4. Almacenamiento</div>
          <p style={S}>Los datos se almacenan en servidores de Supabase (infraestructura de Amazon Web Services) con encriptación en tránsito y en reposo. Las imágenes y archivos se almacenan en Supabase Storage.</p>

          <div style={H}>5. Compartición con terceros</div>
          <p style={S}>No vendemos ni compartimos tus datos personales con terceros. Los únicos servicios externos que reciben datos son: MercadoPago (para procesar pagos) y servicios de hosting/infraestructura necesarios para operar la plataforma.</p>

          <div style={H}>6. Cookies y tracking</div>
          <p style={S}>NexoNet utiliza cookies de sesión para mantener tu login activo. No utilizamos cookies de tracking publicitario ni servicios de analytics de terceros que identifiquen usuarios individuales.</p>

          <div style={H}>7. Retención de datos</div>
          <p style={S}>Tus datos se mantienen mientras tu cuenta esté activa. Al solicitar la baja, tus datos personales serán eliminados en un plazo de 30 días. Los datos de transacciones se conservan por obligación legal.</p>

          <div style={H}>8. Tus derechos</div>
          <p style={S}>Tenés derecho a: acceder a tus datos, rectificarlos, solicitar su eliminación, y oponerte a su tratamiento. Para ejercer estos derechos, contactanos desde tu perfil en la sección "Contactar NexoNet".</p>

          <div style={H}>9. Menores de edad</div>
          <p style={S}>NexoNet no está dirigido a menores de 18 años. No recopilamos intencionalmente datos de menores. Si detectamos una cuenta de un menor, será eliminada.</p>

          <div style={H}>10. Cambios en esta política</div>
          <p style={S}>Nos reservamos el derecho de actualizar esta política. Los cambios serán notificados y entrarán en vigencia a los 15 días de su publicación.</p>

          <div style={H}>11. Contacto</div>
          <p style={S}>Para consultas sobre privacidad: <strong>privacidad@nexonet.ar</strong>. También podés contactarnos desde tu perfil en la sección "Contactar NexoNet".</p>
        </div>
      </div>
      <BottomNav />
    </main>
  );
}
