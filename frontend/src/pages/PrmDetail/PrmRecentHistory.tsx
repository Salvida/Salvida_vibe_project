import { useTranslation } from 'react-i18next';

interface HistoryItem {
  date: string;
  month: string;
  title: string;
  description: string;
  doctor: string;
}

interface PrmRecentHistoryProps {
  items?: HistoryItem[];
}

export default function PrmRecentHistory({ items = [] }: PrmRecentHistoryProps) {
  const { t } = useTranslation();

  if (items.length === 0) return null;

  return (
    <div className="prm-history">
      <div className="prm-history__header">
        <h3 className="prm-history__title">{t('prmDetail.recentHistory')}</h3>
        <button className="prm-history__view-btn">{t('prmDetail.viewAll')}</button>
      </div>
      <div className="prm-history__list">
        {items.map((item, i) => (
          <div key={i} className="history-card">
            <div className="history-card__date">
              <span className="history-card__day">{item.date}</span>
              <span className="history-card__month">{item.month}</span>
            </div>
            <div className="history-card__content">
              <h4 className="history-card__title">{item.title}</h4>
              <p className="history-card__desc">{item.description}</p>
              <div className="history-card__doctor">
                <span className="history-card__doctor-name">{item.doctor}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
