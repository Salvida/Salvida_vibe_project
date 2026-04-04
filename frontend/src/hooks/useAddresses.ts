import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { apiClient, ApiError } from '../lib/api';
import type { Address } from '../types';

export const ADDRESSES_KEY = ['addresses'] as const;

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

export function useAddresses(validationStatus?: string) {
  const params = new URLSearchParams();
  if (validationStatus) params.set('validation_status', validationStatus);

  return useQuery<Address[]>({
    queryKey: [...ADDRESSES_KEY, validationStatus],
    queryFn: () => apiClient.get<Address[]>(`/api/addresses?${params}`),
  });
}

export function useCreateAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Omit<Address, 'id'>) =>
      apiClient.post<Address>('/api/addresses', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ADDRESSES_KEY });
      toast.success('Dirección creada correctamente');
    },
    onError: (error) => toast.error(parseApiError(error, 'Error al crear la dirección')),
  });
}

export function useValidateAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      validation_status,
      validation_notes,
    }: {
      id: string;
      validation_status: Address['validation_status'];
      validation_notes?: string;
    }) =>
      apiClient.patch<Address>(`/api/addresses/${id}/validate`, {
        validation_status,
        validation_notes,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ADDRESSES_KEY });
      toast.success('Dirección validada correctamente');
    },
    onError: (error) => toast.error(parseApiError(error, 'Error al validar la dirección')),
  });
}
