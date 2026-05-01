import { useState, useEffect } from 'react';
import { useUsers } from '../../hooks/useProfile';
import type { UserProfile } from '../../types';
import './UserSelector.css';

interface UserSelectorProps {
  value: string;
  onChange: (userId: string, user: UserProfile) => void;
  label?: string;
  placeholder?: string;
}

export default function UserSelector({
  value,
  onChange,
  label = 'Usuario',
  placeholder = 'Buscar usuario…',
}: UserSelectorProps) {
  const { data: users } = useUsers(true);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState('');

  // Derive label when value is pre-set (e.g. from URL param) and users load
  useEffect(() => {
    if (!value || !users || selectedLabel) return;
    const match = users.find((u) => u.id === value);
    if (match) {
      setSelectedLabel(
        `${match.firstName} ${match.lastName}${match.email ? ` — ${match.email}` : ''}`,
      );
      onChange(match.id, match);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, users, onChange]);

  const filtered = users?.filter((u) => {
    if (u.isActive === false) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      u.firstName?.toLowerCase().includes(q) ||
      u.lastName?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q)
    );
  }) ?? [];

  return (
    <div className="settings-user-selector">
      {label && (
        <label className="settings-user-selector__label">{label}</label>
      )}
      <div className="settings-user-selector__combobox">
        <input
          type="text"
          className="settings-user-selector__input"
          placeholder={selectedLabel || placeholder}
          value={open ? search : ''}
          onChange={(e) => {
            setSearch(e.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            setSearch('');
            setOpen(true);
          }}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          autoComplete="off"
        />
        {open && filtered.length > 0 && (
          <ul className="settings-user-selector__dropdown">
            {filtered.map((u) => (
              <li
                key={u.id}
                className={`settings-user-selector__option${value === u.id ? ' settings-user-selector__option--selected' : ''}`}
                onMouseDown={() => {
                  setSelectedLabel(
                    `${u.firstName} ${u.lastName}${u.email ? ` — ${u.email}` : ''}`,
                  );
                  setSearch('');
                  setOpen(false);
                  onChange(u.id, u);
                }}
              >
                <span className="settings-user-selector__option-name">
                  {u.firstName} {u.lastName}
                </span>
                {u.email && (
                  <span className="settings-user-selector__option-email">
                    {u.email}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
        {open && search.length > 0 && filtered.length === 0 && (
          <ul className="settings-user-selector__dropdown">
            <li className="settings-user-selector__option settings-user-selector__option--empty">
              Sin resultados
            </li>
          </ul>
        )}
      </div>
    </div>
  );
}
