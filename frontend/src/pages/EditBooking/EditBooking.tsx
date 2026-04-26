import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import PrmAddressPicker from '../../components/PrmAddressPicker';
import DateInput from '../../components/DateInput/DateInput';
import TimeInput from '../../components/TimeInput/TimeInput';
import { useBooking, useUpdateBooking } from '../../hooks/useBookings';
import type { Address } from '../../types';
import '../NewBooking/NewBooking.css';

export default function EditBooking() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { data: booking, isLoading } = useBooking(id!);
  const updateBooking = useUpdateBooking();

  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [address, setAddress] = useState<Partial<Address>>({});

  useEffect(() => {
    if (booking) {
      setDate(booking.date);
      setTime(booking.startTime);
      setAddress({
        full_address: booking.address,
        id: booking.addressId,
        lat: booking.lat,
        lng: booking.lng,
      });
    }
  }, [booking]);

  async function handleSubmit() {
    if (!booking || !address.full_address || !date || !time) return;
    try {
      await updateBooking.mutateAsync({
        id: booking.id,
        date,
        startTime: time,
        endTime: time,
        address: address.full_address,
        addressId: address.id,
        lat: address.lat,
        lng: address.lng,
      });
      navigate(-1);
    } catch {
      // error handled by mutation
    }
  }

  const canSubmit = !!address.full_address && !!date && !!time;

  if (isLoading) {
    return (
      <div className="new-booking">
        <div className="new-booking__header">
          <button onClick={() => navigate(-1)} className="new-booking__back-btn">
            <ArrowLeft size={20} />
          </button>
          <h2 className="new-booking__title">{t('booking.editTitle')}</h2>
        </div>
        <div className="new-booking__body">
          <div className="new-booking__inner">
            <div style={{ height: '12rem', borderRadius: '1rem', background: 'linear-gradient(90deg,#f1f5f9 25%,#f8fafc 50%,#f1f5f9 75%)', backgroundSize: '200% 100%', animation: 'skeleton-shimmer 1.4s ease infinite' }} />
          </div>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="new-booking">
        <div className="new-booking__header">
          <button onClick={() => navigate(-1)} className="new-booking__back-btn">
            <ArrowLeft size={20} />
          </button>
          <h2 className="new-booking__title">{t('booking.editTitle')}</h2>
        </div>
        <div className="new-booking__body">
          <p style={{ padding: '2rem', color: 'var(--color-slate-500)' }}>{t('booking.notFound')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="new-booking">
      <div className="new-booking__header">
        <button onClick={() => navigate(-1)} className="new-booking__back-btn">
          <ArrowLeft size={20} />
        </button>
        <h2 className="new-booking__title">{t('booking.editTitle')}</h2>
      </div>

      <div className="new-booking__body">
        <div className="new-booking__inner">

          {/* PRM (read-only) */}
          <section className="booking-section">
            <div className="booking-section__heading">
              <span className="booking-section__num">1</span>
              <h3 className="booking-section__title">{t('booking.prm')}</h3>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', background: '#f8fafc' }}>
              {booking.prmAvatar ? (
                <img src={booking.prmAvatar} alt={booking.prmName} style={{ width: '2.25rem', height: '2.25rem', borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '2.25rem', height: '2.25rem', borderRadius: '50%', background: '#6b4691', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '0.9rem' }}>
                  {booking.prmName[0]}
                </div>
              )}
              <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#1e293b' }}>{booking.prmName}</div>
            </div>
          </section>

          {/* Address */}
          <section className="booking-section">
            <div className="booking-section__heading">
              <span className="booking-section__num booking-section__num--inactive">2</span>
              <h3 className="booking-section__title">{t('booking.locationDetails')}</h3>
            </div>
            <PrmAddressPicker
              prmId={booking.prmId}
              value={address}
              onChange={setAddress}
            />
          </section>

          {/* Date & Time */}
          <section className="booking-section">
            <div className="booking-section__heading">
              <span className="booking-section__num booking-section__num--inactive">3</span>
              <h3 className="booking-section__title">{t('booking.dateTime')}</h3>
            </div>
            <div className="datetime-card">
              <div className="datetime-card__row">
                <div className="datetime-card__field">
                  <label className="datetime-card__label">
                    {t('booking.assistDate')}
                  </label>
                  <DateInput
                    value={date}
                    onChange={setDate}
                    placeholder={t('booking.assistDate')}
                  />
                </div>
                <div className="datetime-card__field">
                  <label className="datetime-card__label">
                    {t('booking.assistTime')}
                  </label>
                  <TimeInput
                    value={time}
                    onChange={setTime}
                    placeholder={t('booking.assistTime')}
                  />
                </div>
              </div>
            </div>
          </section>

        </div>
      </div>

      {/* Bottom Actions */}
      <div className="booking-actions">
        <div className="booking-actions__inner">
          <button onClick={() => navigate(-1)} className="booking-actions__cancel">
            {t('common.cancel')}
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || updateBooking.isPending}
            className={`booking-actions__submit${!canSubmit || updateBooking.isPending ? ' booking-actions__submit--disabled' : ''}`}
          >
            {updateBooking.isPending ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>{t('common.saving')}</span>
              </>
            ) : (
              <>
                <span>{t('booking.save')}</span>
                <Send size={18} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
