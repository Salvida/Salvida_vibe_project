import { useTranslation } from 'react-i18next';
import { usePrms } from '../../hooks/usePrms';
import MultiSelect from '../MultiSelect/MultiSelect';
import type { MultiSelectOption } from '../MultiSelect/MultiSelect';

interface PrmMultiSelectProps {
  values: string[];
  onChange: (values: string[]) => void;
  /** When set, loads only PRMs belonging to this owner */
  ownerId?: string;
  placeholder?: string;
  disabled?: boolean;
}

export default function PrmMultiSelect({
  values,
  onChange,
  ownerId,
  placeholder,
  disabled,
}: PrmMultiSelectProps) {
  const { t } = useTranslation();
  const { data: prms = [] } = usePrms(undefined, ownerId || undefined);

  const options: MultiSelectOption[] = prms.map((p) => ({
    id: p.id,
    label: p.name,
    sublabel: p.dni ?? undefined,
  }));

  return (
    <MultiSelect
      values={values}
      onChange={onChange}
      options={options}
      placeholder={placeholder ?? t('dashboard.filters.allPrms')}
      disabled={disabled}
    />
  );
}
