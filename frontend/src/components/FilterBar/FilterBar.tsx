import { useTranslation } from 'react-i18next';
import UserMultiSelect from '../UserMultiSelect/UserMultiSelect';
import PrmMultiSelect from '../PrmMultiSelect/PrmMultiSelect';
import MultiSelect from '../MultiSelect/MultiSelect';
import type { MultiSelectOption } from '../MultiSelect/MultiSelect';
import DateInput from '../DateInput/DateInput';

export interface FilterBarProps {
  isAdmin: boolean;
  showDateRange?: boolean;
  filterOwnerIds: string[];
  onOwnerChange: (ids: string[]) => void;
  filterPrmIds: string[];
  onPrmChange: (ids: string[]) => void;
  singleOwnerId?: string;
  filterStatuses: string[];
  onStatusChange: (ids: string[]) => void;
  statusOptions: MultiSelectOption[];
  filterDateFrom: string;
  onDateFromChange: (v: string) => void;
  filterDateTo: string;
  onDateToChange: (v: string) => void;
}

export default function FilterBar({
  isAdmin,
  showDateRange,
  filterOwnerIds,
  onOwnerChange,
  filterPrmIds,
  onPrmChange,
  singleOwnerId,
  filterStatuses,
  onStatusChange,
  statusOptions,
  filterDateFrom,
  onDateFromChange,
  filterDateTo,
  onDateToChange,
}: FilterBarProps) {
  const { t } = useTranslation();

  return (
    <div className="booking-filters">
      {isAdmin && (
        <div className="booking-filters__field">
          <label className="booking-filters__label">{t('dashboard.filters.user')}</label>
          <UserMultiSelect
            values={filterOwnerIds}
            onChange={onOwnerChange}
            placeholder={t('dashboard.filters.allUsers')}
          />
        </div>
      )}
      <div className="booking-filters__field">
        <label className="booking-filters__label">{t('dashboard.filters.prm')}</label>
        <PrmMultiSelect
          key={singleOwnerId ?? 'all'}
          values={filterPrmIds}
          onChange={onPrmChange}
          ownerId={singleOwnerId}
          placeholder={t('dashboard.filters.allPrms')}
        />
      </div>
      <div className="booking-filters__field">
        <label className="booking-filters__label">{t('dashboard.filters.status')}</label>
        <MultiSelect
          values={filterStatuses}
          onChange={onStatusChange}
          options={statusOptions}
          placeholder={t('dashboard.filters.allStatuses')}
        />
      </div>
      {showDateRange && (
        <>
          <div className="booking-filters__field">
            <label className="booking-filters__label">{t('dashboard.filters.dateFrom')}</label>
            <DateInput
              value={filterDateFrom}
              onChange={onDateFromChange}
              placeholder={t('dashboard.filters.dateFrom')}
            />
          </div>
          <div className="booking-filters__field">
            <label className="booking-filters__label">{t('dashboard.filters.dateTo')}</label>
            <DateInput
              value={filterDateTo}
              onChange={onDateToChange}
              placeholder={t('dashboard.filters.dateTo')}
            />
          </div>
        </>
      )}
    </div>
  );
}
