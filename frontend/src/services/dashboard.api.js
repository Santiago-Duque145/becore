import { api } from '../lib/api.js';

// { upcomingEvents, pastEvents, upcomingAppointments } (api.md, Paneles)
export const getParticipantDashboard = () => api.get('/dashboard/participant');

// { totals, events } (api.md, Paneles)
export const getOrganizerDashboard = () => api.get('/dashboard/organizer');
