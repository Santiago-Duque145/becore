// Service worker propio y mínimo de Be Core (M1, sin librerías). Solo se registra en producción y en
// contexto seguro (src/lib/register-sw.js).
// - Guarda el shell: HTML, JS y CSS del build (se leen de index.html al instalar), manifiesto e íconos.
// - Navegaciones: primero la red; sin conexión se muestra /offline.html.
// - Archivos del shell: primero la caché (los de /assets llevan hash, así que nunca quedan viejos).
// - Nunca toca /api ni otros orígenes (Supabase, Google Fonts): esas peticiones van directo a la red.
// Si cambias este archivo, sube VERSION para que los celulares descarguen el nuevo.
const VERSION = 'v2';
const CACHE = `becore-shell-${VERSION}`;
const OFFLINE_URL = '/offline.html';
const SHELL = [
  '/',
  OFFLINE_URL,
  '/manifest.webmanifest',
  '/icons/favicon.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/apple-touch-icon.png',
];

// JS y CSS que index.html carga de entrada (el resto de páginas se guarda al visitarlas)
function bundleAssets(html) {
  const found = html.match(/\/assets\/[^"'\s>]+\.(?:js|css)/g) ?? [];
  return [...new Set(found)];
}

async function precache() {
  const cache = await caches.open(CACHE);
  await cache.addAll(SHELL);
  const index = await cache.match('/');
  if (index) await cache.addAll(bundleAssets(await index.text()));
}

async function cleanOldCaches() {
  const keys = await caches.keys();
  await Promise.all(keys.filter((key) => key.startsWith('becore-shell-') && key !== CACHE).map((key) => caches.delete(key)));
}

function isShellRequest(url) {
  return url.origin === self.location.origin && !url.pathname.startsWith('/api/') && url.pathname !== '/api';
}

async function networkFirstPage(request) {
  try {
    const response = await fetch(request);
    if (response.ok && response.headers.get('content-type')?.includes('text/html') && new URL(request.url).pathname !== OFFLINE_URL) {
      // Todas las rutas de la SPA devuelven el mismo index.html: se guarda como "/"
      const cache = await caches.open(CACHE);
      await cache.put('/', response.clone());
    }
    return response;
  } catch {
    return (await caches.match(OFFLINE_URL)) ?? Response.error();
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok && response.type === 'basic') {
    const cache = await caches.open(CACHE);
    await cache.put(request, response.clone());
  }
  return response;
}

self.addEventListener('install', (event) => {
  event.waitUntil(precache().then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(cleanOldCaches().then(() => self.clients.claim()));
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (!isShellRequest(url)) return;
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstPage(request));
    return;
  }
  event.respondWith(cacheFirst(request));
});
