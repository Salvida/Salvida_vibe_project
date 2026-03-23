import Header from '../../components/Header/Header';
import CalendarWidget from '../../components/CalendarWidget/CalendarWidget';
import { MOCK_BOOKINGS } from '../../mockData';
import { MoreVertical, MapPin, Clock, PlusCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import './Dashboard.css';

export default function Dashboard() {
  return (
    <div className="dashboard">
      <Header
        title="Gestión de Reservas"
        subtitle="Manage and monitor scheduled patient trips"
      />

      <div className="dashboard__body">
        <div className="dashboard__grid">

          {/* Left Column: Calendar & Summary */}
          <div className="dashboard__left">
            <CalendarWidget />

            <div className="summary-card">
              <h4 className="summary-card__title">Summary</h4>
              <div className="summary-card__rows">
                <div className="summary-card__row">
                  <span className="summary-card__label">Today's total</span>
                  <span className="summary-card__value">12 Trips</span>
                </div>
                <div className="summary-card__row">
                  <span className="summary-card__label">Pending</span>
                  <span className="summary-card__value summary-card__value--pending">3</span>
                </div>
                <div className="summary-card__row">
                  <span className="summary-card__label">Completed</span>
                  <span className="summary-card__value summary-card__value--completed">8</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Bookings List */}
          <div className="dashboard__right">
            <div className="bookings-header">
              <h3 className="bookings-header__title">Today's Bookings</h3>
              <button className="bookings-header__view-all">View All</button>
            </div>

            <div className="booking-list">
              {MOCK_BOOKINGS.map((booking) => (
                <div key={booking.id} className="booking-card">
                  <img
                    src={booking.patientAvatar || `https://ui-avatars.com/api/?name=${booking.patientName}&background=random`}
                    alt={booking.patientName}
                    className="booking-card__avatar"
                  />
                  <div className="booking-card__info">
                    <h4 className="booking-card__name">{booking.patientName}</h4>
                    <div className="booking-card__meta">
                      <div className="booking-card__meta-item">
                        <Clock size={14} />
                        <span>{booking.startTime} - {booking.endTime}</span>
                      </div>
                      <div className="booking-card__meta-item">
                        <MapPin size={14} />
                        <span className="booking-card__meta-location">{booking.location}</span>
                      </div>
                    </div>
                  </div>
                  <div className="booking-card__actions">
                    <span className={`booking-status ${booking.status === 'Approved' ? 'booking-status--approved' : 'booking-status--pending'}`}>
                      {booking.status}
                    </span>
                    <button className="booking-card__more-btn">
                      <MoreVertical size={20} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <Link to="/app/bookings/new" className="new-booking-btn">
              <PlusCircle size={20} />
              <span>Request New Booking</span>
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
