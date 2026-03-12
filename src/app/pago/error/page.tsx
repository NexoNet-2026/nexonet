"use client";
import { useRouter } from "next/navigation";

export default function PagoError() {
  const router = useRouter();
  return (
    <main style={{ minHeight:"100vh", background:"linear-gradient(135deg,#0d1a26,#1a2a3a)", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Nunito',sans-serif", padding:"20px" }}>
      <div style={{ width:"100%", maxWidth:"380px", textAlign:"center" }}>
        <div style={{ fontSize:"70px", marginBottom:"20px" }}>😕</div>
        <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"32px", color:"#e74c3c", letterSpacing:"1px", marginBottom:"8px" }}>Pago no completado</div>
        <div style={{ fontSize:"14px", color:"#8a9aaa", fontWeight:600, marginBottom:"32px" }}>El pago fue rechazado o cancelado. No se realizó ningún cobro.</div>
        <div style={{ display:"flex", flexDirection:"column", gap:"12px" }}>
          <button onClick={() => router.push("/usuario")}
            style={{ background:"linear-gradient(135deg,#d4a017,#f0c040)", border:"none", borderRadius:"14px", padding:"14px", fontSize:"15px", fontWeight:900, color:"#1a2a3a", cursor:"pointer", fontFamily:"'Nunito',sans-serif", boxShadow:"0 4px 0 #a07810" }}>
            🔄 Intentar de nuevo
          </button>
          <button onClick={() => router.push("/")}
            style={{ background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.15)", borderRadius:"14px", padding:"14px", fontSize:"14px", fontWeight:800, color:"#fff", cursor:"pointer", fontFamily:"'Nunito',sans-serif" }}>
            🏠 Ir al inicio
          </button>
        </div>
      </div>
    </main>
  );
}
