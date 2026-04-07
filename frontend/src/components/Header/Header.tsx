import { Bell, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './Header.css';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
  const { t } = useTranslation();
  const now = new Date();
  const monthName = now.toLocaleDateString('es-ES', { month: 'long' });
  const year = now.getFullYear();

  return (
    <header className="header">
      <div>
        <h2 className="header__title">{title}</h2>
        {subtitle && <p className="header__subtitle">{subtitle}</p>}
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
