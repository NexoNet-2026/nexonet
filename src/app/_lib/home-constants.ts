export const FUENTES: Record<string, { label: string; color: string; texto: string }> = {
  nexonet:       { label: "NexoNet",        color: "#d4a017", texto: "#1a2a3a" },
  mercadolibre:  { label: "Mercado Libre",  color: "#ffe600", texto: "#333"    },
  rosariogarage: { label: "Rosario Garage", color: "#ff6b00", texto: "#fff"    },
  olx:           { label: "OLX",            color: "#00a884", texto: "#fff"    },
  otro:          { label: "Externo",        color: "#888",    texto: "#fff"    },
};

export type Anuncio = {
  id: number; titulo: string; precio: number; moneda: string;
  ciudad: string; provincia: string; imagenes: string[];
  flash: boolean; fuente: string; permuto: boolean;
  subrubro: string; rubro: string; usuario_id: string;
  owner_whatsapp?: string;
  owner_insignia_logro?: string;
  visitas_semana?: number;
};

export type Nexo = {
  id: string; titulo: string; descripcion: string; tipo: string;
  ciudad: string; provincia: string; avatar_url: string;
  miembros_count?: number; config?: any;
  visitas_semana?: number;
  owner_insignia_logro?: string;
};

export type Rubro = { id: number; nombre: string };
export type Subrubro = { id: number; nombre: string; rubro_id: number };

export const TIPO_EMOJI: Record<string, string> = {
  grupo: "👥", empresa: "🏢", servicio: "🛠️", trabajo: "💼",
};

export const dropdownItemStyle = (activo: boolean): React.CSSProperties => ({
  display: "flex", alignItems: "center", gap: "12px", padding: "12px 14px",
  cursor: "pointer", background: activo ? "rgba(212,160,23,0.08)" : "transparent",
  borderLeft: activo ? "3px solid #d4a017" : "3px solid transparent",
});

export const formatPrecio = (p: number, m: string) =>
  !p ? "Consultar" : `${m === "USD" ? "U$D" : "$"} ${p.toLocaleString("es-AR")}`;
