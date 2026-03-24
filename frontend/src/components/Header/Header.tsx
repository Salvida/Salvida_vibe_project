import { Bell, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import './Header.css';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
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
          <span>marzo 2026</span>
        </div>
      </div>
    </header>
  );
}
