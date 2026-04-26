import { useTranslation } from 'react-i18next';
import { useUsers } from '../../hooks/useProfile';
import MultiSelect from '../MultiSelect/MultiSelect';
import type { MultiSelectOption } from '../MultiSelect/MultiSelect';

interface UserMultiSelectProps {
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
}

export default function UserMultiSelect({
  values,
  onChange,
  placeholder,
  disabled,
}: UserMultiSelectProps) {
  const { t } = useTranslation();
  const { data: users = [] } = useUsers(true);

  const options: MultiSelectOption[] = users
    .filter((u) => u.isActive !== false)
    .map((u) => ({
      id: u.id,
      label: [u.firstName, u.lastName].filter(Boolean).join(' '),
      sublabel: u.email ?? undefined,
    }));

  return (
    <MultiSelect
      values={values}
      onChange={onChange}
      options={options}
      placeholder={placeholder ?? t('dashboard.filters.allUsers')}
      disabled={disabled}
    />
  );
}
