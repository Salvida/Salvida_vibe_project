import Header from "../../components/Header/Header";
import {
  User,
  Bell,
  Shield,
  Palette,
  Languages,
  Camera,
  Save,
  Lock,
} from "lucide-react";
import { useState, useEffect } from "react";
import type { LucideIcon } from "lucide-react";
import { useProfile, useUpdateProfile } from "../../hooks/useProfile";
import { useCurrentUserStore } from "../../store/useCurrentUserStore";
import { useSyncCurrentUser } from "../../hooks/useSyncCurrentUser";
import "./Settings.css";

interface Section {
  id: string;
  icon: LucideIcon;
  label: string;
  adminOnly?: boolean;
}

const baseSections: Section[] = [
  { id: "profile", icon: User, label: "Perfil" },
  { id: "notifications", icon: Bell, label: "Notificaciones" },
  { id: "security", icon: Shield, label: "Seguridad" },
  { id: "appearance", icon: Palette, label: "Apariencia" },
  { id: "language", icon: Languages, label: "Idioma" },
  { id: "admin", icon: Lock, label: "Panel Admin", adminOnly: true },
];

export default function Settings() {
  // Sincronizar usuario actual
  useSyncCurrentUser();

  const currentUser = useCurrentUserStore((s) => s.currentUser);
  const isAdminUser = currentUser?.role === "admin";

  // Filtrar secciones: excluir admin si no es admin
  const sections = baseSections.filter(
    (section) => !section.adminOnly || isAdminUser,
  );

  const [activeSection, setActiveSection] = useState("profile");
  const { data: profile, isLoading } = useProfile();
  const { mutate: updateProfile, isPending, isSuccess } = useUpdateProfile();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    organization: "",
  });

  useEffect(() => {
    if (profile) {
      setForm({
        firstName: profile.firstName ?? "",
        lastName: profile.lastName ?? "",
        email: profile.email ?? "",
        phone: profile.phone ?? "",
        organization: profile.organization ?? "",
      });
    }
  }, [profile]);

  const activeItem = sections.find((s) => s.id === activeSection);

  const initials =
    form.firstName || form.lastName
      ? `${form.firstName.charAt(0)}${form.lastName.charAt(0)}`.toUpperCase()
      : "?";

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    updateProfile(form);
  }

  return (
    <div className="settings">
      <Header title="Ajustes" subtitle="Configura tus preferencias y cuenta" />

      <div className="settings__body">
        <div className="settings__inner">
          {/* Sub-navigation */}
          <aside className="settings-nav">
            <div className="settings-nav__list">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`settings-nav__btn${activeSection === section.id ? " settings-nav__btn--active" : ""}`}
                >
                  <section.icon size={18} />
                  <span>{section.label}</span>
                </button>
              ))}
            </div>
          </aside>

          {/* Settings Panel */}
          <div className="settings-panel">
            {activeSection === "profile" ? (
              <div className="settings-profile">
                <h3 className="settings-profile__title">Ajustes de Perfil</h3>

                {isLoading ? (
                  <p className="settings-profile__loading">Cargando perfil…</p>
                ) : (
                  <>
                    {/* Avatar */}
                    <div className="settings-avatar">
                      <div className="settings-avatar__wrap">
                        <div className="settings-avatar__circle">
                          {initials}
                        </div>
                        <button
                          type="button"
                          className="settings-avatar__btn"
                          disabled
                        >
                          <Camera size={14} />
                        </button>
                      </div>
                      <div className="settings-avatar__info">
                        <button
                          type="button"
                          className="settings-avatar__change-btn"
                          disabled
                        >
                          Cambiar foto
                        </button>
                        <p className="settings-avatar__hint">
                          JPG, PNG o GIF. Máximo 2MB.
                        </p>
                      </div>
                    </div>

                    {/* Form */}
                    <form className="settings-form" onSubmit={handleSubmit}>
                      <div className="settings-form__field">
                        <label className="settings-form__label">Nombre</label>
                        <input
                          type="text"
                          name="firstName"
                          value={form.firstName}
                          onChange={handleChange}
                          className="settings-form__input"
                          placeholder="Tu nombre"
                        />
                      </div>
                      <div className="settings-form__field">
                        <label className="settings-form__label">Apellido</label>
                        <input
                          type="text"
                          name="lastName"
                          value={form.lastName}
                          onChange={handleChange}
                          className="settings-form__input"
                          placeholder="Tu apellido"
                        />
                      </div>
                      <div className="settings-form__field">
                        <label className="settings-form__label">Email</label>
                        <input
                          type="email"
                          name="email"
                          value={form.email}
                          onChange={handleChange}
                          className="settings-form__input"
                          placeholder="tu@email.com"
                        />
                      </div>
                      <div className="settings-form__field">
                        <label className="settings-form__label">Teléfono</label>
                        <input
                          type="tel"
                          name="phone"
                          value={form.phone}
                          onChange={handleChange}
                          className="settings-form__input"
                          placeholder="+34 600 000 000"
                        />
                      </div>
                      <div className="settings-form__field settings-form__field--full">
                        <label className="settings-form__label">
                          Organización
                        </label>
                        <input
                          type="text"
                          name="organization"
                          value={form.organization}
                          onChange={handleChange}
                          className="settings-form__input"
                          placeholder="Nombre de la organización"
                        />
                      </div>

                      <div className="settings-profile__footer">
                        {isSuccess && (
                          <span className="settings-save-ok">
                            Cambios guardados
                          </span>
                        )}
                        <button
                          type="submit"
                          className="settings-save-btn"
                          disabled={isPending}
                        >
                          <Save size={20} />
                          <span>
                            {isPending ? "Guardando…" : "Guardar cambios"}
                          </span>
                        </button>
                      </div>
                    </form>
                  </>
                )}
              </div>
            ) : activeSection === "admin" && isAdminUser ? (
              <div className="settings-admin">
                <h3 className="settings-admin__title">Panel Administrativo</h3>

                <div className="settings-admin__section">
                  <h4 className="settings-admin__heading">
                    Información del Admin
                  </h4>
                  <div className="settings-admin__info">
                    <div className="settings-admin__item">
                      <span className="settings-admin__label">Usuario:</span>
                      <span className="settings-admin__value">
                        {currentUser?.firstName} {currentUser?.lastName}
                      </span>
                    </div>
                    <div className="settings-admin__item">
                      <span className="settings-admin__label">Email:</span>
                      <span className="settings-admin__value">
                        {currentUser?.email}
                      </span>
                    </div>
                    <div className="settings-admin__item">
                      <span className="settings-admin__label">
                        Organización:
                      </span>
                      <span className="settings-admin__value">
                        {currentUser?.organization}
                      </span>
                    </div>
                    <div className="settings-admin__item">
                      <span className="settings-admin__label">Rol:</span>
                      <span className="settings-admin__value">
                        {currentUser?.role}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="settings-admin__section">
                  <h4 className="settings-admin__heading">
                    Acciones Administrativas
                  </h4>
                  <p className="settings-admin__description">
                    Desde aquí podrás gestionar usuarios, revisar logs y
                    configurar permisos.
                  </p>
                  <div className="settings-admin__actions">
                    <button className="settings-admin__action-btn" disabled>
                      Gestionar Usuarios
                    </button>
                    <button className="settings-admin__action-btn" disabled>
                      Ver Logs del Sistema
                    </button>
                    <button className="settings-admin__action-btn" disabled>
                      Configurar Permisos
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              activeItem && (
                <div className="settings-placeholder">
                  <div className="settings-placeholder__icon">
                    <activeItem.icon size={48} />
                  </div>
                  <h3 className="settings-placeholder__title">
                    {activeItem.label}
                  </h3>
                  <p className="settings-placeholder__desc">
                    Esta sección está en desarrollo. Vuelve pronto.
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
