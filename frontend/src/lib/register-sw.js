// Registro del service worker (M1). Solo en el build de producción (en `vite dev` estorbaría la recarga
// en caliente) y en contexto seguro: https (modo demo con el túnel) o localhost. Por http://IP-de-la-Wi-Fi
// el navegador no lo permite, y ahí la app sigue funcionando igual, solo que sin pantalla offline.
export function shouldRegisterServiceWorker({ isProd, isSecureContext, hasServiceWorker }) {
  return Boolean(isProd && isSecureContext && hasServiceWorker);
}

export function registerServiceWorker() {
  const ok = shouldRegisterServiceWorker({
    isProd: import.meta.env.PROD,
    isSecureContext: window.isSecureContext,
    hasServiceWorker: 'serviceWorker' in navigator,
  });
  if (!ok) return;
  // Después de "load" para no competir con la primera carga de la app
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Sin service worker la app funciona igual (solo pierde la pantalla offline): no se avisa al usuario
    });
  });
}
