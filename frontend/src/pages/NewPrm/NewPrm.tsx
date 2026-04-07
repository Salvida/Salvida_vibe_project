import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCreatePrm } from '../../hooks/usePrms';
import { useAddPrmAddress } from '../../hooks/usePrmAddresses';
import AddressSelector from '../../components/AddressSelector';
import UserSelector from '../../components/UserSelector/UserSelector';
import { useAuthStore } from '../../store/useAuthStore';
import type { Address, EmergencyContact } from '../../types';
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
  const addPrmAddress = useAddPrmAddress();
  const isAdmin = useAuthStore((s) => s.user?.role === 'admin');

  // Admin: selected owner
  const [ownerId, setOwnerId] = useState('');

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

  // Addresses
  const [addressDrafts, setAddressDrafts] = useState<{ value: Partial<Address>; alias: string }[]>([]);

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

  function addAddressDraft() {
    setAddressDrafts([...addressDrafts, { value: {}, alias: '' }]);
  }

  function updateAddressDraftValue(index: number, value: Partial<Address>) {
    setAddressDrafts(addressDrafts.map((d, i) => (i === index ? { ...d, value } : d)));
  }

  function updateAddressDraftAlias(index: number, alias: string) {
    setAddressDrafts(addressDrafts.map((d, i) => (i === index ? { ...d, alias } : d)));
  }

  function removeAddressDraft(index: number) {
    setAddressDrafts(addressDrafts.filter((_, i) => i !== index));
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
        ...(isAdmin && ownerId ? { owner_id: ownerId } : {}),
      } as Parameters<typeof createPrm.mutateAsync>[0]);

      for (const draft of addressDrafts.filter((d) => d.value.full_address)) {
        await addPrmAddress.mutateAsync({
          prmId: newPrm.id,
          full_address: draft.value.full_address!,
          lat: draft.value.lat,
          lng: draft.value.lng,
          is_accessible: draft.value.is_accessible ?? false,
          alias: draft.alias,
        });
      }

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

          {/* Section: Responsable (admin only) */}
          {isAdmin && (
            <section className="new-prm__section">
              <h2 className="new-prm__section-title">{t('prms.newPrm.sections.responsible')}</h2>
              <UserSelector
                value={ownerId}
                label=""
                placeholder={t('prms.newPrm.responsiblePlaceholder')}
                onChange={(id) => setOwnerId(id)}
              />
              {!ownerId && (
                <p className="new-prm__owner-hint">{t('prms.newPrm.responsibleHint')}</p>
              )}
            </section>
          )}

          {/* Section: Información básica */}
          <section className="new-prm__section">
            <h2 className="new-prm__section-title">
              {t('prms.newPrm.sections.basic')}
            </h2>
            <div className="new-prm__grid">
              <div className="new-prm__field new-prm__field--full">
                <label className="new-prm__label" htmlFor="name">
                  {t('prms.newPrm.nameFull')} <span className="new-prm__required">*</span>
                </label>
                <input
                  id="name"
                  type="text"
                  className={`new-prm__input${nameError ? ' new-prm__input--error' : ''}`}
                  placeholder={t('prms.newPrm.namePlaceholder')}
                  value={name}
                  onChange={(e) => { setName(e.target.value); setNameError(''); }}
                />
                {nameError && <p className="new-prm__field-error">{nameError}</p>}
              </div>

              <div className="new-prm__field">
                <label className="new-prm__label" htmlFor="email">{t('prms.newPrm.email')}</label>
                <input
                  id="email"
                  type="email"
                  className="new-prm__input"
                  placeholder={t('prms.newPrm.emailPlaceholder')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="new-prm__field">
                <label className="new-prm__label" htmlFor="phone">{t('prms.newPrm.phone')}</label>
                <input
                  id="phone"
                  type="tel"
                  className="new-prm__input"
                  placeholder={t('prms.newPrm.phonePlaceholder')}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div className="new-prm__field">
                <label className="new-prm__label" htmlFor="dni">{t('prms.newPrm.dni')}</label>
                <input
                  id="dni"
                  type="text"
                  className="new-prm__input"
                  placeholder={t('prms.newPrm.dniPlaceholder')}
                  value={dni}
                  onChange={(e) => setDni(e.target.value)}
                />
              </div>

              <div className="new-prm__field">
                <label className="new-prm__label" htmlFor="birthDate">{t('prms.newPrm.birthDate')}</label>
                <input
                  id="birthDate"
                  type="date"
                  className="new-prm__input"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                />
              </div>

              <div className="new-prm__field">
                <label className="new-prm__label" htmlFor="status">{t('prms.newPrm.status')}</label>
                <select
                  id="status"
                  className="new-prm__select"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'Activo' | 'Inactivo')}
                >
                  <option value="Activo">{t('prms.newPrm.statusActive')}</option>
                  <option value="Inactivo">{t('prms.newPrm.statusInactive')}</option>
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
                <label className="new-prm__label" htmlFor="bloodType">{t('prms.newPrm.bloodType')}</label>
                <select
                  id="bloodType"
                  className="new-prm__select"
                  value={bloodType}
                  onChange={(e) => setBloodType(e.target.value)}
                >
                  <option value="">{t('prms.newPrm.bloodTypePlaceholder')}</option>
                  {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              <div className="new-prm__field">
                <label className="new-prm__label" htmlFor="height">{t('prms.newPrm.height')}</label>
                <input
                  id="height"
                  type="text"
                  className="new-prm__input"
                  placeholder={t('prms.newPrm.heightPlaceholder')}
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                />
              </div>

              <div className="new-prm__field">
                <label className="new-prm__label" htmlFor="weight">{t('prms.newPrm.weight')}</label>
                <input
                  id="weight"
                  type="text"
                  className="new-prm__input"
                  placeholder={t('prms.newPrm.weightPlaceholder')}
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
                    <label className="new-prm__label">{t('prms.newPrm.contactName')}</label>
                    <input
                      type="text"
                      className="new-prm__input"
                      placeholder={t('prms.newPrm.contactNamePlaceholder')}
                      value={contact.name}
                      onChange={(e) => updateContact(index, 'name', e.target.value)}
                    />
                  </div>
                  <div className="new-prm__field">
                    <label className="new-prm__label">{t('prms.newPrm.contactPhone')}</label>
                    <input
                      type="tel"
                      className="new-prm__input"
                      placeholder={t('prms.newPrm.phonePlaceholder')}
                      value={contact.phone}
                      onChange={(e) => updateContact(index, 'phone', e.target.value)}
                    />
                  </div>
                  <div className="new-prm__field">
                    <label className="new-prm__label">{t('prms.newPrm.contactRelationship')}</label>
                    <input
                      type="text"
                      className="new-prm__input"
                      placeholder={t('prms.newPrm.contactRelationshipPlaceholder')}
                      value={contact.relationship}
                      onChange={(e) => updateContact(index, 'relationship', e.target.value)}
                    />
                  </div>
                </div>
                <button
                  type="button"
                  className="new-prm__contact-remove"
                  onClick={() => removeContact(index)}
                  title={t('common.remove')}
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

          {/* Section: Direcciones */}
          <section className="new-prm__section">
            <h2 className="new-prm__section-title">{t('prms.newPrm.sections.addresses')}</h2>

            {addressDrafts.map((draft, index) => (
              <div key={index} className="new-prm__contact-row">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingRight: '1rem' }}>
                  <AddressSelector
                    value={draft.value}
                    onChange={(v) => updateAddressDraftValue(index, v)}
                    showValidation={false}
                  />
                  <input
                    type="text"
                    className="new-prm__input"
                    placeholder={t('prms.newPrm.addressAlias')}
                    value={draft.alias}
                    onChange={(e) => updateAddressDraftAlias(index, e.target.value)}
                    maxLength={40}
                  />
                </div>
                <button
                  type="button"
                  className="new-prm__contact-remove"
                  onClick={() => removeAddressDraft(index)}
                  title={t('common.remove')}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}

            <button type="button" className="new-prm__add-contact-btn" onClick={addAddressDraft}>
              <Plus size={16} />
              {t('prms.newPrm.addAddress')}
            </button>
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
