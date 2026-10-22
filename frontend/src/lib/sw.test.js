import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { shouldRegisterServiceWorker } from './register-sw.js';

// Carga public/sw.js con un `self`, `caches` y `fetch` de mentira para revisar qué intercepta
const SOURCE = readFileSync(new URL('../../public/sw.js', import.meta.url), 'utf8');
const ORIGIN = 'https://demo.trycloudflare.com';
const INDEX_HTML =
  '<script type="module" crossorigin src="/assets/index-AbC123.js"></script><link rel="stylesheet" crossorigin href="/assets/index-XyZ789.css">';

function createCaches(initial = {}) {
  // Lo ya guardado vive en una caché anterior, como cuando el celular abre la app otro día
  const stores = new Map([['becore-shell-previa', new Map(Object.entries(initial))]]);
  const open = async (name) => {
    if (!stores.has(name)) stores.set(name, new Map());
    const store = stores.get(name);
    const key = (req) => (typeof req === 'string' ? req : new URL(req.url).pathname);
    return {
      addAll: async (urls) => urls.forEach((u) => store.set(u, new Response(u === '/' ? INDEX_HTML : u))),
      put: async (req, res) => store.set(key(req), res),
      match: async (req) => store.get(key(req))?.clone(),
    };
  };
  return {
    stores,
    open,
    keys: async () => [...stores.keys()],
    delete: async (name) => stores.delete(name),
    match: async (req) => {
      for (const name of stores.keys()) {
        const hit = await (await open(name)).match(req);
        if (hit) return hit;
      }
      return undefined;
    },
  };
}

function loadWorker({ fetchImpl, cachesImpl = createCaches() } = {}) {
  const listeners = {};
  const self = {
    location: new URL(ORIGIN),
    addEventListener: (type, fn) => (listeners[type] = fn),
    skipWaiting: vi.fn(async () => {}),
    clients: { claim: vi.fn(async () => {}) },
  };
  new Function('self', 'caches', 'fetch', SOURCE)(self, cachesImpl, fetchImpl ?? vi.fn());
  return { listeners, self, caches: cachesImpl };
}

function fetchEvent(path, { mode = 'cors', method = 'GET', origin = ORIGIN } = {}) {
  const event = { request: { url: `${origin}${path}`, mode, method }, respondWith: vi.fn() };
  return event;
}

describe('public/sw.js', () => {
  it('al instalarse guarda el shell y los JS/CSS que index.html carga de entrada', async () => {
    const { listeners, caches, self } = loadWorker();
    let done;
    listeners.install({ waitUntil: (p) => (done = p) });
    await done;
    const store = [...caches.stores.values()].at(-1);
    expect([...store.keys()]).toEqual(
      expect.arrayContaining(['/', '/offline.html', '/manifest.webmanifest', '/icons/icon-512.png', '/assets/index-AbC123.js', '/assets/index-XyZ789.css']),
    );
    expect(self.skipWaiting).toHaveBeenCalled();
  });

  it.each([
    ['la API', fetchEvent('/api/v1/events')],
    ['la API con navegación', fetchEvent('/api/v1/health', { mode: 'navigate' })],
    ['Supabase', fetchEvent('/rest/v1/events', { origin: 'https://abcd.supabase.co' })],
    ['Google Fonts', fetchEvent('/css2?family=Inter', { origin: 'https://fonts.googleapis.com' })],
    ['un POST', fetchEvent('/descubre', { method: 'POST' })],
  ])('nunca intercepta %s', (_name, event) => {
    const { listeners } = loadWorker();
    listeners.fetch(event);
    expect(event.respondWith).not.toHaveBeenCalled();
  });

  it('sin red, una navegación recibe la pantalla "Sin conexión"', async () => {
    const offline = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));
    const { listeners } = loadWorker({
      fetchImpl: offline,
      cachesImpl: createCaches({ '/offline.html': new Response('Sin conexión') }),
    });
    const event = fetchEvent('/descubre', { mode: 'navigate' });
    listeners.fetch(event);
    const response = await event.respondWith.mock.calls[0][0];
    expect(await response.text()).toBe('Sin conexión');
  });

  it('con red, la navegación va a la red y actualiza el shell guardado', async () => {
    const page = new Response('<html>nuevo</html>', { headers: { 'content-type': 'text/html' } });
    const { listeners, caches } = loadWorker({ fetchImpl: vi.fn().mockResolvedValue(page) });
    const event = fetchEvent('/mis-eventos', { mode: 'navigate' });
    listeners.fetch(event);
    expect(await (await event.respondWith.mock.calls[0][0]).text()).toBe('<html>nuevo</html>');
    expect(await (await caches.match('/')).text()).toBe('<html>nuevo</html>');
  });

  it('los archivos del shell salen primero de la caché', async () => {
    const network = vi.fn();
    const { listeners } = loadWorker({
      fetchImpl: network,
      cachesImpl: createCaches({ '/assets/index-AbC123.js': new Response('js guardado') }),
    });
    const event = fetchEvent('/assets/index-AbC123.js');
    listeners.fetch(event);
    expect(await (await event.respondWith.mock.calls[0][0]).text()).toBe('js guardado');
    expect(network).not.toHaveBeenCalled();
  });
});

describe('shouldRegisterServiceWorker', () => {
  it('solo registra en producción y en contexto seguro', () => {
    expect(shouldRegisterServiceWorker({ isProd: true, isSecureContext: true, hasServiceWorker: true })).toBe(true);
    expect(shouldRegisterServiceWorker({ isProd: false, isSecureContext: true, hasServiceWorker: true })).toBe(false);
    expect(shouldRegisterServiceWorker({ isProd: true, isSecureContext: false, hasServiceWorker: true })).toBe(false);
    expect(shouldRegisterServiceWorker({ isProd: true, isSecureContext: true, hasServiceWorker: false })).toBe(false);
  });
});
