import { useTranslation } from 'react-i18next';
import {
  Clock, MapPin, Pencil, Trash2, CheckCircle, X, FileSignature,
  CalendarDays, User,
} from 'lucide-react';
import DropdownMenu from '../DropdownMenu';
import { formatDateShort } from '../../utils';
import { STATUS_CLASS } from '../../constants/booking';
import type { Booking } from '../../types';
import './BookingCard.css';

export interface BookingCardProps {
  booking: Booking;
  onEdit: () => void;
  onDelete: () => void;
  onStatusChange: (status: Booking['status']) => void;
  onSign: () => void;
  isAdmin: boolean;
  showDate?: boolean;
}

export default function BookingCard({
  booking,
  onEdit,
  onDelete,
  onStatusChange,
  onSign,
  isAdmin,
  showDate,
}: BookingCardProps) {
  const { t } = useTranslation();
  const mapsUrl = booking.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(booking.address)}`
    : null;

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
        <div className="booking-card__top">
          <div className="booking-card__name">{booking.prmName}</div>
          <div className="booking-card__right">
            <div className="booking-card__badges">
              {booking.created_by_admin && (
                <span className="booking-admin-badge">{t('dashboard.createdByAdmin')}</span>
              )}
              <span className={`booking-status ${STATUS_CLASS[booking.status]}`}>
                {t(`bookingStatuses.${booking.status}`)}
              </span>
              {booking.status === 'SignPending' && (
                <button
                  type="button"
                  className="booking-sign-btn"
                  onClick={(event) => { event.stopPropagation(); onSign(); }}
                >
                  <FileSignature size={14} />
                  {t('contract.signButton')}
                </button>
              )}
            </div>
            <DropdownMenu
              items={[
                ...(isAdmin && (booking.status === 'Pending' || booking.status === 'SignPending') ? [
                  { label: t('dashboard.actions.approve'), icon: <CheckCircle size={14} />, onClick: () => onStatusChange('Approved') },
                ] : []),
                ...(isAdmin && (booking.status === 'Pending' || booking.status === 'Approved') ? [
                  { label: t('dashboard.actions.complete'), icon: <CheckCircle size={14} />, onClick: () => onStatusChange('Completed') },
                  { label: t('dashboard.actions.cancelBooking'), icon: <X size={14} />, onClick: () => onStatusChange('Cancelled'), variant: 'danger' as const },
                ] : []),
                { label: t('dashboard.actions.editBooking'), icon: <Pencil size={14} />, onClick: onEdit },
                { label: t('dashboard.actions.deleteBooking'), icon: <Trash2 size={14} />, onClick: onDelete, variant: 'danger' as const },
              ]}
            />
          </div>
        </div>
        <div className="booking-card__meta">
          {showDate && booking.date && (
            <span className="booking-card__meta-item">
              <CalendarDays size={13} />
              {formatDateShort(booking.date)}
            </span>
          )}
          <span className="booking-card__meta-item">
            <Clock size={13} />
            {booking.startTime}
          </span>
          <span className="booking-card__meta-item booking-card__meta-location">
            {mapsUrl ? (
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="booking-card__map-icon"
                title={t('dashboard.viewOnMaps')}
                onClick={(event) => event.stopPropagation()}
              >
                <MapPin size={13} />
              </a>
            ) : (
              <MapPin size={13} />
            )}
            {booking.address}
          </span>
          {isAdmin && booking.owner_name && (
            <span className="booking-card__meta-item">
              <User size={13} />
              {booking.owner_name}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
