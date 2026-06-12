import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Search,
  MapPin,
  Loader2,
  ShieldCheck,
  Clock,
  AlertTriangle,
  X,
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Address } from '../types';
import { useDebounce } from '../hooks/useDebounce';
import './AddressSelector.css';

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const GEOAPIFY_KEY = import.meta.env.VITE_GEOAPIFY_API_KEY as string;

interface GeoapifyFeature {
  properties: {
    place_id: string;
    formatted: string;
    address_line1: string;
    address_line2: string;
    housenumber?: string;
    street?: string;
  };
  geometry: {
    coordinates: [number, number]; // [lng, lat]
  };
}

interface AddressSelectorProps {
  value: Partial<Address> | undefined;
  onChange: (address: Partial<Address>) => void;
  onValidationChange?: (status: Address['validation_status']) => void;
  showValidation?: boolean;
  showMap?: boolean;
  defaultCenter?: [number, number];
}

const VALIDATION_LABELS: Record<Address['validation_status'], string> = {
  pending: 'Pendiente de validación',
  validated: 'Validada',
  rejected: 'Rechazada',
};

const VALIDATION_ICONS: Record<Address['validation_status'], React.ElementType> = {
  pending: Clock,
  validated: ShieldCheck,
  rejected: AlertTriangle,
};

function composeFullAddress(base: string, floor: string, door: string): string {
  const extras = [floor, door].filter(Boolean).join(', ');
  return extras ? `${base} — ${extras}` : base;
}

function Recenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom());
  }, [lat, lng, map]);
  return null;
}

function MapClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(event) {
      onMapClick(event.latlng.lat, event.latlng.lng);
    },
  });
  return null;
}

export default function AddressSelector({
  value,
  onChange,
  onValidationChange,
  showValidation = false,
  showMap = true,
  defaultCenter,
}: AddressSelectorProps) {
  const [query, setQuery] = useState(value?.full_address ?? '');
  const [baseAddress, setBaseAddress] = useState(value?.full_address ?? '');
  const [suggestions, setSuggestions] = useState<GeoapifyFeature[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [noResults, setNoResults] = useState(false);
  const [selected, setSelected] = useState(!!value?.full_address);
  const [floor, setFloor] = useState(value?.floor ?? '');
  const [door, setDoor] = useState(value?.door ?? '');
  const [markerPos, setMarkerPos] = useState<[number, number] | null>(
    value?.lat != null && value?.lng != null ? [value.lat, value.lng] : null,
  );
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(
    value?.lat != null && value?.lng != null ? [value.lat, value.lng] : null,
  );
  const [reverseLoading, setReverseLoading] = useState(false);
  const debouncedQuery = useDebounce(query, 300);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (selected || !debouncedQuery || debouncedQuery.length < 3) {
      setSuggestions([]);
      setNoResults(false);
      if (!selected) setOpen(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);

    fetch(
      `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(debouncedQuery)}&lang=es&filter=countrycode:es&limit=6&apiKey=${GEOAPIFY_KEY}`,
      { signal: controller.signal },
    )
      .then((r) => r.json())
      .then((data: { features?: GeoapifyFeature[] }) => {
        const items = data.features ?? [];
        setSuggestions(items);
        setNoResults(items.length === 0);
        setOpen(true);
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setSuggestions([]);
        setNoResults(false);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [debouncedQuery, selected]);

  const handleSelect = useCallback(
    (feature: GeoapifyFeature) => {
      const [lng, lat] = feature.geometry.coordinates;
      const label = [feature.properties.address_line1, feature.properties.address_line2]
        .filter(Boolean)
        .join(', ');
      const pos: [number, number] = [lat, lng];

      setQuery(label);
      setBaseAddress(label);
      setSuggestions([]);
      setNoResults(false);
      setSelected(true);
      setOpen(false);
      setMarkerPos(pos);
      setMapCenter(pos);

      onChange({
        ...value,
        full_address: composeFullAddress(label, floor, door),
        lat,
        lng,
        validation_status: value?.validation_status ?? 'pending',
        floor: floor || undefined,
        door: door || undefined,
      });
    },
    [value, onChange, floor, door],
  );

  const handleClear = useCallback(() => {
    setQuery('');
    setBaseAddress('');
    setSelected(false);
    setFloor('');
    setDoor('');
    setSuggestions([]);
    setNoResults(false);
    setOpen(false);
    setMarkerPos(null);
    setMapCenter(null);
    onChange({
      validation_status: value?.validation_status ?? 'pending',
    });
  }, [value, onChange]);

  const handleMapClick = useCallback(
    async (lat: number, lng: number) => {
      setMarkerPos([lat, lng]);
      setReverseLoading(true);
      try {
        const res = await fetch(
          `https://api.geoapify.com/v1/geocode/reverse?lat=${lat}&lon=${lng}&lang=es&apiKey=${GEOAPIFY_KEY}`,
        );
        const data = await res.json() as { features?: GeoapifyFeature[] };
        const feature = data.features?.[0];
        if (feature) {
          const label = [feature.properties.address_line1, feature.properties.address_line2]
            .filter(Boolean)
            .join(', ');
          setQuery(label);
          setBaseAddress(label);
          setSelected(true);
          onChange({
            ...value,
            full_address: composeFullAddress(label, floor, door),
            lat,
            lng,
            validation_status: value?.validation_status ?? 'pending',
            floor: floor || undefined,
            door: door || undefined,
          });
        } else {
          onChange({ ...value, lat, lng });
        }
      } catch {
        // silent — marker position is already updated
      } finally {
        setReverseLoading(false);
      }
    },
    [value, onChange, floor, door],
  );

  const handleFloorChange = (newFloor: string) => {
    setFloor(newFloor);
    if (!selected || !baseAddress) return;
    onChange({
      ...value,
      full_address: composeFullAddress(baseAddress, newFloor, door),
      floor: newFloor || undefined,
    });
  };

  const handleDoorChange = (newDoor: string) => {
    setDoor(newDoor);
    if (!selected || !baseAddress) return;
    onChange({
      ...value,
      full_address: composeFullAddress(baseAddress, floor, newDoor),
      door: newDoor || undefined,
    });
  };

  const validationStatus = value?.validation_status ?? 'pending';
  const ValidationIcon = VALIDATION_ICONS[validationStatus];

  return (
    <div className="address-selector">
      {/* Search input */}
      <div ref={containerRef} className="address-selector__search">
        <div className="address-selector__input-wrap">
          <span className="address-selector__icon-search">
            <Search size={16} />
          </span>
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (selected) {
                setSelected(false);
                setBaseAddress('');
                onChange({
                  validation_status: value?.validation_status ?? 'pending',
                });
              }
            }}
            onFocus={() => {
              if (!selected && suggestions.length > 0) setOpen(true);
            }}
            placeholder="Escribe la dirección con número..."
            className={`address-selector__input${selected ? ' address-selector__input--selected' : ''}`}
          />
          {loading && (
            <span className="address-selector__icon-right address-selector__icon-right--spinner">
              <Loader2 size={16} />
            </span>
          )}
          {selected && !loading && (
            <button
              type="button"
              onClick={handleClear}
              className="address-selector__icon-right"
              aria-label="Cambiar dirección"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Dropdown */}
        {open && (suggestions.length > 0 || noResults) && (
          <ul className="address-selector__dropdown">
            {suggestions.length > 0 ? (
              suggestions.map((f) => (
                <li key={f.properties.place_id} className="address-selector__dropdown-item">
                  <button
                    type="button"
                    onClick={() => handleSelect(f)}
                    className="address-selector__dropdown-btn"
                  >
                    <MapPin size={14} className="address-selector__dropdown-icon" />
                    <div>
                      <div className="address-selector__dropdown-line1">
                        {f.properties.address_line1}
                      </div>
                      <div className="address-selector__dropdown-line2">
                        {f.properties.address_line2}
                      </div>
                    </div>
                  </button>
                </li>
              ))
            ) : (
              <li className="address-selector__no-results">
                <p className="address-selector__no-results-text">
                  Sin resultados para "{debouncedQuery}"
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setBaseAddress(debouncedQuery);
                    setSelected(true);
                    setOpen(false);
                    setNoResults(false);
                    onChange({
                      ...value,
                      full_address: composeFullAddress(debouncedQuery, floor, door),
                      lat: undefined,
                      lng: undefined,
                      validation_status: value?.validation_status ?? 'pending',
                    });
                  }}
                  className="address-selector__use-manual"
                >
                  Usar "{debouncedQuery}" como dirección
                </button>
              </li>
            )}
          </ul>
        )}
      </div>

      {/* Floor / Door */}
      {selected && (
        <div className="address-selector__extras">
          <input
            type="text"
            value={floor}
            onChange={(e) => handleFloorChange(e.target.value)}
            placeholder="Piso (ej: 2º)"
            className="address-selector__extra-input"
          />
          <input
            type="text"
            value={door}
            onChange={(e) => handleDoorChange(e.target.value)}
            placeholder="Puerta (ej: A)"
            className="address-selector__extra-input"
          />
        </div>
      )}

      {/* Interactive map */}
      {showMap && (markerPos ?? defaultCenter) && (
        <div className="address-selector__map">
          <MapContainer
            center={markerPos ?? defaultCenter!}
            zoom={markerPos ? 16 : 12}
            style={{ height: '200px', width: '100%' }}
            scrollWheelZoom={false}
            attributionControl={false}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {markerPos && <Marker position={markerPos} />}
            {mapCenter && <Recenter lat={mapCenter[0]} lng={mapCenter[1]} />}
            <MapClickHandler onMapClick={handleMapClick} />
          </MapContainer>
          {reverseLoading && (
            <div className="address-selector__map-status">
              <Loader2 size={13} className="address-selector__map-status-spinner" />
              <span>Buscando dirección...</span>
            </div>
          )}
        </div>
      )}

      {/* Validation badges */}
      {value?.full_address && (
        <div className="address-selector__badges">
          {showValidation && (
            <>
              {(['pending', 'validated', 'rejected'] as Address['validation_status'][]).map((s) => {
                const Icon = VALIDATION_ICONS[s];
                const isActive = validationStatus === s;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      onChange({ ...value, validation_status: s });
                      onValidationChange?.(s);
                    }}
                    className={`address-selector__badge address-selector__badge--validation-btn${isActive ? ` address-selector__badge--${s}` : ''}`}
                  >
                    <Icon size={11} />
                    {VALIDATION_LABELS[s]}
                  </button>
                );
              })}
            </>
          )}

          {!showValidation && (
            <span className={`address-selector__badge address-selector__badge--validation address-selector__badge--${validationStatus}`}>
              <ValidationIcon size={11} />
              {VALIDATION_LABELS[validationStatus]}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
