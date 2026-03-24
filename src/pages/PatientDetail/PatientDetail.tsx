import { MOCK_PATIENTS } from '../../mockData';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MoreVertical, Mail, Phone, Cake, User, BookOpen } from 'lucide-react';
import './PatientDetail.css';

export default function PatientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const patient = MOCK_PATIENTS.find((p) => p.id === id) || MOCK_PATIENTS[0];

  return (
    <div className="patient-detail">
      <div className="patient-detail__header">
        <button
          onClick={() => navigate(-1)}
          className="patient-detail__back-btn"
        >
          <ArrowLeft size={20} />
        </button>
        <h2 className="patient-detail__title">Patient Details</h2>
        <button className="patient-detail__more-btn">
          <MoreVertical size={20} />
        </button>
      </div>

      <div className="patient-detail__body">
        <div className="patient-detail__inner">

          {/* Profile Header */}
          <div className="patient-profile">
            <div className="patient-profile__avatar-wrap">
              <img
                src={patient.avatar || `https://ui-avatars.com/api/?name=${patient.name}&background=random`}
                alt={patient.name}
                className="patient-profile__avatar"
              />
              <div className="patient-profile__online" />
            </div>
            <div>
              <h1 className="patient-profile__name">{patient.name}</h1>
              <div className="patient-profile__badges">
                <span className="patient-profile__status">{patient.status}</span>
                <span className="patient-profile__id">#{patient.id}</span>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="patient-stats">
            {[
              { label: 'Blood', value: patient.bloodType },
              { label: 'Height', value: patient.height },
              { label: 'Weight', value: patient.weight },
            ].map((stat) => (
              <div key={stat.label} className="patient-stat">
                <p className="patient-stat__value">{stat.value}</p>
                <p className="patient-stat__label">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Personal Info */}
          <div className="patient-info">
            <div className="patient-info__header">
              <h3 className="patient-info__title">Personal Info</h3>
              <button className="patient-info__edit-btn">Edit</button>
            </div>
            <div className="patient-info__rows">
              <div className="patient-info__row">
                <div className="patient-info__row-left">
                  <div className="patient-info__row-icon"><Mail size={16} /></div>
                  <span className="patient-info__row-key">Email</span>
                </div>
                <span className="patient-info__row-value">{patient.email}</span>
              </div>
              <div className="patient-info__row">
                <div className="patient-info__row-left">
                  <div className="patient-info__row-icon"><Phone size={16} /></div>
                  <span className="patient-info__row-key">Phone</span>
                </div>
                <span className="patient-info__row-value">{patient.phone}</span>
              </div>
              <div className="patient-info__row">
                <div className="patient-info__row-left">
                  <div className="patient-info__row-icon"><Cake size={16} /></div>
                  <span className="patient-info__row-key">Birthdate</span>
                </div>
                <span className="patient-info__row-value">{patient.birthDate}</span>
              </div>
            </div>
          </div>

          {/* Recent History */}
          <div className="patient-history">
            <div className="patient-history__header">
              <h3 className="patient-history__title">Recent History</h3>
              <button className="patient-history__view-btn">View All</button>
            </div>
            <div className="patient-history__list">
              {[
                { date: '24', month: 'JUN', title: 'General Check-up', desc: 'PMR reportó fatiga leve y alergias estacionales. Signos vitales normales.', dr: 'Dr. Sarah Wilson' },
                { date: '12', month: 'MAY', title: 'Blood Test Analysis', desc: 'Cholesterol levels improved. Continued current medication plan.', dr: 'Dr. James Miller' },
              ].map((item, i) => (
                <div key={i} className="history-card">
                  <div className="history-card__date">
                    <span className="history-card__day">{item.date}</span>
                    <span className="history-card__month">{item.month}</span>
                  </div>
                  <div className="history-card__content">
                    <h4 className="history-card__title">{item.title}</h4>
                    <p className="history-card__desc">{item.desc}</p>
                    <div className="history-card__doctor">
                      <User size={12} color="var(--color-slate-400)" />
                      <span className="history-card__doctor-name">{item.dr}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Floating Action Button */}
      <div className="booking-fab">
        <button className="booking-fab__btn">
          <BookOpen size={20} />
          <span>Book Appointment</span>
        </button>
      </div>
    </div>
  );
}
