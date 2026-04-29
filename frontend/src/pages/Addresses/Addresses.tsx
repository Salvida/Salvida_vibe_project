import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MapPin, Check, X, RotateCcw, ChevronDown, ChevronUp, List, Map } from 'lucide-react';
import Header from '../../components/Header/Header';
import { useAddresses, useValidateAddress } from '../../hooks/useAddresses';
import type { AccessibilityFilter } from '../../hooks/useAddresses';
import type { Address } from '../../types';
import AddressMapPreview from './AddressMapPreview';
import AddressesMapView from './AddressesMapView';
import UserMultiSelect from '../../components/UserMultiSelect/UserMultiSelect';
import PrmMultiSelect from '../../components/PrmMultiSelect/PrmMultiSelect';
import './Addresses.css';

type ViewMode = 'list' | 'map';

function AccessibilityBadge({ value }: { value: boolean | null }) {
  const { t } = useTranslation();
  if (value === null) return (
    <span className="addresses__access-badge addresses__access-badge--pending">
      {t('addresses.access.pending')}
    </span>
  );
  if (value) return (
    <span className="addresses__access-badge addresses__access-badge--yes">
      ♿ {t('addresses.access.yes')}
    </span>
  );
  return (
    <span className="addresses__access-badge addresses__access-badge--no">
      {t('addresses.access.no')}
    </span>
  );
}

export default function Addresses() {
  const { t } = useTranslation();
  const [filter, setFilter]           = useState<AccessibilityFilter | 'all'>('all');
  const [viewMode, setViewMode]       = useState<ViewMode>('list');
  const [expandedId, setExpandedId]   = useState<string | null>(null);
  const [ownerIds, setOwnerIds]       = useState<string[]>([]);
  const [prmIds, setPrmIds]           = useState<string[]>([]);

  // When user selection changes, reset PRM filter
  function handleOwnerChange(ids: string[]) {
    setOwnerIds(ids);
    setPrmIds([]);
  }

  // Hint: only narrow PRM list when exactly 1 user is selected
  const singleOwnerId = ownerIds.length === 1 ? ownerIds[0] : undefined;

  const accessibility = filter === 'all' ? undefined : filter;
  const { data: addresses = [], isLoading } = useAddresses({
    accessibility,
    ownerIds,
    prmIds,
  });
  const validateAddress = useValidateAddress();

  function toggleExpand(id: string) {
    setExpandedId(expandedId === id ? null : id);
  }

  function handleAssess(address: Address, is_accessible: boolean | null) {
    validateAddress.mutate({ id: address.id, is_accessible });
  }

  const accessFilters: { key: AccessibilityFilter | 'all'; label: string }[] = [
    { key: 'all',            label: t('addresses.filterAll') },
    { key: 'pending',        label: t('addresses.filterPending') },
    { key: 'accessible',     label: t('addresses.filterAccessible') },
    { key: 'not_accessible', label: t('addresses.filterNotAccessible') },
  ];

  return (
    <div className="addresses">
      <Header
        title={t('addresses.title')}
        subtitle={t('addresses.subtitle')}
      />

      <div className="addresses__body">
        <div className="addresses__inner">

          {/* Toolbar: filters + view toggle */}
          <div className="addresses__toolbar">
            <div className="addresses__filter-bar">
              {accessFilters.map(({ key, label }) => (
                <button
                  key={key}
                  className={`addresses__filter-btn${filter === key ? ' addresses__filter-btn--active' : ''}`}
                  onClick={() => setFilter(key)}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="addresses__view-toggle">
              <button
                className={`addresses__view-btn${viewMode === 'list' ? ' addresses__view-btn--active' : ''}`}
                onClick={() => setViewMode('list')}
                title={t('addresses.viewList')}
              >
                <List size={16} />
              </button>
              <button
                className={`addresses__view-btn${viewMode === 'map' ? ' addresses__view-btn--active' : ''}`}
                onClick={() => setViewMode('map')}
                title={t('addresses.viewMap')}
              >
                <Map size={16} />
              </button>
            </div>
          </div>

          {/* Entity filters: user + PRM */}
          <div className="addresses__entity-filters">
            <div className="addresses__entity-filter">
              <label className="addresses__entity-filter__label">
                {t('addresses.filters.user')}
              </label>
              <UserMultiSelect
                values={ownerIds}
                onChange={handleOwnerChange}
                placeholder={t('addresses.filters.allUsers')}
              />
            </div>
            <div className="addresses__entity-filter">
              <label className="addresses__entity-filter__label">
                {t('addresses.filters.prm')}
              </label>
              <PrmMultiSelect
                values={prmIds}
                onChange={setPrmIds}
                ownerId={singleOwnerId}
                placeholder={t('addresses.filters.allPrms')}
              />
            </div>
          </div>

          {/* Map view */}
          {viewMode === 'map' && (
            <AddressesMapView
              addresses={addresses}
              onAssess={handleAssess}
            />
          )}

          {/* List view */}
          {viewMode === 'list' && (
            <div className="addresses__table-wrap">
              {isLoading ? (
                <div className="addresses__loading">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="addresses__skeleton-row">
                      <div className="addresses__skeleton" style={{ width: '60%' }} />
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
                      <th>{t('addresses.columns.accessibility')}</th>
                      <th>{t('addresses.columns.actions')}</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {addresses.map((address) => (
                      <React.Fragment key={address.id}>
                        <tr className="addresses__row">
                          <td className="addresses__address-cell">
                            <MapPin size={14} className="addresses__pin-icon" />
                            <div>
                              {address.alias && (
                                <span className="addresses__alias">{address.alias}</span>
                              )}
                              <span>{address.full_address}</span>
                            </div>
                          </td>
                          <td>
                            <AccessibilityBadge value={address.is_accessible} />
                          </td>
                          <td>
                            <div className="addresses__action-group">
                              {address.is_accessible !== true && (
                                <button
                                  className="addresses__action-btn addresses__action-btn--validate"
                                  onClick={() => handleAssess(address, true)}
                                  title={t('addresses.actions.markAccessible')}
                                >
                                  <Check size={14} />
                                  {t('addresses.actions.markAccessible')}
                                </button>
                              )}
                              {address.is_accessible !== false && (
                                <button
                                  className="addresses__action-btn addresses__action-btn--reject"
                                  onClick={() => handleAssess(address, false)}
                                  title={t('addresses.actions.markNotAccessible')}
                                >
                                  <X size={14} />
                                  {t('addresses.actions.markNotAccessible')}
                                </button>
                              )}
                              {address.is_accessible !== null && (
                                <button
                                  className="addresses__action-btn addresses__action-btn--reset"
                                  onClick={() => handleAssess(address, null)}
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
                          <tr className="addresses__map-row">
                            <td colSpan={4}>
                              <div className="addresses__map-preview">
                                <AddressMapPreview lat={address.lat} lng={address.lng} height="180px" />
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
