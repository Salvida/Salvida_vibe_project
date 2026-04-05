import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Mail,
  Phone,
  Cake,
  BookOpen,
  X,
  Check,
  MapPin,
  Plus,
  Trash2,
  Pencil,
  PowerOff,
  Power,
  Camera,
  User,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { usePrm, useUpdatePrm, useAddEmergencyContact, useDeleteEmergencyContact, useUpdateEmergencyContact } from '../../hooks/usePrms';
import DropdownMenu from '../../components/DropdownMenu';
import { useAuthStore } from '../../store/useAuthStore';
import { supabase } from '../../lib/supabaseClient';
import { toast } from 'react-toastify';
import {
  usePrmAddresses,
  useAddPrmAddress,
  useDeletePrmAddress,
  useUpdatePrmAddress,
} from '../../hooks/usePrmAddresses';
import AddressSelector from '../../components/AddressSelector';
import type { Address } from '../../types';
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
  const currentUser = useAuthStore((s) => s.user);
  const isAdmin = currentUser?.role === 'admin';
  const { data: addresses, isLoading: addrLoading } = usePrmAddresses(id!);
  const addPrmAddress = useAddPrmAddress();
  const deletePrmAddress = useDeletePrmAddress();
  const updatePrmAddress = useUpdatePrmAddress();
  const addEmergencyContact = useAddEmergencyContact();
  const deleteEmergencyContact = useDeleteEmergencyContact();
  const updateEmergencyContact = useUpdateEmergencyContact();

  // Emergency contact state
  const [showAddContact, setShowAddContact] = useState(false);
  const [newContact, setNewContact] = useState({ name: '', phone: '', relationship: '' });
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [editContactDraft, setEditContactDraft] = useState({ name: '', phone: '', relationship: '' });

  // Avatar upload
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  async function handleAvatarFile(file: File) {
    if (!file.type.startsWith('image/')) {
      toast.error('Solo se admiten imágenes (JPG, PNG, GIF)');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('La imagen no puede superar los 2MB');
      return;
    }
    if (!prm) return;
    setUploadingAvatar(true);
    try {
      const ext = file.name.split('.').pop() ?? 'jpg';
      const path = `prm-${prm.id}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
      updatePrm.mutate({ id: prm.id, avatar: urlData.publicUrl });
    } catch {
      toast.error('Error al subir la imagen');
    } finally {
      setUploadingAvatar(false);
    }
  }

  // Address state
  const [showAddAddr, setShowAddAddr] = useState(false);
  const [newAddrValue, setNewAddrValue] = useState<Partial<Address>>({});
  const [newAddrAlias, setNewAddrAlias] = useState('');
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [editAddrDraft, setEditAddrDraft] = useState<{ value: Partial<Address>; alias: string }>({ value: {}, alias: '' });
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
        {isAdmin && prm && (
          <DropdownMenu
            items={[
              prm.status === 'Activo'
                ? {
                    label: 'Archivar PRM',
                    icon: <PowerOff size={14} />,
                    onClick: () => updatePrm.mutate({ id: prm.id, status: 'Inactivo' }),
                    variant: 'danger',
                  }
                : {
                    label: 'Restaurar PRM',
                    icon: <Power size={14} />,
                    onClick: () => updatePrm.mutate({ id: prm.id, status: 'Activo' }),
                  },
            ]}
          />
        )}
      </div>

      <div className="prm-detail__body">
        <div className="prm-detail__inner">
          {/* Profile Header */}
          <div className="prm-profile">
            <div className="prm-profile__avatar-wrap">
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleAvatarFile(file);
                  e.target.value = '';
                }}
              />
              <img
                src={
                  prm.avatar ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(prm.name)}&background=random`
                }
                alt={prm.name}
                className="prm-profile__avatar"
              />
              <button
                type="button"
                className="prm-profile__avatar-btn"
                disabled={uploadingAvatar}
                onClick={() => avatarInputRef.current?.click()}
                title="Cambiar foto"
              >
                <Camera size={14} />
              </button>
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
              {isAdmin && (
                <div className="prm-info__row">
                  <div className="prm-info__row-left">
                    <div className="prm-info__row-icon">
                      <User size={16} />
                    </div>
                    <span className="prm-info__row-key">Responsable</span>
                  </div>
                  <span className="prm-info__row-value">{prm.owner_name || '—'}</span>
                </div>
              )}
            </div>
          </div>

          {/* Emergency Contacts */}
          <div className="prm-info">
            <div className="prm-info__header">
              <h3 className="prm-info__title">
                {t('prmDetail.emergencyContacts')}
              </h3>
              {!showAddContact && (
                <button
                  className="prm-info__edit-btn"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                  onClick={() => setShowAddContact(true)}
                >
                  <Plus size={14} /> Añadir
                </button>
              )}
            </div>

            {prm.emergency_contacts && prm.emergency_contacts.length > 0 ? (
              <div className="prm-info__rows">
                {prm.emergency_contacts.map((contact) => (
                  editingContactId === contact.id ? (
                    <div key={contact.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1rem', borderBottom: '1px solid var(--color-slate-50)' }}>
                      <input type="text" className="prm-edit-input" placeholder="Nombre" value={editContactDraft.name} onChange={(e) => setEditContactDraft({ ...editContactDraft, name: e.target.value })} style={{ maxWidth: '100%', width: '100%' }} />
                      <input type="tel" className="prm-edit-input" placeholder="Teléfono" value={editContactDraft.phone} onChange={(e) => setEditContactDraft({ ...editContactDraft, phone: e.target.value })} style={{ maxWidth: '100%', width: '100%' }} />
                      <input type="text" className="prm-edit-input" placeholder="Relación" value={editContactDraft.relationship} onChange={(e) => setEditContactDraft({ ...editContactDraft, relationship: e.target.value })} style={{ maxWidth: '100%', width: '100%' }} />
                      <div className="prm-edit-actions" style={{ justifyContent: 'flex-end' }}>
                        <button type="button" className="prm-edit-actions__cancel" onClick={() => setEditingContactId(null)}><X size={14} /> Cancelar</button>
                        <button type="button" className="prm-edit-actions__save" disabled={!editContactDraft.name.trim() || updateEmergencyContact.isPending}
                          onClick={async () => {
                            await updateEmergencyContact.mutateAsync({ prmId: id!, ecId: contact.id, ...editContactDraft });
                            setEditingContactId(null);
                          }}
                        ><Check size={14} /> Guardar</button>
                      </div>
                    </div>
                  ) : (
                    <div key={contact.id} className="prm-info__row">
                      <div className="prm-info__row-left">
                        <div className="prm-info__row-icon"><Phone size={16} /></div>
                        <div>
                          <span className="prm-info__row-key">{contact.name}</span>
                          <p style={{ fontSize: '0.75rem', color: 'var(--color-slate-400)', marginTop: '0.125rem' }}>{contact.relationship}</p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span className="prm-info__row-value">{contact.phone}</span>
                        <button type="button" onClick={() => { setEditingContactId(contact.id); setEditContactDraft({ name: contact.name, phone: contact.phone, relationship: contact.relationship }); }} style={{ color: 'var(--color-slate-400)', background: 'none', border: 'none', cursor: 'pointer', padding: '0.375rem', borderRadius: '0.375rem', display: 'flex' }} title="Editar contacto"><Pencil size={15} /></button>
                        <button type="button" onClick={() => deleteEmergencyContact.mutate({ prmId: id!, ecId: contact.id })} style={{ color: 'var(--color-slate-400)', background: 'none', border: 'none', cursor: 'pointer', padding: '0.375rem', borderRadius: '0.375rem', display: 'flex' }} title="Eliminar contacto"><Trash2 size={15} /></button>
                      </div>
                    </div>
                  )
                ))}
              </div>
            ) : (
              !showAddContact && (
                <p style={{ fontSize: '0.875rem', color: 'var(--color-slate-400)' }}>
                  No hay contactos de urgencia
                </p>
              )
            )}

            {showAddContact && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1rem', background: 'white', borderRadius: '0.75rem', border: '1px solid var(--color-slate-100)' }}>
                <input
                  type="text"
                  className="prm-edit-input"
                  placeholder="Nombre"
                  value={newContact.name}
                  onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                  style={{ maxWidth: '100%', width: '100%' }}
                />
                <input
                  type="tel"
                  className="prm-edit-input"
                  placeholder="Teléfono"
                  value={newContact.phone}
                  onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                  style={{ maxWidth: '100%', width: '100%' }}
                />
                <input
                  type="text"
                  className="prm-edit-input"
                  placeholder="Relación (ej: Madre, Hermano)"
                  value={newContact.relationship}
                  onChange={(e) => setNewContact({ ...newContact, relationship: e.target.value })}
                  style={{ maxWidth: '100%', width: '100%' }}
                />
                <div className="prm-edit-actions" style={{ justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    className="prm-edit-actions__cancel"
                    onClick={() => { setShowAddContact(false); setNewContact({ name: '', phone: '', relationship: '' }); }}
                  >
                    <X size={14} /> Cancelar
                  </button>
                  <button
                    type="button"
                    className="prm-edit-actions__save"
                    disabled={!newContact.name.trim() || !newContact.phone.trim() || addEmergencyContact.isPending}
                    onClick={async () => {
                      await addEmergencyContact.mutateAsync({
                        prmId: id!,
                        name: newContact.name.trim(),
                        phone: newContact.phone.trim(),
                        relationship: newContact.relationship.trim(),
                      });
                      setShowAddContact(false);
                      setNewContact({ name: '', phone: '', relationship: '' });
                    }}
                  >
                    <Check size={14} /> Guardar
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Addresses */}
          <div className="prm-info">
            <div className="prm-info__header">
              <h3 className="prm-info__title">Direcciones</h3>
              {!showAddAddr && (
                <button
                  className="prm-info__edit-btn"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                  }}
                  onClick={() => setShowAddAddr(true)}
                >
                  <Plus size={14} /> Añadir
                </button>
              )}
            </div>

            {addrLoading ? (
              <div className="prm-detail__skeleton-line" />
            ) : (
              <>
                {addresses && addresses.length > 0 && (
                  <div className="prm-info__rows">
                    {addresses.map((addr) => (
                      editingAddressId === addr.id ? (
                        <div key={addr.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1rem', borderBottom: '1px solid var(--color-slate-50)' }}>
                          <AddressSelector value={editAddrDraft.value} onChange={(v) => setEditAddrDraft({ ...editAddrDraft, value: v })} showValidation={false} />
                          <input type="text" className="prm-edit-input" placeholder="Alias (ej: Casa, Hospital…)" value={editAddrDraft.alias} onChange={(e) => setEditAddrDraft({ ...editAddrDraft, alias: e.target.value })} maxLength={40} style={{ maxWidth: '100%', width: '100%' }} />
                          <div className="prm-edit-actions" style={{ justifyContent: 'flex-end' }}>
                            <button type="button" className="prm-edit-actions__cancel" onClick={() => setEditingAddressId(null)}><X size={14} /> Cancelar</button>
                            <button type="button" className="prm-edit-actions__save" disabled={!editAddrDraft.value.full_address || updatePrmAddress.isPending}
                              onClick={async () => {
                                await updatePrmAddress.mutateAsync({ prmId: id!, addressId: addr.id, full_address: editAddrDraft.value.full_address, lat: editAddrDraft.value.lat, lng: editAddrDraft.value.lng, is_accessible: editAddrDraft.value.is_accessible, alias: editAddrDraft.alias });
                                setEditingAddressId(null);
                              }}
                            ><Check size={14} /> Guardar</button>
                          </div>
                        </div>
                      ) : (
                        <div key={addr.id} className="prm-info__row">
                          <div className="prm-info__row-left">
                            <div className="prm-info__row-icon"><MapPin size={16} /></div>
                            <div>
                              {addr.alias && <span className="prm-info__row-key">{addr.alias}</span>}
                              <p style={{ fontSize: '0.8rem', color: 'var(--color-slate-400)', marginTop: addr.alias ? '0.125rem' : 0 }}>{addr.full_address}</p>
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <button type="button" onClick={() => { setEditingAddressId(addr.id); setEditAddrDraft({ value: { full_address: addr.full_address, lat: addr.lat, lng: addr.lng, is_accessible: addr.is_accessible }, alias: addr.alias || '' }); }} style={{ color: 'var(--color-slate-400)', background: 'none', border: 'none', cursor: 'pointer', padding: '0.375rem', borderRadius: '0.375rem', display: 'flex' }} title="Editar dirección"><Pencil size={15} /></button>
                            <button type="button" onClick={() => deletePrmAddress.mutate({ prmId: id!, addressId: addr.id })} style={{ color: 'var(--color-slate-400)', background: 'none', border: 'none', cursor: 'pointer', padding: '0.375rem', borderRadius: '0.375rem', display: 'flex' }} title="Eliminar dirección"><Trash2 size={15} /></button>
                          </div>
                        </div>
                      )
                    ))}
                  </div>
                )}

                {(!addresses || addresses.length === 0) && !showAddAddr && (
                  <p
                    style={{
                      fontSize: '0.875rem',
                      color: 'var(--color-slate-400)',
                    }}
                  >
                    No hay direcciones guardadas
                  </p>
                )}

                {showAddAddr && (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.75rem',
                      padding: '1rem',
                      background: 'white',
                      borderRadius: '0.75rem',
                      border: '1px solid var(--color-slate-100)',
                    }}
                  >
                    <AddressSelector
                      value={newAddrValue}
                      onChange={setNewAddrValue}
                      showValidation={false}
                    />
                    <input
                      type="text"
                      className="prm-edit-input"
                      placeholder="Alias (ej: Casa, Hospital…)"
                      value={newAddrAlias}
                      onChange={(e) => setNewAddrAlias(e.target.value)}
                      maxLength={40}
                      style={{ maxWidth: '100%', width: '100%' }}
                    />
                    <div
                      className="prm-edit-actions"
                      style={{ justifyContent: 'flex-end' }}
                    >
                      <button
                        type="button"
                        className="prm-edit-actions__cancel"
                        onClick={() => {
                          setShowAddAddr(false);
                          setNewAddrValue({});
                          setNewAddrAlias('');
                        }}
                      >
                        <X size={14} /> Cancelar
                      </button>
                      <button
                        type="button"
                        className="prm-edit-actions__save"
                        disabled={
                          !newAddrValue.full_address || addPrmAddress.isPending
                        }
                        onClick={async () => {
                          if (!newAddrValue.full_address) return;
                          await addPrmAddress.mutateAsync({
                            prmId: id!,
                            full_address: newAddrValue.full_address,
                            lat: newAddrValue.lat,
                            lng: newAddrValue.lng,
                            is_accessible: newAddrValue.is_accessible ?? false,
                            alias: newAddrAlias,
                          });
                          setShowAddAddr(false);
                          setNewAddrValue({});
                          setNewAddrAlias('');
                        }}
                      >
                        <Check size={14} /> Guardar
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

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
