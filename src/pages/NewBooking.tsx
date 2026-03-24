import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, MapPin, Navigation, Accessibility, Send, Clock, AlertCircle, Search, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../utils';
import type { ServiceReason } from '../types';
import { usePatients, type PatientListItem } from '../hooks/usePatients';
import { useCreateBooking } from '../hooks/useBookings';

const SERVICE_REASONS: ServiceReason[] = [
  'medical_appointment',
  'physiotherapy',
  'dialysis',
  'hospital_admission',
  'administrative',
  'other',
];

// Simple debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export default function NewBooking() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // ---- Patient picker ----
  const [patientQuery, setPatientQuery] = useState('');
  const debouncedQuery = useDebounce(patientQuery, 300);
  const [selectedPatient, setSelectedPatient] = useState<PatientListItem | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  const { data: patients = [] } = usePatients(debouncedQuery || undefined);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ---- Form state ----
  const [pickup, setPickup] = useState('');
  const [destination, setDestination] = useState('');
  const [urgency, setUrgency] = useState<'routine' | 'urgent'>('routine');
  const [serviceReason, setServiceReason] = useState<ServiceReason | ''>('');
  const [serviceReasonNotes, setServiceReasonNotes] = useState('');

  // ---- Mutation ----
  const createBooking = useCreateBooking();

  const handleSubmit = async () => {
    if (!selectedPatient) return;

    const today = new Date().toISOString().split('T')[0];
    await createBooking.mutateAsync({
      patientId: selectedPatient.id,
      date: today,
      startTime: '09:00',
      endTime: '10:00',
      location: destination || pickup,
      service_reason: serviceReason || undefined,
      service_reason_notes: serviceReason === 'other' ? serviceReasonNotes : undefined,
      urgency,
    });

    navigate('/');
  };

  const canSubmit = Boolean(selectedPatient && (pickup || destination) && !createBooking.isPending);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="h-20 flex items-center px-8 bg-white border-b border-slate-100 sticky top-0 z-20">
        <button
          onClick={() => navigate(-1)}
          className="p-2.5 rounded-xl hover:bg-slate-50 text-[#6b4691] transition-all mr-4"
        >
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-xl font-bold text-slate-900 flex-1 text-center pr-12">{t('booking.title')}</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-xl mx-auto space-y-10">

          {/* Progress dots */}
          <div className="flex justify-center gap-3">
            {[1, 2, 3].map((s, i) => {
              const active = i === 0 ? Boolean(pickup || destination) : i === 1 ? Boolean(selectedPatient) : Boolean(urgency);
              return (
                <div
                  key={s}
                  className={cn(
                    'h-2 rounded-full transition-all duration-500',
                    active ? 'w-10 bg-[#6b4691]' : 'w-2 bg-[#6b4691]/20'
                  )}
                />
              );
            })}
          </div>

          {/* Step 1: Location */}
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <span className="size-8 rounded-full bg-[#6b4691] text-white flex items-center justify-center font-black text-sm">1</span>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">{t('booking.locationDetails')}</h3>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6 relative overflow-hidden">
              <div className="absolute left-9 top-14 bottom-14 w-0.5 bg-gradient-to-b from-[#6b4691]/30 via-slate-100 to-slate-300" />

              <div className="relative pl-10 space-y-1.5">
                <Navigation className="absolute left-0 top-1 text-[#6b4691]" size={20} />
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('booking.pickupAddress')}</label>
                <input
                  type="text"
                  value={pickup}
                  onChange={(e) => setPickup(e.target.value)}
                  placeholder={t('booking.pickupPlaceholder')}
                  className="w-full px-4 py-3.5 rounded-xl border-none bg-slate-50 focus:ring-2 focus:ring-[#6b4691] outline-none transition-all text-sm font-medium"
                />
              </div>

              <div className="relative pl-10 space-y-1.5">
                <MapPin className="absolute left-0 top-1 text-slate-400" size={20} />
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('booking.destinationAddress')}</label>
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder={t('booking.destinationPlaceholder')}
                  className="w-full px-4 py-3.5 rounded-xl border-none bg-slate-50 focus:ring-2 focus:ring-[#6b4691] outline-none transition-all text-sm font-medium"
                />
              </div>
            </div>
          </section>

          {/* Step 2: Passenger */}
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <span className="size-8 rounded-full bg-[#6b4691]/10 text-[#6b4691] flex items-center justify-center font-black text-sm border border-[#6b4691]/20">2</span>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">{t('booking.passengerDetails')}</h3>
            </div>

            {/* Patient picker */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">{t('booking.selectPatient')}</label>

              {selectedPatient ? (
                <div className="flex items-center justify-between bg-[#6b4691]/5 rounded-2xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-full bg-[#6b4691]/10 text-[#6b4691] flex items-center justify-center font-bold text-sm">
                      {selectedPatient.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{selectedPatient.name}</p>
                      <p className="text-xs text-slate-500">{selectedPatient.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle size={16} className="text-emerald-500" />
                    <button
                      type="button"
                      onClick={() => { setSelectedPatient(null); setPatientQuery(''); }}
                      className="text-xs font-bold text-slate-400 hover:text-slate-600 ml-2"
                    >
                      Cambiar
                    </button>
                  </div>
                </div>
              ) : (
                <div ref={pickerRef} className="relative">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      type="text"
                      value={patientQuery}
                      onChange={(e) => { setPatientQuery(e.target.value); setPickerOpen(true); }}
                      onFocus={() => setPickerOpen(true)}
                      placeholder={t('booking.searchPatient')}
                      className="w-full pl-11 pr-4 py-3.5 rounded-xl border-none bg-slate-50 focus:ring-2 focus:ring-[#6b4691] outline-none text-sm font-medium"
                    />
                  </div>
                  {pickerOpen && patients.length > 0 && (
                    <ul className="absolute z-50 mt-1 w-full bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden max-h-52 overflow-y-auto">
                      {patients.map((p) => (
                        <li key={p.id}>
                          <button
                            type="button"
                            onClick={() => { setSelectedPatient(p); setPatientQuery(p.name); setPickerOpen(false); }}
                            className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-[#6b4691]/5 transition-colors"
                          >
                            <div className="size-8 rounded-full bg-[#6b4691]/10 text-[#6b4691] flex items-center justify-center font-bold text-xs shrink-0">
                              {p.name.charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-slate-900 truncate">{p.name}</p>
                              <p className="text-xs text-slate-500 truncate">{p.email}</p>
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            {/* PMR status toggle */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="size-12 rounded-2xl bg-[#6b4691]/5 text-[#6b4691] flex items-center justify-center">
                  <Accessibility size={24} />
                </div>
                <div>
                  <p className="font-bold text-slate-900">{t('booking.pmrStatus')}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('booking.reducedMobility')}</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-14 h-8 bg-slate-100 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-[#6b4691]" />
              </label>
            </div>

            {/* Service reason */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">{t('booking.serviceReason')}</label>
              <select
                value={serviceReason}
                onChange={(e) => {
                  setServiceReason(e.target.value as ServiceReason | '');
                  setServiceReasonNotes('');
                }}
                className="w-full px-4 py-3.5 rounded-xl border-none bg-slate-50 focus:ring-2 focus:ring-[#6b4691] outline-none transition-all text-sm font-medium text-slate-700"
              >
                <option value="">{t('booking.serviceReasonPlaceholder')}</option>
                {SERVICE_REASONS.map((reason) => (
                  <option key={reason} value={reason}>
                    {t(`booking.reasons.${reason}`)}
                  </option>
                ))}
              </select>

              {serviceReason === 'other' && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">{t('booking.serviceReasonNotes')}</label>
                  <textarea
                    value={serviceReasonNotes}
                    onChange={(e) => setServiceReasonNotes(e.target.value)}
                    placeholder={t('booking.serviceReasonNotesPlaceholder')}
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border-none bg-slate-50 focus:ring-2 focus:ring-[#6b4691] outline-none transition-all text-sm font-medium resize-none"
                  />
                </div>
              )}
            </div>
          </section>

          {/* Step 3: Urgency */}
          <section className="space-y-6 pb-32">
            <div className="flex items-center gap-3">
              <span className="size-8 rounded-full bg-[#6b4691]/10 text-[#6b4691] flex items-center justify-center font-black text-sm border border-[#6b4691]/20">3</span>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">{t('booking.urgency')}</h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setUrgency('routine')}
                className={cn(
                  'p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-3',
                  urgency === 'routine'
                    ? 'bg-[#6b4691] border-[#6b4691] text-white shadow-xl shadow-[#6b4691]/30'
                    : 'bg-white border-slate-100 text-slate-400 hover:border-[#6b4691]/30'
                )}
              >
                <Clock size={32} />
                <span className="font-black text-sm uppercase tracking-widest">{t('booking.routine')}</span>
              </button>
              <button
                type="button"
                onClick={() => setUrgency('urgent')}
                className={cn(
                  'p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-3',
                  urgency === 'urgent'
                    ? 'bg-red-500 border-red-500 text-white shadow-xl shadow-red-500/30'
                    : 'bg-white border-slate-100 text-slate-400 hover:border-red-500/30'
                )}
              >
                <AlertCircle size={32} />
                <span className="font-black text-sm uppercase tracking-widest">{t('booking.urgent')}</span>
              </button>
            </div>
          </section>

        </div>
      </div>

      {/* Bottom actions */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-md border-t border-slate-100 z-30">
        <div className="max-w-xl mx-auto flex gap-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex-1 h-16 rounded-2xl text-slate-500 font-black uppercase tracking-widest text-xs hover:bg-slate-50 transition-all"
          >
            {t('booking.cancel')}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="flex-[2] h-16 rounded-2xl bg-[#6b4691] text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-[#6b4691]/30 flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
          >
            <span>{createBooking.isPending ? t('booking.submitting') : t('booking.submit')}</span>
            {!createBooking.isPending && <Send size={18} />}
          </button>
        </div>
      </div>
    </div>
  );
}
