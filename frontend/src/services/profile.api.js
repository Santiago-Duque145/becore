import { api } from '../lib/api.js';

export const updateMe = (body) => api.patch('/me', body);

// Body: { role, interests[], days[], timeSlots[], motivations[], zone? } (api.md, Perfil)
export const completeOnboarding = (body) => api.put('/me/onboarding', body);

// Edita los gustos desde Perfil (mismo body sin role); responde como GET /me
export const updatePreferences = (body) => api.put('/me/preferences', body);

// Acepta la política de tratamiento de datos; sexo y rango de edad son opcionales (api.md, Perfil)
export const acceptConsent = (body) => api.put('/me/consent', body);

// Avatar (P3): pide una URL firmada, sube el archivo a Storage y confirma la ruta a la API
export const requestAvatarUpload = (contentType) => api.post('/me/avatar/upload-url', { contentType });
export const saveAvatarPhoto = (path) => api.put('/me/avatar', { path });
export const saveAvatarPreset = (preset) => api.put('/me/avatar-preset', { preset });
export const removeAvatar = () => api.delete('/me/avatar');
