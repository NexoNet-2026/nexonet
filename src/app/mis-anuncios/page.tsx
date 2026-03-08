"use client";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

type Anuncio = {
  id: number;
  titulo: string;
  imagenes: string[];
  estado: string;
  vistas: number;
  conexiones: number;
  flash: boolean;
  created_at: string;
};

type Plan = "nexofree" | "nexonet" | "nexoempresa";

const SLOTS: Record<Plan, number> = {
  nexofree: 3,
  nexonet: 10,
  nexoempresa: 50,
};

const PLAN_LABELS: Record<Plan, string> = {
  nexofree: "NEXO FREE",
  nexonet: "NEXO NET",
  nexoempresa: "NEXO EMPRESA",
};

const PLAN_COLORS: Record<Plan, string> = {
  nexofree: "#6a8aaa",
  nexonet: "#d4a017",
  nexoempresa: "#c0392b",
};

export default function MisAnuncios() {
  const router = useRouter();
  const [anuncios, setAnuncios] = useState<Anuncio[]>([]);
  const [plan, setPlan] = useState<Plan>("nexofree");
  const [bits, setBits] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargar = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/login"); return; }

      // Cargar datos del usuario
      const { data: usuario } = await supabase
        .from("usuarios")
        .select("bits, plan")
        .eq("id", session.user.id)
        .single();

      if (usuario) {
        setBits(usuario.bits || 0);
        setPlan((usuario.plan as Plan) || "nexofree");
      }

      // Cargar anuncios del usuario
      const { data } = await supabase
        .from("anuncios")
        .select("id, titulo, imagenes, estado, vistas, conexiones, flash, created_at")
        .eq("usuario_id", session.user.id)
        .order("created_at", { ascending: false });

      if (data) setAnuncios(data as Anuncio[]);
      setLoading(false);
    };
    cargar();
  }, []);

  const totalSlots = SLOTS[plan];
  const usados = anuncios.length;
  const disponibles = Math.max(0, totalSlots - usados);

  return (
    <main style={{ paddingTop: "95px", paddingBottom: "130px", background: "#f4f4f2", minHeight: "100vh", fontFamily: "'Nunito', sans-serif" }}>
      <Header />

      {/* ENCABEZADO */}
      <div style={{ background: "linear-gradient(135deg, #1a2a3a 0%, #243b55 100%)", padding: "16px 16px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
          <div>
            <div style={{ fontSize: "18px", fontWeight: 900, color: "#fff" }}>Mis Anuncios</div>
            <div style={{ display: "inline-block", background: PLAN_COLORS[plan], borderRadius: "20px", padding: "2px 10px", marginTop: "4px" }}>
              <span style={{ fontSize: "10px", fontWeight: 900, color: "#fff", letterSpacing: "1px" }}>
                {PLAN_LABELS[plan]}
              </span>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "11px", color: "#8a9aaa", fontWeight: 700 }}>BITS disponibles</div>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "28px", color: "#d4a017" }}>{bits}</div>
          </div>
        </div>

        {/* BARRA DE SLOTS */}
        <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: "12px", padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: "16px" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "26px", color: "#fff" }}>{usados}</div>
              <div style={{ fontSize: "10px", fontWeight: 700, color: "#8a9aaa" }}>PUBLICADOS</div>
            </div>
            <div style={{ width: "1px", background: "rgba(255,255,255,0.15)" }} />
            <div style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "26px", color: disponibles > 0 ? "#d4a017" : "#6a8aaa" }}>{disponibles}</div>
              <div style={{ fontSize: "10px", fontWeight: 700, color: "#8a9aaa" }}>DISPONIBLES</div>
            </div>
            <div style={{ width: "1px", background: "rgba(255,255,255,0.15)" }} />
            <div style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "26px", color: "#fff" }}>{totalSlots}</div>
              <div style={{ fontSize: "10px", fontWeight: 700, color: "#8a9aaa" }}>TOTAL</div>
            </div>
          </div>
          {/* BARRA PROGRESO */}
          <div style={{ flex: 1, marginLeft: "16px" }}>
            <div style={{ height: "8px", background: "rgba(255,255,255,0.15)", borderRadius: "4px", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${(usados / totalSlots) * 100}%`, background: usados >= totalSlots ? "#c0392b" : "#d4a017", borderRadius: "4px", transition: "width .4s" }} />
            </div>
            <div style={{ fontSize: "10px", color: "#8a9aaa", fontWeight: 700, marginTop: "4px", textAlign: "right" }}>
              {usados}/{totalSlots} slots
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: "16px", maxWidth: "480px", margin: "0 auto" }}>

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#9a9a9a", fontWeight: 700 }}>Cargando...</div>
        ) : (
          <>
            {/* ANUNCIOS PUBLICADOS */}
            {anuncios.map((a, i) => (
              <div key={a.id} style={{ background: "#fff", borderRadius: "16px", marginBottom: "12px", overflow: "hidden", boxShadow: "0 2px 10px rgba(0,0,0,0.06)", display: "flex", alignItems: "stretch" }}>

                {/* NÚMERO */}
                <div style={{ width: "44px", background: "linear-gradient(135deg, #1a2a3a, #243b55)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "22px", color: "#d4a017" }}>{i + 1}</span>
                </div>

                {/* IMAGEN */}
                <div style={{ width: "70px", height: "70px", flexShrink: 0, background: "#f4f4f2", display: "flex", alignItems: "center", justifyContent: "center", alignSelf: "center", margin: "8px" }}>
                  {a.imagenes?.[0]
                    ? <img src={a.imagenes[0]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "8px" }} />
                    : <span style={{ fontSize: "28px" }}>📦</span>
                  }
                </div>

                {/* INFO */}
                <div style={{ flex: 1, padding: "10px 8px", minWidth: 0 }}>
                  <div style={{ fontSize: "13px", fontWeight: 800, color: "#1a2a3a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.titulo}</div>
                  <div style={{ display: "flex", gap: "8px", marginTop: "4px", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "11px", color: a.estado === "activo" ? "#2d6a4f" : "#9a9a9a", fontWeight: 700 }}>
                      {a.estado === "activo" ? "✅ PUBLICADO" : "⏸ PAUSADO"}
                    </span>
                    {a.flash && <span style={{ fontSize: "11px", color: "#d4a017", fontWeight: 700 }}>⚡ FLASH</span>}
                  </div>
                  <div style={{ display: "flex", gap: "12px", marginTop: "6px" }}>
                    <span style={{ fontSize: "11px", color: "#666", fontWeight: 600 }}>👁 {a.vistas || 0} vistas</span>
                    <span style={{ fontSize: "11px", color: "#666", fontWeight: 600 }}>🔗 {a.conexiones || 0} conexiones</span>
                  </div>
                </div>

                {/* BITS + ACCIONES */}
                <div style={{ padding: "10px 12px", display: "flex", flexDirection: "column", alignItems: "flex-end", justifyContent: "space-between", flexShrink: 0 }}>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "9px", color: "#9a9a9a", fontWeight: 700 }}>BITS</div>
                    <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "18px", color: "#d4a017" }}>1000</div>
                  </div>
                  <Link href={`/anuncios/${a.id}`} style={{ fontSize: "11px", fontWeight: 800, color: "#1a2a3a", background: "#d4a017", padding: "4px 10px", borderRadius: "8px", textDecoration: "none" }}>
                    Ver →
                  </Link>
                </div>
              </div>
            ))}

            {/* SLOTS DISPONIBLES */}
            {Array.from({ length: disponibles }).map((_, i) => (
              <Link key={`slot-${i}`} href="/publicar" style={{ textDecoration: "none" }}>
                <div style={{ background: "#fff", borderRadius: "16px", marginBottom: "12px", overflow: "hidden", boxShadow: "0 2px 10px rgba(0,0,0,0.06)", display: "flex", alignItems: "stretch", opacity: 0.7, border: "2px dashed #d4a017" }}>

                  {/* NÚMERO */}
                  <div style={{ width: "44px", background: "linear-gradient(135deg, #2d3f50, #3a5068)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "22px", color: "#8a9aaa" }}>{usados + i + 1}</span>
                  </div>

                  {/* IMAGEN VACÍA */}
                  <div style={{ width: "70px", height: "70px", flexShrink: 0, background: "#f4f4f2", display: "flex", alignItems: "center", justifyContent: "center", alignSelf: "center", margin: "8px", borderRadius: "8px", border: "2px dashed #ccc" }}>
                    <span style={{ fontSize: "24px" }}>✕</span>
                  </div>

                  {/* INFO */}
                  <div style={{ flex: 1, padding: "10px 8px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                    <div style={{ fontSize: "13px", fontWeight: 800, color: "#9a9a9a" }}>Publicar anuncio</div>
                    <div style={{ fontSize: "11px", color: "#b0b0b0", fontWeight: 600, marginTop: "2px" }}>DISPONIBLE — tocá para publicar</div>
                  </div>

                  {/* BITS */}
                  <div style={{ padding: "10px 12px", display: "flex", flexDirection: "column", alignItems: "flex-end", justifyContent: "center", flexShrink: 0 }}>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "9px", color: "#9a9a9a", fontWeight: 700 }}>BITS</div>
                      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "18px", color: "#8a9aaa" }}>—</div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}

            {/* UPGRADE DE PLAN */}
            <div style={{ marginTop: "8px", display: "flex", flexDirection: "column", gap: "10px" }}>

              {plan === "nexofree" && (
                <>
                  <div style={{ background: "linear-gradient(135deg, #1a2a3a, #243b55)", borderRadius: "16px", padding: "16px 20px", display: "flex", alignItems: "center", gap: "14px" }}>
                    <div style={{ width: "44px", height: "44px", borderRadius: "50%", background: "rgba(212,160,23,0.2)", border: "2px solid #d4a017", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", flexShrink: 0 }}>➕</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "10px", fontWeight: 700, color: "#8a9aaa", letterSpacing: "1px" }}>USUARIO NEXO NET</div>
                      <div style={{ fontSize: "14px", fontWeight: 900, color: "#fff" }}>BIT Anuncios <span style={{ color: "#d4a017" }}>× 3</span></div>
                      <div style={{ fontSize: "11px", color: "#8a9aaa" }}>Sumá 3 anuncios más</div>
                    </div>
                    <button style={{ background: "linear-gradient(135deg, #d4a017, #f0c040)", border: "none", borderRadius: "10px", padding: "8px 14px", fontSize: "12px", fontWeight: 900, color: "#1a2a3a", cursor: "pointer", fontFamily: "'Nunito', sans-serif", whiteSpace: "nowrap" }}>
                      Comprar
                    </button>
                  </div>

                  <div style={{ background: "linear-gradient(135deg, #1a2a3a, #243b55)", borderRadius: "16px", padding: "16px 20px", display: "flex", alignItems: "center", gap: "14px" }}>
                    <div style={{ width: "44px", height: "44px", borderRadius: "50%", background: "rgba(212,160,23,0.2)", border: "2px solid #d4a017", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", flexShrink: 0 }}>➕</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "10px", fontWeight: 700, color: "#8a9aaa", letterSpacing: "1px" }}>USUARIO NEXO NET</div>
                      <div style={{ fontSize: "14px", fontWeight: 900, color: "#fff" }}>BIT Anuncios <span style={{ color: "#d4a017" }}>× 10</span></div>
                      <div style={{ fontSize: "11px", color: "#8a9aaa" }}>Pasá a 10 anuncios</div>
                    </div>
                    <button style={{ background: "linear-gradient(135deg, #d4a017, #f0c040)", border: "none", borderRadius: "10px", padding: "8px 14px", fontSize: "12px", fontWeight: 900, color: "#1a2a3a", cursor: "pointer", fontFamily: "'Nunito', sans-serif", whiteSpace: "nowrap" }}>
                      Comprar
                    </button>
                  </div>

                  <div style={{ background: "linear-gradient(135deg, #2c1a1a, #4a2020)", borderRadius: "16px", padding: "16px 20px", display: "flex", alignItems: "center", gap: "14px" }}>
                    <div style={{ width: "44px", height: "44px", borderRadius: "50%", background: "rgba(192,57,43,0.3)", border: "2px solid #c0392b", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", flexShrink: 0 }}>➕</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "10px", fontWeight: 700, color: "#e88a8a", letterSpacing: "1px" }}>USUARIO NEXO EMPRESA</div>
                      <div style={{ fontSize: "14px", fontWeight: 900, color: "#fff" }}>BIT Empresa <span style={{ color: "#f0a040" }}>× 50</span></div>
                      <div style={{ fontSize: "11px", color: "#e88a8a" }}>50 anuncios + perfil empresa + horarios</div>
                    </div>
                    <button style={{ background: "linear-gradient(135deg, #c0392b, #e74c3c)", border: "none", borderRadius: "10px", padding: "8px 14px", fontSize: "12px", fontWeight: 900, color: "#fff", cursor: "pointer", fontFamily: "'Nunito', sans-serif", whiteSpace: "nowrap" }}>
                      Comprar
                    </button>
                  </div>
                </>
              )}

              {plan === "nexonet" && (
                <div style={{ background: "linear-gradient(135deg, #2c1a1a, #4a2020)", borderRadius: "16px", padding: "16px 20px", display: "flex", alignItems: "center", gap: "14px" }}>
                  <div style={{ width: "44px", height: "44px", borderRadius: "50%", background: "rgba(192,57,43,0.3)", border: "2px solid #c0392b", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", flexShrink: 0 }}>➕</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "10px", fontWeight: 700, color: "#e88a8a", letterSpacing: "1px" }}>USUARIO NEXO EMPRESA</div>
                    <div style={{ fontSize: "14px", fontWeight: 900, color: "#fff" }}>BIT Empresa <span style={{ color: "#f0a040" }}>× 50</span></div>
                    <div style={{ fontSize: "11px", color: "#e88a8a" }}>50 anuncios + perfil empresa + horarios</div>
                  </div>
                  <button style={{ background: "linear-gradient(135deg, #c0392b, #e74c3c)", border: "none", borderRadius: "10px", padding: "8px 14px", fontSize: "12px", fontWeight: 900, color: "#fff", cursor: "pointer", fontFamily: "'Nunito', sans-serif", whiteSpace: "nowrap" }}>
                    Comprar
                  </button>
                </div>
              )}

            </div>
          </>
        )}
      </div>
      <BottomNav />
    </main>
  );
}
