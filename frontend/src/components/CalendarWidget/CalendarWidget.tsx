import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import './CalendarWidget.css';

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number) {
  return new Date(year, month, 1).getDay(); // 0=Sun
}

interface CalendarWidgetProps {
  onDateSelect?: (date: Date) => void;
}

export default function CalendarWidget({ onDateSelect }: CalendarWidgetProps) {
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
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => (
          <button
            key={day}
            onClick={() => handleDayClick(day)}
            className={`calendar__day${isSelected(day) ? ' calendar__day--selected' : ''}`}
          >
            {day}
          </button>
        ))}
      </div>
    </div>
  );
}
