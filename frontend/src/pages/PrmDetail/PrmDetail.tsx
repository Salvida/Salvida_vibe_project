import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, MoreVertical, Mail, Phone, Cake, BookOpen } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { usePrm } from '../../hooks/usePrms';
import './PrmDetail.css';

function formatBirthDate(iso: string) {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(iso));
}

export default function PrmDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { data: prm, isLoading, isError } = usePrm(id!);

  if (isLoading) {
    return (
      <div className="prm-detail">
        <div className="prm-detail__header">
          <button onClick={() => navigate(-1)} className="prm-detail__back-btn">
            <ArrowLeft size={20} />
          </button>
          <h2 className="prm-detail__title">{t('prmDetail.title')}</h2>
        </div>
        <div className="prm-detail__body">
          <div className="prm-detail__inner">
            <div className="prm-detail__skeleton-profile" />
            <div className="prm-stats">
              {[0,1,2].map(i => <div key={i} className="prm-stat"><div className="prm-detail__skeleton-line" /></div>)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isError || !prm) {
    return (
      <div className="prm-detail">
        <div className="prm-detail__header">
          <button onClick={() => navigate(-1)} className="prm-detail__back-btn">
            <ArrowLeft size={20} />
          </button>
          <h2 className="prm-detail__title">{t('prmDetail.title')}</h2>
        </div>
        <div className="prm-detail__body">
          <div className="prm-detail__inner prm-detail__not-found">
            <p>{t('prmDetail.notFound')}</p>
            <button onClick={() => navigate(-1)}>{t('prmDetail.goBack')}</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="prm-detail">
      <div className="prm-detail__header">
        <button onClick={() => navigate(-1)} className="prm-detail__back-btn">
          <ArrowLeft size={20} />
        </button>
        <h2 className="prm-detail__title">{t('prmDetail.title')}</h2>
        <button className="prm-detail__more-btn">
          <MoreVertical size={20} />
        </button>
      </div>

      <div className="prm-detail__body">
        <div className="prm-detail__inner">

          {/* Profile Header */}
          <div className="prm-profile">
            <div className="prm-profile__avatar-wrap">
              <img
                src={prm.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(prm.name)}&background=random`}
                alt={prm.name}
                className="prm-profile__avatar"
              />
              <div className="prm-profile__online" />
            </div>
            <div>
              <h1 className="prm-profile__name">{prm.name}</h1>
              <div className="prm-profile__badges">
                <span className="prm-profile__status">{prm.status}</span>
                <span className="prm-profile__id">#{prm.id}</span>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="prm-stats">
            {[
              { label: t('prmDetail.blood'),  value: prm.bloodType },
              { label: t('prmDetail.height'), value: prm.height },
              { label: t('prmDetail.weight'), value: prm.weight },
            ].map((stat) => (
              <div key={stat.label} className="prm-stat">
                <p className="prm-stat__value">{stat.value || '—'}</p>
                <p className="prm-stat__label">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Personal Info */}
          <div className="prm-info">
            <div className="prm-info__header">
              <h3 className="prm-info__title">{t('prmDetail.personalInfo')}</h3>
              <Link to={`/app/prms/${prm.id}/edit`} className="prm-info__edit-btn">
                {t('prmDetail.edit')}
              </Link>
            </div>
            <div className="prm-info__rows">
              <div className="prm-info__row">
                <div className="prm-info__row-left">
                  <div className="prm-info__row-icon"><Mail size={16} /></div>
                  <span className="prm-info__row-key">{t('prmDetail.email')}</span>
                </div>
                <span className="prm-info__row-value">{prm.email}</span>
              </div>
              <div className="prm-info__row">
                <div className="prm-info__row-left">
                  <div className="prm-info__row-icon"><Phone size={16} /></div>
                  <span className="prm-info__row-key">{t('prmDetail.phone')}</span>
                </div>
                <span className="prm-info__row-value">{prm.phone}</span>
              </div>
              <div className="prm-info__row">
                <div className="prm-info__row-left">
                  <div className="prm-info__row-icon"><Cake size={16} /></div>
                  <span className="prm-info__row-key">{t('prmDetail.birthdate')}</span>
                </div>
                <span className="prm-info__row-value">{formatBirthDate(prm.birthDate)}</span>
              </div>
              {prm.dni && (
                <div className="prm-info__row">
                  <div className="prm-info__row-left">
                    <div className="prm-info__row-icon">
                      <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>ID</span>
                    </div>
                    <span className="prm-info__row-key">{t('prmDetail.dni')}</span>
                  </div>
                  <span className="prm-info__row-value">{prm.dni}</span>
                </div>
              )}
            </div>
          </div>

          {/* Emergency Contacts */}
          {prm.emergency_contacts && prm.emergency_contacts.length > 0 && (
            <div className="prm-info">
              <div className="prm-info__header">
                <h3 className="prm-info__title">{t('prmDetail.emergencyContacts')}</h3>
              </div>
              <div className="prm-info__rows">
                {prm.emergency_contacts.map((contact) => (
                  <div key={contact.id} className="prm-info__row">
                    <div className="prm-info__row-left">
                      <div className="prm-info__row-icon"><Phone size={16} /></div>
                      <div>
                        <span className="prm-info__row-key">{contact.name}</span>
                        <p style={{ fontSize: '0.75rem', color: 'var(--color-slate-400)', marginTop: '0.125rem' }}>
                          {contact.relationship}
                        </p>
                      </div>
                    </div>
                    <span className="prm-info__row-value">{contact.phone}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent History (static for now) */}
          <div className="prm-history">
            <div className="prm-history__header">
              <h3 className="prm-history__title">{t('prmDetail.recentHistory')}</h3>
              <button className="prm-history__view-btn">{t('prmDetail.viewAll')}</button>
            </div>
            <div className="prm-history__list">
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
          <span>{t('prmDetail.bookAppointment')}</span>
        </Link>
      </div>
    </div>
  );
}
