import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, CalendarDays, Users, Settings, LogOut, HeartPulse } from 'lucide-react';
import './Sidebar.css';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: CalendarDays, label: 'Bookings', path: '/bookings' },
  { icon: Users, label: 'Patients (PMRs)', path: '/patients' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside className="sidebar">
      <div className="sidebar__logo">
        <div className="sidebar__logo-icon">
          <HeartPulse size={24} />
        </div>
        <div>
          <h1 className="sidebar__logo-name">Salvida</h1>
          <p className="sidebar__logo-sub">Management Portal</p>
        </div>
      </div>

      <nav className="sidebar__nav">
        {navItems.map((item) => {
          const isActive =
            location.pathname === item.path ||
            (item.path !== '/' && location.pathname.startsWith(item.path));
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`sidebar__nav-link${isActive ? ' sidebar__nav-link--active' : ''}`}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="sidebar__footer">
        <div className="sidebar__user">
          <div className="sidebar__user-info">
            <div className="sidebar__user-avatar">DR</div>
            <div>
              <p className="sidebar__user-name">Dr. Julian Ross</p>
              <p className="sidebar__user-role">Administrator</p>
            </div>
          </div>
          <button className="sidebar__logout-btn">
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
}
