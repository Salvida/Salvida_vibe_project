import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import { Loader2, Navigation2, AlertCircle } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './RouteMap.css';

// Fix Leaflet default icon paths for Vite
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const pickupIcon = L.divIcon({
  html: `<div style="width:14px;height:14px;border-radius:50%;background:#6b4691;border:2.5px solid white;box-shadow:0 1px 5px rgba(0,0,0,0.35)"></div>`,
  className: '',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

const destinationIcon = L.divIcon({
  html: `<div style="width:14px;height:14px;border-radius:50%;background:#dc2626;border:2.5px solid white;box-shadow:0 1px 5px rgba(0,0,0,0.35)"></div>`,
  className: '',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

interface Props {
  pickup: { lat: number; lng: number };
  destination: { lat: number; lng: number };
}

function FitBounds({ positions }: { positions: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (positions.length >= 2) {
      map.fitBounds(L.latLngBounds(positions), { padding: [40, 40], maxZoom: 15 });
    }
  }, [positions, map]);
  return null;
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}min`;
  return `${m} min`;
}

function formatDistance(meters: number): string {
  return meters >= 1000
    ? `${(meters / 1000).toFixed(1)} km`
    : `${Math.round(meters)} m`;
}

export default function RouteMap({ pickup, destination }: Props) {
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);
  const [distance, setDistance] = useState<number | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(false);
    setRouteCoords([]);
    setDistance(null);
    setDuration(null);

    // OSRM public API — returns GeoJSON polyline, no API key needed
    fetch(
      `https://router.project-osrm.org/route/v1/driving/${pickup.lng},${pickup.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`
    )
      .then((r) => r.json())
      .then((data) => {
        if (data.routes?.length > 0) {
          const route = data.routes[0];
          // GeoJSON = [lng, lat] → Leaflet needs [lat, lng]
          const coords: [number, number][] = route.geometry.coordinates.map(
            ([lng, lat]: [number, number]) => [lat, lng]
          );
          setRouteCoords(coords);
          setDistance(route.distance);
          setDuration(route.duration);
        } else {
          setError(true);
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [pickup.lat, pickup.lng, destination.lat, destination.lng]);

  const boundsPositions: [number, number][] =
    routeCoords.length > 0
      ? routeCoords
      : [[pickup.lat, pickup.lng], [destination.lat, destination.lng]];

  return (
    <div className="route-map">
      {/* Summary bar */}
      <div className="route-map__summary">
        <Navigation2 size={14} className="shrink-0" />
        {loading && <span className="text-slate-500">Calculando ruta...</span>}
        {!loading && error && (
          <>
            <AlertCircle size={13} className="text-amber-500 shrink-0" />
            <span className="text-amber-600">No se pudo calcular la ruta — mostrando puntos</span>
          </>
        )}
        {!loading && !error && distance !== null && (
          <>
            <span>{formatDistance(distance)}</span>
            <span className="route-map__dot">·</span>
            <span>{formatDuration(duration!)}</span>
            <span className="route-map__dot">·</span>
            <span className="route-map__legend">
              <span className="route-map__dot-pickup" /> Recogida
            </span>
            <span className="route-map__legend">
              <span className="route-map__dot-dest" /> Destino
            </span>
          </>
        )}
      </div>

      {/* Map */}
      <div className="route-map__container">
        {loading && (
          <div className="route-map__overlay">
            <Loader2 className="animate-spin text-[#6b4691]" size={24} />
          </div>
        )}
        <MapContainer
          center={[pickup.lat, pickup.lng]}
          zoom={12}
          style={{ height: '100%', width: '100%' }}
          zoomControl={true}
          scrollWheelZoom={false}
          attributionControl={false}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {routeCoords.length > 0 && (
            <Polyline
              positions={routeCoords}
              pathOptions={{ color: '#6b4691', weight: 5, opacity: 0.75 }}
            />
          )}
          <Marker position={[pickup.lat, pickup.lng]} icon={pickupIcon} />
          <Marker position={[destination.lat, destination.lng]} icon={destinationIcon} />
          <FitBounds positions={boundsPositions} />
        </MapContainer>
      </div>
    </div>
  );
}
