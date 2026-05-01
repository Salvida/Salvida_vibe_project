import { useState, useRef, useEffect, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

export interface AutocompleteOption {
  id: string;
  label: string;
  sublabel?: string;
}

interface AutocompleteOptionItemProps {
  option: AutocompleteOption;
  isSelected: boolean;
  prefix: string;
  renderOption?: (option: AutocompleteOption, selected: boolean) => ReactNode;
  onSelect: (id: string) => void;
}

function AutocompleteOption({
  option,
  isSelected,
  prefix,
  renderOption,
  onSelect,
}: AutocompleteOptionItemProps) {
  const prefixClass = prefix;
  return (
    <li
      className={`${prefixClass}__option${isSelected ? ` ${prefixClass}__option--selected` : ''}`}
      role="option"
      aria-selected={isSelected}
      onMouseDown={() => onSelect(option.id)}
    >
      {renderOption ? (
        renderOption(option, isSelected)
      ) : (
        <>
          <span className={`${prefixClass}__option-label`}>{option.label}</span>
          {option.sublabel && (
            <span className={`${prefixClass}__option-sublabel`}>{option.sublabel}</span>
          )}
        </>
      )}
    </li>
  );
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

  const prefixClass = classNamePrefix;

  const selectedOption = options.find((option) => option.id === value);
  const selectedLabel = selectedOption
    ? `${selectedOption.label}${selectedOption.sublabel ? ` — ${selectedOption.sublabel}` : ''}`
    : '';

  const filtered = options.filter((option) => {
    if (!search) return true;
    const query = search.toLowerCase();
    return (
      option.label.toLowerCase().includes(query) ||
      (option.sublabel ?? '').toLowerCase().includes(query)
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
    <div ref={containerRef} className={prefixClass}>
      {label && <label className={`${prefixClass}__label`}>{label}</label>}
      <div className={`${prefixClass}__combobox`}>
        <input
          type="text"
          className={`${prefixClass}__input${value ? ` ${prefixClass}__input--selected` : ''}`}
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
            className={`${prefixClass}__clear`}
            onMouseDown={(e) => { e.preventDefault(); handleClear(); }}
            tabIndex={-1}
            aria-label={t('common.clearSelection')}
          >
            <span aria-hidden>×</span>
          </button>
        )}
      </div>

      {open && (
        <ul className={`${prefixClass}__dropdown`} role="listbox">
          {filtered.map((option) => (
            <AutocompleteOption
              key={option.id}
              option={option}
              isSelected={value === option.id}
              prefix={prefixClass}
              renderOption={renderOption}
              onSelect={handleSelect}
            />
          ))}
          {filtered.length === 0 && search && (
            <li className={`${prefixClass}__option ${prefixClass}__option--empty`}>
              {t('common.noResults')}
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
