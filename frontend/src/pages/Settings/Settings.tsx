import Header from "../../components/Header/Header";
import {
  User,
  Bell,
  Shield,
  Palette,
  Languages,
  Camera,
  Save,
} from "lucide-react";
import { useState, useEffect } from "react";
import type { LucideIcon } from "lucide-react";
import type { NotificationPrefs } from "../../types";
import { useProfile, useUpdateProfile, useUpdateNotificationPrefs, useUsers, useArchiveUser } from "../../hooks/useProfile";
import DropdownMenu from "../../components/DropdownMenu";
import ConfirmDialog from "../../components/ConfirmDialog/ConfirmDialog";
import { useCurrentUserStore } from "../../store/useCurrentUserStore";
import { useSyncCurrentUser } from "../../hooks/useSyncCurrentUser";
import "./Settings.css";

interface Section {
  id: string;
  icon: LucideIcon;
  label: string;
}

const baseSections: Section[] = [
  { id: "profile", icon: User, label: "Perfil" },
  { id: "notifications", icon: Bell, label: "Notificaciones" },
  { id: "security", icon: Shield, label: "Seguridad" },
  { id: "appearance", icon: Palette, label: "Apariencia" },
  { id: "language", icon: Languages, label: "Idioma" },
];

export default function Settings() {
  // Sincronizar usuario actual
  useSyncCurrentUser();

  const currentUser = useCurrentUserStore((s) => s.currentUser);
  const isAdminUser = currentUser?.role === "admin";

  const sections = baseSections;

  const [activeSection, setActiveSection] = useState("profile");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedUserLabel, setSelectedUserLabel] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const { data: profile, isLoading } = useProfile();
  const { mutate: updateProfile, isPending } = useUpdateProfile();
  const { mutate: updateNotificationPrefs, isPending: isSavingPrefs } = useUpdateNotificationPrefs();
  const archiveUser = useArchiveUser();
  const [confirmArchiveId, setConfirmArchiveId] = useState<string | null>(null);
  const { data: users } = useUsers(isAdminUser && activeSection === "profile");

  const filteredUsers = users?.filter((u) => {
    const q = userSearch.toLowerCase();
    return (
      u.firstName?.toLowerCase().includes(q) ||
      u.lastName?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.phone?.toLowerCase().includes(q) ||
      u.organization?.toLowerCase().includes(q) ||
      u.dni?.toLowerCase().includes(q) ||
      u.role?.toLowerCase().includes(q)
    );
  }) ?? [];

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    dni: "",
    email: "",
    phone: "",
    organization: "",
  });

  const [notifPrefs, setNotifPrefs] = useState<NotificationPrefs>({
    email: true,
    push: true,
    booking_reminder: true,
  });

  useEffect(() => {
    if (selectedUserId) return;
    if (profile) {
      setForm({
        firstName: profile.firstName ?? "",
        lastName: profile.lastName ?? "",
        dni: profile.dni ?? "",
        email: profile.email ?? "",
        phone: profile.phone ?? "",
        organization: profile.organization ?? "",
      });
      if (profile.notification_prefs) {
        setNotifPrefs(profile.notification_prefs);
      }
    }
  }, [profile, selectedUserId]);

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
    updateProfile({ ...form, targetUserId: selectedUserId || undefined });
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
            {activeSection === "notifications" ? (
              <div className="settings-notifications">
                <h3 className="settings-profile__title">Notificaciones</h3>
                <p className="settings-notifications__desc">
                  Elige cómo y cuándo quieres recibir notificaciones.
                </p>

                <div className="settings-notifications__group">
                  <h4 className="settings-notifications__group-title">Canal</h4>

                  <div className="settings-notif-row">
                    <div className="settings-notif-row__info">
                      <span className="settings-notif-row__label">Correo electrónico</span>
                      <span className="settings-notif-row__sub">Recibe notificaciones en tu email</span>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={notifPrefs.email}
                      className={`settings-toggle${notifPrefs.email ? " settings-toggle--on" : ""}`}
                      onClick={() => setNotifPrefs((p) => ({ ...p, email: !p.email }))}
                    >
                      <span className="settings-toggle__thumb" />
                    </button>
                  </div>

                  <div className="settings-notif-row">
                    <div className="settings-notif-row__info">
                      <span className="settings-notif-row__label">Notificaciones push</span>
                      <span className="settings-notif-row__sub">Alertas en el navegador en tiempo real</span>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={notifPrefs.push}
                      className={`settings-toggle${notifPrefs.push ? " settings-toggle--on" : ""}`}
                      onClick={() => setNotifPrefs((p) => ({ ...p, push: !p.push }))}
                    >
                      <span className="settings-toggle__thumb" />
                    </button>
                  </div>
                </div>

                <div className="settings-notifications__group">
                  <h4 className="settings-notifications__group-title">Tipos de aviso</h4>

                  <div className="settings-notif-row">
                    <div className="settings-notif-row__info">
                      <span className="settings-notif-row__label">Recordatorio de reserva</span>
                      <span className="settings-notif-row__sub">Aviso antes de cada servicio programado</span>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={notifPrefs.booking_reminder}
                      className={`settings-toggle${notifPrefs.booking_reminder ? " settings-toggle--on" : ""}`}
                      onClick={() => setNotifPrefs((p) => ({ ...p, booking_reminder: !p.booking_reminder }))}
                    >
                      <span className="settings-toggle__thumb" />
                    </button>
                  </div>
                </div>

                <div className="settings-profile__footer">
                  <button
                    type="button"
                    className="settings-save-btn"
                    disabled={isSavingPrefs}
                    onClick={() => updateNotificationPrefs(notifPrefs)}
                  >
                    <Save size={20} />
                    <span>{isSavingPrefs ? "Guardando…" : "Guardar cambios"}</span>
                  </button>
                </div>
              </div>
            ) : activeSection === "profile" ? (
              <div className="settings-profile">
                {isAdminUser && (
                  <div className="settings-user-selector">
                    <label className="settings-user-selector__label">
                      Usuario
                    </label>
                    <div className="settings-user-selector__combobox">
                      <input
                        type="text"
                        className="settings-user-selector__input"
                        placeholder={selectedUserLabel || "Buscar usuario…"}
                        value={userDropdownOpen ? userSearch : ""}
                        onChange={(e) => {
                          setUserSearch(e.target.value);
                          setUserDropdownOpen(true);
                        }}
                        onFocus={() => {
                          setUserSearch("");
                          setUserDropdownOpen(true);
                        }}
                        onBlur={() =>
                          setTimeout(() => setUserDropdownOpen(false), 150)
                        }
                        autoComplete="off"
                      />
                      {userDropdownOpen && filteredUsers.length > 0 && (
                        <ul className="settings-user-selector__dropdown">
                          {filteredUsers.map((u) => (
                            <li
                              key={u.id}
                              className={`settings-user-selector__option${selectedUserId === u.id ? " settings-user-selector__option--selected" : ""}`}
                              onMouseDown={() => {
                                setSelectedUserId(u.id);
                                setSelectedUserLabel(
                                  `${u.firstName} ${u.lastName}${u.email ? ` — ${u.email}` : ""}`,
                                );
                                setUserSearch("");
                                setUserDropdownOpen(false);
                                setForm({
                                  firstName: u.firstName ?? "",
                                  lastName: u.lastName ?? "",
                                  dni: u.dni ?? "",
                                  email: u.email ?? "",
                                  phone: u.phone ?? "",
                                  organization: u.organization ?? "",
                                });
                              }}
                            >
                              <span className="settings-user-selector__option-name">
                                {u.firstName} {u.lastName}
                              </span>
                              {u.email && (
                                <span className="settings-user-selector__option-email">
                                  {u.email}
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                      {userDropdownOpen &&
                        userSearch.length > 0 &&
                        filteredUsers.length === 0 && (
                          <ul className="settings-user-selector__dropdown">
                            <li className="settings-user-selector__option settings-user-selector__option--empty">
                              Sin resultados
                            </li>
                          </ul>
                        )}
                    </div>
                  </div>
                )}
                <div className="settings-profile__title-row">
                  <h3 className="settings-profile__title">Ajustes de Perfil</h3>
                  {isAdminUser && selectedUserId && (() => {
                    const selectedUser = users?.find((u) => u.id === selectedUserId);
                    if (!selectedUser) return null;
                    return (
                      <DropdownMenu
                        items={[{
                          label: selectedUser.isActive === false ? "Restaurar usuario" : "Archivar usuario",
                          onClick: () => setConfirmArchiveId(selectedUser.id),
                          variant: selectedUser.isActive === false ? "default" : "danger",
                        }]}
                      />
                    );
                  })()}
                </div>

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
                        <label className="settings-form__label">DNI</label>
                        <input
                          type="text"
                          name="dni"
                          value={form.dni}
                          onChange={handleChange}
                          className="settings-form__input"
                          placeholder="12345678A"
                          autoComplete="off"
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

      {confirmArchiveId && (() => {
        const target = users?.find((u) => u.id === confirmArchiveId);
        const isArchiving = target?.isActive !== false;
        return (
          <ConfirmDialog
            open
            title={isArchiving ? "¿Archivar usuario?" : "¿Restaurar usuario?"}
            description={
              isArchiving
                ? `${target?.firstName} ${target?.lastName} quedará desactivado. Esta acción puede tener consecuencias sobre sus servicios asociados.`
                : `${target?.firstName} ${target?.lastName} volverá a estar activo en el sistema.`
            }
            confirmLabel={isArchiving ? "Archivar" : "Restaurar"}
            variant={isArchiving ? "danger" : "default"}
            onConfirm={() => {
              archiveUser.mutate(confirmArchiveId);
              setConfirmArchiveId(null);
            }}
            onCancel={() => setConfirmArchiveId(null)}
          />
        );
      })()}
    </div>
  );
}
