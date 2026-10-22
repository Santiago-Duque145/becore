import { eventsQueryOptions } from '../hooks/useEvents.js';
import { recommendedQueryOptions } from '../hooks/useRecommendedEvents.js';
import { descubreRequest } from '../pages/descubre/descubre-filters.js';
import { queryClient } from './query-client.js';
import { supabase } from './supabase.js';

// Perf de Descubre (LCP). Al entrar directo a /descubre, la página se monta solo cuando llegó GET /me (ProtectedRoute),
// y recién ahí pedía la lista: la portada de la primera tarjeta quedaba detrás de tres viajes en serie.
// Aquí, al arrancar y con una sesión ya guardada, se empieza a bajar el código de la página y se piden la lista y
// "Para ti" en paralelo con /me, con las mismas claves de caché que usa la página. Sin sesión no se pide nada (un 401
// cerraría la sesión). No cambia qué se pide ni cómo se muestra: solo cuándo.
export function prefetchInitialRoute({ pathname, search }, deps = defaultDeps) {
  if (pathname !== '/descubre') return Promise.resolve(false);
  deps.loadPage();
  return deps.getSession().then((session) => {
    if (!session) return false;
    const { filters, showParaTi } = descubreRequest(new URLSearchParams(search));
    deps.prefetch(eventsQueryOptions(filters), 'infinite');
    if (showParaTi) deps.prefetch(recommendedQueryOptions());
    return true;
  });
}

const defaultDeps = {
  loadPage: () => import('../pages/descubre/DescubrePage.jsx'),
  getSession: async () => (await supabase.auth.getSession()).data.session,
  prefetch: (options, kind) =>
    kind === 'infinite' ? queryClient.prefetchInfiniteQuery(options) : queryClient.prefetchQuery(options),
};
