import { useTranslation } from 'react-i18next';
import type { Address } from '../../types';
import './AddressAccessibilityBadge.css';

interface Props {
  value: Address['is_accessible'];
  className?: string;
}

export default function AddressAccessibilityBadge({ value, className }: Props) {
  const { t } = useTranslation();

  if (value === null || value === undefined) {
    return (
      <span className={`addr-access-badge addr-access-badge--pending ${className ?? ''}`}>
        {t('addresses.access.pending')}
      </span>
    );
  }

  if (value) {
    return (
      <span className={`addr-access-badge addr-access-badge--yes ${className ?? ''}`}>
        ♿ {t('addresses.access.yes')}
      </span>
    );
  }

  return (
    <span className={`addr-access-badge addr-access-badge--no ${className ?? ''}`}>
      {t('addresses.access.no')}
    </span>
  );
}
