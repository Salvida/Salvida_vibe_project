import { ArrowLeft, Send, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import PrmAddressPicker from '../../components/PrmAddressPicker';
import UserSelector from '../../components/UserSelector/UserSelector';
import DateInput from '../../components/DateInput/DateInput';
import TimeInput from '../../components/TimeInput/TimeInput';
import { useCreateBooking } from '../../hooks/useBookings';
import { usePrms } from '../../hooks/usePrms';
import { useAuthStore } from '../../store/useAuthStore';
import { todayIso } from '../../utils';
import type { Address } from '../../types';
import './NewBooking.css';

function cardState(
  value: unknown,
  submitAttempted: boolean,
): 'bc-empty' | 'bc-filled' | 'bc-error' {
  if (value) return 'bc-filled';
  if (submitAttempted) return 'bc-error';
  return 'bc-empty';
}

export default function NewBooking() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const createBooking = useCreateBooking();
  const isAdmin = useAuthStore((s) => s.user?.role === 'admin' || s.user?.role === 'superadmin');

  const [address, setAddress] = useState<Partial<Address>>({});
  const [date, setDate] = useState(() => (location.state as { date?: string } | null)?.date || todayIso());
  const [time, setTime] = useState('');

  // Admin: selected user
  const [selectedOwnerId, setSelectedOwnerId] = useState('');

  // PRM dropdown
  const { data: prms = [] } = usePrms(undefined, selectedOwnerId || undefined, 'Activo');
  const [selectedPrm, setSelectedPrm] = useState<{ id: string; name: string; avatar?: string; dni?: string } | null>(null);
  const [prmDropdownOpen, setPrmDropdownOpen] = useState(false);

  const [submitAttempted, setSubmitAttempted] = useState(false);

  // Auto-select when only one PRM
  useEffect(() => {
    if (prms.length === 1 && !selectedPrm) {
      setSelectedPrm(prms[0]);
    }
    if (prms.length !== 1) {
      setSelectedPrm(null);
      setAddress({});
    }
  }, [prms]);

  const missingFields = [
    isAdmin && !selectedOwnerId && t('booking.responsible'),
    !selectedPrm && t('booking.prm'),
    !address.full_address && t('booking.locationDetails'),
    (!date || !time) && t('booking.dateTime'),
  ].filter(Boolean) as string[];

  const canSubmit = missingFields.length === 0;

  async function handleSubmit() {
    if (!canSubmit) {
      setSubmitAttempted(true);
      return;
    }
    try {
      await createBooking.mutateAsync({
        prmId: selectedPrm!.id,
        date,
        startTime: time,
        endTime: time,
        address: address.full_address!,
        addressId: address.id,
        lat: address.lat,
        lng: address.lng,
      });
      navigate(-1);
    } catch {
      toast.error(t('booking.errorCreate'));
    }
  }

  return (
    <div className="new-booking">
      <div className="new-booking__header">
        <button
          onClick={() => navigate(-1)}
          className="new-booking__back-btn"
        >
          <ArrowLeft size={20} />
        </button>
        <h2 className="new-booking__title">{t('booking.title')}</h2>
      </div>

      <div className="new-booking__body">
        <div className="new-booking__inner">

          {/* Responsable (admin only) */}
          {isAdmin && (
            <div className={`booking-card ${cardState(selectedOwnerId, submitAttempted)}`}>
              <div className="booking-card__header">
                <span className="booking-card__icon">👤</span>
                <span className="booking-card__label">{t('booking.responsible')}</span>
              </div>
              <div className="booking-card__content">
                <UserSelector
                  value={selectedOwnerId}
                  label=""
                  placeholder={t('booking.responsibleSelect')}
                  onChange={(id) => {
                    setSelectedOwnerId(id);
                    setSelectedPrm(null);
                    setAddress({});
                  }}
                />
              </div>
            </div>
          )}

          {/* PRM */}
          <div className={`booking-card ${cardState(selectedPrm, submitAttempted)}`}>
            <div className="booking-card__header">
              <span className="booking-card__icon">♿</span>
              <span className="booking-card__label">{t('booking.prm')}</span>
            </div>
            <div className="booking-card__content">
              {(!isAdmin || selectedOwnerId) && (
                <>
                  {prms.length === 0 ? (
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-slate-400)' }}>
                      {isAdmin ? t('booking.noPrmsForUser') : t('booking.noPrms')}
                    </p>
                  ) : selectedPrm ? (
                    <div className="prm-selected-card">
                      <div className="prm-selected-card__avatar">
                        {selectedPrm.avatar
                          ? <img src={selectedPrm.avatar} alt={selectedPrm.name} />
                          : selectedPrm.name[0]}
                      </div>
                      <div className="prm-selected-card__info">
                        <span className="prm-selected-card__name">{selectedPrm.name}</span>
                        {selectedPrm.dni && (
                          <span className="prm-selected-card__dni">
                            {t('prms.newPrm.dni')}: {selectedPrm.dni}
                          </span>
                        )}
                      </div>
                      {prms.length > 1 && (
                        <button
                          type="button"
                          className="prm-selected-card__change"
                          onClick={() => { setSelectedPrm(null); setAddress({}); }}
                        >
                          {t('booking.changePrm')}
                        </button>
                      )}
                    </div>
                  ) : (
                    <div style={{ position: 'relative' }}>
                      <button
                        type="button"
                        className="location-field__input prm-dropdown-trigger"
                        onClick={() => setPrmDropdownOpen((o) => !o)}
                        onBlur={() => setTimeout(() => setPrmDropdownOpen(false), 150)}
                      >
                        {t('booking.prmSelect')}
                      </button>
                      {prmDropdownOpen && (
                        <ul className="prm-dropdown-list">
                          {prms.map((p, idx) => (
                            <li key={p.id} style={{ borderTop: idx > 0 ? '1px solid #f1f5f9' : 'none' }}>
                              <button
                                type="button"
                                className="prm-dropdown-option"
                                onMouseDown={() => {
                                  setSelectedPrm(p);
                                  setPrmDropdownOpen(false);
                                  setAddress({});
                                }}
                              >
                                <div className="prm-dropdown-option__avatar">
                                  {p.avatar ? <img src={p.avatar} alt={p.name} /> : p.name[0]}
                                </div>
                                <div>
                                  <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{p.name}</div>
                                  {p.dni && (
                                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                                      {t('prms.newPrm.dni')}: {p.dni}
                                    </div>
                                  )}
                                </div>
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Dirección */}
          <div className={`booking-card ${cardState(address.full_address, submitAttempted)}`}>
            <div className="booking-card__header">
              <span className="booking-card__icon">📍</span>
              <span className="booking-card__label">{t('booking.locationDetails')}</span>
            </div>
            <div className="booking-card__content">
              <PrmAddressPicker
                prmId={selectedPrm?.id ?? null}
                value={address}
                onChange={setAddress}
              />
            </div>
          </div>

          {/* Fecha y hora */}
          <div className={`booking-card ${cardState(date && time, submitAttempted)}`}>
            <div className="booking-card__header">
              <span className="booking-card__icon">📅</span>
              <span className="booking-card__label">{t('booking.dateTime')}</span>
            </div>
            <div className="booking-card__content">
              <div className="datetime-card__row">
                <div className="datetime-card__field">
                  <label className="datetime-card__label">{t('booking.assistDate')}</label>
                  <DateInput
                    value={date}
                    min={todayIso()}
                    onChange={setDate}
                    placeholder={t('booking.assistDate')}
                  />
                </div>
                <div className="datetime-card__field">
                  <label className="datetime-card__label">{t('booking.assistTime')}</label>
                  <TimeInput
                    value={time}
                    onChange={setTime}
                    placeholder={t('booking.assistTime')}
                  />
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Bottom Actions */}
      <div className="booking-actions">
        <div className="booking-actions__inner booking-actions__inner--stacked">
          <div className="booking-actions__row">
            <button
              onClick={() => navigate(-1)}
              className="booking-actions__cancel"
            >
              {t('booking.cancel')}
            </button>
            <button
              onClick={handleSubmit}
              disabled={createBooking.isPending}
              aria-disabled={!canSubmit || createBooking.isPending}
              className={`booking-actions__submit${!canSubmit || createBooking.isPending ? ' booking-actions__submit--disabled' : ''}`}
            >
              {createBooking.isPending ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>{t('booking.submitting')}</span>
                </>
              ) : (
                <>
                  <span>{t('booking.submit')}</span>
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
