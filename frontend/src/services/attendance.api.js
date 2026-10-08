import { api } from '../lib/api.js';

export const confirmAttendance = (eventId) => api.post(`/events/${eventId}/attendance`);
export const cancelAttendance = (eventId) => api.delete(`/events/${eventId}/attendance`);
export const listAttendees = (eventId) => api.get(`/events/${eventId}/attendees`);
export const setCheckIn = (eventId, userId, checkedIn) =>
  api.patch(`/events/${eventId}/attendees/${userId}`, { checkedIn });
export const listActivity = (eventId, limit) => api.get(`/events/${eventId}/activity`, { params: { limit } });
