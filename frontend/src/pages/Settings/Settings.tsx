import Header from '../../components/Header/Header';
import { User, Bell, Shield, Palette, Languages, Camera, Save } from 'lucide-react';
import { useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import './Settings.css';

interface Section {
  id: string;
  icon: LucideIcon;
  label: string;
}

const sections: Section[] = [
  { id: 'profile', icon: User, label: 'Perfil' },
  { id: 'notifications', icon: Bell, label: 'Notificaciones' },
  { id: 'security', icon: Shield, label: 'Seguridad' },
  { id: 'appearance', icon: Palette, label: 'Apariencia' },
  { id: 'language', icon: Languages, label: 'Idioma' },
];

export default function Settings() {
  const [activeSection, setActiveSection] = useState('profile');

  const activeItem = sections.find((s) => s.id === activeSection);

  return (
    <div className="settings">
      <Header
        title="Ajustes"
        subtitle="Configura tus preferencias y cuenta"
      />

      <div className="settings__body">
        <div className="settings__inner">

          {/* Sub-navigation */}
          <aside className="settings-nav">
            <div className="settings-nav__list">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`settings-nav__btn${activeSection === section.id ? ' settings-nav__btn--active' : ''}`}
                >
                  <section.icon size={18} />
                  <span>{section.label}</span>
                </button>
              ))}
            </div>
          </aside>

          {/* Settings Panel */}
          <div className="settings-panel">
            {activeSection === 'profile' ? (
              <div className="settings-profile">
                <h3 className="settings-profile__title">Ajustes de Perfil</h3>

                {/* Avatar */}
                <div className="settings-avatar">
                  <div className="settings-avatar__wrap">
                    <div className="settings-avatar__circle">AJ</div>
                    <button className="settings-avatar__btn">
                      <Camera size={14} />
                    </button>
                  </div>
                  <div className="settings-avatar__info">
                    <button className="settings-avatar__change-btn">
                      Cambiar foto
                    </button>
                    <p className="settings-avatar__hint">JPG, PNG o GIF. Máximo 2MB.</p>
                  </div>
                </div>

                {/* Form */}
                <form className="settings-form">
                  <div className="settings-form__field">
                    <label className="settings-form__label">Nombre</label>
                    <input type="text" defaultValue="Alex" className="settings-form__input" />
                  </div>
                  <div className="settings-form__field">
                    <label className="settings-form__label">Apellido</label>
                    <input type="text" defaultValue="Johnson" className="settings-form__input" />
                  </div>
                  <div className="settings-form__field">
                    <label className="settings-form__label">Email</label>
                    <input type="email" defaultValue="alex.johnson@salvida.com" className="settings-form__input" />
                  </div>
                  <div className="settings-form__field">
                    <label className="settings-form__label">Teléfono</label>
                    <input type="tel" defaultValue="+34 612 345 678" className="settings-form__input" />
                  </div>
                  <div className="settings-form__field settings-form__field--full">
                    <label className="settings-form__label">Organización</label>
                    <input type="text" defaultValue="Salvida Management" className="settings-form__input" />
                  </div>
                </form>

                <div className="settings-profile__footer">
                  <button className="settings-save-btn">
                    <Save size={20} />
                    <span>Guardar cambios</span>
                  </button>
                </div>
              </div>
            ) : (
              activeItem && (
                <div className="settings-placeholder">
                  <div className="settings-placeholder__icon">
                    <activeItem.icon size={48} />
                  </div>
                  <h3 className="settings-placeholder__title">{activeItem.label} Settings</h3>
                  <p className="settings-placeholder__desc">
                    This section is currently under development. Please check back later.
                  </p>
                </div>
              )
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
