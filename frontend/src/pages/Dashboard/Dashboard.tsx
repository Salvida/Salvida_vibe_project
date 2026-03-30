import { useState } from 'react';
import Header from '../../components/Header/Header';
import CalendarWidget from '../../components/CalendarWidget/CalendarWidget';
import { PlusCircle, Clock, MapPin, MoreVertical, Navigation } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useBookings } from '../../hooks/useBookings';
import type { Booking } from '../../types';
import './Dashboard.css';

function formatDateISO(date: Date): string {
  return date.getFullYear() + '-' +
    String(date.getMonth() + 1).padStart(2, '0') + '-' +
    String(date.getDate()).padStart(2, '0');
}

const STATUS_LABEL: Record<Booking['status'], string> = {
  Approved: 'Aprobada',
  Pending: 'Pendiente',
  Completed: 'Completada',
  Cancelled: 'Cancelada',
};

const STATUS_CLASS: Record<Booking['status'], string> = {
  Approved: 'booking-status--approved',
  Pending: 'booking-status--pending',
  Completed: 'booking-status--completed',
  Cancelled: 'booking-status--cancelled',
};

function BookingCard({ booking }: { booking: Booking }) {
  return (
    <div className="booking-card">
      {booking.prmAvatar ? (
        <img className="booking-card__avatar" src={booking.prmAvatar} alt={booking.prmName} />
      ) : (
        <div className="booking-card__avatar booking-card__avatar--placeholder">
          {booking.prmName?.[0] ?? '?'}
        </div>
      )}
      <div className="booking-card__info">
        <div className="booking-card__name">{booking.prmName}</div>
        <div className="booking-card__meta">
          <span className="booking-card__meta-item">
            <Clock size={13} />
            {booking.startTime}–{booking.endTime}
          </span>
          <span className="booking-card__meta-item booking-card__meta-location">
            <MapPin size={13} />
            {booking.location}
          </span>
        </div>
      </div>
      <div className="booking-card__actions">
        <span className={`booking-status ${STATUS_CLASS[booking.status]}`}>
          {STATUS_LABEL[booking.status]}
        </span>
        {booking.location && booking.destination && (
          <a
            href={`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(booking.location)}&destination=${encodeURIComponent(booking.destination)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="booking-card__maps-btn"
            aria-label="Abrir ruta en Google Maps"
            title="Abrir en Google Maps"
          >
            <Navigation size={15} />
          </a>
        )}
        <button className="booking-card__more-btn" aria-label="Más opciones">
          <MoreVertical size={16} />
        </button>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { t } = useTranslation();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const dateStr = formatDateISO(selectedDate);
  const { data: bookings = [], isLoading } = useBookings({ date: dateStr });

  const total = bookings.length;
  const pending = bookings.filter((b) => b.status === 'Pending').length;
  const completed = bookings.filter((b) => b.status === 'Completed').length;

  const todayStr = formatDateISO(new Date());
  const isToday = dateStr === todayStr;
  const dateLabel = isToday
    ? t('dashboard.todayBookings')
    : `Reservas del ${selectedDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}`;

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
            <CalendarWidget onDateSelect={setSelectedDate} />

            <div className="summary-card">
              <h4 className="summary-card__title">{t('dashboard.summary')}</h4>
              <div className="summary-card__rows">
                <div className="summary-card__row">
                  <span className="summary-card__label">{t('dashboard.todayTotal')}</span>
                  <span className="summary-card__value">
                    {isLoading ? '—' : `${total} ${t('dashboard.trips')}`}
                  </span>
                </div>
                <div className="summary-card__row">
                  <span className="summary-card__label">{t('dashboard.pending')}</span>
                  <span className="summary-card__value summary-card__value--pending">
                    {isLoading ? '—' : pending}
                  </span>
                </div>
                <div className="summary-card__row">
                  <span className="summary-card__label">{t('dashboard.completed')}</span>
                  <span className="summary-card__value summary-card__value--completed">
                    {isLoading ? '—' : completed}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Bookings List */}
          <div className="dashboard__right">
            <div className="bookings-header">
              <h3 className="bookings-header__title">{dateLabel}</h3>
            </div>

            {isLoading ? (
              <div className="booking-list">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="booking-card booking-card--skeleton" />
                ))}
              </div>
            ) : bookings.length === 0 ? (
              <div className="booking-list booking-list--empty">
                <p className="booking-list__empty-text">{t('dashboard.noBookingsToday')}</p>
              </div>
            ) : (
              <div className="booking-list">
                {bookings.map((b) => <BookingCard key={b.id} booking={b} />)}
              </div>
            )}

            <Link to="/app/bookings/new" state={{ date: dateStr }} className="new-booking-btn">
              <PlusCircle size={20} />
              <span>{t('dashboard.requestNewBooking')}</span>
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
