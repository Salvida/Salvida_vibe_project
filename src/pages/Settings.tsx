import Header from '../components/Header';
import { User, Bell, Shield, Palette, Languages, Camera, Save } from 'lucide-react';
import { useState } from 'react';
import { cn } from '../utils';

const sections = [
  { id: 'profile', icon: User, label: 'Perfil' },
  { id: 'notifications', icon: Bell, label: 'Notificaciones' },
  { id: 'security', icon: Shield, label: 'Seguridad' },
  { id: 'appearance', icon: Palette, label: 'Apariencia' },
  { id: 'language', icon: Languages, label: 'Idioma' },
];

export default function Settings() {
  const [activeSection, setActiveSection] = useState('profile');

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header 
        title="Ajustes" 
        subtitle="Configura tus preferencias y cuenta" 
      />
      
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-8">
          
          {/* Sub-navigation */}
          <aside className="w-full lg:w-64 shrink-0">
            <div className="bg-white rounded-2xl border border-slate-100 p-2 shadow-sm space-y-1">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={cn(
                    "flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all font-medium text-sm",
                    activeSection === section.id 
                      ? "bg-[#6b4691] text-white shadow-lg shadow-[#6b4691]/20" 
                      : "text-slate-500 hover:bg-slate-50 hover:text-[#6b4691]"
                  )}
                >
                  <section.icon size={18} />
                  <span>{section.label}</span>
                </button>
              ))}
            </div>
          </aside>

          {/* Settings Panel */}
          <div className="flex-1 bg-white rounded-3xl border border-slate-100 shadow-sm p-10 min-h-[600px] flex flex-col">
            {activeSection === 'profile' && (
              <div className="space-y-10 flex-1 flex flex-col">
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Ajustes de Perfil</h3>
                
                {/* Avatar Section */}
                <div className="flex items-center gap-8">
                  <div className="relative group">
                    <div className="size-24 bg-[#6b4691]/10 rounded-full flex items-center justify-center text-[#6b4691] text-3xl font-black border-4 border-white shadow-sm">
                      AJ
                    </div>
                    <button className="absolute -bottom-1 -right-1 p-2 bg-[#6b4691] text-white rounded-full shadow-lg border-2 border-white group-hover:scale-110 transition-transform">
                      <Camera size={14} />
                    </button>
                  </div>
                  <div className="space-y-1">
                    <button className="bg-[#6b4691] text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-md hover:bg-[#543673] transition-all">
                      Cambiar foto
                    </button>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">JPG, PNG o GIF. Máximo 2MB.</p>
                  </div>
                </div>

                {/* Form */}
                <form className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nombre</label>
                    <input 
                      type="text" 
                      defaultValue="Alex"
                      className="w-full px-4 py-3 rounded-xl border-none bg-slate-50 focus:ring-2 focus:ring-[#6b4691] outline-none transition-all font-medium"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Apellido</label>
                    <input 
                      type="text" 
                      defaultValue="Johnson"
                      className="w-full px-4 py-3 rounded-xl border-none bg-slate-50 focus:ring-2 focus:ring-[#6b4691] outline-none transition-all font-medium"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Email</label>
                    <input 
                      type="email" 
                      defaultValue="alex.johnson@salvida.com"
                      className="w-full px-4 py-3 rounded-xl border-none bg-slate-50 focus:ring-2 focus:ring-[#6b4691] outline-none transition-all font-medium"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Teléfono</label>
                    <input 
                      type="tel" 
                      defaultValue="+34 612 345 678"
                      className="w-full px-4 py-3 rounded-xl border-none bg-slate-50 focus:ring-2 focus:ring-[#6b4691] outline-none transition-all font-medium"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Organización</label>
                    <input 
                      type="text" 
                      defaultValue="Salvida Management"
                      className="w-full px-4 py-3 rounded-xl border-none bg-slate-50 focus:ring-2 focus:ring-[#6b4691] outline-none transition-all font-medium"
                    />
                  </div>
                </form>

                <div className="pt-8 flex justify-end mt-auto">
                  <button className="bg-[#6b4691] text-white px-10 py-4 rounded-2xl font-bold flex items-center gap-2 shadow-xl shadow-[#6b4691]/30 hover:scale-[1.02] active:scale-[0.98] transition-all">
                    <Save size={20} />
                    <span>Guardar cambios</span>
                  </button>
                </div>
              </div>
            )}

            {activeSection !== 'profile' && (() => {
              const section = sections.find(s => s.id === activeSection);
              const Icon = section?.icon;
              return (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-50">
                  <div className="p-6 rounded-full bg-slate-50">
                    {Icon && <Icon size={48} className="text-[#6b4691]" />}
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">{section?.label} Settings</h3>
                  <p className="text-sm text-slate-500 max-w-xs">This section is currently under development. Please check back later.</p>
                </div>
              );
            })()}
          </div>

        </div>
      </div>
    </div>
  );
}
