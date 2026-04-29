import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Check, X, RotateCcw, MapPin, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Address } from '../../types';

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Tri-state: null=pending(grey), true=accessible(green), false=not accessible(red)
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

function FitBounds({ positions }: { positions: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (positions.length === 1) {
      map.setView(positions[0], 15);
    } else if (positions.length > 1) {
      map.fitBounds(L.latLngBounds(positions), { padding: [40, 40] });
    }
  }, [map, positions]);
  return null;
}

interface AddressesMapViewProps {
  addresses: Address[];
  onAssess: (address: Address, is_accessible: boolean | null) => void;
}

export default function AddressesMapView({ addresses, onAssess }: AddressesMapViewProps) {
  const { t } = useTranslation();
  const geocoded = addresses.filter((a) => a.lat != null && a.lng != null);
  const positions = geocoded.map((a) => [a.lat!, a.lng!] as [number, number]);
  const defaultCenter: [number, number] = positions.length > 0 ? positions[0] : [40.4168, -3.7038];

  if (geocoded.length === 0) {
    return (
      <div className="addresses__map-empty">
        <p>{t('addresses.mapEmpty')}</p>
      </div>
    );
  }

  return (
    <div className="addresses__map-full">
      <MapContainer
        center={defaultCenter}
        zoom={12}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        {positions.length > 0 && <FitBounds positions={positions} />}
        {geocoded.map((address) => (
          <Marker
            key={address.id}
            position={[address.lat!, address.lng!]}
            icon={accessibilityIcon(address.is_accessible)}
          >
            <Popup minWidth={230} maxWidth={280}>
              <div className="addr-popup">

                {/* Cabecera: PRM + responsable */}
                <div className="addr-popup__header">
                  {address.prm_name
                    ? <span className="addr-popup__prm">{address.prm_name}</span>
                    : <span className="addr-popup__prm addr-popup__prm--unknown">Sin PMR</span>
                  }
                  {address.owner_name && (
                    <span className="addr-popup__owner">
                      <User size={11} />
                      {address.owner_name}
                    </span>
                  )}
                </div>

                <div className="addr-popup__divider" />

                {/* Dirección */}
                <div className="addr-popup__address">
                  <MapPin size={11} className="addr-popup__pin" />
                  <div>
                    {address.alias && <span className="addr-popup__alias">{address.alias} · </span>}
                    <span className="addr-popup__addr-text">{address.full_address}</span>
                    {(address.floor || address.door) && (
                      <span className="addr-popup__detail">
                        {[address.floor && `Piso ${address.floor}`, address.door && `Pta. ${address.door}`].filter(Boolean).join(' · ')}
                      </span>
                    )}
                  </div>
                </div>

                {/* Badge de aptitud */}
                <div className="addr-popup__badges">
                  {address.is_accessible === null && (
                    <span className="addresses__access-badge addresses__access-badge--pending">
                      {t('addresses.access.pending')}
                    </span>
                  )}
                  {address.is_accessible === true && (
                    <span className="addresses__access-badge addresses__access-badge--yes">
                      ♿ {t('addresses.access.yes')}
                    </span>
                  )}
                  {address.is_accessible === false && (
                    <span className="addresses__access-badge addresses__access-badge--no">
                      {t('addresses.access.no')}
                    </span>
                  )}
                </div>

                {/* Acciones */}
                <div className="addr-popup__actions">
                  {address.is_accessible !== true && (
                    <button className="addr-popup__btn addr-popup__btn--validate" onClick={() => onAssess(address, true)}>
                      <Check size={12} /> {t('addresses.actions.markAccessible')}
                    </button>
                  )}
                  {address.is_accessible !== false && (
                    <button className="addr-popup__btn addr-popup__btn--reject" onClick={() => onAssess(address, false)}>
                      <X size={12} /> {t('addresses.actions.markNotAccessible')}
                    </button>
                  )}
                  {address.is_accessible !== null && (
                    <button className="addr-popup__btn addr-popup__btn--reset" onClick={() => onAssess(address, null)}>
                      <RotateCcw size={12} /> {t('addresses.actions.resetPending')}
                    </button>
                  )}
                </div>

              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
