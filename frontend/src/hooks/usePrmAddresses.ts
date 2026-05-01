import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api';
import type { Address } from '../types';

export const prmAddressesKey = (prmId: string) => ['prms', prmId, 'addresses'] as const;

export function usePrmAddresses(prmId: string | null) {
  return useQuery<Address[]>({
    queryKey: prmAddressesKey(prmId!),
    queryFn: () => apiClient.get<Address[]>(`/api/prms/${prmId}/addresses`),
    enabled: Boolean(prmId),
  });
}

export interface AddPrmAddressPayload {
  prmId: string;
  full_address: string;
  lat?: number;
  lng?: number;
  is_accessible?: boolean | null;
  alias?: string;
}

export function useAddPrmAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ prmId, ...body }: AddPrmAddressPayload) =>
      apiClient.post<Address>(`/api/prms/${prmId}/addresses`, body),
    onSuccess: (_data, vars) =>
      qc.invalidateQueries({ queryKey: prmAddressesKey(vars.prmId) }),
  });
}

export interface UpdatePrmAddressPayload {
  prmId: string;
  addressId: string;
  full_address?: string;
  lat?: number;
  lng?: number;
  is_accessible?: boolean | null;
  alias?: string;
}

export function useUpdatePrmAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ prmId: _prmId, addressId, ...body }: UpdatePrmAddressPayload) =>
      apiClient.put<Address>(`/api/addresses/${addressId}`, body),
    onSuccess: (_data, vars) =>
      qc.invalidateQueries({ queryKey: prmAddressesKey(vars.prmId) }),
  });
}

export function useDeletePrmAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ prmId, addressId }: { prmId: string; addressId: string }) =>
      apiClient.delete<void>(`/api/prms/${prmId}/addresses/${addressId}`),
    onSuccess: (_data, vars) =>
      qc.invalidateQueries({ queryKey: prmAddressesKey(vars.prmId) }),
  });
}
