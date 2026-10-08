import { api } from '../lib/api.js';

export const confirmAttendance = (eventId) => api.post(`/events/${eventId}/attendance`);
export const cancelAttendance = (eventId) => api.delete(`/events/${eventId}/attendance`);
