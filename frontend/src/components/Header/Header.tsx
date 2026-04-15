import { Bell, Calendar, Menu } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useUIStore } from '../../store/useUIStore';
import './Header.css';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
  const { t } = useTranslation();
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const now = new Date();
  const monthName = now.toLocaleDateString('es-ES', { month: 'long' });
  const year = now.getFullYear();

  return (
    <header className="header">
      <div className="header__left">
        <button className="header__menu-btn" onClick={toggleSidebar} aria-label="Toggle menu">
          <Menu size={22} />
        </button>
        <div>
          <h2 className="header__title">{title}</h2>
          {subtitle && <p className="header__subtitle">{subtitle}</p>}
        </div>
      </div>

      <div className="header__actions">
        <Link to="/app/notifications" className="header__notif-btn">
          <Bell size={20} />
          <span className="header__notif-badge" />
        </Link>
        <div className="header__date">
          <Calendar size={16} />
          <span>{t('header.date', { month: monthName, year })}</span>
        </div>
      </div>
    </header>
  );
}
