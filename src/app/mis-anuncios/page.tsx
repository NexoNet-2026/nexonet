"use client";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import PopupCompra from "@/components/PopupCompra";

type Anuncio = {
  id: number;
  titulo: string;
  imagenes: string[];
  estado: string;
  vistas: number;
  conexiones: number;
  flash: boolean;
  bits_posicion: boolean;
  bits_conexion: number;
  created_at: string;
};

type Plan = "nexofree" | "nexonet" | "nexoempresa";

const SLOTS_BASE = 3; // Siempre 3 gratis para todos

// Color de solapa según índice de slot
const colorSlot = (index: number, slotsExtra: number, plan: Plan) => {
  if (index < SLOTS_BASE) return "#6a8aaa"; // free → gris
  if (plan === "nexoempresa") return "#c0392b"; // empresa → rojo
  return "#d4a017"; // comprado → dorado
};

const PLAN_BITS: Record<Plan, number> = {
  nexofree:    100,
  nexonet:     100,
  nexoempresa: 1000,
};

const diasRestantes = (created_at: string) => {
  const diff = Date.now() - new Date(created_at).getTime();
  return Math.max(0, 30 - Math.floor(diff / (1000 * 60 * 60 * 24)));
};

export default function MisAnuncios() {
  const router = useRouter();
  const [anuncios, setAnuncios] = useState<Anuncio[]>([]);
  const [plan, setPlan] = useState<Plan>("nexofree");
  const [bits, setBits] = useState(0);
  const [bitsPromo, setBitsPromo] = useState(0);
  const [bitsFree, setBitsFree] = useState(0);
  const [popupFlash, setPopupFlash] = useState(false);
  const [slotsExtra, setSlotsExtra] = useState(0);
  const [loading, setLoading] = useState(true);

  const [popupCompra, setPopupCompra] = useState<null | "anuncios3" | "anuncios10" | "empresa">(null);
  const [popupAnuncio, setPopupAnuncio] = useState<null | Anuncio>(null);
  const [popupBit, setPopupBit] = useState<null | "flash" | "posicion" | "conexion">(null);
  const [confirmEliminar, setConfirmEliminar] = useState<null | number>(null);

  useEffect(() => { cargar(); }, []);

  const cargar = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.push("/login"); return; }

    const { data: usuario } = await supabase
      .from("usuarios")
      .select("bits, bits_promo, bits_free, plan, slots_extra")
      .eq("id", session.user.id)
      .single();

    if (usuario) {
      setBits(usuario.bits || 0);
      setBitsPromo(usuario.bits_promo || 0);
      setBitsFree(usuario.bits_free || 0);
      setPlan((usuario.plan as Plan) || "nexofree");
      setSlotsExtra(usuario.slots_extra || 0);
    }

    const { data } = await supabase
      .from("anuncios")
      .select("id, titulo, imagenes, estado, vistas, conexiones, flash, bits_posicion, bits_conexion, created_at")
      .eq("usuario_id", session.user.id)
      .order("created_at", { ascending: false });

    if (data) setAnuncios(data as Anuncio[]);
    setLoading(false);
  };

  const eliminarAnuncio = async (id: number) => {
    await supabase.from("anuncios").delete().eq("id", id);
    setAnuncios(anuncios.filter(a => a.id !== id));
    setConfirmEliminar(null);
    setPopupAnuncio(null);
  };

  const totalSlots = SLOTS_BASE + slotsExtra;
  const usados = anuncios.length;
  const disponibles = Math.max(0, totalSlots - usados);
  const bitsConexion = PLAN_BITS[plan];

  // Label del plan según slots_extra y plan
  const planLabel = plan === "nexoempresa" ? "NEXO EMPRESA" : slotsExtra > 0 ? "NEXO NET" : "NEXO FREE";
  const planColor = plan === "nexoempresa" ? "#c0392b" : slotsExtra > 0 ? "#d4a017" : "#6a8aaa";

  return (
    <main style={{ paddingTop: "95px", paddingBottom: "130px", background: "#f4f4f2", minHeight: "100vh", fontFamily: "'Nunito', sans-serif" }}>
      <Header />

      {/* ENCABEZADO */}
      <div style={{ background: "linear-gradient(135deg, #1a2a3a 0%, #243b55 100%)", padding: "16px 16px 20px" }}>
        {/* FILA 1: Mi Perfil + título + BITS */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button onClick={() => router.push("/usuario")} style={{ background: "linear-gradient(135deg,#f0c040,#d4a017)", border: "none", borderRadius: "20px", padding: "6px 14px", fontSize: "12px", fontWeight: 900, color: "#1a2a3a", cursor: "pointer", fontFamily: "'Nunito',sans-serif", boxShadow: "0 3px 0 #a07810", display: "flex", alignItems: "center", gap: "5px", whiteSpace: "nowrap" }}>
              ← 👤 Mi Perfil
            </button>
            <div style={{ fontSize: "18px", fontWeight: 900, color: "#fff" }}>Mis Anuncios</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "11px", color: "#8a9aaa", fontWeight: 700 }}>BITS</div>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "28px", color: "#d4a017" }}>{bits}</div>
          </div>
        </div>
        {/* FILA 2: badges de plan */}
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "12px" }}>
          <div style={{ background: "#6a8aaa", borderRadius: "20px", padding: "3px 10px" }}>
            <span style={{ fontSize: "10px", fontWeight: 900, color: "#fff", letterSpacing: "1px" }}>
              FREE × {SLOTS_BASE}
            </span>
          </div>
          {slotsExtra > 0 && (
            <div style={{ background: plan === "nexoempresa" ? "#c0392b" : "#d4a017", borderRadius: "20px", padding: "3px 10px" }}>
              <span style={{ fontSize: "10px", fontWeight: 900, color: plan === "nexoempresa" ? "#fff" : "#1a2a3a", letterSpacing: "1px" }}>
                {plan === "nexoempresa" ? "EMPRESA" : "NET"} × {slotsExtra}
              </span>
            </div>
          )}
        </div>

        {/* BARRA DE SLOTS */}
        <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: "12px", padding: "12px 16px", display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ display: "flex", gap: "16px" }}>
            {[{ n: usados, l: "USADOS" }, { n: disponibles, l: "LIBRES" }, { n: totalSlots, l: "TOTAL" }].map((s, i) => (
              <div key={i} style={{ textAlign: "center" }}>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "26px", color: i === 1 && disponibles > 0 ? "#d4a017" : "#fff" }}>{s.n}</div>
                <div style={{ fontSize: "10px", fontWeight: 700, color: "#8a9aaa" }}>{s.l}</div>
              </div>
            ))}
          </div>
          <div style={{ flex: 1 }}>
            {/* BARRA con dos colores: free + comprado */}
            <div style={{ height: "8px", background: "rgba(255,255,255,0.15)", borderRadius: "4px", overflow: "hidden", display: "flex" }}>
              <div style={{ width: `${(Math.min(usados, SLOTS_BASE) / totalSlots) * 100}%`, background: "#6a8aaa", transition: "width .4s" }} />
              <div style={{ width: `${(Math.max(0, usados - SLOTS_BASE) / totalSlots) * 100}%`, background: "#d4a017", transition: "width .4s" }} />
            </div>
            <div style={{ fontSize: "10px", color: "#8a9aaa", fontWeight: 700, marginTop: "4px", textAlign: "right" }}>{usados}/{totalSlots} slots</div>
          </div>
        </div>
      </div>

      <div style={{ padding: "16px", maxWidth: "480px", margin: "0 auto" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#9a9a9a", fontWeight: 700 }}>Cargando...</div>
        ) : (
          <>
            {/* ── SLOTS: publicados + disponibles ── */}
            {Array.from({ length: totalSlots }).map((_, i) => {
              const anuncio = anuncios[i];
              const slotColor = colorSlot(i, slotsExtra, plan);
              const slotLabel = i < SLOTS_BASE ? "FREE" : plan === "nexoempresa" ? "EMP" : "NET";

              // SLOT OCUPADO
              if (anuncio) {
                const dias = diasRestantes(anuncio.created_at);
                const vencido = dias === 0;
                const conexTotal = bitsConexion + (anuncio.bits_conexion || 0);

                return (
                  <div key={anuncio.id} onClick={() => setPopupAnuncio(anuncio)} style={{
                    background: "#fff", borderRadius: "16px", marginBottom: "12px",
                    overflow: "hidden", boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
                    display: "flex", alignItems: "stretch", cursor: "pointer",
                    opacity: vencido ? 0.5 : 1, filter: vencido ? "grayscale(60%)" : "none",
                    border: vencido ? "2px solid #e74c3c" : "2px solid transparent",
                  }}>
                    {/* SOLAPA CON COLOR DE PLAN */}
                    <div style={{ width: "44px", background: slotColor, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0, gap: "1px" }}>
                      <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "22px", color: "#fff" }}>{i + 1}</span>
                      <span style={{ fontSize: "7px", fontWeight: 900, color: "rgba(255,255,255,0.8)", letterSpacing: "0.5px" }}>{slotLabel}</span>
                    </div>
                    {/* IMAGEN */}
                    <div style={{ width: "70px", height: "70px", flexShrink: 0, background: "#f4f4f2", position: "relative", alignSelf: "center", margin: "8px", borderRadius: "10px", overflow: "hidden" }}>
                      {anuncio.imagenes?.[0]
                        ? <img src={anuncio.imagenes[0]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "28px" }}>📦</div>
                      }
                      {anuncio.flash && <div style={{ position: "absolute", top: "2px", left: "2px", background: "#e67e22", borderRadius: "4px", padding: "1px 4px", fontSize: "8px", fontWeight: 900, color: "#fff" }}>⚡</div>}
                      {anuncio.bits_posicion && <div style={{ position: "absolute", bottom: "2px", left: "2px", background: "#27ae60", borderRadius: "4px", padding: "1px 4px", fontSize: "8px", fontWeight: 900, color: "#fff" }}>📌</div>}
                    </div>
                    {/* INFO */}
                    <div style={{ flex: 1, padding: "10px 6px", minWidth: 0 }}>
                      <div style={{ fontSize: "13px", fontWeight: 800, color: "#1a2a3a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{anuncio.titulo}</div>
                      <div style={{ fontSize: "10px", fontWeight: 700, marginTop: "3px", color: vencido ? "#e74c3c" : anuncio.estado === "activo" ? "#27ae60" : "#9a9a9a" }}>
                        {vencido ? "⚠️ VENCIDO" : anuncio.estado === "activo" ? "✅ ACTIVO" : "⏸ PAUSADO"}
                      </div>
                      <div style={{ display: "flex", gap: "10px", marginTop: "5px" }}>
                        <div style={{ textAlign: "center" }}>
                          <div style={{ fontSize: "13px", fontWeight: 900, color: "#1a2a3a" }}>{anuncio.vistas || 0}</div>
                          <div style={{ fontSize: "9px", fontWeight: 700, color: "#9a9a9a" }}>👁 VISTAS</div>
                        </div>
                        <div style={{ width: "1px", background: "#e8e8e6" }} />
                        <div style={{ textAlign: "center" }}>
                          <div style={{ fontSize: "13px", fontWeight: 900, color: (anuncio.conexiones || 0) >= conexTotal ? "#e74c3c" : "#1a2a3a" }}>
                            {anuncio.conexiones || 0}/{conexTotal}
                          </div>
                          <div style={{ fontSize: "9px", fontWeight: 700, color: "#9a9a9a" }}>🔗 CONEX</div>
                        </div>
                      </div>
                    </div>
                    {/* DÍAS */}
                    <div style={{ padding: "10px", display: "flex", flexDirection: "column", alignItems: "flex-end", justifyContent: "space-between", flexShrink: 0 }}>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: "9px", color: "#9a9a9a", fontWeight: 700 }}>VENCE</div>
                        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "18px", color: dias <= 5 ? "#e74c3c" : "#d4a017" }}>{dias}d</div>
                      </div>
                      <div style={{ fontSize: "10px", fontWeight: 800, color: "#8a9aaa" }}>Ver →</div>
                    </div>
                  </div>
                );
              }

              // SLOT VACÍO
              return (
                <Link key={`empty-${i}`} href="/publicar" style={{ textDecoration: "none" }}>
                  <div style={{
                    background: "#fff", borderRadius: "16px", marginBottom: "12px",
                    overflow: "hidden", display: "flex", alignItems: "stretch",
                    border: `2px dashed ${slotColor}60`,
                  }}>
                    <div style={{ width: "44px", background: `${slotColor}25`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "22px", color: `${slotColor}90` }}>{i + 1}</span>
                      <span style={{ fontSize: "7px", fontWeight: 900, color: `${slotColor}80`, letterSpacing: "0.5px" }}>{slotLabel}</span>
                    </div>
                    <div style={{ width: "70px", height: "70px", flexShrink: 0, background: "#f4f4f2", display: "flex", alignItems: "center", justifyContent: "center", alignSelf: "center", margin: "8px", borderRadius: "10px", border: "2px dashed #ddd" }}>
                      <span style={{ fontSize: "22px", color: "#ccc" }}>✕</span>
                    </div>
                    <div style={{ flex: 1, padding: "10px 8px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                      <div style={{ fontSize: "13px", fontWeight: 800, color: slotColor }}>➕ Publicar anuncio</div>
                      <div style={{ fontSize: "11px", color: "#b0b0b0", fontWeight: 600, marginTop: "2px" }}>Slot disponible — tocá para publicar</div>
                      <div style={{ fontSize: "10px", color: "#9a9a9a", marginTop: "4px" }}>🔗 {bitsConexion} BIT Conexión incluidos</div>
                    </div>
                  </div>
                </Link>
              );
            })}

            {/* ── BOTONES AMPLIAR PLAN (siempre debajo) ── */}
            <div style={{ marginTop: "8px", display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ fontSize: "11px", fontWeight: 800, color: "#9a9a9a", textTransform: "uppercase", letterSpacing: "1px" }}>Ampliar plan</div>

              {[
                { id: "anuncios3"  as const, c1: "#1a2a3a", c2: "#243b55", icon: "➕", planLabel: "NEXO NET",     titulo: "BIT Anuncios × 3",  sub: "3 anuncios + 100 BIT Conexión c/u",                        precio: "$1.000", bg: "#d4a017", fg: "#1a2a3a" },
                { id: "anuncios10" as const, c1: "#1a2a3a", c2: "#243b55", icon: "➕", planLabel: "NEXO NET",     titulo: "BIT Anuncios × 10", sub: "10 anuncios + 100 BIT Conexión c/u",                       precio: "$3.000", bg: "#d4a017", fg: "#1a2a3a" },
                { id: "empresa"    as const, c1: "#2c1a1a", c2: "#4a2020", icon: "🏢", planLabel: "NEXO EMPRESA", titulo: "BIT Empresa × 50",  sub: "50 anuncios + 1000 BIT Conexión c/u + horómetro", precio: "$10.000", bg: "#c0392b", fg: "#fff"    },
              ].map(op => (
                <div key={op.id} onClick={() => setPopupCompra(op.id)} style={{ background: `linear-gradient(135deg, ${op.c1}, ${op.c2})`, borderRadius: "16px", padding: "16px 20px", display: "flex", alignItems: "center", gap: "14px", cursor: "pointer" }}>
                  <div style={{ width: "44px", height: "44px", borderRadius: "50%", background: `${op.bg}30`, border: `2px solid ${op.bg}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", flexShrink: 0 }}>{op.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "10px", fontWeight: 700, color: op.id === "empresa" ? "#e88a8a" : "#8a9aaa", letterSpacing: "1px" }}>{op.planLabel}</div>
                    <div style={{ fontSize: "14px", fontWeight: 900, color: "#fff" }}>{op.titulo}</div>
                    <div style={{ fontSize: "11px", color: op.id === "empresa" ? "#e88a8a" : "#8a9aaa" }}>{op.sub}</div>
                  </div>
                  <div style={{ background: op.bg, borderRadius: "10px", padding: "6px 12px", fontFamily: "'Bebas Neue', sans-serif", fontSize: "18px", color: op.fg, flexShrink: 0 }}>{op.precio}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ══ POPUP DETALLE ANUNCIO ══ */}
      {popupAnuncio && !popupBit && !confirmEliminar && (
        <div style={overlayStyle} onClick={() => setPopupAnuncio(null)}>
          <div style={modalStyle} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div style={{ fontSize: "15px", fontWeight: 900, color: "#1a2a3a" }}>{popupAnuncio.titulo}</div>
              <button onClick={() => setPopupAnuncio(null)} style={btnCerrarStyle}>✕</button>
            </div>
            {popupAnuncio.imagenes?.[0] && (
              <img src={popupAnuncio.imagenes[0]} alt="" style={{ width: "100%", height: "160px", objectFit: "cover", borderRadius: "12px", marginBottom: "16px" }} />
            )}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", marginBottom: "16px" }}>
              {[
                { v: popupAnuncio.vistas || 0, l: "👁 Vistas" },
                { v: `${popupAnuncio.conexiones || 0}/${bitsConexion + (popupAnuncio.bits_conexion || 0)}`, l: "🔗 Conexión" },
                { v: `${diasRestantes(popupAnuncio.created_at)}d`, l: "⏳ Vence" },
              ].map((s, i) => (
                <div key={i} style={{ background: "#f4f4f2", borderRadius: "10px", padding: "10px", textAlign: "center" }}>
                  <div style={{ fontSize: "16px", fontWeight: 900, color: "#1a2a3a" }}>{s.v}</div>
                  <div style={{ fontSize: "10px", fontWeight: 700, color: "#9a9a9a" }}>{s.l}</div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "14px" }}>
              <div style={{ fontSize: "10px", fontWeight: 800, color: "#9a9a9a", textTransform: "uppercase", letterSpacing: "1px" }}>Potenciar este anuncio</div>
              {([["flash","#e67e22","⚡ Comprar BIT Promo Flash"],["posicion","#27ae60","📌 Comprar BIT Posición"],["conexion","#2980b9","🔗 Comprar BIT Conexión"]] as [any,string,string][]).map(([id,color,label]) => (
                <button key={id} onClick={() => setPopupBit(id)} style={{ width: "100%", background: `${color}18`, border: `1px solid ${color}40`, borderRadius: "12px", padding: "12px 16px", fontSize: "13px", fontWeight: 800, color, cursor: "pointer", fontFamily: "'Nunito', sans-serif", textAlign: "left" }}>{label}</button>
              ))}
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={() => router.push("/comprar")} style={{ flex: 1, background: "linear-gradient(135deg, #d4a017, #f0c040)", border: "none", borderRadius: "12px", padding: "12px", fontSize: "13px", fontWeight: 800, color: "#1a2a3a", cursor: "pointer", fontFamily: "'Nunito', sans-serif" }}>🔄 Renovar</button>
              <button onClick={() => setConfirmEliminar(popupAnuncio.id)} style={{ background: "rgba(231,76,60,0.1)", border: "1px solid rgba(231,76,60,0.3)", borderRadius: "12px", padding: "12px 16px", fontSize: "13px", fontWeight: 800, color: "#e74c3c", cursor: "pointer", fontFamily: "'Nunito', sans-serif" }}>🗑 Eliminar</button>
            </div>
          </div>
        </div>
      )}

      {/* ══ POPUP CONFIRMAR ELIMINAR ══ */}
      {confirmEliminar && (
        <div style={overlayStyle}>
          <div style={modalStyle}>
            <div style={{ textAlign: "center", marginBottom: "20px" }}>
              <div style={{ fontSize: "40px", marginBottom: "8px" }}>🗑</div>
              <div style={{ fontSize: "16px", fontWeight: 900, color: "#1a2a3a" }}>¿Eliminar anuncio?</div>
              <div style={{ fontSize: "13px", color: "#9a9a9a", marginTop: "6px" }}>Esta acción no se puede deshacer</div>
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={() => setConfirmEliminar(null)} style={{ flex: 1, background: "#f4f4f2", border: "none", borderRadius: "12px", padding: "14px", fontSize: "14px", fontWeight: 800, color: "#666", cursor: "pointer", fontFamily: "'Nunito', sans-serif" }}>Cancelar</button>
              <button onClick={() => eliminarAnuncio(confirmEliminar)} style={{ flex: 1, background: "#e74c3c", border: "none", borderRadius: "12px", padding: "14px", fontSize: "14px", fontWeight: 800, color: "#fff", cursor: "pointer", fontFamily: "'Nunito', sans-serif" }}>Sí, eliminar</button>
            </div>
          </div>
        </div>
      )}

      {/* ══ POPUP BIT ══ */}
      {popupBit && popupAnuncio && (
        <div style={overlayStyle} onClick={() => setPopupBit(null)}>
          <div style={modalStyle} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div style={{ fontSize: "15px", fontWeight: 900, color: "#1a2a3a" }}>
                {popupBit === "flash" ? "⚡ BIT Promo Flash" : popupBit === "posicion" ? "📌 BIT Posición" : "🔗 BIT Conexión"}
              </div>
              <button onClick={() => setPopupBit(null)} style={btnCerrarStyle}>✕</button>
            </div>
            <div style={{ background: "#f4f4f2", borderRadius: "12px", padding: "14px", marginBottom: "14px", fontSize: "13px", color: "#444", lineHeight: 1.6 }}>
              {popupBit === "flash" && "Tu anuncio aparece destacado con fondo dorado en la parte superior de los listados."}
              {popupBit === "posicion" && "Tu anuncio aparece primero según el alcance que elijas: barrio, ciudad, provincia o todo el país."}
              {popupBit === "conexion" && "Sumá más conexiones disponibles para este anuncio. Con Ilimitadas nunca te quedás sin."}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "14px" }}>
              {(popupBit === "flash"
                ? [["⚡ Flash 7 días","$500"],["⚡ Flash 15 días","$900"],["⚡ Flash 30 días","$1.500"]]
                : popupBit === "posicion"
                ? [["📌 1° en barrio","$500"],["📌 1° en ciudad","$1.000"],["📌 1° en provincia","$3.000"],["📌 1° en el país","$10.000"]]
                : [["🔗 1.000 conexiones","$1.000"],["🔗 5.000 conexiones","$4.000"],["🔗 Ilimitadas × 30 días","$9.000"]]
              ).map(([label, precio]) => (
                <div key={label} onClick={() => router.push("/comprar")} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "linear-gradient(135deg, #1a2a3a, #243b55)", borderRadius: "12px", padding: "14px 16px", cursor: "pointer" }}>
                  <span style={{ fontSize: "13px", fontWeight: 800, color: "#fff" }}>{label}</span>
                  <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "20px", color: "#d4a017" }}>{precio}</span>
                </div>
              ))}
            </div>
            <button onClick={() => setPopupBit(null)} style={{ width: "100%", background: "#f4f4f2", border: "none", borderRadius: "12px", padding: "12px", fontSize: "13px", fontWeight: 800, color: "#666", cursor: "pointer", fontFamily: "'Nunito', sans-serif" }}>Cancelar</button>
          </div>
        </div>
      )}

      {/* ══ POPUP COMPRA PLAN ══ */}
      {popupCompra && (
        <div style={overlayStyle} onClick={() => setPopupCompra(null)}>
          <div style={modalStyle} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div style={{ fontSize: "15px", fontWeight: 900, color: "#1a2a3a" }}>
                {popupCompra === "empresa" ? "🏢 BIT Empresa" : "📋 BIT Anuncios"}
              </div>
              <button onClick={() => setPopupCompra(null)} style={btnCerrarStyle}>✕</button>
            </div>
            <div style={{ background: "#f4f4f2", borderRadius: "12px", padding: "16px", marginBottom: "16px" }}>
              <div style={{ fontSize: "13px", fontWeight: 700, color: "#444", lineHeight: 1.9 }}>
                Estás comprando:<br />
                {popupCompra === "anuncios3"  && <><span style={{ fontWeight: 900, color: "#1a2a3a" }}>✅ 3 anuncios adicionales</span><br /></>}
                {popupCompra === "anuncios10" && <><span style={{ fontWeight: 900, color: "#1a2a3a" }}>✅ 10 anuncios adicionales</span><br /></>}
                {popupCompra === "empresa"    && <><span style={{ fontWeight: 900, color: "#1a2a3a" }}>✅ 50 anuncios adicionales</span><br /></>}
                <span style={{ fontWeight: 900, color: "#1a2a3a" }}>🔗 {popupCompra === "empresa" ? "1.000" : "100"} BIT Conexión por anuncio</span><br />
                {popupCompra === "empresa" && <><span style={{ fontWeight: 900, color: "#1a2a3a" }}>🕐 Horómetro de disponibilidad</span><br /></>}
                <span style={{ fontWeight: 900, color: "#1a2a3a" }}>📅 Se suman a tus 3 anuncios FREE</span><br />
                <span style={{ fontWeight: 900, color: "#1a2a3a" }}>🔄 Vigencia: 30 días renovables</span>
              </div>
              {popupCompra === "empresa" && (
                <div style={{ marginTop: "12px", background: "#fff", borderRadius: "10px", padding: "12px" }}>
                  <div style={{ fontSize: "11px", fontWeight: 800, color: "#666", marginBottom: "8px", textTransform: "uppercase" }}>🕐 Horario de disponibilidad</div>
                  {[["Lun — Vie", "09:00 — 18:00", false], ["Sábado", "09:00 — 13:00", false], ["Domingo", "Cerrado", true]].map(([d, h, cerrado]) => (
                    <div key={d as string} style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", fontWeight: 700, color: "#1a2a3a", marginBottom: "4px" }}>
                      <span>{d}</span>
                      <span style={{ color: cerrado ? "#e74c3c" : "#27ae60" }}>{h}</span>
                    </div>
                  ))}
                </div>
              )}
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "32px", color: popupCompra === "empresa" ? "#c0392b" : "#d4a017", marginTop: "12px" }}>
                {popupCompra === "anuncios3" ? "$1.000" : popupCompra === "anuncios10" ? "$3.000" : "$10.000"}
              </div>
            </div>
            <button onClick={() => router.push("/comprar")} style={{ width: "100%", background: popupCompra === "empresa" ? "linear-gradient(135deg, #c0392b, #e74c3c)" : "linear-gradient(135deg, #d4a017, #f0c040)", border: "none", borderRadius: "12px", padding: "16px", fontSize: "15px", fontWeight: 800, color: popupCompra === "empresa" ? "#fff" : "#1a2a3a", cursor: "pointer", fontFamily: "'Nunito', sans-serif", letterSpacing: "1px" }}>
              Comprar ahora →
            </button>
            <button onClick={() => setPopupCompra(null)} style={{ width: "100%", background: "none", border: "none", padding: "10px", fontSize: "13px", fontWeight: 800, color: "#9a9a9a", cursor: "pointer", fontFamily: "'Nunito', sans-serif", marginTop: "4px" }}>Cancelar</button>
          </div>
        </div>
      )}

      {/* ══ POPUP FLASH ══ */}
      {popupFlash && (
        <PopupCompra
          tipo="flash"
          tituloAccion="PROMO Flash — Destacar anuncio"
          bitsDisponibles={{ nexo: bits, promo: bitsPromo, free: bitsFree }}
          onClose={() => setPopupFlash(false)}
        />
      )}

      <BottomNav />
    </main>
  );
}

const overlayStyle: React.CSSProperties = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 200 };
const modalStyle: React.CSSProperties = { background: "#fff", borderRadius: "24px 24px 0 0", padding: "24px 20px", width: "100%", maxWidth: "480px", maxHeight: "90vh", overflowY: "auto" };
const btnCerrarStyle: React.CSSProperties = { background: "#f4f4f2", border: "none", borderRadius: "50%", width: "32px", height: "32px", fontSize: "16px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" };
