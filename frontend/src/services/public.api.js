import { api } from '../lib/api.js';

// { eventsThisWeek, confirmedPeople }: ruta pública, sin token (api.md, Sistema y perfil)
export const getPublicStats = () => api.get('/public/stats');
