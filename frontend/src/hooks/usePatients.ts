import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api';
import type { Patient } from '../types';

// ---- Query keys ----
export const PATIENTS_KEY = ['patients'] as const;
export const patientKey = (id: string) => ['patients', id] as const;

// ---- Types matching the backend PatientListItem / Patient ----
export type PatientListItem = Pick<Patient, 'id' | 'name' | 'email' | 'phone' | 'status' | 'avatar' | 'dni' | 'is_demo'>;

// ---- Hooks ----

export function usePatients(query?: string) {
  const params = new URLSearchParams();
  if (query) params.set('q', query);

  return useQuery<PatientListItem[]>({
    queryKey: [...PATIENTS_KEY, query],
    queryFn: () => apiClient.get<PatientListItem[]>(`/api/patients?${params}`),
  });
}

export function usePatient(id: string) {
  return useQuery<Patient>({
    queryKey: patientKey(id),
    queryFn: () => apiClient.get<Patient>(`/api/patients/${id}`),
    enabled: Boolean(id),
  });
}

export function useCreatePatient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Omit<Patient, 'id' | 'address' | 'emergency_contacts'>) =>
      apiClient.post<Patient>('/api/patients', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: PATIENTS_KEY }),
  });
}

export function useUpdatePatient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: Partial<Patient> & { id: string }) =>
      apiClient.put<Patient>(`/api/patients/${id}`, body),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: PATIENTS_KEY });
      qc.invalidateQueries({ queryKey: patientKey(vars.id) });
    },
  });
}

export function useDeletePatient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete<void>(`/api/patients/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: PATIENTS_KEY }),
  });
}
