import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { apiClient, ApiError } from '../lib/api';
import type { UserProfile } from '../types';
import { useAuthStore } from '../store/useAuthStore';

export const PROFILE_KEY = ['profile'] as const;
export const USERS_KEY = ['users'] as const;

function parseApiError(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    try {
      const parsed = JSON.parse(error.message);
      return parsed.detail ?? fallback;
    } catch {
      return error.message || fallback;
    }
  }
  return fallback;
}

export function useProfile() {
  const setUser = useAuthStore((s) => s.setUser);

  return useQuery<UserProfile>({
    queryKey: PROFILE_KEY,
    queryFn: async () => {
      const profile = await apiClient.get<UserProfile>('/api/profile');
      setUser(profile);
      return profile;
    },
  });
}

export function useUsers(enabled: boolean) {
  return useQuery<UserProfile[]>({
    queryKey: USERS_KEY,
    queryFn: () => apiClient.get<UserProfile[]>('/api/profile/users'),
    enabled,
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  const updateUser = useAuthStore((s) => s.updateUser);

  return useMutation({
    mutationFn: ({ targetUserId, ...body }: Partial<UserProfile> & { targetUserId?: string }) => {
      if (targetUserId) {
        return apiClient.put<UserProfile>(`/api/profile/${targetUserId}`, body);
      }
      return apiClient.put<UserProfile>('/api/profile', body);
    },
    onMutate: ({ targetUserId, ...vars }) => {
      if (!targetUserId) updateUser(vars);
    },
    onSuccess: (data, { targetUserId }) => {
      if (!targetUserId) {
        updateUser(data);
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
