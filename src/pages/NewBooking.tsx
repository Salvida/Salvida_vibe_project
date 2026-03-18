import Header from '../components/Header';
import { ArrowLeft, MapPin, Navigation, Accessibility, ChevronLeft, ChevronRight, Send, Clock, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { cn } from '../utils';

export default function NewBooking() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [urgency, setUrgency] = useState('routine');

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="h-20 flex items-center px-8 bg-white border-b border-slate-100 sticky top-0 z-20">
        <button 
          onClick={() => navigate(-1)}
          className="p-2.5 rounded-xl hover:bg-slate-50 text-[#6b4691] transition-all mr-4"
        >
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-xl font-bold text-slate-900 flex-1 text-center pr-12">New Reservation</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-xl mx-auto space-y-10">
          
          {/* Progress */}
          <div className="flex justify-center gap-3">
            {[1, 2, 3].map((s) => (
              <div 
                key={s} 
                className={cn(
                  "h-2 rounded-full transition-all duration-500",
                  s === step ? "w-10 bg-[#6b4691]" : "w-2 bg-[#6b4691]/20"
                )}
              />
            ))}
          </div>

          {/* Step 1: Location */}
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <span className="size-8 rounded-full bg-[#6b4691] text-white flex items-center justify-center font-black text-sm">1</span>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Location Details</h3>
            </div>
            
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6 relative overflow-hidden">
              <div className="absolute left-9 top-14 bottom-14 w-0.5 bg-gradient-to-b from-[#6b4691]/30 via-slate-100 to-slate-300"></div>
              
              <div className="relative pl-10 space-y-1.5">
                <Navigation className="absolute left-0 top-1 text-[#6b4691]" size={20} />
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pickup Address</label>
                <input 
                  type="text" 
                  placeholder="Enter pickup location"
                  className="w-full px-4 py-3.5 rounded-xl border-none bg-slate-50 focus:ring-2 focus:ring-[#6b4691] outline-none transition-all text-sm font-medium"
                />
              </div>

              <div className="relative pl-10 space-y-1.5">
                <MapPin className="absolute left-0 top-1 text-slate-400" size={20} />
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Destination Address</label>
                <input 
                  type="text" 
                  placeholder="Enter destination address"
                  className="w-full px-4 py-3.5 rounded-xl border-none bg-slate-50 focus:ring-2 focus:ring-[#6b4691] outline-none transition-all text-sm font-medium"
                />
              </div>
            </div>
          </section>

          {/* Step 2: Passenger */}
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <span className="size-8 rounded-full bg-[#6b4691]/10 text-[#6b4691] flex items-center justify-center font-black text-sm border border-[#6b4691]/20">2</span>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Passenger Details</h3>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="size-12 rounded-2xl bg-[#6b4691]/5 text-[#6b4691] flex items-center justify-center">
                  <Accessibility size={24} />
                </div>
                <div>
                  <p className="font-bold text-slate-900">PMR Status</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Reduced Mobility</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-14 h-8 bg-slate-100 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-[#6b4691]"></div>
              </label>
            </div>
          </section>

          {/* Step 3: Urgency */}
          <section className="space-y-6 pb-32">
            <div className="flex items-center gap-3">
              <span className="size-8 rounded-full bg-[#6b4691]/10 text-[#6b4691] flex items-center justify-center font-black text-sm border border-[#6b4691]/20">3</span>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Urgency</h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => setUrgency('routine')}
                className={cn(
                  "p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-3",
                  urgency === 'routine' 
                    ? "bg-[#6b4691] border-[#6b4691] text-white shadow-xl shadow-[#6b4691]/30" 
                    : "bg-white border-slate-100 text-slate-400 hover:border-[#6b4691]/30"
                )}
              >
                <Clock size={32} />
                <span className="font-black text-sm uppercase tracking-widest">Routine</span>
              </button>
              <button 
                onClick={() => setUrgency('urgent')}
                className={cn(
                  "p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-3",
                  urgency === 'urgent' 
                    ? "bg-red-500 border-red-500 text-white shadow-xl shadow-red-500/30" 
                    : "bg-white border-slate-100 text-slate-400 hover:border-red-500/30"
                )}
              >
                <AlertCircle size={32} />
                <span className="font-black text-sm uppercase tracking-widest">Urgent</span>
              </button>
            </div>
          </section>

        </div>
      </div>

      {/* Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-md border-t border-slate-100 z-30">
        <div className="max-w-xl mx-auto flex gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="flex-1 h-16 rounded-2xl text-slate-500 font-black uppercase tracking-widest text-xs hover:bg-slate-50 transition-all"
          >
            Cancel
          </button>
          <button className="flex-[2] h-16 rounded-2xl bg-[#6b4691] text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-[#6b4691]/30 flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all">
            <span>Submit Request</span>
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
