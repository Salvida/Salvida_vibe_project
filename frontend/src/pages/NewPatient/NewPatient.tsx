import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCreatePatient } from '../../hooks/usePatients';
import type { EmergencyContact } from '../../types';
import './NewPatient.css';

interface ContactDraft {
  name: string;
  phone: string;
  relationship: string;
}

export default function NewPatient() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const createPatient = useCreatePatient();

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
      setNameError(t('patients.newPatient.errorRequired'));
      return;
    }

    const emergencyContacts = contacts
      .filter((c) => c.name.trim())
      .map((c) => ({ ...c, id: '' })) as EmergencyContact[];

    try {
      const newPatient = await createPatient.mutateAsync({
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
      } as Parameters<typeof createPatient.mutateAsync>[0]);

      navigate(`/app/patients/${newPatient.id}`);
    } catch {
      setFormError(t('patients.newPatient.errorGeneric'));
    }
  }

  return (
    <div className="new-patient">
      <div className="new-patient__header">
        <Link to="/app/patients" className="new-patient__back-btn">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="new-patient__title">{t('patients.newPatient.title')}</h1>
          <p className="new-patient__subtitle">{t('patients.newPatient.subtitle')}</p>
        </div>
      </div>

      <div className="new-patient__body">
        <form className="new-patient__form" onSubmit={handleSubmit} noValidate>

          {/* Section: Información básica */}
          <section className="new-patient__section">
            <h2 className="new-patient__section-title">
              {t('patients.newPatient.sections.basic')}
            </h2>
            <div className="new-patient__grid">
              <div className="new-patient__field new-patient__field--full">
                <label className="new-patient__label" htmlFor="name">
                  Nombre completo <span className="new-patient__required">*</span>
                </label>
                <input
                  id="name"
                  type="text"
                  className={`new-patient__input${nameError ? ' new-patient__input--error' : ''}`}
                  placeholder="Nombre y apellidos"
                  value={name}
                  onChange={(e) => { setName(e.target.value); setNameError(''); }}
                />
                {nameError && <p className="new-patient__field-error">{nameError}</p>}
              </div>

              <div className="new-patient__field">
                <label className="new-patient__label" htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  className="new-patient__input"
                  placeholder="correo@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="new-patient__field">
                <label className="new-patient__label" htmlFor="phone">Teléfono</label>
                <input
                  id="phone"
                  type="tel"
                  className="new-patient__input"
                  placeholder="+34 600 000 000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div className="new-patient__field">
                <label className="new-patient__label" htmlFor="dni">DNI / NIE</label>
                <input
                  id="dni"
                  type="text"
                  className="new-patient__input"
                  placeholder="12345678A"
                  value={dni}
                  onChange={(e) => setDni(e.target.value)}
                />
              </div>

              <div className="new-patient__field">
                <label className="new-patient__label" htmlFor="birthDate">Fecha de nacimiento</label>
                <input
                  id="birthDate"
                  type="date"
                  className="new-patient__input"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                />
              </div>

              <div className="new-patient__field">
                <label className="new-patient__label" htmlFor="status">Estado</label>
                <select
                  id="status"
                  className="new-patient__select"
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
          <section className="new-patient__section">
            <h2 className="new-patient__section-title">
              {t('patients.newPatient.sections.medical')}
            </h2>
            <div className="new-patient__grid">
              <div className="new-patient__field">
                <label className="new-patient__label" htmlFor="bloodType">Grupo sanguíneo</label>
                <select
                  id="bloodType"
                  className="new-patient__select"
                  value={bloodType}
                  onChange={(e) => setBloodType(e.target.value)}
                >
                  <option value="">Selecciona grupo</option>
                  {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              <div className="new-patient__field">
                <label className="new-patient__label" htmlFor="height">Altura (cm)</label>
                <input
                  id="height"
                  type="text"
                  className="new-patient__input"
                  placeholder="Ej: 165"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                />
              </div>

              <div className="new-patient__field">
                <label className="new-patient__label" htmlFor="weight">Peso (kg)</label>
                <input
                  id="weight"
                  type="text"
                  className="new-patient__input"
                  placeholder="Ej: 62"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                />
              </div>
            </div>
          </section>

          {/* Section: Contactos de urgencia */}
          <section className="new-patient__section">
            <h2 className="new-patient__section-title">
              {t('patients.newPatient.sections.contacts')}
            </h2>

            {contacts.map((contact, index) => (
              <div key={index} className="new-patient__contact-row">
                <div className="new-patient__grid">
                  <div className="new-patient__field">
                    <label className="new-patient__label">Nombre</label>
                    <input
                      type="text"
                      className="new-patient__input"
                      placeholder="Nombre del contacto"
                      value={contact.name}
                      onChange={(e) => updateContact(index, 'name', e.target.value)}
                    />
                  </div>
                  <div className="new-patient__field">
                    <label className="new-patient__label">Teléfono</label>
                    <input
                      type="tel"
                      className="new-patient__input"
                      placeholder="+34 600 000 000"
                      value={contact.phone}
                      onChange={(e) => updateContact(index, 'phone', e.target.value)}
                    />
                  </div>
                  <div className="new-patient__field">
                    <label className="new-patient__label">Relación</label>
                    <input
                      type="text"
                      className="new-patient__input"
                      placeholder="Ej: Madre, Hermano"
                      value={contact.relationship}
                      onChange={(e) => updateContact(index, 'relationship', e.target.value)}
                    />
                  </div>
                </div>
                <button
                  type="button"
                  className="new-patient__contact-remove"
                  onClick={() => removeContact(index)}
                  title="Eliminar contacto"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}

            {contacts.length < 2 ? (
              <button type="button" className="new-patient__add-contact-btn" onClick={addContact}>
                <Plus size={16} />
                {t('patients.newPatient.contactAdd')}
              </button>
            ) : (
              <p className="new-patient__contact-max">{t('patients.newPatient.contactMax')}</p>
            )}
          </section>

          {formError && <p className="new-patient__form-error">{formError}</p>}

          <div className="new-patient__actions">
            <Link to="/app/patients" className="new-patient__cancel-btn">
              {t('patients.newPatient.cancel')}
            </Link>
            <button
              type="submit"
              className="new-patient__submit-btn"
              disabled={createPatient.isPending}
            >
              {createPatient.isPending
                ? t('patients.newPatient.submitting')
                : t('patients.newPatient.submit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
