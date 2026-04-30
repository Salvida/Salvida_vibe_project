import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Tooltip, ConfigProvider } from 'antd';
import { useTranslation } from 'react-i18next';
import type { Booking } from '../../types';
import './CalendarWidget.css';

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number) {
  return new Date(year, month, 1).getDay(); // 0=Sun
}

function dayKey(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

const STATUS_DOT: Record<Booking['status'], string> = {
  Pending:     'calendar__dot--pending',
  Approved:    'calendar__dot--approved',
  Completed:   'calendar__dot--completed',
  Cancelled:   'calendar__dot--cancelled',
  SignPending: 'calendar__dot--sign-pending',
};

const STATUS_TOOLTIP: Record<Booking['status'], string> = {
  Pending:     'calendar__tooltip-status--pending',
  Approved:    'calendar__tooltip-status--approved',
  Completed:   'calendar__tooltip-status--completed',
  Cancelled:   'calendar__tooltip-status--cancelled',
  SignPending: 'calendar__tooltip-status--sign-pending',
};

interface CalendarWidgetProps {
  onDateSelect?: (date: Date) => void;
  onMonthChange?: (v: { year: number; month: number }) => void;
  bookingsByDate?: Record<string, Booking[]>;
}

export default function CalendarWidget({
  onDateSelect,
  onMonthChange,
  bookingsByDate,
}: CalendarWidgetProps) {
  const { t } = useTranslation();
  const today = new Date();

  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<number>(today.getDate());
  const [selectedMonth, setSelectedMonth] = useState<number>(today.getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(today.getFullYear());

  const daysInMonth = getDaysInMonth(year, month);
  const firstDayOffset = getFirstDayOfWeek(year, month);

  const months = t('calendar.months', { returnObjects: true }) as string[];
  const weekdays = t('calendar.weekdays', { returnObjects: true }) as string[];

  useEffect(() => {
    onMonthChange?.({ year, month });
  }, [year, month]);

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  }

  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  }

  function handleDayClick(day: number) {
    setSelectedDay(day);
    setSelectedMonth(month);
    setSelectedYear(year);
    onDateSelect?.(new Date(year, month, day));
  }

  function isSelected(day: number) {
    return day === selectedDay && month === selectedMonth && year === selectedYear;
  }

  function renderDay(day: number) {
    const key = dayKey(year, month, day);
    const dayBookings = bookingsByDate?.[key];
    const selected = isSelected(day);

    const uniqueStatuses = dayBookings?.length
      ? (Object.keys(STATUS_DOT) as Booking['status'][]).filter((s) =>
          dayBookings.some((b) => b.status === s)
        )
      : [];

    const btn = (
      <button
        key={day}
        onClick={() => handleDayClick(day)}
        className={`calendar__day${selected ? ' calendar__day--selected' : ''}${dayBookings?.length ? ' calendar__day--has-bookings' : ''}`}
      >
        <span className="calendar__day-num">{day}</span>
        <span className="calendar__dots">
          {uniqueStatuses.map((s) => (
            <span key={s} className={`calendar__dot ${STATUS_DOT[s]}`} />
          ))}
        </span>
      </button>
    );

    if (!dayBookings?.length) return btn;

    const tooltipContent = (
      <div className="calendar__tooltip">
        {dayBookings.slice(0, 5).map((b) => (
          <div key={b.id} className="calendar__tooltip-row">
            <span className="calendar__tooltip-time">{b.startTime}</span>
            <span className="calendar__tooltip-name">{b.prmName}</span>
            <span className={`calendar__tooltip-status ${STATUS_TOOLTIP[b.status]}`}>
              {t(`bookingStatuses.${b.status}`)}
            </span>
          </div>
        ))}
        {dayBookings.length > 5 && (
          <div className="calendar__tooltip-more">+{dayBookings.length - 5} más</div>
        )}
      </div>
    );

    return (
      <ConfigProvider key={day} theme={{ token: { colorPrimary: '#6b4691', borderRadius: 8 } }}>
        <Tooltip title={tooltipContent} placement="top" mouseEnterDelay={0.2}>
          {btn}
        </Tooltip>
      </ConfigProvider>
    );
  }

  return (
    <div className="calendar">
      <div className="calendar__header">
        <h3 className="calendar__month">{months[month]} {year}</h3>
        <div className="calendar__nav">
          <button className="calendar__nav-btn" onClick={prevMonth} aria-label="Mes anterior">
            <ChevronLeft size={18} />
          </button>
          <button className="calendar__nav-btn" onClick={nextMonth} aria-label="Mes siguiente">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="calendar__weekdays">
        {weekdays.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>

      <div className="calendar__days">
        {Array.from({ length: firstDayOffset }).map((_, i) => (
          <div key={`spacer-${i}`} className="calendar__spacer" />
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => renderDay(day))}
      </div>
    </div>
  );
}
