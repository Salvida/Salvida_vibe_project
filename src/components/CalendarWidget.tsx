import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function CalendarWidget() {
  const days = Array.from({ length: 21 }, (_, i) => i + 1);
  
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold text-slate-900">October 2023</h3>
        <div className="flex gap-1">
          <button className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-[#6b4691] transition-colors">
            <ChevronLeft size={18} />
          </button>
          <button className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-[#6b4691] transition-colors">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">
        <span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span>
      </div>
      
      <div className="grid grid-cols-7 gap-1">
        {/* Placeholder for previous month days */}
        <div className="col-span-3"></div>
        {days.map((day) => (
          <button
            key={day}
            className={`h-10 flex items-center justify-center text-sm font-medium rounded-xl transition-all ${
              day === 5 
                ? "bg-[#6b4691] text-white shadow-lg shadow-[#6b4691]/30 font-bold" 
                : "hover:bg-slate-50 text-slate-600"
            }`}
          >
            {day}
          </button>
        ))}
      </div>
    </div>
  );
}
