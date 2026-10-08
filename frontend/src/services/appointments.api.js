import { api } from '../lib/api.js';

export const listAvailability = () => api.get('/availability/mine');
export const createAvailability = (body) => api.post('/availability', body);
export const deleteAvailability = (id) => api.delete(`/availability/${id}`);

export const searchParticipants = (q) => api.get('/users/participants', { params: q ? { q } : {} });

export const listAppointments = (scope) => api.get('/appointments', { params: { scope } });
export const createAppointment = (body) => api.post('/appointments', body);
export const cancelAppointment = (id) => api.post(`/appointments/${id}/cancel`);
