import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { apiClient, parseApiError } from '../lib/api';
import type { UserProfile, NotificationPrefs } from '../types';

export const PROFILE_KEY = ['profile'] as const;
export const USERS_KEY = ['users'] as const;

export function useProfile() {
  return useQuery<UserProfile>({
    queryKey: PROFILE_KEY,
    queryFn: () => apiClient.get<UserProfile>('/api/profile'),
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
