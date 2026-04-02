import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, AlertCircle, CalendarDays, Send, Loader2 } from 'lucide-react';
import PrmAddressPicker from '../../components/PrmAddressPicker';
import { useBooking, useUpdateBooking } from '../../hooks/useBookings';
import type { Address } from '../../types';
import '../NewBooking/NewBooking.css';

export default function EditBooking() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: booking, isLoading } = useBooking(id!);
  const updateBooking = useUpdateBooking();

  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [urgency, setUrgency] = useState<'routine' | 'urgent'>('routine');
  const [address, setAddress] = useState<Partial<Address>>({});

  useEffect(() => {
    if (booking) {
      setDate(booking.date);
      setTime(booking.startTime);
      setUrgency(booking.urgency ?? 'routine');
      setAddress({ full_address: booking.address });
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
        urgency,
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
          <h2 className="new-booking__title">Editar reserva</h2>
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
          <h2 className="new-booking__title">Editar reserva</h2>
        </div>
        <div className="new-booking__body">
          <p style={{ padding: '2rem', color: 'var(--color-slate-500)' }}>Reserva no encontrada.</p>
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
        <h2 className="new-booking__title">Editar reserva</h2>
      </div>

      <div className="new-booking__body">
        <div className="new-booking__inner">

          {/* PRM (read-only) */}
          <section className="booking-section">
            <div className="booking-section__heading">
              <span className="booking-section__num">1</span>
              <h3 className="booking-section__title">PRM</h3>
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
              <h3 className="booking-section__title">Dirección de asistencia</h3>
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
              <h3 className="booking-section__title">Fecha y hora</h3>
            </div>
            <div className="datetime-card">
              <div className="datetime-card__row">
                <div className="datetime-card__field">
                  <label className="datetime-card__label">
                    <CalendarDays size={14} />
                    Fecha de asistencia
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="location-field__input"
                  />
                </div>
                <div className="datetime-card__field">
                  <label className="datetime-card__label">
                    <Clock size={14} />
                    Hora de asistencia
                  </label>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="location-field__input"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Urgency */}
          <section className="booking-section">
            <div className="booking-section__heading">
              <span className="booking-section__num booking-section__num--inactive">4</span>
              <h3 className="booking-section__title">Urgencia</h3>
            </div>
            <div className="urgency-grid">
              <button
                onClick={() => setUrgency('routine')}
                className={`urgency-btn${urgency === 'routine' ? ' urgency-btn--routine-active' : ''}`}
              >
                <Clock size={32} />
                <span className="urgency-btn__label">Rutina</span>
              </button>
              <button
                onClick={() => setUrgency('urgent')}
                className={`urgency-btn${urgency === 'urgent' ? ' urgency-btn--urgent-active' : ''}`}
              >
                <AlertCircle size={32} />
                <span className="urgency-btn__label">Urgente</span>
              </button>
            </div>
          </section>

        </div>
      </div>

      {/* Bottom Actions */}
      <div className="booking-actions">
        <div className="booking-actions__inner">
          <button onClick={() => navigate(-1)} className="booking-actions__cancel">
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || updateBooking.isPending}
            className={`booking-actions__submit${!canSubmit || updateBooking.isPending ? ' booking-actions__submit--disabled' : ''}`}
          >
            {updateBooking.isPending ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Guardando…</span>
              </>
            ) : (
              <>
                <span>Guardar cambios</span>
                <Send size={18} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
