import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Save, Pencil } from "lucide-react";
import { toast } from "react-toastify";
import { apiClient } from "../../lib/api";
import PLATFORM_ICONS from "../../lib/platformIcons";
import { useTranslation } from "react-i18next";

// ── Types ──────────────────────────────────────────────────────────────────
interface SocialLink {
  id: string;
  platform: string;
  label: string;
  url: string;
  order: number;
}

interface SocialLinkPayload {
  platform: string;
  label: string;
  url: string;
  order: number;
}

// ── Platform catalogue ─────────────────────────────────────────────────────
const PLATFORMS = [
  { value: "facebook",  label: "Facebook" },
  { value: "instagram", label: "Instagram" },
  { value: "tiktok",    label: "TikTok" },
  { value: "x",         label: "X (Twitter)" },
  { value: "google",    label: "Google" },
  { value: "linkedin",  label: "LinkedIn" },
  { value: "youtube",   label: "YouTube" },
  { value: "whatsapp",  label: "WhatsApp" },
  { value: "pinterest", label: "Pinterest" },
] as const;

const SOCIAL_LINKS_KEY = ["social-links"] as const;

// ── Hooks ──────────────────────────────────────────────────────────────────
function useSocialLinks() {
  return useQuery<SocialLink[]>({
    queryKey: SOCIAL_LINKS_KEY,
    queryFn: () => apiClient.get<SocialLink[]>("/api/social-links"),
  });
}

function useCreateSocialLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: SocialLinkPayload) =>
      apiClient.post<SocialLink>("/api/social-links", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: SOCIAL_LINKS_KEY });
      toast.success("Red social añadida");
    },
    onError: () => toast.error("Error al añadir la red social"),
  });
}

function useUpdateSocialLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<SocialLinkPayload> }) =>
      apiClient.put<SocialLink>(`/api/social-links/${id}`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: SOCIAL_LINKS_KEY });
      toast.success("Red social actualizada");
    },
    onError: () => toast.error("Error al actualizar la red social"),
  });
}

function useDeleteSocialLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete<void>(`/api/social-links/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: SOCIAL_LINKS_KEY });
      toast.success("Red social eliminada");
    },
    onError: () => toast.error("Error al eliminar la red social"),
  });
}

// ── Blank form ─────────────────────────────────────────────────────────────
const EMPTY_FORM: SocialLinkPayload = {
  platform: "facebook",
  label: "Facebook",
  url: "",
  order: 0,
};

// ── Component ──────────────────────────────────────────────────────────────
export default function SettingsRRSS() {
  const { t } = useTranslation();
  const { data: links = [], isLoading } = useSocialLinks();
  const createLink = useCreateSocialLink();
  const updateLink = useUpdateSocialLink();
  const deleteLink = useDeleteSocialLink();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<SocialLinkPayload>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);

  function handlePlatformChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const platform = e.target.value;
    const found = PLATFORMS.find((p) => p.value === platform);
    setForm((prev) => ({
      ...prev,
      platform,
      label: found?.label ?? prev.label,
    }));
  }

  function openAdd() {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, order: links.length });
    setShowForm(true);
  }

  function openEdit(link: SocialLink) {
    setEditingId(link.id);
    setForm({ platform: link.platform, label: link.label, url: link.url, order: link.order });
    setShowForm(true);
  }

  function handleCancel() {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editingId) {
      updateLink.mutate({ id: editingId, body: form }, { onSuccess: handleCancel });
    } else {
      createLink.mutate(form, { onSuccess: handleCancel });
    }
  }

  const isSaving = createLink.isPending || updateLink.isPending;

  return (
    <div className="settings-rrss">
      <h3 className="settings-profile__title">{t("settings.rrss.title")}</h3>
      <p className="settings-notifications__desc">{t("settings.rrss.desc")}</p>

      {/* Existing links list */}
      {isLoading ? (
        <p className="settings-rrss__empty">{t("settings.rrss.loading")}</p>
      ) : links.length === 0 && !showForm ? (
        <p className="settings-rrss__empty">{t("settings.rrss.empty")}</p>
      ) : (
        <ul className="settings-rrss__list">
          {links.map((link) => (
            <li key={link.id} className="settings-rrss__item">
              <span className="settings-rrss__icon">
                {PLATFORM_ICONS[link.platform] ?? <span style={{ width: 18, height: 18 }} />}
              </span>
              <span className="settings-rrss__platform">
                {PLATFORMS.find((p) => p.value === link.platform)?.label ?? link.platform}
              </span>
              <span className="settings-rrss__url">{link.url}</span>
              <div className="settings-rrss__actions">
                <button
                  className="settings-rrss__btn-icon"
                  onClick={() => openEdit(link)}
                  title={t("settings.rrss.edit")}
                >
                  <Pencil size={15} />
                </button>
                <button
                  className="settings-rrss__btn-icon settings-rrss__btn-icon--danger"
                  onClick={() => deleteLink.mutate(link.id)}
                  title={t("settings.rrss.delete")}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Add / Edit form */}
      {showForm && (
        <form className="settings-rrss__form" onSubmit={handleSubmit}>
          <div className="settings-form__group">
            <label className="settings-form__label">{t("settings.rrss.platform")}</label>
            <select
              className="settings-form__input"
              value={form.platform}
              onChange={handlePlatformChange}
            >
              {PLATFORMS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          <div className="settings-form__group">
            <label className="settings-form__label">{t("settings.rrss.labelField")}</label>
            <input
              className="settings-form__input"
              type="text"
              value={form.label}
              onChange={(e) => setForm((p) => ({ ...p, label: e.target.value }))}
              required
            />
          </div>

          <div className="settings-form__group">
            <label className="settings-form__label">{t("settings.rrss.url")}</label>
            <input
              className="settings-form__input"
              type="url"
              value={form.url}
              onChange={(e) => setForm((p) => ({ ...p, url: e.target.value }))}
              placeholder="https://..."
              required
            />
          </div>

          <div className="settings-form__group">
            <label className="settings-form__label">{t("settings.rrss.order")}</label>
            <input
              className="settings-form__input"
              type="number"
              min={0}
              value={form.order}
              onChange={(e) => setForm((p) => ({ ...p, order: Number(e.target.value) }))}
            />
          </div>

          <div className="settings-rrss__form-actions">
            <button type="submit" className="settings-save-btn" disabled={isSaving}>
              <Save size={16} />
              <span>{isSaving ? t("settings.rrss.saving") : t("settings.rrss.save")}</span>
            </button>
            <button type="button" className="settings-rrss__btn-cancel" onClick={handleCancel}>
              {t("settings.rrss.cancel")}
            </button>
          </div>
        </form>
      )}

      {!showForm && (
        <button className="settings-rrss__btn-add" onClick={openAdd}>
          <Plus size={16} />
          <span>{t("settings.rrss.add")}</span>
        </button>
      )}
    </div>
  );
}
