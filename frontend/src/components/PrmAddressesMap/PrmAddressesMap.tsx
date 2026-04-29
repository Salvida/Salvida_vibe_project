import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Address } from '../../types';
import './PrmAddressesMap.css';

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const previewIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const VALIDATION_LABELS: Record<Address['validation_status'], string> = {
  pending: 'Pendiente',
  validated: 'Validada',
  rejected: 'Rechazada',
};

function FitBounds({ positions }: { positions: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (positions.length === 1) {
      map.setView(positions[0], 15);
    } else if (positions.length > 1) {
      map.fitBounds(L.latLngBounds(positions), { padding: [32, 32] });
    }
  }, [map, positions]);
  return null;
}

interface PrmAddressesMapProps {
  addresses: Address[];
  previewAddress?: Partial<Address>;
  height?: string;
}

export default function PrmAddressesMap({
  addresses,
  previewAddress,
  height = '220px',
}: PrmAddressesMapProps) {
  const mappable = addresses.filter((a) => a.lat != null && a.lng != null);
  const hasPreview = previewAddress?.lat != null && previewAddress?.lng != null;

  if (mappable.length === 0 && !hasPreview) return null;

  const existingPositions = mappable.map((a): [number, number] => [a.lat!, a.lng!]);
  const previewPos: [number, number] | null = hasPreview
    ? [previewAddress!.lat!, previewAddress!.lng!]
    : null;

  const allPositions = previewPos ? [...existingPositions, previewPos] : existingPositions;
  const initialCenter = allPositions[0];

  return (
    <div className="prm-addresses-map" style={{ height }}>
      <MapContainer
        center={initialCenter}
        zoom={14}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
        attributionControl={false}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <FitBounds positions={allPositions} />

        {mappable.map((addr) => (
          <Marker key={addr.id} position={[addr.lat!, addr.lng!]}>
            <Popup>
              <div className="prm-addresses-map__popup">
                {addr.alias && (
                  <p className="prm-addresses-map__popup-alias">{addr.alias}</p>
                )}
                <p className="prm-addresses-map__popup-address">{addr.full_address}</p>
                <span className={`prm-addresses-map__popup-badge prm-addresses-map__popup-badge--${addr.validation_status}`}>
                  {VALIDATION_LABELS[addr.validation_status]}
                </span>
              </div>
            </Popup>
          </Marker>
        ))}

        {previewPos && (
          <Marker position={previewPos} icon={previewIcon}>
            <Popup>
              <div className="prm-addresses-map__popup">
                <p className="prm-addresses-map__popup-alias">Nueva dirección</p>
                {previewAddress?.full_address && (
                  <p className="prm-addresses-map__popup-address">
                    {previewAddress.full_address}
                  </p>
                )}
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}
