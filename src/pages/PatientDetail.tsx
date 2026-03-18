import Header from '../components/Header';
import { MOCK_PATIENTS } from '../mockData';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MoreVertical, Mail, Phone, Cake, Calendar, User, BookOpen } from 'lucide-react';

export default function PatientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const patient = MOCK_PATIENTS.find(p => p.id === id) || MOCK_PATIENTS[0];

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="h-20 flex items-center px-8 bg-white border-b border-slate-100 sticky top-0 z-20">
        <button 
          onClick={() => navigate(-1)}
          className="p-2.5 rounded-xl hover:bg-slate-50 text-[#6b4691] transition-all mr-4"
        >
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-xl font-bold text-slate-900 flex-1">Patient Details</h2>
        <button className="p-2.5 rounded-xl hover:bg-slate-50 text-slate-400 transition-all">
          <MoreVertical size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-3xl mx-auto space-y-8">
          
          {/* Profile Header */}
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="relative">
              <img 
                src={patient.avatar || `https://ui-avatars.com/api/?name=${patient.name}&background=random`}
                alt={patient.name}
                className="size-32 rounded-full object-cover border-4 border-white shadow-xl"
              />
              <div className="absolute bottom-1 right-1 size-6 bg-emerald-500 border-4 border-white rounded-full"></div>
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">{patient.name}</h1>
              <div className="flex items-center justify-center gap-2 mt-2">
                <span className="px-3 py-1 rounded-full bg-[#6b4691]/10 text-[#6b4691] text-[10px] font-bold uppercase tracking-widest">
                  {patient.status}
                </span>
                <span className="text-sm text-slate-400 font-medium">#{patient.id}</span>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Blood', value: patient.bloodType },
              { label: 'Height', value: patient.height },
              { label: 'Weight', value: patient.weight },
            ].map((stat) => (
              <div key={stat.label} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm text-center space-y-1">
                <p className="text-lg font-bold text-[#6b4691]">{stat.value}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Personal Info */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Personal Info</h3>
              <button className="text-sm font-bold text-[#6b4691] hover:underline">Edit</button>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm divide-y divide-slate-50">
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-[#6b4691]/5 text-[#6b4691]">
                    <Mail size={16} />
                  </div>
                  <span className="text-sm font-medium text-slate-500">Email</span>
                </div>
                <span className="text-sm font-bold text-slate-900">{patient.email}</span>
              </div>
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-[#6b4691]/5 text-[#6b4691]">
                    <Phone size={16} />
                  </div>
                  <span className="text-sm font-medium text-slate-500">Phone</span>
                </div>
                <span className="text-sm font-bold text-slate-900">{patient.phone}</span>
              </div>
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-[#6b4691]/5 text-[#6b4691]">
                    <Cake size={16} />
                  </div>
                  <span className="text-sm font-medium text-slate-500">Birthdate</span>
                </div>
                <span className="text-sm font-bold text-slate-900">{patient.birthDate}</span>
              </div>
            </div>
          </div>

          {/* Recent History */}
          <div className="space-y-4 pb-24">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Recent History</h3>
              <button className="text-sm font-bold text-[#6b4691] hover:underline">View All</button>
            </div>
            <div className="space-y-3">
              {[
                { date: '24', month: 'JUN', title: 'General Check-up', desc: 'PMR reportó fatiga leve y alergias estacionales. Signos vitales normales.', dr: 'Dr. Sarah Wilson' },
                { date: '12', month: 'MAY', title: 'Blood Test Analysis', desc: 'Cholesterol levels improved. Continued current medication plan.', dr: 'Dr. James Miller' },
              ].map((item, i) => (
                <div key={i} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex gap-4">
                  <div className="flex flex-col items-center justify-center bg-[#6b4691]/5 rounded-xl px-4 py-2 min-w-[70px]">
                    <span className="text-xl font-black text-[#6b4691]">{item.date}</span>
                    <span className="text-[10px] font-bold text-[#6b4691]/60 uppercase tracking-widest">{item.month}</span>
                  </div>
                  <div className="flex-1 space-y-1">
                    <h4 className="font-bold text-slate-900">{item.title}</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
                    <div className="flex items-center gap-1.5 pt-1">
                      <User size={12} className="text-slate-400" />
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.dr}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-8 right-8 z-30">
        <button className="bg-[#6b4691] text-white px-8 py-4 rounded-full font-bold shadow-2xl shadow-[#6b4691]/40 flex items-center gap-2 hover:scale-105 active:scale-95 transition-all">
          <BookOpen size={20} />
          <span>Book Appointment</span>
        </button>
      </div>
    </div>
  );
}
