"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/lib/supabase";

type Comision = {
  id: string;
  origen_id: string;
  monto_origen: number;
  monto_comision: number;
  nivel: number;
  concepto: string;
  created_at: string;
  origen?: { nombre: string; codigo_nexo: string };
};

type Referido = {
  id: string;
  nombre: string;
  codigo_nexo: string;
  es_promotor: boolean;
  bits_promotor_total: number;
  created_at: string;
  total_referidos: number;
};

type Liquidacion = {
  id: string;
  monto_bits: number;
  estado: string;
  created_at: string;
};

const TABS = ["inicio", "referidos", "comisiones", "liquidar"] as const;
type Tab = (typeof TABS)[number];

export default function PromoterPage() {
  const router = useRouter();
  const [session,      setSession]      = useState<any>(null);
  const [perfil,       setPerfil]       = useState<any>(null);
  const [tab,          setTab]          = useState<Tab>("inicio");
  const [comisiones,   setComisiones]   = useState<Comision[]>([]);
  const [referidos,    setReferidos]    = useState<Referido[]>([]);
  const [liquidaciones,setLiquidaciones]= useState<Liquidacion[]>([]);
  const [cargando,     setCargando]     = useState(true);
  const [copiado,      setCopiado]      = useState(false);
  const [solicitando,  setSolicitando]  = useState(false);
  const [facturaUrl,   setFacturaUrl]   = useState("");
  const [popupLiquidar,setPopupLiquidar]= useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session: s } }) => {
      if (!s) { router.push("/login"); return; }
      setSession(s);
      const { data: u } = await supabase
        .from("usuarios")
        .select("*")
        .eq("id", s.user.id)
        .single();
      setPerfil(u);

      const [{ data: coms }, { data: refs }, { data: liqs }] = await Promise.all([
        supabase.from("comisiones_promotor")
          .select("*, origen:origen_id(nombre, codigo_nexo)")
          .eq("promotor_id", s.user.id)
          .order("created_at", { ascending: false })
          .limit(50),
        supabase.from("usuarios")
          .select("id, nombre, codigo_nexo, es_promotor, bits_promotor_total, created_at, total_referidos")
          .eq("referido_por", s.user.id)
          .order("created_at", { ascending: false }),
        supabase.from("liquidaciones_promotor")
          .select("*")
          .eq("promotor_id", s.user.id)
          .order("created_at", { ascending: false }),
      ]);

      setComisiones((coms as any) || []);
      setReferidos((refs as any) || []);
      setLiquidaciones((liqs as any) || []);
      setCargando(false);
    });
  }, []);

  const linkReferido = perfil
    ? `https://nexonet.ar/registro?ref=${perfil.codigo_nexo}`
    : "";

  const copiarLink = () => {
    navigator.clipboard.writeText(linkReferido);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const compartirWhatsApp = () => {
    const texto = encodeURIComponent(
      `🔗 Registrate en NexoNet con mi código y empezá a conectarte con tu barrio.\n${linkReferido}`
    );
    window.open(`https://wa.me/?text=${texto}`, "_blank");
  };

  const solicitarLiquidacion = async () => {
    if (!perfil || (perfil.bits_promotor || 0) < 100) return;
    setSolicitando(true);
    await supabase.from("liquidaciones_promotor").insert({
      promotor_id: perfil.id,
      monto_bits:  perfil.bits_promotor,
      estado:      "pendiente",
      factura_url: facturaUrl || null,
    });
    await supabase.from("usuarios")
      .update({ bits_promotor: 0 })
      .eq("id", perfil.id);
    setPerfil((p: any) => ({ ...p, bits_promotor: 0 }));
    setPopupLiquidar(false);
    setSolicitando(false);
    setFacturaUrl("");
    // Recargar liquidaciones
    const { data } = await supabase.from("liquidaciones_promotor")
      .select("*").eq("promotor_id", perfil.id).order("created_at", { ascending: false });
    setLiquidaciones((data as any) || []);
  };

  if (cargando) return (
    <main style={{ paddingTop: "80px", fontFamily: "'Nunito',sans-serif", textAlign: "center", color: "#9a9a9a" }}>
      Cargando...
    </main>
  );

  const bitsPromotor   = perfil?.bits_promotor || 0;
  const puedeConvertir = bitsPromotor >= 100;
  const totalRefs      = perfil?.total_referidos || 0;
  const totalGanado    = perfil?.bits_promotor_total || 0;

  return (
    <main style={{ paddingTop: "80px", paddingBottom: "100px", fontFamily: "'Nunito',sans-serif", background: "#f4f4f2", minHeight: "100vh" }}>
      <Header />

      {/* HERO */}
      <div style={{ background: "linear-gradient(135deg,#1a2a3a,#243b55)", padding: "24px 20px 28px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "20px" }}>
          <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: "rgba(212,160,23,0.2)",
                         border: "2px solid #d4a017", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "26px" }}>
            ⭐
          </div>
          <div>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "22px", color: "#f0c040", letterSpacing: "1px" }}>
              NEXO PROMOTOR
            </div>
            <div style={{ fontSize: "12px", color: "#8a9aaa", fontWeight: 600 }}>
              {perfil?.nombre} · {perfil?.codigo_nexo}
            </div>
          </div>
          {perfil?.es_promotor && (
            <div style={{ marginLeft: "auto", background: "#d4a017", borderRadius: "20px",
                           padding: "4px 12px", fontSize: "11px", fontWeight: 900, color: "#1a2a3a" }}>
              🟠 ACTIVO
            </div>
          )}
        </div>

        {/* Stats fila */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
          <StatCard label="BIT Promotor" value={bitsPromotor.toLocaleString()} color="#d4a017" />
          <StatCard label="Referidos" value={totalRefs.toLocaleString()} color="#27ae60" />
          <StatCard label="Total ganado" value={totalGanado.toLocaleString()} color="#3a7bd5" />
        </div>
      </div>

      {/* TABS */}
      <div style={{ background: "#fff", borderBottom: "2px solid #e8e8e6", display: "flex",
                     overflowX: "auto", scrollbarWidth: "none" }}>
        {([
          { key: "inicio",     label: "🏠 Inicio" },
          { key: "referidos",  label: `👥 Referidos (${totalRefs})` },
          { key: "comisiones", label: "💰 Comisiones" },
          { key: "liquidar",   label: "💳 Cobrar" },
        ] as { key: Tab; label: string }[]).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{ padding: "14px 18px", border: "none", background: "none", cursor: "pointer",
                      fontFamily: "'Nunito',sans-serif", fontSize: "13px", fontWeight: 800,
                      color: tab === t.key ? "#d4a017" : "#666", whiteSpace: "nowrap",
                      borderBottom: tab === t.key ? "3px solid #d4a017" : "3px solid transparent",
                      flexShrink: 0 }}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ padding: "16px" }}>

        {/* ── TAB INICIO ──────────────────────────────────────────────── */}
        {tab === "inicio" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>

            {/* Cómo funciona */}
            <div style={{ background: "#fff", borderRadius: "16px", padding: "18px" }}>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "18px", color: "#1a2a3a",
                             letterSpacing: "1px", marginBottom: "14px" }}>
                ¿Cómo funciona?
              </div>
              {[
                { n: "1", t: "Compartí tu link", d: "Cualquiera que se registre con tu código te convierte en su Promotor." },
                { n: "2", t: "Ganás el 30%", d: "Cada vez que tu referido paga BIT Nexo, vos recibís el 30% de ese monto." },
                { n: "3", t: "Cadena infinita", d: "Si tu referido tiene sus propios referidos, vos ganás el 30% de lo que él gana." },
                { n: "4", t: "Convertí a dinero", d: "Con más de 100 BIT Promotor podés solicitar el pago contra factura." },
              ].map(item => (
                <div key={item.n} style={{ display: "flex", gap: "12px", marginBottom: "12px" }}>
                  <div style={{ width: "30px", height: "30px", borderRadius: "50%", background: "#d4a017",
                                 display: "flex", alignItems: "center", justifyContent: "center",
                                 fontSize: "13px", fontWeight: 900, color: "#1a2a3a", flexShrink: 0 }}>
                    {item.n}
                  </div>
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: 900, color: "#1a2a3a" }}>{item.t}</div>
                    <div style={{ fontSize: "12px", color: "#9a9a9a", fontWeight: 600 }}>{item.d}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Link de referido */}
            <div style={{ background: "#fff", borderRadius: "16px", padding: "18px" }}>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "18px", color: "#1a2a3a",
                             letterSpacing: "1px", marginBottom: "14px" }}>
                Tu link de referido
              </div>
              <div style={{ background: "#f4f4f2", borderRadius: "12px", padding: "12px 14px",
                             fontSize: "12px", fontWeight: 700, color: "#666",
                             wordBreak: "break-all", marginBottom: "12px", border: "1px dashed #d4a017" }}>
                {linkReferido}
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button onClick={copiarLink}
                  style={{ flex: 1, background: copiado ? "#27ae60" : "linear-gradient(135deg,#f0c040,#d4a017)",
                             border: "none", borderRadius: "12px", padding: "13px",
                             fontSize: "14px", fontWeight: 900, color: "#1a2a3a", cursor: "pointer",
                             fontFamily: "'Nunito',sans-serif", boxShadow: "0 3px 0 #a07810" }}>
                  {copiado ? "✅ Copiado!" : "📋 Copiar link"}
                </button>
                <button onClick={compartirWhatsApp}
                  style={{ flex: 1, background: "linear-gradient(135deg,#25d366,#128c7e)",
                             border: "none", borderRadius: "12px", padding: "13px",
                             fontSize: "14px", fontWeight: 900, color: "#fff", cursor: "pointer",
                             fontFamily: "'Nunito',sans-serif", boxShadow: "0 3px 0 #0a5c3a" }}>
                  📱 WhatsApp
                </button>
              </div>
            </div>

            {/* Saldo y convertir */}
            <div style={{ background: "linear-gradient(135deg,#1a2a3a,#243b55)", borderRadius: "16px", padding: "18px", border: "2px solid #d4a017" }}>
              <div style={{ fontSize: "12px", fontWeight: 800, color: "#d4a017", textTransform: "uppercase",
                             letterSpacing: "1px", marginBottom: "8px" }}>
                Saldo actual
              </div>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "42px", color: "#f0c040",
                             letterSpacing: "2px" }}>
                {bitsPromotor.toLocaleString()} BIT
              </div>
              <div style={{ fontSize: "12px", color: "#8a9aaa", fontWeight: 600, marginBottom: "16px" }}>
                ≈ ${(bitsPromotor * 1000).toLocaleString("es-AR")} ARS
              </div>
              <button
                onClick={() => puedeConvertir ? setPopupLiquidar(true) : setTab("liquidar")}
                style={{ width: "100%", background: puedeConvertir
                           ? "linear-gradient(135deg,#f0c040,#d4a017)"
                           : "rgba(255,255,255,0.08)",
                           border: puedeConvertir ? "none" : "1px solid rgba(255,255,255,0.15)",
                           borderRadius: "12px", padding: "13px",
                           fontSize: "14px", fontWeight: 900,
                           color: puedeConvertir ? "#1a2a3a" : "rgba(255,255,255,0.4)",
                           cursor: puedeConvertir ? "pointer" : "default",
                           fontFamily: "'Nunito',sans-serif",
                           boxShadow: puedeConvertir ? "0 3px 0 #a07810" : "none" }}>
                {puedeConvertir
                  ? "💳 Solicitar cobro"
                  : `Necesitás 100 BIT mínimo (tenés ${bitsPromotor})`}
              </button>
            </div>
          </div>
        )}

        {/* ── TAB REFERIDOS ───────────────────────────────────────────── */}
        {tab === "referidos" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {referidos.length === 0 ? (
              <EmptyState emoji="👥" texto="Todavía no tenés referidos" sub="Compartí tu link y empezá a ganar" />
            ) : referidos.map(r => (
              <div key={r.id} style={{ background: "#fff", borderRadius: "14px", padding: "14px 16px",
                                        display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ width: "42px", height: "42px", borderRadius: "50%",
                               background: r.es_promotor ? "rgba(212,160,23,0.15)" : "rgba(58,123,213,0.1)",
                               display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>
                  {r.es_promotor ? "⭐" : "👤"}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "14px", fontWeight: 900, color: "#1a2a3a" }}>{r.nombre || "Usuario"}</div>
                  <div style={{ fontSize: "11px", color: "#9a9a9a", fontWeight: 600 }}>
                    {r.codigo_nexo} · {r.total_referidos} referidos · {new Date(r.created_at).toLocaleDateString("es-AR")}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "13px", fontWeight: 900, color: "#d4a017" }}>
                    {(r.bits_promotor_total || 0).toLocaleString()} BIT
                  </div>
                  <div style={{ fontSize: "10px", color: "#9a9a9a", fontWeight: 600 }}>generado</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── TAB COMISIONES ──────────────────────────────────────────── */}
        {tab === "comisiones" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {comisiones.length === 0 ? (
              <EmptyState emoji="💰" texto="Sin comisiones todavía" sub="Aparecerán aquí cuando tus referidos paguen BIT" />
            ) : comisiones.map(c => (
              <div key={c.id} style={{ background: "#fff", borderRadius: "14px", padding: "14px 16px",
                                        display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ width: "38px", height: "38px", borderRadius: "50%",
                               background: "rgba(212,160,23,0.12)", display: "flex", alignItems: "center",
                               justifyContent: "center", fontSize: "18px", flexShrink: 0 }}>
                  💰
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "13px", fontWeight: 900, color: "#1a2a3a" }}>
                    {c.concepto || "BIT Nexo"} · Nivel {c.nivel}
                  </div>
                  <div style={{ fontSize: "11px", color: "#9a9a9a", fontWeight: 600 }}>
                    {(c.origen as any)?.nombre || "Usuario"} · {(c.origen as any)?.codigo_nexo}
                  </div>
                  <div style={{ fontSize: "10px", color: "#bbb", fontWeight: 600 }}>
                    {new Date(c.created_at).toLocaleString("es-AR")}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "16px", fontWeight: 900, color: "#27ae60" }}>
                    +{c.monto_comision.toLocaleString()} BIT
                  </div>
                  <div style={{ fontSize: "10px", color: "#9a9a9a", fontWeight: 600 }}>
                    30% de {c.monto_origen.toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── TAB LIQUIDAR ────────────────────────────────────────────── */}
        {tab === "liquidar" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ background: "#fff", borderRadius: "16px", padding: "18px" }}>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "18px", color: "#1a2a3a",
                             letterSpacing: "1px", marginBottom: "12px" }}>
                Condiciones para cobrar
              </div>
              {[
                { ok: bitsPromotor >= 100, t: `Mínimo 100 BIT Promotor (tenés ${bitsPromotor})` },
                { ok: true, t: "Emitir factura A o C a NexoNet Argentina SRL" },
                { ok: true, t: "Concepto: Servicios de promoción y publicidad" },
                { ok: true, t: "IVA 21% incluido en el monto" },
              ].map((c, i) => (
                <div key={i} style={{ display: "flex", gap: "10px", marginBottom: "10px", alignItems: "flex-start" }}>
                  <span style={{ fontSize: "16px" }}>{c.ok ? "✅" : "❌"}</span>
                  <span style={{ fontSize: "13px", fontWeight: 600, color: c.ok ? "#1a2a3a" : "#e74c3c" }}>{c.t}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => puedeConvertir && setPopupLiquidar(true)}
              disabled={!puedeConvertir}
              style={{ width: "100%", background: puedeConvertir
                         ? "linear-gradient(135deg,#f0c040,#d4a017)"
                         : "#f0f0f0",
                         border: "none", borderRadius: "12px", padding: "14px",
                         fontSize: "15px", fontWeight: 900,
                         color: puedeConvertir ? "#1a2a3a" : "#bbb",
                         cursor: puedeConvertir ? "pointer" : "not-allowed",
                         fontFamily: "'Nunito',sans-serif",
                         boxShadow: puedeConvertir ? "0 3px 0 #a07810" : "none" }}>
              💳 Solicitar cobro de {bitsPromotor.toLocaleString()} BIT
            </button>

            {/* Historial liquidaciones */}
            {liquidaciones.length > 0 && (
              <div>
                <div style={{ fontSize: "11px", fontWeight: 800, color: "#9a9a9a",
                               textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px" }}>
                  Historial
                </div>
                {liquidaciones.map(l => (
                  <div key={l.id} style={{ background: "#fff", borderRadius: "14px", padding: "14px 16px",
                                            display: "flex", justifyContent: "space-between",
                                            alignItems: "center", marginBottom: "8px" }}>
                    <div>
                      <div style={{ fontSize: "14px", fontWeight: 900, color: "#1a2a3a" }}>
                        {l.monto_bits.toLocaleString()} BIT
                      </div>
                      <div style={{ fontSize: "11px", color: "#9a9a9a", fontWeight: 600 }}>
                        {new Date(l.created_at).toLocaleDateString("es-AR")}
                      </div>
                    </div>
                    <span style={{
                      background: l.estado === "aprobada" ? "#e8f8ee"
                                : l.estado === "rechazada" ? "#fef0ef" : "#fff8e0",
                      color:      l.estado === "aprobada" ? "#27ae60"
                                : l.estado === "rechazada" ? "#e74c3c" : "#d4a017",
                      border: `1px solid ${l.estado === "aprobada" ? "#27ae60" : l.estado === "rechazada" ? "#e74c3c" : "#d4a017"}40`,
                      borderRadius: "20px", padding: "4px 12px",
                      fontSize: "11px", fontWeight: 900, textTransform: "uppercase" as const,
                    }}>
                      {l.estado}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* POPUP LIQUIDAR */}
      {popupLiquidar && (
        <div style={{ position: "fixed", inset: 0, zIndex: 500, background: "rgba(0,0,0,0.65)",
                       display: "flex", alignItems: "flex-end" }}
          onClick={() => setPopupLiquidar(false)}>
          <div style={{ width: "100%", background: "#fff", borderRadius: "24px 24px 0 0",
                         padding: "28px 20px 44px", fontFamily: "'Nunito',sans-serif" }}
            onClick={e => e.stopPropagation()}>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "22px", color: "#1a2a3a",
                           letterSpacing: "1px", marginBottom: "6px" }}>
              💳 Solicitar cobro
            </div>
            <div style={{ fontSize: "13px", color: "#9a9a9a", fontWeight: 600, marginBottom: "20px" }}>
              Vas a solicitar la conversión de {bitsPromotor.toLocaleString()} BIT Promotor a pesos.
            </div>
            <div style={{ background: "#f4f4f2", borderRadius: "12px", padding: "14px 16px",
                           marginBottom: "16px", display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: "13px", fontWeight: 700, color: "#666" }}>Monto a cobrar</span>
              <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "22px", color: "#d4a017" }}>
                ${(bitsPromotor * 1000).toLocaleString("es-AR")}
              </span>
            </div>
            <div style={{ marginBottom: "16px" }}>
              <div style={{ fontSize: "11px", fontWeight: 800, color: "#9a9a9a",
                             textTransform: "uppercase", letterSpacing: "1px", marginBottom: "6px" }}>
                Link de tu factura (opcional)
              </div>
              <input
                type="url"
                value={facturaUrl}
                onChange={e => setFacturaUrl(e.target.value)}
                placeholder="https://drive.google.com/..."
                style={{ width: "100%", border: "2px solid #e8e8e6", borderRadius: "12px",
                          padding: "11px 14px", fontSize: "13px", fontFamily: "'Nunito',sans-serif",
                          outline: "none", boxSizing: "border-box" }}
              />
            </div>
            <button onClick={solicitarLiquidacion} disabled={solicitando}
              style={{ width: "100%", background: "linear-gradient(135deg,#f0c040,#d4a017)",
                         border: "none", borderRadius: "12px", padding: "14px",
                         fontSize: "15px", fontWeight: 900, color: "#1a2a3a",
                         cursor: "pointer", fontFamily: "'Nunito',sans-serif",
                         boxShadow: "0 3px 0 #a07810", marginBottom: "10px" }}>
              {solicitando ? "Enviando..." : "✅ Confirmar solicitud"}
            </button>
            <button onClick={() => setPopupLiquidar(false)}
              style={{ width: "100%", background: "none", border: "none", padding: "10px",
                         fontSize: "13px", fontWeight: 700, color: "#9a9a9a", cursor: "pointer",
                         fontFamily: "'Nunito',sans-serif" }}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      <BottomNav />
    </main>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.07)", borderRadius: "12px", padding: "12px",
                   textAlign: "center", border: `1px solid ${color}30` }}>
      <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "22px", color, letterSpacing: "1px" }}>
        {value}
      </div>
      <div style={{ fontSize: "10px", fontWeight: 700, color: "#8a9aaa", textTransform: "uppercase", letterSpacing: "0.5px" }}>
        {label}
      </div>
    </div>
  );
}

function EmptyState({ emoji, texto, sub }: { emoji: string; texto: string; sub: string }) {
  return (
    <div style={{ textAlign: "center", padding: "40px 20px", background: "#fff", borderRadius: "16px" }}>
      <div style={{ fontSize: "48px", marginBottom: "12px" }}>{emoji}</div>
      <div style={{ fontSize: "16px", fontWeight: 900, color: "#1a2a3a", marginBottom: "6px" }}>{texto}</div>
      <div style={{ fontSize: "13px", color: "#9a9a9a", fontWeight: 600 }}>{sub}</div>
    </div>
  );
}
