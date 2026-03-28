import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabaseClient';
import { useAuthStore } from '../../store/useAuthStore';
import './LoginForm.css';

interface LoginFormProps {
  /** Called after a successful login, before navigating to /app */
  onSuccess?: () => void;
}

export default function LoginForm({ onSuccess }: LoginFormProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
      setError(
        authError.message === 'Invalid login credentials'
          ? t('login.errorInvalid')
          : t('login.errorGeneric'),
      );
      return;
    }

    if (data.session) {
      setSession(data.session);
      onSuccess?.();
      navigate('/app');
    }
  }

  return (
    <form className="login__form" onSubmit={handleSubmit}>
      <div className="login__field">
        <label className="login__label" htmlFor="lf-email">
          {t('login.email')}
        </label>
        <input
          id="lf-email"
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
        <label className="login__label" htmlFor="lf-password">
          {t('login.password')}
        </label>
        <div className="login__input-wrapper">
          <input
            id="lf-password"
            type={showPassword ? 'text' : 'password'}
            className="login__input"
            placeholder={t('login.passwordPlaceholder')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
          <button
            type="button"
            className="login__eye-btn"
            onClick={() => setShowPassword((v) => !v)}
            tabIndex={-1}
            aria-label={showPassword ? t('login.hidePassword') : t('login.showPassword')}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>

      {error && <p className="login__error">{error}</p>}

      <button type="submit" className="login__submit" disabled={loading}>
        {loading ? t('login.submitting') : t('login.submit')}
      </button>
    </form>
  );
}
