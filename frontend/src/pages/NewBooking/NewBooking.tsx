import { ArrowLeft, Accessibility, Send, Clock, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import AddressSelector from '../../components/AddressSelector';
import type { Address } from '../../types';
import './NewBooking.css';

export default function NewBooking() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [step, setStep] = useState(1);
  const [urgency, setUrgency] = useState('routine');
  const [pickupAddress, setPickupAddress] = useState<Partial<Address>>({});
  const [destinationAddress, setDestinationAddress] = useState<Partial<Address>>({});

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
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`step-dot${s === step ? ' step-dot--active' : ''}`}
              />
            ))}
          </div>

          {/* Step 1: Location */}
          <section className="booking-section">
            <div className="booking-section__heading">
              <span className="booking-section__num">1</span>
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

          {/* Step 2: Passenger */}
          <section className="booking-section">
            <div className="booking-section__heading">
              <span className="booking-section__num booking-section__num--inactive">2</span>
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

          {/* Step 3: Urgency */}
          <section className="booking-section">
            <div className="booking-section__heading">
              <span className="booking-section__num booking-section__num--inactive">3</span>
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
          <button className="booking-actions__submit">
            <span>{t('booking.submit')}</span>
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
