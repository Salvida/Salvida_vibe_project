import { useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useCurrentUserStore } from '../store/useCurrentUserStore';
import { useCurrentUser } from './useCurrentUser';

/**
 * Hook que sincroniza automáticamente los datos del usuario cuando el estado de sesión cambia.
 * Se ejecuta al loguear, desloguear, o cuando la sesión se refresca.
 * 
 * Uso en el layout principal o en un componente wrapper:
 * ```tsx
 * function App() {
 *   useSyncCurrentUser();
 *   return <AppContent />;
 * }
 * ```
 */
export function useSyncCurrentUser() {
  const session = useAuthStore((s) => s.session);
  const clearCurrentUser = useCurrentUserStore((s) => s.clearCurrentUser);
  const { refetch } = useCurrentUser();

  useEffect(() => {
    if (session?.user?.id) {
      // Usuario autenticado: obtener su perfil
      refetch();
    } else {
      // No hay sesión: limpiar datos del usuario actual
      clearCurrentUser();
    }
  }, [session?.user?.id, refetch, clearCurrentUser]);
}
