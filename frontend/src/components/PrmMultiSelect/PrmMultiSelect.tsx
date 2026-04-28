import { useEffect } from 'react';
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

  // Reset selection whenever the PRM list changes due to owner filter
  useEffect(() => {
    onChange([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ownerId]);

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
