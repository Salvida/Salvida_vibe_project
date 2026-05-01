import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { usePrms } from '../../hooks/usePrms';
import Autocomplete from '../Autocomplete/Autocomplete';
import type { AutocompleteOption } from '../Autocomplete/Autocomplete';
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

  // Reset selection whenever the PRM list changes due to owner filter
  useEffect(() => {
    onChange('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ownerId]);

  const options: AutocompleteOption[] = [
    { id: '', label: t('dashboard.filters.allPrms') },
    ...prms.map((p) => ({
      id: p.id,
      label: p.name,
      sublabel: p.dni ?? undefined,
    })),
  ];

  return (
    <Autocomplete
      classNamePrefix="prm-select"
      options={options}
      value={value}
      onChange={onChange}
      placeholder={placeholder ?? t('dashboard.filters.allPrms')}
      disabled={disabled}
      showClear={false}
    />
  );
}
