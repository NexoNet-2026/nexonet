"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

// ─── Tipos ────────────────────────────────────────────────────────────────────
export type MetodoPago =
  | "bit_free"
  | "bit_nexo"
  | "mercadopago"
  | "credito"
  | "debito";

export type PopupCompraProps = {
  /** Título que aparece arriba, ej: "Ver datos de contacto" */
  titulo: string;
  /** Emoji grande decorativo */
  emoji?: string;
  /** Cuántos BIT cuesta / descripción del costo, ej: "1 BIT" o "$500" */
  costo: string;
  /** Descripción breve de qué se está comprando */
  descripcion?: string;
  /** Saldos disponibles del usuario */
  bits: { free: number; nexo: number; promo: number };
  /** Se llama con el método elegido. Si es BIT el padre ejecuta el gasto. */
  onPagar: (metodo: MetodoPago) => void | Promise<void>;
  onClose: () => void;
};

// ─── Componente ───────────────────────────────────────────────────────────────
export default function PopupCompra({
  titulo,
  emoji = "💳",
  costo,
  descripcion,
  bits,
  onPagar,
  onClose,
}: PopupCompraProps) {
  const [cargando, setCargando] = useState<MetodoPago | null>(null);
  const router = useRouter();

  const pagar = async (metodo: MetodoPago) => {
    if (metodo === "mercadopago" || metodo === "credito" || metodo === "debito") {
      router.push("/tienda");
      return;
    }
    setCargando(metodo);
    await onPagar(metodo);
    setCargando(null);
  };

  const totalBit = (bits.free || 0) + (bits.nexo || 0) + (bits.promo || 0);
  const tieneBits = totalBit > 0;

  return (
    <div
      style={{ position:"fixed", inset:0, zIndex:500,
               background:"rgba(0,0,0,0.65)", display:"flex", alignItems:"flex-end" }}
      onClick={onClose}
    >
      <div
        style={{ width:"100%", background:"#fff", borderRadius:"24px 24px 0 0",
                 padding:"28px 20px 44px", maxHeight:"92vh", overflowY:"auto",
                 fontFamily:"'Nunito',sans-serif", boxShadow:"0 -8px 40px rgba(0,0,0,0.25)" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"20px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:"12px" }}>
            <div style={{ fontSize:"36px" }}>{emoji}</div>
            <div>
              <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"22px",
                             color:"#1a2a3a", letterSpacing:"1px", lineHeight:1.1 }}>
                {titulo}
              </div>
              {descripcion && (
                <div style={{ fontSize:"12px", color:"#9a9a9a", fontWeight:600, marginTop:"3px" }}>
                  {descripcion}
                </div>
              )}
            </div>
          </div>
          <button onClick={onClose}
            style={{ background:"#f0f0f0", border:"none", borderRadius:"50%",
                     width:"34px", height:"34px", fontSize:"16px", cursor:"pointer", flexShrink:0 }}>
            ✕
          </button>
        </div>

        {/* Costo */}
        <div style={{ background:"rgba(212,160,23,0.08)", border:"1px solid rgba(212,160,23,0.25)",
                       borderRadius:"14px", padding:"12px 16px", marginBottom:"20px",
                       display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ fontSize:"13px", fontWeight:700, color:"#666" }}>Costo de esta acción</div>
          <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"24px",
                         color:"#d4a017", letterSpacing:"1px" }}>{costo}</div>
        </div>

        {/* Separador */}
        <div style={{ fontSize:"11px", fontWeight:800, color:"#9a9a9a",
                       textTransform:"uppercase", letterSpacing:"1px", marginBottom:"10px" }}>
          Elegí cómo pagar
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>

          {/* ── 1. BIT FREE ─────────────────────────────────────────────────── */}
          <OpcionPago
            icono="💙"
            label="BIT NexoFree"
            detalle={bits.free > 0 ? `${bits.free.toLocaleString()} disponibles` : "Sin saldo"}
            color="#2980b9"
            disponible={bits.free > 0}
            cargando={cargando === "bit_free"}
            onClick={() => pagar("bit_free")}
          />

          {/* ── 2. BIT NEXONET ──────────────────────────────────────────────── */}
          <OpcionPago
            icono="💛"
            label="BIT NexoNet"
            detalle={bits.nexo > 0 ? `${bits.nexo.toLocaleString()} disponibles` : "Sin saldo"}
            color="#d4a017"
            disponible={bits.nexo > 0}
            cargando={cargando === "bit_nexo"}
            onClick={() => pagar("bit_nexo")}
          />

          {/* Divisor métodos externos */}
          <div style={{ display:"flex", alignItems:"center", gap:"10px", margin:"4px 0" }}>
            <div style={{ flex:1, height:"1px", background:"#e8e8e6" }} />
            <span style={{ fontSize:"11px", fontWeight:700, color:"#bbb" }}>o pagá con</span>
            <div style={{ flex:1, height:"1px", background:"#e8e8e6" }} />
          </div>

          {/* ── 3. Mercado Pago ─────────────────────────────────────────────── */}
          <OpcionPago
            icono="🔵"
            label="Mercado Pago"
            detalle="Transferencia · QR · Saldo MP"
            color="#009ee3"
            disponible={true}
            cargando={cargando === "mercadopago"}
            onClick={() => pagar("mercadopago")}
            externo
          />

          {/* ── 4. Tarjeta de crédito ───────────────────────────────────────── */}
          <OpcionPago
            icono="💳"
            label="Tarjeta de crédito"
            detalle="Visa · Mastercard · Naranja"
            color="#1a2a3a"
            disponible={true}
            cargando={cargando === "credito"}
            onClick={() => pagar("credito")}
            externo
          />

          {/* ── 5. Tarjeta de débito ────────────────────────────────────────── */}
          <OpcionPago
            icono="🟢"
            label="Tarjeta de débito"
            detalle="Visa Débito · Maestro"
            color="#27ae60"
            disponible={true}
            cargando={cargando === "debito"}
            onClick={() => pagar("debito")}
            externo
          />
        </div>

        {/* Nota BIT disponibles */}
        {!tieneBits && (
          <div style={{ marginTop:"16px", background:"rgba(231,76,60,0.06)",
                         border:"1px solid rgba(231,76,60,0.2)", borderRadius:"12px",
                         padding:"10px 14px", fontSize:"12px", fontWeight:600,
                         color:"#c0392b", textAlign:"center" }}>
            No tenés BIT disponibles — usá un método de pago externo
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Opción de pago individual ────────────────────────────────────────────────
function OpcionPago({
  icono, label, detalle, color, disponible, cargando, onClick, externo,
}: {
  icono: string; label: string; detalle: string; color: string;
  disponible: boolean; cargando: boolean;
  onClick: () => void; externo?: boolean;
}) {
  const activo = disponible && !cargando;
  return (
    <button
      onClick={activo ? onClick : undefined}
      disabled={!activo}
      style={{
        width:"100%", border:`2px solid ${disponible ? color+"40" : "#e8e8e6"}`,
        borderRadius:"14px", padding:"14px 16px",
        background: disponible ? `${color}08` : "#f8f8f8",
        display:"flex", alignItems:"center", gap:"14px",
        cursor: activo ? "pointer" : "not-allowed",
        fontFamily:"'Nunito',sans-serif", textAlign:"left",
        opacity: disponible ? 1 : 0.45,
        transition:"all .15s",
      }}
    >
      <div style={{ width:"40px", height:"40px", borderRadius:"12px",
                     background:`${color}18`, display:"flex", alignItems:"center",
                     justifyContent:"center", fontSize:"22px", flexShrink:0 }}>
        {cargando ? "⏳" : icono}
      </div>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:"14px", fontWeight:900, color: disponible ? "#1a2a3a" : "#aaa" }}>
          {label}
        </div>
        <div style={{ fontSize:"11px", fontWeight:600, color:"#9a9a9a", marginTop:"2px" }}>
          {cargando ? "Procesando..." : detalle}
        </div>
      </div>
      {disponible && (
        <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:"3px", flexShrink:0 }}>
          {externo
            ? <span style={{ fontSize:"11px", fontWeight:800, color, background:`${color}15`,
                              borderRadius:"8px", padding:"3px 10px" }}>→</span>
            : <span style={{ fontSize:"11px", fontWeight:800, color:"#27ae60", background:"#e8f8ee",
                              borderRadius:"8px", padding:"3px 10px" }}>✅ Usar</span>
          }
        </div>
      )}
    </button>
  );
}
