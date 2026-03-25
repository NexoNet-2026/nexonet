"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/lib/supabase";
import AyudaPopup from "@/components/AyudaPopup";

type Referido = {
  id: string;
  nombre: string;
  codigo_nexo: string;
  created_at: string;
};

const TABS = ["inicio", "referidos"] as const;
type Tab = (typeof TABS)[number];

export default function PromoterPage() {
  const router = useRouter();
  const [perfil,    setPerfil]    = useState<any>(null);
  const [tab,       setTab]       = useState<Tab>("inicio");
  const [referidos, setReferidos] = useState<Referido[]>([]);
  const [cargando,  setCargando]  = useState(true);
  const [copiado,   setCopiado]   = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session: s } }) => {
      if (!s) { router.push("/login"); return; }
      const { data: u } = await supabase
        .from("usuarios")
        .select("*")
        .eq("id", s.user.id)
        .single();
      setPerfil(u);

      const { data: refs } = await supabase.from("usuarios")
        .select("id, nombre, codigo_nexo, created_at")
        .eq("referido_por", s.user.id)
        .order("created_at", { ascending: false });

      setReferidos((refs as any) || []);
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

  if (cargando) return (
    <main style={{ paddingTop: "95px", fontFamily: "'Nunito',sans-serif", textAlign: "center", color: "#9a9a9a" }}>
      Cargando...
    </main>
  );

  const bitsPromotor = perfil?.bits_promotor || 0;
  const totalRefs    = referidos.length;
  const totalGanado  = perfil?.bits_promotor_total || 0;

  return (
    <main style={{ paddingTop: "95px", paddingBottom: "100px", fontFamily: "'Nunito',sans-serif", background: "#f4f4f2", minHeight: "100vh" }}>
      <Header />

      {/* HERO */}
      <div style={{ background: "linear-gradient(135deg,#1a2a3a,#243b55)", padding: "24px 20px 28px" }}>
        <button onClick={()=>router.back()} style={{background:"rgba(255,255,255,0.15)",border:"1px solid rgba(255,255,255,0.25)",borderRadius:"10px",padding:"7px 13px",color:"#fff",fontSize:"13px",fontWeight:700,cursor:"pointer",fontFamily:"'Nunito',sans-serif",marginBottom:"14px"}}>← Volver</button>
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
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
          <StatCard label="BIT Promotor" value={bitsPromotor.toLocaleString()} color="#d4a017" />
          <StatCard label="Referidos" value={totalRefs.toLocaleString()} color="#27ae60" />
          <StatCard label="Total ganado" value={totalGanado.toLocaleString()} color="#3a7bd5" />
        </div>

        {/* Solicitar reembolso */}
        <div style={{ background:"rgba(255,255,255,0.1)", borderRadius:"14px", padding:"14px 16px", marginTop:"14px" }}>
          {totalGanado >= 100000 ? (<>
            <div style={{ fontSize:"13px", fontWeight:900, color:"#fff", marginBottom:"6px" }}>💸 Solicitar reembolso</div>
            <div style={{ fontSize:"11px", color:"rgba(255,255,255,0.6)", fontWeight:600, marginBottom:"10px" }}>
              Mínimo 100.000 BIT Promo = $100.000 ARS contra factura A + IVA
            </div>
            <button onClick={async()=>{
              if(!confirm(`¿Solicitar reembolso de ${bitsPromotor.toLocaleString()} BIT Promo?`)) return;
              await supabase.from("solicitudes_reembolso_promotor").insert({usuario_id:perfil.id,bits_cantidad:bitsPromotor,estado:"pendiente"});
              await supabase.from("notificaciones").insert({usuario_id:perfil.id,tipo:"sistema",mensaje:`💸 Solicitud de reembolso de ${bitsPromotor.toLocaleString()} BIT Promo recibida. Te contactaremos.`,leida:false});
              alert("✅ Solicitud enviada. Te contactaremos para coordinar el pago.");
            }} disabled={bitsPromotor===0} style={{background:"linear-gradient(135deg,#27ae60,#1e8449)",border:"none",borderRadius:"10px",padding:"10px 18px",fontSize:"13px",fontWeight:900,color:"#fff",cursor:"pointer",fontFamily:"'Nunito',sans-serif",opacity:bitsPromotor===0?0.5:1}}>
              💸 Solicitar reembolso de {bitsPromotor.toLocaleString()} BIT
            </button>
          </>) : (<>
            <div style={{ fontSize:"13px", fontWeight:900, color:"#fff", marginBottom:"6px" }}>💸 Reembolso disponible desde 100.000 BIT</div>
            <div style={{ background:"rgba(255,255,255,0.1)", borderRadius:"8px", height:"12px", overflow:"hidden", marginBottom:"6px" }}>
              <div style={{ height:"100%", background:"linear-gradient(90deg,#d4a017,#f0c040)", borderRadius:"8px", width:`${Math.min(100,totalGanado/1000)}%`, transition:"width .3s" }}/>
            </div>
            <div style={{ fontSize:"11px", color:"rgba(255,255,255,0.5)", fontWeight:700 }}>
              {totalGanado.toLocaleString()} / 100.000 BIT — Faltan {(100000-totalGanado).toLocaleString()} BIT
            </div>
          </>)}
        </div>
      </div>

      {/* TABS */}
      <div style={{ background: "#fff", borderBottom: "2px solid #e8e8e6", display: "flex" }}>
        {([
          { key: "inicio",    label: "🏠 Inicio" },
          { key: "referidos", label: `👥 Referidos (${totalRefs})` },
        ] as { key: Tab; label: string }[]).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{ flex: 1, padding: "14px 18px", border: "none", background: "none", cursor: "pointer",
                      fontFamily: "'Nunito',sans-serif", fontSize: "13px", fontWeight: 800,
                      color: tab === t.key ? "#d4a017" : "#666",
                      borderBottom: tab === t.key ? "3px solid #d4a017" : "3px solid transparent" }}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ padding: "16px" }}>

        {/* ── TAB INICIO ── */}
        {tab === "inicio" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>

            <div style={{ background: "#fff", borderRadius: "16px", padding: "18px" }}>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "18px", color: "#1a2a3a",
                             letterSpacing: "1px", marginBottom: "14px" }}>
                ¿Cómo funciona?
              </div>
              {[
                { n: "1", t: "Compartí tu link", d: "Compartí tu código y link de registro" },
                { n: "2", t: "Ganás el 15%", d: "Recibís el 15% en BIT Promo de cada compra que haga tu referido, de por vida" },
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

            <div style={{ background: "linear-gradient(135deg,#1a2a3a,#243b55)", borderRadius: "16px", padding: "18px", border: "2px solid #d4a017" }}>
              <div style={{ fontSize: "12px", fontWeight: 800, color: "#d4a017", textTransform: "uppercase",
                             letterSpacing: "1px", marginBottom: "8px" }}>
                Saldo actual
              </div>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "42px", color: "#f0c040",
                             letterSpacing: "2px" }}>
                {bitsPromotor.toLocaleString()} BIT
              </div>
              <div style={{ fontSize: "12px", color: "#8a9aaa", fontWeight: 600 }}>
                Acumulados como promotor
              </div>
            </div>
          </div>
        )}

        {/* ── TAB REFERIDOS ── */}
        {tab === "referidos" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {referidos.length === 0 ? (
              <EmptyState emoji="👥" texto="Todavía no tenés referidos" sub="Compartí tu link y empezá a ganar" />
            ) : referidos.map(r => (
              <div key={r.id} style={{ background: "#fff", borderRadius: "14px", padding: "14px 16px",
                                        display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ width: "42px", height: "42px", borderRadius: "50%",
                               background: "rgba(58,123,213,0.1)",
                               display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>
                  👤
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "14px", fontWeight: 900, color: "#1a2a3a" }}>{r.nombre || "Usuario"}</div>
                  <div style={{ fontSize: "11px", color: "#9a9a9a", fontWeight: 600 }}>
                    {r.codigo_nexo} · {new Date(r.created_at).toLocaleDateString("es-AR")}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "11px", fontWeight: 800, color: "#27ae60" }}>
                    15% comisión
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AyudaPopup
        titulo="¿Cómo funciona ser Promotor?"
        color="#d4a017"
        items={[
          {emoji:"🤝",titulo:"Invitá amigos",desc:"Compartí tu código de promotor y ganá BIT por cada usuario que se registre con él."},
          {emoji:"💰",titulo:"Comisión del 15%",desc:"Recibís el 15% de cada compra de BIT que hagan tus referidos."},
          {emoji:"📊",titulo:"Panel de seguimiento",desc:"Acá ves todos tus referidos, sus compras y tus comisiones acumuladas."},
          {emoji:"💸",titulo:"Solicitar cobro",desc:"Cuando acumulás suficiente, podés solicitar la liquidación de tus comisiones."},
          {emoji:"📱",titulo:"Compartí fácil",desc:"Copiá tu link de referido y envialo por WhatsApp, redes o donde quieras."},
          {emoji:"🚀",titulo:"Sin límites",desc:"No hay tope de referidos ni de comisiones. Cuantos más invitás, más ganás."},
        ]}
      />
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
