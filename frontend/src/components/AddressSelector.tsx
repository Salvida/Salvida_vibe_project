import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Search,
  MapPin,
  Loader2,
  ShieldCheck,
  Clock,
  AlertTriangle,
  Accessibility,
  X,
} from 'lucide-react';
import type { Address } from '../types';
import { cn } from '../utils';

const GEOAPIFY_KEY = import.meta.env.VITE_HERE_API_KEY as string;

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

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
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

const VALIDATION_ICONS: Record<
  Address['validation_status'],
  React.ElementType
> = {
  pending: Clock,
  validated: ShieldCheck,
  rejected: AlertTriangle,
};

function composeFullAddress(base: string, floor: string, door: string): string {
  const extras = [floor, door].filter(Boolean).join(', ');
  return extras ? `${base} — ${extras}` : base;
}

export default function AddressSelector({
  value,
  onChange,
  onValidationChange,
  showValidation = false,
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
  const debouncedQuery = useDebounce(query, 300);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Geoapify autocomplete — returns coords directly, no second lookup needed
  useEffect(() => {
    if (selected || !debouncedQuery || debouncedQuery.length < 3) {
      setSuggestions([]);
      setNoResults(false);
      if (!selected) setOpen(false);
      return;
    }

    setLoading(true);
    fetch(
      `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(debouncedQuery)}&lang=es&filter=countrycode:es&limit=6&apiKey=${GEOAPIFY_KEY}`,
    )
      .then((r) => r.json())
      .then((data: { features?: GeoapifyFeature[] }) => {
        const items = data.features ?? [];
        setSuggestions(items);
        setNoResults(items.length === 0);
        setOpen(true);
      })
      .catch(() => {
        setSuggestions([]);
        setNoResults(false);
      })
      .finally(() => setLoading(false));
  }, [debouncedQuery, selected]);

  const handleSelect = useCallback(
    (feature: GeoapifyFeature) => {
      const [lng, lat] = feature.geometry.coordinates;
      const label = feature.properties.formatted;

      setQuery(label);
      setBaseAddress(label);
      setSuggestions([]);
      setNoResults(false);
      setSelected(true);
      setOpen(false);

      onChange({
        ...value,
        full_address: composeFullAddress(label, floor, door),
        lat,
        lng,
        validation_status: value?.validation_status ?? 'pending',
        is_accessible: value?.is_accessible ?? false,
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
    onChange({
      validation_status: value?.validation_status ?? 'pending',
      is_accessible: value?.is_accessible ?? false,
    });
  }, [value, onChange]);

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
    <div className="space-y-3">
      {/* Search input */}
      <div ref={containerRef} className="relative">
        <div className="relative">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            size={16}
          />
          <input
            type="text"
            value={query}
            readOnly={selected}
            onChange={(e) => {
              setQuery(e.target.value);
              if (selected) {
                setSelected(false);
                setBaseAddress('');
                onChange({
                  validation_status: value?.validation_status ?? 'pending',
                  is_accessible: value?.is_accessible ?? false,
                });
              }
            }}
            onFocus={() => {
              if (!selected && suggestions.length > 0) setOpen(true);
            }}
            placeholder="Escribe la dirección con número..."
            className={cn(
              'w-full pl-11 pr-11 py-3 rounded-xl border bg-slate-50 outline-none font-medium text-sm transition-colors',
              selected
                ? 'border-emerald-300 bg-emerald-50/50 text-slate-700 cursor-default'
                : 'border-slate-200 focus:ring-2 focus:ring-[#6b4691] focus:border-[#6b4691]',
            )}
          />
          {loading && (
            <Loader2
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 animate-spin"
              size={16}
            />
          )}
          {selected && !loading && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              aria-label="Cambiar dirección"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Dropdown */}
        {open && (suggestions.length > 0 || noResults) && (
          <ul className="absolute z-[100] mt-1 w-full bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden">
            {suggestions.length > 0 ? (
              suggestions.map((f, idx) => (
                <li
                  key={f.properties.place_id}
                  className={idx > 0 ? 'border-t border-slate-100' : ''}
                >
                  <button
                    type="button"
                    onClick={() => handleSelect(f)}
                    className="w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-[#6b4691]/5 active:bg-[#6b4691]/10 transition-colors"
                  >
                    <MapPin
                      size={14}
                      className="text-[#6b4691] mt-0.5 shrink-0"
                    />
                    <div>
                      <div className="text-sm text-slate-700 leading-snug font-medium">
                        {f.properties.address_line1}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5 leading-snug">
                        {f.properties.address_line2}
                      </div>
                    </div>
                  </button>
                </li>
              ))
            ) : (
              <li className="px-4 py-3">
                <p className="text-xs text-slate-500 mb-2">
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
                      full_address: composeFullAddress(
                        debouncedQuery,
                        floor,
                        door,
                      ),
                      lat: undefined,
                      lng: undefined,
                      validation_status: value?.validation_status ?? 'pending',
                      is_accessible: value?.is_accessible ?? false,
                    });
                  }}
                  className="text-xs font-semibold text-[#6b4691] hover:underline"
                >
                  Usar "{debouncedQuery}" como dirección
                </button>
              </li>
            )}
          </ul>
        )}
      </div>

      {/* Floor / Door — only after address is selected */}
      {selected && (
        <div className="flex gap-2">
          <input
            type="text"
            value={floor}
            onChange={(e) => handleFloorChange(e.target.value)}
            placeholder="Piso (ej: 2º)"
            className="flex-1 py-2.5 px-3 rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-[#6b4691] focus:border-[#6b4691] outline-none text-sm transition-colors"
          />
          <input
            type="text"
            value={door}
            onChange={(e) => handleDoorChange(e.target.value)}
            placeholder="Puerta (ej: A)"
            className="flex-1 py-2.5 px-3 rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-[#6b4691] focus:border-[#6b4691] outline-none text-sm transition-colors"
          />
        </div>
      )}

      {/* Accessible + validation badges */}
      {value?.full_address && (
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() =>
              onChange({ ...value, is_accessible: !value?.is_accessible })
            }
            className={cn(
              'inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold transition-all',
              value?.is_accessible
                ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                : 'bg-slate-50 text-slate-400 border-slate-200 hover:border-slate-300',
            )}
          >
            <Accessibility size={13} />
            Accesible para PMR
          </button>

          {showValidation && (
            <div className="flex items-center gap-2">
              {(
                [
                  'pending',
                  'validated',
                  'rejected',
                ] as Address['validation_status'][]
              ).map((status) => {
                const Icon = VALIDATION_ICONS[status];
                return (
                  <button
                    key={status}
                    type="button"
                    onClick={() => {
                      onChange({ ...value, validation_status: status });
                      onValidationChange?.(status);
                    }}
                    className={cn(
                      'inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-[10px] font-bold uppercase tracking-widest transition-all',
                      validationStatus === status
                        ? VALIDATION_STYLES[status]
                        : 'bg-slate-50 text-slate-400 border-slate-200 hover:border-slate-300',
                    )}
                  >
                    <Icon size={11} />
                    {VALIDATION_LABELS[status]}
                  </button>
                );
              })}
            </div>
          )}

          {!showValidation && (
            <span
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-[10px] font-bold uppercase tracking-widest',
                VALIDATION_STYLES[validationStatus],
              )}
            >
              <ValidationIcon size={11} />
              {VALIDATION_LABELS[validationStatus]}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
