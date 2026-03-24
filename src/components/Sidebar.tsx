import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LayoutDashboard, CalendarDays, Users, Settings, LogOut, HeartPulse } from 'lucide-react';
import { cn } from '../utils';
import { useAuthStore } from '../store/useAuthStore';

export default function Sidebar() {
  const { t } = useTranslation();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);

  const navItems = [
    { icon: LayoutDashboard, label: t('nav.dashboard'), path: '/' },
    { icon: CalendarDays, label: t('nav.bookings'), path: '/bookings' },
    { icon: Users, label: t('nav.patients'), path: '/patients' },
    { icon: Settings, label: t('nav.settings'), path: '/settings' },
  ];

  const initials = user
    ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`
    : '??';

  const displayName = user ? `${user.firstName} ${user.lastName}` : '';

  return (
    <aside className="w-64 flex flex-col bg-white border-r border-slate-200 h-screen sticky top-0 shrink-0">
      <div className="p-6 flex items-center gap-3">
        <div className="size-10 bg-[#6b4691] rounded-xl flex items-center justify-center text-white">
          <HeartPulse size={24} />
        </div>
        <div>
          <h1 className="text-lg font-bold leading-none text-[#6b4691]">{t('nav.brand')}</h1>
          <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">{t('nav.brandSubtitle')}</p>
        </div>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive =
            location.pathname === item.path ||
            (item.path !== '/' && location.pathname.startsWith(item.path));
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
                isActive
                  ? 'bg-[#6b4691] text-white shadow-lg shadow-[#6b4691]/20'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-[#6b4691]'
              )}
            >
              <item.icon size={20} />
              <span className="font-medium text-sm">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-100">
        <div className="flex items-center justify-between p-2 bg-slate-50 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-full bg-[#6b4691]/10 flex items-center justify-center text-[#6b4691] font-bold text-sm">
              {initials}
            </div>
            <div className="flex flex-col min-w-0">
              <p className="text-sm font-bold truncate">{displayName}</p>
              <p className="text-[10px] text-slate-500 uppercase font-bold">{user?.role ?? t('common.administrator')}</p>
            </div>
          </div>
          <button
            className="text-slate-400 hover:text-[#6b4691] transition-colors"
            aria-label={t('common.logout')}
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
}
