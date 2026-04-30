import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { apiClient, parseApiError } from '../lib/api';
import type { Booking } from '../types';

// ---- Query keys ----
export const BOOKINGS_KEY = ['bookings'] as const;
export const bookingsByDateKey = (date: string) => ['bookings', 'date', date] as const;

// ---- Filter params ----
export interface BookingFilters {
  date?: string;
  date_from?: string;
  date_to?: string;
  status?: string[];
  prmId?: string[];
  ownerId?: string[];
}

// ---- Hooks ----

export function useBooking(id: string) {
  return useQuery<Booking>({
    queryKey: ['bookings', 'detail', id],
    queryFn: () => apiClient.get<Booking>(`/api/bookings/${id}`),
    enabled: Boolean(id),
  });
}

export function useBookings(filters?: BookingFilters, options?: { enabled?: boolean }) {
  const params = new URLSearchParams();
  if (filters?.date) params.set('date', filters.date);
  if (filters?.date_from) params.set('date_from', filters.date_from);
  if (filters?.date_to) params.set('date_to', filters.date_to);
  filters?.status?.forEach((s) => params.append('status', s));
  filters?.prmId?.forEach((id) => params.append('prm_id', id));
  filters?.ownerId?.forEach((id) => params.append('owner_id', id));

  return useQuery<Booking[]>({
    queryKey: [...BOOKINGS_KEY, filters],
    queryFn: () => apiClient.get<Booking[]>(`/api/bookings?${params}`),
    enabled: options?.enabled !== false,
  });
}

export function useCreateBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Omit<Booking, 'id' | 'prmName' | 'prmAvatar' | 'status'>) =>
      apiClient.post<Booking>('/api/bookings', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: BOOKINGS_KEY });
      toast.success('Reserva creada correctamente');
    },
    onError: (error) => toast.error(parseApiError(error, 'Error al crear la reserva')),
  });
}

export function useUpdateBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: Partial<Booking> & { id: string }) =>
      apiClient.put<Booking>(`/api/bookings/${id}`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: BOOKINGS_KEY });
      toast.success('Reserva actualizada correctamente');
    },
    onError: (error) => toast.error(parseApiError(error, 'Error al actualizar la reserva')),
  });
}

export function useDeleteBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete<void>(`/api/bookings/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: BOOKINGS_KEY });
      toast.success('Reserva eliminada correctamente');
    },
    onError: (error) => toast.error(parseApiError(error, 'Error al eliminar la reserva')),
  });
}

export function useCancelBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      apiClient.post<Booking>(`/api/bookings/${id}/cancel`, { reason }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: BOOKINGS_KEY });
      toast.success('Reserva cancelada');
    },
    onError: (error) => toast.error(parseApiError(error, 'Error al cancelar la reserva')),
  });
}

export function useUpdateBookingStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: Booking['status'] }) =>
      apiClient.patch<Booking>(`/api/bookings/${id}/status`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: BOOKINGS_KEY });
      toast.success('Estado de la reserva actualizado');
    },
    onError: (error) => toast.error(parseApiError(error, 'Error al actualizar el estado')),
  });
}

export function useSignBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, signatureImage }: { id: string; signatureImage: string }) =>
      apiClient.post<Booking>(`/api/bookings/${id}/sign`, { signature_image: signatureImage }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: BOOKINGS_KEY });
    },
    onError: (error) => toast.error(parseApiError(error, 'Error al firmar el contrato')),
  });
}
