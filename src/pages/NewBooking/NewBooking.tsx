import { ArrowLeft, MapPin, Navigation, Accessibility, Send, Clock, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import './NewBooking.css';

export default function NewBooking() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [urgency, setUrgency] = useState('routine');

  return (
    <div className="new-booking">
      <div className="new-booking__header">
        <button
          onClick={() => navigate(-1)}
          className="new-booking__back-btn"
        >
          <ArrowLeft size={20} />
        </button>
        <h2 className="new-booking__title">New Reservation</h2>
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
              <h3 className="booking-section__title">Location Details</h3>
            </div>

            <div className="location-card">
              <div className="location-card__line" />

              <div className="location-field">
                <span className="location-field__icon">
                  <Navigation size={20} />
                </span>
                <label className="location-field__label">Pickup Address</label>
                <input
                  type="text"
                  placeholder="Enter pickup location"
                  className="location-field__input"
                />
              </div>

              <div className="location-field">
                <span className="location-field__icon location-field__icon--muted">
                  <MapPin size={20} />
                </span>
                <label className="location-field__label">Destination Address</label>
                <input
                  type="text"
                  placeholder="Enter destination address"
                  className="location-field__input"
                />
              </div>
            </div>
          </section>

          {/* Step 2: Passenger */}
          <section className="booking-section">
            <div className="booking-section__heading">
              <span className="booking-section__num booking-section__num--inactive">2</span>
              <h3 className="booking-section__title">Passenger Details</h3>
            </div>

            <div className="passenger-card">
              <div className="passenger-card__left">
                <div className="passenger-card__icon">
                  <Accessibility size={24} />
                </div>
                <div>
                  <p className="passenger-card__title">PMR Status</p>
                  <p className="passenger-card__sub">Reduced Mobility</p>
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
              <h3 className="booking-section__title">Urgency</h3>
            </div>

            <div className="urgency-grid">
              <button
                onClick={() => setUrgency('routine')}
                className={`urgency-btn${urgency === 'routine' ? ' urgency-btn--routine-active' : ''}`}
              >
                <Clock size={32} />
                <span className="urgency-btn__label">Routine</span>
              </button>
              <button
                onClick={() => setUrgency('urgent')}
                className={`urgency-btn${urgency === 'urgent' ? ' urgency-btn--urgent-active' : ''}`}
              >
                <AlertCircle size={32} />
                <span className="urgency-btn__label">Urgent</span>
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
            Cancel
          </button>
          <button className="booking-actions__submit">
            <span>Submit Request</span>
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
