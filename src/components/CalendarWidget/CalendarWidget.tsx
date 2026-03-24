import { ChevronLeft, ChevronRight } from 'lucide-react';
import './CalendarWidget.css';

export default function CalendarWidget() {
  const days = Array.from({ length: 21 }, (_, i) => i + 1);

  return (
    <div className="calendar">
      <div className="calendar__header">
        <h3 className="calendar__month">October 2023</h3>
        <div className="calendar__nav">
          <button className="calendar__nav-btn">
            <ChevronLeft size={18} />
          </button>
          <button className="calendar__nav-btn">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="calendar__weekdays">
        <span>S</span>
        <span>M</span>
        <span>T</span>
        <span>W</span>
        <span>T</span>
        <span>F</span>
        <span>S</span>
      </div>

      <div className="calendar__days">
        <div className="calendar__spacer" />
        {days.map((day) => (
          <button
            key={day}
            className={`calendar__day${day === 5 ? ' calendar__day--selected' : ''}`}
          >
            {day}
          </button>
        ))}
      </div>
    </div>
  );
}
