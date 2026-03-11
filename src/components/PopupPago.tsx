"use client";
import { useState } from "react";

// ─── Tipos ────────────────────────────────────────────────────────────────────
export type ProductoPago = {
  id:      string;
  emoji:   string;
  titulo:  string;
  desc:    string;
  precio:  number;          // en ARS
  bitCost: number;          // cuántos BIT equivale (generalmente igual al precio)
};

type MetodoPago = "transferencia" | "mercadopago" | "tarjeta" | "bit_nexo" | "bit_promo" | "bit_free";

type Props = {
  titulo:           string;           // "Link Multimedia" / "Agregar Adjunto" / etc.
  emoji:            string;           // "🔗" / "📎"
  producto:         ProductoPago;
  bitsDisponibles?: { nexo: number; promo: number; free: number };
  onClose:          () => void;
  onExito:          (metodo: MetodoPago) => void;
  // Contenido opcional que se muestra debajo del título (ej: lista de plataformas)
  children?:        React.ReactNode;
};

// ─── Íconos de plataformas para Link Multimedia ───────────────────────────────
export const LINK_PLATAFORMAS = [
  { nombre:"YouTube",       emoji:"▶️",  color:"#FF0000", desc:"Videos de tu producto o servicio"   },
  { nombre:"Instagram",     emoji:"📸",  color:"#E1306C", desc:"Posts o reels de tu cuenta"          },
  { nombre:"Facebook",      emoji:"👤",  color:"#1877F2", desc:"Publicaciones o página"              },
  { nombre:"Mercado Libre", emoji:"🛍️", color:"#FFE600", desc:"Tu publicación en ML"                },
  { nombre:"Cualquier URL", emoji:"🔗",  color:"#7a8fa0", desc:"Sitio web, TikTok, etc."            },
];

// ─── Componente principal ─────────────────────────────────────────────────────
export default function PopupPago({
  titulo, emoji, producto, bitsDisponibles, onClose, onExito, children,
}: Props) {
  const [paso, setPaso] = useState<"detalle" | "metodo">("detalle");

  const nexo  = bitsDisponibles?.nexo  || 0;
  const promo = bitsDisponibles?.promo || 0;
  const free  = bitsDisponibles?.free  || 0;
  const totalBits = nexo + promo + free;
  const puedeUsarBits = totalBits >= producto.bitCost;

  // Decide qué tipo de bit usar (prioridad: free > promo > nexo)
  const tipobitAUsar = (): MetodoPago => {
    if (free  >= producto.bitCost) return "bit_free";
    if (promo >= producto.bitCost) return "bit_promo";
    return "bit_nexo";
  };

  return (
    <div
      style={{ position:"fixed", inset:0, zIndex:300, background:"rgba(0,0,0,0.65)",
               display:"flex", alignItems:"flex-end", padding:"0" }}
      onClick={onClose}
    >
      <div
        style={{ width:"100%", background:"#fff", borderRadius:"24px 24px 0 0",
                 padding:"24px 20px 32px", boxShadow:"0 -8px 40px rgba(0,0,0,0.3)",
                 maxHeight:"92vh", overflowY:"auto", fontFamily:"'Nunito',sans-serif" }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"18px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
            <span style={{ fontSize:"28px" }}>{emoji}</span>
            <div>
              <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"22px",
                            color:"#1a2a3a", letterSpacing:"1px", lineHeight:1.1 }}>
                {titulo}
              </div>
              {paso === "metodo" && (
                <div style={{ fontSize:"12px", fontWeight:700, color:"#9a9a9a" }}>
                  Elegí cómo pagar
                </div>
              )}
            </div>
          </div>
          <button onClick={onClose}
            style={{ background:"#f0f0f0", border:"none", borderRadius:"50%",
                     width:"36px", height:"36px", fontSize:"16px", cursor:"pointer",
                     flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
            ✕
          </button>
        </div>

        {/* ════════════════════════════════════════
            PASO 1 — DETALLE
        ════════════════════════════════════════ */}
        {paso === "detalle" && (
          <>
            {/* Contenido extra (plataformas, etc.) */}
            {children && (
              <div style={{ marginBottom:"18px" }}>
                {children}
              </div>
            )}

            {/* ── Precio ── */}
            <div style={{ background:"linear-gradient(135deg,#1a2a3a,#243b55)", borderRadius:"16px",
                          padding:"16px 18px", marginBottom:"14px",
                          display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <div>
                <div style={{ fontSize:"11px", fontWeight:800, color:"#d4a017",
                              textTransform:"uppercase", letterSpacing:"1px", marginBottom:"4px" }}>
                  💰 Precio
                </div>
                <div style={{ fontSize:"26px", fontWeight:900, color:"#fff",
                              fontFamily:"'Bebas Neue',sans-serif", letterSpacing:"1px" }}>
                  ${producto.precio.toLocaleString("es-AR")}
                  <span style={{ fontSize:"14px", fontWeight:600, color:"#8a9aaa", marginLeft:"6px" }}>
                    / por anuncio
                  </span>
                </div>
              </div>
              <div style={{ fontSize:"11px", fontWeight:600, color:"#8a9aaa", textAlign:"right", maxWidth:"120px" }}>
                {producto.desc}
              </div>
            </div>

            {/* ── BIT disponibles ── */}
            {puedeUsarBits && (
              <div style={{ background:"rgba(39,174,96,0.08)", border:"2px solid rgba(39,174,96,0.3)",
                            borderRadius:"14px", padding:"14px 16px", marginBottom:"14px" }}>
                <div style={{ fontSize:"12px", fontWeight:900, color:"#27ae60",
                              textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:"10px" }}>
                  ✅ Tenés BIT para usar sin pagar
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
                  {free >= producto.bitCost && (
                    <BtnBit
                      label="BIT FREE" cantidad={free} color="#3a7bd5"
                      desc="BIT gratuitos disponibles"
                      onClick={() => { onExito("bit_free"); onClose(); }}
                    />
                  )}
                  {promo >= producto.bitCost && (
                    <BtnBit
                      label="BIT NexoPromotor" cantidad={promo} color="#27ae60"
                      desc="BIT por referidos"
                      onClick={() => { onExito("bit_promo"); onClose(); }}
                    />
                  )}
                  {nexo >= producto.bitCost && (
                    <BtnBit
                      label="BIT NexoNet" cantidad={nexo} color="#d4a017"
                      desc="BIT adquiridos"
                      onClick={() => { onExito("bit_nexo"); onClose(); }}
                    />
                  )}
                </div>
                <div style={{ fontSize:"11px", color:"#9a9a9a", fontWeight:600,
                              textAlign:"center", marginTop:"10px" }}>
                  O pagá en efectivo/transferencia abajo 👇
                </div>
              </div>
            )}

            {/* ── Botón comprar ── */}
            <button onClick={() => setPaso("metodo")}
              style={{ width:"100%", background:"linear-gradient(135deg,#f0c040,#d4a017)",
                       border:"none", borderRadius:"14px", padding:"16px",
                       fontSize:"16px", fontWeight:900, color:"#1a2a3a",
                       cursor:"pointer", fontFamily:"'Nunito',sans-serif",
                       boxShadow:"0 4px 0 #a07810", marginBottom:"10px" }}>
              🚀 Comprar por ${producto.precio.toLocaleString("es-AR")} ARS
            </button>

            <button onClick={onClose}
              style={{ width:"100%", background:"none", border:"2px solid #e8e8e6",
                       borderRadius:"14px", padding:"13px", fontSize:"14px",
                       fontWeight:700, color:"#9a9a9a", cursor:"pointer",
                       fontFamily:"'Nunito',sans-serif" }}>
              Cancelar
            </button>
          </>
        )}

        {/* ════════════════════════════════════════
            PASO 2 — MÉTODO DE PAGO
        ════════════════════════════════════════ */}
        {paso === "metodo" && (
          <>
            {/* Resumen del producto */}
            <div style={{ background:"#f8f8f8", borderRadius:"12px", padding:"12px 14px",
                          marginBottom:"18px", display:"flex", alignItems:"center",
                          justifyContent:"space-between" }}>
              <div style={{ fontSize:"13px", fontWeight:800, color:"#1a2a3a" }}>{emoji} {producto.titulo}</div>
              <div style={{ fontSize:"16px", fontWeight:900, color:"#d4a017" }}>
                ${producto.precio.toLocaleString("es-AR")} ARS
              </div>
            </div>

            {/* Métodos */}
            <div style={{ display:"flex", flexDirection:"column", gap:"10px", marginBottom:"18px" }}>
              {/* Transferencia */}
              <button onClick={() => { onExito("transferencia"); onClose(); }}
                style={{ background:"#fff", border:"2px solid #e8e8e6", borderRadius:"14px",
                         padding:"16px", display:"flex", alignItems:"center", gap:"14px",
                         cursor:"pointer", fontFamily:"'Nunito',sans-serif", textAlign:"left", width:"100%" }}>
                <div style={{ width:"44px", height:"44px", background:"linear-gradient(135deg,#1a2a3a,#243b55)",
                               borderRadius:"12px", display:"flex", alignItems:"center",
                               justifyContent:"center", fontSize:"22px", flexShrink:0 }}>
                  🏦
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:"15px", fontWeight:900, color:"#1a2a3a" }}>Transferencia bancaria</div>
                  <div style={{ fontSize:"12px", fontWeight:700, color:"#27ae60" }}>✓ Disponible · se acredita en 24hs</div>
                </div>
                <span style={{ color:"#d4a017", fontWeight:900, fontSize:"18px" }}>›</span>
              </button>

              {/* MercadoPago */}
              <button disabled
                style={{ background:"#f8f8f8", border:"2px solid #e8e8e6", borderRadius:"14px",
                         padding:"16px", display:"flex", alignItems:"center", gap:"14px",
                         cursor:"not-allowed", fontFamily:"'Nunito',sans-serif", textAlign:"left",
                         width:"100%", opacity:0.7 }}>
                <div style={{ width:"44px", height:"44px", background:"#009ee3",
                               borderRadius:"12px", display:"flex", alignItems:"center",
                               justifyContent:"center", fontSize:"22px", flexShrink:0 }}>
                  💳
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:"15px", fontWeight:900, color:"#1a2a3a" }}>MercadoPago</div>
                  <div style={{ fontSize:"12px", fontWeight:700, color:"#9a9a9a" }}>🔒 Próximamente</div>
                </div>
              </button>

              {/* Tarjeta */}
              <button disabled
                style={{ background:"#f8f8f8", border:"2px solid #e8e8e6", borderRadius:"14px",
                         padding:"16px", display:"flex", alignItems:"center", gap:"14px",
                         cursor:"not-allowed", fontFamily:"'Nunito',sans-serif", textAlign:"left",
                         width:"100%", opacity:0.7 }}>
                <div style={{ width:"44px", height:"44px", background:"linear-gradient(135deg,#e74c3c,#c0392b)",
                               borderRadius:"12px", display:"flex", alignItems:"center",
                               justifyContent:"center", fontSize:"22px", flexShrink:0 }}>
                  💳
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:"15px", fontWeight:900, color:"#1a2a3a" }}>Tarjeta de crédito/débito</div>
                  <div style={{ fontSize:"12px", fontWeight:700, color:"#9a9a9a" }}>🔒 Próximamente</div>
                </div>
              </button>
            </div>

            <button onClick={() => setPaso("detalle")}
              style={{ width:"100%", background:"none", border:"none", padding:"10px",
                       fontSize:"13px", fontWeight:700, color:"#9a9a9a",
                       cursor:"pointer", fontFamily:"'Nunito',sans-serif" }}>
              ‹ Volver
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Sub-componente botón BIT ─────────────────────────────────────────────────
function BtnBit({ label, cantidad, color, desc, onClick }:{
  label:string; cantidad:number; color:string; desc:string; onClick:()=>void;
}) {
  return (
    <button onClick={onClick}
      style={{ background:`${color}15`, border:`2px solid ${color}40`, borderRadius:"12px",
               padding:"10px 14px", display:"flex", alignItems:"center",
               justifyContent:"space-between", cursor:"pointer",
               fontFamily:"'Nunito',sans-serif", width:"100%" }}>
      <div style={{ textAlign:"left" }}>
        <div style={{ fontSize:"13px", fontWeight:900, color }}>{label}</div>
        <div style={{ fontSize:"11px", fontWeight:600, color:"#9a9a9a" }}>{desc}</div>
      </div>
      <div style={{ textAlign:"right" }}>
        <div style={{ fontSize:"18px", fontWeight:900, color }}>{cantidad.toLocaleString()}</div>
        <div style={{ fontSize:"10px", fontWeight:800, color:"#9a9a9a" }}>disponibles →</div>
      </div>
    </button>
  );
}
