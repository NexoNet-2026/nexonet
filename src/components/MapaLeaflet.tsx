"use client";
import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Colores por tipo de publicación
const TIPO_COLOR: Record<string, string> = {
  anuncio:  "#d4a017",
  empresa:  "#c0392b",
  servicio: "#27ae60",
  trabajo:  "#8e44ad",
  grupo:    "#3a7bd5",
};

const TIPO_EMOJI: Record<string, string> = {
  anuncio:  "📣",
  empresa:  "🏢",
  servicio: "🛠️",
  trabajo:  "💼",
  grupo:    "👥",
};

const crearIcono = (flash: boolean, tipo?: string, avatarUrl?: string, abierto?: boolean) => {
  const color  = TIPO_COLOR[tipo||"anuncio"] || "#d4a017";
  const borde  = abierto === true ? "#00ff88" : abierto === false ? "#ff2244" : flash ? "#f0c040" : "#fff";
  const sombra = abierto === true
    ? "0 0 18px #00ff8899, 0 0 8px #00ff8866, 0 4px 12px rgba(0,0,0,0.4)"
    : abierto === false
    ? "0 0 18px #ff224499, 0 0 8px #ff224466, 0 4px 12px rgba(0,0,0,0.4)"
    : flash ? `0 0 12px ${color}99, 0 4px 12px rgba(0,0,0,0.4)` : "0 4px 12px rgba(0,0,0,0.3)";
  const emoji  = TIPO_EMOJI[tipo||"anuncio"] || "📣";

  const interiorHtml = avatarUrl
    ? `<img src="${avatarUrl}" style="width:100%;height:100%;object-fit:cover;border-radius:50% 50% 50% 0;transform:rotate(45deg);" onerror="this.style.display='none';this.nextSibling.style.display='block'"/><span style="display:none;transform:rotate(45deg);font-size:16px;">${emoji}</span>`
    : `<span style="transform:rotate(45deg);font-size:18px;">${emoji}</span>`;

  return L.divIcon({
    html: `
      <div style="
        background: ${color};
        border: 3px solid ${borde};
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        width: 42px; height: 42px;
        display: flex; align-items: center; justify-content: center;
        box-shadow: ${sombra};
        overflow: hidden;
        position: relative;
      ">
        ${interiorHtml}
      </div>
    `,
    className: "",
    iconSize:    [42, 42],
    iconAnchor:  [21, 42],
    popupAnchor: [0, -44],
  });
};

export type Anuncio = {
  id: number;
  titulo: string;
  precio: number;
  moneda: string;
  rubro: string;
  imagenes: string[];
  lat: number;
  lng: number;
  ciudad: string;
  provincia: string;
  flash: boolean;
  tipo?: string;
  avatar_url?: string;
  abierto?: boolean;
};

function FitBounds({ anuncios }: { anuncios: Anuncio[] }) {
  const map = useMap();
  const fitted = useRef(false);
  useEffect(() => {
    if (!fitted.current && anuncios.length > 0) {
      const bounds = L.latLngBounds(anuncios.map((a) => [a.lat, a.lng]));
      map.fitBounds(bounds, { padding: [40, 40] });
      fitted.current = true;
    }
  }, [anuncios, map]);
  return null;
}

function CentrarEn({ coords }: { coords: [number, number] }) {
  const map = useMap();
  const centrado = useRef(false);
  useEffect(() => {
    if (!centrado.current) {
      map.setView(coords, 15);
      centrado.current = true;
    }
  }, [coords, map]);
  return null;
}

export default function MapaLeaflet({
  anuncios,
  onSeleccionar,
  centrarEn,
}: {
  anuncios: Anuncio[];
  onSeleccionar: (a: Anuncio) => void;
  centrarEn?: [number, number] | null;
}) {
  return (
    <MapContainer
      center={[-31.2532, -61.4875]}
      zoom={8}
      style={{ width: "100%", height: "100%", minHeight: "400px" }}
      zoomControl={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {centrarEn
        ? <CentrarEn coords={centrarEn} />
        : <FitBounds anuncios={anuncios} />
      }

      {anuncios.map((a) => (
        <Marker
          key={a.id}
          position={[a.lat, a.lng]}
          icon={crearIcono(a.flash, a.tipo, a.avatar_url, a.abierto)}
          eventHandlers={{ click: () => onSeleccionar(a) }}
        />
      ))}
    </MapContainer>
  );
}
