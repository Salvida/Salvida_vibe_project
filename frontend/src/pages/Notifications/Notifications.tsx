import { Bell, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './Notifications.css';

export default function Notifications() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="notifications">
      <div className="notifications__header">
        <button
          onClick={() => navigate(-1)}
          className="notifications__back-btn"
        >
          <ArrowLeft size={20} />
        </button>
        <h2 className="notifications__title">{t('notifications.title')}</h2>
      </div>

      <div className="notifications__body">
        <div className="notifications__inner">
          <h3 className="notif-section__heading">{t('notifications.recentActivities')}</h3>
          <div className="notif-list notif-list--empty">
            <Bell size={32} className="notif-list__empty-icon" />
            <p className="notif-list__empty-text">{t('notifications.empty')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
