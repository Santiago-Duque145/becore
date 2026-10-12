import { api } from '../lib/api.js';

export const listEvents = (params) => api.get('/events', { params });
export const getEvent = (id) => api.get(`/events/${id}`);
export const createEvent = (body) => api.post('/events', body);
export const updateEvent = (id, body) => api.patch(`/events/${id}`, body);
export const cancelEvent = (id) => api.post(`/events/${id}/cancel`);
export const publishEvent = (id) => api.post(`/events/${id}/publish`);

// "Para ti": Event[] con reason, por afinidad con las preferencias (auth-onboarding §8)
export const listRecommendedEvents = (limit = 6) => api.get('/events/recommended', { params: { limit } });
