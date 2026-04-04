import { useState, useEffect } from 'react';
import { Plus, ArrowLeft } from 'lucide-react';
import type { Address } from '../types';
import { usePrmAddresses } from '../hooks/usePrmAddresses';
import AddressSelector from './AddressSelector';
import './PrmAddressPicker.css';

interface PrmAddressPickerProps {
  prmId: string | null;
  value: Partial<Address> | undefined;
  onChange: (addr: Partial<Address>) => void;
  /** Called when user checks "save to PRM" — parent can call useAddPrmAddress on submit */
  onSaveRequest?: (alias: string) => void;
}

export default function PrmAddressPicker({
  prmId,
  value,
  onChange,
  onSaveRequest,
}: PrmAddressPickerProps) {
  const { data: addresses, isLoading } = usePrmAddresses(prmId);

  const [mode, setMode] = useState<'chips' | 'new'>('chips');
  const [selectedChipId, setSelectedChipId] = useState<string | null>(null);
  const [saveToPrm, setSaveToPrm] = useState(false);
  const [alias, setAlias] = useState('');

  // Reset INTERNAL state when PRM changes — do NOT call onChange (parent handles value reset)
  useEffect(() => {
    setMode('chips');
    setSelectedChipId(null);
    setSaveToPrm(false);
    setAlias('');
  }, [prmId]);

  // When a value arrives without an id (e.g. pre-filled from an existing booking),
  // switch to 'new' mode so AddressSelector shows and displays the text.
  useEffect(() => {
    if (value?.full_address && !value?.id) {
      setMode('new');
    }
  }, [value?.full_address, value?.id]);

  // When addresses load, auto-select the chip that matches value.id (if any)
  useEffect(() => {
    if (value?.id && addresses) {
      const match = addresses.find((a) => a.id === value.id);
      if (match) {
        setSelectedChipId(match.id);
        setMode('chips');
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addresses, value?.id]);

  // If no addresses loaded and not loading, go directly to new mode
  const hasAddresses = addresses && addresses.length > 0;

  function selectChip(addr: Address) {
    setSelectedChipId(addr.id);
    setMode('chips');
    onChange({ id: addr.id, full_address: addr.full_address, lat: addr.lat, lng: addr.lng, is_accessible: addr.is_accessible });
    setSaveToPrm(false);
    setAlias('');
    onSaveRequest?.('');
  }

  function openNew() {
    setSelectedChipId(null);
    setMode('new');
    onChange({});
    setSaveToPrm(false);
    setAlias('');
  }

  function handleSaveChange(checked: boolean) {
    setSaveToPrm(checked);
    if (!checked) {
      setAlias('');
      onSaveRequest?.('');
    }
  }

  function handleAliasChange(val: string) {
    setAlias(val);
    if (saveToPrm) {
      onSaveRequest?.(val);
    }
  }

  function handleNewAddress(addr: Partial<Address>) {
    onChange(addr);
    // When a new address is typed/selected, reset save state
    if (!addr.full_address) {
      setSaveToPrm(false);
      setAlias('');
      onSaveRequest?.('');
    }
  }

  const showChips = mode === 'chips' && (isLoading || hasAddresses);

  return (
    <div className="prm-addr-picker">
      {/* Chips row — only shown when PRM has addresses */}
      {showChips && (
        <div className="prm-addr-picker__chips">
          {isLoading ? (
            <>
              <div className="prm-addr-chip prm-addr-chip--skeleton" />
              <div className="prm-addr-chip prm-addr-chip--skeleton" style={{ width: '8rem' }} />
            </>
          ) : (
            addresses!.map((addr) => (
              <button
                key={addr.id}
                type="button"
                className={`prm-addr-chip${selectedChipId === addr.id ? ' prm-addr-chip--active' : ''}`}
                onClick={() => selectChip(addr)}
              >
                <span className="prm-addr-chip__alias">{addr.alias || addr.full_address.split(',')[0]}</span>
                <span className="prm-addr-chip__address">{addr.full_address}</span>
              </button>
            ))
          )}

          {/* Nueva dirección chip */}
          {!isLoading && (
            <button
              type="button"
              className="prm-addr-chip prm-addr-chip--new"
              onClick={openNew}
            >
              <Plus size={14} />
              Nueva dirección
            </button>
          )}
        </div>
      )}

      {/* Address selector — shown in new mode, or when no saved addresses */}
      {(mode === 'new' || (!isLoading && !hasAddresses)) && (
        <>
          {/* Back to saved addresses — only if the PRM actually has some */}
          {mode === 'new' && hasAddresses && (
            <button
              type="button"
              onClick={() => { setMode('chips'); setSelectedChipId(null); onChange({}); setSaveToPrm(false); setAlias(''); onSaveRequest?.(''); }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-primary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              <ArrowLeft size={14} />
              Volver a direcciones guardadas
            </button>
          )}
          <AddressSelector
            value={value ?? {}}
            onChange={handleNewAddress}
            showValidation={false}
          />

          {/* Save to PRM section — only shown when PRM is selected and address is entered */}
          {prmId && value?.full_address && (
            <div className="prm-addr-picker__save">
              <label className="prm-addr-picker__save-check">
                <input
                  type="checkbox"
                  checked={saveToPrm}
                  onChange={(e) => handleSaveChange(e.target.checked)}
                />
                <span className="prm-addr-picker__save-label">Guardar en las direcciones del PRM</span>
              </label>

              {saveToPrm && (
                <input
                  type="text"
                  className="prm-addr-picker__alias-input"
                  placeholder="Alias (ej: Casa, Hospital…)"
                  value={alias}
                  onChange={(e) => handleAliasChange(e.target.value)}
                  maxLength={40}
                />
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
