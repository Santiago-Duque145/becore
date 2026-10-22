import { api } from '../lib/api.js';

export const listEvents = (params) => api.get('/events', { params });
export const getEvent = (id) => api.get(`/events/${id}`);
export const createEvent = (body) => api.post('/events', body);
export const updateEvent = (id, body) => api.patch(`/events/${id}`, body);
export const cancelEvent = (id) => api.post(`/events/${id}/cancel`);
export const publishEvent = (id) => api.post(`/events/${id}/publish`);
export const finishEvent = (id) => api.post(`/events/${id}/finish`);

// "Para ti": Event[] con reason, por afinidad con las preferencias (auth-onboarding §8)
export const listRecommendedEvents = (limit = 6) => api.get('/events/recommended', { params: { limit } });

// IA7 · búsqueda en lenguaje natural: { data: Event[], meta: { mode: 'semantic'|'classic', total, searchId } }
export const searchEvents = (q, category) => api.get('/events/search', { params: { q, ...(category && { category }) } });
// Primer resultado abierto de una búsqueda (para el informe; sin datos de la persona)
export const recordSearchOpen = (searchId, eventId) => api.post(`/events/search/${searchId}/open`, { eventId });

// IA8 · borrador desde una frase: { data: { draft: {…} | null, reason? } }. Siempre 200; sin IA, draft es null
export const createEventDraft = (text) => api.post('/events/draft', { text });

// Portada (P3): URL firmada para que el organizador suba la imagen; la ruta se envía luego como coverPath
export const requestCoverUpload = (contentType) => api.post('/events/cover-upload-url', { contentType });
