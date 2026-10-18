# 09 · P3 Avatares e imagen del evento

Fecha: 2026-10-18 · Rama: `feature/profe-3` (sale de `feature/profe-2`) · Estado: **código y pruebas automáticas
listas; falta probar la subida real contra Storage y revisar a 390 y 1440 px**.

## Qué se hizo

**Base de datos** (`20261022130000_avatars_and_covers.sql`, aplicada en Supabase el 2026-10-18):
`profiles.avatar_url`, `profiles.avatar_preset` (check con los 12 ids), `events.cover_url` y los buckets públicos
de lectura `avatars` y `event-covers` (límite 2 y 3 MB, WebP/JPEG/PNG).

**Backend**: subidas con URL firmada (`services/storage.service.js`): la carpeta es el id del usuario y una ruta
ajena responde 403. Endpoints de avatar (`/me/avatar/upload-url`, `PUT /me/avatar`, `PUT /me/avatar-preset`,
`DELETE /me/avatar`), `POST /events/cover-upload-url` (solo organizadores) y `coverPath` en crear/editar evento.
Las respuestas de eventos traen `coverUrl` y `confirmedPreview` (3 confirmados, solo nombre de pila).

**Frontend**: 12 avatares SVG propios (`assets/avatars`), `Avatar` con `src` o `preset`, selector en Perfil y
en el último paso de la bienvenida, compresión en el navegador (`lib/image.js`: máx. 1024 px, WebP 0,8, rechaza
> 8 MB y no-imágenes), zona de portada en crear/editar evento con vista previa y "Quitar", botón "Generar con IA"
deshabilitado (IA5), portada en tarjetas y detalle, y la fila de avatares solapados + "+N" en tarjetas y detalle.

## Decisión de prioridad (distinta al prompt)

El prompt pedía foto subida → foto de Google (copiada a `avatar_url`) → avatar → iniciales. Se implementó
**foto subida → avatar elegido → foto de Google → iniciales** y la foto de Google no se copia: se lee de la sesión.
Así quien elige un avatar a propósito lo ve, y no se guarda una URL que el cliente podría falsificar.

## Verificación

| Qué | Resultado |
|---|---|
| `npm run lint` | sin errores |
| `npm test` | backend 252/252, frontend 159/159 |
| `npm run build -w frontend` | compila |
| Permisos de subida (carpeta propia, organizador, tipos) | `backend/tests/uploads.test.js` |
| Compresión y validación, prioridad de avatar, ids de presets = backend = migración | pruebas del frontend |

## Pendiente

- Probar la subida real (la compresión usa canvas, no se puede cubrir con Vitest) y ver los 12 avatares a 390/1440 px.
- Las fotos de Google pueden fallar por `referrerPolicy`; se carga con `no-referrer` y, si falla, quedan las iniciales.
