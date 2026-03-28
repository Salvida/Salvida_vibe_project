import { useEffect, useRef, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabaseClient';
import { useAuthStore } from '../../store/useAuthStore';
import { useAuthFormStore } from '../../store/useAuthFormStore';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
}

export default function AuthModal({ open, onClose }: AuthModalProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);

  const {
    email, setEmail,
    password, setPassword,
    confirmPassword, setConfirmPassword,
    firstName, setFirstName,
    lastName, setLastName,
    dni, setDni,
    phone, setPhone,
    showRegPassword, toggleShowRegPassword,
    showConfirmPassword, toggleShowConfirmPassword,
    loading, setLoading,
    error, setError,
    success, setSuccess,
    reset,
  } = useAuthFormStore();

  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => { reset(); }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  async function handleRegister(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError(t('login.passwordMismatch'));
      return;
    }

    setLoading(true);
    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { first_name: firstName, last_name: lastName, dni, phone },
      },
    });
    setLoading(false);

    if (authError) {
      setError(t('login.errorRegisterGeneric'));
      return;
    }

    if (data.session) {
      setSession(data.session);
      onClose();
      navigate('/app');
      return;
    }

    setSuccess(t('login.registerSuccess'));
  }

  return (
    <div
      className="lp-modal-backdrop"
      ref={backdropRef}
      onClick={(e) => { if (e.target === backdropRef.current) onClose(); }}
    >
      <div className="lp-modal" role="dialog" aria-modal="true">
        <div className="lp-modal__header">
          <span className="lp-modal__logo">Salvida</span>
          <button className="lp-modal__close" onClick={onClose} aria-label="Cerrar">
            <span className="lp-material-icon">close</span>
          </button>
        </div>

        <div className="lp-modal__body">
          <h2 className="lp-modal__title">{t('login.registerTab')}</h2>

          <form onSubmit={handleRegister}>
            <div className="lp-modal__field-row">
              <div className="lp-modal__field">
                <label className="lp-modal__label" htmlFor="modal-reg-firstname">
                  {t('login.firstName')}
                </label>
                <input
                  id="modal-reg-firstname"
                  type="text"
                  className="lp-modal__input"
                  placeholder={t('login.firstNamePlaceholder')}
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  autoComplete="given-name"
                />
              </div>
              <div className="lp-modal__field">
                <label className="lp-modal__label" htmlFor="modal-reg-lastname">
                  {t('login.lastName')}
                </label>
                <input
                  id="modal-reg-lastname"
                  type="text"
                  className="lp-modal__input"
                  placeholder={t('login.lastNamePlaceholder')}
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  autoComplete="family-name"
                />
              </div>
            </div>

            <div className="lp-modal__field">
              <label className="lp-modal__label" htmlFor="modal-reg-dni">{t('login.dni')}</label>
              <input
                id="modal-reg-dni"
                type="text"
                className="lp-modal__input"
                placeholder={t('login.dniPlaceholder')}
                value={dni}
                onChange={(e) => setDni(e.target.value)}
                required
                autoComplete="off"
              />
            </div>

            <div className="lp-modal__field">
              <label className="lp-modal__label" htmlFor="modal-reg-phone">{t('login.phone')}</label>
              <input
                id="modal-reg-phone"
                type="tel"
                className="lp-modal__input"
                placeholder={t('login.phonePlaceholder')}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                autoComplete="tel"
              />
            </div>

            <div className="lp-modal__field">
              <label className="lp-modal__label" htmlFor="modal-reg-email">{t('login.email')}</label>
              <input
                id="modal-reg-email"
                type="email"
                className="lp-modal__input"
                placeholder={t('login.emailPlaceholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="lp-modal__field">
              <label className="lp-modal__label" htmlFor="modal-reg-password">{t('login.password')}</label>
              <div className="lp-modal__input-wrapper">
                <input
                  id="modal-reg-password"
                  type={showRegPassword ? 'text' : 'password'}
                  className="lp-modal__input"
                  placeholder={t('login.passwordPlaceholder')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="lp-modal__eye-btn"
                  onClick={toggleShowRegPassword}
                  tabIndex={-1}
                  aria-label={showRegPassword ? t('login.hidePassword') : t('login.showPassword')}
                >
                  {showRegPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="lp-modal__field">
              <label className="lp-modal__label" htmlFor="modal-reg-confirm">{t('login.confirmPassword')}</label>
              <div className="lp-modal__input-wrapper">
                <input
                  id="modal-reg-confirm"
                  type={showConfirmPassword ? 'text' : 'password'}
                  className="lp-modal__input"
                  placeholder={t('login.confirmPasswordPlaceholder')}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="lp-modal__eye-btn"
                  onClick={toggleShowConfirmPassword}
                  tabIndex={-1}
                  aria-label={showConfirmPassword ? t('login.hidePassword') : t('login.showPassword')}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && <p className="lp-modal__error">{error}</p>}
            {success ? (
              <>
                <p className="lp-modal__success">{success}</p>
                <button type="button" className="lp-modal__submit" onClick={() => { onClose(); navigate('/login'); }}>
                  {t('login.goToLogin')}
                </button>
              </>
            ) : (
              <button type="submit" className="lp-modal__submit" disabled={loading}>
                {loading ? t('login.registerSubmitting') : t('login.registerSubmit')}
              </button>
            )}
          </form>

          <p className="lp-modal__login-link">
            {t('login.alreadyHaveAccount')}{' '}
            <button type="button" onClick={() => { onClose(); navigate('/login'); }}>
              {t('login.loginTab')}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
