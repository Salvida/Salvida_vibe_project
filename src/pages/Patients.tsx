import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Plus, Mail, Phone, Eye, Pencil, UserX } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import DropdownMenu from '../components/DropdownMenu';
import { usePatients } from '../hooks/usePatients';
import { cn } from '../utils';

// Simple debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useMemo(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export default function Patients() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);

  const { data: patients = [], isLoading } = usePatients(debouncedQuery || undefined);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header
        title={t('patients.title')}
        subtitle={t('patients.subtitle')}
      />

      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-7xl mx-auto space-y-8">

          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('patients.search')}
                className="w-full pl-12 pr-4 py-3 rounded-xl border-none bg-white shadow-sm ring-1 ring-slate-100 focus:ring-2 focus:ring-[#6b4691] outline-none transition-all text-sm"
              />
            </div>
            <button className="w-full md:w-auto bg-[#6b4691] text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#6b4691]/20 hover:bg-[#543673] transition-all">
              <Plus size={20} />
              <span>{t('patients.addPatient')}</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-6 py-4 text-[10px] font-bold text-[#6b4691] uppercase tracking-widest">{t('patients.columns.name')}</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-[#6b4691] uppercase tracking-widest">{t('patients.columns.contact')}</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-[#6b4691] uppercase tracking-widest text-center">{t('patients.columns.bookings')}</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-[#6b4691] uppercase tracking-widest">{t('patients.columns.lastVisit')}</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-[#6b4691] uppercase tracking-widest">{t('patients.columns.status')}</th>
                    <th className="px-6 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoading ? (
                    [1, 2, 3, 4].map((i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-4">
                            <div className="size-10 rounded-full bg-slate-100" />
                            <div className="h-4 bg-slate-100 rounded w-32" />
                          </div>
                        </td>
                        <td className="px-6 py-5"><div className="h-3 bg-slate-100 rounded w-40" /></td>
                        <td className="px-6 py-5 text-center"><div className="h-4 bg-slate-100 rounded w-8 mx-auto" /></td>
                        <td className="px-6 py-5"><div className="h-3 bg-slate-100 rounded w-24" /></td>
                        <td className="px-6 py-5"><div className="h-5 bg-slate-100 rounded-full w-16" /></td>
                        <td className="px-6 py-5" />
                      </tr>
                    ))
                  ) : patients.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-10 text-center text-slate-400 text-sm">
                        No se encontraron PRMs
                      </td>
                    </tr>
                  ) : (
                    patients.map((patient) => (
                      <tr key={patient.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-6 py-5">
                          <Link to={`/patients/${patient.id}`} className="flex items-center gap-4">
                            <div className="size-10 rounded-full bg-[#6b4691]/10 text-[#6b4691] flex items-center justify-center font-bold text-sm">
                              {patient.name.charAt(0)}
                            </div>
                            <span className="font-bold text-slate-900 group-hover:text-[#6b4691] transition-colors">{patient.name}</span>
                          </Link>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1.5 text-xs text-slate-500">
                              <Mail size={12} /><span>{patient.email}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-slate-500">
                              <Phone size={12} /><span>{patient.phone}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-center font-bold text-slate-900">—</td>
                        <td className="px-6 py-5 text-xs text-slate-500 font-medium">—</td>
                        <td className="px-6 py-5">
                          <span className={cn(
                            'px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider',
                            patient.status === 'Activo' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'
                          )}>
                            {t(`common.${patient.status === 'Activo' ? 'active' : 'inactive'}`)}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <DropdownMenu
                            items={[
                              {
                                label: t('patients.menu.viewProfile'),
                                icon: <Eye size={14} />,
                                onClick: () => navigate(`/patients/${patient.id}`),
                              },
                              {
                                label: t('patients.menu.edit'),
                                icon: <Pencil size={14} />,
                                onClick: () => navigate(`/patients/${patient.id}`),
                              },
                              {
                                label: t('patients.menu.deactivate'),
                                icon: <UserX size={14} />,
                                onClick: () => {},
                                variant: 'danger',
                              },
                            ]}
                          />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
