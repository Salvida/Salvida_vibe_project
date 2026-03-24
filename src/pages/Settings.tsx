import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  User, Bell, Shield, Palette, Languages, Camera, Save,
  CheckCircle, XCircle, Mail, Smartphone, CalendarClock, Lock, Eye, EyeOff,
} from 'lucide-react';
import Header from '../components/Header';
import { cn } from '../utils';
import { useAuthStore } from '../store/useAuthStore';
import { useUpdateProfile } from '../hooks/useProfile';
import type { NotificationPrefs } from '../types';

// ---- Toggle switch component ----
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex w-14 h-8 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#6b4691] focus:ring-offset-2',
        checked ? 'bg-[#6b4691]' : 'bg-slate-200'
      )}
    >
      <span
        className={cn(
          'absolute top-1 left-1 size-6 bg-white rounded-full shadow transition-transform duration-200',
          checked ? 'translate-x-6' : 'translate-x-0'
        )}
      />
    </button>
  );
}

export default function Settings() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const updateProfileMutation = useUpdateProfile();

  const [activeSection, setActiveSection] = useState('profile');

  // ---- Profile form ----
  const [form, setForm] = useState({
    firstName: user?.firstName ?? '',
    lastName: user?.lastName ?? '',
    email: user?.email ?? '',
    phone: user?.phone ?? '',
    organization: user?.organization ?? '',
    dni: user?.dni ?? '',
  });
  const [profileStatus, setProfileStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    if (user) {
      setForm({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        organization: user.organization,
        dni: user.dni ?? '',
      });
    }
  }, [user]);

  const handleChange = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    if (profileStatus !== 'idle') setProfileStatus('idle');
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfileMutation.mutateAsync(form);
      setProfileStatus('success');
      setTimeout(() => setProfileStatus('idle'), 3000);
    } catch {
      setProfileStatus('error');
    }
  };

  // ---- Notifications form ----
  const defaultNotifPrefs: NotificationPrefs = { email: true, push: false, booking_reminder: true };
  const [notifPrefs, setNotifPrefs] = useState<NotificationPrefs>(
    user?.notification_prefs ?? defaultNotifPrefs
  );
  const [notifStatus, setNotifStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    if (user?.notification_prefs) setNotifPrefs(user.notification_prefs);
  }, [user]);

  const handleToggle = (key: keyof NotificationPrefs) => (value: boolean) => {
    setNotifPrefs((prev) => ({ ...prev, [key]: value }));
    if (notifStatus !== 'idle') setNotifStatus('idle');
  };

  const handleSaveNotifs = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfileMutation.mutateAsync({ notification_prefs: notifPrefs } as Parameters<typeof updateProfileMutation.mutateAsync>[0]);
      setNotifStatus('success');
      setTimeout(() => setNotifStatus('idle'), 3000);
    } catch {
      setNotifStatus('error');
    }
  };

  // ---- Security form ----
  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' });
  const [showPasswords, setShowPasswords] = useState({ current: false, next: false, confirm: false });
  const [securityStatus, setSecurityStatus] = useState<'idle' | 'success' | 'error' | 'mismatch' | 'tooshort'>('idle');
  const [securityPending, setSecurityPending] = useState(false);

  const handlePasswordChange = (field: keyof typeof passwords) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswords((prev) => ({ ...prev, [field]: e.target.value }));
    if (securityStatus !== 'idle') setSecurityStatus('idle');
  };

  const toggleShowPassword = (field: keyof typeof showPasswords) => () => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSaveSecurity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.next.length < 8) { setSecurityStatus('tooshort'); return; }
    if (passwords.next !== passwords.confirm) { setSecurityStatus('mismatch'); return; }
    setSecurityPending(true);
    try {
      // Supabase Auth updateUser — wired once auth is integrated
      // await supabase.auth.updateUser({ password: passwords.next });
      await new Promise((res) => setTimeout(res, 600)); // simulate
      setSecurityStatus('success');
      setPasswords({ current: '', next: '', confirm: '' });
      setTimeout(() => setSecurityStatus('idle'), 3000);
    } catch {
      setSecurityStatus('error');
    } finally {
      setSecurityPending(false);
    }
  };

  const initials = (form.firstName.charAt(0) + form.lastName.charAt(0)).toUpperCase();

  const sections = [
    { id: 'profile', icon: User, label: t('settings.sections.profile') },
    { id: 'notifications', icon: Bell, label: t('settings.sections.notifications') },
    { id: 'security', icon: Shield, label: t('settings.sections.security') },
    { id: 'appearance', icon: Palette, label: t('settings.sections.appearance') },
    { id: 'language', icon: Languages, label: t('settings.sections.language') },
  ];

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header title={t('settings.title')} subtitle={t('settings.subtitle')} />

      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-8">

          {/* Sub-navigation */}
          <aside className="w-full lg:w-64 shrink-0">
            <div className="bg-white rounded-2xl border border-slate-100 p-2 shadow-sm space-y-1">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={cn(
                    'flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all font-medium text-sm',
                    activeSection === section.id
                      ? 'bg-[#6b4691] text-white shadow-lg shadow-[#6b4691]/20'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-[#6b4691]'
                  )}
                >
                  <section.icon size={18} />
                  <span>{section.label}</span>
                </button>
              ))}
            </div>
          </aside>

          {/* Settings Panel */}
          <div className="flex-1 bg-white rounded-3xl border border-slate-100 shadow-sm p-10 min-h-[600px] flex flex-col">

            {/* ==================== PROFILE ==================== */}
            {activeSection === 'profile' && (
              <div className="space-y-10 flex-1 flex flex-col">
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">{t('settings.profile.title')}</h3>

                <div className="flex items-center gap-8">
                  <div className="relative group">
                    <div className="size-24 bg-[#6b4691]/10 rounded-full flex items-center justify-center text-[#6b4691] text-3xl font-black border-4 border-white shadow-sm">
                      {initials}
                    </div>
                    <button
                      type="button"
                      className="absolute -bottom-1 -right-1 p-2 bg-[#6b4691] text-white rounded-full shadow-lg border-2 border-white group-hover:scale-110 transition-transform"
                    >
                      <Camera size={14} />
                    </button>
                  </div>
                  <div className="space-y-1">
                    <button type="button" className="bg-[#6b4691] text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-md hover:bg-[#543673] transition-all">
                      {t('settings.profile.changePhoto')}
                    </button>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{t('settings.profile.photoHint')}</p>
                  </div>
                </div>

                <form onSubmit={handleSaveProfile} className="flex flex-col flex-1 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('settings.profile.firstName')}</label>
                      <input type="text" value={form.firstName} onChange={handleChange('firstName')} className="w-full px-4 py-3 rounded-xl border-none bg-slate-50 focus:ring-2 focus:ring-[#6b4691] outline-none transition-all font-medium" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('settings.profile.lastName')}</label>
                      <input type="text" value={form.lastName} onChange={handleChange('lastName')} className="w-full px-4 py-3 rounded-xl border-none bg-slate-50 focus:ring-2 focus:ring-[#6b4691] outline-none transition-all font-medium" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('settings.profile.email')}</label>
                      <input type="email" value={form.email} onChange={handleChange('email')} className="w-full px-4 py-3 rounded-xl border-none bg-slate-50 focus:ring-2 focus:ring-[#6b4691] outline-none transition-all font-medium" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('settings.profile.phone')}</label>
                      <input type="tel" value={form.phone} onChange={handleChange('phone')} className="w-full px-4 py-3 rounded-xl border-none bg-slate-50 focus:ring-2 focus:ring-[#6b4691] outline-none transition-all font-medium" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('settings.profile.dni')}</label>
                      <input type="text" value={form.dni} onChange={handleChange('dni')} className="w-full px-4 py-3 rounded-xl border-none bg-slate-50 focus:ring-2 focus:ring-[#6b4691] outline-none transition-all font-medium" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('settings.profile.organization')}</label>
                      <input type="text" value={form.organization} onChange={handleChange('organization')} className="w-full px-4 py-3 rounded-xl border-none bg-slate-50 focus:ring-2 focus:ring-[#6b4691] outline-none transition-all font-medium" />
                    </div>
                  </div>

                  <div className="pt-4 flex items-center justify-end gap-4 mt-auto">
                    {profileStatus === 'success' && (
                      <div className="flex items-center gap-2 text-emerald-600 text-sm font-bold">
                        <CheckCircle size={16} />{t('settings.profile.saveSuccess')}
                      </div>
                    )}
                    {profileStatus === 'error' && (
                      <div className="flex items-center gap-2 text-red-500 text-sm font-bold">
                        <XCircle size={16} />{t('settings.profile.saveError')}
                      </div>
                    )}
                    <button
                      type="submit"
                      disabled={updateProfileMutation.isPending}
                      className="bg-[#6b4691] text-white px-10 py-4 rounded-2xl font-bold flex items-center gap-2 shadow-xl shadow-[#6b4691]/30 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      <Save size={20} />
                      <span>{updateProfileMutation.isPending ? 'Guardando...' : t('settings.profile.save')}</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* ==================== NOTIFICATIONS ==================== */}
            {activeSection === 'notifications' && (
              <form onSubmit={handleSaveNotifs} className="space-y-8 flex-1 flex flex-col">
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">{t('settings.notifications.title')}</h3>

                <div className="space-y-4 flex-1">
                  {[
                    {
                      key: 'email' as const,
                      icon: Mail,
                      label: t('settings.notifications.emailLabel'),
                      desc: t('settings.notifications.emailDesc'),
                    },
                    {
                      key: 'push' as const,
                      icon: Smartphone,
                      label: t('settings.notifications.pushLabel'),
                      desc: t('settings.notifications.pushDesc'),
                    },
                    {
                      key: 'booking_reminder' as const,
                      icon: CalendarClock,
                      label: t('settings.notifications.reminderLabel'),
                      desc: t('settings.notifications.reminderDesc'),
                    },
                  ].map(({ key, icon: Icon, label, desc }) => (
                    <div
                      key={key}
                      className="flex items-center justify-between p-5 rounded-2xl bg-slate-50 hover:bg-slate-100/60 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          'p-3 rounded-xl transition-colors',
                          notifPrefs[key] ? 'bg-[#6b4691]/10 text-[#6b4691]' : 'bg-slate-100 text-slate-400'
                        )}>
                          <Icon size={20} />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{label}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
                        </div>
                      </div>
                      <Toggle checked={notifPrefs[key]} onChange={handleToggle(key)} />
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-end gap-4 pt-4 mt-auto">
                  {notifStatus === 'success' && (
                    <div className="flex items-center gap-2 text-emerald-600 text-sm font-bold">
                      <CheckCircle size={16} />{t('settings.notifications.saveSuccess')}
                    </div>
                  )}
                  {notifStatus === 'error' && (
                    <div className="flex items-center gap-2 text-red-500 text-sm font-bold">
                      <XCircle size={16} />{t('settings.notifications.saveError')}
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={updateProfileMutation.isPending}
                    className="bg-[#6b4691] text-white px-10 py-4 rounded-2xl font-bold flex items-center gap-2 shadow-xl shadow-[#6b4691]/30 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <Save size={20} />
                    <span>{t('settings.notifications.save')}</span>
                  </button>
                </div>
              </form>
            )}

            {/* ==================== SECURITY ==================== */}
            {activeSection === 'security' && (
              <form onSubmit={handleSaveSecurity} className="space-y-8 flex-1 flex flex-col">
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">{t('settings.security.title')}</h3>

                <div className="space-y-5 flex-1">
                  <div className="p-5 rounded-2xl bg-slate-50 flex items-center gap-4 mb-2">
                    <div className="p-3 rounded-xl bg-[#6b4691]/10 text-[#6b4691]">
                      <Lock size={20} />
                    </div>
                    <p className="text-sm font-bold text-slate-700">{t('settings.security.changePassword')}</p>
                  </div>

                  {([
                    { field: 'current' as const, label: t('settings.security.currentPassword'), placeholder: t('settings.security.currentPasswordPlaceholder') },
                    { field: 'next' as const, label: t('settings.security.newPassword'), placeholder: t('settings.security.newPasswordPlaceholder') },
                    { field: 'confirm' as const, label: t('settings.security.confirmPassword'), placeholder: t('settings.security.confirmPasswordPlaceholder') },
                  ]).map(({ field, label, placeholder }) => (
                    <div key={field} className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">{label}</label>
                      <div className="relative">
                        <input
                          type={showPasswords[field] ? 'text' : 'password'}
                          value={passwords[field]}
                          onChange={handlePasswordChange(field)}
                          placeholder={placeholder}
                          autoComplete={field === 'current' ? 'current-password' : 'new-password'}
                          className="w-full px-4 py-3 pr-12 rounded-xl border-none bg-slate-50 focus:ring-2 focus:ring-[#6b4691] outline-none transition-all font-medium"
                        />
                        <button
                          type="button"
                          onClick={toggleShowPassword(field)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          {showPasswords[field] ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-end gap-4 pt-4 mt-auto">
                  {securityStatus === 'success' && (
                    <div className="flex items-center gap-2 text-emerald-600 text-sm font-bold">
                      <CheckCircle size={16} />{t('settings.security.saveSuccess')}
                    </div>
                  )}
                  {(securityStatus === 'error' || securityStatus === 'mismatch' || securityStatus === 'tooshort') && (
                    <div className="flex items-center gap-2 text-red-500 text-sm font-bold">
                      <XCircle size={16} />
                      {securityStatus === 'mismatch'
                        ? t('settings.security.passwordMismatch')
                        : securityStatus === 'tooshort'
                        ? t('settings.security.passwordTooShort')
                        : t('settings.security.saveError')}
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={securityPending || !passwords.current || !passwords.next || !passwords.confirm}
                    className="bg-[#6b4691] text-white px-10 py-4 rounded-2xl font-bold flex items-center gap-2 shadow-xl shadow-[#6b4691]/30 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <Save size={20} />
                    <span>{securityPending ? 'Guardando...' : t('settings.security.save')}</span>
                  </button>
                </div>
              </form>
            )}

            {/* ==================== PLACEHOLDERS (Appearance + Language) ==================== */}
            {(activeSection === 'appearance' || activeSection === 'language') && (() => {
              const section = sections.find((s) => s.id === activeSection);
              const Icon = section?.icon;
              return (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-50">
                  <div className="p-6 rounded-full bg-slate-50">
                    {Icon && <Icon size={48} className="text-[#6b4691]" />}
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">{section?.label}</h3>
                  <p className="text-sm text-slate-500 max-w-xs">{t('common.underDevelopment')}</p>
                </div>
              );
            })()}

          </div>
        </div>
      </div>
    </div>
  );
}
