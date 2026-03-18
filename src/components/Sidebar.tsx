import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, CalendarDays, Users, Settings, Bell, LogOut, HeartPulse } from 'lucide-react';
import { cn } from '../utils';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: CalendarDays, label: 'Bookings', path: '/bookings' },
  { icon: Users, label: 'Patients (PMRs)', path: '/patients' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside className="w-64 flex flex-col bg-white border-r border-slate-200 h-screen sticky top-0 shrink-0">
      <div className="p-6 flex items-center gap-3">
        <div className="size-10 bg-[#6b4691] rounded-xl flex items-center justify-center text-white">
          <HeartPulse size={24} />
        </div>
        <div>
          <h1 className="text-lg font-bold leading-none text-[#6b4691]">Salvida</h1>
          <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">Management Portal</p>
        </div>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                isActive 
                  ? "bg-[#6b4691] text-white shadow-lg shadow-[#6b4691]/20" 
                  : "text-slate-600 hover:bg-slate-50 hover:text-[#6b4691]"
              )}
            >
              <item.icon size={20} />
              <span className="font-medium text-sm">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-100">
        <div className="flex items-center justify-between p-2 bg-slate-50 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-full bg-[#6b4691]/10 flex items-center justify-center text-[#6b4691] font-bold text-sm">
              DR
            </div>
            <div className="flex flex-col min-w-0">
              <p className="text-sm font-bold truncate">Dr. Julian Ross</p>
              <p className="text-[10px] text-slate-500 uppercase font-bold">Administrator</p>
            </div>
          </div>
          <button className="text-slate-400 hover:text-[#6b4691] transition-colors">
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
}
