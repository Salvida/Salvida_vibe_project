import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MapPin, Clock, PlusCircle, Eye, Pencil, XCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import CalendarWidget from '../components/CalendarWidget';
import DropdownMenu from '../components/DropdownMenu';
import { useBookings, useCancelBooking } from '../hooks/useBookings';

export default function Dashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const selectedDateStr = selectedDate.toISOString().split('T')[0];
  const { data: bookings = [], isLoading } = useBookings({ date: selectedDateStr });
  const cancelBooking = useCancelBooking();

  const pending = bookings.filter((b) => b.status === 'Pending').length;
  const completed = bookings.filter((b) => b.status === 'Completed').length;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header
        title={t('dashboard.title')}
        subtitle={t('dashboard.subtitle')}
      />

      <div className="flex-1 overflow-y-auto p-8">
        <div className="grid grid-cols-12 gap-8 max-w-7xl mx-auto">

          {/* Left Column: Calendar & Summary */}
          <div className="col-span-12 lg:col-span-4 space-y-8">
            <CalendarWidget
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
            />

            <div className="bg-[#6b4691]/5 p-6 rounded-2xl border border-[#6b4691]/10">
              <h4 className="text-xs font-bold text-[#6b4691] uppercase tracking-widest mb-4">
                {t('dashboard.summary')}
              </h4>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 text-sm">{t('dashboard.todayTotal')}</span>
                  <span className="font-bold text-slate-900">{bookings.length} {t('dashboard.trips')}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 text-sm">{t('dashboard.pending')}</span>
                  <span className="font-bold text-amber-500">{pending}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 text-sm">{t('dashboard.completed')}</span>
                  <span className="font-bold text-emerald-500">{completed}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Bookings List */}
          <div className="col-span-12 lg:col-span-8 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900">{t('dashboard.todayBookings')}</h3>
              <button className="text-sm font-bold text-[#6b4691] hover:underline">{t('dashboard.viewAll')}</button>
            </div>

            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white p-5 rounded-2xl border border-slate-100 flex items-center gap-6 animate-pulse">
                    <div className="size-16 rounded-full bg-slate-100" />
                    <div className="flex-1 space-y-3">
                      <div className="h-4 bg-slate-100 rounded w-1/3" />
                      <div className="h-3 bg-slate-100 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : bookings.length === 0 ? (
              <div className="bg-white p-10 rounded-2xl border border-slate-100 text-center text-slate-400">
                <p className="font-medium">No hay reservas para este día</p>
              </div>
            ) : (
              <div className="space-y-4">
                {bookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-6 hover:border-[#6b4691]/30 transition-all group"
                  >
                    <img
                      src={booking.patientAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(booking.patientName)}&background=random`}
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
                          ? 'bg-emerald-50 text-emerald-600'
                          : 'bg-amber-50 text-amber-600'
                      }`}>
                        {t(`booking.status.${booking.status}`)}
                      </span>
                      <DropdownMenu
                        items={[
                          {
                            label: t('booking.menu.viewDetail'),
                            icon: <Eye size={14} />,
                            onClick: () => navigate(`/patients/${booking.patientId}`),
                          },
                          {
                            label: t('booking.menu.edit'),
                            icon: <Pencil size={14} />,
                            onClick: () => {},
                          },
                          {
                            label: t('booking.menu.cancelBooking'),
                            icon: <XCircle size={14} />,
                            onClick: () => cancelBooking.mutate({ id: booking.id }),
                            variant: 'danger',
                          },
                        ]}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            <Link
              to="/bookings/new"
              className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 hover:border-[#6b4691] hover:text-[#6b4691] hover:bg-[#6b4691]/5 transition-all font-bold"
            >
              <PlusCircle size={20} />
              <span>{t('dashboard.requestNewBooking')}</span>
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
