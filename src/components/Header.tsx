import { Bell, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
  return (
    <header className="h-20 flex items-center justify-between px-8 bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-20">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{title}</h2>
        {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
      </div>
      
      <div className="flex items-center gap-4">
        <Link 
          to="/notifications"
          className="p-2.5 rounded-xl bg-slate-50 text-slate-600 hover:bg-slate-100 transition-all relative group"
        >
          <Bell size={20} className="group-hover:rotate-12 transition-transform" />
          <span className="absolute top-2.5 right-2.5 size-2 bg-red-500 rounded-full border-2 border-white"></span>
        </Link>
        <div className="flex items-center gap-2 px-4 py-2 bg-[#6b4691]/10 text-[#6b4691] rounded-xl font-bold text-sm border border-[#6b4691]/10">
          <Calendar size={16} />
          <span>marzo 2026</span>
        </div>
      </div>
    </header>
  );
}
