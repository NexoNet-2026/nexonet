"use client";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";

const S: React.CSSProperties = { fontSize: "14px", color: "#444", lineHeight: 1.8, marginBottom: "16px" };
const H: React.CSSProperties = { fontSize: "16px", fontWeight: 900, color: "#1a2a3a", marginBottom: "8px", marginTop: "24px" };

export default function TerminosPage() {
  return (
    <main style={{ paddingTop: "95px", paddingBottom: "130px", background: "#f4f4f2", minHeight: "100vh", fontFamily: "'Nunito',sans-serif" }}>
      <Header />
      <div style={{ padding: "16px", maxWidth: "600px", margin: "0 auto" }}>
        <div style={{ background: "#fff", borderRadius: "16px", padding: "24px", boxShadow: "0 2px 10px rgba(0,0,0,0.06)" }}>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "28px", color: "#1a2a3a", letterSpacing: "1px", marginBottom: "4px" }}>
            📜 Términos y Condiciones
          </div>
          <div style={{ fontSize: "12px", color: "#9a9a9a", fontWeight: 600, marginBottom: "20px" }}>
            Última actualización: Marzo 2026
          </div>

          <div style={H}>1. Aceptación de los términos</div>
          <p style={S}>Al registrarte y utilizar NexoNet Argentina, aceptás estos términos y condiciones en su totalidad. Si no estás de acuerdo, no utilices la plataforma.</p>

          <div style={H}>2. Sistema de BIT</div>
          <p style={S}>Los BIT son créditos internos de la plataforma. No constituyen dinero, moneda digital ni valor monetario transferible fuera de NexoNet. Los BIT se adquieren mediante compra, promociones o actividad en la plataforma. Los BIT no son reembolsables salvo disposición legal aplicable o programa específico de reembolso.</p>

          <div style={H}>3. Contenido descargable y derechos de autor</div>
          <p style={S}>Al publicar contenido descargable en NexoNet, el usuario declara ser titular de los derechos de autor o contar con autorización expresa del titular para su distribución. NexoNet no se responsabiliza por el contenido publicado por los usuarios. Ante reclamos de derechos de autor, NexoNet actuará conforme a la legislación vigente removiendo el contenido infractor en un plazo de 72 horas hábiles.</p>

          <div style={H}>4. Política de reclamos de copyright</div>
          <p style={S}>Cualquier titular de derechos puede presentar un reclamo a través de /legal/copyright. NexoNet evaluará cada reclamo y, de ser válido, removerá el contenido y notificará al publicador. Un usuario con 2 o más reclamos válidos de copyright podrá ser suspendido de la plataforma.</p>

          <div style={H}>5. Política de reintegros</div>
          <p style={S}>Si un contenido por el que pagaste es removido por reclamo de copyright válido, los BIT gastados serán reintegrados a tu cuenta. Los reintegros se procesan dentro de las 48 horas hábiles posteriores a la resolución del reclamo.</p>

          <div style={H}>6. Grupos y nexos</div>
          <p style={S}>La creación de grupos y nexos está sujeta al pago de BIT según las tarifas vigentes. El creador es responsable del contenido publicado en su grupo/nexo. NexoNet se reserva el derecho de suspender o eliminar grupos que violen estos términos.</p>

          <div style={H}>7. Empresas</div>
          <p style={S}>La primera empresa tiene un período de prueba de 30 días sin costo. Posterior al trial, el mantenimiento es de 10.000 BIT mensuales. Las empresas que no renueven serán pausadas automáticamente.</p>

          <div style={H}>8. Conducta del usuario</div>
          <p style={S}>Queda prohibido: publicar contenido ilegal, fraudulento o que infrinja derechos de terceros; usar la plataforma para spam o phishing; crear cuentas falsas o duplicadas; manipular el sistema de BIT de forma indebida.</p>

          <div style={H}>9. Limitación de responsabilidad</div>
          <p style={S}>NexoNet actúa como intermediario tecnológico. No garantiza la calidad, veracidad o legalidad del contenido publicado por los usuarios. Las transacciones entre usuarios son responsabilidad exclusiva de las partes involucradas.</p>

          <div style={H}>10. Modificaciones</div>
          <p style={S}>NexoNet se reserva el derecho de modificar estos términos en cualquier momento. Los cambios serán notificados a los usuarios registrados y entrarán en vigencia a los 15 días de su publicación.</p>

          <div style={H}>11. Jurisdicción</div>
          <p style={S}>Estos términos se rigen por las leyes de la República Argentina. Cualquier controversia será sometida a los tribunales ordinarios de la ciudad de Rosario, provincia de Santa Fe.</p>
        </div>
      </div>
      <BottomNav />
    </main>
  );
}
