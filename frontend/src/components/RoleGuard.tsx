import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import AppLoader from './AppLoader';
import type { UserRole } from '../types';

interface RoleGuardProps {
  allowed: UserRole[];
}

export default function RoleGuard({ allowed }: RoleGuardProps) {
  const user = useAuthStore((state) => state.user);

  // El perfil todavía no cargó (ProfileSync de ProtectedRoute está en progreso)
  if (user === null) {
    return <AppLoader />;
  }

  if (!allowed.includes(user.role)) {
    return <Navigate to="/app/bookings" replace />;
  }

  return <Outlet />;
}
