import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCreatePrm } from '../../hooks/usePrms';
import type { EmergencyContact } from '../../types';
import './NewPrm.css';

interface ContactDraft {
  name: string;
  phone: string;
  relationship: string;
}

export default function NewPrm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const createPrm = useCreatePrm();

  // Basic fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [dni, setDni] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [status, setStatus] = useState<'Activo' | 'Inactivo'>('Activo');

  // Medical fields
  const [bloodType, setBloodType] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');

  // Contacts
  const [contacts, setContacts] = useState<ContactDraft[]>([]);

  // Errors
  const [nameError, setNameError] = useState('');
  const [formError, setFormError] = useState('');

  function addContact() {
    if (contacts.length >= 2) return;
    setContacts([...contacts, { name: '', phone: '', relationship: '' }]);
  }

  function updateContact(index: number, field: keyof ContactDraft, value: string) {
    setContacts(contacts.map((c, i) => (i === index ? { ...c, [field]: value } : c)));
  }

  function removeContact(index: number) {
    setContacts(contacts.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setNameError('');
    setFormError('');

    if (!name.trim()) {
      setNameError(t('prms.newPrm.errorRequired'));
      return;
    }

    const emergencyContacts = contacts.filter((c) => c.name.trim());

    try {
      const newPrm = await createPrm.mutateAsync({
        name: name.trim(),
        email,
        phone,
        dni,
        birthDate,
        status,
        bloodType,
        height,
        weight,
        avatar: undefined,
        emergency_contacts: emergencyContacts,
        is_demo: false,
      } as Parameters<typeof createPrm.mutateAsync>[0]);

      navigate(`/app/prms/${newPrm.id}`);
    } catch {
      setFormError(t('prms.newPrm.errorGeneric'));
    }
  }

  return (
    <div className="new-prm">
      <div className="new-prm__header">
        <Link to="/app/prms" className="new-prm__back-btn">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="new-prm__title">{t('prms.newPrm.title')}</h1>
          <p className="new-prm__subtitle">{t('prms.newPrm.subtitle')}</p>
        </div>
      </div>

      <div className="new-prm__body">
        <form className="new-prm__form" onSubmit={handleSubmit} noValidate>

          {/* Section: Información básica */}
          <section className="new-prm__section">
            <h2 className="new-prm__section-title">
              {t('prms.newPrm.sections.basic')}
            </h2>
            <div className="new-prm__grid">
              <div className="new-prm__field new-prm__field--full">
                <label className="new-prm__label" htmlFor="name">
                  Nombre completo <span className="new-prm__required">*</span>
                </label>
                <input
                  id="name"
                  type="text"
                  className={`new-prm__input${nameError ? ' new-prm__input--error' : ''}`}
                  placeholder="Nombre y apellidos"
                  value={name}
                  onChange={(e) => { setName(e.target.value); setNameError(''); }}
                />
                {nameError && <p className="new-prm__field-error">{nameError}</p>}
              </div>

              <div className="new-prm__field">
                <label className="new-prm__label" htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  className="new-prm__input"
                  placeholder="correo@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="new-prm__field">
                <label className="new-prm__label" htmlFor="phone">Teléfono</label>
                <input
                  id="phone"
                  type="tel"
                  className="new-prm__input"
                  placeholder="+34 600 000 000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div className="new-prm__field">
                <label className="new-prm__label" htmlFor="dni">DNI / NIE</label>
                <input
                  id="dni"
                  type="text"
                  className="new-prm__input"
                  placeholder="12345678A"
                  value={dni}
                  onChange={(e) => setDni(e.target.value)}
                />
              </div>

              <div className="new-prm__field">
                <label className="new-prm__label" htmlFor="birthDate">Fecha de nacimiento</label>
                <input
                  id="birthDate"
                  type="date"
                  className="new-prm__input"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                />
              </div>

              <div className="new-prm__field">
                <label className="new-prm__label" htmlFor="status">Estado</label>
                <select
                  id="status"
                  className="new-prm__select"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'Activo' | 'Inactivo')}
                >
                  <option value="Activo">Activo</option>
                  <option value="Inactivo">Inactivo</option>
                </select>
              </div>
            </div>
          </section>

          {/* Section: Datos médicos */}
          <section className="new-prm__section">
            <h2 className="new-prm__section-title">
              {t('prms.newPrm.sections.medical')}
            </h2>
            <div className="new-prm__grid">
              <div className="new-prm__field">
                <label className="new-prm__label" htmlFor="bloodType">Grupo sanguíneo</label>
                <select
                  id="bloodType"
                  className="new-prm__select"
                  value={bloodType}
                  onChange={(e) => setBloodType(e.target.value)}
                >
                  <option value="">Selecciona grupo</option>
                  {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              <div className="new-prm__field">
                <label className="new-prm__label" htmlFor="height">Altura (cm)</label>
                <input
                  id="height"
                  type="text"
                  className="new-prm__input"
                  placeholder="Ej: 165"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                />
              </div>

              <div className="new-prm__field">
                <label className="new-prm__label" htmlFor="weight">Peso (kg)</label>
                <input
                  id="weight"
                  type="text"
                  className="new-prm__input"
                  placeholder="Ej: 62"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                />
              </div>
            </div>
          </section>

          {/* Section: Contactos de urgencia */}
          <section className="new-prm__section">
            <h2 className="new-prm__section-title">
              {t('prms.newPrm.sections.contacts')}
            </h2>

            {contacts.map((contact, index) => (
              <div key={index} className="new-prm__contact-row">
                <div className="new-prm__grid">
                  <div className="new-prm__field">
                    <label className="new-prm__label">Nombre</label>
                    <input
                      type="text"
                      className="new-prm__input"
                      placeholder="Nombre del contacto"
                      value={contact.name}
                      onChange={(e) => updateContact(index, 'name', e.target.value)}
                    />
                  </div>
                  <div className="new-prm__field">
                    <label className="new-prm__label">Teléfono</label>
                    <input
                      type="tel"
                      className="new-prm__input"
                      placeholder="+34 600 000 000"
                      value={contact.phone}
                      onChange={(e) => updateContact(index, 'phone', e.target.value)}
                    />
                  </div>
                  <div className="new-prm__field">
                    <label className="new-prm__label">Relación</label>
                    <input
                      type="text"
                      className="new-prm__input"
                      placeholder="Ej: Madre, Hermano"
                      value={contact.relationship}
                      onChange={(e) => updateContact(index, 'relationship', e.target.value)}
                    />
                  </div>
                </div>
                <button
                  type="button"
                  className="new-prm__contact-remove"
                  onClick={() => removeContact(index)}
                  title="Eliminar contacto"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}

            {contacts.length < 2 ? (
              <button type="button" className="new-prm__add-contact-btn" onClick={addContact}>
                <Plus size={16} />
                {t('prms.newPrm.contactAdd')}
              </button>
            ) : (
              <p className="new-prm__contact-max">{t('prms.newPrm.contactMax')}</p>
            )}
          </section>

          {formError && <p className="new-prm__form-error">{formError}</p>}

          <div className="new-prm__actions">
            <Link to="/app/prms" className="new-prm__cancel-btn">
              {t('prms.newPrm.cancel')}
            </Link>
            <button
              type="submit"
              className="new-prm__submit-btn"
              disabled={createPrm.isPending}
            >
              {createPrm.isPending
                ? t('prms.newPrm.submitting')
                : t('prms.newPrm.submit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
