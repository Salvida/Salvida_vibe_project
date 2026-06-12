import { useState } from 'react';
import { X } from 'lucide-react';
import { useCreateUser } from '../../hooks/useProfile';
import { useProfile } from '../../hooks/useProfile';
import type { UserRole } from '../../types';
import './CreateUserModal.css';

interface Props {
  onClose: () => void;
}

export default function CreateUserModal({ onClose }: Props) {
  const { data: liveProfile } = useProfile();
  const isSuperAdmin = liveProfile?.role === 'superadmin';

  const createUser = useCreateUser();

  const [method, setMethod] = useState<'invite' | 'direct'>('invite');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [organization, setOrganization] = useState('');
  const [role, setRole] = useState<UserRole>('user');
  const [isDemo, setIsDemo] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!email.trim()) next.email = 'El email es requerido';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) next.email = 'Email inválido';
    if (method === 'direct') {
      if (!password) next.password = 'La contraseña es requerida';
      else if (password.length < 8) next.password = 'Mínimo 8 caracteres';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!validate()) return;

    createUser.mutate(
      {
        email: email.trim().toLowerCase(),
        method,
        password: method === 'direct' ? password : undefined,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        organization: organization.trim(),
        role,
        is_demo: isDemo,
      },
      { onSuccess: onClose },
    );
  }

  return (
    <div className="cum-overlay"       onClick={(event) => event.target === event.currentTarget && onClose()}>
      <div className="cum-modal" role="dialog" aria-modal="true">
        <div className="cum-header">
          <h2 className="cum-title">Nuevo usuario</h2>
          <button className="cum-close" onClick={onClose} aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>

        <div className="cum-tabs">
          <button
            className={`cum-tab${method === 'invite' ? ' cum-tab--active' : ''}`}
            onClick={() => setMethod('invite')}
            type="button"
          >
            Invitar por email
          </button>
          <button
            className={`cum-tab${method === 'direct' ? ' cum-tab--active' : ''}`}
            onClick={() => setMethod('direct')}
            type="button"
          >
            Crear con contraseña
          </button>
        </div>

        <form className="cum-form" onSubmit={handleSubmit} noValidate>
          <div className="cum-field">
            <label className="cum-label" htmlFor="cum-email">Email *</label>
            <input
              id="cum-email"
              className={`cum-input${errors.email ? ' cum-input--error' : ''}`}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="off"
            />
            {errors.email && <span className="cum-error">{errors.email}</span>}
          </div>

          {method === 'direct' && (
            <div className="cum-field">
              <label className="cum-label" htmlFor="cum-password">Contraseña *</label>
              <input
                id="cum-password"
                className={`cum-input${errors.password ? ' cum-input--error' : ''}`}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />
              {errors.password && <span className="cum-error">{errors.password}</span>}
            </div>
          )}

          <div className="cum-row">
            <div className="cum-field">
              <label className="cum-label" htmlFor="cum-first">Nombre</label>
              <input
                id="cum-first"
                className="cum-input"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
            <div className="cum-field">
              <label className="cum-label" htmlFor="cum-last">Apellido</label>
              <input
                id="cum-last"
                className="cum-input"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
          </div>

          <div className="cum-row">
            <div className="cum-field">
              <label className="cum-label" htmlFor="cum-phone">Teléfono</label>
              <input
                id="cum-phone"
                className="cum-input"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="cum-field">
              <label className="cum-label" htmlFor="cum-org">Organización</label>
              <input
                id="cum-org"
                className="cum-input"
                type="text"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
              />
            </div>
          </div>

          <div className="cum-field">
            <label className="cum-label" htmlFor="cum-role">Rol</label>
            <select
              id="cum-role"
              className="cum-select"
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
            >
              <option value="user">Usuario</option>
              {isSuperAdmin && <option value="admin">Admin</option>}
            </select>
          </div>

          {isSuperAdmin && (
            <label className="cum-toggle">
              <span className="cum-toggle-label">Usuario demo</span>
              <button
                type="button"
                role="switch"
                aria-checked={isDemo}
                className={`cum-switch${isDemo ? ' cum-switch--on' : ''}`}
                onClick={() => setIsDemo((v) => !v)}
              >
                <span className="cum-switch-thumb" />
              </button>
            </label>
          )}

          {method === 'invite' && (
            <p className="cum-hint">
              Se enviará un email de invitación. El usuario deberá activar su cuenta.
            </p>
          )}

          <div className="cum-actions">
            <button type="button" className="cum-btn cum-btn--secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="cum-btn cum-btn--primary" disabled={createUser.isPending}>
              {createUser.isPending ? 'Creando…' : method === 'invite' ? 'Enviar invitación' : 'Crear usuario'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
