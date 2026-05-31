import { useTranslation } from 'react-i18next';
import UserMultiSelect from '../UserMultiSelect/UserMultiSelect';
import PrmMultiSelect from '../PrmMultiSelect/PrmMultiSelect';
import MultiSelect from '../MultiSelect/MultiSelect';
import type { MultiSelectOption } from '../MultiSelect/MultiSelect';
import DateInput from '../DateInput/DateInput';

export interface BookingFilterValues {
  ownerIds: string[];
  prmIds: string[];
  statuses: string[];
  dateFrom: string;
  dateTo: string;
}

export interface FilterBarProps {
  isAdmin: boolean;
  showDateRange?: boolean;
  /** Owner id hint for the PRM list — only meaningful when a single user is selected. */
  singleOwnerId?: string;
  statusOptions: MultiSelectOption[];
  values: BookingFilterValues;
  onChange: (patch: Partial<BookingFilterValues>) => void;
}

export default function FilterBar({
  isAdmin,
  showDateRange,
  singleOwnerId,
  statusOptions,
  values,
  onChange,
}: FilterBarProps) {
  const { t } = useTranslation();

  return (
    <div className="booking-filters">
      {isAdmin && (
        <div className="booking-filters__field">
          <label className="booking-filters__label">{t('dashboard.filters.user')}</label>
          <UserMultiSelect
            values={values.ownerIds}
            onChange={(ownerIds) => onChange({ ownerIds })}
            placeholder={t('dashboard.filters.allUsers')}
          />
        </div>
      )}
      <div className="booking-filters__field">
        <label className="booking-filters__label">{t('dashboard.filters.prm')}</label>
        <PrmMultiSelect
          key={singleOwnerId ?? 'all'}
          values={values.prmIds}
          onChange={(prmIds) => onChange({ prmIds })}
          ownerId={singleOwnerId}
          placeholder={t('dashboard.filters.allPrms')}
        />
      </div>
      <div className="booking-filters__field">
        <label className="booking-filters__label">{t('dashboard.filters.status')}</label>
        <MultiSelect
          values={values.statuses}
          onChange={(statuses) => onChange({ statuses })}
          options={statusOptions}
          placeholder={t('dashboard.filters.allStatuses')}
        />
      </div>
      {showDateRange && (
        <>
          <div className="booking-filters__field">
            <label className="booking-filters__label">{t('dashboard.filters.dateFrom')}</label>
            <DateInput
              value={values.dateFrom}
              onChange={(dateFrom) => onChange({ dateFrom })}
              placeholder={t('dashboard.filters.dateFrom')}
            />
          </div>
          <div className="booking-filters__field">
            <label className="booking-filters__label">{t('dashboard.filters.dateTo')}</label>
            <DateInput
              value={values.dateTo}
              onChange={(dateTo) => onChange({ dateTo })}
              placeholder={t('dashboard.filters.dateTo')}
            />
          </div>
        </>
      )}
    </div>
  );
}
