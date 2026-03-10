"use client";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { useState } from "react";
import { useRouter } from "next/navigation";

const PAQUETES = [
  {
    bits: 500,
    precio: 500,
    label: "Starter",
    emoji: "⚡",
    color: "#6a8aaa",
    shadow: "#4a6a8a",
    desc: "Ideal para empezar",
    popular: false,
  },
  {
    bits: 1000,
    precio: 1000,
    label: "Conectado",
    emoji: "🔗",
    color: "#d4a017",
    shadow: "#a07810",
    desc: "El más elegido",
    popular: true,
  },
  {
    bits: 5000,
    precio: 5000,
    label: "Pro",
    emoji: "🏆",
    color: "#27ae60",
    shadow: "#1a7a40",
    desc: "Para usuarios activos",
    popular: false,
  },
  {
    bits: 10000,
    precio: 10000,
    label: "Élite",
    emoji: "💎",
    color: "#8e44ad",
    shadow: "#6a2a8a",
    desc: "Máximo rendimiento",
    popular: false,
  },
];

const ALIAS_TRANSFERENCIA = "nexonet.pagos";
const CBU = "0000003100012345678900";
const TITULAR = "NexoNet Argentina S.A.S.";
const CUIT = "30-71234567-8";

export default function ComprarPage() {
  const router = useRouter();
  const [seleccionado, setSeleccionado] = useState<number | null>(1); // 1000 BIT por defecto
  const [popup, setPopup] = useState(false);
  const [popupConfirm, setPopupConfirm] = useState(false);
  const [copiado, setCopiado] = useState<string | null>(null);

  const paquete = PAQUETES.find(p => p.bits === seleccionado);

  const copiar = (texto: string, key: string) => {
    navigator.clipboard.writeText(texto);
    setCopiado(key);
    setTimeout(() => setCopiado(null), 2000);
  };

  return (
    <main style={{ paddingTop:"95px", paddingBottom:"130px", background:"#f4f4f2", minHeight:"100vh", fontFamily:"'Nunito',sans-serif" }}>
      <Header />

      <div style={{ padding:"16px", maxWidth:"480px", margin:"0 auto" }}>

        {/* ── HERO ── */}
        <div style={{ background:"linear-gradient(135deg,#1a2a3a,#243b55)", borderRadius:"20px", padding:"24px 20px", textAlign:"center", marginBottom:"20px", position:"relative", overflow:"hidden" }}>
          <div style={{ position:"absolute", top:"-20px", right:"-20px", width:"120px", height:"120px", borderRadius:"50%", background:"rgba(212,160,23,0.08)" }} />
          <div style={{ position:"absolute", bottom:"-30px", left:"-10px", width:"100px", height:"100px", borderRadius:"50%", background:"rgba(212,160,23,0.05)" }} />
          <div style={{ fontSize:"44px", marginBottom:"8px" }}>⚡</div>
          <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"30px", color:"#f0c040", letterSpacing:"2px", marginBottom:"4px" }}>Cargar BIT</div>
          <div style={{ fontSize:"13px", color:"#8a9aaa", fontWeight:600, lineHeight:1.6 }}>
            1 BIT = $1 ARS · Cada conexión usa 1 BIT<br/>
            Los BIT no vencen y se acumulan en tu cuenta
          </div>
        </div>

        {/* ── PAQUETES ── */}
        <div style={{ fontSize:"11px", fontWeight:800, color:"#9a9a9a", textTransform:"uppercase", letterSpacing:"1px", marginBottom:"12px" }}>Elegí tu paquete</div>

        <div style={{ display:"flex", flexDirection:"column", gap:"10px", marginBottom:"20px" }}>
          {PAQUETES.map(p => {
            const activo = seleccionado === p.bits;
            return (
              <button key={p.bits} onClick={()=>setSeleccionado(p.bits)}
                style={{
                  display:"flex", alignItems:"center", justifyContent:"space-between",
                  background: activo ? "linear-gradient(135deg,#1a2a3a,#243b55)" : "#fff",
                  border: activo ? `2px solid ${p.color}` : "2px solid transparent",
                  borderRadius:"16px", padding:"16px 18px", cursor:"pointer",
                  boxShadow: activo ? `0 4px 20px ${p.color}30` : "0 2px 8px rgba(0,0,0,0.06)",
                  transition:"all 0.2s", width:"100%", textAlign:"left", position:"relative",
                  transform: activo ? "scale(1.01)" : "scale(1)",
                }}>

                {/* Popular badge */}
                {p.popular && (
                  <div style={{ position:"absolute", top:"-10px", left:"50%", transform:"translateX(-50%)", background:`linear-gradient(135deg,${p.color},#f0c040)`, borderRadius:"20px", padding:"3px 14px", fontSize:"10px", fontWeight:900, color:"#1a2a3a", whiteSpace:"nowrap", boxShadow:`0 2px 8px ${p.color}60` }}>
                    ⭐ MÁS POPULAR
                  </div>
                )}

                <div style={{ display:"flex", alignItems:"center", gap:"14px" }}>
                  <div style={{ width:"48px", height:"48px", borderRadius:"14px", background:`${p.color}20`, border:`2px solid ${p.color}40`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"24px", flexShrink:0 }}>
                    {p.emoji}
                  </div>
                  <div>
                    <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"22px", color: activo ? p.color : "#1a2a3a", letterSpacing:"1px", lineHeight:1 }}>
                      {p.bits.toLocaleString("es-AR")} BIT
                    </div>
                    <div style={{ fontSize:"11px", color: activo ? "#8a9aaa" : "#9a9a9a", fontWeight:700, marginTop:"2px" }}>
                      {p.label} · {p.desc}
                    </div>
                  </div>
                </div>

                <div style={{ textAlign:"right", flexShrink:0 }}>
                  <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"24px", color: activo ? "#f0c040" : "#1a2a3a", lineHeight:1 }}>
                    ${p.precio.toLocaleString("es-AR")}
                  </div>
                  <div style={{ fontSize:"10px", color: activo ? "#8a9aaa" : "#bbb", fontWeight:700, marginTop:"2px" }}>
                    ARS
                  </div>
                </div>

                {activo && (
                  <div style={{ position:"absolute", right:"16px", top:"50%", transform:"translateY(-50%)", width:"24px", height:"24px", borderRadius:"50%", background:p.color, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"12px" }}>✓</div>
                )}
              </button>
            );
          })}
        </div>

        {/* ── RESUMEN Y BOTÓN PAGAR ── */}
        {paquete && (
          <div style={{ background:"#fff", borderRadius:"16px", padding:"16px", marginBottom:"16px", boxShadow:"0 2px 12px rgba(0,0,0,0.06)" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"10px" }}>
              <span style={{ fontSize:"13px", fontWeight:700, color:"#666" }}>Paquete seleccionado</span>
              <span style={{ fontSize:"13px", fontWeight:900, color:"#1a2a3a" }}>{paquete.emoji} {paquete.bits.toLocaleString()} BIT</span>
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", paddingTop:"10px", borderTop:"1px solid #f0f0f0" }}>
              <span style={{ fontSize:"14px", fontWeight:800, color:"#1a2a3a" }}>Total a pagar</span>
              <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"26px", color:"#d4a017" }}>${paquete.precio.toLocaleString("es-AR")} ARS</span>
            </div>
          </div>
        )}

        <button
          onClick={()=>setPopup(true)}
          disabled={!seleccionado}
          style={{ width:"100%", background:"linear-gradient(135deg,#f0c040,#d4a017)", border:"none", borderRadius:"14px", padding:"16px", fontSize:"16px", fontWeight:900, color:"#1a2a3a", cursor:"pointer", fontFamily:"'Nunito',sans-serif", boxShadow:"0 5px 0 #a07810", letterSpacing:"0.5px", marginBottom:"12px" }}
        >
          ⚡ Pagar con transferencia
        </button>

        {/* Formas de pago chips */}
        <div style={{ display:"flex", gap:"8px", justifyContent:"center", flexWrap:"wrap", marginBottom:"20px" }}>
          {["🔵 MercadoPago", "💳 Tarjeta", "🟢 Débito"].map(fp => (
            <div key={fp} style={{ background:"#fff", borderRadius:"20px", padding:"6px 14px", fontSize:"11px", fontWeight:700, color:"#9a9a9a", boxShadow:"0 1px 4px rgba(0,0,0,0.06)" }}>
              {fp} <span style={{ color:"#bbb", fontSize:"9px" }}>· Próximamente</span>
            </div>
          ))}
        </div>

        {/* Info BIT */}
        <div style={{ background:"#fff", borderRadius:"16px", padding:"16px", boxShadow:"0 2px 8px rgba(0,0,0,0.05)" }}>
          <div style={{ fontSize:"11px", fontWeight:800, color:"#9a9a9a", textTransform:"uppercase", letterSpacing:"1px", marginBottom:"12px" }}>ℹ️ ¿Cómo funcionan los BIT?</div>
          {[
            { e:"🔗", t:"1 BIT = 1 conexión", d:"Cada vez que te conectás con un anuncio usás 1 BIT" },
            { e:"♾️", t:"Sin vencimiento", d:"Tus BIT no expiran nunca, se acumulan en tu cuenta" },
            { e:"📊", t:"Seguimiento en tiempo real", d:"Ves tus BIT disponibles y consumidos en tu perfil" },
            { e:"⭐", t:"Generás estrellas", d:"Cada BIT consumido suma a tu reputación en la plataforma" },
          ].map(item => (
            <div key={item.t} style={{ display:"flex", gap:"12px", alignItems:"flex-start", marginBottom:"12px" }}>
              <span style={{ fontSize:"20px", flexShrink:0 }}>{item.e}</span>
              <div>
                <div style={{ fontSize:"13px", fontWeight:800, color:"#1a2a3a" }}>{item.t}</div>
                <div style={{ fontSize:"12px", color:"#9a9a9a", fontWeight:600, marginTop:"2px" }}>{item.d}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ══ POPUP TRANSFERENCIA ══ */}
      {popup && paquete && (
        <div style={{ position:"fixed", inset:0, zIndex:200, background:"rgba(0,0,0,0.7)", display:"flex", alignItems:"flex-end", padding:"16px" }}>
          <div style={{ width:"100%", background:"#fff", borderRadius:"20px 20px 16px 16px", padding:"24px 20px 20px", boxShadow:"0 -8px 40px rgba(0,0,0,0.3)", maxHeight:"90vh", overflowY:"auto" }}>

            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"20px" }}>
              <div>
                <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"22px", color:"#1a2a3a", letterSpacing:"1px" }}>💳 Datos de transferencia</div>
                <div style={{ fontSize:"12px", color:"#9a9a9a", fontWeight:600 }}>{paquete.bits.toLocaleString()} BIT · ${paquete.precio.toLocaleString()} ARS</div>
              </div>
              <button onClick={()=>setPopup(false)} style={{ background:"#f0f0f0", border:"none", borderRadius:"50%", width:"32px", height:"32px", fontSize:"16px", cursor:"pointer" }}>✕</button>
            </div>

            {/* Monto destacado */}
            <div style={{ background:"linear-gradient(135deg,#1a2a3a,#243b55)", borderRadius:"16px", padding:"16px", textAlign:"center", marginBottom:"16px" }}>
              <div style={{ fontSize:"12px", color:"#8a9aaa", fontWeight:700, marginBottom:"4px" }}>TOTAL A TRANSFERIR</div>
              <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"40px", color:"#f0c040", letterSpacing:"2px" }}>${paquete.precio.toLocaleString("es-AR")}</div>
              <div style={{ fontSize:"11px", color:"#8a9aaa", fontWeight:600 }}>ARS · {paquete.bits.toLocaleString()} BIT</div>
            </div>

            {/* Datos bancarios */}
            <div style={{ display:"flex", flexDirection:"column", gap:"10px", marginBottom:"16px" }}>
              {[
                { label:"Alias", valor:ALIAS_TRANSFERENCIA },
                { label:"CBU", valor:CBU },
                { label:"Titular", valor:TITULAR },
                { label:"CUIT", valor:CUIT },
              ].map(dato => (
                <div key={dato.label} style={{ background:"#f8f8f8", borderRadius:"12px", padding:"12px 14px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                  <div>
                    <div style={{ fontSize:"10px", fontWeight:800, color:"#9a9a9a", textTransform:"uppercase", letterSpacing:"0.5px" }}>{dato.label}</div>
                    <div style={{ fontSize:"14px", fontWeight:800, color:"#1a2a3a", marginTop:"2px", fontFamily: dato.label==="CBU" ? "monospace" : "inherit" }}>{dato.valor}</div>
                  </div>
                  <button onClick={()=>copiar(dato.valor, dato.label)}
                    style={{ background: copiado===dato.label ? "#e8f8ee" : "#fff", border:`1px solid ${copiado===dato.label?"#27ae60":"#e8e8e8"}`, borderRadius:"8px", padding:"6px 12px", fontSize:"12px", fontWeight:800, color: copiado===dato.label ? "#27ae60" : "#666", cursor:"pointer", flexShrink:0 }}>
                    {copiado===dato.label ? "✓ Copiado" : "Copiar"}
                  </button>
                </div>
              ))}
            </div>

            {/* Instrucciones */}
            <div style={{ background:"#fff8e0", borderRadius:"12px", padding:"14px", marginBottom:"16px", border:"1px solid #f0e0a0" }}>
              <div style={{ fontSize:"12px", fontWeight:800, color:"#a07810", marginBottom:"8px" }}>📋 Instrucciones</div>
              <ol style={{ margin:0, paddingLeft:"18px", fontSize:"12px", color:"#666", fontWeight:600, lineHeight:2 }}>
                <li>Realizá la transferencia por el monto exacto</li>
                <li>Guardá el comprobante</li>
                <li>Enviá el comprobante por WhatsApp o email</li>
                <li>En menos de 24hs tus BIT se acreditan</li>
              </ol>
            </div>

            {/* Contacto para comprobante */}
            <div style={{ display:"flex", gap:"10px", marginBottom:"16px" }}>
              <a href={`https://wa.me/5493492000000?text=Hola! Hice una transferencia de $${paquete.precio} por ${paquete.bits} BIT. Te adjunto el comprobante.`}
                target="_blank" rel="noopener noreferrer"
                style={{ flex:1, background:"#25D366", border:"none", borderRadius:"12px", padding:"12px", fontSize:"13px", fontWeight:900, color:"#fff", cursor:"pointer", textAlign:"center", textDecoration:"none", display:"flex", alignItems:"center", justifyContent:"center", gap:"6px" }}>
                💬 Enviar comprobante por WhatsApp
              </a>
            </div>
            <a href={`mailto:pagos@nexonet.ar?subject=Comprobante transferencia ${paquete.bits} BIT`}
              style={{ display:"block", width:"100%", background:"#f0f0f0", border:"none", borderRadius:"12px", padding:"12px", fontSize:"13px", fontWeight:800, color:"#666", cursor:"pointer", textAlign:"center", textDecoration:"none", boxSizing:"border-box" }}>
              📧 Enviar por email — pagos@nexonet.ar
            </a>
          </div>
        </div>
      )}

      <BottomNav />
    </main>
  );
}
