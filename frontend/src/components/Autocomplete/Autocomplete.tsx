import {
  useState,
  useRef,
  useEffect,
  useId,
  useMemo,
  type ReactNode,
  type KeyboardEvent,
} from 'react';
import { useTranslation } from 'react-i18next';

export interface AutocompleteOption {
  id: string;
  label: string;
  sublabel?: string;
}

interface AutocompleteOptionItemProps {
  option: AutocompleteOption;
  optionId: string;
  isSelected: boolean;
  isActive: boolean;
  prefix: string;
  renderOption?: (option: AutocompleteOption, selected: boolean) => ReactNode;
  onSelect: (id: string) => void;
  onHover: () => void;
}

function AutocompleteOption({
  option,
  optionId,
  isSelected,
  isActive,
  prefix,
  renderOption,
  onSelect,
  onHover,
}: AutocompleteOptionItemProps) {
  return (
    <li
      id={optionId}
      className={`${prefix}__option${isSelected ? ` ${prefix}__option--selected` : ''}${
        isActive ? ` ${prefix}__option--active` : ''
      }`}
      role="option"
      aria-selected={isSelected}
      // preventDefault keeps focus on the input so no blur race — that is what
      // lets us close the dropdown purely from onBlur, no magic timeout needed.
      onMouseDown={(event) => {
        event.preventDefault();
        onSelect(option.id);
      }}
      onMouseEnter={onHover}
    >
      {renderOption ? (
        renderOption(option, isSelected)
      ) : (
        <>
          <span className={`${prefix}__option-label`}>{option.label}</span>
          {option.sublabel && (
            <span className={`${prefix}__option-sublabel`}>{option.sublabel}</span>
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
  const [activeIndex, setActiveIndex] = useState(-1);
  const listboxId = useId();
  const listRef = useRef<HTMLUListElement>(null);

  const selectedOption = options.find((option) => option.id === value);
  const selectedLabel = selectedOption
    ? `${selectedOption.label}${selectedOption.sublabel ? ` — ${selectedOption.sublabel}` : ''}`
    : '';

  const filtered = useMemo(() => {
    if (!search) return options;
    const query = search.toLowerCase();
    return options.filter(
      (option) =>
        option.label.toLowerCase().includes(query) ||
        (option.sublabel ?? '').toLowerCase().includes(query),
    );
  }, [options, search]);

  // Keep the highlighted option scrolled into view while navigating by keyboard.
  useEffect(() => {
    if (activeIndex < 0 || !listRef.current) return;
    const node = listRef.current.children[activeIndex] as HTMLElement | undefined;
    node?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  const openDropdown = () => {
    setSearch('');
    setActiveIndex(-1);
    setOpen(true);
  };

  const closeDropdown = () => {
    setActiveIndex(-1);
    setOpen(false);
  };

  const handleSelect = (id: string) => {
    onChange(id);
    setSearch('');
    closeDropdown();
  };

  const handleClear = () => {
    onChange('');
    setSearch('');
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (!open) {
          openDropdown();
          return;
        }
        setActiveIndex((index) => Math.min(index + 1, filtered.length - 1));
        break;
      case 'ArrowUp':
        if (!open) return;
        event.preventDefault();
        setActiveIndex((index) => Math.max(index - 1, 0));
        break;
      case 'Enter': {
        const active = open && activeIndex >= 0 ? filtered[activeIndex] : undefined;
        if (active) {
          event.preventDefault();
          handleSelect(active.id);
        }
        break;
      }
      case 'Escape':
        if (open) {
          event.preventDefault();
          closeDropdown();
        }
        break;
    }
  };

  return (
    <div className={classNamePrefix}>
      {label && <label className={`${classNamePrefix}__label`}>{label}</label>}
      <div className={`${classNamePrefix}__combobox`}>
        <input
          type="text"
          className={`${classNamePrefix}__input${value ? ` ${classNamePrefix}__input--selected` : ''}`}
          placeholder={selectedLabel || placeholder}
          value={open ? search : ''}
          disabled={disabled}
          role="combobox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={
            open && activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined
          }
          onChange={(event) => {
            setSearch(event.target.value);
            setActiveIndex(-1);
            setOpen(true);
          }}
          onFocus={openDropdown}
          onBlur={closeDropdown}
          onKeyDown={handleKeyDown}
          autoComplete="off"
        />
        {showClear && value && (
          <button
            type="button"
            className={`${classNamePrefix}__clear`}
            onMouseDown={(event) => {
              event.preventDefault();
              handleClear();
            }}
            tabIndex={-1}
            aria-label={t('common.clearSelection')}
          >
            <span aria-hidden>×</span>
          </button>
        )}
      </div>

      {open && (
        <ul id={listboxId} ref={listRef} className={`${classNamePrefix}__dropdown`} role="listbox">
          {filtered.map((option, index) => (
            <AutocompleteOption
              key={option.id}
              optionId={`${listboxId}-option-${index}`}
              option={option}
              isSelected={value === option.id}
              isActive={index === activeIndex}
              prefix={classNamePrefix}
              renderOption={renderOption}
              onSelect={handleSelect}
              onHover={() => setActiveIndex(index)}
            />
          ))}
          {filtered.length === 0 && search && (
            <li className={`${classNamePrefix}__option ${classNamePrefix}__option--empty`}>
              {t('common.noResults')}
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
