import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { apiClient, parseApiError } from '../lib/api';
import type { Address } from '../types';

export const ADDRESSES_KEY = ['addresses'] as const;

export type AccessibilityFilter = 'pending' | 'accessible' | 'not_accessible';

export interface AddressFilters {
  accessibility?: AccessibilityFilter;
  ownerIds?: string[];
  prmIds?: string[];
}

export function useAddresses(filters: AddressFilters = {}) {
  const { accessibility, ownerIds = [], prmIds = [] } = filters;
  const params = new URLSearchParams();
  if (accessibility) params.set('accessibility', accessibility);
  ownerIds.forEach((id) => params.append('owner_id', id));
  prmIds.forEach((id)   => params.append('prm_id', id));

  return useQuery<Address[]>({
    queryKey: [...ADDRESSES_KEY, accessibility, ownerIds, prmIds],
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

interface ValidateAddressResponse {
  address: Address;
  inherited_count: number;
}

export function useValidateAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, is_accessible }: { id: string; is_accessible: boolean | null }) =>
      apiClient.patch<ValidateAddressResponse>(`/api/addresses/${id}/validate`, { is_accessible }),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ADDRESSES_KEY });
      qc.invalidateQueries({ queryKey: ['prms'] });
      if (data.inherited_count > 0) {
        const noun = data.inherited_count === 1 ? 'dirección' : 'direcciones';
        toast.success(`Apta. ${data.inherited_count} ${noun} del mismo edificio actualizadas automáticamente.`);
      } else {
        toast.success('Dirección actualizada');
      }
    },
    onError: (error) => toast.error(parseApiError(error, 'Error al actualizar la dirección')),
  });
}
