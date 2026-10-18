# 11 · P4 Compartir y agregar al calendario

Fecha: 2026-10-18 · Rama: `feature/profe-4` (sale de `feature/fin-evento`) · Estado: **código y pruebas automáticas
listas; falta probarlo en un celular real** (Web Share API y descarga del .ics).

## Qué se hizo

- **Compartir** (`ShareEventButton`, en el detalle de eventos publicados o en curso): usa la Web Share API si el
  navegador la tiene; si no, abre un menú con **WhatsApp** (`wa.me` con "¡Vamos a {evento}! {fecha} en {lugar}.
  Confirma aquí: {enlace}") y **Copiar enlace**. El enlace usa `window.location.origin`, así que en la demo es el
  túnel HTTPS. Si el usuario cierra la hoja nativa no se muestra error.
- **Agregar a mi calendario** (`AddToCalendarButton`, solo para quien confirmó asistencia): **Google Calendar**
  (URL de render con fechas en UTC) y **archivo .ics** generado en el navegador (VEVENT con VTIMEZONE
  `America/Bogota`, textos escapados y líneas partidas a 75 caracteres). Sin `ends_at` el fin es inicio + 2 h,
  la misma regla del cron de estados.
- **Enlace compartido sin sesión:** `ProtectedRoute` ya guarda la ruta y el login vuelve al evento; no hizo falta
  cambiar nada.
- Nuevo `ExternalLinkButton` (enlace externo con aspecto de botón) e ícono de compartir. Sin librerías nuevas.

## Verificación

| Qué | Resultado |
|---|---|
| `npm run lint` | sin errores |
| `npm test` | backend 265/265, frontend 184/184 |
| `npm run build -w frontend` | compila |
| Fechas UTC/Bogotá (incluida la medianoche), URL de Google, estructura y escapes del .ics, nombre de archivo | `lib/calendar.test.js` |
| Texto de WhatsApp, enlace con el origen actual | `lib/share.test.js` |

## Pendiente

- En un celular: tocar "Compartir" (hoja nativa), abrir el WhatsApp generado, descargar el .ics y abrirlo en el
  calendario; comprobar que la hora cae bien en Bogotá. Revisar a 390 y 1440 px.
