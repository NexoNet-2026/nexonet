"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Estado = "pendiente" | "en_proceso" | "aprobada" | "rechazada" | "completada";

type Solicitud = {
  id: string;
  codigo: string;
  nombre_completo: string;
  email: string;
  telefono: string;
  cuit_dni: string;
  tipo_compra: string;
  tipo_compra_otro: string | null;
  fecha_compra: string;
  monto: number | null;
  id_transaccion_mp: string | null;
  motivo: string | null;
  estado: Estado;
  notas_admin: string | null;
  created_at: string;
  updated_at: string;
};

const TIPO_LABEL: Record<string, string> = {
  paquete_anuncios: "Paquete de anuncios",
  anuncio_destacado: "Anuncio destacado",
  suscripcion_nexo: "Suscripcion de nexo",
  conexion_paga: "Conexion paga",
  otra: "Otra",
};

const ESTADO_COLOR: Record<Estado, { bg: string; fg: string; label: string }> = {
  pendiente: { bg: "#fff8e0", fg: "#d4a017", label: "Pendiente" },
  en_proceso: { bg: "#e3f2fd", fg: "#3a7bd5", label: "En proceso" },
  aprobada: { bg: "#e8f5e9", fg: "#27ae60", label: "Aprobada" },
  rechazada: { bg: "#fce4e4", fg: "#c0392b", label: "Rechazada" },
  completada: { bg: "#f0e6f7", fg: "#8e44ad", label: "Completada" },
};

const S = {
  card: { background: "#fff", borderRadius: "16px", padding: "20px", boxShadow: "0 2px 12px rgba(0,0,0,0.07)", marginBottom: "14px" } as React.CSSProperties,
  input: { width: "100%", border: "2px solid #e8e8e6", borderRadius: "10px", padding: "10px 14px", fontSize: "13px", fontFamily: "'Nunito',sans-serif", color: "#2c2c2e", outline: "none", boxSizing: "border-box" as const },
  btn: (c = "#d4a017", light = false) => ({ background: light ? `${c}18` : `linear-gradient(135deg,${c},${c}cc)`, border: light ? `1px solid ${c}44` : "none", borderRadius: "10px", padding: "8px 16px", fontSize: "12px", fontWeight: 900, color: light ? c : "#fff", cursor: "pointer", fontFamily: "'Nunito',sans-serif", whiteSpace: "nowrap" as const } as React.CSSProperties),
  label: { fontSize: "11px", fontWeight: 800, color: "#666", textTransform: "uppercase" as const, letterSpacing: "1px", marginBottom: "5px", display: "block" },
};

export default function AdminArrepentimientos() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [filtroEstado, setFiltroEstado] = useState<Estado | "todos">("todos");
  const [seleccionada, setSeleccionada] = useState<Solicitud | null>(null);
  const [editEstado, setEditEstado] = useState<Estado>("pendiente");
  const [editNotas, setEditNotas] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [loading, setLoading] = useState(true);

  // Verificacion de admin (mismo patron que /admin/login)
  useEffect(() => {
    const verificar = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/admin/login");
        return;
      }
      const { data: u } = await supabase
        .from("usuarios")
        .select("es_admin_sistema")
        .eq("id", user.id)
        .single();
      if (!u?.es_admin_sistema) {
        await supabase.auth.signOut();
        router.push("/admin/login");
        return;
      }
      setAuthChecked(true);
    };
    verificar();
  }, [router]);

  const cargar = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("solicitudes_arrepentimiento")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) {
      setSolicitudes(data as Solicitud[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (authChecked) cargar();
  }, [authChecked, cargar]);

  const abrirModal = (s: Solicitud) => {
    setSeleccionada(s);
    setEditEstado(s.estado);
    setEditNotas(s.notas_admin || "");
  };

  const cerrarModal = () => {
    setSeleccionada(null);
    setEditEstado("pendiente");
    setEditNotas("");
  };

  const guardar = async () => {
    if (!seleccionada) return;
    setGuardando(true);
    const { error } = await supabase
      .from("solicitudes_arrepentimiento")
      .update({
        estado: editEstado,
        notas_admin: editNotas.trim() || null,
      })
      .eq("id", seleccionada.id);
    setGuardando(false);
    if (error) {
      alert("Error guardando: " + error.message);
      return;
    }
    cerrarModal();
    cargar();
  };

  const filtradas = filtroEstado === "todos"
    ? solicitudes
    : solicitudes.filter(s => s.estado === filtroEstado);

  const conteos = {
    todos: solicitudes.length,
    pendiente: solicitudes.filter(s => s.estado === "pendiente").length,
    en_proceso: solicitudes.filter(s => s.estado === "en_proceso").length,
    aprobada: solicitudes.filter(s => s.estado === "aprobada").length,
    rechazada: solicitudes.filter(s => s.estado === "rechazada").length,
    completada: solicitudes.filter(s => s.estado === "completada").length,
  };

  if (!authChecked) {
    return (
      <main style={{ minHeight: "100vh", background: "#0d1a26", display: "flex", alignItems: "center", justifyContent: "center", color: "#9a9a9a", fontFamily: "'Nunito',sans-serif" }}>
        Verificando...
      </main>
    );
  }

  return (
    <main style={{ minHeight: "100vh", background: "#f4f4f2", fontFamily: "'Nunito',sans-serif", paddingBottom: "40px" }}>
      <div style={{ background: "linear-gradient(135deg,#0d1a26,#1a2a3a)", padding: "20px 16px", color: "#fff" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", maxWidth: "1100px", margin: "0 auto" }}>
          <div>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "26px", letterSpacing: "1px", color: "#d4a017" }}>
              🔄 ARREPENTIMIENTOS
            </div>
            <div style={{ fontSize: "12px", color: "#9a9a9a", fontWeight: 700, letterSpacing: "1px" }}>
              Gestion de solicitudes (Res. 424/2020)
            </div>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={cargar} style={S.btn("#3a7bd5", true)}>🔄 Refrescar</button>
            <button onClick={() => router.push("/admin")} style={S.btn("#d4a017", true)}>← Panel</button>
          </div>
        </div>
      </div>

      <div style={{ padding: "16px", maxWidth: "1100px", margin: "0 auto" }}>
        {/* Filtros por estado */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
          <button
            onClick={() => setFiltroEstado("todos")}
            style={{ ...S.btn("#1a2a3a", filtroEstado !== "todos"), padding: "8px 14px" }}
          >
            Todos ({conteos.todos})
          </button>
          {(Object.keys(ESTADO_COLOR) as Estado[]).map(estado => (
            <button
              key={estado}
              onClick={() => setFiltroEstado(estado)}
              style={{ ...S.btn(ESTADO_COLOR[estado].fg, filtroEstado !== estado), padding: "8px 14px" }}
            >
              {ESTADO_COLOR[estado].label} ({conteos[estado]})
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "60px", color: "#9a9a9a", fontWeight: 700 }}>Cargando solicitudes...</div>
        ) : filtradas.length === 0 ? (
          <div style={S.card}>
            <div style={{ textAlign: "center", padding: "40px", color: "#9a9a9a" }}>
              <div style={{ fontSize: "48px", marginBottom: "12px" }}>📭</div>
              <div style={{ fontSize: "14px", fontWeight: 700 }}>No hay solicitudes {filtroEstado !== "todos" ? `en estado "${ESTADO_COLOR[filtroEstado as Estado].label}"` : ""}</div>
            </div>
          </div>
        ) : (
          filtradas.map(s => {
            const color = ESTADO_COLOR[s.estado];
            return (
              <div key={s.id} style={S.card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", flexWrap: "wrap", marginBottom: "10px" }}>
                  <div style={{ flex: 1, minWidth: "200px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px", flexWrap: "wrap" }}>
                      <code style={{ background: "#f4f4f2", padding: "4px 10px", borderRadius: "6px", fontSize: "13px", fontWeight: 700, color: "#1a2a3a" }}>
                        {s.codigo}
                      </code>
                      <span style={{ background: color.bg, color: color.fg, borderRadius: "20px", padding: "3px 10px", fontSize: "11px", fontWeight: 900 }}>
                        {color.label}
                      </span>
                    </div>
                    <div style={{ fontSize: "16px", fontWeight: 800, color: "#1a2a3a", marginBottom: "2px" }}>
                      {s.nombre_completo}
                    </div>
                    <div style={{ fontSize: "12px", color: "#666" }}>
                      {s.email} · {s.telefono} · DNI/CUIT {s.cuit_dni}
                    </div>
                  </div>
                  <button onClick={() => abrirModal(s)} style={S.btn("#d4a017")}>
                    ✏️ Gestionar
                  </button>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "10px", padding: "10px 0", borderTop: "1px solid #f0f0f0", marginTop: "10px" }}>
                  <div>
                    <div style={S.label}>Tipo de compra</div>
                    <div style={{ fontSize: "13px", fontWeight: 700, color: "#1a2a3a" }}>
                      {TIPO_LABEL[s.tipo_compra] || s.tipo_compra}
                      {s.tipo_compra_otro && <span style={{ color: "#666", fontWeight: 500 }}> ({s.tipo_compra_otro})</span>}
                    </div>
                  </div>
                  <div>
                    <div style={S.label}>Fecha compra</div>
                    <div style={{ fontSize: "13px", fontWeight: 700, color: "#1a2a3a" }}>{s.fecha_compra}</div>
                  </div>
                  {s.monto !== null && (
                    <div>
                      <div style={S.label}>Monto</div>
                      <div style={{ fontSize: "13px", fontWeight: 700, color: "#1a2a3a" }}>${s.monto}</div>
                    </div>
                  )}
                  {s.id_transaccion_mp && (
                    <div>
                      <div style={S.label}>ID MercadoPago</div>
                      <div style={{ fontSize: "12px", fontFamily: "monospace", color: "#1a2a3a" }}>{s.id_transaccion_mp}</div>
                    </div>
                  )}
                  <div>
                    <div style={S.label}>Recibida</div>
                    <div style={{ fontSize: "12px", color: "#666" }}>
                      {new Date(s.created_at).toLocaleString("es-AR")}
                    </div>
                  </div>
                </div>

                {s.motivo && (
                  <div style={{ background: "#f4f4f2", padding: "10px 14px", borderRadius: "8px", marginTop: "8px" }}>
                    <div style={S.label}>Motivo del usuario</div>
                    <div style={{ fontSize: "13px", color: "#444", fontStyle: "italic" }}>{s.motivo}</div>
                  </div>
                )}

                {s.notas_admin && (
                  <div style={{ background: "#fff8e0", padding: "10px 14px", borderRadius: "8px", marginTop: "8px", borderLeft: "3px solid #d4a017" }}>
                    <div style={S.label}>Notas internas</div>
                    <div style={{ fontSize: "13px", color: "#444" }}>{s.notas_admin}</div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Modal de gestion */}
      {seleccionada && (
        <div style={{ position: "fixed", inset: 0, zIndex: 900, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }} onClick={cerrarModal}>
          <div style={{ background: "#fff", borderRadius: "20px", padding: "24px", width: "100%", maxWidth: "480px", maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
              <div>
                <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "22px", color: "#1a2a3a", letterSpacing: "1px" }}>
                  Gestionar solicitud
                </div>
                <code style={{ background: "#f4f4f2", padding: "3px 8px", borderRadius: "4px", fontSize: "12px", color: "#666" }}>
                  {seleccionada.codigo}
                </code>
              </div>
              <button onClick={cerrarModal} style={{ background: "#f0f0f0", border: "none", borderRadius: "50%", width: "32px", height: "32px", fontSize: "16px", cursor: "pointer" }}>✕</button>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={S.label}>Estado</label>
              <select
                value={editEstado}
                onChange={e => setEditEstado(e.target.value as Estado)}
                style={S.input}
              >
                {(Object.keys(ESTADO_COLOR) as Estado[]).map(estado => (
                  <option key={estado} value={estado}>{ESTADO_COLOR[estado].label}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={S.label}>Notas internas (no se ven al usuario)</label>
              <textarea
                value={editNotas}
                onChange={e => setEditNotas(e.target.value)}
                placeholder="Ej: Reembolso procesado el 02-05, transaccion MP-12345..."
                style={{ ...S.input, minHeight: "100px", resize: "vertical", fontFamily: "'Nunito',sans-serif" }}
              />
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={cerrarModal} style={{ ...S.btn("#9a9a9a", true), flex: 1, padding: "12px" }}>
                Cancelar
              </button>
              <button onClick={guardar} disabled={guardando} style={{ ...S.btn("#d4a017"), flex: 1, padding: "12px", opacity: guardando ? 0.6 : 1, cursor: guardando ? "not-allowed" : "pointer" }}>
                {guardando ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
