import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { HeartPulse } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabaseClient';
import { useAuthStore } from '../../store/useAuthStore';
import './Login.css';

export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

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
      navigate('/app');
    }
  }

  return (
    <div className="login">
      <div className="login__card">
        <div className="login__logo">
          <div className="login__logo-icon">
            <HeartPulse size={28} />
          </div>
          <span className="login__logo-name">Salvida</span>
        </div>

        <h1 className="login__title">{t('login.title')}</h1>
        <p className="login__subtitle">{t('login.subtitle')}</p>

        <form className="login__form" onSubmit={handleSubmit}>
          <div className="login__field">
            <label className="login__label" htmlFor="email">
              {t('login.email')}
            </label>
            <input
              id="email"
              type="email"
              className="login__input"
              placeholder={t('login.emailPlaceholder')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="login__field">
            <label className="login__label" htmlFor="password">
              {t('login.password')}
            </label>
            <input
              id="password"
              type="password"
              className="login__input"
              placeholder={t('login.passwordPlaceholder')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          {error && <p className="login__error">{error}</p>}

          <button
            type="submit"
            className="login__submit"
            disabled={loading}
          >
            {loading ? t('login.submitting') : t('login.submit')}
          </button>
        </form>
      </div>
    </div>
  );
}
