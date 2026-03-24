import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api';
import type { UserProfile } from '../types';
import { useAuthStore } from '../store/useAuthStore';

export const PROFILE_KEY = ['profile'] as const;

export function useProfile() {
  const updateUser = useAuthStore((s) => s.updateUser);

  return useQuery<UserProfile>({
    queryKey: PROFILE_KEY,
    queryFn: async () => {
      const profile = await apiClient.get<UserProfile>('/api/profile');
      // Keep Zustand in sync with the server value
      updateUser(profile);
      return profile;
    },
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  const updateUser = useAuthStore((s) => s.updateUser);

  return useMutation({
    mutationFn: (body: Partial<UserProfile>) =>
      apiClient.put<UserProfile>('/api/profile', body),
    // Optimistic update: update Zustand before the request resolves
    onMutate: (vars) => {
      updateUser(vars);
    },
    onSuccess: (data) => {
      updateUser(data);
      qc.setQueryData(PROFILE_KEY, data);
    },
    onError: () => {
      // On error, re-fetch from server to restore correct state
      qc.invalidateQueries({ queryKey: PROFILE_KEY });
    },
  });
}
