import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, Mail, Phone } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Header from '../../components/Header/Header';
import DropdownMenu from '../../components/DropdownMenu';
import { usePatients } from '../../hooks/usePatients';
import './Patients.css';

function useDebounce(value: string, delay: number) {
  const [debounced, setDebounced] = useState(value);
  useState(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  });
  return debounced;
}

export default function Patients() {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);
  const { data: patients = [], isLoading } = usePatients(debouncedQuery);

  return (
    <div className="patients">
      <Header
        title={t('patients.title')}
        subtitle={t('patients.subtitle')}
      />

      <div className="patients__body">
        <div className="patients__inner">

          <div className="patients__toolbar">
            <div className="patients__search-wrap">
              <span className="patients__search-icon">
                <Search size={18} />
              </span>
              <input
                type="text"
                placeholder={t('patients.search')}
                className="patients__search-input"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <Link to="/app/patients/new" className="patients__add-btn">
              <Plus size={20} />
              <span>{t('patients.addPatient')}</span>
            </Link>
          </div>

          <div className="patients__table-wrap">
            <div className="patients__table-scroll">
              <table className="patients__table">
                <thead>
                  <tr>
                    <th>{t('patients.columns.name')}</th>
                    <th>{t('patients.columns.contact')}</th>
                    <th className="center">{t('patients.columns.bookings')}</th>
                    <th>{t('patients.columns.lastVisit')}</th>
                    <th>{t('patients.columns.status')}</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <tr key={i} className="patients__skeleton-row">
                        <td><div className="patients__skeleton" style={{ width: '180px' }} /></td>
                        <td><div className="patients__skeleton" style={{ width: '140px' }} /></td>
                        <td><div className="patients__skeleton" style={{ width: '40px', margin: '0 auto' }} /></td>
                        <td><div className="patients__skeleton" style={{ width: '80px' }} /></td>
                        <td><div className="patients__skeleton" style={{ width: '60px' }} /></td>
                        <td />
                      </tr>
                    ))
                  ) : patients.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="patients__empty">
                        No se encontraron PRMs
                      </td>
                    </tr>
                  ) : (
                    patients.map((patient) => (
                      <tr key={patient.id}>
                        <td>
                          <Link to={`/app/patients/${patient.id}`} className="patient-link">
                            <div className="patient-link__avatar">
                              {patient.name.charAt(0)}
                            </div>
                            <span className="patient-link__name">{patient.name}</span>
                          </Link>
                        </td>
                        <td>
                          <div className="patient-contact">
                            <div className="patient-contact__item">
                              <Mail size={12} />
                              <span>{patient.email}</span>
                            </div>
                            <div className="patient-contact__item">
                              <Phone size={12} />
                              <span>{patient.phone}</span>
                            </div>
                          </div>
                        </td>
                        <td className="patient-bookings">—</td>
                        <td className="patient-date">—</td>
                        <td>
                          <span className={`patient-status ${patient.status === 'Activo' ? 'patient-status--active' : 'patient-status--inactive'}`}>
                            {patient.status}
                          </span>
                        </td>
                        <td>
                          <DropdownMenu
                            items={[
                              { label: t('patients.menu.viewProfile'), onClick: () => {} },
                              { label: t('patients.menu.edit'), onClick: () => {} },
                              { label: t('patients.menu.deactivate'), onClick: () => {}, variant: 'danger' },
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
