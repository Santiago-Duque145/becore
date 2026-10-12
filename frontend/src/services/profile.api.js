import { api } from '../lib/api.js';

export const updateMe = (body) => api.patch('/me', body);

// Body: { role, interests[], days[], timeSlots[], motivations[], zone? } (api.md, Perfil)
export const completeOnboarding = (body) => api.put('/me/onboarding', body);

// Edita los gustos desde Perfil (mismo body sin role); responde como GET /me
export const updatePreferences = (body) => api.put('/me/preferences', body);
