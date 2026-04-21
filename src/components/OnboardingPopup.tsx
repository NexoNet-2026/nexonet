"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { PRECIO_NEGOCIO_MENSUAL } from "@/lib/precios";

interface Props {
  perfil: any;
  onClose: () => void;
}

const INTERESES = [
  { key:"comprar",   emoji:"🛒", label:"Comprar o buscar algo",     url:"/buscar" },
  { key:"vender",    emoji:"📣", label:"Publicar un anuncio",       url:"/publicar" },
  { key:"empresa",   emoji:"🏢", label:"Crear mi empresa",          url:"/nexo/crear/empresa" },
  { key:"servicio",  emoji:"🛠️", label:"Ofrecer mis servicios",     url:"/nexo/crear/servicio" },
  { key:"trabajo",   emoji:"💼", label:"Publicar mi perfil laboral", url:"/nexo/crear/trabajo" },
  { key:"grupo",     emoji:"👥", label:"Crear un grupo social",     url:"/nexo/crear/grupo" },
  { key:"conectar",  emoji:"🌐", label:"Conectarme con la sociedad", url:"/buscar" },
];

export default function OnboardingPopup({ perfil, onClose }: Props) {
  const router = useRouter();
  const [paso, setPaso] = useState(1);
  const [interesSeleccionado, setInteresSeleccionado] = useState<string | null>(null);

  const cerrar = async () => {
    await supabase.from("usuarios").update({ onboarding_completado: true }).eq("id", perfil.id);
    onClose();
  };

  const siguiente = () => setPaso(p => p + 1);
  const anterior  = () => setPaso(p => p - 1);

  const irA = async (url: string) => {
    await supabase.from("usuarios").update({ onboarding_completado: true }).eq("id", perfil.id);
    onClose();
    router.push(url);
  };

  const pasos = 5;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 900,
      background: "rgba(0,0,0,0.75)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "16px", fontFamily: "'Nunito',sans-serif",
    }}>
      <div style={{
        width: "100%", maxWidth: "420px",
        background: "#fff", borderRadius: "24px",
        overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
        maxHeight: "90vh", overflowY: "auto",
      }}>

        {/* PROGRESS BAR */}
        <div style={{ height: "4px", background: "#f0f0f0" }}>
          <div style={{
            height: "100%", background: "linear-gradient(90deg,#d4a017,#f0c040)",
            width: `${(paso / pasos) * 100}%`, transition: "width .3s",
          }} />
        </div>

        {/* PASO 1 — BIENVENIDA */}
        {paso === 1 && (
          <div style={{ padding: "32px 24px", textAlign: "center" }}>
            <div style={{ fontSize: "64px", marginBottom: "16px" }}>🎉</div>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "30px", color: "#1a2a3a", letterSpacing: "2px", marginBottom: "8px" }}>
              ¡Bienvenido a NexoNet!
            </div>
            <div style={{ fontSize: "14px", color: "#666", fontWeight: 600, lineHeight: 1.7, marginBottom: "20px" }}>
              Hola <strong style={{ color: "#d4a017" }}>{perfil.nombre_usuario}</strong>, somos la plataforma argentina de conexión entre personas, negocios y comunidades.
            </div>
            <div style={{ background: "linear-gradient(135deg,#1a2a3a,#243b55)", borderRadius: "16px", padding: "16px", marginBottom: "24px" }}>
              <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.55)", fontWeight: 700, marginBottom: "4px" }}>Tu código NexoNet</div>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "24px", color: "#d4a017", letterSpacing: "4px" }}>{perfil.codigo}</div>
              <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", fontWeight: 600, marginTop: "4px" }}>Compartilo y ganá BIT Promotor</div>
            </div>
            <div style={{ background: "rgba(39,174,96,0.08)", border: "2px solid rgba(39,174,96,0.25)", borderRadius: "14px", padding: "14px", marginBottom: "24px", textAlign: "left" }}>
              <div style={{ fontSize: "13px", fontWeight: 900, color: "#27ae60", marginBottom: "6px" }}>🎁 Recibiste 3.000 BIT Free de bienvenida</div>
              <div style={{ fontSize: "12px", color: "#555", fontWeight: 600, lineHeight: 1.5 }}>
                Tus BIT Free son tu saldo inicial para explorar la plataforma y hacer tus primeras conexiones.
              </div>
            </div>
            <button onClick={siguiente} style={{ width: "100%", background: "linear-gradient(135deg,#d4a017,#f0c040)", border: "none", borderRadius: "14px", padding: "16px", fontSize: "15px", fontWeight: 900, color: "#1a2a3a", cursor: "pointer", fontFamily: "'Nunito',sans-serif", boxShadow: "0 4px 0 #a07810" }}>
              Empezar el tour →
            </button>
            <button onClick={cerrar} style={{ marginTop: "10px", background: "none", border: "none", fontSize: "12px", fontWeight: 700, color: "#9a9a9a", cursor: "pointer", fontFamily: "'Nunito',sans-serif" }}>
              Saltar introducción
            </button>
          </div>
        )}

        {/* PASO 2 — QUÉ ES NEXONET */}
        {paso === 2 && (
          <div style={{ padding: "28px 24px" }}>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "24px", color: "#1a2a3a", letterSpacing: "1px", marginBottom: "6px" }}>
              ¿Qué es NexoNet?
            </div>
            <div style={{ fontSize: "13px", color: "#9a9a9a", fontWeight: 600, marginBottom: "20px" }}>
              Una plataforma de conexión entre personas, negocios y comunidades de Argentina.
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "24px" }}>
              {[
                { emoji:"📣", titulo:"Anuncios", desc:"Publicá lo que vendés o buscás y conectate con compradores o vendedores reales." },
                { emoji:"🏢", titulo:"Negocios y Servicios", desc:"Montá la presencia digital de tu negocio o servicio con páginas, descargas y más." },
                { emoji:"👥", titulo:"Grupos", desc:"Creá o unite a grupos de interés: deportivos, de negocios, vecinales y mucho más." },
                { emoji:"💼", titulo:"Trabajo", desc:"Publicá tu perfil laboral y aparecé ante empresas que buscan talento." },
              ].map(item => (
                <div key={item.titulo} style={{ display: "flex", gap: "12px", alignItems: "flex-start", background: "#f9f9f7", borderRadius: "12px", padding: "12px 14px" }}>
                  <span style={{ fontSize: "24px", flexShrink: 0 }}>{item.emoji}</span>
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: 900, color: "#1a2a3a", marginBottom: "2px" }}>{item.titulo}</div>
                    <div style={{ fontSize: "12px", color: "#666", fontWeight: 600, lineHeight: 1.5 }}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={anterior} style={{ flex: 1, background: "#f4f4f2", border: "none", borderRadius: "12px", padding: "13px", fontSize: "13px", fontWeight: 800, color: "#9a9a9a", cursor: "pointer", fontFamily: "'Nunito',sans-serif" }}>← Atrás</button>
              <button onClick={siguiente} style={{ flex: 2, background: "linear-gradient(135deg,#d4a017,#f0c040)", border: "none", borderRadius: "12px", padding: "13px", fontSize: "14px", fontWeight: 900, color: "#1a2a3a", cursor: "pointer", fontFamily: "'Nunito',sans-serif", boxShadow: "0 3px 0 #a07810" }}>Siguiente →</button>
            </div>
          </div>
        )}

        {/* PASO 3 — QUÉ QUERÉS HACER */}
        {paso === 3 && (
          <div style={{ padding: "28px 24px" }}>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "24px", color: "#1a2a3a", letterSpacing: "1px", marginBottom: "6px" }}>
              ¿Qué querés hacer?
            </div>
            <div style={{ fontSize: "13px", color: "#9a9a9a", fontWeight: 600, marginBottom: "16px" }}>
              Elegí tu objetivo principal (podés cambiar después)
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "20px" }}>
              {INTERESES.map(item => (
                <button key={item.key} onClick={() => setInteresSeleccionado(item.key)}
                  style={{
                    display: "flex", alignItems: "center", gap: "12px",
                    background: interesSeleccionado === item.key ? "rgba(212,160,23,0.1)" : "#f9f9f7",
                    border: `2px solid ${interesSeleccionado === item.key ? "#d4a017" : "transparent"}`,
                    borderRadius: "12px", padding: "12px 14px", cursor: "pointer",
                    fontFamily: "'Nunito',sans-serif", textAlign: "left",
                    transition: "all .15s",
                  }}>
                  <span style={{ fontSize: "22px", flexShrink: 0 }}>{item.emoji}</span>
                  <span style={{ fontSize: "13px", fontWeight: interesSeleccionado === item.key ? 900 : 700, color: interesSeleccionado === item.key ? "#d4a017" : "#1a2a3a" }}>{item.label}</span>
                  {interesSeleccionado === item.key && <span style={{ marginLeft: "auto", color: "#d4a017", fontSize: "16px" }}>✓</span>}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={anterior} style={{ flex: 1, background: "#f4f4f2", border: "none", borderRadius: "12px", padding: "13px", fontSize: "13px", fontWeight: 800, color: "#9a9a9a", cursor: "pointer", fontFamily: "'Nunito',sans-serif" }}>← Atrás</button>
              <button onClick={siguiente} style={{ flex: 2, background: "linear-gradient(135deg,#d4a017,#f0c040)", border: "none", borderRadius: "12px", padding: "13px", fontSize: "14px", fontWeight: 900, color: "#1a2a3a", cursor: "pointer", fontFamily: "'Nunito',sans-serif", boxShadow: "0 3px 0 #a07810" }}>Siguiente →</button>
            </div>
          </div>
        )}

        {/* PASO 4 — LOS BIT */}
        {paso === 4 && (
          <div style={{ padding: "28px 24px" }}>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "24px", color: "#1a2a3a", letterSpacing: "1px", marginBottom: "6px" }}>
              ¿Qué son los BIT?
            </div>
            <div style={{ fontSize: "13px", color: "#9a9a9a", fontWeight: 600, marginBottom: "20px" }}>
              La moneda interna de NexoNet
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "24px" }}>
              {[
                { emoji:"💛", tipo:"BIT Nexo",     color:"#d4a017", desc:"Se compran en la tienda. Se usan para publicar, conectar y subir contenido." },
                { emoji:"🔵", tipo:"BIT Free",      color:"#2980b9", desc:"Los 3.000 que recibiste al registrarte. Perfectos para empezar." },
                { emoji:"💚", tipo:"BIT Promotor",  color:"#27ae60", desc:"Los ganás cuando referís nuevos usuarios con tu código. Son reembolsables." },
              ].map(b => (
                <div key={b.tipo} style={{ display: "flex", gap: "12px", alignItems: "flex-start", background: `${b.color}08`, border: `2px solid ${b.color}25`, borderRadius: "12px", padding: "12px 14px" }}>
                  <span style={{ fontSize: "22px", flexShrink: 0 }}>{b.emoji}</span>
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: 900, color: b.color, marginBottom: "2px" }}>{b.tipo}</div>
                    <div style={{ fontSize: "12px", color: "#666", fontWeight: 600, lineHeight: 1.5 }}>{b.desc}</div>
                  </div>
                </div>
              ))}
              <div style={{ background: "#f4f4f2", borderRadius: "12px", padding: "12px 14px" }}>
                <div style={{ fontSize: "12px", fontWeight: 800, color: "#1a2a3a", marginBottom: "6px" }}>💡 ¿Cuándo se usan?</div>
                <div style={{ fontSize: "12px", color: "#555", fontWeight: 600, lineHeight: 1.6 }}>
                  • 1 BIT por cada conexión enviada o recibida<br/>
                  • 500 BIT por subir un archivo o link<br/>
                  • {PRECIO_NEGOCIO_MENSUAL.toLocaleString('es-AR')} BIT/mes por plan empresa o servicio
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={anterior} style={{ flex: 1, background: "#f4f4f2", border: "none", borderRadius: "12px", padding: "13px", fontSize: "13px", fontWeight: 800, color: "#9a9a9a", cursor: "pointer", fontFamily: "'Nunito',sans-serif" }}>← Atrás</button>
              <button onClick={siguiente} style={{ flex: 2, background: "linear-gradient(135deg,#d4a017,#f0c040)", border: "none", borderRadius: "12px", padding: "13px", fontSize: "14px", fontWeight: 900, color: "#1a2a3a", cursor: "pointer", fontFamily: "'Nunito',sans-serif", boxShadow: "0 3px 0 #a07810" }}>Siguiente →</button>
            </div>
          </div>
        )}

        {/* PASO 5 — CTA FINAL */}
        {paso === 5 && (
          <div style={{ padding: "32px 24px", textAlign: "center" }}>
            <div style={{ fontSize: "56px", marginBottom: "16px" }}>🚀</div>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "26px", color: "#1a2a3a", letterSpacing: "1px", marginBottom: "8px" }}>
              ¡Listo para empezar!
            </div>
            <div style={{ fontSize: "13px", color: "#666", fontWeight: 600, lineHeight: 1.7, marginBottom: "24px" }}>
              Explorá NexoNet y encontrá tu lugar en la comunidad argentina
            </div>
            {interesSeleccionado && (() => {
              const item = INTERESES.find(i => i.key === interesSeleccionado);
              if (!item) return null;
              return (
                <button onClick={() => irA(item.url)}
                  style={{ width: "100%", background: "linear-gradient(135deg,#1a2a3a,#243b55)", border: "none", borderRadius: "14px", padding: "16px", fontSize: "15px", fontWeight: 900, color: "#d4a017", cursor: "pointer", fontFamily: "'Nunito',sans-serif", boxShadow: "0 4px 0 #0a1015", marginBottom: "10px", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}>
                  <span style={{ fontSize: "20px" }}>{item.emoji}</span>
                  <span>{item.label} →</span>
                </button>
              );
            })()}
            <button onClick={() => irA("/")}
              style={{ width: "100%", background: "linear-gradient(135deg,#d4a017,#f0c040)", border: "none", borderRadius: "14px", padding: "14px", fontSize: "14px", fontWeight: 900, color: "#1a2a3a", cursor: "pointer", fontFamily: "'Nunito',sans-serif", boxShadow: "0 4px 0 #a07810", marginBottom: "10px" }}>
              🏠 Explorar NexoNet
            </button>
            <button onClick={anterior} style={{ background: "none", border: "none", fontSize: "12px", fontWeight: 700, color: "#9a9a9a", cursor: "pointer", fontFamily: "'Nunito',sans-serif" }}>
              ← Volver
            </button>
          </div>
        )}

        {/* INDICADOR DE PASO */}
        <div style={{ display: "flex", justifyContent: "center", gap: "6px", padding: "0 24px 20px" }}>
          {Array.from({ length: pasos }).map((_, i) => (
            <div key={i} style={{ width: i + 1 === paso ? "20px" : "6px", height: "6px", borderRadius: "3px", background: i + 1 <= paso ? "#d4a017" : "#e8e8e6", transition: "all .2s" }} />
          ))}
        </div>
      </div>
    </div>
  );
}
