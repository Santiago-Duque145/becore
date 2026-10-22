import { api } from '../lib/api.js';

export const getMyRating = (eventId) => api.get(`/events/${eventId}/rating/me`);
export const createRating = (eventId, body) => api.post(`/events/${eventId}/rating`, body);
export const updateRating = (eventId, body) => api.put(`/events/${eventId}/rating`, body);
export const getRatingSummary = (eventId) => api.get(`/events/${eventId}/ratings/summary`);
