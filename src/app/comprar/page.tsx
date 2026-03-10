"use client";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { PRODUCTOS } from "@/lib/productos";

const CATEGORIAS = [
  { id:"anuncio",  label:"Anuncios", emoji:"📋" },
  { id:"conexion", label:"Conexión", emoji:"🔗" },
  { id:"flash",    label:"PROMO Flash", emoji:"⚡" },
  { id:"extras",   label:"Extras",   emoji:"✨" },
];

const ALIAS = "nexonet.pagos";
const CBU   = "0000003100012345678900";
const TITULAR = "NexoNet Argentina S.A.S.";
const CUIT  = "30-71234567-8";

export default function ComprarPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [cat, setCat]         = useState<string>(searchParams.get("cat") || "conexion");
  const [sel, setSel]         = useState<string | null>(null);
  const [popupMetodo, setPopupMetodo] = useState(false);
  const [metodo, setMetodo]   = useState<string | null>(null);
  const [copiado, setCopiado] = useState<string | null>(null);

  const productos = PRODUCTOS[cat as keyof typeof PRODUCTOS] || [];
  const producto  = [...Object.values(PRODUCTOS).flat()].find(p => p.id === sel);

  const copiar = (texto: string, key: string) => {
    navigator.clipboard.writeText(texto);
    setCopiado(key);
    setTimeout(() => setCopiado(null), 2000);
  };

  const abrirPago = () => { setPopupMetodo(true); setMetodo(null); };
  const cerrarPago = () => { setPopupMetodo(false); setMetodo(null); };

  return (
    <main style={{ paddingTop:"95px", paddingBottom:"130px", background:"#f4f4f2", minHeight:"100vh", fontFamily:"'Nunito',sans-serif" }}>
      <Header />

      <div style={{ padding:"16px", maxWidth:"480px", margin:"0 auto" }}>

        {/* ── HERO ── */}
        <div style={{ background:"linear-gradient(135deg,#1a2a3a,#243b55)", borderRadius:"20px", padding:"20px", textAlign:"center", marginBottom:"20px", position:"relative", overflow:"hidden" }}>
          <div style={{ position:"absolute", top:"-20px", right:"-20px", width:"100px", height:"100px", borderRadius:"50%", background:"rgba(212,160,23,0.08)" }} />
          <div style={{ fontSize:"36px", marginBottom:"6px" }}>⚡</div>
          <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"28px", color:"#f0c040", letterSpacing:"2px", marginBottom:"4px" }}>NexoNet Store</div>
          <div style={{ fontSize:"12px", color:"#8a9aaa", fontWeight:600 }}>1 BIT = $1 ARS · Sin vencimiento salvo que se indique</div>
        </div>

        {/* ── TABS CATEGORÍA ── */}
        <div style={{ display:"flex", gap:"8px", marginBottom:"16px", overflowX:"auto", paddingBottom:"4px" }}>
          {CATEGORIAS.map(c => (
            <button key={c.id} onClick={()=>{ setCat(c.id); setSel(null); }}
              style={{ flexShrink:0, background: cat===c.id ? "linear-gradient(135deg,#1a2a3a,#243b55)" : "#fff", border: cat===c.id ? "2px solid #d4a017" : "2px solid transparent", borderRadius:"20px", padding:"8px 16px", fontSize:"12px", fontWeight:900, color: cat===c.id ? "#f0c040" : "#666", cursor:"pointer", display:"flex", alignItems:"center", gap:"6px", boxShadow:"0 2px 6px rgba(0,0,0,0.08)" }}>
              {c.emoji} {c.label}
            </button>
          ))}
        </div>

        {/* ── PRODUCTOS ── */}
        <div style={{ display:"flex", flexDirection:"column", gap:"10px", marginBottom:"20px" }}>
          {productos.map((p: any) => {
            const activo = sel === p.id;
            return (
              <button key={p.id} onClick={()=>setSel(p.id)}
                style={{ display:"flex", alignItems:"center", justifyContent:"space-between", background: activo ? "linear-gradient(135deg,#1a2a3a,#243b55)" : "#fff", border: activo ? "2px solid #d4a017" : "2px solid transparent", borderRadius:"16px", padding:"14px 16px", cursor:"pointer", boxShadow: activo ? "0 4px 20px rgba(212,160,23,0.2)" : "0 2px 8px rgba(0,0,0,0.06)", transition:"all 0.15s", width:"100%", textAlign:"left", position:"relative", transform: activo ? "scale(1.01)" : "scale(1)" }}>

                {p.badge && (
                  <div style={{ position:"absolute", top:"-9px", right:"16px", background: p.badge==="EMPRESA"?"linear-gradient(135deg,#8e44ad,#6a2a8a)": p.badge==="TOP"||p.badge==="MÁXIMO"?"linear-gradient(135deg,#e74c3c,#c0392b)":"linear-gradient(135deg,#27ae60,#1a7a40)", borderRadius:"20px", padding:"2px 10px", fontSize:"9px", fontWeight:900, color:"#fff", whiteSpace:"nowrap" }}>
                    {p.badge}
                  </div>
                )}

                <div style={{ display:"flex", alignItems:"center", gap:"12px" }}>
                  <div style={{ width:"44px", height:"44px", borderRadius:"12px", background: activo ? "rgba(212,160,23,0.15)" : "#f4f4f2", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"22px", flexShrink:0 }}>
                    {p.emoji}
                  </div>
                  <div>
                    <div style={{ fontWeight:900, fontSize:"15px", color: activo ? "#f0c040" : "#1a2a3a", lineHeight:1.2 }}>{p.label}</div>
                    <div style={{ fontSize:"11px", color: activo ? "#8a9aaa" : "#9a9a9a", fontWeight:600, marginTop:"3px" }}>{p.desc}</div>
                    {p.duracion && <div style={{ fontSize:"10px", color: activo ? "#d4a017" : "#bbb", fontWeight:800, marginTop:"2px" }}>⏱ {p.duracion}</div>}
                  </div>
                </div>

                <div style={{ textAlign:"right", flexShrink:0 }}>
                  <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"22px", color: activo ? "#f0c040" : "#1a2a3a", lineHeight:1 }}>
                    ${p.precio.toLocaleString("es-AR")}
                  </div>
                  <div style={{ fontSize:"10px", color: activo ? "#8a9aaa" : "#bbb", fontWeight:700 }}>ARS</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* ── RESUMEN + BOTÓN ── */}
        {producto && (
          <>
            <div style={{ background:"#fff", borderRadius:"16px", padding:"14px 16px", marginBottom:"12px", boxShadow:"0 2px 8px rgba(0,0,0,0.06)" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"8px" }}>
                <span style={{ fontSize:"12px", fontWeight:700, color:"#888" }}>Seleccionado</span>
                <span style={{ fontSize:"13px", fontWeight:900, color:"#1a2a3a" }}>{producto.emoji} {producto.label}</span>
              </div>
              {producto.duracion && (
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"8px" }}>
                  <span style={{ fontSize:"12px", fontWeight:700, color:"#888" }}>Vigencia</span>
                  <span style={{ fontSize:"12px", fontWeight:800, color:"#d4a017" }}>⏱ {producto.duracion}</span>
                </div>
              )}
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", paddingTop:"8px", borderTop:"1px solid #f0f0f0" }}>
                <span style={{ fontSize:"14px", fontWeight:800, color:"#1a2a3a" }}>Total</span>
                <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"24px", color:"#d4a017" }}>${producto.precio.toLocaleString("es-AR")} ARS</span>
              </div>
            </div>

            <button onClick={abrirPago}
              style={{ width:"100%", background:"linear-gradient(135deg,#f0c040,#d4a017)", border:"none", borderRadius:"14px", padding:"16px", fontSize:"16px", fontWeight:900, color:"#1a2a3a", cursor:"pointer", fontFamily:"'Nunito',sans-serif", boxShadow:"0 5px 0 #a07810", marginBottom:"20px" }}>
              ⚡ Continuar con el pago
            </button>
          </>
        )}
      </div>

      {/* ══ POPUP: ELEGIR MÉTODO ══ */}
      {popupMetodo && producto && !metodo && (
        <div style={{ position:"fixed", inset:0, zIndex:200, background:"rgba(0,0,0,0.7)", display:"flex", alignItems:"flex-end", padding:"16px" }}>
          <div style={{ width:"100%", background:"#fff", borderRadius:"20px 20px 16px 16px", padding:"24px 20px 20px", boxShadow:"0 -8px 40px rgba(0,0,0,0.3)" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"6px" }}>
              <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"22px", color:"#1a2a3a", letterSpacing:"1px" }}>💳 Método de pago</div>
              <button onClick={cerrarPago} style={{ background:"#f0f0f0", border:"none", borderRadius:"50%", width:"32px", height:"32px", fontSize:"16px", cursor:"pointer" }}>✕</button>
            </div>
            <div style={{ fontSize:"12px", color:"#9a9a9a", fontWeight:600, marginBottom:"20px" }}>
              {producto.emoji} {producto.label} · ${producto.precio.toLocaleString()} ARS
            </div>

            <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
              <button onClick={()=>setMetodo("transferencia")}
                style={{ display:"flex", alignItems:"center", gap:"14px", background:"#f8f8f8", border:"2px solid #e8e8e8", borderRadius:"14px", padding:"14px 16px", cursor:"pointer", width:"100%", textAlign:"left" }}>
                <div style={{ width:"44px", height:"44px", borderRadius:"12px", background:"linear-gradient(135deg,#1a2a3a,#243b55)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"20px", flexShrink:0 }}>🏦</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:"14px", fontWeight:900, color:"#1a2a3a" }}>Transferencia bancaria</div>
                  <div style={{ fontSize:"11px", color:"#27ae60", fontWeight:700, marginTop:"1px" }}>✓ Disponible · Acreditación en 24hs</div>
                </div>
                <span style={{ fontSize:"20px", color:"#d4a017" }}>›</span>
              </button>

              <button onClick={()=>setMetodo("mp")}
                style={{ display:"flex", alignItems:"center", gap:"14px", background:"#f8f8f8", border:"2px solid #e8e8e8", borderRadius:"14px", padding:"14px 16px", cursor:"pointer", width:"100%", textAlign:"left", opacity:0.65 }}>
                <div style={{ width:"44px", height:"44px", borderRadius:"12px", background:"linear-gradient(135deg,#009ee3,#007bbd)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"20px", flexShrink:0 }}>🔵</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:"14px", fontWeight:900, color:"#1a2a3a" }}>MercadoPago</div>
                  <div style={{ fontSize:"11px", color:"#9a9a9a", fontWeight:700, marginTop:"1px" }}>🔒 Próximamente</div>
                </div>
                <span style={{ fontSize:"20px", color:"#ccc" }}>›</span>
              </button>

              <button onClick={()=>setMetodo("tarjeta")}
                style={{ display:"flex", alignItems:"center", gap:"14px", background:"#f8f8f8", border:"2px solid #e8e8e8", borderRadius:"14px", padding:"14px 16px", cursor:"pointer", width:"100%", textAlign:"left", opacity:0.65 }}>
                <div style={{ width:"44px", height:"44px", borderRadius:"12px", background:"linear-gradient(135deg,#e74c3c,#c0392b)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"20px", flexShrink:0 }}>💳</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:"14px", fontWeight:900, color:"#1a2a3a" }}>Tarjeta de crédito / débito</div>
                  <div style={{ fontSize:"11px", color:"#9a9a9a", fontWeight:700, marginTop:"1px" }}>🔒 Próximamente</div>
                </div>
                <span style={{ fontSize:"20px", color:"#ccc" }}>›</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ POPUP: PRÓXIMAMENTE ══ */}
      {popupMetodo && producto && (metodo === "mp" || metodo === "tarjeta") && (
        <div style={{ position:"fixed", inset:0, zIndex:200, background:"rgba(0,0,0,0.7)", display:"flex", alignItems:"center", justifyContent:"center", padding:"24px" }}>
          <div style={{ background:"#fff", borderRadius:"20px", padding:"32px 24px", textAlign:"center", maxWidth:"340px", width:"100%", boxShadow:"0 8px 40px rgba(0,0,0,0.3)" }}>
            <div style={{ fontSize:"48px", marginBottom:"12px" }}>🔒</div>
            <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"24px", color:"#1a2a3a", letterSpacing:"1px", marginBottom:"8px" }}>
              {metodo === "mp" ? "MercadoPago" : "Tarjeta"} — Próximamente
            </div>
            <div style={{ fontSize:"13px", color:"#9a9a9a", fontWeight:600, lineHeight:1.7, marginBottom:"24px" }}>
              Estamos integrando este método.<br/>
              Por ahora podés abonar por <strong style={{ color:"#1a2a3a" }}>transferencia bancaria</strong> y tus BIT se acreditan en menos de 24hs.
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
              <button onClick={()=>setMetodo("transferencia")}
                style={{ background:"linear-gradient(135deg,#f0c040,#d4a017)", border:"none", borderRadius:"12px", padding:"14px", fontSize:"14px", fontWeight:900, color:"#1a2a3a", cursor:"pointer", fontFamily:"'Nunito',sans-serif", boxShadow:"0 4px 0 #a07810" }}>
                🏦 Pagar por transferencia
              </button>
              <button onClick={()=>setMetodo(null)}
                style={{ background:"#f0f0f0", border:"none", borderRadius:"12px", padding:"12px", fontSize:"13px", fontWeight:800, color:"#666", cursor:"pointer" }}>
                ‹ Volver a métodos
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ POPUP: TRANSFERENCIA ══ */}
      {popupMetodo && producto && metodo === "transferencia" && (
        <div style={{ position:"fixed", inset:0, zIndex:200, background:"rgba(0,0,0,0.7)", display:"flex", alignItems:"flex-end", padding:"16px" }}>
          <div style={{ width:"100%", background:"#fff", borderRadius:"20px 20px 16px 16px", padding:"24px 20px 20px", boxShadow:"0 -8px 40px rgba(0,0,0,0.3)", maxHeight:"90vh", overflowY:"auto" }}>

            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"16px" }}>
              <div>
                <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"22px", color:"#1a2a3a", letterSpacing:"1px" }}>🏦 Datos de transferencia</div>
                <div style={{ fontSize:"12px", color:"#9a9a9a", fontWeight:600 }}>{producto.emoji} {producto.label} · ${producto.precio.toLocaleString()} ARS</div>
              </div>
              <button onClick={cerrarPago} style={{ background:"#f0f0f0", border:"none", borderRadius:"50%", width:"32px", height:"32px", fontSize:"16px", cursor:"pointer" }}>✕</button>
            </div>

            {/* Monto */}
            <div style={{ background:"linear-gradient(135deg,#1a2a3a,#243b55)", borderRadius:"16px", padding:"16px", textAlign:"center", marginBottom:"14px" }}>
              <div style={{ fontSize:"11px", color:"#8a9aaa", fontWeight:700, marginBottom:"4px" }}>TOTAL A TRANSFERIR</div>
              <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"42px", color:"#f0c040", letterSpacing:"2px", lineHeight:1 }}>${producto.precio.toLocaleString("es-AR")}</div>
              <div style={{ fontSize:"11px", color:"#8a9aaa", fontWeight:600, marginTop:"4px" }}>ARS{producto.duracion ? ` · vigencia ${producto.duracion}` : ""}</div>
            </div>

            {/* Datos bancarios */}
            <div style={{ display:"flex", flexDirection:"column", gap:"8px", marginBottom:"14px" }}>
              {[{ label:"Alias", valor:ALIAS },{ label:"CBU", valor:CBU },{ label:"Titular", valor:TITULAR },{ label:"CUIT", valor:CUIT }].map(d => (
                <div key={d.label} style={{ background:"#f8f8f8", borderRadius:"12px", padding:"10px 14px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                  <div>
                    <div style={{ fontSize:"10px", fontWeight:800, color:"#9a9a9a", textTransform:"uppercase", letterSpacing:"0.5px" }}>{d.label}</div>
                    <div style={{ fontSize:"13px", fontWeight:800, color:"#1a2a3a", marginTop:"1px", fontFamily:d.label==="CBU"?"monospace":"inherit" }}>{d.valor}</div>
                  </div>
                  <button onClick={()=>copiar(d.valor, d.label)}
                    style={{ background:copiado===d.label?"#e8f8ee":"#fff", border:`1px solid ${copiado===d.label?"#27ae60":"#e8e8e8"}`, borderRadius:"8px", padding:"5px 10px", fontSize:"11px", fontWeight:800, color:copiado===d.label?"#27ae60":"#666", cursor:"pointer", flexShrink:0 }}>
                    {copiado===d.label?"✓ Copiado":"Copiar"}
                  </button>
                </div>
              ))}
            </div>

            {/* Instrucciones */}
            <div style={{ background:"#fff8e0", borderRadius:"12px", padding:"12px 14px", marginBottom:"14px", border:"1px solid #f0e0a0" }}>
              <div style={{ fontSize:"11px", fontWeight:800, color:"#a07810", marginBottom:"6px" }}>📋 Instrucciones</div>
              <ol style={{ margin:0, paddingLeft:"16px", fontSize:"12px", color:"#666", fontWeight:600, lineHeight:2 }}>
                <li>Transferí el monto exacto</li>
                <li>Guardá el comprobante</li>
                <li>Envialo por WhatsApp o email</li>
                <li>Tus BIT se acreditan en menos de 24hs</li>
              </ol>
            </div>

            {/* Enviar comprobante */}
            <a href={`https://wa.me/5493492000000?text=Hola! Hice una transferencia de $${producto.precio} por ${producto.label}. Te adjunto el comprobante.`}
              target="_blank" rel="noopener noreferrer"
              style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:"8px", background:"#25D366", borderRadius:"12px", padding:"13px", fontSize:"13px", fontWeight:900, color:"#fff", textDecoration:"none", marginBottom:"8px" }}>
              💬 Enviar comprobante por WhatsApp
            </a>
            <a href={`mailto:pagos@nexonet.ar?subject=Comprobante ${producto.label} - $${producto.precio} ARS`}
              style={{ display:"block", background:"#f0f0f0", borderRadius:"12px", padding:"12px", fontSize:"13px", fontWeight:800, color:"#666", textAlign:"center", textDecoration:"none" }}>
              📧 Enviar por email — pagos@nexonet.ar
            </a>
          </div>
        </div>
      )}

      <BottomNav />
    </main>
  );
}
