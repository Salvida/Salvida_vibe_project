import { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useProfile } from '../hooks/useProfile';
import AppLoader from './AppLoader';

function ProfileSync() {
  const { data: profile } = useProfile();
  const setUser = useAuthStore((s) => s.setUser);

  useEffect(() => {
    if (profile) setUser(profile);
  }, [profile, setUser]);

  return null;
}

interface ProtectedRouteProps {
  requireAdmin?: boolean;
  requireSuperAdmin?: boolean;
}

export default function ProtectedRoute({
  requireAdmin = false,
  requireSuperAdmin = false,
}: ProtectedRouteProps) {
  const session = useAuthStore((s) => s.session);
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const user = useAuthStore((s) => s.user);

  // Wait for getSession() to resolve before deciding whether to redirect.
  // Without this, Zustand starts with session=null and ProtectedRoute would
  // always redirect to /login on hard refresh, even with a valid session.
  if (!isInitialized) {
    return <AppLoader />;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  const needsRoleCheck = requireAdmin || requireSuperAdmin;

  // ProfileSync must render whenever there's a session so useProfile() runs
  // and populates the store. Without this, admin routes opened in a new tab
  // deadlock: role check waits for user, but ProfileSync never renders to fetch it.
  if (needsRoleCheck && user === null) {
    return (
      <>
        <ProfileSync />
        <AppLoader />
      </>
    );
  }

  if (requireSuperAdmin && user?.role !== 'superadmin') {
    return <Navigate to="/app/bookings" replace />;
  }

  // superadmin inherits admin access
  if (requireAdmin && user?.role !== 'admin' && user?.role !== 'superadmin') {
    return <Navigate to="/app/bookings" replace />;
  }

  return (
    <>
      <ProfileSync />
      <Outlet />
    </>
  );
}
