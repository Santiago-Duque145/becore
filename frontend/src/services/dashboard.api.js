import { api } from '../lib/api.js';

// { upcomingEvents, pastEvents, upcomingAppointments } (api.md, Paneles)
export const getParticipantDashboard = () => api.get('/dashboard/participant');
