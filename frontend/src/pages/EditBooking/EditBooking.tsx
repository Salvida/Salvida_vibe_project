import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Loader2, FileSignature } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import PrmAddressPicker from '../../components/PrmAddressPicker';
import DateInput from '../../components/DateInput/DateInput';
import TimeInput from '../../components/TimeInput/TimeInput';
import ContractModal from '../../components/ContractModal/ContractModal';
import { useBooking, useUpdateBooking } from '../../hooks/useBookings';
import type { Address } from '../../types';
import '../NewBooking/NewBooking.css';

function cardState(
  value: unknown,
  submitAttempted: boolean,
): 'bc-empty' | 'bc-filled' | 'bc-error' {
  if (value) return 'bc-filled';
  if (submitAttempted) return 'bc-error';
  return 'bc-empty';
}

export default function EditBooking() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { data: booking, isLoading } = useBooking(id!);
  const updateBooking = useUpdateBooking();

  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [address, setAddress] = useState<Partial<Address>>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [showSignModal, setShowSignModal] = useState(false);

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

  const missingFields = [
    !address.full_address && t('booking.locationDetails'),
    (!date || !time) && t('booking.dateTime'),
  ].filter(Boolean) as string[];

  const canSubmit = missingFields.length === 0;

  async function handleSubmit() {
    if (!canSubmit) {
      setSubmitAttempted(true);
      return;
    }
    if (!booking) return;
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

          {/* PRM — read-only, always filled */}
          <div className="field-card bc-filled">
            <div className="field-card__header">
              <span className="field-card__icon">♿</span>
              <span className="field-card__label">{t('booking.prm')}</span>
            </div>
            <div className="field-card__content">
              <div className="prm-selected-card">
                <div className="prm-selected-card__avatar">
                  {booking.prmAvatar
                    ? <img src={booking.prmAvatar} alt={booking.prmName} />
                    : booking.prmName[0]}
                </div>
                <div className="prm-selected-card__info">
                  <span className="prm-selected-card__name">{booking.prmName}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Dirección */}
          <div className={`field-card ${cardState(address.full_address, submitAttempted)}`}>
            <div className="field-card__header">
              <span className="field-card__icon">📍</span>
              <span className="field-card__label">{t('booking.locationDetails')}</span>
            </div>
            <div className="field-card__content">
              <PrmAddressPicker
                prmId={booking.prmId}
                value={address}
                onChange={setAddress}
              />
            </div>
          </div>

          {/* Fecha y hora */}
          <div className={`field-card ${cardState(date && time, submitAttempted)}`}>
            <div className="field-card__header">
              <span className="field-card__icon">📅</span>
              <span className="field-card__label">{t('booking.dateTime')}</span>
            </div>
            <div className="field-card__content">
              <div className="datetime-card__row">
                <div className="datetime-card__field">
                  <DateInput
                    value={date}
                    onChange={setDate}
                    placeholder={t('booking.assistDate')}
                  />
                </div>
                <div className="datetime-card__field">
                  <TimeInput
                    value={time}
                    onChange={setTime}
                    placeholder={t('booking.assistTime')}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Firma del contrato — solo si está pendiente de firma */}
          {booking.status === 'SignPending' && (
            <div className="field-card bc-empty">
              <div className="field-card__header">
                <span className="field-card__icon">✍️</span>
                <span className="field-card__label">{t('contract.title')}</span>
              </div>
              <div className="field-card__content">
                <button
                  type="button"
                  className="booking-actions__submit"
                  style={{ width: '100%', justifyContent: 'center', gap: '8px' }}
                  onClick={() => setShowSignModal(true)}
                >
                  <FileSignature size={18} />
                  {t('contract.signButton')}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Firma modal */}
      {showSignModal && booking && (
        <ContractModal
          booking={booking}
          onClose={() => setShowSignModal(false)}
          onSigned={() => { setShowSignModal(false); navigate(-1); }}
        />
      )}

      {/* Bottom Actions */}
      <div className="booking-actions">
        <div className="booking-actions__inner booking-actions__inner--stacked">
          <div className="booking-actions__row">
            <button onClick={() => navigate(-1)} className="booking-actions__cancel">
              {t('common.cancel')}
            </button>
            <button
              onClick={handleSubmit}
              disabled={updateBooking.isPending}
              aria-disabled={!canSubmit || updateBooking.isPending}
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
          {submitAttempted && missingFields.length > 0 && (
            <div className="booking-submit__hint">
              {t('booking.missingFields')}: <strong>{missingFields.join(', ')}</strong>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
