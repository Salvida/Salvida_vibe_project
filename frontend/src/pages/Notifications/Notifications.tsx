import { MOCK_NOTIFICATIONS } from '../../mockData';
import { Calendar, Bell, User, CheckCircle, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { ComponentType } from 'react';
import type { Notification } from '../../types';
import './Notifications.css';

const iconMap: Record<Notification['type'], ComponentType<{ size?: number }>> = {
  reservation: Calendar,
  system: Bell,
  profile: User,
  confirmation: CheckCircle,
};

export default function Notifications() {
  const navigate = useNavigate();

  return (
    <div className="notifications">
      <div className="notifications__header">
        <button
          onClick={() => navigate(-1)}
          className="notifications__back-btn"
        >
          <ArrowLeft size={20} />
        </button>
        <h2 className="notifications__title">Notifications</h2>
        <button className="notifications__clear-btn">Clear All</button>
      </div>

      <div className="notifications__body">
        <div className="notifications__inner">

          <div>
            <h3 className="notif-section__heading">Recent Activities</h3>
            <div className="notif-list">
              {MOCK_NOTIFICATIONS.map((notif) => {
                const Icon = iconMap[notif.type];
                return (
                  <div key={notif.id} className="notif-item">
                    <div className="notif-item__icon">
                      <Icon size={24} />
                    </div>
                    <div className="notif-item__content">
                      <p className="notif-item__title">{notif.title}</p>
                      <p className="notif-item__desc">{notif.description}</p>
                      <span className="notif-item__time">{notif.time}</span>
                    </div>
                    {notif.unread && <div className="notif-item__unread" />}
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <button className="notif-older-btn">
              View Older Notifications
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
