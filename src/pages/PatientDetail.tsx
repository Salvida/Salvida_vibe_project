import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Mail, Phone, Cake, User, BookOpen, Pencil, ClipboardList,
  Trash2, Save, XCircle, CheckCircle, Plus, X, MapPin, ShieldCheck, Clock, AlertTriangle,
} from 'lucide-react';
import DropdownMenu from '../components/DropdownMenu';
import AddressSelector from '../components/AddressSelector';
import { usePatient, useUpdatePatient } from '../hooks/usePatients';
import type { EmergencyContact, Address } from '../types';
import { apiClient } from '../lib/api';
import { useQueryClient } from '@tanstack/react-query';
import { patientKey } from '../hooks/usePatients';
import { cn } from '../utils';

function formatBirthDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function ValidationBadge({ status }: { status: 'pending' | 'validated' | 'rejected' }) {
  const { t } = useTranslation();
  const config = {
    pending: { icon: Clock, label: t('patientDetail.addressPending'), className: 'bg-amber-50 text-amber-600' },
    validated: { icon: ShieldCheck, label: t('patientDetail.addressValidated'), className: 'bg-emerald-50 text-emerald-600' },
    rejected: { icon: AlertTriangle, label: t('patientDetail.addressRejected'), className: 'bg-red-50 text-red-500' },
  }[status];

  const Icon = config.icon;
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest', config.className)}>
      <Icon size={11} />
      {config.label}
    </span>
  );
}

type ContactDraft = Omit<EmergencyContact, 'id'> & { id?: string };

export default function PatientDetail() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: patient, isLoading, isError } = usePatient(id!);
  const updatePatient = useUpdatePatient();

  const [isEditing, setIsEditing] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // ---- Edit form state ----
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    birthDate: '',
    bloodType: '',
    height: '',
    weight: '',
    dni: '',
    status: 'Activo' as 'Activo' | 'Inactivo',
  });
  const [contacts, setContacts] = useState<ContactDraft[]>([]);
  const [addressDraft, setAddressDraft] = useState<Partial<Address> | undefined>(undefined);

  // Sync form when patient data arrives
  useEffect(() => {
    if (patient) {
      setForm({
        name: patient.name ?? '',
        email: patient.email ?? '',
        phone: patient.phone ?? '',
        birthDate: patient.birthDate ?? '',
        bloodType: patient.bloodType ?? '',
        height: patient.height ?? '',
        weight: patient.weight ?? '',
        dni: patient.dni ?? '',
        status: patient.status ?? 'Activo',
      });
      setContacts(patient.emergency_contacts?.map((c) => ({ ...c })) ?? []);
      setAddressDraft(patient.address ? { ...patient.address } : undefined);
    }
  }, [patient]);

  const handleFieldChange = (field: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    if (saveStatus !== 'idle') setSaveStatus('idle');
  };

  // ---- Emergency contacts helpers ----
  const addContact = () => {
    if (contacts.length >= 2) return;
    setContacts((prev) => [...prev, { name: '', phone: '', relationship: '' }]);
  };

  const removeContact = (index: number) => {
    setContacts((prev) => prev.filter((_, i) => i !== index));
  };

  const updateContact = (index: number, field: keyof ContactDraft, value: string) => {
    setContacts((prev) => prev.map((c, i) => (i === index ? { ...c, [field]: value } : c)));
  };

  // ---- Save ----
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updatePatient.mutateAsync({ id: id!, ...form });

      // Sync emergency contacts: delete existing, create new ones
      // (simple approach: delete all existing contacts then re-create)
      const existing = patient?.emergency_contacts ?? [];
      for (const ec of existing) {
        await apiClient.delete(`/api/patients/${id}/emergency-contacts/${ec.id}`);
      }
      for (const draft of contacts) {
        if (draft.name.trim() && draft.phone.trim()) {
          await apiClient.post(`/api/patients/${id}/emergency-contacts`, {
            name: draft.name,
            phone: draft.phone,
            relationship: draft.relationship,
          });
        }
      }

      qc.invalidateQueries({ queryKey: patientKey(id!) });
      setSaveStatus('success');
      setTimeout(() => {
        setSaveStatus('idle');
        setIsEditing(false);
      }, 1500);
    } catch {
      setSaveStatus('error');
    }
  };

  const handleCancelEdit = () => {
    if (patient) {
      setForm({
        name: patient.name ?? '',
        email: patient.email ?? '',
        phone: patient.phone ?? '',
        birthDate: patient.birthDate ?? '',
        bloodType: patient.bloodType ?? '',
        height: patient.height ?? '',
        weight: patient.weight ?? '',
        dni: patient.dni ?? '',
        status: patient.status ?? 'Activo',
      });
      setContacts(patient.emergency_contacts?.map((c) => ({ ...c })) ?? []);
      setAddressDraft(patient.address ? { ...patient.address } : undefined);
    }
    setSaveStatus('idle');
    setIsEditing(false);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Top bar */}
      <div className="h-20 flex items-center px-8 bg-white border-b border-slate-100 sticky top-0 z-20">
        <button
          onClick={() => navigate(-1)}
          className="p-2.5 rounded-xl hover:bg-slate-50 text-[#6b4691] transition-all mr-4"
        >
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-xl font-bold text-slate-900 flex-1">{t('patientDetail.title')}</h2>
        {patient && !isEditing && (
          <DropdownMenu
            items={[
              {
                label: t('patientDetail.menu.edit'),
                icon: <Pencil size={14} />,
                onClick: () => setIsEditing(true),
              },
              {
                label: t('patientDetail.menu.history'),
                icon: <ClipboardList size={14} />,
                onClick: () => {},
              },
              {
                label: t('patientDetail.menu.delete'),
                icon: <Trash2 size={14} />,
                onClick: () => {},
                variant: 'danger',
              },
            ]}
          />
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-3xl mx-auto space-y-8">

          {/* Loading skeleton */}
          {isLoading && (
            <div className="animate-pulse space-y-8">
              <div className="flex flex-col items-center gap-4">
                <div className="size-32 rounded-full bg-slate-100" />
                <div className="h-6 bg-slate-100 rounded w-48" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-slate-100 rounded-2xl" />)}
              </div>
            </div>
          )}

          {/* Error state */}
          {isError && (
            <div className="bg-white p-10 rounded-2xl border border-slate-100 text-center text-slate-400">
              <p className="font-bold text-slate-700 mb-2">{t('patientDetail.notFound')}</p>
              <button onClick={() => navigate(-1)} className="text-sm text-[#6b4691] font-bold hover:underline">
                {t('patientDetail.goBack')}
              </button>
            </div>
          )}

          {/* ==================== VIEW MODE ==================== */}
          {patient && !isEditing && (
            <>
              {/* Profile header */}
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="relative">
                  <img
                    src={patient.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(patient.name)}&background=random`}
                    alt={patient.name}
                    className="size-32 rounded-full object-cover border-4 border-white shadow-xl"
                  />
                  <div className="absolute bottom-1 right-1 size-6 bg-emerald-500 border-4 border-white rounded-full" />
                </div>
                <div>
                  <h1 className="text-3xl font-black text-slate-900 tracking-tight">{patient.name}</h1>
                  <div className="flex items-center justify-center gap-2 mt-2">
                    <span className="px-3 py-1 rounded-full bg-[#6b4691]/10 text-[#6b4691] text-[10px] font-bold uppercase tracking-widest">
                      {patient.status}
                    </span>
                    <span className="text-sm text-slate-400 font-medium">#{patient.id}</span>
                  </div>
                </div>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: t('patientDetail.blood'), value: patient.bloodType },
                  { label: t('patientDetail.height'), value: patient.height },
                  { label: t('patientDetail.weight'), value: patient.weight },
                ].map((stat) => (
                  <div key={stat.label} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm text-center space-y-1">
                    <p className="text-lg font-bold text-[#6b4691]">{stat.value}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* Personal info */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-900">{t('patientDetail.personalInfo')}</h3>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-sm font-bold text-[#6b4691] hover:underline"
                  >
                    {t('patientDetail.edit')}
                  </button>
                </div>
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm divide-y divide-slate-50">
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-[#6b4691]/5 text-[#6b4691]"><Mail size={16} /></div>
                      <span className="text-sm font-medium text-slate-500">{t('patientDetail.email')}</span>
                    </div>
                    <span className="text-sm font-bold text-slate-900">{patient.email}</span>
                  </div>
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-[#6b4691]/5 text-[#6b4691]"><Phone size={16} /></div>
                      <span className="text-sm font-medium text-slate-500">{t('patientDetail.phone')}</span>
                    </div>
                    <span className="text-sm font-bold text-slate-900">{patient.phone}</span>
                  </div>
                  {patient.birthDate && (
                    <div className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-[#6b4691]/5 text-[#6b4691]"><Cake size={16} /></div>
                        <span className="text-sm font-medium text-slate-500">{t('patientDetail.birthdate')}</span>
                      </div>
                      <span className="text-sm font-bold text-slate-900">{formatBirthDate(patient.birthDate)}</span>
                    </div>
                  )}
                  {patient.dni && (
                    <div className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-[#6b4691]/5 text-[#6b4691]"><User size={16} /></div>
                        <span className="text-sm font-medium text-slate-500">{t('patientDetail.dni')}</span>
                      </div>
                      <span className="text-sm font-bold text-slate-900">{patient.dni}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Address */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-900">{t('patientDetail.address')}</h3>
                {patient.address ? (
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-[#6b4691]/5 text-[#6b4691] mt-0.5"><MapPin size={16} /></div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-slate-900">{patient.address.full_address}</p>
                        {patient.address.is_accessible && (
                          <p className="text-xs text-emerald-600 font-medium mt-1">{t('patientDetail.addressAccessible')}</p>
                        )}
                      </div>
                      <ValidationBadge status={patient.address.validation_status} />
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-6 text-center text-slate-400">
                    <MapPin size={24} className="mx-auto mb-2 opacity-40" />
                    <p className="text-sm">{t('patientDetail.noAddress')}</p>
                  </div>
                )}
              </div>

              {/* Emergency contacts */}
              {patient.emergency_contacts && patient.emergency_contacts.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-slate-900">{t('patientDetail.emergencyContacts')}</h3>
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm divide-y divide-slate-50">
                    {patient.emergency_contacts.map((contact) => (
                      <div key={contact.id} className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-[#6b4691]/5 text-[#6b4691]"><User size={16} /></div>
                          <div>
                            <p className="text-sm font-bold text-slate-900">{contact.name}</p>
                            <p className="text-xs text-slate-500">{contact.relationship}</p>
                          </div>
                        </div>
                        <span className="text-sm font-bold text-slate-900">{contact.phone}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent history */}
              <div className="space-y-4 pb-24">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-900">{t('patientDetail.recentHistory')}</h3>
                  <button className="text-sm font-bold text-[#6b4691] hover:underline">{t('patientDetail.viewAll')}</button>
                </div>
                <div className="space-y-3">
                  {[
                    { date: '24', month: 'JUN', title: 'Revisión general', desc: 'PRM reportó fatiga leve y alergias estacionales.', dr: 'Dra. Sara Wilson' },
                    { date: '12', month: 'MAY', title: 'Análisis de sangre', desc: 'Niveles de colesterol mejorados.', dr: 'Dr. Jaime Miller' },
                  ].map((item, i) => (
                    <div key={i} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex gap-4">
                      <div className="flex flex-col items-center justify-center bg-[#6b4691]/5 rounded-xl px-4 py-2 min-w-[70px]">
                        <span className="text-xl font-black text-[#6b4691]">{item.date}</span>
                        <span className="text-[10px] font-bold text-[#6b4691]/60 uppercase tracking-widest">{item.month}</span>
                      </div>
                      <div className="flex-1 space-y-1">
                        <h4 className="font-bold text-slate-900">{item.title}</h4>
                        <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
                        <div className="flex items-center gap-1.5 pt-1">
                          <User size={12} className="text-slate-400" />
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.dr}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ==================== EDIT MODE ==================== */}
          {patient && isEditing && (
            <form onSubmit={handleSave} className="space-y-8 pb-24">

              {/* Edit header */}
              <div className="flex items-center gap-4">
                <div className="size-20 rounded-full bg-[#6b4691]/10 flex items-center justify-center text-[#6b4691] text-2xl font-black border-4 border-white shadow-sm">
                  {form.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()}
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900">{t('patientDetail.editProfile')}</h2>
                  <p className="text-sm text-slate-400 font-medium">#{patient.id}</p>
                </div>
              </div>

              {/* Basic fields */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">
                <h3 className="text-base font-bold text-slate-900">{t('patientDetail.personalInfo')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('patientDetail.form.name')}</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={handleFieldChange('name')}
                      required
                      className="w-full px-4 py-3 rounded-xl border-none bg-slate-50 focus:ring-2 focus:ring-[#6b4691] outline-none font-medium"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('patientDetail.email')}</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={handleFieldChange('email')}
                      className="w-full px-4 py-3 rounded-xl border-none bg-slate-50 focus:ring-2 focus:ring-[#6b4691] outline-none font-medium"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('patientDetail.phone')}</label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={handleFieldChange('phone')}
                      className="w-full px-4 py-3 rounded-xl border-none bg-slate-50 focus:ring-2 focus:ring-[#6b4691] outline-none font-medium"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('patientDetail.form.birthDate')}</label>
                    <input
                      type="date"
                      value={form.birthDate}
                      onChange={handleFieldChange('birthDate')}
                      className="w-full px-4 py-3 rounded-xl border-none bg-slate-50 focus:ring-2 focus:ring-[#6b4691] outline-none font-medium"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('patientDetail.dni')}</label>
                    <input
                      type="text"
                      value={form.dni}
                      onChange={handleFieldChange('dni')}
                      className="w-full px-4 py-3 rounded-xl border-none bg-slate-50 focus:ring-2 focus:ring-[#6b4691] outline-none font-medium"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('patientDetail.form.bloodType')}</label>
                    <input
                      type="text"
                      value={form.bloodType}
                      onChange={handleFieldChange('bloodType')}
                      className="w-full px-4 py-3 rounded-xl border-none bg-slate-50 focus:ring-2 focus:ring-[#6b4691] outline-none font-medium"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('patientDetail.form.height')}</label>
                    <input
                      type="text"
                      value={form.height}
                      onChange={handleFieldChange('height')}
                      placeholder="170cm"
                      className="w-full px-4 py-3 rounded-xl border-none bg-slate-50 focus:ring-2 focus:ring-[#6b4691] outline-none font-medium"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('patientDetail.form.weight')}</label>
                    <input
                      type="text"
                      value={form.weight}
                      onChange={handleFieldChange('weight')}
                      placeholder="70kg"
                      className="w-full px-4 py-3 rounded-xl border-none bg-slate-50 focus:ring-2 focus:ring-[#6b4691] outline-none font-medium"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('patientDetail.form.statusLabel')}</label>
                    <select
                      value={form.status}
                      onChange={handleFieldChange('status')}
                      className="w-full px-4 py-3 rounded-xl border-none bg-slate-50 focus:ring-2 focus:ring-[#6b4691] outline-none font-medium"
                    >
                      <option value="Activo">{t('common.active')}</option>
                      <option value="Inactivo">{t('common.inactive')}</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Emergency contacts */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-900">{t('patientDetail.emergencyContacts')}</h3>
                  {contacts.length < 2 ? (
                    <button
                      type="button"
                      onClick={addContact}
                      className="flex items-center gap-1.5 text-sm font-bold text-[#6b4691] hover:underline"
                    >
                      <Plus size={15} />
                      {t('patientDetail.addContact')}
                    </button>
                  ) : (
                    <span className="text-xs text-slate-400 font-medium">{t('patientDetail.maxContactsReached')}</span>
                  )}
                </div>

                {contacts.length === 0 && (
                  <p className="text-sm text-slate-400 text-center py-4">{t('patientDetail.noAddress')}</p>
                )}

                <div className="space-y-4">
                  {contacts.map((contact, index) => (
                    <div key={index} className="relative bg-slate-50 rounded-xl p-4 space-y-3">
                      <button
                        type="button"
                        onClick={() => removeContact(index)}
                        className="absolute top-3 right-3 p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                        title={t('patientDetail.removeContact')}
                      >
                        <X size={15} />
                      </button>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('patientDetail.contactName')}</label>
                          <input
                            type="text"
                            value={contact.name}
                            onChange={(e) => updateContact(index, 'name', e.target.value)}
                            placeholder={t('patientDetail.contactNamePlaceholder')}
                            className="w-full px-3 py-2.5 rounded-lg border-none bg-white focus:ring-2 focus:ring-[#6b4691] outline-none text-sm font-medium"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('patientDetail.contactPhone')}</label>
                          <input
                            type="tel"
                            value={contact.phone}
                            onChange={(e) => updateContact(index, 'phone', e.target.value)}
                            placeholder={t('patientDetail.contactPhonePlaceholder')}
                            className="w-full px-3 py-2.5 rounded-lg border-none bg-white focus:ring-2 focus:ring-[#6b4691] outline-none text-sm font-medium"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('patientDetail.contactRelationship')}</label>
                          <input
                            type="text"
                            value={contact.relationship}
                            onChange={(e) => updateContact(index, 'relationship', e.target.value)}
                            placeholder={t('patientDetail.contactRelationshipPlaceholder')}
                            className="w-full px-3 py-2.5 rounded-lg border-none bg-white focus:ring-2 focus:ring-[#6b4691] outline-none text-sm font-medium"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Address with Nominatim autocomplete + Leaflet map */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
                <h3 className="text-base font-bold text-slate-900">{t('patientDetail.address')}</h3>
                <AddressSelector
                  value={addressDraft}
                  onChange={setAddressDraft}
                  showValidation
                />
              </div>

              {/* Save bar */}
              <div className="flex items-center justify-end gap-4 pt-2">
                {saveStatus === 'success' && (
                  <div className="flex items-center gap-2 text-emerald-600 text-sm font-bold">
                    <CheckCircle size={16} />{t('patientDetail.saveSuccess')}
                  </div>
                )}
                {saveStatus === 'error' && (
                  <div className="flex items-center gap-2 text-red-500 text-sm font-bold">
                    <XCircle size={16} />{t('patientDetail.saveError')}
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-all"
                >
                  {t('patientDetail.cancelEdit')}
                </button>
                <button
                  type="submit"
                  disabled={updatePatient.isPending}
                  className="bg-[#6b4691] text-white px-10 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-xl shadow-[#6b4691]/30 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <Save size={18} />
                  <span>{updatePatient.isPending ? 'Guardando...' : t('patientDetail.saveChanges')}</span>
                </button>
              </div>

            </form>
          )}

        </div>
      </div>

      {/* FAB — only in view mode */}
      {patient && !isEditing && (
        <div className="fixed bottom-8 right-8 z-30">
          <button className="bg-[#6b4691] text-white px-8 py-4 rounded-full font-bold shadow-2xl shadow-[#6b4691]/40 flex items-center gap-2 hover:scale-105 active:scale-95 transition-all">
            <BookOpen size={20} />
            <span>{t('patientDetail.bookAppointment')}</span>
          </button>
        </div>
      )}
    </div>
  );
}
