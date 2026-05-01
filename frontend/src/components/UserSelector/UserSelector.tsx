import { useUsers } from '../../hooks/useProfile';
import type { UserProfile } from '../../types';
import Autocomplete from '../Autocomplete/Autocomplete';
import type { AutocompleteOption } from '../Autocomplete/Autocomplete';
import './UserSelector.css';

interface UserSelectorProps {
  value: string;
  onChange: (userId: string, user: UserProfile) => void;
  label?: string;
  placeholder?: string;
}

function UserOption({ option }: { option: AutocompleteOption }) {
  return (
    <>
      <span className="settings-user-selector__option-name">{option.label}</span>
      {option.sublabel && (
        <span className="settings-user-selector__option-email">{option.sublabel}</span>
      )}
    </>
  );
}

export default function UserSelector({
  value,
  onChange,
  label = 'Usuario',
  placeholder = 'Buscar usuario…',
}: UserSelectorProps) {
  const { data: users = [] } = useUsers(true);

  const options: AutocompleteOption[] = users
    .filter((u) => u.isActive !== false)
    .map((u) => ({
      id: u.id,
      label: [u.firstName, u.lastName].filter(Boolean).join(' '),
      sublabel: u.email ?? undefined,
    }));

  const handleChange = (id: string) => {
    const user = users.find((u) => u.id === id);
    if (user) onChange(id, user);
  };

  return (
    <Autocomplete
      classNamePrefix="settings-user-selector"
      options={options}
      value={value}
      onChange={handleChange}
      placeholder={placeholder}
      label={label}
      renderOption={(o) => <UserOption option={o} />}
    />
  );
}
