import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Check, X, RotateCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Address } from '../../types';

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const STATUS_ICON_URLS: Record<Address['validation_status'], string> = {
  validated: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  pending:   'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
  rejected:  'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
};

function statusIcon(status: Address['validation_status']) {
  return new L.Icon({
    iconUrl: STATUS_ICON_URLS[status],
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
  onValidate: (address: Address, status: Address['validation_status']) => void;
}

export default function AddressesMapView({ addresses, onValidate }: AddressesMapViewProps) {
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
            icon={statusIcon(address.validation_status)}
          >
            <Popup minWidth={220}>
              <div className="addresses__map-popup">
                {address.alias && (
                  <p className="addresses__map-popup__alias">{address.alias}</p>
                )}
                <p className="addresses__map-popup__addr">{address.full_address}</p>
                <span className={`addresses__status-badge addresses__status-badge--${address.validation_status} addresses__map-popup__badge`}>
                  {t(`addresses.status.${address.validation_status}`)}
                </span>
                <div className="addresses__map-popup__actions">
                  {address.validation_status !== 'validated' && (
                    <button
                      className="addresses__action-btn addresses__action-btn--validate"
                      onClick={() => onValidate(address, 'validated')}
                    >
                      <Check size={13} />
                      {t('addresses.actions.validate')}
                    </button>
                  )}
                  {address.validation_status !== 'rejected' && (
                    <button
                      className="addresses__action-btn addresses__action-btn--reject"
                      onClick={() => onValidate(address, 'rejected')}
                    >
                      <X size={13} />
                      {t('addresses.actions.reject')}
                    </button>
                  )}
                  {address.validation_status !== 'pending' && (
                    <button
                      className="addresses__action-btn addresses__action-btn--reset"
                      onClick={() => onValidate(address, 'pending')}
                    >
                      <RotateCcw size={13} />
                      {t('addresses.actions.resetPending')}
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
