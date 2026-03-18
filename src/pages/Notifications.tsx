import Header from '../components/Header';
import { MOCK_NOTIFICATIONS } from '../mockData';
import { Calendar, Bell, User, CheckCircle, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const iconMap = {
  reservation: Calendar,
  system: Bell,
  profile: User,
  confirmation: CheckCircle,
};

export default function Notifications() {
  const navigate = useNavigate();

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="h-20 flex items-center px-8 bg-white border-b border-slate-100 sticky top-0 z-20">
        <button 
          onClick={() => navigate(-1)}
          className="p-2.5 rounded-xl hover:bg-slate-50 text-[#6b4691] transition-all mr-4"
        >
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-xl font-bold text-slate-900 flex-1">Notifications</h2>
        <button className="text-sm font-bold text-[#6b4691] hover:underline px-4 py-2 rounded-lg hover:bg-[#6b4691]/5 transition-all">
          Clear All
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-2xl mx-auto space-y-8">
          
          <div>
            <h3 className="text-[10px] font-bold text-[#6b4691]/60 uppercase tracking-[0.2em] mb-6">Recent Activities</h3>
            <div className="space-y-2">
              {MOCK_NOTIFICATIONS.map((notif) => {
                const Icon = iconMap[notif.type];
                return (
                  <div 
                    key={notif.id}
                    className="flex items-start gap-4 p-5 rounded-2xl bg-white border border-slate-100 shadow-sm hover:border-[#6b4691]/20 transition-all cursor-pointer group"
                  >
                    <div className="size-12 rounded-xl bg-[#6b4691]/5 text-[#6b4691] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      <Icon size={24} />
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <p className="text-sm font-bold text-slate-900 leading-snug">{notif.title}</p>
                      <p className="text-xs text-slate-500 leading-relaxed">{notif.description}</p>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block pt-2">{notif.time}</span>
                    </div>
                    {notif.unread && (
                      <div className="size-2.5 bg-[#6b4691] rounded-full mt-2 shadow-lg shadow-[#6b4691]/40"></div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-4">
            <button className="w-full py-4 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 hover:border-[#6b4691] hover:text-[#6b4691] hover:bg-[#6b4691]/5 transition-all font-bold text-sm">
              View Older Notifications
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
