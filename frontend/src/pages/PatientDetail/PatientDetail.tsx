import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, MoreVertical, Mail, Phone, Cake, BookOpen } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { usePatient } from '../../hooks/usePatients';
import './PatientDetail.css';

function formatBirthDate(iso: string) {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(iso));
}

export default function PatientDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { data: patient, isLoading, isError } = usePatient(id!);

  if (isLoading) {
    return (
      <div className="patient-detail">
        <div className="patient-detail__header">
          <button onClick={() => navigate(-1)} className="patient-detail__back-btn">
            <ArrowLeft size={20} />
          </button>
          <h2 className="patient-detail__title">{t('patientDetail.title')}</h2>
        </div>
        <div className="patient-detail__body">
          <div className="patient-detail__inner">
            <div className="patient-detail__skeleton-profile" />
            <div className="patient-stats">
              {[0,1,2].map(i => <div key={i} className="patient-stat"><div className="patient-detail__skeleton-line" /></div>)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isError || !patient) {
    return (
      <div className="patient-detail">
        <div className="patient-detail__header">
          <button onClick={() => navigate(-1)} className="patient-detail__back-btn">
            <ArrowLeft size={20} />
          </button>
          <h2 className="patient-detail__title">{t('patientDetail.title')}</h2>
        </div>
        <div className="patient-detail__body">
          <div className="patient-detail__inner patient-detail__not-found">
            <p>{t('patientDetail.notFound')}</p>
            <button onClick={() => navigate(-1)}>{t('patientDetail.goBack')}</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="patient-detail">
      <div className="patient-detail__header">
        <button onClick={() => navigate(-1)} className="patient-detail__back-btn">
          <ArrowLeft size={20} />
        </button>
        <h2 className="patient-detail__title">{t('patientDetail.title')}</h2>
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
                src={patient.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(patient.name)}&background=random`}
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
              { label: t('patientDetail.blood'),  value: patient.bloodType },
              { label: t('patientDetail.height'), value: patient.height },
              { label: t('patientDetail.weight'), value: patient.weight },
            ].map((stat) => (
              <div key={stat.label} className="patient-stat">
                <p className="patient-stat__value">{stat.value || '—'}</p>
                <p className="patient-stat__label">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Personal Info */}
          <div className="patient-info">
            <div className="patient-info__header">
              <h3 className="patient-info__title">{t('patientDetail.personalInfo')}</h3>
              <Link to={`/app/patients/${patient.id}/edit`} className="patient-info__edit-btn">
                {t('patientDetail.edit')}
              </Link>
            </div>
            <div className="patient-info__rows">
              <div className="patient-info__row">
                <div className="patient-info__row-left">
                  <div className="patient-info__row-icon"><Mail size={16} /></div>
                  <span className="patient-info__row-key">{t('patientDetail.email')}</span>
                </div>
                <span className="patient-info__row-value">{patient.email}</span>
              </div>
              <div className="patient-info__row">
                <div className="patient-info__row-left">
                  <div className="patient-info__row-icon"><Phone size={16} /></div>
                  <span className="patient-info__row-key">{t('patientDetail.phone')}</span>
                </div>
                <span className="patient-info__row-value">{patient.phone}</span>
              </div>
              <div className="patient-info__row">
                <div className="patient-info__row-left">
                  <div className="patient-info__row-icon"><Cake size={16} /></div>
                  <span className="patient-info__row-key">{t('patientDetail.birthdate')}</span>
                </div>
                <span className="patient-info__row-value">{formatBirthDate(patient.birthDate)}</span>
              </div>
              {patient.dni && (
                <div className="patient-info__row">
                  <div className="patient-info__row-left">
                    <div className="patient-info__row-icon">
                      <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>ID</span>
                    </div>
                    <span className="patient-info__row-key">{t('patientDetail.dni')}</span>
                  </div>
                  <span className="patient-info__row-value">{patient.dni}</span>
                </div>
              )}
            </div>
          </div>

          {/* Emergency Contacts */}
          {patient.emergency_contacts && patient.emergency_contacts.length > 0 && (
            <div className="patient-info">
              <div className="patient-info__header">
                <h3 className="patient-info__title">{t('patientDetail.emergencyContacts')}</h3>
              </div>
              <div className="patient-info__rows">
                {patient.emergency_contacts.map((contact) => (
                  <div key={contact.id} className="patient-info__row">
                    <div className="patient-info__row-left">
                      <div className="patient-info__row-icon"><Phone size={16} /></div>
                      <div>
                        <span className="patient-info__row-key">{contact.name}</span>
                        <p style={{ fontSize: '0.75rem', color: 'var(--color-slate-400)', marginTop: '0.125rem' }}>
                          {contact.relationship}
                        </p>
                      </div>
                    </div>
                    <span className="patient-info__row-value">{contact.phone}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent History (static for now) */}
          <div className="patient-history">
            <div className="patient-history__header">
              <h3 className="patient-history__title">{t('patientDetail.recentHistory')}</h3>
              <button className="patient-history__view-btn">{t('patientDetail.viewAll')}</button>
            </div>
            <div className="patient-history__list">
              {[
                { date: '24', month: 'JUN', title: 'Revisión general', desc: 'PRM reportó fatiga leve y alergias estacionales. Signos vitales normales.', dr: 'Dr. Sarah Wilson' },
                { date: '12', month: 'MAY', title: 'Análisis de sangre', desc: 'Colesterol mejorado. Continuación del plan de medicación actual.', dr: 'Dr. James Miller' },
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
        <Link to="/app/bookings/new" className="booking-fab__btn">
          <BookOpen size={20} />
          <span>{t('patientDetail.bookAppointment')}</span>
        </Link>
      </div>
    </div>
  );
}
