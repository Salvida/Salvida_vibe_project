import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { usePrms } from '../../hooks/usePrms';
import './PrmSelect.css';

interface PrmSelectProps {
  value: string;
  onChange: (prmId: string) => void;
  ownerId?: string;
  placeholder?: string;
  disabled?: boolean;
}

export default function PrmSelect({
  value,
  onChange,
  ownerId,
  placeholder,
  disabled,
}: PrmSelectProps) {
  const { t } = useTranslation();
  const { data: prms = [] } = usePrms(undefined, ownerId || undefined);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState('');

  // Sync label when value or prm list changes
  useEffect(() => {
    if (!value) {
      setSelectedLabel('');
      return;
    }
    const match = prms.find((p) => p.id === value);
    if (match) setSelectedLabel(match.name);
  }, [value, prms]);

  // Reset label when ownerId changes (PRMs list changes)
  useEffect(() => {
    onChange('');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ownerId]);

  const filtered = prms.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      (p.dni ?? '').toLowerCase().includes(q)
    );
  });

  const ph = placeholder ?? t('dashboard.filters.allPrms');

  return (
    <div className="prm-select">
      <div className="prm-select__combobox">
        <input
          type="text"
          className="prm-select__input"
          placeholder={selectedLabel || ph}
          value={open ? search : ''}
          disabled={disabled}
          onChange={(e) => { setSearch(e.target.value); setOpen(true); }}
          onFocus={() => { setSearch(''); setOpen(true); }}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          autoComplete="off"
        />
        {open && (
          <ul className="prm-select__dropdown">
            {/* "All" option */}
            <li
              className={`prm-select__option${!value ? ' prm-select__option--selected' : ''}`}
              onMouseDown={() => { onChange(''); setSearch(''); setOpen(false); setSelectedLabel(''); }}
            >
              <span className="prm-select__option-name">{t('dashboard.filters.allPrms')}</span>
            </li>
            {filtered.map((p) => (
              <li
                key={p.id}
                className={`prm-select__option${value === p.id ? ' prm-select__option--selected' : ''}`}
                onMouseDown={() => {
                  onChange(p.id);
                  setSelectedLabel(p.name);
                  setSearch('');
                  setOpen(false);
                }}
              >
                <span className="prm-select__option-name">{p.name}</span>
                {p.dni && <span className="prm-select__option-dni">{p.dni}</span>}
              </li>
            ))}
            {filtered.length === 0 && search && (
              <li className="prm-select__option prm-select__option--empty">
                Sin resultados
              </li>
            )}
          </ul>
        )}
      </div>
    </div>
  );
}
