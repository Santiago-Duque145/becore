import { api } from '../lib/api.js';

// Buscador de direcciones del formulario de evento (solo organizadores). Lo resuelve el backend con Nominatim.
export const searchPlaces = (q) => api.get('/geocode', { params: { q } });
