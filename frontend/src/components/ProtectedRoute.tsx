import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useProfile } from '../hooks/useProfile';
import AppLoader from './AppLoader';

function ProfileSync() {
  // Fetches profile from backend once and syncs to Zustand (replaces MOCK_USER)
  useProfile();
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
