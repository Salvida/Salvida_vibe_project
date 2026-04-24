import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { apiClient, parseApiError } from '../lib/api';
import type { UserProfile, NotificationPrefs, CreateUserRequest } from '../types';

export const PROFILE_KEY = ['profile'] as const;
export const USERS_KEY = ['users'] as const;

export function useProfile() {
  return useQuery<UserProfile>({
    queryKey: PROFILE_KEY,
    queryFn: () => apiClient.get<UserProfile>('/api/profile'),
    staleTime: 0,
  });
}

export function useUsers(enabled: boolean) {
  return useQuery<UserProfile[]>({
    queryKey: USERS_KEY,
    queryFn: () => apiClient.get<UserProfile[]>('/api/profile/users'),
    enabled,
  });
}

export function useUpdateNotificationPrefs() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (prefs: NotificationPrefs) =>
      apiClient.put<UserProfile>('/api/profile/notifications', prefs),
    onSuccess: (data) => {
      qc.setQueryData(PROFILE_KEY, data);
      toast.success('Preferencias de notificaciones actualizadas');
    },
    onError: (error) => {
      toast.error(parseApiError(error, 'Error al actualizar las preferencias'));
    },
  });
}

export function useArchiveUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) =>
      apiClient.patch<UserProfile>(`/api/profile/${userId}/archive`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: USERS_KEY });
      toast.success('Estado del usuario actualizado');
    },
    onError: (error) => toast.error(parseApiError(error, 'Error al archivar el usuario')),
  });
}

export function useDemoMode() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (active: boolean) =>
      apiClient.post<UserProfile>('/api/profile/demo-mode', { active }),
    onSuccess: (data) => {
      const msg = data.demoModeActive ? 'Modo demo activado' : 'Modo producción activado';
      toast.success(msg);
      window.location.href = '/app/bookings';
    },
    onError: (error) => toast.error(parseApiError(error, 'Error al cambiar modo demo')),
  });
}

export function useCreateUser() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (body: CreateUserRequest) =>
      apiClient.post<UserProfile>('/api/profile/users', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: USERS_KEY });
      toast.success('Usuario creado correctamente');
    },
    onError: (error) => {
      toast.error(parseApiError(error, 'Error al crear el usuario'));
    },
  });
}

export function useToggleUserDemo() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, isDemo }: { userId: string; isDemo: boolean }) =>
      apiClient.patch<UserProfile>(`/api/profile/${userId}/demo`, { is_demo: isDemo }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: USERS_KEY });
      toast.success('Estado demo actualizado');
    },
    onError: (error) => {
      toast.error(parseApiError(error, 'Error al cambiar estado demo'));
    },
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ targetUserId, ...body }: Partial<UserProfile> & { targetUserId?: string }) => {
      if (targetUserId) {
        return apiClient.put<UserProfile>(`/api/profile/${targetUserId}`, body);
      }
      return apiClient.put<UserProfile>('/api/profile', body);
    },
    onSuccess: (data, { targetUserId }) => {
      if (!targetUserId) {
        qc.setQueryData(PROFILE_KEY, data);
      } else {
        qc.invalidateQueries({ queryKey: USERS_KEY });
      }
      toast.success('Perfil actualizado correctamente');
    },
    onError: (error, { targetUserId }) => {
      if (!targetUserId) qc.invalidateQueries({ queryKey: PROFILE_KEY });
      toast.error(parseApiError(error, 'Error al actualizar el perfil'));
    },
  });
}
