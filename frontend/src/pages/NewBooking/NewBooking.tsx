import { ArrowLeft, Accessibility, Send, Clock, AlertCircle, CalendarDays, Loader2, Search, User } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import AddressSelector from '../../components/AddressSelector';
import { useCreateBooking } from '../../hooks/useBookings';
import type { Address } from '../../types';
import { apiClient } from '../../lib/api';
import './NewBooking.css';

type PrmResult = { id: string; name: string; avatar?: string; dni?: string };

function todayIso() {
  const d = new Date();
  return d.getFullYear() + '-' +
    String(d.getMonth() + 1).padStart(2, '0') + '-' +
    String(d.getDate()).padStart(2, '0');
}

export default function NewBooking() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const createBooking = useCreateBooking();

  const [step, setStep] = useState(1);
  const [urgency, setUrgency] = useState<'routine' | 'urgent'>('routine');
  const [pickupAddress, setPickupAddress] = useState<Partial<Address>>({});
  const [destinationAddress, setDestinationAddress] = useState<Partial<Address>>({});
  const [date, setDate] = useState(() => (location.state as { date?: string } | null)?.date || todayIso());
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  // Prm search state
  const [prmQuery, setPrmQuery] = useState('');
  const [prmResults, setPrmResults] = useState<PrmResult[]>([]);
  const [selectedPrm, setSelectedPrm] = useState<PrmResult | null>(null);
  const [prmSearchOpen, setPrmSearchOpen] = useState(false);
  const [prmSearchLoading, setPrmSearchLoading] = useState(false);

  // Debounced prm search
  useEffect(() => {
    if (prmQuery.length < 2) {
      setPrmResults([]);
      setPrmSearchOpen(false);
      return;
    }
    setPrmSearchLoading(true);
    const timer = setTimeout(() => {
      apiClient
        .get<PrmResult[]>('/api/prms?q=' + encodeURIComponent(prmQuery))
        .then((data) => {
          setPrmResults(data);
          setPrmSearchOpen(data.length > 0);
        })
        .catch(() => setPrmResults([]))
        .finally(() => setPrmSearchLoading(false));
    }, 350);
    return () => clearTimeout(timer);
  }, [prmQuery]);

  async function handleSubmit() {
    if (!selectedPrm || !pickupAddress.full_address || !destinationAddress.full_address || !date || !startTime) return;
    try {
      await createBooking.mutateAsync({
        prmId: selectedPrm.id,
        date,
        startTime,
        endTime: endTime || startTime,
        location: pickupAddress.full_address ?? '',
        destination: destinationAddress.full_address ?? '',
        urgency,
      });
      navigate(-1);
    } catch {
      // error handled silently; backend not yet wired
    }
  }

  const canSubmit =
    !!selectedPrm &&
    !!pickupAddress.full_address &&
    !!destinationAddress.full_address &&
    !!date &&
    !!startTime;

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

          {/* Progress */}
          <div className="step-progress">
            {[1, 2, 3, 4, 5].map((s) => (
              <div
                key={s}
                className={`step-dot${s === step ? ' step-dot--active' : ''}`}
              />
            ))}
          </div>

          {/* Step 1: Prm */}
          <section className="booking-section">
            <div className="booking-section__heading">
              <span className="booking-section__num">1</span>
              <h3 className="booking-section__title">PRM</h3>
            </div>

            {selectedPrm ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem 1rem',
                  borderRadius: '0.75rem',
                  border: '1px solid #e2e8f0',
                  background: '#f8fafc',
                }}
              >
                {selectedPrm.avatar ? (
                  <img
                    src={selectedPrm.avatar}
                    alt={selectedPrm.name}
                    style={{ width: '2.25rem', height: '2.25rem', borderRadius: '50%', objectFit: 'cover' }}
                  />
                ) : (
                  <div
                    style={{
                      width: '2.25rem',
                      height: '2.25rem',
                      borderRadius: '50%',
                      background: '#6b4691',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: '0.9rem',
                    }}
                  >
                    {selectedPrm.name[0]}
                  </div>
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#1e293b' }}>{selectedPrm.name}</div>
                  {selectedPrm.dni && (
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>DNI: {selectedPrm.dni}</div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPrm(null);
                    setPrmQuery('');
                    setPrmResults([]);
                    setPrmSearchOpen(false);
                  }}
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: '#6b4691',
                    background: 'none',
                    border: '1px solid #6b4691',
                    borderRadius: '0.5rem',
                    padding: '0.25rem 0.6rem',
                    cursor: 'pointer',
                  }}
                >
                  Cambiar
                </button>
              </div>
            ) : (
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'relative' }}>
                  <Search
                    size={15}
                    style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}
                  />
                  <input
                    type="text"
                    value={prmQuery}
                    onChange={(e) => setPrmQuery(e.target.value)}
                    placeholder="Buscar PRM por nombre..."
                    className="location-field__input"
                    style={{ paddingLeft: '2.4rem', paddingRight: '2.4rem' }}
                  />
                  {prmSearchLoading && (
                    <Loader2
                      size={15}
                      style={{ position: 'absolute', right: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', animation: 'spin 1s linear infinite' }}
                    />
                  )}
                </div>
                {prmSearchOpen && prmResults.length > 0 && (
                  <ul
                    style={{
                      position: 'absolute',
                      zIndex: 100,
                      top: '100%',
                      left: 0,
                      right: 0,
                      marginTop: '0.25rem',
                      background: '#fff',
                      borderRadius: '0.75rem',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                      border: '1px solid #e2e8f0',
                      overflow: 'hidden',
                      listStyle: 'none',
                      padding: 0,
                      margin: 0,
                    }}
                  >
                    {prmResults.map((p, idx) => (
                      <li key={p.id} style={{ borderTop: idx > 0 ? '1px solid #f1f5f9' : 'none' }}>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPrm(p);
                            setPrmQuery(p.name);
                            setPrmSearchOpen(false);
                          }}
                          style={{
                            width: '100%',
                            textAlign: 'left',
                            padding: '0.65rem 1rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.6rem',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                            color: '#1e293b',
                          }}
                        >
                          {p.avatar ? (
                            <img
                              src={p.avatar}
                              alt={p.name}
                              style={{ width: '1.75rem', height: '1.75rem', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                            />
                          ) : (
                            <div
                              style={{
                                width: '1.75rem',
                                height: '1.75rem',
                                borderRadius: '50%',
                                background: '#ede9f6',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                              }}
                            >
                              <User size={13} color="#6b4691" />
                            </div>
                          )}
                          <div>
                            <div style={{ fontWeight: 600 }}>{p.name}</div>
                            {p.dni && <div style={{ fontSize: '0.72rem', color: '#64748b' }}>DNI: {p.dni}</div>}
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </section>

          {/* Step 2: Location */}
          <section className="booking-section">
            <div className="booking-section__heading">
              <span className="booking-section__num booking-section__num--inactive">2</span>
              <h3 className="booking-section__title">{t('booking.locationDetails')}</h3>
            </div>

            <div className="location-selectors">
              <div className="location-selector-block">
                <p className="location-selector-block__label">{t('booking.pickupAddress')}</p>
                <AddressSelector
                  value={pickupAddress}
                  onChange={setPickupAddress}
                  showValidation={false}
                />
              </div>

              <div className="location-selector-block">
                <p className="location-selector-block__label">{t('booking.destinationAddress')}</p>
                <AddressSelector
                  value={destinationAddress}
                  onChange={setDestinationAddress}
                  showValidation={false}
                />
              </div>
            </div>
          </section>

          {/* Step 3: Passenger */}
          <section className="booking-section">
            <div className="booking-section__heading">
              <span className="booking-section__num booking-section__num--inactive">3</span>
              <h3 className="booking-section__title">{t('booking.passengerDetails')}</h3>
            </div>

            <div className="passenger-card">
              <div className="passenger-card__left">
                <div className="passenger-card__icon">
                  <Accessibility size={24} />
                </div>
                <div>
                  <p className="passenger-card__title">{t('booking.pmrStatus')}</p>
                  <p className="passenger-card__sub">{t('booking.reducedMobility')}</p>
                </div>
              </div>
              <label className="toggle-label">
                <input type="checkbox" />
                <div className="toggle-track">
                  <div className="toggle-thumb" />
                </div>
              </label>
            </div>
          </section>

          {/* Step 4: Date & Time */}
          <section className="booking-section">
            <div className="booking-section__heading">
              <span className="booking-section__num booking-section__num--inactive">4</span>
              <h3 className="booking-section__title">Fecha y hora</h3>
            </div>

            <div className="datetime-card">
              <div className="datetime-card__field">
                <label className="datetime-card__label">
                  <CalendarDays size={14} />
                  Fecha
                </label>
                <input
                  type="date"
                  value={date}
                  min={todayIso()}
                  onChange={(e) => setDate(e.target.value)}
                  className="location-field__input"
                />
              </div>
              <div className="datetime-card__row">
                <div className="datetime-card__field">
                  <label className="datetime-card__label">
                    <Clock size={14} />
                    Hora de recogida
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="location-field__input"
                  />
                </div>
                <div className="datetime-card__field">
                  <label className="datetime-card__label">
                    <Clock size={14} />
                    Hora estimada de llegada
                  </label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="location-field__input"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Step 5: Urgency */}
          <section className="booking-section">
            <div className="booking-section__heading">
              <span className="booking-section__num booking-section__num--inactive">5</span>
              <h3 className="booking-section__title">{t('booking.urgency')}</h3>
            </div>

            <div className="urgency-grid">
              <button
                onClick={() => setUrgency('routine')}
                className={`urgency-btn${urgency === 'routine' ? ' urgency-btn--routine-active' : ''}`}
              >
                <Clock size={32} />
                <span className="urgency-btn__label">{t('booking.routine')}</span>
              </button>
              <button
                onClick={() => setUrgency('urgent')}
                className={`urgency-btn${urgency === 'urgent' ? ' urgency-btn--urgent-active' : ''}`}
              >
                <AlertCircle size={32} />
                <span className="urgency-btn__label">{t('booking.urgent')}</span>
              </button>
            </div>
          </section>

        </div>
      </div>

      {/* Bottom Actions */}
      <div className="booking-actions">
        <div className="booking-actions__inner">
          <button
            onClick={() => navigate(-1)}
            className="booking-actions__cancel"
          >
            {t('booking.cancel')}
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || createBooking.isPending}
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
      </div>
    </div>
  );
}
