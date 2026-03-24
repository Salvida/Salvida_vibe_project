import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface CalendarWidgetProps {
  onDateSelect?: (date: Date) => void;
  selectedDate?: Date;
}

export default function CalendarWidget({ onDateSelect, selectedDate }: CalendarWidgetProps) {
  const { t } = useTranslation();
  const months: string[] = t('calendar.months', { returnObjects: true }) as string[];
  const weekdays: string[] = t('calendar.weekdays', { returnObjects: true }) as string[];

  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const goToPrevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const goToNextMonth = () => setViewDate(new Date(year, month + 1, 1));

  const handleDayClick = (day: number) => {
    const date = new Date(year, month, day);
    onDateSelect?.(date);
  };

  const isSelected = (day: number) => {
    if (!selectedDate) return false;
    return (
      selectedDate.getFullYear() === year &&
      selectedDate.getMonth() === month &&
      selectedDate.getDate() === day
    );
  };

  const isToday = (day: number) =>
    today.getFullYear() === year &&
    today.getMonth() === month &&
    today.getDate() === day;

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold text-slate-900">
          {months[month]} {year}
        </h3>
        <div className="flex gap-1">
          <button
            onClick={goToPrevMonth}
            className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-[#6b4691] transition-colors"
            aria-label="Mes anterior"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={goToNextMonth}
            className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-[#6b4691] transition-colors"
            aria-label="Mes siguiente"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">
        {weekdays.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {/* Empty cells before first day */}
        {Array.from({ length: firstDayOfMonth }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}

        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => (
          <button
            key={day}
            onClick={() => handleDayClick(day)}
            className={`h-10 flex items-center justify-center text-sm font-medium rounded-xl transition-all ${
              isSelected(day)
                ? 'bg-[#6b4691] text-white shadow-lg shadow-[#6b4691]/30 font-bold'
                : isToday(day)
                ? 'border-2 border-[#6b4691] text-[#6b4691] font-bold'
                : 'hover:bg-slate-50 text-slate-600'
            }`}
          >
            {day}
          </button>
        ))}
      </div>
    </div>
  );
}
