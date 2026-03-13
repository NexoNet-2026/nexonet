"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/lib/supabase";

const PAQUETES = [
  { id:"bit_500",    bits:500,    precio:500,   bonus:0,    popular:false, emoji:"⚡" },
  { id:"bit_1500",   bits:1500,   precio:1500,  bonus:100,  popular:false, emoji:"🔋" },
  { id:"bit_3000",   bits:3000,   precio:3000,  bonus:300,  popular:true,  emoji:"💡" },
  { id:"bit_6000",   bits:6000,   precio:6000,  bonus:800,  popular:false, emoji:"🚀" },
  { id:"bit_12000",  bits:12000,  precio:12000, bonus:2000, popular:false, emoji:"💎" },
  { id:"bit_30000",  bits:30000,  precio:30000, bonus:6000, popular:false, emoji:"🌟" },
];

const USO_BIT = [
  { emoji:"📋", accion:"Publicar anuncio",              costo:"Gratis (100 BIT incluidos)" },
  { emoji:"🔗", accion:"Conectarse con un anuncio",    costo:"100 BIT del saldo del anuncio" },
  { emoji:"🔍", accion:"Búsqueda automática (match)",  costo:"1 BIT por match recibido" },
  { emoji:"👥", accion:"Ingresar a grupo de pago",     costo:"500 BIT" },
  { emoji:"🔗", accion:"Habilitar link en anuncio",    costo:"200 BIT / mes" },
  { emoji:"📎", accion:"Habilitar adjuntos en anuncio",costo:"300 BIT / mes" },
];

export default function Tienda() {
  const router  = useRouter();
  const [perfil,    setPerfil]    = useState<any>(null);
  const [cargando,  setCargando]  = useState(true);
  const [procesando,setProcesando]= useState<string|null>(null);
  const [tab,       setTab]       = useState<"comprar"|"historial"|"uso">("comprar");
  const [pagos,     setPagos]     = useState<any[]>([]);

  const bitsNexo  = Math.max(0, perfil?.bits        || 0);
  const bitsFree  = Math.max(0, perfil?.bits_free   || 0);
  const bitsPromo = Math.max(0, perfil?.bits_promo  || 0);
  const bitsTotal = bitsNexo + bitsFree + bitsPromo;

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data:{ session } }) => {
      if (!session) { router.push("/login"); return; }
      const { data: u } = await supabase.from("usuarios").select("*").eq("id", session.user.id).single();
      setPerfil(u);
      const { data: ps } = await supabase.from("pagos_mp")
        .select("*").eq("usuario_id", session.user.id)
        .order("created_at", { ascending: false }).limit(30);
      setPagos(ps || []);
      setCargando(false);
    });
  }, []);

  const comprar = async (paquete: typeof PAQUETES[0]) => {
    if (!perfil || procesando) return;
    setProcesando(paquete.id);
    try {
      const res = await fetch("/api/mp/crear-preferencia", {
        method: "POST",
        headers: { "Content-Type":"application/json" },
        body: JSON.stringify({
          titulo:      `${paquete.bits + paquete.bonus} BIT NexoNet`,
          monto:       paquete.precio,
          usuario_id:  perfil.id,
          paquete_id:  paquete.id,
          bits_nexo:   paquete.bits,
          bits_bonus:  paquete.bonus,
        }),
      });
      const data = await res.json();
      if (data.init_point) window.location.href = data.init_point;
      else throw new Error("Sin init_point");
    } catch (e) {
      alert("Error al iniciar el pago. Intentá de nuevo.");
    } finally {
      setProcesando(null);
    }
  };

  if (cargando) return (
    <main style={{ paddingTop:"80px", textAlign:"center", color:"#9a9a9a", fontFamily:"'Nunito',sans-serif" }}>Cargando...</main>
  );

  return (
    <main style={{ paddingTop:"0", paddingBottom:"100px", background:"#f4f4f2", minHeight:"100vh", fontFamily:"'Nunito',sans-serif" }}>
      <Header />

      {/* HERO */}
      <div style={{ background:"linear-gradient(135deg,#1a2a3a 0%,#243b55 100%)", paddingTop:"80px", paddingBottom:"0" }}>
        <div style={{ padding:"20px 16px 0" }}>
          <div style={{ display:"flex", alignItems:"center", gap:"14px", marginBottom:"20px" }}>
            <div style={{ width:"56px", height:"56px", borderRadius:"16px", background:"rgba(212,160,23,0.2)", border:"2px solid #d4a017", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"28px" }}>💰</div>
            <div>
              <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"26px", color:"#fff", letterSpacing:"1px", lineHeight:1 }}>Tienda NexoNet</div>
              <div style={{ fontSize:"12px", color:"#8a9aaa", fontWeight:600 }}>Cargá BIT y usalo en todo</div>
            </div>
          </div>

          {/* SALDO */}
          <div style={{ background:"rgba(255,255,255,0.06)", borderRadius:"18px", padding:"18px", marginBottom:"0", border:"1px solid rgba(212,160,23,0.2)" }}>
            <div style={{ fontSize:"10px", fontWeight:800, color:"#8a9aaa", textTransform:"uppercase", letterSpacing:"1px", marginBottom:"12px" }}>Tu saldo actual</div>
            <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"52px", color:"#f0c040", letterSpacing:"2px", lineHeight:1, marginBottom:"4px" }}>
              {bitsTotal.toLocaleString()}
              <span style={{ fontSize:"22px", color:"#d4a017", marginLeft:"8px" }}>BIT</span>
            </div>
            <div style={{ display:"flex", gap:"12px", marginTop:"12px" }}>
              <SaldoPill label="Nexo" valor={bitsNexo}  color="#d4a017" />
              <SaldoPill label="Free" valor={bitsFree}  color="#2980b9" />
              <SaldoPill label="Promo" valor={bitsPromo} color="#27ae60" />
            </div>
          </div>
        </div>

        {/* TABS */}
        <div style={{ display:"flex", marginTop:"16px", borderBottom:"none" }}>
          {([["comprar","🛒 Comprar"],["uso","📖 Qué hace cada BIT"],["historial","📋 Historial"]] as [typeof tab, string][]).map(([k,l]) => (
            <button key={k} onClick={()=>setTab(k)}
              style={{ flex:1, background:"none", border:"none", borderBottom: tab===k ? "3px solid #d4a017" : "3px solid transparent",
                       padding:"12px 6px", color: tab===k ? "#d4a017" : "rgba(255,255,255,0.5)",
                       fontSize:"12px", fontWeight:800, cursor:"pointer", fontFamily:"'Nunito',sans-serif",
                       textTransform:"uppercase", letterSpacing:"0.5px" }}>
              {l}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding:"16px", maxWidth:"480px", margin:"0 auto" }}>

        {/* ── COMPRAR ── */}
        {tab === "comprar" && (
          <div style={{ display:"flex", flexDirection:"column", gap:"12px" }}>
            <div style={{ background:"rgba(212,160,23,0.08)", border:"2px dashed rgba(212,160,23,0.3)", borderRadius:"14px", padding:"14px 16px" }}>
              <div style={{ fontSize:"12px", fontWeight:800, color:"#d4a017", marginBottom:"4px" }}>💡 Un solo tipo de BIT para todo</div>
              <div style={{ fontSize:"12px", color:"#9a9a9a", fontWeight:600, lineHeight:1.6 }}>
                Cargás BIT y los usás en lo que quieras: anuncios, conexiones, búsquedas, grupos, links o adjuntos. Simple.
              </div>
            </div>

            {PAQUETES.map(p => {
              const totalBits = p.bits + p.bonus;
              const isProcesando = procesando === p.id;
              return (
                <div key={p.id}
                  style={{ background:"#fff", borderRadius:"18px", padding:"18px", boxShadow: p.popular ? "0 4px 20px rgba(212,160,23,0.2)" : "0 2px 10px rgba(0,0,0,0.06)", border: p.popular ? "2px solid #d4a017" : "2px solid transparent", position:"relative", overflow:"hidden" }}>
                  {p.popular && (
                    <div style={{ position:"absolute", top:"0", right:"0", background:"linear-gradient(135deg,#f0c040,#d4a017)", color:"#1a2a3a", fontSize:"10px", fontWeight:900, padding:"5px 14px", borderRadius:"0 16px 0 12px", letterSpacing:"0.5px" }}>
                      MÁS POPULAR
                    </div>
                  )}
                  <div style={{ display:"flex", alignItems:"center", gap:"14px" }}>
                    <div style={{ width:"52px", height:"52px", borderRadius:"14px", background: p.popular ? "linear-gradient(135deg,#f0c040,#d4a017)" : "rgba(212,160,23,0.1)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"26px", flexShrink:0 }}>
                      {p.emoji}
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ display:"flex", alignItems:"baseline", gap:"8px", flexWrap:"wrap" }}>
                        <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"32px", color:"#1a2a3a", letterSpacing:"1px" }}>{p.bits.toLocaleString()}</span>
                        <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"18px", color:"#d4a017" }}>BIT</span>
                        {p.bonus > 0 && (
                          <span style={{ background:"#e8f8ee", border:"1px solid rgba(39,174,96,0.3)", borderRadius:"8px", padding:"2px 8px", fontSize:"11px", fontWeight:900, color:"#27ae60" }}>
                            +{p.bonus.toLocaleString()} BONUS
                          </span>
                        )}
                      </div>
                      {p.bonus > 0 && (
                        <div style={{ fontSize:"11px", color:"#9a9a9a", fontWeight:600 }}>
                          Total: <strong style={{ color:"#1a2a3a" }}>{totalBits.toLocaleString()} BIT</strong>
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign:"right", flexShrink:0 }}>
                      <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"24px", color: p.popular ? "#d4a017" : "#1a2a3a", letterSpacing:"1px" }}>
                        ${p.precio.toLocaleString()}
                      </div>
                      <div style={{ fontSize:"10px", color:"#9a9a9a", fontWeight:600 }}>ARS</div>
                    </div>
                  </div>

                  <button onClick={()=>comprar(p)} disabled={!!procesando}
                    style={{ width:"100%", marginTop:"14px", background: p.popular
                               ? "linear-gradient(135deg,#f0c040,#d4a017)"
                               : "linear-gradient(135deg,#1a2a3a,#243b55)",
                               border:"none", borderRadius:"12px", padding:"13px",
                               fontSize:"14px", fontWeight:900,
                               color: p.popular ? "#1a2a3a" : "#fff",
                               cursor: procesando ? "not-allowed" : "pointer",
                               fontFamily:"'Nunito',sans-serif",
                               boxShadow: p.popular ? "0 4px 0 #a07810" : "0 4px 0 #0d1f30",
                               opacity: procesando && !isProcesando ? 0.6 : 1 }}>
                    {isProcesando ? "⏳ Procesando..." : `💳 Comprar ${totalBits.toLocaleString()} BIT`}
                  </button>
                </div>
              );
            })}

            <div style={{ background:"#fff", borderRadius:"14px", padding:"14px 16px", display:"flex", gap:"12px", alignItems:"flex-start" }}>
              <span style={{ fontSize:"22px", flexShrink:0 }}>🔒</span>
              <div>
                <div style={{ fontSize:"12px", fontWeight:900, color:"#1a2a3a", marginBottom:"3px" }}>Pago seguro con MercadoPago</div>
                <div style={{ fontSize:"11px", color:"#9a9a9a", fontWeight:600, lineHeight:1.5 }}>
                  Tarjeta de crédito, débito, transferencia, QR o efectivo. Los BIT se acreditan automáticamente al confirmar el pago.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── QUÉ HACE CADA BIT ── */}
        {tab === "uso" && (
          <div style={{ display:"flex", flexDirection:"column", gap:"12px" }}>
            <div style={{ background:"#fff", borderRadius:"16px", padding:"18px" }}>
              <div style={{ fontSize:"12px", fontWeight:900, color:"#9a9a9a", textTransform:"uppercase", letterSpacing:"1px", marginBottom:"16px" }}>💡 ¿Para qué sirven los BIT?</div>
              {USO_BIT.map((u, i) => (
                <div key={i} style={{ display:"flex", alignItems:"center", gap:"12px", padding:"12px 0", borderBottom: i < USO_BIT.length-1 ? "1px solid #f4f4f2" : "none" }}>
                  <div style={{ width:"40px", height:"40px", borderRadius:"12px", background:"rgba(212,160,23,0.1)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"20px", flexShrink:0 }}>{u.emoji}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:"13px", fontWeight:900, color:"#1a2a3a" }}>{u.accion}</div>
                    <div style={{ fontSize:"11px", color:"#9a9a9a", fontWeight:600 }}>{u.costo}</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ background:"linear-gradient(135deg,#1a2a3a,#243b55)", borderRadius:"16px", padding:"18px" }}>
              <div style={{ fontSize:"12px", fontWeight:900, color:"#d4a017", textTransform:"uppercase", letterSpacing:"1px", marginBottom:"14px" }}>🏦 Los 3 tipos de BIT</div>
              {[
                { color:"#d4a017", bg:"rgba(212,160,23,0.15)", emoji:"💛", nombre:"BIT Nexo", desc:"Lo comprás vos. Se usa para todo.", extra:"" },
                { color:"#2980b9", bg:"rgba(41,128,185,0.15)",  emoji:"💙", nombre:"BIT Free", desc:"Lo acredita el sistema. Funciona igual que el Nexo.", extra:"Respaldo legal de consumo gratuito" },
                { color:"#27ae60", bg:"rgba(39,174,96,0.15)",   emoji:"💚", nombre:"BIT Promotor", desc:"Lo ganás por referidos. Se usa para todo.", extra:"Reembolsable en pesos contra factura" },
              ].map(t => (
                <div key={t.nombre} style={{ background:t.bg, borderRadius:"12px", padding:"14px", marginBottom:"8px", border:`1px solid ${t.color}30`, display:"flex", gap:"12px", alignItems:"flex-start" }}>
                  <span style={{ fontSize:"24px" }}>{t.emoji}</span>
                  <div>
                    <div style={{ fontSize:"13px", fontWeight:900, color:t.color, marginBottom:"3px" }}>{t.nombre}</div>
                    <div style={{ fontSize:"12px", color:"rgba(255,255,255,0.65)", fontWeight:600 }}>{t.desc}</div>
                    {t.extra && <div style={{ fontSize:"10px", color:t.color, fontWeight:800, marginTop:"4px" }}>✦ {t.extra}</div>}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ background:"#fff", borderRadius:"16px", padding:"18px" }}>
              <div style={{ fontSize:"12px", fontWeight:900, color:"#9a9a9a", textTransform:"uppercase", letterSpacing:"1px", marginBottom:"14px" }}>📊 Orden de consumo</div>
              <div style={{ fontSize:"13px", color:"#2c2c2e", fontWeight:600, lineHeight:1.8 }}>
                Cuando usás BIT, el sistema descuenta primero del <strong style={{ color:"#27ae60" }}>BIT Promotor</strong>, luego del <strong style={{ color:"#d4a017" }}>BIT Nexo</strong>, y por último del <strong style={{ color:"#2980b9" }}>BIT Free</strong>.
              </div>
            </div>
          </div>
        )}

        {/* ── HISTORIAL ── */}
        {tab === "historial" && (
          <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
            {pagos.length === 0 ? (
              <div style={{ textAlign:"center", padding:"50px 20px", background:"#fff", borderRadius:"16px" }}>
                <div style={{ fontSize:"48px", marginBottom:"12px" }}>📋</div>
                <div style={{ fontSize:"16px", fontWeight:900, color:"#1a2a3a", marginBottom:"6px" }}>Sin compras todavía</div>
                <div style={{ fontSize:"13px", color:"#9a9a9a", fontWeight:600 }}>Tus compras de BIT aparecerán acá</div>
              </div>
            ) : pagos.map(p => (
              <div key={p.id} style={{ background:"#fff", borderRadius:"14px", padding:"14px 16px", display:"flex", alignItems:"center", gap:"12px" }}>
                <div style={{ width:"44px", height:"44px", borderRadius:"12px",
                               background: p.estado==="approved" ? "rgba(39,174,96,0.1)" : p.estado==="pending" ? "rgba(212,160,23,0.1)" : "rgba(231,76,60,0.1)",
                               display:"flex", alignItems:"center", justifyContent:"center", fontSize:"22px", flexShrink:0 }}>
                  {p.estado==="approved"?"✅":p.estado==="pending"?"⏳":"❌"}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:"13px", fontWeight:900, color:"#1a2a3a" }}>
                    {p.bits_acreditados ? `${p.bits_acreditados.toLocaleString()} BIT` : p.descripcion || "Compra BIT"}
                  </div>
                  <div style={{ fontSize:"11px", color:"#9a9a9a", fontWeight:600 }}>
                    {new Date(p.created_at).toLocaleString("es-AR",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"})}
                  </div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"20px", color:"#1a2a3a" }}>
                    ${(p.monto||0).toLocaleString()}
                  </div>
                  <div style={{ fontSize:"10px", fontWeight:800, padding:"2px 8px", borderRadius:"20px",
                                 background: p.estado==="approved"?"#e8f8ee":p.estado==="pending"?"#fff8e0":"#fef0ef",
                                 color: p.estado==="approved"?"#27ae60":p.estado==="pending"?"#d4a017":"#e74c3c" }}>
                    {p.estado==="approved"?"Acreditado":p.estado==="pending"?"Pendiente":"Rechazado"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </main>
  );
}

function SaldoPill({ label, valor, color }: { label:string; valor:number; color:string }) {
  return (
    <div style={{ flex:1, background:`${color}18`, borderRadius:"10px", padding:"8px 10px", border:`1px solid ${color}30`, textAlign:"center" }}>
      <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"18px", color, letterSpacing:"1px" }}>{valor.toLocaleString()}</div>
      <div style={{ fontSize:"9px", fontWeight:800, color:"rgba(255,255,255,0.5)", textTransform:"uppercase", letterSpacing:"0.5px" }}>{label}</div>
    </div>
  );
}
