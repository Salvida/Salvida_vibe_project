import Header from '../components/Header';
import { MOCK_PATIENTS } from '../mockData';
import { Search, Plus, Mail, Phone, MoreVertical } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../utils';

export default function Patients() {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header 
        title="Mis PRMs" 
        subtitle="Gestiona tus pacientes de movilidad reducida" 
      />
      
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Buscar PRMs..." 
                className="w-full pl-12 pr-4 py-3 rounded-xl border-none bg-white shadow-sm ring-1 ring-slate-100 focus:ring-2 focus:ring-[#6b4691] outline-none transition-all text-sm"
              />
            </div>
            <button className="w-full md:w-auto bg-[#6b4691] text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#6b4691]/20 hover:bg-[#543673] transition-all">
              <Plus size={20} />
              <span>Añadir PRM</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-6 py-4 text-[10px] font-bold text-[#6b4691] uppercase tracking-widest">Nombre</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-[#6b4691] uppercase tracking-widest">Contacto</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-[#6b4691] uppercase tracking-widest text-center">Reservas</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-[#6b4691] uppercase tracking-widest">Última Visita</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-[#6b4691] uppercase tracking-widest">Estado</th>
                    <th className="px-6 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {MOCK_PATIENTS.map((patient) => (
                    <tr key={patient.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-5">
                        <Link to={`/patients/${patient.id}`} className="flex items-center gap-4">
                          <div className="size-10 rounded-full bg-[#6b4691]/10 text-[#6b4691] flex items-center justify-center font-bold text-sm">
                            {patient.name.charAt(0)}
                          </div>
                          <span className="font-bold text-slate-900 group-hover:text-[#6b4691] transition-colors">{patient.name}</span>
                        </Link>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5 text-xs text-slate-500">
                            <Mail size={12} />
                            <span>{patient.email}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-slate-500">
                            <Phone size={12} />
                            <span>{patient.phone}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-center font-bold text-slate-900">12</td>
                      <td className="px-6 py-5 text-xs text-slate-500 font-medium">2024-01-15</td>
                      <td className="px-6 py-5">
                        <span className={cn(
                          "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                          patient.status === 'Activo' ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"
                        )}>
                          {patient.status}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <button className="text-slate-400 hover:text-[#6b4691] transition-colors">
                          <MoreVertical size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
