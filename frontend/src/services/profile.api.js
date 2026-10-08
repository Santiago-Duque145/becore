import { api } from '../lib/api.js';

export const updateMe = (body) => api.patch('/me', body);
