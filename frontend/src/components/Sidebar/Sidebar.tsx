import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, CalendarDays, Users, Settings, LogOut, HeartPulse, MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/useAuthStore';
import './Sidebar.css';

const navItems = [
  { icon: LayoutDashboard, labelKey: 'nav.dashboard', path: '/app' },
  { icon: CalendarDays,    labelKey: 'nav.bookings',  path: '/app/bookings' },
  { icon: Users,           labelKey: 'nav.patients',  path: '/app/patients' },
  { icon: MapPin,          labelKey: 'nav.addresses', path: '/app/addresses' },
  { icon: Settings,        labelKey: 'nav.settings',  path: '/app/settings' },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const fullName = user ? `${user.firstName} ${user.lastName}` : '—';
  const initials = user
    ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()
    : '?';

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <aside className="sidebar">
      <div className="sidebar__logo">
        <div className="sidebar__logo-icon">
          <HeartPulse size={24} />
        </div>
        <div>
          <h1 className="sidebar__logo-name">{t('nav.brand')}</h1>
          <p className="sidebar__logo-sub">{t('nav.brandSubtitle')}</p>
        </div>
      </div>

      <nav className="sidebar__nav">
        {navItems.map((item) => {
          const isActive =
            location.pathname === item.path ||
            (item.path !== '/app' && location.pathname.startsWith(item.path));
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`sidebar__nav-link${isActive ? ' sidebar__nav-link--active' : ''}`}
            >
              <item.icon size={20} />
              <span>{t(item.labelKey)}</span>
            </Link>
          );
        })}
      </nav>

      <div className="sidebar__footer">
        <div className="sidebar__user">
          <div className="sidebar__user-info">
            <div className="sidebar__user-avatar">{initials}</div>
            <div>
              <p className="sidebar__user-name">{fullName}</p>
              <p className="sidebar__user-role">{user?.role ?? t('common.administrator')}</p>
            </div>
          </div>
          <button className="sidebar__logout-btn" onClick={handleLogout} title={t('common.logout')}>
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
}
