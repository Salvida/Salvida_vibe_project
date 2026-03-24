import { useState, useEffect, useRef, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabaseClient';
import { useAuthStore } from '../../store/useAuthStore';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
}

type Tab = 'login' | 'register';

export default function AuthModal({ open, onClose }: AuthModalProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);

  const [tab, setTab] = useState<Tab>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const backdropRef = useRef<HTMLDivElement>(null);

  // Reset form when tab changes or modal opens/closes
  useEffect(() => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setError(null);
    setSuccess(null);
  }, [tab, open]);

  // ESC to close
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (authError) {
      const msg =
        authError.message === 'Invalid login credentials'
          ? t('login.errorInvalid')
          : t('login.errorGeneric');
      setError(msg);
      return;
    }

    if (data.session) {
      setSession(data.session);
      onClose();
      navigate('/app');
    }
  }

  async function handleRegister(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError(t('login.passwordMismatch'));
      return;
    }

    setLoading(true);
    const { error: authError } = await supabase.auth.signUp({ email, password });
    setLoading(false);

    if (authError) {
      setError(t('login.errorRegisterGeneric'));
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
        {/* Header */}
        <div className="lp-modal__header">
          <span className="lp-modal__logo">Salvida</span>
          <button className="lp-modal__close" onClick={onClose} aria-label="Cerrar">
            <span className="lp-material-icon">close</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="lp-modal__tabs">
          <button
            className={`lp-modal__tab${tab === 'login' ? ' lp-modal__tab--active' : ''}`}
            onClick={() => setTab('login')}
          >
            {t('login.loginTab')}
          </button>
          <button
            className={`lp-modal__tab${tab === 'register' ? ' lp-modal__tab--active' : ''}`}
            onClick={() => setTab('register')}
          >
            {t('login.registerTab')}
          </button>
        </div>

        {/* Body */}
        <div className="lp-modal__body">
          {tab === 'login' ? (
            <form onSubmit={handleLogin}>
              <div className="lp-modal__field">
                <label className="lp-modal__label" htmlFor="modal-email">
                  {t('login.email')}
                </label>
                <input
                  id="modal-email"
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
                <label className="lp-modal__label" htmlFor="modal-password">
                  {t('login.password')}
                </label>
                <input
                  id="modal-password"
                  type="password"
                  className="lp-modal__input"
                  placeholder={t('login.passwordPlaceholder')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>
              {error && <p className="lp-modal__error">{error}</p>}
              <button type="submit" className="lp-modal__submit" disabled={loading}>
                {loading ? t('login.submitting') : t('login.submit')}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister}>
              <div className="lp-modal__field">
                <label className="lp-modal__label" htmlFor="modal-reg-email">
                  {t('login.email')}
                </label>
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
                <label className="lp-modal__label" htmlFor="modal-reg-password">
                  {t('login.password')}
                </label>
                <input
                  id="modal-reg-password"
                  type="password"
                  className="lp-modal__input"
                  placeholder={t('login.passwordPlaceholder')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
              </div>
              <div className="lp-modal__field">
                <label className="lp-modal__label" htmlFor="modal-reg-confirm">
                  {t('login.confirmPassword')}
                </label>
                <input
                  id="modal-reg-confirm"
                  type="password"
                  className="lp-modal__input"
                  placeholder={t('login.confirmPasswordPlaceholder')}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
              </div>
              {error && <p className="lp-modal__error">{error}</p>}
              {success && <p className="lp-modal__success">{success}</p>}
              {!success && (
                <button type="submit" className="lp-modal__submit" disabled={loading}>
                  {loading ? t('login.registerSubmitting') : t('login.registerSubmit')}
                </button>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
