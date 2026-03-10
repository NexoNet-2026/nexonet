"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { PRODUCTOS } from "@/app/comprar/page";

// ══════════════════════════════════════════
// PopupCompra — componente reutilizable
//
// Uso:
//   <PopupCompra
//     tipo="conexion"          // "anuncio" | "conexion" | "flash" | "link" | "adjunto" | "grupo"
//     bitsDisponibles={{ nexo:500, promo:200, free:50 }}
//     onClose={() => setPopup(false)}
//     onUsarBits={(cantidad, tipo) => { /* descontar BIT y ejecutar acción */ }}
//   />
// ══════════════════════════════════════════

const ALIAS    = "nexonet.pagos";
const CBU      = "0000003100012345678900";
const TITULAR  = "NexoNet Argentina S.A.S.";
const CUIT_NUM = "30-71234567-8";

type TipoBit = "nexo" | "promo" | "free";

type Props = {
  tipo: "anuncio" | "conexion" | "flash" | "link" | "adjunto" | "grupo";
  bitsDisponibles?: { nexo: number; promo: number; free: number };
  costoFijo?: number;         // si el costo ya está definido (ej: 1 BIT para conectar)
  tituloAccion?: string;      // ej: "Conectar con este anuncio"
  onClose: () => void;
  onUsarBits?: (cantidad: number, tipoBit: TipoBit) => void;
};

const TIPO_CONFIG: Record<string, { label: string; emoji: string; categoria: keyof typeof PRODUCTOS | null }> = {
  anuncio:  { label:"Publicar anuncio",     emoji:"📋", categoria:"anuncio"  },
  conexion: { label:"Cargar BIT conexión",  emoji:"🔗", categoria:"conexion" },
  flash:    { label:"PROMO Flash",            emoji:"⚡", categoria:"flash"    },
  link:     { label:"Agregar link",         emoji:"🔗", categoria:"extras"   },
  adjunto:  { label:"Agregar adjunto",      emoji:"📎", categoria:"extras"   },
  grupo:    { label:"Unirse a grupo",       emoji:"👥", categoria:"extras"   },
};

const BIT_COLORS: Record<TipoBit, { bg: string; text: string; label: string; desc: string }> = {
  nexo:  { bg:"#d4a017", text:"#1a2a3a", label:"BIT NEXO",  desc:"Comprados" },
  promo: { bg:"#27ae60", text:"#fff",    label:"BIT PROMO", desc:"Por referidos — reembolsable" },
  free:  { bg:"#6a8aaa", text:"#fff",    label:"BIT FREE",  desc:"Asignados por NexoNet" },
};

export default function PopupCompra({ tipo, bitsDisponibles, costoFijo, tituloAccion, onClose, onUsarBits }: Props) {
  const router = useRouter();
  const config = TIPO_CONFIG[tipo];

  // Si tiene costo fijo (ej: 1 BIT para conectar), muestra selector de tipo de BIT
  // Si no, muestra los paquetes disponibles para ese tipo
  const [paso, setPaso]         = useState<"bits" | "paquetes" | "metodo" | "transferencia" | "proximamente">(
    costoFijo && bitsDisponibles ? "bits" : "paquetes"
  );
  const [tipoBitSel, setTipoBitSel] = useState<TipoBit | null>(null);
  const [prodSel, setProdSel]   = useState<string | null>(null);
  const [metodo, setMetodo]     = useState<string | null>(null);
  const [copiado, setCopiado]   = useState<string | null>(null);

  const bits = bitsDisponibles || { nexo:0, promo:0, free:0 };
  const totalBits = bits.nexo + bits.promo + bits.free;

  const categoria = config.categoria;
  const productosCategoria = categoria ? PRODUCTOS[categoria] : [];
  // Para extras, filtrar solo el relevante
  const productosFiltrados = tipo === "link" ? productosCategoria.filter((p:any) => p.id === "link")
    : tipo === "adjunto" ? productosCategoria.filter((p:any) => p.id === "adjunto")
    : tipo === "grupo" ? productosCategoria.filter((p:any) => p.id === "grupo")
    : productosCategoria;

  const producto = [...Object.values(PRODUCTOS).flat()].find((p:any) => p.id === prodSel) as any;

  const copiar = (texto: string, key: string) => {
    navigator.clipboard.writeText(texto);
    setCopiado(key);
    setTimeout(() => setCopiado(null), 2000);
  };

  const tieneBitsSuficientes = (t: TipoBit) => costoFijo ? bits[t] >= costoFijo : false;

  return (
    <div style={{ position:"fixed", inset:0, zIndex:300, background:"rgba(0,0,0,0.75)", display:"flex", alignItems:"flex-end", padding:"16px" }}>
      <div style={{ width:"100%", background:"#fff", borderRadius:"20px 20px 16px 16px", padding:"24px 20px 20px", boxShadow:"0 -8px 40px rgba(0,0,0,0.35)", maxHeight:"92vh", overflowY:"auto" }}>

        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"16px" }}>
          <div>
            <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"22px", color:"#1a2a3a", letterSpacing:"1px" }}>
              {config.emoji} {tituloAccion || config.label}
            </div>
            {costoFijo && (
              <div style={{ fontSize:"12px", color:"#9a9a9a", fontWeight:600, marginTop:"2px" }}>
                Costo: {costoFijo} BIT = ${costoFijo} ARS · Tus BIT: {totalBits} disponibles
              </div>
            )}
          </div>
          <button onClick={onClose} style={{ background:"#f0f0f0", border:"none", borderRadius:"50%", width:"32px", height:"32px", fontSize:"16px", cursor:"pointer", flexShrink:0 }}>✕</button>
        </div>

        {/* ── PASO 1: Usar BIT disponibles ── */}
        {paso === "bits" && costoFijo && (
          <>
            {totalBits >= costoFijo ? (
              <>
                <div style={{ fontSize:"13px", fontWeight:700, color:"#666", marginBottom:"12px" }}>
                  Elegí qué tipo de BIT usar:
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:"8px", marginBottom:"16px" }}>
                  {(["nexo","promo","free"] as TipoBit[]).map(t => {
                    const c = BIT_COLORS[t];
                    const suficientes = tieneBitsSuficientes(t);
                    return (
                      <button key={t} onClick={()=>setTipoBitSel(t)} disabled={!suficientes}
                        style={{ display:"flex", alignItems:"center", justifyContent:"space-between", background: tipoBitSel===t ? "#f0f8ff" : "#f8f8f8", border:`2px solid ${tipoBitSel===t?"#d4a017":"#e8e8e8"}`, borderRadius:"14px", padding:"12px 14px", cursor:suficientes?"pointer":"not-allowed", opacity:suficientes?1:0.4, width:"100%", textAlign:"left" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:"12px" }}>
                          <div style={{ background:c.bg, borderRadius:"8px", padding:"4px 10px", fontSize:"10px", fontWeight:900, color:c.text }}>
                            {c.label}
                          </div>
                          <div>
                            <div style={{ fontSize:"13px", fontWeight:800, color:"#1a2a3a" }}>
                              {bits[t].toLocaleString()} disponibles
                            </div>
                            <div style={{ fontSize:"10px", color:"#9a9a9a", fontWeight:600 }}>{c.desc}</div>
                          </div>
                        </div>
                        {tipoBitSel===t && <span style={{ color:"#d4a017", fontSize:"18px" }}>✓</span>}
                        {!suficientes && <span style={{ fontSize:"10px", color:"#e74c3c", fontWeight:800 }}>Insuficiente</span>}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={()=>{ if(tipoBitSel && onUsarBits) { onUsarBits(costoFijo, tipoBitSel); onClose(); } }}
                  disabled={!tipoBitSel}
                  style={{ width:"100%", background:tipoBitSel?"linear-gradient(135deg,#f0c040,#d4a017)":"#f0f0f0", border:"none", borderRadius:"12px", padding:"14px", fontSize:"15px", fontWeight:900, color:tipoBitSel?"#1a2a3a":"#bbb", cursor:tipoBitSel?"pointer":"not-allowed", fontFamily:"'Nunito',sans-serif", boxShadow:tipoBitSel?"0 4px 0 #a07810":"none", marginBottom:"10px" }}>
                  ⚡ Usar {costoFijo} BIT {tipoBitSel ? `(${BIT_COLORS[tipoBitSel].label})` : ""}
                </button>
                <button onClick={()=>setPaso("paquetes")}
                  style={{ width:"100%", background:"none", border:"1px solid #e8e8e8", borderRadius:"12px", padding:"12px", fontSize:"13px", fontWeight:800, color:"#666", cursor:"pointer" }}>
                  💳 Comprar más BIT
                </button>
              </>
            ) : (
              <>
                <div style={{ background:"#fff0f0", borderRadius:"14px", padding:"16px", textAlign:"center", marginBottom:"16px", border:"1px solid #fdd" }}>
                  <div style={{ fontSize:"32px", marginBottom:"8px" }}>😕</div>
                  <div style={{ fontSize:"14px", fontWeight:800, color:"#c0392b", marginBottom:"4px" }}>No tenés BIT suficientes</div>
                  <div style={{ fontSize:"12px", color:"#888", fontWeight:600 }}>Necesitás {costoFijo} BIT · Tenés {totalBits} disponibles</div>
                </div>
                <button onClick={()=>setPaso("paquetes")}
                  style={{ width:"100%", background:"linear-gradient(135deg,#f0c040,#d4a017)", border:"none", borderRadius:"12px", padding:"14px", fontSize:"15px", fontWeight:900, color:"#1a2a3a", cursor:"pointer", fontFamily:"'Nunito',sans-serif", boxShadow:"0 4px 0 #a07810", marginBottom:"8px" }}>
                  ⚡ Cargar BIT ahora
                </button>
                <button onClick={onClose}
                  style={{ width:"100%", background:"none", border:"1px solid #e8e8e8", borderRadius:"12px", padding:"12px", fontSize:"13px", fontWeight:800, color:"#666", cursor:"pointer" }}>
                  Cancelar
                </button>
              </>
            )}
          </>
        )}

        {/* ── PASO 2: Elegir paquete ── */}
        {paso === "paquetes" && (
          <>
            <div style={{ display:"flex", flexDirection:"column", gap:"8px", marginBottom:"16px" }}>
              {productosFiltrados.map((p: any) => {
                const activo = prodSel === p.id;
                return (
                  <button key={p.id} onClick={()=>setProdSel(p.id)}
                    style={{ display:"flex", alignItems:"center", justifyContent:"space-between", background: activo ? "linear-gradient(135deg,#1a2a3a,#243b55)" : "#f8f8f8", border:`2px solid ${activo?"#d4a017":"transparent"}`, borderRadius:"14px", padding:"12px 14px", cursor:"pointer", width:"100%", textAlign:"left", position:"relative" }}>
                    {p.badge && <div style={{ position:"absolute", top:"-8px", right:"12px", background:"#27ae60", borderRadius:"20px", padding:"2px 8px", fontSize:"9px", fontWeight:900, color:"#fff" }}>{p.badge}</div>}
                    <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
                      <span style={{ fontSize:"20px" }}>{p.emoji}</span>
                      <div>
                        <div style={{ fontSize:"14px", fontWeight:900, color: activo?"#f0c040":"#1a2a3a" }}>{p.label}</div>
                        <div style={{ fontSize:"11px", color: activo?"#8a9aaa":"#9a9a9a", fontWeight:600 }}>{p.desc}{p.duracion?` · ${p.duracion}`:""}</div>
                      </div>
                    </div>
                    <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"20px", color: activo?"#f0c040":"#1a2a3a", flexShrink:0 }}>
                      ${p.precio.toLocaleString()}
                    </div>
                  </button>
                );
              })}
            </div>

            {prodSel && (
              <button onClick={()=>setPaso("metodo")}
                style={{ width:"100%", background:"linear-gradient(135deg,#f0c040,#d4a017)", border:"none", borderRadius:"12px", padding:"14px", fontSize:"15px", fontWeight:900, color:"#1a2a3a", cursor:"pointer", fontFamily:"'Nunito',sans-serif", boxShadow:"0 4px 0 #a07810", marginBottom:"8px" }}>
                ⚡ Continuar — ${producto?.precio.toLocaleString()} ARS
              </button>
            )}
            {costoFijo && (
              <button onClick={()=>setPaso("bits")}
                style={{ width:"100%", background:"none", border:"1px solid #e8e8e8", borderRadius:"12px", padding:"10px", fontSize:"13px", fontWeight:800, color:"#666", cursor:"pointer" }}>
                ‹ Volver
              </button>
            )}
          </>
        )}

        {/* ── PASO 3: Método de pago ── */}
        {paso === "metodo" && producto && (
          <>
            <div style={{ fontSize:"12px", color:"#9a9a9a", fontWeight:600, marginBottom:"16px" }}>
              {producto.emoji} {producto.label} · ${producto.precio.toLocaleString()} ARS
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:"8px", marginBottom:"12px" }}>
              <button onClick={()=>setPaso("transferencia")}
                style={{ display:"flex", alignItems:"center", gap:"12px", background:"#f8f8f8", border:"2px solid #e8e8e8", borderRadius:"14px", padding:"14px", cursor:"pointer", width:"100%", textAlign:"left" }}>
                <div style={{ width:"40px", height:"40px", borderRadius:"10px", background:"linear-gradient(135deg,#1a2a3a,#243b55)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"18px", flexShrink:0 }}>🏦</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:"14px", fontWeight:900, color:"#1a2a3a" }}>Transferencia bancaria</div>
                  <div style={{ fontSize:"11px", color:"#27ae60", fontWeight:700 }}>✓ Disponible · 24hs</div>
                </div>
                <span style={{ fontSize:"18px", color:"#d4a017" }}>›</span>
              </button>
              {[{ id:"mp", label:"MercadoPago", icon:"🔵", bg:"linear-gradient(135deg,#009ee3,#007bbd)" }, { id:"tarjeta", label:"Tarjeta", icon:"💳", bg:"linear-gradient(135deg,#e74c3c,#c0392b)" }].map(m => (
                <button key={m.id} onClick={()=>setPaso("proximamente")}
                  style={{ display:"flex", alignItems:"center", gap:"12px", background:"#f8f8f8", border:"2px solid #e8e8e8", borderRadius:"14px", padding:"14px", cursor:"pointer", width:"100%", textAlign:"left", opacity:0.6 }}>
                  <div style={{ width:"40px", height:"40px", borderRadius:"10px", background:m.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"18px", flexShrink:0 }}>{m.icon}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:"14px", fontWeight:900, color:"#1a2a3a" }}>{m.label}</div>
                    <div style={{ fontSize:"11px", color:"#9a9a9a", fontWeight:700 }}>🔒 Próximamente</div>
                  </div>
                  <span style={{ fontSize:"18px", color:"#ccc" }}>›</span>
                </button>
              ))}
            </div>
            <button onClick={()=>setPaso("paquetes")}
              style={{ width:"100%", background:"none", border:"1px solid #e8e8e8", borderRadius:"12px", padding:"10px", fontSize:"13px", fontWeight:800, color:"#666", cursor:"pointer" }}>
              ‹ Volver
            </button>
          </>
        )}

        {/* ── PASO: PRÓXIMAMENTE ── */}
        {paso === "proximamente" && (
          <div style={{ textAlign:"center", padding:"16px 0" }}>
            <div style={{ fontSize:"48px", marginBottom:"12px" }}>🔒</div>
            <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"22px", color:"#1a2a3a", marginBottom:"8px" }}>Próximamente</div>
            <div style={{ fontSize:"13px", color:"#9a9a9a", fontWeight:600, lineHeight:1.7, marginBottom:"20px" }}>
              Estamos integrando este método.<br/>Mientras tanto podés pagar por transferencia bancaria.
            </div>
            <button onClick={()=>setPaso("transferencia")}
              style={{ width:"100%", background:"linear-gradient(135deg,#f0c040,#d4a017)", border:"none", borderRadius:"12px", padding:"14px", fontSize:"14px", fontWeight:900, color:"#1a2a3a", cursor:"pointer", fontFamily:"'Nunito',sans-serif", boxShadow:"0 4px 0 #a07810", marginBottom:"8px" }}>
              🏦 Pagar por transferencia
            </button>
            <button onClick={()=>setPaso("metodo")}
              style={{ width:"100%", background:"none", border:"1px solid #e8e8e8", borderRadius:"12px", padding:"10px", fontSize:"13px", fontWeight:800, color:"#666", cursor:"pointer" }}>
              ‹ Volver a métodos
            </button>
          </div>
        )}

        {/* ── PASO: TRANSFERENCIA ── */}
        {paso === "transferencia" && producto && (
          <>
            <div style={{ background:"linear-gradient(135deg,#1a2a3a,#243b55)", borderRadius:"14px", padding:"14px", textAlign:"center", marginBottom:"12px" }}>
              <div style={{ fontSize:"11px", color:"#8a9aaa", fontWeight:700, marginBottom:"2px" }}>TOTAL A TRANSFERIR</div>
              <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"38px", color:"#f0c040", lineHeight:1 }}>${producto.precio.toLocaleString("es-AR")}</div>
              <div style={{ fontSize:"11px", color:"#8a9aaa", marginTop:"4px" }}>ARS · {producto.label}{producto.duracion?` · ${producto.duracion}`:""}</div>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:"8px", marginBottom:"12px" }}>
              {[{ label:"Alias", valor:ALIAS },{ label:"CBU", valor:CBU },{ label:"Titular", valor:TITULAR },{ label:"CUIT", valor:CUIT_NUM }].map(d => (
                <div key={d.label} style={{ background:"#f8f8f8", borderRadius:"10px", padding:"10px 12px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                  <div>
                    <div style={{ fontSize:"9px", fontWeight:800, color:"#bbb", textTransform:"uppercase" }}>{d.label}</div>
                    <div style={{ fontSize:"13px", fontWeight:800, color:"#1a2a3a", fontFamily:d.label==="CBU"?"monospace":"inherit" }}>{d.valor}</div>
                  </div>
                  <button onClick={()=>copiar(d.valor, d.label)}
                    style={{ background:copiado===d.label?"#e8f8ee":"#fff", border:`1px solid ${copiado===d.label?"#27ae60":"#e8e8e8"}`, borderRadius:"6px", padding:"4px 8px", fontSize:"11px", fontWeight:800, color:copiado===d.label?"#27ae60":"#666", cursor:"pointer" }}>
                    {copiado===d.label?"✓":"Copiar"}
                  </button>
                </div>
              ))}
            </div>
            <div style={{ background:"#fff8e0", borderRadius:"10px", padding:"10px 12px", marginBottom:"12px", border:"1px solid #f0e0a0", fontSize:"12px", color:"#666", fontWeight:600, lineHeight:1.8 }}>
              <strong style={{ color:"#a07810" }}>📋 Instrucciones:</strong><br/>
              1. Transferí el monto exacto · 2. Guardá el comprobante<br/>
              3. Envialo por WhatsApp o email · 4. BIT acreditados en &lt;24hs
            </div>
            <a href={`https://wa.me/5493492000000?text=Hola! Hice una transferencia de $${producto.precio} por ${producto.label}. Te adjunto el comprobante.`}
              target="_blank" rel="noopener noreferrer"
              style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:"8px", background:"#25D366", borderRadius:"12px", padding:"12px", fontSize:"13px", fontWeight:900, color:"#fff", textDecoration:"none", marginBottom:"6px" }}>
              💬 Enviar comprobante por WhatsApp
            </a>
            <a href={`mailto:pagos@nexonet.ar?subject=Comprobante ${producto.label} $${producto.precio}`}
              style={{ display:"block", background:"#f0f0f0", borderRadius:"12px", padding:"10px", fontSize:"12px", fontWeight:800, color:"#666", textAlign:"center", textDecoration:"none" }}>
              📧 pagos@nexonet.ar
            </a>
          </>
        )}

      </div>
    </div>
  );
}
