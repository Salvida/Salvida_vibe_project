import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api';
import type { Prm } from '../types';

// ---- Query keys ----
export const PRMS_KEY = ['prms'] as const;
export const prmKey = (id: string) => ['prms', id] as const;

// ---- Types matching the backend PrmListItem / Prm ----
export type PrmListItem = Pick<Prm, 'id' | 'name' | 'email' | 'phone' | 'status' | 'avatar' | 'dni' | 'is_demo'>;

// ---- Hooks ----

export function usePrms(query?: string) {
  const params = new URLSearchParams();
  if (query) params.set('q', query);

  return useQuery<PrmListItem[]>({
    queryKey: [...PRMS_KEY, query],
    queryFn: () => apiClient.get<PrmListItem[]>(`/api/prms?${params}`),
  });
}

export function usePrm(id: string) {
  return useQuery<Prm>({
    queryKey: prmKey(id),
    queryFn: () => apiClient.get<Prm>(`/api/prms/${id}`),
    enabled: Boolean(id),
  });
}

export function useCreatePrm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Omit<Prm, 'id' | 'address' | 'emergency_contacts'>) =>
      apiClient.post<Prm>('/api/prms', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: PRMS_KEY }),
  });
}

export function useUpdatePrm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: Partial<Prm> & { id: string }) =>
      apiClient.put<Prm>(`/api/prms/${id}`, body),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: PRMS_KEY });
      qc.invalidateQueries({ queryKey: prmKey(vars.id) });
    },
  });
}

export function useDeletePrm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete<void>(`/api/prms/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: PRMS_KEY }),
  });
}
