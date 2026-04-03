import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api';
import type { Booking } from '../types';

// ---- Query keys ----
export const BOOKINGS_KEY = ['bookings'] as const;
export const bookingsByDateKey = (date: string) => ['bookings', 'date', date] as const;

// ---- Filter params ----
export interface BookingFilters {
  date?: string;
  status?: string;
  prmId?: string;
}

// ---- Hooks ----

export function useBooking(id: string) {
  return useQuery<Booking>({
    queryKey: ['bookings', 'detail', id],
    queryFn: () => apiClient.get<Booking>(`/api/bookings/${id}`),
    enabled: Boolean(id),
  });
}

export function useBookings(filters?: BookingFilters) {
  const params = new URLSearchParams();
  if (filters?.date) params.set('date', filters.date);
  if (filters?.status) params.set('status', filters.status);
  if (filters?.prmId) params.set('prm_id', filters.prmId);

  return useQuery<Booking[]>({
    queryKey: [...BOOKINGS_KEY, filters],
    queryFn: () => apiClient.get<Booking[]>(`/api/bookings?${params}`),
  });
}

export function useCreateBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Omit<Booking, 'id' | 'prmName' | 'prmAvatar' | 'status'>) =>
      apiClient.post<Booking>('/api/bookings', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: BOOKINGS_KEY }),
  });
}

export function useUpdateBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: Partial<Booking> & { id: string }) =>
      apiClient.put<Booking>(`/api/bookings/${id}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: BOOKINGS_KEY }),
  });
}

export function useDeleteBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete<void>(`/api/bookings/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: BOOKINGS_KEY }),
  });
}

export function useCancelBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      apiClient.post<Booking>(`/api/bookings/${id}/cancel`, { reason }),
    onSuccess: () => qc.invalidateQueries({ queryKey: BOOKINGS_KEY }),
  });
}
