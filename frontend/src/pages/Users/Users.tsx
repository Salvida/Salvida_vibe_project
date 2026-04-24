import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import Header from '../../components/Header/Header';
import DropdownMenu from '../../components/DropdownMenu';
import { useUsers, useArchiveUser } from '../../hooks/useProfile';
import type { UserProfile } from '../../types';
import './Users.css';

const ROLE_LABEL: Record<string, string> = {
  superadmin: 'Super Admin',
  admin: 'Admin',
  user: 'Usuario',
};

function getInitials(u: UserProfile) {
  if (u.firstName || u.lastName) {
    return `${u.firstName?.charAt(0) ?? ''}${u.lastName?.charAt(0) ?? ''}`.toUpperCase();
  }
  return (u.email?.charAt(0) ?? '?').toUpperCase();
}

export default function Users() {
  const navigate = useNavigate();
  const { data: users = [], isLoading } = useUsers(true);
  const archiveUser = useArchiveUser();
  const [query, setQuery] = useState('');
  const [statusTab, setStatusTab] = useState<'active' | 'all' | 'archived'>('all');

  const filtered = users.filter((u) => {
    if (statusTab === 'active' && u.isActive === false) return false;
    if (statusTab === 'archived' && u.isActive !== false) return false;
    if (query) {
      const q = query.toLowerCase();
      return (
        u.firstName?.toLowerCase().includes(q) ||
        u.lastName?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.organization?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="users">
      <Header title="Usuarios" subtitle="Gestión de cuentas de usuario" />

      <div className="users__body">
        <div className="users__inner">

          <div className="users__toolbar">
            <div className="users__search-wrap">
              <span className="users__search-icon">
                <Search size={18} />
              </span>
              <input
                type="text"
                placeholder="Buscar por nombre, email u organización…"
                className="users__search-input"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="users__filter-tabs">
            {(['all', 'active', 'archived'] as const).map((tab) => (
              <button
                key={tab}
                className={`users__filter-tab${statusTab === tab ? ' users__filter-tab--active' : ''}`}
                onClick={() => setStatusTab(tab)}
              >
                {tab === 'active' ? 'Activos' : tab === 'archived' ? 'Archivados' : 'Todos'}
              </button>
            ))}
          </div>

          <div className="users__table-wrap">
            <div className="users__table-scroll">
              <table className="users__table">
                <thead>
                  <tr>
                    <th>Usuario</th>
                    <th>Email</th>
                    <th>Organización</th>
                    <th>Rol</th>
                    <th>Estado</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <tr key={i} className="users__skeleton-row">
                        <td><div className="users__skeleton" style={{ width: '180px' }} /></td>
                        <td><div className="users__skeleton" style={{ width: '160px' }} /></td>
                        <td><div className="users__skeleton" style={{ width: '120px' }} /></td>
                        <td><div className="users__skeleton" style={{ width: '60px' }} /></td>
                        <td><div className="users__skeleton" style={{ width: '70px' }} /></td>
                        <td />
                      </tr>
                    ))
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="users__empty">
                        No se encontraron usuarios
                      </td>
                    </tr>
                  ) : (
                    filtered.map((u) => (
                      <tr
                        key={u.id}
                        className={u.isActive === false ? 'users__row--archived' : ''}
                      >
                        <td>
                          <button
                            className="user-link"
                            onClick={() => navigate(`/app/settings?userId=${u.id}`)}
                          >
                            <div className="user-link__avatar">
                              {u.avatar
                                ? <img src={u.avatar} alt={u.firstName} />
                                : getInitials(u)}
                            </div>
                            <span className="user-link__name">
                              {u.firstName || u.lastName
                                ? `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim()
                                : '—'}
                            </span>
                          </button>
                        </td>
                        <td className="users__email">{u.email || '—'}</td>
                        <td className="users__org">{u.organization || '—'}</td>
                        <td>
                          <span className={`user-role-badge user-role-badge--${u.role}`}>
                            {ROLE_LABEL[u.role ?? ''] ?? u.role}
                          </span>
                        </td>
                        <td>
                          <span className={`user-status-badge${u.isActive === false ? ' user-status-badge--archived' : ' user-status-badge--active'}`}>
                            {u.isActive === false ? 'Archivado' : 'Activo'}
                          </span>
                        </td>
                        <td>
                          <DropdownMenu
                            items={[
                              {
                                label: u.isActive === false ? 'Restaurar usuario' : 'Archivar usuario',
                                onClick: () => archiveUser.mutate(u.id),
                                variant: u.isActive === false ? 'default' : 'danger',
                              },
                            ]}
                          />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
