import { api } from '../lib/api.js';

export const updateMe = (body) => api.patch('/me', body);

// Body: { role, interests[], days[], timeSlots[], motivations[], zone? } (api.md, Perfil)
export const completeOnboarding = (body) => api.put('/me/onboarding', body);
