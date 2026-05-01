import { useState, useRef, useEffect, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

export interface AutocompleteOption {
  id: string;
  label: string;
  sublabel?: string;
}

interface AutocompleteProps {
  options: AutocompleteOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  classNamePrefix?: string;
  renderOption?: (option: AutocompleteOption, selected: boolean) => ReactNode;
  showClear?: boolean;
  label?: string;
}

export default function Autocomplete({
  options,
  value,
  onChange,
  placeholder,
  disabled,
  classNamePrefix = 'autocomplete',
  renderOption,
  showClear = true,
  label,
}: AutocompleteProps) {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const p = classNamePrefix;

  const selectedOption = options.find((o) => o.id === value);
  const selectedLabel = selectedOption
    ? `${selectedOption.label}${selectedOption.sublabel ? ` — ${selectedOption.sublabel}` : ''}`
    : '';

  const filtered = options.filter((o) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      o.label.toLowerCase().includes(q) ||
      (o.sublabel ?? '').toLowerCase().includes(q)
    );
  });

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (id: string) => {
    onChange(id);
    setSearch('');
    setOpen(false);
  };

  const handleClear = () => {
    onChange('');
    setSearch('');
  };

  return (
    <div ref={containerRef} className={p}>
      {label && <label className={`${p}__label`}>{label}</label>}
      <div className={`${p}__combobox`}>
        <input
          type="text"
          className={`${p}__input${value ? ` ${p}__input--selected` : ''}`}
          placeholder={selectedLabel || placeholder}
          value={open ? search : ''}
          disabled={disabled}
          onChange={(e) => { setSearch(e.target.value); setOpen(true); }}
          onFocus={() => { setSearch(''); setOpen(true); }}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          autoComplete="off"
        />
        {showClear && value && (
          <button
            type="button"
            className={`${p}__clear`}
            onMouseDown={(e) => { e.preventDefault(); handleClear(); }}
            tabIndex={-1}
            aria-label={t('common.clearSelection')}
          >
            <span aria-hidden>×</span>
          </button>
        )}
      </div>

      {open && (
        <ul className={`${p}__dropdown`} role="listbox">
          {filtered.map((o) => {
            const isSelected = value === o.id;
            return (
              <li
                key={o.id}
                className={`${p}__option${isSelected ? ` ${p}__option--selected` : ''}`}
                role="option"
                aria-selected={isSelected}
                onMouseDown={() => handleSelect(o.id)}
              >
                {renderOption ? (
                  renderOption(o, isSelected)
                ) : (
                  <>
                    <span className={`${p}__option-label`}>{o.label}</span>
                    {o.sublabel && (
                      <span className={`${p}__option-sublabel`}>{o.sublabel}</span>
                    )}
                  </>
                )}
              </li>
            );
          })}
          {filtered.length === 0 && search && (
            <li className={`${p}__option ${p}__option--empty`}>
              {t('common.noResults')}
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
