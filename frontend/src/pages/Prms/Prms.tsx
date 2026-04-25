import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Plus, Mail, Phone, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Header from '../../components/Header/Header';
import DropdownMenu from '../../components/DropdownMenu';
import { usePrms, useUpdatePrm } from '../../hooks/usePrms';
import { useAuthStore } from '../../store/useAuthStore';
import { useDebounce } from '../../hooks/useDebounce';
import './Prms.css';

export default function Prms() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [statusTab, setStatusTab] = useState<'all' | 'Activo' | 'Inactivo'>('all');
  const debouncedQuery = useDebounce(query, 300);
  const { data: prms = [], isLoading } = usePrms(
    debouncedQuery,
    undefined,
    statusTab === 'all' ? undefined : statusTab,
  );
  const updatePrm = useUpdatePrm();
  const isAdmin = useAuthStore((s) => s.user?.role === 'admin' || s.user?.role === 'superadmin');

  return (
    <div className="prms">
      <Header
        title={t('prms.title')}
        subtitle={t('prms.subtitle')}
      />

      <div className="prms__body">
        <div className="prms__inner">

          <div className="prms__toolbar">
            <div className="prms__search-wrap">
              <span className="prms__search-icon">
                <Search size={18} />
              </span>
              <input
                type="text"
                placeholder={t('prms.search')}
                className="prms__search-input"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <Link to="/app/prms/new" className="prms__add-btn">
              <Plus size={20} />
              <span>{t('prms.addPrm')}</span>
            </Link>
          </div>

          <div className="prms__filter-tabs">
            {(['all', 'Activo', 'Inactivo'] as const).map((tab) => (
              <button
                key={tab}
                className={`prms__filter-tab${statusTab === tab ? ' prms__filter-tab--active' : ''}`}
                onClick={() => setStatusTab(tab)}
              >
                {tab === 'Activo' ? t('prms.tabs.active') : tab === 'Inactivo' ? t('prms.tabs.inactive') : t('prms.tabs.all')}
              </button>
            ))}
          </div>

          <div className="prms__table-wrap">
            <div className="prms__table-scroll">
              <table className="prms__table">
                <thead>
                  <tr>
                    <th>{t('prms.columns.name')}</th>
                    {isAdmin && <th>{t('prms.columns.responsible')}</th>}
                    <th>{t('prms.columns.contact')}</th>
                    <th className="center">{t('prms.columns.bookings')}</th>
                    <th>{t('prms.columns.lastVisit')}</th>
                    <th>{t('prms.columns.status')}</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <tr key={i} className="prms__skeleton-row">
                        <td><div className="prms__skeleton" style={{ width: '180px' }} /></td>
                        {isAdmin && <td><div className="prms__skeleton" style={{ width: '120px' }} /></td>}
                        <td><div className="prms__skeleton" style={{ width: '140px' }} /></td>
                        <td><div className="prms__skeleton" style={{ width: '40px', margin: '0 auto' }} /></td>
                        <td><div className="prms__skeleton" style={{ width: '80px' }} /></td>
                        <td><div className="prms__skeleton" style={{ width: '60px' }} /></td>
                        <td />
                      </tr>
                    ))
                  ) : prms.length === 0 ? (
                    <tr>
                      <td colSpan={isAdmin ? 7 : 6} className="prms__empty">
                        {t('prms.empty')}
                      </td>
                    </tr>
                  ) : (
                    prms.map((prm) => (
                      <tr key={prm.id}>
                        <td>
                          <Link to={`/app/prms/${prm.id}`} className="prm-link">
                            <div className="prm-link__avatar">
                              {prm.name.charAt(0)}
                            </div>
                            <span className="prm-link__name">{prm.name}</span>
                          </Link>
                        </td>
                        {isAdmin && (
                          <td className="prm-owner">
                            {prm.owner_name ? (
                              <div className="prm-owner__wrap">
                                <User size={12} />
                                <span>{prm.owner_name}</span>
                              </div>
                            ) : '—'}
                          </td>
                        )}
                        <td>
                          <div className="prm-contact">
                            <div className="prm-contact__item">
                              <Mail size={12} />
                              <span>{prm.email}</span>
                            </div>
                            <div className="prm-contact__item">
                              <Phone size={12} />
                              <span>{prm.phone}</span>
                            </div>
                          </div>
                        </td>
                        <td className="prm-bookings">
                          {prm.booking_count ?? 0}
                        </td>
                        <td className="prm-date">
                          {prm.last_booking_date
                            ? new Date(prm.last_booking_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
                            : '—'}
                        </td>
                        <td>
                          <span className={`prm-status ${prm.status === 'Activo' ? 'prm-status--active' : 'prm-status--inactive'}`}>
                            {prm.status === 'Activo' ? t('common.active') : t('common.archived')}
                          </span>
                        </td>
                        <td>
                          <DropdownMenu
                            items={[
                              { label: t('prms.menu.viewProfile'), onClick: () => navigate(`/app/prms/${prm.id}`) },
                              {
                                label: prm.status === 'Activo' ? t('prms.menu.deactivate') : t('prms.menu.activate'),
                                onClick: () => updatePrm.mutate({ id: prm.id, status: prm.status === 'Activo' ? 'Inactivo' : 'Activo' }),
                                variant: prm.status === 'Activo' ? 'danger' : 'default',
                              },
                            ]}
                          />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
