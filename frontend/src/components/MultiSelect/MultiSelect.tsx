import { useState } from 'react';
import { X, Check } from 'lucide-react';
import './MultiSelect.css';

export interface MultiSelectOption {
  id: string;
  label: string;
  sublabel?: string;
}

interface MultiSelectProps {
  values: string[];
  onChange: (values: string[]) => void;
  options: MultiSelectOption[];
  placeholder?: string;
  disabled?: boolean;
}

export default function MultiSelect({
  values,
  onChange,
  options,
  placeholder = 'Seleccionar...',
  disabled,
}: MultiSelectProps) {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);

  const selectedOptions = options.filter((o) => values.includes(o.id));

  // Derive trigger label from selection
  let triggerLabel = '';
  if (selectedOptions.length === 1) {
    triggerLabel = selectedOptions[0]?.label ?? '';
  } else if (selectedOptions.length === 2) {
    triggerLabel = selectedOptions.map((option) => option.label).join(', ');
  } else if (selectedOptions.length > 2) {
    triggerLabel = `${selectedOptions[0]?.label ?? ''}, +${selectedOptions.length - 1} más`;
  }

  const filtered = options.filter((o) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      o.label.toLowerCase().includes(q) ||
      (o.sublabel ?? '').toLowerCase().includes(q)
    );
  });

  function toggle(id: string) {
    if (values.includes(id)) {
      onChange(values.filter((v) => v !== id));
    } else {
      onChange([...values, id]);
    }
  }

  const hasValue = values.length > 0;

  return (
    <div className="multi-select">
      <div className="multi-select__combobox">
        <input
          type="text"
          className={`multi-select__input${hasValue ? ' multi-select__input--has-value' : ''}`}
          placeholder={triggerLabel || placeholder}
          value={open ? search : ''}
          disabled={disabled}
          onChange={(e) => { setSearch(e.target.value); setOpen(true); }}
          onFocus={() => { setSearch(''); setOpen(true); }}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          autoComplete="off"
        />
        {hasValue && (
          <button
            className="multi-select__clear"
            onMouseDown={(e) => { e.preventDefault(); onChange([]); setSearch(''); }}
            tabIndex={-1}
            aria-label="Limpiar selección"
          >
            <X size={11} />
          </button>
        )}
      </div>

      {open && (
        <ul className="multi-select__dropdown">
          {filtered.map((o) => {
            const selected = values.includes(o.id);
            return (
              <li
                key={o.id}
                className={`multi-select__option${selected ? ' multi-select__option--selected' : ''}`}
                onMouseDown={() => toggle(o.id)}
              >
                <span className="multi-select__check">
                  {selected && <Check size={11} />}
                </span>
                <span className="multi-select__option-label">{o.label}</span>
                {o.sublabel && (
                  <span className="multi-select__option-sublabel">{o.sublabel}</span>
                )}
              </li>
            );
          })}
          {filtered.length === 0 && search && (
            <li className="multi-select__option multi-select__option--empty">
              Sin resultados
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
