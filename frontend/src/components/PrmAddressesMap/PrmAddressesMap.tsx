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

// null = pending (grey), true = accessible (green), false = not accessible (red)
function accessibilityIcon(isAccessible: boolean | null) {
  const url = isAccessible === true
    ? 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png'
    : isAccessible === false
    ? 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png'
    : 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-grey.png';

  return new L.Icon({
    iconUrl: url,
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });
}

const previewIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

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
  defaultCenter?: [number, number];
  height?: string;
}

export default function PrmAddressesMap({
  addresses,
  previewAddress,
  defaultCenter,
  height = '220px',
}: PrmAddressesMapProps) {
  const mappable = addresses.filter((a) => a.lat != null && a.lng != null);
  const hasPreview = previewAddress?.lat != null && previewAddress?.lng != null;

  if (mappable.length === 0 && !hasPreview && !defaultCenter) return null;

  const existingPositions = mappable.map((a): [number, number] => [a.lat!, a.lng!]);
  const previewPos: [number, number] | null = hasPreview
    ? [previewAddress!.lat!, previewAddress!.lng!]
    : null;

  const allPositions = previewPos ? [...existingPositions, previewPos] : existingPositions;
  const initialCenter = allPositions[0] ?? defaultCenter!;

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
        {allPositions.length > 0 && <FitBounds positions={allPositions} />}

        {mappable.map((addr) => (
          <Marker key={addr.id} position={[addr.lat!, addr.lng!]} icon={accessibilityIcon(addr.is_accessible)}>
            <Popup minWidth={200}>
              <div className="prm-addresses-map__popup">
                {addr.alias && (
                  <p className="prm-addresses-map__popup-alias">{addr.alias}</p>
                )}
                <p className="prm-addresses-map__popup-address">{addr.full_address}</p>
                {(addr.floor || addr.door) && (
                  <p className="prm-addresses-map__popup-detail">
                    {[addr.floor && `Piso ${addr.floor}`, addr.door && `Puerta ${addr.door}`].filter(Boolean).join(' · ')}
                  </p>
                )}
                <div className="prm-addresses-map__popup-row">
                  {addr.is_accessible === null && (
                    <span className="prm-addresses-map__popup-badge prm-addresses-map__popup-badge--pending">
                      Pendiente de revisión
                    </span>
                  )}
                  {addr.is_accessible === true && (
                    <span className="prm-addresses-map__popup-badge prm-addresses-map__popup-badge--accessible">
                      ♿ Apta para el servicio
                    </span>
                  )}
                  {addr.is_accessible === false && (
                    <span className="prm-addresses-map__popup-badge prm-addresses-map__popup-badge--not-accessible">
                      No apta para el servicio
                    </span>
                  )}
                </div>
                {addr.validation_notes && (
                  <p className="prm-addresses-map__popup-notes">{addr.validation_notes}</p>
                )}
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
