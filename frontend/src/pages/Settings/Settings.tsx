import Header from "../../components/Header/Header";
import {
  User,
  Bell,
  Shield,
  Palette,
  Languages,
  Camera,
  Save,
  Share2,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { LucideIcon } from "lucide-react";
import type { NotificationPrefs, UserProfile } from "../../types";
import {
  useProfile,
  useUpdateProfile,
  useUpdateNotificationPrefs,
  useUsers,
  useArchiveUser,
} from "../../hooks/useProfile";
import DropdownMenu from "../../components/DropdownMenu";
import ConfirmDialog from "../../components/ConfirmDialog/ConfirmDialog";
import UserSelector from "../../components/UserSelector/UserSelector";
import SettingsRRSS from "./SettingsRRSS";
import { usePushNotifications } from "../../hooks/usePushNotifications";
import { supabase } from "../../lib/supabaseClient";
import { toast } from "react-toastify";
import "./Settings.css";

interface Section {
  id: string;
  icon: LucideIcon;
  labelKey: string;
  adminOnly?: boolean;
}

const baseSections: Section[] = [
  { id: "profile", icon: User, labelKey: "settings.sectionsLabels.profile" },
  {
    id: "notifications",
    icon: Bell,
    labelKey: "settings.sectionsLabels.notifications",
  },
  {
    id: "security",
    icon: Shield,
    labelKey: "settings.sectionsLabels.security",
  },
  {
    id: "appearance",
    icon: Palette,
    labelKey: "settings.sectionsLabels.appearance",
  },
  {
    id: "language",
    icon: Languages,
    labelKey: "settings.sectionsLabels.language",
  },
  {
    id: "rrss",
    icon: Share2,
    labelKey: "settings.sectionsLabels.rrss",
    adminOnly: true,
  },
];

export default function Settings() {
  const { t } = useTranslation();
  const { data: currentUser } = useProfile();
  const isAdminUser = currentUser?.role === "admin" || currentUser?.role === "superadmin";

  const sections = baseSections.filter((s) => !s.adminOnly || isAdminUser);

  const [searchParams] = useSearchParams();
  const [activeSection, setActiveSection] = useState("profile");
  const [selectedUserId, setSelectedUserId] = useState(
    () => searchParams.get("userId") ?? "",
  );
  const { data: profile, isLoading } = useProfile();
  const { mutate: updateProfile, isPending } = useUpdateProfile();
  const { mutate: updateNotificationPrefs, isPending: isSavingPrefs } =
    useUpdateNotificationPrefs();
  const { subscribe: subscribePush, unsubscribe: unsubscribePush } =
    usePushNotifications();
  const archiveUser = useArchiveUser();
  const [notifTargetUser, setNotifTargetUser] = useState<UserProfile | null>(null);
  const [confirmArchiveId, setConfirmArchiveId] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleAvatarFile(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error(t("prmDetail.toast.imageFormat"));
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error(t("prmDetail.toast.imageSize"));
      return;
    }
    setUploadingAvatar(true);
    try {
      const ext = file.name.split(".").pop() ?? "jpg";
      const targetUserId = selectedUserId || profile?.id;
      if (!targetUserId) return;
      const path = `${targetUserId}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(path);
      updateProfile({
        avatar: urlData.publicUrl,
        targetUserId: selectedUserId || undefined,
      });
    } catch {
      toast.error(t("prmDetail.toast.uploadError"));
    } finally {
      setUploadingAvatar(false);
    }
  }
  const { data: users } = useUsers(isAdminUser && activeSection === "profile");

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    dni: "",
    email: "",
    phone: "",
    organization: "",
    avatar: "",
  });

  const [notifPrefs, setNotifPrefs] = useState<NotificationPrefs>({
    email: false,
    push: true,
    booking_reminder: true,
  });

  useEffect(() => {
    if (notifTargetUser?.notification_prefs) {
      setNotifPrefs(notifTargetUser.notification_prefs);
    }
  }, [notifTargetUser]);

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
        avatar: profile.avatar ?? "",
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
      <Header title={t("settings.title")} subtitle={t("settings.subtitle")} />

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
                  <span>{t(section.labelKey)}</span>
                </button>
              ))}
            </div>
          </aside>

          {/* Settings Panel */}
          <div className="settings-panel">
            {activeSection === "rrss" ? (
              <SettingsRRSS />
            ) : activeSection === "notifications" ? (
              <div className="settings-notifications">
                <h3 className="settings-profile__title">
                  {t("settings.notifications.title")}
                </h3>
                <p className="settings-notifications__desc">
                  {t("settings.notifications.desc")}
                </p>

                {isAdminUser && (
                  <UserSelector
                    value={notifTargetUser?.id ?? ''}
                    onChange={(_id, user) => setNotifTargetUser(user)}
                    label="Gestionar usuario"
                    placeholder="Buscar usuario… (vacío = mis preferencias)"
                  />
                )}

                <div className="settings-notifications__group">
                  <h4 className="settings-notifications__group-title">
                    {t("settings.notifications.channel")}
                  </h4>

                  <div className="settings-notif-row">
                    <div className="settings-notif-row__info">
                      <span className="settings-notif-row__label">
                        {t("settings.notifications.emailLabel")}
                      </span>
                      <span className="settings-notif-row__sub">
                        {t("settings.notifications.emailDesc")}
                        {!profile?.email && (
                          <span className="settings-notif-row__warning">
                            {" "}
                            — Requiere un email validado en tu perfil
                          </span>
                        )}
                      </span>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={notifPrefs.email}
                      disabled={!(notifTargetUser ? notifTargetUser.email : profile?.email)}
                      className={`settings-toggle${notifPrefs.email ? " settings-toggle--on" : ""}${!profile?.email ? " settings-toggle--disabled" : ""}`}
                      onClick={() =>
                        setNotifPrefs((p) => ({ ...p, email: !p.email }))
                      }
                    >
                      <span className="settings-toggle__thumb" />
                    </button>
                  </div>

                  <div className="settings-notif-row">
                    <div className="settings-notif-row__info">
                      <span className="settings-notif-row__label">
                        {t("settings.notifications.pushLabel")}
                      </span>
                      <span className="settings-notif-row__sub">
                        {t("settings.notifications.pushDesc")}
                      </span>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={notifPrefs.push}
                      className={`settings-toggle${notifPrefs.push ? " settings-toggle--on" : ""}`}
                      onClick={() => {
                        const next = !notifPrefs.push;
                        setNotifPrefs((p) => ({ ...p, push: next }));
                        if (!notifTargetUser) {
                          if (next) subscribePush();
                          else unsubscribePush();
                        }
                      }}
                    >
                      <span className="settings-toggle__thumb" />
                    </button>
                  </div>
                  {isAdminUser && notifTargetUser && (
                    <p className="settings-notif-row__sub" style={{ marginTop: '-8px', marginBottom: '8px' }}>
                      La suscripción del navegador la activa el propio usuario desde su sesión.
                    </p>
                  )}
                </div>

                <div className="settings-notifications__group">
                  <h4 className="settings-notifications__group-title">
                    {t("settings.notifications.typesTitle")}
                  </h4>

                  <div className="settings-notif-row">
                    <div className="settings-notif-row__info">
                      <span className="settings-notif-row__label">
                        {t("settings.notifications.reminderLabel")}
                      </span>
                      <span className="settings-notif-row__sub">
                        Aviso 2 horas antes de cada servicio programado
                      </span>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={notifPrefs.booking_reminder}
                      className={`settings-toggle${notifPrefs.booking_reminder ? " settings-toggle--on" : ""}`}
                      onClick={() =>
                        setNotifPrefs((p) => ({
                          ...p,
                          booking_reminder: !p.booking_reminder,
                        }))
                      }
                    >
                      <span className="settings-toggle__thumb" />
                    </button>
                  </div>
                </div>

                <div className="settings-profile__footer">
                  <button
                    type="button"
                    className="settings-save-btn"
                    disabled={isSavingPrefs || isPending}
                    onClick={() => {
                      if (notifTargetUser) {
                        updateProfile({ notification_prefs: notifPrefs, targetUserId: notifTargetUser.id });
                      } else {
                        updateNotificationPrefs(notifPrefs);
                      }
                    }}
                  >
                    <Save size={20} />
                    <span>
                      {isSavingPrefs
                        ? t("common.saving")
                        : t("settings.notifications.save")}
                    </span>
                  </button>
                </div>
              </div>
            ) : activeSection === "profile" ? (
              <div className="settings-profile">
                {isAdminUser && (
                  <UserSelector
                    value={selectedUserId}
                    onChange={(id, u) => {
                      setSelectedUserId(id);
                      setForm({
                        firstName: u.firstName ?? "",
                        lastName: u.lastName ?? "",
                        dni: u.dni ?? "",
                        email: u.email ?? "",
                        phone: u.phone ?? "",
                        organization: u.organization ?? "",
                        avatar: u.avatar ?? "",
                      });
                    }}
                  />
                )}
                <div className="settings-profile__title-row">
                  <div className="settings-profile__title-group">
                    <h3 className="settings-profile__title">
                      {t("settings.profile.title")}
                    </h3>
                    {(() => {
                      const selectedUser = selectedUserId
                        ? users?.find((u) => u.id === selectedUserId)
                        : null;
                      const isArchived = selectedUser
                        ? selectedUser.isActive === false
                        : false;
                      return (
                        <span
                          className={`settings-user-status-badge${isArchived ? " settings-user-status-badge--archived" : " settings-user-status-badge--active"}`}
                        >
                          {isArchived
                            ? t("settings.profile.statusArchived")
                            : t("settings.profile.statusActive")}
                        </span>
                      );
                    })()}
                  </div>
                  {isAdminUser &&
                    selectedUserId &&
                    (() => {
                      const selectedUser = users?.find(
                        (u) => u.id === selectedUserId,
                      );
                      if (!selectedUser) return null;
                      return (
                        <DropdownMenu
                          items={[
                            {
                              label:
                                selectedUser.isActive === false
                                  ? t(
                                      "settings.profile.userActions.restoreUser",
                                    )
                                  : t(
                                      "settings.profile.userActions.archiveUser",
                                    ),
                              onClick: () =>
                                setConfirmArchiveId(selectedUser.id),
                              variant:
                                selectedUser.isActive === false
                                  ? "default"
                                  : "danger",
                            },
                          ]}
                        />
                      );
                    })()}
                </div>

                {isLoading ? (
                  <p className="settings-profile__loading">
                    {t("settings.loading")}
                  </p>
                ) : (
                  <>
                    {/* Avatar */}
                    <div className="settings-avatar">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        style={{ display: "none" }}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleAvatarFile(file);
                          e.target.value = "";
                        }}
                      />
                      <div className="settings-avatar__wrap">
                        {(
                          selectedUserId
                            ? form.avatar
                            : form.avatar || profile?.avatar
                        ) ? (
                          <img
                            src={
                              (selectedUserId
                                ? form.avatar
                                : form.avatar || profile?.avatar) as string
                            }
                            alt="Avatar"
                            className="settings-avatar__circle settings-avatar__circle--img"
                          />
                        ) : (
                          <div className="settings-avatar__circle">
                            {initials}
                          </div>
                        )}
                        <button
                          type="button"
                          className="settings-avatar__btn"
                          disabled={uploadingAvatar}
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Camera size={14} />
                        </button>
                      </div>
                      <div className="settings-avatar__info">
                        <button
                          type="button"
                          className="settings-avatar__change-btn"
                          disabled={uploadingAvatar}
                          onClick={() => fileInputRef.current?.click()}
                        >
                          {uploadingAvatar
                            ? t("settings.profile.uploading")
                            : t("settings.profile.changePhoto")}
                        </button>
                        <p className="settings-avatar__hint">
                          {t("settings.profile.photoHint")}
                        </p>
                      </div>
                    </div>

                    {/* Form */}
                    <form className="settings-form" onSubmit={handleSubmit}>
                      <div className="settings-form__field">
                        <label className="settings-form__label">
                          {t("settings.profile.firstName")}
                        </label>
                        <input
                          type="text"
                          name="firstName"
                          value={form.firstName}
                          onChange={handleChange}
                          className="settings-form__input"
                          placeholder={t(
                            "settings.profile.firstNamePlaceholder",
                          )}
                        />
                      </div>
                      <div className="settings-form__field">
                        <label className="settings-form__label">
                          {t("settings.profile.lastName")}
                        </label>
                        <input
                          type="text"
                          name="lastName"
                          value={form.lastName}
                          onChange={handleChange}
                          className="settings-form__input"
                          placeholder={t(
                            "settings.profile.lastNamePlaceholder",
                          )}
                        />
                      </div>
                      <div className="settings-form__field">
                        <label className="settings-form__label">
                          {t("settings.profile.dni")}
                        </label>
                        <input
                          type="text"
                          name="dni"
                          value={form.dni}
                          onChange={handleChange}
                          className="settings-form__input"
                          placeholder={t("settings.profile.dniPlaceholder")}
                          autoComplete="off"
                        />
                      </div>
                      <div className="settings-form__field">
                        <label className="settings-form__label">
                          {t("settings.profile.email")}
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={form.email}
                          onChange={handleChange}
                          className="settings-form__input"
                          placeholder={t("settings.profile.emailPlaceholder")}
                        />
                      </div>
                      <div className="settings-form__field">
                        <label className="settings-form__label">
                          {t("settings.profile.phone")}
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          value={form.phone}
                          onChange={handleChange}
                          className="settings-form__input"
                          placeholder={t("settings.profile.phonePlaceholder")}
                        />
                      </div>
                      <div className="settings-form__field settings-form__field--full">
                        <label className="settings-form__label">
                          {t("settings.profile.organization")}
                        </label>
                        <input
                          type="text"
                          name="organization"
                          value={form.organization}
                          onChange={handleChange}
                          className="settings-form__input"
                          placeholder={t(
                            "settings.profile.organizationPlaceholder",
                          )}
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
                            {isPending
                              ? t("settings.profile.saving")
                              : t("settings.profile.save")}
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
                    {t(activeItem.labelKey)}
                  </h3>
                  <p className="settings-placeholder__desc">
                    {t("settings.placeholder.underDevelopment")}
                  </p>
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {confirmArchiveId &&
        (() => {
          const target = users?.find((u) => u.id === confirmArchiveId);
          const isArchiving = target?.isActive !== false;
          return (
            <ConfirmDialog
              open
              title={
                isArchiving
                  ? t("settings.confirm.archiveTitle")
                  : t("settings.confirm.restoreTitle")
              }
              description={
                isArchiving
                  ? t("settings.confirm.archiveDesc", {
                      name: `${target?.firstName} ${target?.lastName}`,
                    })
                  : t("settings.confirm.restoreDesc", {
                      name: `${target?.firstName} ${target?.lastName}`,
                    })
              }
              confirmLabel={
                isArchiving
                  ? t("settings.confirm.archiveBtn")
                  : t("settings.confirm.restoreBtn")
              }
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
