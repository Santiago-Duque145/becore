# 07 · M1 La app en el celular con HTTPS real (parcial)

Fecha: 2026-10-17 · Rama: `feature/m1-https` · Estado: **incompleto**. La sesión se cortó por presupuesto de tokens.

## Hecho

- `frontend/src/lib/qr.js`: codificador QR propio, sin librerías (modo byte UTF-8, nivel M, versiones 1 a 10, hasta 213 bytes, Reed-Solomon, 8 máscaras con penalización N1–N4). Devuelve `{ size, version, modules[y][x] }`. Sirve para la página `/compartir` (punto 3) y para imprimir el QR en la terminal desde `scripts/demo.js`.
- Prueba rápida: una URL de trycloudflare de 49 caracteres sale en versión 4 (33×33). **Todavía no se comprobó que un lector lo decodifique.**
- `npm run lint` y `npm test` pasan (backend 222, frontend 98).
- No se instalaron librerías. No se lanzaron procesos, así que no hay nada que cerrar.

## Pendiente (puntos del prompt M1 en docs/PLAN.md)

Diseño ya decidido, para que Santiago siga:

1. **`npm run demo`** (`scripts/demo.js` en la raíz y `"demo": "node scripts/demo.js"`):
   - comprobar que `cloudflared --version` responde (está en `C:\Program Files (x86)\cloudflared\`) y que existe `backend/.env` (se comprueba que exista, no se lee);
   - ejecutar `node node_modules/vite/bin/vite.js build` con cwd `frontend`, y luego `vite preview --port 4173 --strictPort`;
   - arrancar `cloudflared tunnel --no-autoupdate --url http://localhost:4173` y sacar la URL de su stderr con `/https:\/\/[a-z0-9-]+\.trycloudflare\.com/`;
   - arrancar el backend al final con `node --env-file=.env src/server.js` y `APP_URL` en `env` (la variable del proceso tiene prioridad sobre `--env-file`; conviene confirmarlo);
   - consultar `/api/v1/health` y luego imprimir la URL en un recuadro y el QR con medios bloques;
   - al recibir SIGINT o SIGBREAK, o si muere un hijo, cerrar todo con `taskkill /PID <pid> /T /F`.
2. **`vite.config.js`**: `allowedHosts: ['.trycloudflare.com']` en `server` y en `preview`. `preview` con `host: true`, puerto 4173 y el mismo proxy `/api → http://localhost:3000`.
3. **`/compartir`** (solo para organizadores, con `organizerOnly` en `router.jsx`): `QrCode.jsx` en SVG con `fill-ink` de fondo y `fill-bg` para los módulos, 4 módulos de margen y `role="img"`. Debajo, el enlace `window.location.origin` y el botón "Copiar enlace". Si se abre desde localhost, mostrar un aviso. Agregar la entrada en `SIDEBAR_LINKS` y en `MOBILE_HEADER_ACTIONS.organizer`, con un ícono QR nuevo.
4. **Service worker**: `public/sw.js` y `public/offline.html` ("Sin conexión" con el botón "Reintentar").
   - Las navegaciones van primero a la red y, si no hay conexión, se sirve `offline.html`. Los archivos del shell salen primero de la caché.
   - Nunca se tocan `/api` ni otros orígenes (Supabase, Fonts).
   - En `vite.config.js`, un plugin pequeño inyecta en `dist/sw.js` la lista de JS y CSS del bundle y una versión.
   - Se registra solo si `import.meta.env.PROD && isSecureContext`.
   - ESLint necesita `globals.serviceworker` para `public/sw.js`. Hay que actualizar `frontend/CLAUDE.md` §6, que hoy dice que no hay service worker.
5. **`useGeolocation`**: la lógica pura va en `lib/geo.js` (haversine, `canUseGeolocation`, el promise de `getCurrentPosition` y los mensajes de error) con tests. El hook expone `status`, `position` y `request()`. `NearMeButton` se oculta si `!isSecureContext`. En `/privacidad` falta la sección "Tu ubicación": se usa solo en el navegador, nunca se envía ni se guarda.
6. **APP_URL**: en `backend/src/config/env.js`, opcional, con el string vacío convertido a `undefined`. Usarla en `mail/templates.js` para el enlace del evento, con `FRONTEND_URL` como respaldo, y su test. Actualizar el comentario en `.env.example`.
7. **README**: sección del modo demo (la URL cambia en cada arranque, el QR y el plan B por IP en la misma Wi-Fi).
8. **Verificación**:
   - con un navegador: curl a la URL https, al shell y a `/api/v1/health`; el service worker registrado y la pantalla offline en Edge headless;
   - el QR decodificado con jsQR desde la carpeta temporal.

## Pruebas manuales en el celular (ninguna hecha)

Por datos móviles: login con correo y con Google, onboarding, confirmar asistencia, "Instalar app" en Chrome Android, "Agregar a inicio" en iPhone y abrir a pantalla completa, y abrir sin conexión para ver la pantalla offline.
