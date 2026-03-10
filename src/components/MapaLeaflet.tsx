"use client";
import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const crearIcono = (flash: boolean) => L.divIcon({
  html: `
    <div style="
      background: ${flash ? "#d4a017" : "#1a2a3a"};
      border: 3px solid ${flash ? "#f0c040" : "#fff"};
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      width: 40px; height: 40px;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    ">
      <span style="transform: rotate(45deg); font-size: 18px;">📦</span>
    </div>
  `,
  className: "",
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
});

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

// Centra el mapa en coordenadas específicas (cuando viene desde /anuncios/[id])
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
  const formatPrecio = (precio: number, moneda: string) => {
    if (!precio) return "Consultar";
    return `${moneda === "USD" ? "U$D" : "$"} ${precio.toLocaleString("es-AR")}`;
  };

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

      {/* Si hay centrarEn usamos CentrarEn, si no FitBounds normal */}
      {centrarEn
        ? <CentrarEn coords={centrarEn} />
        : <FitBounds anuncios={anuncios} />
      }

      {anuncios.map((a) => (
        <Marker
          key={a.id}
          position={[a.lat, a.lng]}
          icon={crearIcono(a.flash)}
          eventHandlers={{ click: () => onSeleccionar(a) }}
        >
          <Popup>
            <div style={{ fontFamily: "'Nunito', sans-serif", minWidth: "150px" }}>
              <div style={{ fontWeight: 800, fontSize: "13px", color: "#1a2a3a" }}>{a.titulo}</div>
              <div style={{ fontWeight: 900, fontSize: "15px", color: "#d4a017" }}>{formatPrecio(a.precio, a.moneda)}</div>
              <div style={{ fontSize: "11px", color: "#9a9a9a" }}>📍 {a.ciudad}{a.provincia ? `, ${a.provincia}` : ""}</div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
