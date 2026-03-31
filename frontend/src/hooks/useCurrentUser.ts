import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api';
import type { UserProfile } from '../types';
import { useCurrentUserStore } from '../store/useCurrentUserStore';

export const CURRENT_USER_KEY = ['currentUser'] as const;

export function useCurrentUser() {
  const setCurrentUser = useCurrentUserStore((s) => s.setCurrentUser);
  const setLoading = useCurrentUserStore((s) => s.setLoading);
  const setError = useCurrentUserStore((s) => s.setError);

  return useQuery<UserProfile>({
    queryKey: CURRENT_USER_KEY,
    queryFn: async () => {
      try {
        setLoading(true);
        const profile = await apiClient.get<UserProfile>('/api/profile');
        setCurrentUser(profile);
        setError(null);
        return profile;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to fetch user profile';
        setError(errorMessage);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });
}

export function useUpdateCurrentUser() {
  const qc = useQueryClient();
  const updateCurrentUser = useCurrentUserStore((s) => s.updateCurrentUser);
  const setError = useCurrentUserStore((s) => s.setError);

  return useMutation({
    mutationFn: (body: Partial<UserProfile>) =>
      apiClient.put<UserProfile>('/api/profile', body),
    onMutate: (vars) => {
      updateCurrentUser(vars);
    },
    onSuccess: (data) => {
      updateCurrentUser(data);
      qc.setQueryData(CURRENT_USER_KEY, data);
      setError(null);
    },
    onError: (error) => {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to update profile';
      setError(errorMessage);
      qc.invalidateQueries({ queryKey: CURRENT_USER_KEY });
    },
  });
}
