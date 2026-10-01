# frontend/CLAUDE.md — React de Be Core

Complementa el `CLAUDE.md` de la raíz. Aplica a todo lo que esté dentro de `frontend/`.
Rutas, pantallas y textos: `docs/specs/ui.md`. Endpoints que consume: `docs/specs/api.md`.

## 1. Estructura

```
frontend/
├── index.html
├── vite.config.js
├── .env.example
└── src/
    ├── main.jsx                 ← QueryClientProvider, AuthProvider, RouterProvider, Toaster
    ├── router.jsx               ← todas las rutas (ver ui.md §2)
    ├── index.css                ← Tailwind 4 + tokens de marca (@theme)
    ├── lib/
    │   ├── supabase.js          ← cliente con publishable key (Auth + Realtime)
    │   ├── api.js               ← instancia Axios con interceptores
    │   ├── format.js            ← fechas, categorías, plurales
    │   └── query-keys.js        ← claves de TanStack Query centralizadas
    ├── contexts/
    │   └── AuthContext.jsx
    ├── hooks/                   ← useEvents, useEvent, useConfirmAttendance, useRealtimeEvent, ...
    ├── services/                ← funciones que llaman a la API (events.api.js, ...)
    ├── components/
    │   ├── ui/                  ← Button, Input, Select, Card, Badge, Modal, Spinner, EmptyState
    │   ├── layout/              ← AppShell, Navbar, ProtectedRoute, RoleRoute
    │   └── events/ ...          ← componentes por módulo
    └── pages/                   ← una carpeta o archivo por ruta
```

## 2. Variables de entorno (`frontend/.env.example`)

```
VITE_API_URL=/api/v1
VITE_SUPABASE_URL=https://xxxxxxxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxxxxxx
```

Nunca pongas la secret key aquí: todo lo que empieza por `VITE_` termina en el navegador.

La API se consume por la **ruta relativa** `/api/v1` y Vite la reenvía al backend. Así la app funciona igual
en `localhost` y cuando los amigos entran desde su celular por la red Wi-Fi (`http://IP-del-portátil:5173`).
`vite.config.js` debe quedar así:

```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true,          // expone en la red local para probar desde celulares
    port: 5173,
    proxy: { '/api': 'http://localhost:3000' },
  },
});
```

## 3. Instalación inicial (S0-05)

`frontend/` ya existe con un `package.json` mínimo creado en S0-01. Desde la **raíz** del repo:

```bash
npm create vite@latest frontend-tmp -- --template react
# mover el contenido de frontend-tmp/ a frontend/ (reemplazando su package.json),
# conservar "name": "frontend", "type": "module" y agregar scripts "lint": "eslint ." y "test": "vitest run --passWithNoTests"
# borrar frontend-tmp/
npm i react@18.3.1 react-dom@18.3.1 -w frontend
npm i react-router @tanstack/react-query axios @supabase/supabase-js react-hook-form @hookform/resolvers zod lucide-react sonner -w frontend
npm i -D tailwindcss @tailwindcss/vite vitest -w frontend
```

Las dependencias siempre se instalan desde la raíz con `-w frontend` (o `-w backend`), nunca con
`cd frontend && npm i`, para que exista un solo `package-lock.json` en la raíz.

Tailwind **4**: no hay `tailwind.config.js` ni `postcss.config.js`. Se agrega el plugin `@tailwindcss/vite`
en `vite.config.js` y en `src/index.css` va `@import "tailwindcss";` seguido del bloque `@theme` de `ui.md` §3.
React Router **7**: se importa desde `react-router` (no `react-router-dom`) y se usa `createBrowserRouter`.

## 4. Patrones obligatorios

### 4.1 Cliente Supabase — `src/lib/supabase.js`

```js
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
);
```

Solo se usa para: `auth.signUp`, `auth.signInWithPassword`, `auth.signOut`, `auth.getSession`,
`auth.onAuthStateChange` y `channel(...)` de Realtime. **Prohibido** `supabase.from(...)` en el frontend.

### 4.2 Axios — `src/lib/api.js`

```js
import axios from 'axios';
import { supabase } from './supabase.js';

export const api = axios.create({ baseURL: import.meta.env.VITE_API_URL });

api.interceptors.request.use(async (config) => {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res.data,               // los servicios reciben { data, meta? }
  async (error) => {
    if (error.response?.status === 401) await supabase.auth.signOut();
    const apiError = error.response?.data?.error ?? { code: 'NETWORK_ERROR', message: 'No hay conexión con el servidor' };
    return Promise.reject(apiError); // { code, message, details? }
  },
);
```

### 4.3 Autenticación — `src/contexts/AuthContext.jsx`

- Estado: `session`, `profile` (de `GET /me`), `loading`.
- Al montar: `supabase.auth.getSession()` y suscripción a `onAuthStateChange`. Cuando hay sesión, pide `GET /me`.
- `signUp({ fullName, email, password, role })` →
  `supabase.auth.signUp({ email, password, options: { data: { full_name: fullName, role } } })`.
  La confirmación de correo está **desactivada** en Supabase, así que devuelve sesión de inmediato.
- `signIn({ email, password })` → `supabase.auth.signInWithPassword(...)`.
- `signOut()` → `supabase.auth.signOut()` y `queryClient.clear()`.
- Traduce los errores de Supabase Auth al español (tabla en `ui.md` §5). Nunca muestres mensajes en inglés.
- El rol para decidir qué mostrar sale de `profile.role`, nunca de `session.user.user_metadata`.

### 4.4 Datos

- Toda llamada a la API vive en `src/services/*.api.js` y se consume con hooks de TanStack Query en `src/hooks/`.
- Las páginas no llaman a Axios directamente.
- Después de una mutación, invalida las claves afectadas definidas en `query-keys.js`.
- Muestra errores con `toast.error(error.message)` de `sonner`; éxitos con `toast.success(...)`.
- Cada lista tiene tres estados diseñados: cargando (skeleton), vacío (`EmptyState` con acción) y error.

### 4.5 Realtime

```js
const channel = supabase
  .channel(`event-${eventId}`)
  .on('postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'events', filter: `id=eq.${eventId}` },
      (payload) => { /* actualizar confirmedCount en la caché de TanStack Query */ })
  .subscribe();
return () => supabase.removeChannel(channel);
```

Siempre dentro de un `useEffect` con limpieza. El payload llega en snake_case (`confirmed_count`).

### 4.6 Formularios

`react-hook-form` + `zodResolver`. Los esquemas del frontend replican los límites de `docs/specs/api.md`
(misma longitud mínima/máxima) para avisar antes de enviar; el backend sigue siendo la validación real.

## 5. Estilo y UI

- Mobile-first: diseña a 390 px y amplía con `md:` y `lg:`. Debe verse bien a 1440 px.
- Usa solo los tokens de `ui.md` §3. No inventes colores ni fuentes.
- Botones y enlaces con estado de foco visible. Imágenes con `alt`. Formularios con `<label>`.
- Iconos de `lucide-react`. Nada de emojis en la interfaz.
- Confirmar asistencia debe tomar **3 toques o menos** desde el listado (RNF-01).

## 6. App instalable en iPhone (PWA)

Se instala desde Safari → Compartir → "Agregar a pantalla de inicio". No se usa service worker, modo
offline, push ni ninguna librería adicional (`vite-plugin-pwa` u otra).

### Manifiesto — `frontend/public/manifest.webmanifest`

```json
{
  "name": "Be Core",
  "short_name": "Be Core",
  "description": "Tu comunidad en movimiento",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#0D1B2A",
  "theme_color": "#0D1B2A",
  "lang": "es-CO",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icons/icon-512-maskable.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

### `<head>` de `index.html`

```html
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
  <meta name="theme-color" content="#0D1B2A" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-title" content="Be Core" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  <link rel="manifest" href="/manifest.webmanifest" />
  <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
  <link rel="icon" type="image/svg+xml" href="/icons/favicon.svg" />
  <title>Be Core</title>
</head>
```

### Íconos — `frontend/public/icons/`

- `favicon.svg`: letra "B" blanca en Poppins sobre cuadrado `#0D1B2A` con esquinas redondeadas y una
  barra diagonal `#14B8A6` (crea el SVG directamente).
- `icon-192.png`, `icon-512.png`, `icon-512-maskable.png`, `apple-touch-icon.png`: los exporta el
  equipo desde el logo oficial; mientras no existan, los `<link>` ya apuntan a ellos y Safari los
  pedirá cuando el usuario intente instalar la app.

### CSS obligatorio — agregar en `src/index.css`

```css
html,
body,
#root {
  min-height: 100dvh; /* nunca 100vh */
}

body {
  background-color: theme(--color-navy-900);
  -webkit-tap-highlight-color: transparent;
  overscroll-behavior-y: none;
}

input,
select,
textarea {
  font-size: 16px; /* evita zoom automático en iOS */
}
```

- Header fijo: `padding-top: env(safe-area-inset-top)`.
- Barra de navegación inferior: `padding-bottom: env(safe-area-inset-bottom)`; el contenido principal
  deja margen inferior igual a la altura de la navbar más `env(safe-area-inset-bottom)`.
- Elementos táctiles: mínimo `44 × 44 px`.

### Cómo probar

1. `npm run dev` en la raíz.
2. En el iPhone, abrir la URL **Network** que imprime Vite (p. ej. `http://192.168.1.X:5173`).
3. Safari → Compartir → "Agregar a pantalla de inicio" → verificar que muestra el ícono y "Be Core".
4. Abrir la app desde el ícono e iniciar sesión de nuevo (la sesión no se comparte con Safari).
