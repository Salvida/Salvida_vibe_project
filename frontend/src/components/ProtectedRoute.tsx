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

export default function ProtectedRoute() {
  const session = useAuthStore((s) => s.session);
  const isInitialized = useAuthStore((s) => s.isInitialized);

  // Wait for getSession() to resolve before deciding whether to redirect.
  // Without this, Zustand starts with session=null and ProtectedRoute would
  // always redirect to /login on hard refresh, even with a valid session.
  if (!isInitialized) {
    return <AppLoader />;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return (
    <>
      <ProfileSync />
      <Outlet />
    </>
  );
}
