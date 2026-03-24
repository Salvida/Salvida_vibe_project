import Header from '../../components/Header/Header';
import CalendarWidget from '../../components/CalendarWidget/CalendarWidget';
import { PlusCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './Dashboard.css';

export default function Dashboard() {
  const { t } = useTranslation();

  return (
    <div className="dashboard">
      <Header
        title={t('dashboard.title')}
        subtitle={t('dashboard.subtitle')}
      />

      <div className="dashboard__body">
        <div className="dashboard__grid">

          {/* Left Column: Calendar & Summary */}
          <div className="dashboard__left">
            <CalendarWidget />

            <div className="summary-card">
              <h4 className="summary-card__title">{t('dashboard.summary')}</h4>
              <div className="summary-card__rows">
                <div className="summary-card__row">
                  <span className="summary-card__label">{t('dashboard.todayTotal')}</span>
                  <span className="summary-card__value">— {t('dashboard.trips')}</span>
                </div>
                <div className="summary-card__row">
                  <span className="summary-card__label">{t('dashboard.pending')}</span>
                  <span className="summary-card__value summary-card__value--pending">—</span>
                </div>
                <div className="summary-card__row">
                  <span className="summary-card__label">{t('dashboard.completed')}</span>
                  <span className="summary-card__value summary-card__value--completed">—</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Bookings List */}
          <div className="dashboard__right">
            <div className="bookings-header">
              <h3 className="bookings-header__title">{t('dashboard.todayBookings')}</h3>
            </div>

            <div className="booking-list booking-list--empty">
              <p className="booking-list__empty-text">{t('dashboard.noBookingsToday')}</p>
            </div>

            <Link to="/app/bookings/new" className="new-booking-btn">
              <PlusCircle size={20} />
              <span>{t('dashboard.requestNewBooking')}</span>
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
