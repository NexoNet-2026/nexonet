"use client";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import Link from "next/link";
import { useRouter } from "next/navigation";

const S: React.CSSProperties = { fontSize:"13px", color:"#444", lineHeight:1.8, marginBottom:"16px" };
const H: React.CSSProperties = { fontFamily:"'Bebas Neue',sans-serif", fontSize:"18px", color:"#1a2a3a", letterSpacing:"0.5px", marginBottom:"8px", marginTop:"28px" };

export default function TerminosPage() {
  const router = useRouter();
  return (
    <main style={{ paddingTop:"95px", paddingBottom:"130px", background:"#f4f4f2", minHeight:"100vh", fontFamily:"'Nunito',sans-serif" }}>
      <Header />
      <div style={{ padding:"16px", maxWidth:"600px", margin:"0 auto" }}>
        <button onClick={()=>router.back()} style={{background:"rgba(26,42,58,0.08)",border:"1px solid rgba(26,42,58,0.2)",borderRadius:"10px",padding:"7px 13px",color:"#1a2a3a",fontSize:"13px",fontWeight:700,cursor:"pointer",fontFamily:"'Nunito',sans-serif",marginBottom:"14px"}}>← Volver</button>
        <div style={{ background:"#fff", borderRadius:"16px", padding:"24px", boxShadow:"0 2px 10px rgba(0,0,0,0.06)" }}>
          <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"28px", color:"#1a2a3a", letterSpacing:"1px", marginBottom:"4px" }}>
            📜 Términos y Condiciones de Uso
          </div>
          <div style={{ fontSize:"12px", color:"#9a9a9a", fontWeight:600, marginBottom:"20px" }}>Última actualización: Marzo 2026</div>

          <div style={H}>1. Aceptación</div>
          <p style={S}>Al registrarte y usar NexoNet Argentina ("la Plataforma"), aceptás estos Términos y Condiciones. Si no los aceptás, no uses la plataforma.</p>

          <div style={H}>2. Quiénes somos</div>
          <p style={S}>NexoNet Argentina es una plataforma digital operada por Adrián Morra, monotributista, con domicilio en Roldán, provincia de Santa Fe, Argentina. Contacto: <strong>legal@nexonet.ar</strong></p>

          <div style={H}>3. Registro y cuenta</div>
          <p style={S}>Debés ser mayor de 18 años para registrarte. Sos responsable de mantener la confidencialidad de tu contraseña. NexoNet se reserva el derecho de suspender cuentas que violen estos términos. Está prohibido crear cuentas falsas o hacerse pasar por otra persona.</p>

          <div style={H}>4. Sistema de BIT</div>
          <p style={S}>Los BIT son créditos virtuales dentro de la plataforma. No son dinero real ni criptomoneda. Los BIT comprados con dinero real no son reembolsables, salvo error técnico comprobable. Los BIT Free y BIT Promo no tienen valor monetario y no pueden canjearse por dinero. NexoNet puede modificar los valores y costos de BIT con previo aviso de 15 días.</p>

          <div style={H}>5. Publicaciones y contenido</div>
          <p style={S}>Sos responsable del contenido que publicás (anuncios, nexos, mensajes, archivos). Está prohibido publicar contenido ilegal, fraudulento, ofensivo, sexual explícito o que viole derechos de terceros. NexoNet puede eliminar contenido sin previo aviso si viola estas reglas. Al publicar contenido, otorgás a NexoNet una licencia no exclusiva para mostrarlo en la plataforma.</p>

          <div style={H}>6. Transacciones entre usuarios</div>
          <p style={S}>NexoNet es un intermediario. Las transacciones son entre usuarios. NexoNet no garantiza la calidad, veracidad ni legalidad de los bienes o servicios publicados. Recomendamos verificar la identidad del vendedor antes de concretar una operación.</p>

          <div style={H}>7. Programa NexoPromotor</div>
          <p style={S}>Al referir usuarios, recibís el 20% en BIT Promo de cada compra que realice tu referido. El reembolso en dinero está disponible al acumular 100.000 BIT Promo, contra presentación de factura A con IVA. El valor de referencia es 1 BIT Promo = $1 ARS al momento del reembolso. NexoNet se reserva el derecho de modificar el programa con previo aviso de 30 días.</p>

          <div style={H}>8. Propiedad intelectual</div>
          <p style={S}>El nombre NexoNet, su logo, diseño y código son propiedad de Adrián Morra. No podés copiar, reproducir ni distribuir contenido de la plataforma sin autorización.</p>

          <div style={H}>9. Limitación de responsabilidad</div>
          <p style={S}>NexoNet no se responsabiliza por pérdidas económicas derivadas de transacciones entre usuarios. NexoNet no garantiza disponibilidad continua del servicio. En ningún caso la responsabilidad de NexoNet superará el monto pagado por el usuario en los últimos 12 meses.</p>

          <div style={H}>10. Modificaciones</div>
          <p style={S}>NexoNet puede modificar estos términos. Te notificaremos con 15 días de anticipación por email o notificación en la app.</p>

          <div style={H}>11. Jurisdicción</div>
          <p style={S}>Estos términos se rigen por las leyes de la República Argentina. Ante cualquier disputa, las partes se someten a la jurisdicción de los tribunales ordinarios de la ciudad de Rosario, provincia de Santa Fe.</p>

          <div style={{borderTop:"1px solid #f0f0f0",paddingTop:"20px",marginTop:"28px",display:"flex",gap:"12px",flexWrap:"wrap",justifyContent:"center"}}>
            <Link href="/legal/privacidad" style={{fontSize:"12px",fontWeight:700,color:"#3a7bd5",textDecoration:"none"}}>🔒 Privacidad</Link>
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
