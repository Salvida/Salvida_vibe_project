import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Plus, Mail, Phone, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Header from '../../components/Header/Header';
import DropdownMenu from '../../components/DropdownMenu';
import { usePrms, useUpdatePrm } from '../../hooks/usePrms';
import { useAuthStore } from '../../store/useAuthStore';
import './Prms.css';

function useDebounce(value: string, delay: number) {
  const [debounced, setDebounced] = useState(value);
  useState(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  });
  return debounced;
}

export default function Prms() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);
  const { data: prms = [], isLoading } = usePrms(debouncedQuery);
  const updatePrm = useUpdatePrm();
  const isAdmin = useAuthStore((s) => s.user?.role === 'admin');

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

          <div className="prms__table-wrap">
            <div className="prms__table-scroll">
              <table className="prms__table">
                <thead>
                  <tr>
                    <th>{t('prms.columns.name')}</th>
                    {isAdmin && <th>Responsable</th>}
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
                        No se encontraron PRMs
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
                            {prm.status}
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
