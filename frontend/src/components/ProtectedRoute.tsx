import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useProfile } from '../hooks/useProfile';

function ProfileSync() {
  // Fetches profile from backend once and syncs to Zustand (replaces MOCK_USER)
  useProfile();
  return null;
}

export default function ProtectedRoute() {
  const session = useAuthStore((s) => s.session);

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
