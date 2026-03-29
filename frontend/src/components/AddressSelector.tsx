import { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import { Search, MapPin, Loader2, ShieldCheck, Clock, AlertTriangle, Accessibility } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import type { Address } from '../types';
import { cn } from '../utils';

// Fix Leaflet default icon paths for Vite
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

// Inner component to recenter map when position changes
function MapRecenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], 16);
  }, [lat, lng, map]);
  return null;
}

// Inner component to handle map clicks for reverse geocoding
function MapClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

interface AddressSelectorProps {
  value: Partial<Address> | undefined;
  onChange: (address: Partial<Address>) => void;
  onValidationChange?: (status: Address['validation_status']) => void;
  /** Show the validation status toggle (for admin users editing a prm) */
  showValidation?: boolean;
}

const VALIDATION_LABELS: Record<Address['validation_status'], string> = {
  pending: 'Pendiente de validación',
  validated: 'Validada',
  rejected: 'Rechazada',
};

const VALIDATION_STYLES: Record<Address['validation_status'], string> = {
  pending: 'bg-amber-50 text-amber-600 border-amber-200',
  validated: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  rejected: 'bg-red-50 text-red-500 border-red-200',
};

const VALIDATION_ICONS: Record<Address['validation_status'], React.ElementType> = {
  pending: Clock,
  validated: ShieldCheck,
  rejected: AlertTriangle,
};

export default function AddressSelector({
  value,
  onChange,
  onValidationChange,
  showValidation = false,
}: AddressSelectorProps) {
  const [query, setQuery] = useState(value?.full_address ?? '');
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debouncedQuery = useDebounce(query, 400);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Search Nominatim when query changes
  useEffect(() => {
    if (!debouncedQuery || debouncedQuery === value?.full_address) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    if (debouncedQuery.length < 4) return;

    setLoading(true);
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(debouncedQuery)}&limit=5&countrycodes=es&addressdetails=0`;

    fetch(url, { headers: { 'Accept-Language': 'es' } })
      .then((r) => r.json())
      .then((data: NominatimResult[]) => {
        setSuggestions(data);
        setOpen(data.length > 0);
      })
      .catch(() => setSuggestions([]))
      .finally(() => setLoading(false));
  }, [debouncedQuery, value?.full_address]);

  const handleMapClick = useCallback(async (lat: number, lng: number) => {
    setLoading(true);
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;
      const res = await fetch(url, { headers: { 'Accept-Language': 'es' } });
      const data = await res.json();
      const address = data.display_name as string;
      setQuery(address);
      onChange({
        ...value,
        full_address: address,
        lat,
        lng,
        validation_status: value?.validation_status ?? 'pending',
        is_accessible: value?.is_accessible ?? false,
      });
    } catch {
      // silently ignore
    } finally {
      setLoading(false);
    }
  }, [value, onChange]);

  const handleSelect = useCallback((result: NominatimResult) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    setQuery(result.display_name);
    setSuggestions([]);
    setOpen(false);
    onChange({
      ...value,
      full_address: result.display_name,
      lat,
      lng,
      validation_status: value?.validation_status ?? 'pending',
      is_accessible: value?.is_accessible ?? false,
    });
  }, [value, onChange]);

  const handleAccessibleToggle = () => {
    onChange({ ...value, is_accessible: !value?.is_accessible });
  };

  const handleValidationChange = (status: Address['validation_status']) => {
    onChange({ ...value, validation_status: status });
    onValidationChange?.(status);
  };

  const hasCoords = value?.lat != null && value?.lng != null;
  const validationStatus = value?.validation_status ?? 'pending';
  const ValidationIcon = VALIDATION_ICONS[validationStatus];

  return (
    <div className="space-y-4">
      {/* Search input */}
      <div ref={containerRef} className="relative">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => suggestions.length > 0 && setOpen(true)}
            placeholder="Buscar dirección..."
            className="w-full pl-11 pr-11 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-[#6b4691] focus:border-[#6b4691] outline-none font-medium text-sm transition-colors"
          />
          {loading && (
            <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 animate-spin" size={16} />
          )}
        </div>

        {/* Suggestions dropdown */}
        {open && suggestions.length > 0 && (
          <ul className="absolute z-[100] mt-1 w-full bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden">
            {suggestions.map((result, idx) => (
              <li key={result.place_id} className={idx > 0 ? 'border-t border-slate-100' : ''}>
                <button
                  type="button"
                  onClick={() => handleSelect(result)}
                  className="w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-[#6b4691]/5 active:bg-[#6b4691]/10 transition-colors"
                >
                  <MapPin size={14} className="text-[#6b4691] mt-0.5 shrink-0" />
                  <span className="text-sm text-slate-700 leading-snug">{result.display_name}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Map preview — always visible */}
      <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm relative" style={{ height: '13rem' }}>
        {loading && (
          <div className="absolute inset-0 z-[200] flex items-center justify-center bg-white/60 backdrop-blur-sm">
            <Loader2 className="text-[#6b4691] animate-spin" size={22} />
          </div>
        )}
        {!hasCoords && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 500,
              pointerEvents: 'none',
              background: 'rgba(255,255,255,0.75)',
              borderRadius: '9999px',
              padding: '0.35rem 1rem',
              fontSize: '0.8rem',
              fontWeight: 600,
              color: '#374151',
              whiteSpace: 'nowrap',
            }}
          >
            Haz clic en el mapa para seleccionar la ubicación
          </div>
        )}
        <MapContainer
          center={hasCoords ? [value!.lat!, value!.lng!] : [40.4168, -3.7038]}
          zoom={hasCoords ? 16 : 6}
          style={{ height: '100%', width: '100%', cursor: 'crosshair' }}
          zoomControl={true}
          scrollWheelZoom={true}
          attributionControl={false}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          {hasCoords && <Marker position={[value!.lat!, value!.lng!]} />}
          {hasCoords && <MapRecenter lat={value!.lat!} lng={value!.lng!} />}
          <MapClickHandler onMapClick={handleMapClick} />
        </MapContainer>
      </div>

      {/* Options row (accessible + validation) */}
      {value?.full_address && (
        <div className="flex flex-wrap items-center gap-3">
          {/* Accessible toggle */}
          <button
            type="button"
            onClick={handleAccessibleToggle}
            className={cn(
              'inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold transition-all',
              value?.is_accessible
                ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                : 'bg-slate-50 text-slate-400 border-slate-200 hover:border-slate-300'
            )}
          >
            <Accessibility size={13} />
            Accesible para PMR
          </button>

          {/* Validation status selector (admin only) */}
          {showValidation && (
            <div className="flex items-center gap-2">
              {(['pending', 'validated', 'rejected'] as Address['validation_status'][]).map((status) => {
                const Icon = VALIDATION_ICONS[status];
                return (
                  <button
                    key={status}
                    type="button"
                    onClick={() => handleValidationChange(status)}
                    className={cn(
                      'inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-[10px] font-bold uppercase tracking-widest transition-all',
                      validationStatus === status
                        ? VALIDATION_STYLES[status]
                        : 'bg-slate-50 text-slate-400 border-slate-200 hover:border-slate-300'
                    )}
                  >
                    <Icon size={11} />
                    {VALIDATION_LABELS[status]}
                  </button>
                );
              })}
            </div>
          )}

          {/* Read-only badge when showValidation=false */}
          {!showValidation && (
            <span className={cn(
              'inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-[10px] font-bold uppercase tracking-widest',
              VALIDATION_STYLES[validationStatus]
            )}>
              <ValidationIcon size={11} />
              {VALIDATION_LABELS[validationStatus]}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
