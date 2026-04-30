import { useAuthStore } from '../../store/useAuthStore';
import './DemoModeBanner.css';

export default function DemoModeBanner() {
  const user = useAuthStore((s) => s.user);

  if (!user?.demoModeActive) return null;

  return (
    <div className="demo-banner" role="status" aria-live="polite">
      <span>Modo demo activo — estás viendo datos de prueba</span>
    </div>
  );
}
