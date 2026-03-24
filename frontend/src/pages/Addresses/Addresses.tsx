import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MapPin, Check, X, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';
import Header from '../../components/Header/Header';
import { useAddresses, useValidateAddress } from '../../hooks/useAddresses';
import type { Address } from '../../types';
import AddressMapPreview from './AddressMapPreview';
import './Addresses.css';

type Filter = 'all' | 'pending' | 'validated' | 'rejected';

export default function Addresses() {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<Filter>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const validationStatus = filter === 'all' ? undefined : filter;
  const { data: addresses = [], isLoading } = useAddresses(validationStatus);
  const validateAddress = useValidateAddress();

  function toggleExpand(id: string) {
    setExpandedId(expandedId === id ? null : id);
  }

  function handleValidate(address: Address, status: Address['validation_status']) {
    validateAddress.mutate({ id: address.id, validation_status: status });
  }

  const filters: { key: Filter; label: string }[] = [
    { key: 'all',       label: t('addresses.filterAll') },
    { key: 'pending',   label: t('addresses.filterPending') },
    { key: 'validated', label: t('addresses.filterValidated') },
    { key: 'rejected',  label: t('addresses.filterRejected') },
  ];

  return (
    <div className="addresses">
      <Header
        title={t('addresses.title')}
        subtitle={t('addresses.subtitle')}
      />

      <div className="addresses__body">
        <div className="addresses__inner">

          {/* Filter bar */}
          <div className="addresses__filter-bar">
            {filters.map(({ key, label }) => (
              <button
                key={key}
                className={`addresses__filter-btn${filter === key ? ' addresses__filter-btn--active' : ''}`}
                onClick={() => setFilter(key)}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Table */}
          <div className="addresses__table-wrap">
            {isLoading ? (
              <div className="addresses__loading">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="addresses__skeleton-row">
                    <div className="addresses__skeleton" style={{ width: '60%' }} />
                    <div className="addresses__skeleton" style={{ width: '3rem' }} />
                    <div className="addresses__skeleton" style={{ width: '5rem' }} />
                    <div className="addresses__skeleton" style={{ width: '8rem' }} />
                  </div>
                ))}
              </div>
            ) : addresses.length === 0 ? (
              <div className="addresses__empty">
                <MapPin size={32} />
                <p>{t('addresses.empty')}</p>
              </div>
            ) : (
              <table className="addresses__table">
                <thead>
                  <tr>
                    <th>{t('addresses.columns.address')}</th>
                    <th>{t('addresses.columns.accessible')}</th>
                    <th>{t('addresses.columns.status')}</th>
                    <th>{t('addresses.columns.actions')}</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {addresses.map((address) => (
                    <>
                      <tr key={address.id} className="addresses__row">
                        <td className="addresses__address-cell">
                          <MapPin size={14} className="addresses__pin-icon" />
                          {address.full_address}
                        </td>
                        <td>
                          <span className={`addresses__accessible-badge${address.is_accessible ? ' addresses__accessible-badge--yes' : ' addresses__accessible-badge--no'}`}>
                            {address.is_accessible ? t('addresses.accessible') : t('addresses.notAccessible')}
                          </span>
                        </td>
                        <td>
                          <span className={`addresses__status-badge addresses__status-badge--${address.validation_status}`}>
                            {t(`addresses.status.${address.validation_status}`)}
                          </span>
                        </td>
                        <td>
                          <div className="addresses__action-group">
                            {address.validation_status !== 'validated' && (
                              <button
                                className="addresses__action-btn addresses__action-btn--validate"
                                onClick={() => handleValidate(address, 'validated')}
                                title={t('addresses.actions.validate')}
                              >
                                <Check size={14} />
                                {t('addresses.actions.validate')}
                              </button>
                            )}
                            {address.validation_status !== 'rejected' && (
                              <button
                                className="addresses__action-btn addresses__action-btn--reject"
                                onClick={() => handleValidate(address, 'rejected')}
                                title={t('addresses.actions.reject')}
                              >
                                <X size={14} />
                                {t('addresses.actions.reject')}
                              </button>
                            )}
                            {address.validation_status !== 'pending' && (
                              <button
                                className="addresses__action-btn addresses__action-btn--reset"
                                onClick={() => handleValidate(address, 'pending')}
                                title={t('addresses.actions.resetPending')}
                              >
                                <RotateCcw size={14} />
                                {t('addresses.actions.resetPending')}
                              </button>
                            )}
                          </div>
                        </td>
                        <td>
                          {address.lat && address.lng && (
                            <button
                              className="addresses__expand-btn"
                              onClick={() => toggleExpand(address.id)}
                            >
                              {expandedId === address.id
                                ? <ChevronUp size={16} />
                                : <ChevronDown size={16} />}
                            </button>
                          )}
                        </td>
                      </tr>
                      {expandedId === address.id && address.lat && address.lng && (
                        <tr key={`${address.id}-map`} className="addresses__map-row">
                          <td colSpan={5}>
                            <div className="addresses__map-preview">
                              <AddressMapPreview lat={address.lat} lng={address.lng} height="180px" />
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
