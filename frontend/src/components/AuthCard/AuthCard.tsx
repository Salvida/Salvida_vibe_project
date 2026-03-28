import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabaseClient';
import { useAuthStore } from '../../store/useAuthStore';
import './AuthCard.css';

interface AuthCardProps {
  /** When true, shows tabs so the user can switch to the register form */
  showRegister?: boolean;
}

type Tab = 'login' | 'register';

export default function AuthCard({ showRegister = false }: AuthCardProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);

  const [tab, setTab] = useState<Tab>(showRegister ? 'register' : 'login');

  // Sync tab when the prop changes (e.g. navigating /login → /login?register=true)
  useEffect(() => {
    setTab(showRegister ? 'register' : 'login');
  }, [showRegister]);

  // ── Login state ──────────────────────────────────────────────────────────
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPwd, setShowLoginPwd] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // ── Register state ───────────────────────────────────────────────────────
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dni, setDni] = useState('');
  const [phone, setPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showRegPwd, setShowRegPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);
  const [regSuccess, setRegSuccess] = useState<string | null>(null);

  // ── Handlers ─────────────────────────────────────────────────────────────
  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginPassword,
    });
    setLoginLoading(false);

    if (authError) {
      setLoginError(
        authError.message === 'Invalid login credentials'
          ? t('login.errorInvalid')
          : t('login.errorGeneric'),
      );
      return;
    }

    if (data.session) {
      setSession(data.session);
      navigate('/app');
    }
  }

  async function handleRegister(e: FormEvent) {
    e.preventDefault();
    setRegError(null);

    if (regPassword !== confirmPassword) {
      setRegError(t('login.passwordMismatch'));
      return;
    }

    setRegLoading(true);
    const { data, error: authError } = await supabase.auth.signUp({
      email: regEmail,
      password: regPassword,
      options: {
        data: { first_name: firstName, last_name: lastName, dni, phone },
      },
    });
    setRegLoading(false);

    if (authError) {
      setRegError(t('login.errorRegisterGeneric'));
      return;
    }

    if (data.session) {
      setSession(data.session);
      navigate('/app');
      return;
    }

    setRegSuccess(t('login.registerSuccess'));
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      {showRegister && (
        <div className="auth-card__tabs">
          <button
            className={`auth-card__tab${tab === 'login' ? ' auth-card__tab--active' : ''}`}
            onClick={() => setTab('login')}
          >
            {t('login.loginTab')}
          </button>
          <button
            className={`auth-card__tab${tab === 'register' ? ' auth-card__tab--active' : ''}`}
            onClick={() => setTab('register')}
          >
            {t('login.registerTab')}
          </button>
        </div>
      )}

      {tab === 'login' ? (
        <form className="auth-card__form" onSubmit={handleLogin}>
          <div className="auth-card__field">
            <label className="auth-card__label" htmlFor="ac-email">
              {t('login.email')}
            </label>
            <input
              id="ac-email"
              type="email"
              className="auth-card__input"
              placeholder={t('login.emailPlaceholder')}
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="auth-card__field">
            <label className="auth-card__label" htmlFor="ac-password">
              {t('login.password')}
            </label>
            <div className="auth-card__input-wrapper">
              <input
                id="ac-password"
                type={showLoginPwd ? 'text' : 'password'}
                className="auth-card__input"
                placeholder={t('login.passwordPlaceholder')}
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="auth-card__eye-btn"
                onClick={() => setShowLoginPwd((v) => !v)}
                tabIndex={-1}
                aria-label={showLoginPwd ? t('login.hidePassword') : t('login.showPassword')}
              >
                {showLoginPwd ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {loginError && <p className="auth-card__error">{loginError}</p>}

          <button type="submit" className="auth-card__submit" disabled={loginLoading}>
            {loginLoading ? t('login.submitting') : t('login.submit')}
          </button>
        </form>
      ) : (
        <form className="auth-card__form" onSubmit={handleRegister}>
          <div className="auth-card__field-row">
            <div className="auth-card__field">
              <label className="auth-card__label" htmlFor="ac-firstname">
                {t('login.firstName')}
              </label>
              <input
                id="ac-firstname"
                type="text"
                className="auth-card__input"
                placeholder={t('login.firstNamePlaceholder')}
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                autoComplete="given-name"
              />
            </div>
            <div className="auth-card__field">
              <label className="auth-card__label" htmlFor="ac-lastname">
                {t('login.lastName')}
              </label>
              <input
                id="ac-lastname"
                type="text"
                className="auth-card__input"
                placeholder={t('login.lastNamePlaceholder')}
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                autoComplete="family-name"
              />
            </div>
          </div>

          <div className="auth-card__field">
            <label className="auth-card__label" htmlFor="ac-dni">{t('login.dni')}</label>
            <input
              id="ac-dni"
              type="text"
              className="auth-card__input"
              placeholder={t('login.dniPlaceholder')}
              value={dni}
              onChange={(e) => setDni(e.target.value)}
              required
              autoComplete="off"
            />
          </div>

          <div className="auth-card__field">
            <label className="auth-card__label" htmlFor="ac-phone">{t('login.phone')}</label>
            <input
              id="ac-phone"
              type="tel"
              className="auth-card__input"
              placeholder={t('login.phonePlaceholder')}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              autoComplete="tel"
            />
          </div>

          <div className="auth-card__field">
            <label className="auth-card__label" htmlFor="ac-reg-email">{t('login.email')}</label>
            <input
              id="ac-reg-email"
              type="email"
              className="auth-card__input"
              placeholder={t('login.emailPlaceholder')}
              value={regEmail}
              onChange={(e) => setRegEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="auth-card__field">
            <label className="auth-card__label" htmlFor="ac-reg-password">{t('login.password')}</label>
            <div className="auth-card__input-wrapper">
              <input
                id="ac-reg-password"
                type={showRegPwd ? 'text' : 'password'}
                className="auth-card__input"
                placeholder={t('login.passwordPlaceholder')}
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
              <button
                type="button"
                className="auth-card__eye-btn"
                onClick={() => setShowRegPwd((v) => !v)}
                tabIndex={-1}
                aria-label={showRegPwd ? t('login.hidePassword') : t('login.showPassword')}
              >
                {showRegPwd ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="auth-card__field">
            <label className="auth-card__label" htmlFor="ac-confirm">{t('login.confirmPassword')}</label>
            <div className="auth-card__input-wrapper">
              <input
                id="ac-confirm"
                type={showConfirmPwd ? 'text' : 'password'}
                className="auth-card__input"
                placeholder={t('login.confirmPasswordPlaceholder')}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
              <button
                type="button"
                className="auth-card__eye-btn"
                onClick={() => setShowConfirmPwd((v) => !v)}
                tabIndex={-1}
                aria-label={showConfirmPwd ? t('login.hidePassword') : t('login.showPassword')}
              >
                {showConfirmPwd ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {regError && <p className="auth-card__error">{regError}</p>}
          {regSuccess ? (
            <>
              <p className="auth-card__success">{regSuccess}</p>
              <button
                type="button"
                className="auth-card__submit"
                onClick={() => setTab('login')}
              >
                {t('login.goToLogin')}
              </button>
            </>
          ) : (
            <button type="submit" className="auth-card__submit" disabled={regLoading}>
              {regLoading ? t('login.registerSubmitting') : t('login.registerSubmit')}
            </button>
          )}
        </form>
      )}
    </>
  );
}
