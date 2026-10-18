import axios from 'axios';
import { supabase } from './supabase.js';
import { shouldSignOut } from './session-errors.js';

export const api = axios.create({ baseURL: import.meta.env.VITE_API_URL });

api.interceptors.request.use(async (config) => {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res.data,
  async (error) => {
    const apiError = error.response?.data?.error ?? {
      code: 'NETWORK_ERROR',
      message: 'No hay conexión con el servidor',
    };
    if (shouldSignOut(error.response?.status, apiError.code)) await supabase.auth.signOut();
    return Promise.reject(apiError);
  },
);
