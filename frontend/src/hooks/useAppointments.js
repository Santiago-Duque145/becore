import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../lib/query-keys.js';
import * as api from '../services/appointments.api.js';

export function useAvailability() {
  return useQuery({ queryKey: queryKeys.availability, queryFn: async () => (await api.listAvailability()).data });
}

export function useCreateAvailability() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body) => (await api.createAvailability(body)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.availability }),
  });
}

export function useDeleteAvailability() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.deleteAvailability(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.availability }),
  });
}

export function useAppointments(scope) {
  return useQuery({
    queryKey: queryKeys.appointments(scope),
    queryFn: async () => (await api.listAppointments(scope)).data,
  });
}

const APPOINTMENTS_ROOT = ['appointments'];

export function useCreateAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body) => (await api.createAppointment(body)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: APPOINTMENTS_ROOT }),
  });
}

export function useCancelAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => (await api.cancelAppointment(id)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: APPOINTMENTS_ROOT }),
  });
}

function useDebounced(value, delayMs) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}

// Búsqueda de participantes con debounce de 300 ms; solo consulta con 2 letras o más
export function useParticipantSearch(text) {
  const q = useDebounced(text.trim(), 300);
  const enabled = q.length >= 2;
  const query = useQuery({
    queryKey: ['participants', q],
    queryFn: async () => (await api.searchParticipants(q)).data,
    enabled,
  });
  return { ...query, enabled, pending: text.trim() !== q };
}
