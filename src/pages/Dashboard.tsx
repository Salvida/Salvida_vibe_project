import Header from '../components/Header';
import CalendarWidget from '../components/CalendarWidget';
import { MOCK_BOOKINGS } from '../mockData';
import { MoreVertical, MapPin, Clock, PlusCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header 
        title="Gestión de Reservas" 
        subtitle="Manage and monitor scheduled patient trips" 
      />
      
      <div className="flex-1 overflow-y-auto p-8">
        <div className="grid grid-cols-12 gap-8 max-w-7xl mx-auto">
          
          {/* Left Column: Calendar & Summary */}
          <div className="col-span-12 lg:col-span-4 space-y-8">
            <CalendarWidget />
            
            <div className="bg-[#6b4691]/5 p-6 rounded-2xl border border-[#6b4691]/10">
              <h4 className="text-xs font-bold text-[#6b4691] uppercase tracking-widest mb-4">Summary</h4>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 text-sm">Today's total</span>
                  <span className="font-bold text-slate-900">12 Trips</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 text-sm">Pending</span>
                  <span className="font-bold text-amber-500">3</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 text-sm">Completed</span>
                  <span className="font-bold text-emerald-500">8</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Bookings List */}
          <div className="col-span-12 lg:col-span-8 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900">Today's Bookings</h3>
              <button className="text-sm font-bold text-[#6b4691] hover:underline">View All</button>
            </div>

            <div className="space-y-4">
              {MOCK_BOOKINGS.map((booking) => (
                <div 
                  key={booking.id}
                  className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-6 hover:border-[#6b4691]/30 transition-all group"
                >
                  <img 
                    src={booking.patientAvatar || `https://ui-avatars.com/api/?name=${booking.patientName}&background=random`} 
                    alt={booking.patientName}
                    className="size-16 rounded-full object-cover border-2 border-slate-50"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-lg text-slate-900 truncate">{booking.patientName}</h4>
                    <div className="flex flex-wrap items-center gap-4 mt-1 text-slate-500 text-sm">
                      <div className="flex items-center gap-1.5">
                        <Clock size={14} className="text-[#6b4691]" />
                        <span>{booking.startTime} - {booking.endTime}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin size={14} className="text-[#6b4691]" />
                        <span className="truncate">{booking.location}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-3">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      booking.status === 'Approved' 
                        ? "bg-emerald-50 text-emerald-600" 
                        : "bg-amber-50 text-amber-600"
                    }`}>
                      {booking.status}
                    </span>
                    <button className="text-slate-400 hover:text-[#6b4691] transition-colors">
                      <MoreVertical size={20} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <Link 
              to="/bookings/new"
              className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 hover:border-[#6b4691] hover:text-[#6b4691] hover:bg-[#6b4691]/5 transition-all font-bold"
            >
              <PlusCircle size={20} />
              <span>Request New Booking</span>
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
