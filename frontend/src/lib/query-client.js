import { QueryClient } from '@tanstack/react-query';

// Único QueryClient de la app. Vive aparte de main.jsx para que la precarga del arranque (startup-prefetch.js) llene
// la misma caché que luego leen las páginas.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});
