import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  MoreVertical,
  Mail,
  Phone,
  Cake,
  BookOpen,
  X,
  Check,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { usePrm, useUpdatePrm } from '../../hooks/usePrms';
import PrmRecentHistory from './PrmRecentHistory';
import './PrmDetail.css';

function formatBirthDate(iso: string) {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(iso));
}

export default function PrmDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { data: prm, isLoading, isError } = usePrm(id!);
  const updatePrm = useUpdatePrm();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({
    name: '',
    email: '',
    phone: '',
    birthDate: '',
    dni: '',
    bloodType: '',
    height: '' as string | number,
    weight: '' as string | number,
  });

  useEffect(() => {
    if (prm) {
      setDraft({
        name: prm.name,
        email: prm.email,
        phone: prm.phone,
        birthDate: prm.birthDate,
        dni: prm.dni || '',
        bloodType: prm.bloodType,
        height: prm.height ?? '',
        weight: prm.weight ?? '',
      });
    }
  }, [prm]);

  function startEditing() {
    if (prm) {
      setDraft({
        name: prm.name,
        email: prm.email,
        phone: prm.phone,
        birthDate: prm.birthDate,
        dni: prm.dni || '',
        bloodType: prm.bloodType,
        height: prm.height ?? '',
        weight: prm.weight ?? '',
      });
      setEditing(true);
    }
  }

  async function handleSave() {
    if (!prm) return;
    try {
      await updatePrm.mutateAsync({
        id: prm.id,
        name: draft.name,
        email: draft.email,
        phone: draft.phone,
        birthDate: draft.birthDate,
        dni: draft.dni || undefined,
        bloodType: draft.bloodType,
        height: draft.height ? Number(draft.height) : undefined,
        weight: draft.weight ? Number(draft.weight) : undefined,
      });
      setEditing(false);
    } catch {
      // mutation error handled by TanStack Query
    }
  }

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
              {[0, 1, 2].map((i) => (
                <div key={i} className="prm-stat">
                  <div className="prm-detail__skeleton-line" />
                </div>
              ))}
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
            <button onClick={() => navigate(-1)}>
              {t('prmDetail.goBack')}
            </button>
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
                src={
                  prm.avatar ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(prm.name)}&background=random`
                }
                alt={prm.name}
                className="prm-profile__avatar"
              />
            </div>
            <div>
              {editing ? (
                <input
                  className="prm-edit-input prm-edit-input--name"
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                />
              ) : (
                <h1 className="prm-profile__name">{prm.name}</h1>
              )}
              <div className="prm-profile__badges">
                <span
                  className={`prm-profile__status ${prm.status === 'Activo' ? 'prm-profile__status--active' : 'prm-profile__status--inactive'}`}
                >
                  {prm.status}
                </span>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="prm-stats">
            {editing ? (
              <>
                <div className="prm-stat">
                  <select
                    className="prm-edit-input prm-edit-input--stat"
                    value={draft.bloodType}
                    onChange={(e) =>
                      setDraft({ ...draft, bloodType: e.target.value })
                    }
                  >
                    <option value="">—</option>
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(
                      (g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ),
                    )}
                  </select>
                  <p className="prm-stat__label">{t('prmDetail.blood')}</p>
                </div>
                <div className="prm-stat">
                  <input
                    className="prm-edit-input prm-edit-input--stat"
                    type="text"
                    placeholder="cm"
                    value={draft.height}
                    onChange={(e) =>
                      setDraft({ ...draft, height: e.target.value })
                    }
                  />
                  <p className="prm-stat__label">{t('prmDetail.height')}</p>
                </div>
                <div className="prm-stat">
                  <input
                    className="prm-edit-input prm-edit-input--stat"
                    type="text"
                    placeholder="kg"
                    value={draft.weight}
                    onChange={(e) =>
                      setDraft({ ...draft, weight: e.target.value })
                    }
                  />
                  <p className="prm-stat__label">{t('prmDetail.weight')}</p>
                </div>
              </>
            ) : (
              [
                { label: t('prmDetail.blood'), value: prm.bloodType },
                { label: t('prmDetail.height'), value: prm.height },
                { label: t('prmDetail.weight'), value: prm.weight },
              ].map((stat) => (
                <div key={stat.label} className="prm-stat">
                  <p className="prm-stat__value">{stat.value || '—'}</p>
                  <p className="prm-stat__label">{stat.label}</p>
                </div>
              ))
            )}
          </div>

          {/* Personal Info */}
          <div className="prm-info">
            <div className="prm-info__header">
              <h3 className="prm-info__title">{t('prmDetail.personalInfo')}</h3>
              {editing ? (
                <div className="prm-edit-actions">
                  <button
                    className="prm-edit-actions__cancel"
                    onClick={() => setEditing(false)}
                  >
                    <X size={16} />
                    {t('prmDetail.cancelEdit')}
                  </button>
                  <button
                    className="prm-edit-actions__save"
                    onClick={handleSave}
                    disabled={updatePrm.isPending}
                  >
                    <Check size={16} />
                    {t('prmDetail.saveChanges')}
                  </button>
                </div>
              ) : (
                <button className="prm-info__edit-btn" onClick={startEditing}>
                  {t('prmDetail.edit')}
                </button>
              )}
            </div>
            <div className="prm-info__rows">
              <div className="prm-info__row">
                <div className="prm-info__row-left">
                  <div className="prm-info__row-icon">
                    <Mail size={16} />
                  </div>
                  <span className="prm-info__row-key">
                    {t('prmDetail.email')}
                  </span>
                </div>
                {editing ? (
                  <input
                    className="prm-edit-input"
                    type="email"
                    value={draft.email}
                    onChange={(e) =>
                      setDraft({ ...draft, email: e.target.value })
                    }
                  />
                ) : (
                  <span className="prm-info__row-value">{prm.email}</span>
                )}
              </div>
              <div className="prm-info__row">
                <div className="prm-info__row-left">
                  <div className="prm-info__row-icon">
                    <Phone size={16} />
                  </div>
                  <span className="prm-info__row-key">
                    {t('prmDetail.phone')}
                  </span>
                </div>
                {editing ? (
                  <input
                    className="prm-edit-input"
                    type="tel"
                    value={draft.phone}
                    onChange={(e) =>
                      setDraft({ ...draft, phone: e.target.value })
                    }
                  />
                ) : (
                  <span className="prm-info__row-value">{prm.phone}</span>
                )}
              </div>
              <div className="prm-info__row">
                <div className="prm-info__row-left">
                  <div className="prm-info__row-icon">
                    <Cake size={16} />
                  </div>
                  <span className="prm-info__row-key">
                    {t('prmDetail.birthdate')}
                  </span>
                </div>
                {editing ? (
                  <input
                    className="prm-edit-input"
                    type="date"
                    value={draft.birthDate}
                    onChange={(e) =>
                      setDraft({ ...draft, birthDate: e.target.value })
                    }
                  />
                ) : (
                  <span className="prm-info__row-value">
                    {formatBirthDate(prm.birthDate)}
                  </span>
                )}
              </div>
              <div className="prm-info__row">
                <div className="prm-info__row-left">
                  <div className="prm-info__row-icon">
                    <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>
                      ID
                    </span>
                  </div>
                  <span className="prm-info__row-key">
                    {t('prmDetail.dni')}
                  </span>
                </div>
                {editing ? (
                  <input
                    className="prm-edit-input"
                    type="text"
                    value={draft.dni}
                    onChange={(e) =>
                      setDraft({ ...draft, dni: e.target.value })
                    }
                  />
                ) : (
                  <span className="prm-info__row-value">{prm.dni || '—'}</span>
                )}
              </div>
            </div>
          </div>

          {/* Emergency Contacts */}
          {prm.emergency_contacts && prm.emergency_contacts.length > 0 && (
            <div className="prm-info">
              <div className="prm-info__header">
                <h3 className="prm-info__title">
                  {t('prmDetail.emergencyContacts')}
                </h3>
              </div>
              <div className="prm-info__rows">
                {prm.emergency_contacts.map((contact) => (
                  <div key={contact.id} className="prm-info__row">
                    <div className="prm-info__row-left">
                      <div className="prm-info__row-icon">
                        <Phone size={16} />
                      </div>
                      <div>
                        <span className="prm-info__row-key">
                          {contact.name}
                        </span>
                        <p
                          style={{
                            fontSize: '0.75rem',
                            color: 'var(--color-slate-400)',
                            marginTop: '0.125rem',
                          }}
                        >
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

          <PrmRecentHistory />
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
