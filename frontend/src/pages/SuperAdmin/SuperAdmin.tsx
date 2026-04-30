import { ShieldCheck } from 'lucide-react';
import Header from '../../components/Header/Header';
import { useAuthStore } from '../../store/useAuthStore';
import { useDemoMode } from '../../hooks/useProfile';
import './SuperAdmin.css';

export default function SuperAdmin() {
  const user = useAuthStore((s) => s.user);
  const demoMode = useDemoMode();

  const isDemo = user?.demoModeActive ?? false;

  return (
    <div className="superadmin">
      <Header title="Super Admin" />

      <div className="superadmin__content">
        <section className="superadmin__section">
          <div className="superadmin__section-header">
            <ShieldCheck size={20} />
            <h2 className="superadmin__section-title">Modo Demo</h2>
          </div>
          <p className="superadmin__section-desc">
            Activá el modo demo para ver datos de prueba en lugar de datos reales.
            Solo tu sesión se ve afectada — los usuarios reales continúan usando la app con normalidad.
          </p>

          <div className="superadmin__demo-toggle">
            <div className="superadmin__demo-status">
              <span className={`superadmin__demo-dot${isDemo ? ' superadmin__demo-dot--active' : ''}`} />
              <span className="superadmin__demo-label">
                {isDemo ? 'Demo activo' : 'Demo inactivo'}
              </span>
            </div>
            <button
              className={`superadmin__toggle-btn${isDemo ? ' superadmin__toggle-btn--on' : ''}`}
              onClick={() => demoMode.mutate(!isDemo)}
              disabled={demoMode.isPending}
              aria-pressed={isDemo}
            >
              {isDemo ? 'Desactivar demo' : 'Activar demo'}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
